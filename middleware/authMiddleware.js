const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes and verify JWT bearer tokens
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from bearer scheme
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforcommunityserviceportal2026');

      // Attach user object (excluding hashed password) to request
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token validation failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token is missing from headers'
    });
  }
};

module.exports = { protect };
