const express = require('express');
const {
  createDesign,
  getDesigns,
  getDesignerDesigns,
  getMyDesigns,
  getDesign,
  updateDesign,
  deleteDesign,
  addReview
} = require('../controllers/designController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getDesigns);
router.get('/designer/:designerId', getDesignerDesigns);
router.get('/mine', authMiddleware, requireRole(['designer']), getMyDesigns);
router.get('/:id', getDesign);

router.post('/', authMiddleware, requireRole(['designer']), createDesign);
router.put('/:id', authMiddleware, requireRole(['designer']), updateDesign);
router.delete('/:id', authMiddleware, requireRole(['designer']), deleteDesign);
router.post('/:id/review', authMiddleware, addReview);

module.exports = router;
