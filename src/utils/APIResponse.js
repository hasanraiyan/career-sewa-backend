/**
 * Standardized API Response utility class
 * Provides consistent response format across all API endpoints
 */
class APIResponse {
  /**
   * Create a new API response
   * @param {number} statusCode - HTTP status code
   * @param {any} data - Response data
   * @param {string} message - Response message
   * @param {boolean} success - Success status
   */
  constructor(statusCode, data = null, message = "Success", success = true) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = success;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Create a successful response
   * @param {any} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   * @returns {APIResponse} APIResponse instance
   */
  static success(data = null, message = "Operation successful", statusCode = 200) {
    return new APIResponse(statusCode, data, message, true);
  }

  /**
   * Create a created response (201)
   * @param {any} data - Response data
   * @param {string} message - Success message
   * @returns {APIResponse} APIResponse instance
   */
  static created(data = null, message = "Resource created successfully") {
    return new APIResponse(201, data, message, true);
  }

  /**
   * Create a no content response (204)
   * @param {string} message - Success message
   * @returns {APIResponse} APIResponse instance
   */
  static noContent(message = "No content") {
    return new APIResponse(204, null, message, true);
  }

  /**
   * Create a bad request response (400)
   * @param {string} message - Error message
   * @param {any} data - Error data
   * @returns {APIResponse} APIResponse instance
   */
  static badRequest(message = "Bad request", data = null) {
    return new APIResponse(400, data, message, false);
  }

  /**
   * Create an unauthorized response (401)
   * @param {string} message - Error message
   * @param {any} data - Error data
   * @returns {APIResponse} APIResponse instance
   */
  static unauthorized(message = "Unauthorized", data = null) {
    return new APIResponse(401, data, message, false);
  }

  /**
   * Create a forbidden response (403)
   * @param {string} message - Error message
   * @param {any} data - Error data
   * @returns {APIResponse} APIResponse instance
   */
  static forbidden(message = "Forbidden", data = null) {
    return new APIResponse(403, data, message, false);
  }

  /**
   * Create a not found response (404)
   * @param {string} message - Error message
   * @param {any} data - Error data
   * @returns {APIResponse} APIResponse instance
   */
  static notFound(message = "Resource not found", data = null) {
    return new APIResponse(404, data, message, false);
  }

  /**
   * Create a conflict response (409)
   * @param {string} message - Error message
   * @param {any} data - Error data
   * @returns {APIResponse} APIResponse instance
   */
  static conflict(message = "Conflict", data = null) {
    return new APIResponse(409, data, message, false);
  }

  /**
   * Create a validation error response (422)
   * @param {string} message - Error message
   * @param {any} data - Validation error data
   * @returns {APIResponse} APIResponse instance
   */
  static validationError(message = "Validation failed", data = null) {
    return new APIResponse(422, data, message, false);
  }

  /**
   * Create an internal server error response (500)
   * @param {string} message - Error message
   * @param {any} data - Error data
   * @returns {APIResponse} APIResponse instance
   */
  static internalServerError(message = "Internal server error", data = null) {
    return new APIResponse(500, data, message, false);
  }

  /**
   * Create a service unavailable response (503)
   * @param {string} message - Error message
   * @param {any} data - Error data
   * @returns {APIResponse} APIResponse instance
   */
  static serviceUnavailable(message = "Service unavailable", data = null) {
    return new APIResponse(503, data, message, false);
  }

  /**
   * Send the response using Express response object
   * @param {Object} res - Express response object
   * @returns {Object} Express response
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
    });
  }

  /**
   * Convert to plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
    };
  }

  /**
   * Convert to JSON string
   * @returns {string} JSON string representation
   */
  toJSON() {
    return JSON.stringify(this.toObject());
  }
}

export default APIResponse;