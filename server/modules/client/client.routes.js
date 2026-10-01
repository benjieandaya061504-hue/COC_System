// ============================================================
// COC_System — Client Routes
// Protected by authMiddleware in app.js (mounted after it).
// ============================================================

const { Router } = require('express');
const router = Router();
const {
  listClients,
  getClient,
  createClient,
  updateClient,
  softDeleteClient,
  completeEvent,
  uncompleteEvent,
} = require('./client.controller');

router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', softDeleteClient);
router.patch('/:id/complete', completeEvent);
router.patch('/:id/uncomplete', uncompleteEvent);

module.exports = router;