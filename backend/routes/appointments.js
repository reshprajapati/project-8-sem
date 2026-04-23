const express = require('express');
const {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  setFieldVisitTime
} = require('../controllers/appointmentController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createAppointment);
router.get('/', getAppointments);
router.get('/:id', getAppointment);
router.put('/:id', updateAppointment);
router.put('/:id/cancel', cancelAppointment);
router.put('/:id/set-visit-time', requireRole(['designer']), setFieldVisitTime);

module.exports = router;
