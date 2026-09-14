// ============================================================
// COC_System — Events Routes
// Protected by authMiddleware in app.js (mounted after it).
// ============================================================

const { Router } = require('express');
const router = Router();
const {
  listEvents,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('./events.controller');

router.get('/events', listEvents);
router.get('/events/categories', listCategories);
router.post('/events/categories', createCategory);
router.put('/events/categories/:id', updateCategory);
router.delete('/events/categories/:id', deleteCategory);

module.exports = router;