const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db/init');

const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const designRoutes = require('./routes/designs');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const projectRoutes = require('./routes/projects');

class App {
  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
  }

  configureMiddleware() {
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  }

  configureRoutes() {
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/appointments', appointmentRoutes);
    this.app.use('/api/designs', designRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/projects', projectRoutes);

    this.app.get('/api/health', (req, res) => {
      res.status(200).json({ message: 'API is running' });
    });

    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });

    this.app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {}
      });
    });
  }

  async init() {
    await initDB();
    return this;
  }

  listen(port) {
    this.port = port;
    this.app.listen(this.port, () => {
      console.log(`🚀 Server running on http://localhost:${this.port}`);
      console.log(`📌 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

module.exports = App;
