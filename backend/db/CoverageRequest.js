const { v4: uuidv4 } = require('uuid');
const BaseModel = require('./BaseModel');

class CoverageRequestModel extends BaseModel {
  constructor() {
    super('coverageRequests');
  }

  async create(requestData) {
    const coverageRequest = {
      _id: uuidv4(),
      status: 'pending',
      assignedDesignerId: null,
      assignedSlot: null,
      appointmentId: null,
      adminNote: '',
      ...requestData
    };

    return super.create(coverageRequest);
  }
}

module.exports = new CoverageRequestModel();
