const { v4: uuidv4 } = require('uuid');
const { db } = require('./init');

class AppointmentModel {
  static async create(appointmentData) {
    const appointment = {
      _id: uuidv4(),
      ...appointmentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    db.appointments.data.appointments.push(appointment);
    await db.appointments.write();
    return appointment;
  }

  static async find(query = {}) {
    let results = db.appointments.data.appointments;
    
    if (Object.keys(query).length > 0) {
      results = results.filter(apt => {
        return Object.keys(query).every(key => apt[key] === query[key]);
      });
    }

    return results;
  }

  static async findById(id) {
    return db.appointments.data.appointments.find(apt => apt._id === id);
  }

  static async findByIdAndUpdate(id, updates) {
    const index = db.appointments.data.appointments.findIndex(apt => apt._id === id);
    if (index === -1) return null;
    const appointment = { 
      ...db.appointments.data.appointments[index], 
      ...updates, 
      updatedAt: new Date() 
    };
    db.appointments.data.appointments[index] = appointment;
    await db.appointments.write();
    return appointment;
  }

  static async findByIdAndDelete(id) {
    const index = db.appointments.data.appointments.findIndex(apt => apt._id === id);
    if (index === -1) return null;
    const appointment = db.appointments.data.appointments[index];
    db.appointments.data.appointments.splice(index, 1);
    await db.appointments.write();
    return appointment;
  }

  static populate(path) {
    return this;
  }

  static sort(options) {
    return this;
  }
}

module.exports = AppointmentModel;
