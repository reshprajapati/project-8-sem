const Appointment = require('../db/Appointment');
const User = require('../db/User');

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

const normalizeSlot = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const sortSlots = (slots = []) => {
  return [...new Set(slots)].sort((a, b) => new Date(a) - new Date(b));
};

const getDesignerAvailability = (designer) => {
  return sortSlots(Array.isArray(designer?.availability) ? designer.availability : []);
};

const isFutureSlot = (slot) => {
  const date = new Date(slot);
  return !Number.isNaN(date.getTime()) && date > new Date();
};

const hasCompleteLocation = (location) => {
  if (!location || typeof location !== 'object') {
    return false;
  }

  return ['street', 'city', 'state', 'zipCode', 'country'].every(field => {
    return typeof location[field] === 'string' && location[field].trim() !== '';
  });
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

  await User.findByIdAndUpdate(designerId, {
    availability: sortSlots([...getDesignerAvailability(designer), normalizedSlot])
  });
};

// Create appointment
exports.createAppointment = async (req, res) => {
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

    const availableSlots = getDesignerAvailability(designer);
    if (!availableSlots.includes(normalizedAppointmentTime)) {
      return res.status(400).json({
        success: false,
        message: 'Selected time slot is no longer available'
      });
    }

    const existingAppointments = await Appointment.find({ designerId });
    const hasConflict = existingAppointments.some(appointment => {
      return (
        appointment.status !== 'cancelled' &&
        normalizeSlot(appointment.appointmentTime) === normalizedAppointmentTime
      );
    });

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

    await User.findByIdAndUpdate(designerId, {
      availability: availableSlots.filter(slot => slot !== normalizedAppointmentTime)
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
};

// Get all appointments for user/designer
exports.getAppointments = async (req, res) => {
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

    populatedAppointments.sort((a, b) =>
      new Date(a.appointmentTime) - new Date(b.appointmentTime)
    );

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
};

// Get single appointment
exports.getAppointment = async (req, res) => {
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
};

// Update appointment
exports.updateAppointment = async (req, res) => {
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

        const hasConflict = allAppointments.some(existingAppointment => {
          return (
            existingAppointment._id !== appointment._id &&
            existingAppointment.status !== 'cancelled' &&
            normalizeSlot(existingAppointment.appointmentTime) === nextAppointmentTime
          );
        });

        if (!availableSlots.includes(nextAppointmentTime) || hasConflict) {
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
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
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
};

// Set field visit time (for designer)
exports.setFieldVisitTime = async (req, res) => {
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
};
