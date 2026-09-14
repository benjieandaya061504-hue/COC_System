// ============================================================
// COC_System — Staff Routes
// Protected by authMiddleware in app.js (mounted after it).
// ============================================================

const { Router } = require('express');
const router = Router();
const {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  assignStaff,
  listAssignedStaff,
  unassignStaff,
} = require('./staff.controller');

router.get('/', listStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);
router.post('/assign', assignStaff);
router.get('/assigned/:eventId', listAssignedStaff);
router.delete('/assign/:assignmentId', unassignStaff);

module.exports = router;