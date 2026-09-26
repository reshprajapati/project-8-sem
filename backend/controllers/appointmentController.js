const Appointment = require('../db/Appointment');
const User = require('../db/User');
const CoverageRequest = require('../db/CoverageRequest');
const {
  normalizeSlot,
  sortSlots,
  hasSlot,
  reserveSlot,
  releaseSlot,
  hasBookingAt,
  isFutureSlot,
  getDesignerAvailability,
  hasCompleteLocation,
  toDateKey
} = require('../utils/schedule');
const { byNewest, byChronological } = require('../algorithms');

const populateUser = async (userId, fields = []) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const result = { _id: user._id, name: user.name };
  if (fields.includes('email')) result.email = user.email;
  if (fields.includes('phone')) result.phone = user.phone;
  if (fields.includes('profileImage')) result.profileImage = user.profileImage;
  if (fields.includes('specialization')) result.specialization = user.specialization;

  return result;
};

const addAvailabilitySlot = async (designerId, slot) => {
  const normalizedSlot = normalizeSlot(slot);
  if (!normalizedSlot) {
    return;
  }

  const designer = await User.findById(designerId);
  if (!designer) {
    return;
  }

  // RELEASE the slot back onto the calendar, sorted and deduplicated.
  await User.findByIdAndUpdate(designerId, {
    availability: releaseSlot(getDesignerAvailability(designer), normalizedSlot)
  });
};

class AppointmentController {
  async createAppointment(req, res) {
    try {
      const {
        designerId,
        appointmentTime,
        location,
        surfaceArea,
        budget,
        description,
        designId,
        designTitle
      } = req.body;

      if (!designerId || !appointmentTime || !surfaceArea || !hasCompleteLocation(location)) {
        return res.status(400).json({
          success: false,
          message: 'Missing required booking information'
        });
      }

      const designer = await User.findById(designerId);
      if (!designer || designer.role !== 'designer') {
        return res.status(404).json({
          success: false,
          message: 'Designer not found'
        });
      }

      const normalizedAppointmentTime = normalizeSlot(appointmentTime);
      if (!normalizedAppointmentTime) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid appointment time'
        });
      }

      // getDesignerAvailability returns a sorted array, so this membership
      // test is a binary search: O(log n) rather than Array.includes' O(n).
      const availableSlots = getDesignerAvailability(designer);
      if (!hasSlot(availableSlots, normalizedAppointmentTime)) {
        return res.status(400).json({
          success: false,
          message: 'Selected time slot is no longer available'
        });
      }

      // CONFLICT DETECTION — linear scan with early exit. Appointments are
      // not stored in time order, so binary search does not apply here.
      const existingAppointments = await Appointment.find({ designerId });
      const hasConflict = hasBookingAt(existingAppointments, normalizedAppointmentTime);

      if (hasConflict) {
        return res.status(409).json({
          success: false,
          message: 'This time slot has already been booked'
        });
      }

      const appointment = await Appointment.create({
        userId: req.userId,
        designerId,
        appointmentTime: normalizedAppointmentTime,
        location,
        surfaceArea,
        budget: Number(budget) || 0,
        description: description || '',
        designId: designId || null,
        designTitle: designTitle || '',
        status: 'pending'
      });

      // RESERVE the slot: the booking and the calendar update are paired.
      await User.findByIdAndUpdate(designerId, {
        availability: reserveSlot(availableSlots, normalizedAppointmentTime)
      });

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        appointment
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async getAppointments(req, res) {
    try {
      const query =
        req.userRole === 'designer'
          ? { designerId: req.userId }
          : { userId: req.userId };

      const appointments = await Appointment.find(query);

      const populatedAppointments = await Promise.all(appointments.map(async (apt) => {
        const userData =
          req.userRole === 'designer'
            ? await populateUser(apt.userId, ['name', 'email', 'phone', 'profileImage'])
            : await populateUser(apt.designerId, ['name', 'email', 'phone', 'profileImage', 'specialization']);

        return {
          ...apt,
          userId: req.userRole === 'designer' ? userData : apt.userId,
          designerId: req.userRole === 'user' ? userData : apt.designerId
        };
      }));

      populatedAppointments.sort((a, b) => byChronological(a.appointmentTime, b.appointmentTime));

      res.status(200).json({
        success: true,
        count: populatedAppointments.length,
        appointments: populatedAppointments
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async getAppointment(req, res) {
    try {
      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      const userPopulated = await populateUser(appointment.userId, ['name', 'email', 'phone']);
      const designerPopulated = await populateUser(appointment.designerId, ['name', 'email', 'phone', 'specialization']);

      res.status(200).json({
        success: true,
        appointment: {
          ...appointment,
          userId: userPopulated,
          designerId: designerPopulated
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async updateAppointment(req, res) {
    try {
      let appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      if (appointment.userId !== req.userId &&
          appointment.designerId !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this appointment'
        });
      }

      const updates = { ...req.body };
      delete updates.userId;
      delete updates.designerId;
      delete updates.createdAt;
      delete updates.updatedAt;
      delete updates.fieldVisitTime;

      if (req.userRole !== 'designer') {
        delete updates.status;
        delete updates.notes;
      }

      if (updates.location !== undefined && !hasCompleteLocation(updates.location)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a complete location'
        });
      }

      if (updates.budget !== undefined) {
        updates.budget = Number(updates.budget) || 0;
      }

      if (updates.appointmentTime !== undefined) {
        const currentAppointmentTime = normalizeSlot(appointment.appointmentTime);
        const nextAppointmentTime = normalizeSlot(updates.appointmentTime);

        if (!nextAppointmentTime) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid appointment time'
          });
        }

        if (currentAppointmentTime !== nextAppointmentTime) {
          const designer = await User.findById(appointment.designerId);
          const availableSlots = getDesignerAvailability(designer);
          const allAppointments = await Appointment.find({ designerId: appointment.designerId });

          // excludeId: an appointment must not conflict with itself.
          const hasConflict = hasBookingAt(allAppointments, nextAppointmentTime, appointment._id);

          if (!hasSlot(availableSlots, nextAppointmentTime) || hasConflict) {
            return res.status(400).json({
              success: false,
              message: 'Selected time slot is no longer available'
            });
          }

          const nextAvailability = availableSlots.filter(slot => slot !== nextAppointmentTime);
          if (currentAppointmentTime && isFutureSlot(currentAppointmentTime)) {
            nextAvailability.push(currentAppointmentTime);
          }

          await User.findByIdAndUpdate(appointment.designerId, {
            availability: sortSlots(nextAvailability)
          });
        }

        updates.appointmentTime = nextAppointmentTime;
      }

      appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        updates
      );

      res.status(200).json({
        success: true,
        message: 'Appointment updated successfully',
        appointment
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async cancelAppointment(req, res) {
    try {
      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      if (appointment.userId !== req.userId &&
          appointment.designerId !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this appointment'
        });
      }

      if (appointment.status === 'cancelled') {
        return res.status(200).json({
          success: true,
          message: 'Appointment is already cancelled',
          appointment
        });
      }

      const normalizedAppointmentTime = normalizeSlot(appointment.appointmentTime);
      if (normalizedAppointmentTime && isFutureSlot(normalizedAppointmentTime)) {
        await addAvailabilitySlot(appointment.designerId, normalizedAppointmentTime);
      }

      const updated = await Appointment.findByIdAndUpdate(req.params.id, {
        status: 'cancelled'
      });

      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment: updated
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  /**
   * Raised when a client wants a day the designer cannot take. The request
   * goes into the admin queue instead of becoming an appointment; an admin
   * appoints a covering designer from there.
   */
  async createCoverageRequest(req, res) {
    try {
      const {
        designerId,
        requestedDate,
        location,
        surfaceArea,
        budget,
        description,
        designId,
        designTitle
      } = req.body;

      if (!designerId || !requestedDate || !surfaceArea || !hasCompleteLocation(location)) {
        return res.status(400).json({
          success: false,
          message: 'Missing required booking information'
        });
      }

      const designer = await User.findById(designerId);
      if (!designer || designer.role !== 'designer') {
        return res.status(404).json({
          success: false,
          message: 'Designer not found'
        });
      }

      const normalizedDate = normalizeSlot(requestedDate);
      if (!normalizedDate || !isFutureSlot(normalizedDate)) {
        return res.status(400).json({
          success: false,
          message: 'Please choose a future date for your request'
        });
      }

      const requestedDateKey = toDateKey(normalizedDate);

      // If the designer is actually free that day, the client should just book.
      const openOnDay = getDesignerAvailability(designer)
        .filter(slot => toDateKey(slot) === requestedDateKey);

      if (openOnDay.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'This designer still has open times on that day. Please pick one from the calendar.'
        });
      }

      const existingRequests = await CoverageRequest.find({ userId: req.userId });
      const duplicate = existsWhere(existingRequests, request => {
        return request.status === 'pending' &&
          request.requestedDesignerId === designerId &&
          toDateKey(request.requestedDate) === requestedDateKey;
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'You already have a pending request for this designer on that date'
        });
      }

      const coverageRequest = await CoverageRequest.create({
        userId: req.userId,
        requestedDesignerId: designerId,
        requestedDate: normalizedDate,
        location,
        surfaceArea,
        budget: Number(budget) || 0,
        description: description || '',
        designId: designId || null,
        designTitle: designTitle || ''
      });

      res.status(201).json({
        success: true,
        message: 'That day is fully booked, so your request went to the studio admin. They will appoint an available designer for you.',
        request: coverageRequest
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getMyCoverageRequests(req, res) {
    try {
      const requests = await CoverageRequest.find({ userId: req.userId });

      const populated = await Promise.all(requests.map(async (request) => {
        const requestedDesigner = await User.findById(request.requestedDesignerId);
        const assignedDesigner = request.assignedDesignerId
          ? await User.findById(request.assignedDesignerId)
          : null;

        return {
          ...request,
          requestedDesignerName: requestedDesigner?.name || 'Unknown designer',
          assignedDesignerName: assignedDesigner?.name || null
        };
      }));

      populated.sort(byNewest);

      res.status(200).json({
        success: true,
        count: populated.length,
        requests: populated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async setFieldVisitTime(req, res) {
    try {
      const { fieldVisitTime } = req.body;
      const normalizedFieldVisitTime = normalizeSlot(fieldVisitTime);

      if (!normalizedFieldVisitTime) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid field visit time'
        });
      }

      let appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      if (appointment.designerId !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only assigned designer can set visit time'
        });
      }

      appointment = await Appointment.findByIdAndUpdate(req.params.id, {
        fieldVisitTime: normalizedFieldVisitTime,
        status: 'confirmed'
      });

      res.status(200).json({
        success: true,
        message: 'Field visit time set successfully',
        appointment
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
}

module.exports = new AppointmentController();
