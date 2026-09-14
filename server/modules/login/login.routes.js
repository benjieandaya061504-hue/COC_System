// ============================================================
// COC_System — Login Routes
// ============================================================

const { Router } = require('express');
const router = Router();
const { login, logout, getSession } = require('./login.controller');

// Public routes (no auth middleware — these handle session setup/teardown)
router.post('/login', login);
router.post('/logout', logout);
router.get('/session', getSession);

module.exports = router;
