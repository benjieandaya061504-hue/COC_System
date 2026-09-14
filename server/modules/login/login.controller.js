// ============================================================
// COC_System — Login Controller
// Step 2: session-based authentication
// ============================================================

const bcrypt = require('bcrypt');
const pool = require('../../config/db');

// ------------------------------------------------------------
// POST /api/login
// Accepts { username, password }, validates against admin table.
// On success sets req.session.adminId and returns { success: true }.
// On failure throws an isUserFacing error (generic message).
// ------------------------------------------------------------
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      const err = new Error('Invalid username or password');
      err.status = 401;
      err.isUserFacing = true;
      throw err;
    }

    const [rows] = await pool.execute(
      'SELECT id, password_hash FROM admin WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      const err = new Error('Invalid username or password');
      err.status = 401;
      err.isUserFacing = true;
      throw err;
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);

    if (!match) {
      const err = new Error('Invalid username or password');
      err.status = 401;
      err.isUserFacing = true;
      throw err;
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.adminId = admin.id;

      res.json({ success: true });
    });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// POST /api/logout
// Destroys session and clears the cookie.
// ------------------------------------------------------------
function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);

    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
}

// ------------------------------------------------------------
// GET /api/session
// Public route — returns whether the user is authenticated.
// Frontend calls this on app load to restore login state.
// ------------------------------------------------------------
function getSession(req, res) {
  res.json({ authenticated: Boolean(req.session.adminId) });
}

module.exports = { login, logout, getSession };
