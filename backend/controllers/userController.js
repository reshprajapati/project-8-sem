const User = require('../db/User');

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

// Get user profile
exports.getProfile = async (req, res) => {
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
};

// Get user by ID (for viewing designer profile)
exports.getUserById = async (req, res) => {
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
};

// Get all designers
exports.getAllDesigners = async (req, res) => {
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
};

// Update profile
exports.updateProfile = async (req, res) => {
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
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
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
};

// Update availability
exports.updateAvailability = async (req, res) => {
  try {
    if (req.userRole !== 'designer') {
      return res.status(403).json({
        success: false,
        message: 'Only designers can manage availability'
      });
    }

    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Availability must be an array of date-time values'
      });
    }

    const user = await User.findByIdAndUpdate(req.userId, { availability });

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      user: sanitizeUser(user)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Search designers
exports.searchDesigners = async (req, res) => {
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
};
