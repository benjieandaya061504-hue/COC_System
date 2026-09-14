// ============================================================
// COC_System — Authentication Middleware
// Protects routes by requiring req.session.adminId.
// Throws an isUserFacing 401 error if not authenticated.
// ============================================================

function authMiddleware(req, res, next) {
  if (!req.session.adminId) {
    const err = new Error('Not authenticated');
    err.status = 401;
    err.isUserFacing = true;
    return next(err);
  }

  next();
}

module.exports = authMiddleware;
