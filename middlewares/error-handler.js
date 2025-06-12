const AppError = require('../utils/errors');

const logError = (err) => {
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    status: err.status,
    code: err.code,
    stack: err.stack
  });
};

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
};

const errorHandler = (err, req, res, next) => {
  logError(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      status: 'error',
      message: err.message,
      code: err.code
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      status: 'error',
      message: 'Duplicate entry found',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please log in again.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Your token has expired. Please log in again.'
    });
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
}; 