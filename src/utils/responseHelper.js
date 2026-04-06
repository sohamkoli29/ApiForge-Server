const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

const sendError = (res, message = 'Something went wrong', statusCode = 500, extra = {}) => {
  res.status(statusCode).json({ success: false, error: message, ...extra });
};

module.exports = { sendSuccess, sendError };
