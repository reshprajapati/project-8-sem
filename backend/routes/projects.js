const express = require('express');
const {
  createProject,
  getMyProjects,
  cancelProject,
  getAssignedProjects,
  startProject,
  submitDesign
} = require('../controllers/projectController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Client
router.post('/', requireRole(['user']), createProject);
router.get('/mine', requireRole(['user']), getMyProjects);
router.put('/:id/cancel', requireRole(['user']), cancelProject);

// Designer
router.get('/assigned', requireRole(['designer']), getAssignedProjects);
router.put('/:id/start', requireRole(['designer']), startProject);
router.put('/:id/submit', requireRole(['designer']), submitDesign);

module.exports = router;
