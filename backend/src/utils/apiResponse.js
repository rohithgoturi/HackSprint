/**
 * Consistent API response helper functions
 */

const sendSuccess = (res, statusCode = 200, message = 'Request successful', data = null) => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

const sendError = (res, statusCode = 500, message = 'Something went wrong', error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : null
  });
};

module.exports = {
  sendSuccess,
  sendError
};
