const Project = require('../db/Project');
const User = require('../db/User');
const { hasCompleteLocation } = require('../utils/schedule');
const { canTransition, withHistory } = require('../utils/projectStatus');
const { byNewest } = require('../algorithms');

const SURFACE_TYPES = ['bedroom', 'living-room', 'kitchen', 'bathroom', 'dining-room', 'office', 'other'];

const briefUser = async (userId, fields = []) => {
  if (!userId) return null;
  const user = await User.findById(userId);
  if (!user) return null;

  const brief = { _id: user._id, name: user.name };
  fields.forEach(field => { brief[field] = user[field]; });
  return brief;
};

const populateProject = async (project) => {
  return {
    ...project,
    client: await briefUser(project.clientId, ['email', 'phone']),
    designer: await briefUser(project.designerId, ['email', 'specialization', 'profileImage'])
  };
};

const populateProjects = async (projects) => {
  return Promise.all(projects.map(populateProject));
};

class ProjectController {
  // ------------------------------------------------------------------ client

  async createProject(req, res) {
    try {
      const { title, description, surfaceArea, location, budget, preferredDate } = req.body;

      if (!title || !description || !surfaceArea) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a title, description, and room type'
        });
      }

      if (!SURFACE_TYPES.includes(surfaceArea)) {
        return res.status(400).json({
          success: false,
          message: 'Please choose a valid room type'
        });
      }

      if (!hasCompleteLocation(location)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a complete address'
        });
      }

      const project = await Project.create({
        clientId: req.userId,
        title,
        description,
        surfaceArea,
        location,
        budget: Number(budget) || 0,
        preferredDate: preferredDate || null,
        history: [{ action: 'requested', by: req.userId, at: new Date().toISOString() }]
      });

      res.status(201).json({
        success: true,
        message: 'Request submitted. An admin will assign a designer shortly.',
        project
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getMyProjects(req, res) {
    try {
      const projects = await Project.find({ clientId: req.userId });
      const populated = await populateProjects(projects);
      populated.sort(byNewest);

      res.status(200).json({
        success: true,
        count: populated.length,
        projects: populated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async cancelProject(req, res) {
    try {
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.clientId !== req.userId) {
        return res.status(403).json({ success: false, message: 'This is not your project' });
      }

      if (!canTransition(project.status, 'cancelled')) {
        return res.status(400).json({
          success: false,
          message: `A ${project.status} project can no longer be cancelled`
        });
      }

      const updated = await Project.findByIdAndUpdate(project._id, {
        status: 'cancelled',
        history: withHistory(project, { action: 'cancelled', by: req.userId })
      });

      res.status(200).json({ success: true, message: 'Project cancelled', project: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ---------------------------------------------------------------- designer

  async getAssignedProjects(req, res) {
    try {
      const projects = await Project.find({ designerId: req.userId });
      const populated = await populateProjects(projects);
      populated.sort(byNewest);

      res.status(200).json({
        success: true,
        count: populated.length,
        projects: populated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async startProject(req, res) {
    try {
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.designerId !== req.userId) {
        return res.status(403).json({ success: false, message: 'This project is not assigned to you' });
      }

      if (!canTransition(project.status, 'in-progress')) {
        return res.status(400).json({
          success: false,
          message: `You cannot start a project that is ${project.status}`
        });
      }

      const updated = await Project.findByIdAndUpdate(project._id, {
        status: 'in-progress',
        designerNote: req.body.designerNote || project.designerNote,
        history: withHistory(project, { action: 'started', by: req.userId })
      });

      res.status(200).json({ success: true, message: 'Project marked as in progress', project: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async submitDesign(req, res) {
    try {
      const { title, description, imageUrl, notes } = req.body;

      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.designerId !== req.userId) {
        return res.status(403).json({ success: false, message: 'This project is not assigned to you' });
      }

      if (!canTransition(project.status, 'submitted')) {
        return res.status(400).json({
          success: false,
          message: `You can only submit work on a project that is in progress (this one is ${project.status})`
        });
      }

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: 'Please give the design a title and a description'
        });
      }

      const submittedAt = new Date().toISOString();

      const updated = await Project.findByIdAndUpdate(project._id, {
        status: 'submitted',
        submittedAt,
        rejectionReason: '',
        submission: {
          title,
          description,
          imageUrl: imageUrl || '',
          notes: notes || '',
          submittedAt
        },
        history: withHistory(project, { action: 'submitted', by: req.userId })
      });

      res.status(200).json({
        success: true,
        message: 'Design submitted for admin approval',
        project: updated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ProjectController();
