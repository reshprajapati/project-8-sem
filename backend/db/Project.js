const { v4: uuidv4 } = require('uuid');
const BaseModel = require('./BaseModel');

class ProjectModel extends BaseModel {
  constructor() {
    super('projects');
  }

  async create(projectData) {
    const project = {
      _id: uuidv4(),
      status: 'requested',
      designerId: null,
      assignedByAdminId: null,
      scheduledAt: null,
      adminNote: '',
      designerNote: '',
      submission: null,
      submittedAt: null,
      approvedAt: null,
      rejectionReason: '',
      history: [],
      ...projectData
    };

    return super.create(project);
  }
}

module.exports = new ProjectModel();
