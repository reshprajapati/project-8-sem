const express = require('express');
const {
  getOverview,
  getDesigners,
  createDesigner,
  deleteDesigner,
  updateDesignerAvailability,
  getAllAppointments,
  getCoverageRequests,
  getCoverageSuggestions,
  assignCoverageRequest,
  declineCoverageRequest,
  getProjects,
  assignProject,
  rescheduleProject,
  approveProject,
  rejectProject,
  cancelProjectAsAdmin,
  getCalendar
} = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Every route below is admin only.
router.use(authMiddleware, requireRole(['admin']));

router.get('/overview', getOverview);

router.get('/designers', getDesigners);
router.post('/designers', createDesigner);
router.delete('/designers/:id', deleteDesigner);
router.put('/designers/:id/availability', updateDesignerAvailability);

router.get('/appointments', getAllAppointments);
router.get('/calendar', getCalendar);

router.get('/projects', getProjects);
router.put('/projects/:id/assign', assignProject);
router.put('/projects/:id/reschedule', rescheduleProject);
router.put('/projects/:id/approve', approveProject);
router.put('/projects/:id/reject', rejectProject);
router.put('/projects/:id/cancel', cancelProjectAsAdmin);

router.get('/coverage-requests', getCoverageRequests);
router.get('/coverage-requests/:id/suggestions', getCoverageSuggestions);
router.put('/coverage-requests/:id/assign', assignCoverageRequest);
router.put('/coverage-requests/:id/decline', declineCoverageRequest);

module.exports = router;
