const { sendError } = require('../utils/apiResponse');

/**
 * Centralized Express error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log unexpected internal errors in development/server logs
  console.error(`[Error] ${err.stack || err.message || err}`);

  // Handle invalid JSON request body syntax errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'Invalid JSON payload in request body', err.message);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Something went wrong';

  const errorDetail = process.env.NODE_ENV === 'development' ? (err.message || null) : null;

  return sendError(res, statusCode, message, errorDetail);
};

module.exports = errorHandler;
