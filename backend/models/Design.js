const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  designerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Please provide design title'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  surfaceType: {
    type: String,
    enum: ['bedroom', 'living-room', 'kitchen', 'bathroom', 'dining-room', 'office', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['modern', 'traditional', 'contemporary', 'minimalist', 'industrial', 'rustic', 'eclectic'],
    default: 'modern'
  },
  images: [{
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  before: {
    type: String,
    default: null
  },
  after: {
    type: String,
    default: null
  },
  materials: [String],
  cost: {
    type: Number,
    default: 0
  },
  duration: {
    type: String,
    default: '' // e.g., "2 weeks"
  },
  clientReview: {
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    comment: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  isPortfolio: {
    type: Boolean,
    default: false // If true, shown in portfolio
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

module.exports = mongoose.model('Design', designSchema);
