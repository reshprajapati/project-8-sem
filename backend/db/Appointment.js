const { v4: uuidv4 } = require('uuid');
const BaseModel = require('./BaseModel');

class AppointmentModel extends BaseModel {
  constructor() {
    super('appointments');
  }

  async create(appointmentData) {
    const appointment = {
      _id: uuidv4(),
      ...appointmentData
    };

    return super.create(appointment);
  }
}

module.exports = new AppointmentModel();
