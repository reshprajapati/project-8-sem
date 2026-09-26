const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../db/User');

const createToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'dev-secret-key-change-me';
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
};

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password, confirmPassword, role = 'user', phone } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide name, email, and password'
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match'
        });
      }

      // Admin accounts are seeded, never self-registered.
      if (!['user', 'designer'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Please register as either a client or a designer'
        });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role,
        phone
      });

      // Create token
      const token = createToken(user._id, user.role);

      // Send response (exclude password)
      const userResponse = { ...user };
      delete userResponse.password;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message || 'Server error during registration'
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password'
        });
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Create token
      const token = createToken(user._id, user.role);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message || 'Server error during login'
      });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Exclude password
      const userResponse = { ...user };
      delete userResponse.password;

      res.status(200).json({
        success: true,
        user: userResponse
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
}

module.exports = new AuthController();
