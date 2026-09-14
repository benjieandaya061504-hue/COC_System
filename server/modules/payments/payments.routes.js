// ============================================================
// COC_System — Payments Routes
// Protected by authMiddleware in app.js (mounted after it).
// ============================================================

const { Router } = require('express');
const router = Router();
const { createPayment, listPayments } = require('./payments.controller');

router.post('/', createPayment);
router.get('/:eventId', listPayments);

module.exports = router;