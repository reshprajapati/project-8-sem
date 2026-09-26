const User = require('../db/User');
const Appointment = require('../db/Appointment');
const Design = require('../db/Design');
const CoverageRequest = require('../db/CoverageRequest');
const Project = require('../db/Project');
const { canTransition, withHistory, isOpenProject } = require('../utils/projectStatus');
const {
  normalizeSlot,
  sortSlots,
  isFutureSlot,
  getDesignerAvailability,
  toDateKey,
  isActiveAppointment,
  buildDaySummary,
  conflictingSlots,
  hasBookingAt,
  firstOpenSlotOnDay,
  scoreDesignerForDay,
  canTakeWorkOnDay
} = require('../utils/schedule');
const { sortByName, byNewest, rankDesignersByFitness, existsWhere } = require('../algorithms');

const sanitizeUser = (user) => {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
};

const briefUser = async (userId, fields = ['name', 'email', 'phone']) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const brief = { _id: user._id, name: user.name };
  fields.forEach(field => {
    if (field !== 'name') brief[field] = user[field];
  });

  return brief;
};

/**
 * Everything the admin console needs to reason about one designer:
 * open slots, live bookings, and which days are already packed.
 */
const buildDesignerLoad = async (designer) => {
  const availability = getDesignerAvailability(designer);
  const appointments = await Appointment.find({ designerId: designer._id });
  const liveAppointments = appointments.filter(isActiveAppointment);

  return {
    ...sanitizeUser(designer),
    availability,
    openSlots: availability.length,
    bookedCount: liveAppointments.length,
    days: buildDaySummary(availability, appointments)
  };
};

class AdminController {
  // ---------------------------------------------------------------- overview

  async getOverview(req, res) {
    try {
      const designers = await User.find({ role: 'designer' });
      const clients = await User.find({ role: 'user' });
      const appointments = await Appointment.find();
      const requests = await CoverageRequest.find();
      const designs = await Design.find();
      const projects = await Project.find();

      const openSlots = designers.reduce((total, designer) => {
        return total + getDesignerAvailability(designer).length;
      }, 0);

      res.status(200).json({
        success: true,
        overview: {
          designers: designers.length,
          clients: clients.length,
          openSlots,
          appointments: appointments.filter(isActiveAppointment).length,
          cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
          pendingRequests: requests.filter(r => r.status === 'pending').length,
          designs: designs.length,
          newRequests: projects.filter(p => p.status === 'requested').length,
          activeProjects: projects.filter(p => ['assigned', 'in-progress'].includes(p.status)).length,
          awaitingApproval: projects.filter(p => p.status === 'submitted').length,
          approvedProjects: projects.filter(p => p.status === 'approved').length
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // --------------------------------------------------------------- designers

  async getDesigners(req, res) {
    try {
      const designers = await User.find({ role: 'designer' });
      const loaded = await Promise.all(designers.map(buildDesignerLoad));

      const ordered = sortByName(loaded);

      res.status(200).json({
        success: true,
        count: ordered.length,
        designers: ordered
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async createDesigner(req, res) {
    try {
      const { name, email, password, phone, specialization, experience, bio } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a name, email, and password for the designer'
        });
      }

      if (String(password).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'That email is already registered'
        });
      }

      const designer = await User.create({
        name,
        email,
        password,
        phone: phone || '',
        role: 'designer',
        specialization: specialization || '',
        experience: Number(experience) || 0,
        bio: bio || '',
        availability: []
      });

      res.status(201).json({
        success: true,
        message: 'Designer added successfully',
        designer: sanitizeUser(designer)
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Removing a designer is refused while they still hold live bookings, so a
   * client can never be left attached to an account that no longer exists.
   * Reassign or cancel those first. Their portfolio goes with them, and any
   * coverage request still waiting on them is declined.
   */
  async deleteDesigner(req, res) {
    try {
      const designer = await User.findById(req.params.id);

      if (!designer || designer.role !== 'designer') {
        return res.status(404).json({ success: false, message: 'Designer not found' });
      }

      const appointments = await Appointment.find({ designerId: designer._id });
      const liveBookings = appointments.filter(appointment => {
        return isActiveAppointment(appointment) && isFutureSlot(appointment.appointmentTime);
      });

      if (liveBookings.length > 0) {
        return res.status(409).json({
          success: false,
          message: `${designer.name} still has ${liveBookings.length} upcoming booking${liveBookings.length === 1 ? '' : 's'}. Cancel or reassign them before removing this designer.`,
          liveBookings: liveBookings.length
        });
      }

      const designs = await Design.find({ designerId: designer._id });
      for (const design of designs) {
        await Design.findByIdAndDelete(design._id);
      }

      const requests = await CoverageRequest.find({ requestedDesignerId: designer._id });
      const pendingRequests = requests.filter(request => request.status === 'pending');
      for (const request of pendingRequests) {
        await CoverageRequest.findByIdAndUpdate(request._id, {
          status: 'declined',
          adminNote: 'Declined automatically: the requested designer was removed.'
        });
      }

      await User.findByIdAndDelete(designer._id);

      res.status(200).json({
        success: true,
        message: `${designer.name} was removed.`,
        removed: {
          designs: designs.length,
          declinedRequests: pendingRequests.length,
          pastAppointments: appointments.length - liveBookings.length
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * The admin owns every calendar. Designers only read what lands here.
   */
  async updateDesignerAvailability(req, res) {
    try {
      const { availability } = req.body;

      if (!Array.isArray(availability)) {
        return res.status(400).json({
          success: false,
          message: 'Availability must be an array of date-time values'
        });
      }

      const designer = await User.findById(req.params.id);
      if (!designer || designer.role !== 'designer') {
        return res.status(404).json({ success: false, message: 'Designer not found' });
      }

      const normalized = sortSlots(
        availability.map(normalizeSlot).filter(Boolean)
      );

      const appointments = await Appointment.find({ designerId: designer._id });
      // Set intersection: O(n+m) instead of a nested O(n*m) comparison.
      const conflicting = conflictingSlots(normalized, appointments);
      if (conflicting.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Some of those times are already booked for this designer'
        });
      }

      const updated = await User.findByIdAndUpdate(designer._id, { availability: normalized });

      res.status(200).json({
        success: true,
        message: 'Calendar updated successfully',
        designer: await buildDesignerLoad(updated)
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ------------------------------------------------------------ appointments

  async getAllAppointments(req, res) {
    try {
      const appointments = await Appointment.find();

      const populated = await Promise.all(appointments.map(async (appointment) => {
        return {
          ...appointment,
          client: await briefUser(appointment.userId),
          designer: await briefUser(appointment.designerId, ['name', 'email', 'specialization']),
          originalDesigner: appointment.originalDesignerId
            ? await briefUser(appointment.originalDesignerId, ['name'])
            : null
        };
      }));

      populated.sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime));

      res.status(200).json({
        success: true,
        count: populated.length,
        appointments: populated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // -------------------------------------------------------- coverage requests

  async getCoverageRequests(req, res) {
    try {
      const requests = await CoverageRequest.find();

      const populated = await Promise.all(requests.map(async (request) => {
        return {
          ...request,
          client: await briefUser(request.userId),
          requestedDesigner: await briefUser(request.requestedDesignerId, ['name', 'specialization']),
          assignedDesigner: request.assignedDesignerId
            ? await briefUser(request.assignedDesignerId, ['name', 'specialization'])
            : null
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

  /**
   * Which designers could cover the requested day, ranked by who is freest.
   * Anyone already packed on that date is excluded.
   */
  async getCoverageSuggestions(req, res) {
    try {
      const request = await CoverageRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Coverage request not found' });
      }

      const requestedDateKey = toDateKey(request.requestedDate);
      const designers = await User.find({ role: 'designer' });

      const suggestions = [];

      // PHASE 1 - FILTER: drop the originally requested designer, and anyone
      //                   whose day is already packed. Infeasible candidates
      //                   are excluded before scoring, not ranked and ignored.
      // PHASE 2 - SCORE:  compute the two ranking keys for each survivor.
      for (const designer of designers) {
        if (designer._id === request.requestedDesignerId) continue;

        const availability = getDesignerAvailability(designer);
        const appointments = await Appointment.find({ designerId: designer._id });

        if (!canTakeWorkOnDay(availability, appointments, requestedDateKey)) continue;

        suggestions.push(
          scoreDesignerForDay(designer, availability, appointments, requestedDateKey)
        );
      }

      // PHASE 3 - RANK: two-key comparator. Free on the requested day first,
      //                  lightest overall load as the tiebreak.
      const ranked = rankDesignersByFitness(suggestions);

      res.status(200).json({
        success: true,
        requestedDate: request.requestedDate,
        count: ranked.length,
        suggestions: ranked
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Turn a pending request into a real appointment on the chosen designer's
   * calendar. The admin may name an exact time; otherwise the designer's
   * first open slot on the requested day is used.
   */
  async assignCoverageRequest(req, res) {
    try {
      const { designerId, appointmentTime, adminNote } = req.body;

      const request = await CoverageRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Coverage request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `This request has already been ${request.status}`
        });
      }

      const designer = await User.findById(designerId);
      if (!designer || designer.role !== 'designer') {
        return res.status(404).json({ success: false, message: 'Designer not found' });
      }

      const availability = getDesignerAvailability(designer);
      const requestedDateKey = toDateKey(request.requestedDate);

      let slot = appointmentTime ? normalizeSlot(appointmentTime) : null;

      if (appointmentTime && !slot) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid appointment time'
        });
      }

      if (!slot) {
        // First-fit over a sorted array: the first match is the earliest.
        slot = firstOpenSlotOnDay(availability, requestedDateKey);
      }

      if (!slot) {
        return res.status(400).json({
          success: false,
          message: 'That designer has no open slot on the requested day. Pick a time, or open one on their calendar first.'
        });
      }

      if (!isFutureSlot(slot)) {
        return res.status(400).json({
          success: false,
          message: 'Appointments can only be scheduled in the future'
        });
      }

      const appointments = await Appointment.find({ designerId: designer._id });
      const clash = hasBookingAt(appointments, slot);

      if (clash) {
        return res.status(409).json({
          success: false,
          message: 'That designer already has a booking at this time'
        });
      }

      const appointment = await Appointment.create({
        userId: request.userId,
        designerId: designer._id,
        originalDesignerId: request.requestedDesignerId,
        assignedByAdminId: req.userId,
        coverageRequestId: request._id,
        appointmentTime: slot,
        location: request.location,
        surfaceArea: request.surfaceArea,
        budget: Number(request.budget) || 0,
        description: request.description || '',
        designId: request.designId || null,
        designTitle: request.designTitle || '',
        notes: adminNote || '',
        status: 'confirmed'
      });

      // The admin owns the calendar, so claiming a slot removes it from the
      // designer's open list exactly as a direct booking would.
      await User.findByIdAndUpdate(designer._id, {
        availability: availability.filter(entry => entry !== slot)
      });

      const updatedRequest = await CoverageRequest.findByIdAndUpdate(request._id, {
        status: 'assigned',
        assignedDesignerId: designer._id,
        assignedSlot: slot,
        appointmentId: appointment._id,
        adminNote: adminNote || ''
      });

      res.status(200).json({
        success: true,
        message: `Assigned to ${designer.name} successfully`,
        request: updatedRequest,
        appointment
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ------------------------------------------------------------- projects

  async getProjects(req, res) {
    try {
      const { status } = req.query;
      const projects = await Project.find(status ? { status } : {});

      const populated = await Promise.all(projects.map(async (project) => ({
        ...project,
        client: await briefUser(project.clientId, ['name', 'email', 'phone']),
        designer: project.designerId
          ? await briefUser(project.designerId, ['name', 'email', 'specialization'])
          : null
      })));

      populated.sort(byNewest);

      const all = await Project.find();
      const counts = all.reduce((tally, project) => {
        tally[project.status] = (tally[project.status] || 0) + 1;
        return tally;
      }, {});

      res.status(200).json({
        success: true,
        count: populated.length,
        counts,
        projects: populated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Assign a designer and put the project on the calendar in one step. The
   * scheduled time is the studio's commitment to the client, so it is checked
   * against that designer's other scheduled projects.
   */
  async assignProject(req, res) {
    try {
      const { designerId, scheduledAt, adminNote } = req.body;

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (!canTransition(project.status, 'assigned')) {
        return res.status(400).json({
          success: false,
          message: `A ${project.status} project cannot be assigned`
        });
      }

      const designer = await User.findById(designerId);
      if (!designer || designer.role !== 'designer') {
        return res.status(404).json({ success: false, message: 'Designer not found' });
      }

      const scheduledSlot = normalizeSlot(scheduledAt);
      if (!scheduledSlot) {
        return res.status(400).json({
          success: false,
          message: 'Please choose a date and time for this project'
        });
      }

      if (!isFutureSlot(scheduledSlot)) {
        return res.status(400).json({
          success: false,
          message: 'Projects can only be scheduled in the future'
        });
      }

      const designerProjects = await Project.find({ designerId: designer._id });
      const clash = existsWhere(designerProjects, other => {
        return other._id !== project._id &&
          isOpenProject(other) &&
          other.scheduledAt &&
          normalizeSlot(other.scheduledAt) === scheduledSlot;
      });

      if (clash) {
        return res.status(409).json({
          success: false,
          message: `${designer.name} already has a project scheduled at that time`
        });
      }

      const updated = await Project.findByIdAndUpdate(project._id, {
        status: 'assigned',
        designerId: designer._id,
        assignedByAdminId: req.userId,
        scheduledAt: scheduledSlot,
        adminNote: adminNote || '',
        history: withHistory(project, {
          action: 'assigned',
          by: req.userId,
          designerId: designer._id,
          scheduledAt: scheduledSlot
        })
      });

      res.status(200).json({
        success: true,
        message: `Assigned to ${designer.name}, scheduled for ${new Date(scheduledSlot).toLocaleString()}`,
        project: updated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async rescheduleProject(req, res) {
    try {
      const scheduledSlot = normalizeSlot(req.body.scheduledAt);

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (!isOpenProject(project)) {
        return res.status(400).json({
          success: false,
          message: `A ${project.status} project can no longer be rescheduled`
        });
      }

      if (!scheduledSlot || !isFutureSlot(scheduledSlot)) {
        return res.status(400).json({
          success: false,
          message: 'Please choose a valid future date and time'
        });
      }

      const updated = await Project.findByIdAndUpdate(project._id, {
        scheduledAt: scheduledSlot,
        history: withHistory(project, { action: 'rescheduled', by: req.userId, scheduledAt: scheduledSlot })
      });

      res.status(200).json({ success: true, message: 'Project rescheduled', project: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async approveProject(req, res) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (!canTransition(project.status, 'approved')) {
        return res.status(400).json({
          success: false,
          message: `Only a submitted design can be approved (this one is ${project.status})`
        });
      }

      const updated = await Project.findByIdAndUpdate(project._id, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        rejectionReason: '',
        adminNote: req.body.adminNote || project.adminNote,
        history: withHistory(project, { action: 'approved', by: req.userId })
      });

      res.status(200).json({
        success: true,
        message: 'Design approved. The client can now see it.',
        project: updated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Rejection is not an end state: it hands the project back to the designer
   * with a reason, so the pipeline returns to in-progress.
   */
  async rejectProject(req, res) {
    try {
      const { rejectionReason } = req.body;

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.status !== 'submitted') {
        return res.status(400).json({
          success: false,
          message: `Only a submitted design can be sent back (this one is ${project.status})`
        });
      }

      if (!rejectionReason || !rejectionReason.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Please tell the designer what needs changing'
        });
      }

      const updated = await Project.findByIdAndUpdate(project._id, {
        status: 'in-progress',
        rejectionReason: rejectionReason.trim(),
        history: withHistory(project, { action: 'sent back', by: req.userId, reason: rejectionReason.trim() })
      });

      res.status(200).json({
        success: true,
        message: 'Sent back to the designer with your notes',
        project: updated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async cancelProjectAsAdmin(req, res) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (!canTransition(project.status, 'cancelled')) {
        return res.status(400).json({
          success: false,
          message: `A ${project.status} project can no longer be cancelled`
        });
      }

      const updated = await Project.findByIdAndUpdate(project._id, {
        status: 'cancelled',
        adminNote: req.body.adminNote || project.adminNote,
        history: withHistory(project, { action: 'cancelled', by: req.userId })
      });

      res.status(200).json({ success: true, message: 'Project cancelled', project: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Everything on the studio calendar: scheduled projects plus live
   * consultation appointments, in one feed the calendar view can render.
   */
  async getCalendar(req, res) {
    try {
      const projects = await Project.find();
      const scheduled = projects.filter(project => project.scheduledAt && isOpenProject(project));

      const entries = await Promise.all(scheduled.map(async (project) => ({
        _id: project._id,
        kind: 'project',
        at: project.scheduledAt,
        title: project.title,
        status: project.status,
        client: await briefUser(project.clientId, ['name']),
        designer: project.designerId ? await briefUser(project.designerId, ['name']) : null
      })));

      const appointments = await Appointment.find();
      const liveAppointments = appointments.filter(isActiveAppointment);

      const appointmentEntries = await Promise.all(liveAppointments.map(async (appointment) => ({
        _id: appointment._id,
        kind: 'appointment',
        at: appointment.appointmentTime,
        title: `Consultation — ${appointment.surfaceArea}`,
        status: appointment.status,
        client: await briefUser(appointment.userId, ['name']),
        designer: await briefUser(appointment.designerId, ['name'])
      })));

      const all = [...entries, ...appointmentEntries]
        .sort((a, b) => new Date(a.at) - new Date(b.at));

      res.status(200).json({
        success: true,
        count: all.length,
        entries: all
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async declineCoverageRequest(req, res) {
    try {
      const request = await CoverageRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Coverage request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `This request has already been ${request.status}`
        });
      }

      const updated = await CoverageRequest.findByIdAndUpdate(request._id, {
        status: 'declined',
        adminNote: req.body.adminNote || ''
      });

      res.status(200).json({
        success: true,
        message: 'Request declined',
        request: updated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AdminController();
