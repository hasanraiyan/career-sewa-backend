import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import config from "../config/env.js";
import logger from "../config/logger.js";

/**
 * Convert different types of errors to APIError instances
 * @param {Error} err - Original error
 * @returns {APIError} APIError instance
 */
const convertToAPIError = (err) => {
  // If it's already an APIError, return as is
  if (err instanceof APIError) {
    return err;
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    return APIError.fromMongooseValidationError(err);
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    return APIError.fromMongooseDuplicateKeyError(err);
  }

  // Handle Mongoose cast errors
  if (err.name === "CastError") {
    return APIError.fromMongooseCastError(err);
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError" || err.name === "NotBeforeError") {
    return APIError.fromJWTError(err);
  }

  // Handle Multer errors (file upload)
  if (err.code === "LIMIT_FILE_SIZE") {
    return APIError.badRequest("File size too large");
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return APIError.badRequest("Too many files");
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return APIError.badRequest("Unexpected file field");
  }

  // Handle rate limit errors
  if (err.status === 429) {
    return APIError.tooManyRequests("Too many requests, please try again later");
  }

  // Handle SyntaxError (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return APIError.badRequest("Invalid JSON format");
  }

  // For all other errors, create a generic server error
  return APIError.internalServerError(err.message || "Something went wrong");
};

/**
 * Log error details
 * @param {APIError} error - APIError instance
 * @param {Object} req - Express request object
 */
const logError = (error, req) => {
  const errorDetails = {
    message: error.message,
    statusCode: error.statusCode,
    isOperational: error.isOperational,
    timestamp: error.timestamp,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  };

  // Add user information if available
  if (req.user) {
    errorDetails.userId = req.user.id;
    errorDetails.userEmail = req.user.email;
  }

  // Add request body for debugging (excluding sensitive fields)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    delete sanitizedBody.password;
    delete sanitizedBody.confirmPassword;
    delete sanitizedBody.currentPassword;
    delete sanitizedBody.newPassword;
    errorDetails.requestBody = sanitizedBody;
  }

  // Log based on error severity
  if (error.statusCode >= 500) {
    logger.error("Server Error", {
      ...errorDetails,
      stack: error.stack,
    });
  } else if (error.statusCode >= 400) {
    logger.warn("Client Error", errorDetails);
  } else {
    logger.info("Request Error", errorDetails);
  }
};

/**
 * Send error response to client
 * @param {APIError} error - APIError instance
 * @param {Object} res - Express response object
 */
const sendErrorResponse = (error, res) => {
  const isDevelopment = config.env.NODE_ENV === "development";
  
  // Prepare error response data
  const errorResponse = {
    message: error.message,
    statusCode: error.statusCode,
  };

  // Add stack trace in development mode
  if (isDevelopment) {
    errorResponse.stack = error.stack;
    errorResponse.isOperational = error.isOperational;
  }

  // Don't expose internal server error details in production
  if (error.statusCode >= 500 && !isDevelopment) {
    errorResponse.message = "Internal server error";
  }

  // Create and send API response
  const apiResponse = new APIResponse(
    error.statusCode,
    isDevelopment ? errorResponse : null,
    errorResponse.message,
    false
  );

  apiResponse.send(res);
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Convert error to APIError
  const apiError = convertToAPIError(err);

  // Log the error
  logError(apiError, req);

  // Send error response
  sendErrorResponse(apiError, res);
};

/**
 * Handle 404 - Not Found errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFoundHandler = (req, res, next) => {
  const error = APIError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Handle uncaught exceptions
 * @param {Error} error - Uncaught exception
 */
const handleUncaughtException = (error) => {
  logger.error("Uncaught Exception", {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  // Graceful shutdown
  process.exit(1);
};

/**
 * Handle unhandled promise rejections
 * @param {Error} reason - Rejection reason
 * @param {Promise} promise - Rejected promise
 */
const handleUnhandledRejection = (reason, promise) => {
  logger.error("Unhandled Promise Rejection", {
    reason: reason.message || reason,
    stack: reason.stack,
    promise: promise.toString(),
    timestamp: new Date().toISOString(),
  });

  // Graceful shutdown
  process.exit(1);
};

/**
 * Setup global error handlers
 */
const setupGlobalErrorHandlers = () => {
  process.on("uncaughtException", handleUncaughtException);
  process.on("unhandledRejection", handleUnhandledRejection);
};

export {
  errorHandler,
  notFoundHandler,
  convertToAPIError,
  setupGlobalErrorHandlers,
};