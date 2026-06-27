/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log full trace to server console for debugging
  console.error('API Error Log:', err);

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key (code 11000)
  if (err.code === 11000) {
    const message = 'Duplicate field value entered. A record with this unique field already exists.';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Multer errors (upload validation/limit issues)
  if (err.name === 'MulterError') {
    let message = err.message;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size limit exceeded. Maximum size is 5MB.';
    }
    error = { message, statusCode: 400 };
  }

  // Final payload response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
