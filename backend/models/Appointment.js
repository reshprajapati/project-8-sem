const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  designerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentTime: {
    type: Date,
    required: [true, 'Please provide appointment time']
  },
  fieldVisitTime: {
    type: Date,
    default: null
  },
  location: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  surfaceArea: {
    type: String,
    enum: ['bedroom', 'living-room', 'kitchen', 'bathroom', 'dining-room', 'office', 'other'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  budget: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
