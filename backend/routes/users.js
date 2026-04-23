const express = require('express');
const {
  getProfile,
  getUserById,
  getAllDesigners,
  updateProfile,
  updateAvailability,
  uploadProfileImage,
  searchDesigners
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/designers', getAllDesigners);
router.get('/search', searchDesigners);
router.get('/:id', getUserById);

// Protected routes
router.use(authMiddleware);

router.get('/profile/me', getProfile);
router.put('/profile/update', updateProfile);
router.put('/profile/availability', updateAvailability);
router.post('/profile/upload-image', uploadProfileImage);

module.exports = router;
