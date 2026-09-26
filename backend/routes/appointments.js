const express = require('express');
const {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  setFieldVisitTime,
  createCoverageRequest,
  getMyCoverageRequests
} = require('../controllers/appointmentController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createAppointment);
router.get('/', getAppointments);

// Static paths must be declared before '/:id' so they are not swallowed by it.
router.post('/coverage-requests', createCoverageRequest);
router.get('/coverage-requests', getMyCoverageRequests);

router.get('/:id', getAppointment);
router.put('/:id', updateAppointment);
router.put('/:id/cancel', cancelAppointment);
router.put('/:id/set-visit-time', requireRole(['designer']), setFieldVisitTime);

module.exports = router;
