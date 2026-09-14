// ============================================================
// COC_System Express app
// Step 2: session-based auth — login, logout, session check,
// and auth middleware protecting all non-public routes.
// ============================================================

const express = require('express');
const cors = require('cors');
const session = require('express-session');

const loginRoutes = require('./modules/login/login.routes');
const authMiddleware = require('./middleware/authMiddleware');
const clientRoutes = require('./modules/client/client.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const eventsRoutes = require('./modules/events/events.routes');
const staffRoutes = require('./modules/staff/staff.routes');

const app = express();

// --- Global middleware ---------------------------------------
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Session middleware — must be before routes
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 4 * 60 * 60 * 1000, // 4 hours
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

// --- Public routes (no auth required) ------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount login module — its routes /api/login, /api/logout,
// /api/session are all public (auth is handled internally).
app.use('/api', loginRoutes);

// --- Protected routes (authMiddleware applied) ---------------
// Every route registered below this point requires a valid
// session (req.session.adminId must exist).
app.use('/api', authMiddleware);

// Client module — all /api/clients routes are now protected.
app.use('/api/clients', clientRoutes);

// Payments module — all /api/payments routes are now protected.
app.use('/api/payments', paymentsRoutes);

// Events module — /api/events and /api/events/categories routes are protected.
app.use('/api', eventsRoutes);

// Staff module — /api/staff routes are protected.
app.use('/api/staff', staffRoutes);

// --- Centralized error handler --------------------------------
app.use((err, req, res, next) => {
  console.error('[Error]', err);

  const isUserFacing = err.isUserFacing === true && err.message;

  res.status(err.status || 500).json({
    error: isUserFacing ? err.message : 'Something went wrong',
  });
});

module.exports = app;