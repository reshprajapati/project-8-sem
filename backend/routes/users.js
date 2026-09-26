const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {
  getProfile,
  getUserById,
  getAllDesigners,
  updateProfile,
  getDesignerSchedule,
  uploadProfileImage,
  searchDesigners
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

// Public routes
router.get('/designers', getAllDesigners);
router.get('/search', searchDesigners);
router.get('/:id/schedule', getDesignerSchedule);
router.get('/:id', getUserById);

// Protected routes
router.use(authMiddleware);

router.get('/profile/me', getProfile);
router.put('/profile/update', updateProfile);
router.post('/profile/upload-image', upload.single('image'), uploadProfileImage);

module.exports = router;
