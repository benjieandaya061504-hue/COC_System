// ============================================================
// COC_System — Payments Routes
// Protected by authMiddleware in app.js (mounted after it).
// ============================================================

const { Router } = require('express');
const router = Router();
const { createPayment, listPayments, listAllPayments } = require('./payments.controller');

router.post('/', createPayment);
router.get('/', listAllPayments);           // must be before /:eventId to avoid conflict
router.get('/:eventId', listPayments);

module.exports = router;