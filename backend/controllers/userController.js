const User = require('../db/User');
const Appointment = require('../db/Appointment');
const { getDesignerAvailability, buildDaySummary } = require('../utils/schedule');

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const userResponse = { ...user };
  delete userResponse.password;
  return userResponse;
};

const pickDefined = (values) => {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined)
  );
};

class UserController {
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        user: sanitizeUser(user)
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        user: sanitizeUser(user)
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async getAllDesigners(req, res) {
    try {
      const users = await User.find({ role: 'designer' });
      const designers = users.map(sanitizeUser);

      res.status(200).json({
        success: true,
        count: designers.length,
        designers
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const {
        name,
        bio,
        phone,
        specialization,
        experience,
        address,
        socialLinks
      } = req.body;

      const updateData = pickDefined({
        name,
        bio,
        phone,
        specialization,
        experience,
        address,
        socialLinks
      });

      const user = await User.findByIdAndUpdate(
        req.userId,
        updateData
      );

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: sanitizeUser(user)
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async uploadProfileImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { profileImage: `/uploads/${req.file.filename}` }
      );

      res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully',
        user: sanitizeUser(user)
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  /**
   * A designer's booking calendar, with each day marked open or packed.
   * Public, because clients need it before they are able to book.
   */
  async getDesignerSchedule(req, res) {
    try {
      const designer = await User.findById(req.params.id);

      if (!designer || designer.role !== 'designer') {
        return res.status(404).json({
          success: false,
          message: 'Designer not found'
        });
      }

      const availability = getDesignerAvailability(designer);
      const appointments = await Appointment.find({ designerId: designer._id });
      const days = buildDaySummary(availability, appointments);

      res.status(200).json({
        success: true,
        schedule: {
          designerId: designer._id,
          availability,
          days,
          packedDates: days.filter(day => day.packed).map(day => day.date)
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async searchDesigners(req, res) {
    try {
      const { name, specialization, city } = req.query;
      
      const users = await User.find({ role: 'designer' });
      
      let results = users;

      if (name) {
        results = results.filter(user => 
          user.name.toLowerCase().includes(name.toLowerCase())
        );
      }
      if (specialization) {
        results = results.filter(user => 
          user.specialization && user.specialization.toLowerCase().includes(specialization.toLowerCase())
        );
      }
      if (city) {
        results = results.filter(user => 
          user.address && user.address.city && user.address.city.toLowerCase().includes(city.toLowerCase())
        );
      }

      const designers = results.map(sanitizeUser);

      res.status(200).json({
        success: true,
        count: designers.length,
        designers
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
}

module.exports = new UserController();
