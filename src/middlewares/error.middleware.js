import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
  };

  if (error.statusCode === 500) {
    logger.error(`${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  }

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
