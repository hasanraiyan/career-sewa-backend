/**
 * Custom API Error class extending the native Error class
 * Provides standardized error handling across the application
 */
class APIError extends Error {
  /**
   * Create a new API error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether the error is operational (true) or programming error (false)
   * @param {string} stack - Error stack trace
   */
  constructor(
    message = "Something went wrong",
    statusCode = 500,
    isOperational = true,
    stack = ""
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Create a bad request error (400)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static badRequest(message = "Bad request") {
    return new APIError(message, 400);
  }

  /**
   * Create an unauthorized error (401)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static unauthorized(message = "Unauthorized access") {
    return new APIError(message, 401);
  }

  /**
   * Create a forbidden error (403)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static forbidden(message = "Access forbidden") {
    return new APIError(message, 403);
  }

  /**
   * Create a not found error (404)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static notFound(message = "Resource not found") {
    return new APIError(message, 404);
  }

  /**
   * Create a method not allowed error (405)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static methodNotAllowed(message = "Method not allowed") {
    return new APIError(message, 405);
  }

  /**
   * Create a conflict error (409)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static conflict(message = "Resource conflict") {
    return new APIError(message, 409);
  }

  /**
   * Create a validation error (422)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static validationError(message = "Validation failed") {
    return new APIError(message, 422);
  }

  /**
   * Create a too many requests error (429)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static tooManyRequests(message = "Too many requests") {
    return new APIError(message, 429);
  }

  /**
   * Create an internal server error (500)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static internalServerError(message = "Internal server error") {
    return new APIError(message, 500, false);
  }

  /**
   * Create a not implemented error (501)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static notImplemented(message = "Not implemented") {
    return new APIError(message, 501, false);
  }

  /**
   * Create a bad gateway error (502)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static badGateway(message = "Bad gateway") {
    return new APIError(message, 502, false);
  }

  /**
   * Create a service unavailable error (503)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static serviceUnavailable(message = "Service unavailable") {
    return new APIError(message, 503, false);
  }

  /**
   * Create a gateway timeout error (504)
   * @param {string} message - Error message
   * @returns {APIError} APIError instance
   */
  static gatewayTimeout(message = "Gateway timeout") {
    return new APIError(message, 504, false);
  }

  /**
   * Create error from Mongoose validation error
   * @param {Object} error - Mongoose validation error
   * @returns {APIError} APIError instance
   */
  static fromMongooseValidationError(error) {
    const messages = Object.values(error.errors).map(err => err.message);
    return new APIError(`Validation failed: ${messages.join(", ")}`, 422);
  }

  /**
   * Create error from Mongoose duplicate key error
   * @param {Object} error - Mongoose duplicate key error
   * @returns {APIError} APIError instance
   */
  static fromMongooseDuplicateKeyError(error) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    return new APIError(`Duplicate ${field}: ${value} already exists`, 409);
  }

  /**
   * Create error from Mongoose cast error
   * @param {Object} error - Mongoose cast error
   * @returns {APIError} APIError instance
   */
  static fromMongooseCastError(error) {
    return new APIError(`Invalid ${error.path}: ${error.value}`, 400);
  }

  /**
   * Create error from JWT error
   * @param {Object} error - JWT error
   * @returns {APIError} APIError instance
   */
  static fromJWTError(error) {
    if (error.name === "JsonWebTokenError") {
      return new APIError("Invalid token", 401);
    }
    if (error.name === "TokenExpiredError") {
      return new APIError("Token expired", 401);
    }
    if (error.name === "NotBeforeError") {
      return new APIError("Token not active", 401);
    }
    return new APIError("Token error", 401);
  }

  /**
   * Check if error is operational
   * @returns {boolean} True if operational error
   */
  isOperationalError() {
    return this.isOperational;
  }

  /**
   * Convert to plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Convert to JSON string
   * @returns {string} JSON string representation
   */
  toJSON() {
    return JSON.stringify({
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
    });
  }
}

export default APIError;