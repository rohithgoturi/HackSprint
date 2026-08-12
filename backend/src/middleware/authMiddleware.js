const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to authenticate requests using JWT
 */
const authenticate = async (req, res, next) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
    return sendError(res, 500, 'Server authentication configuration error');
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Authentication token required');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return sendError(res, 401, 'Authentication token missing');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(res, 401, 'User account no longer exists');
    }

    if (!user.isActive) {
      return sendError(res, 401, 'User account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Authentication token expired');
    }
    return sendError(res, 401, 'Invalid authentication token');
  }
};

/**
 * Higher-order middleware for role-based access authorization
 * @param  {...string} allowedRoles Allowed user roles (e.g. 'ADMIN', 'FIELD_WORKER')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'User not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, 'Access denied: insufficient permissions');
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
};
