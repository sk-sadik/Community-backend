/**
 * Middleware to restrict endpoints to admin users only
 * Pre-requisite: Must be chained after the 'protect' middleware
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required'
    });
  }
};

module.exports = { admin };
