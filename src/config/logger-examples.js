/**
 * Logger Usage Examples
 * This file demonstrates how to use the Winston logger in various scenarios
 */

import logger, { loggerUtils, createChildLogger } from "./config/logger.js";

/**
 * Basic logging examples
 */
export const basicLoggingExamples = () => {
  // Basic log levels
  logger.info("Application started successfully");
  logger.warn("This is a warning message");
  logger.error("This is an error message");
  logger.debug("Debug information (only shown if LOG_LEVEL=debug)");

  // Logging with metadata
  logger.info("User action", {
    userId: "12345",
    action: "login",
    ip: "192.168.1.1",
    timestamp: new Date().toISOString()
  });

  // Logging errors with stack traces
  try {
    throw new Error("Sample error for demonstration");
  } catch (error) {
    logger.error("Caught an error:", error);
  }
};

/**
 * HTTP request logging examples
 */
export const httpLoggingExamples = () => {
  // Simulate HTTP request logging
  const mockReq = {
    method: "POST",
    url: "/api/v1/users",
    ip: "192.168.1.100",
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  };

  const mockRes = {
    statusCode: 200
  };

  const responseTime = 150;
  loggerUtils.http(mockReq, mockRes, responseTime);
};

/**
 * Database operation logging examples
 */
export const databaseLoggingExamples = () => {
  // Log database operations
  loggerUtils.database("findOne", "users", { email: "user@example.com" }, 25);
  loggerUtils.database("insert", "jobs", { title: "Software Engineer" }, 45);
  loggerUtils.database("update", "profiles", { userId: "12345" }, 30);
};

/**
 * Authentication logging examples
 */
export const authLoggingExamples = () => {
  // Successful authentication
  loggerUtils.auth("login", "user123", "192.168.1.1", true);
  
  // Failed authentication
  loggerUtils.auth("login_attempt", "unknown_user", "192.168.1.1", false);
  
  // Password reset
  loggerUtils.auth("password_reset", "user123", "192.168.1.1", true);
};

/**
 * API error logging examples
 */
export const apiErrorLoggingExamples = () => {
  const mockError = new Error("Validation failed: Email is required");
  mockError.statusCode = 400;

  const mockReq = {
    method: "POST",
    url: "/api/v1/register",
    ip: "192.168.1.1",
    headers: {
      "user-agent": "PostmanRuntime/7.28.4"
    },
    body: { username: "testuser" }, // missing email
    params: {},
    query: {}
  };

  loggerUtils.apiError(mockError, mockReq, {
    attemptedAction: "user_registration",
    validationErrors: ["email_required"]
  });
};

/**
 * Performance logging examples
 */
export const performanceLoggingExamples = () => {
  // Log slow operations
  loggerUtils.performance("database_query", 1250, {
    operation: "complex_join",
    tables: ["users", "profiles", "jobs"]
  });

  // Log API response times
  loggerUtils.performance("api_endpoint", 89, {
    endpoint: "/api/v1/jobs",
    method: "GET",
    cached: false
  });
};

/**
 * Security event logging examples
 */
export const securityLoggingExamples = () => {
  // Suspicious activity
  loggerUtils.security("multiple_failed_logins", "warn", {
    ip: "192.168.1.1",
    attempts: 5,
    timeWindow: "5 minutes"
  });

  // Potential security threat
  loggerUtils.security("sql_injection_attempt", "error", {
    ip: "192.168.1.1",
    query: "'; DROP TABLE users; --",
    blocked: true
  });
};

/**
 * Child logger examples
 */
export const childLoggerExamples = () => {
  // Create a child logger for a specific module
  const userServiceLogger = createChildLogger({
    module: "UserService",
    component: "authentication"
  });

  userServiceLogger.info("Processing user registration");
  userServiceLogger.warn("Email already exists", { email: "user@example.com" });

  // Create a child logger for a specific request
  const requestLogger = createChildLogger({
    requestId: "req_12345",
    userId: "user_67890"
  });

  requestLogger.info("Request started");
  requestLogger.info("Validating input data");
  requestLogger.info("Request completed successfully");
};

/**
 * Run all examples (useful for testing)
 */
export const runAllExamples = () => {
  logger.info("=== Running Logger Examples ===");
  
  logger.info("1. Basic Logging Examples");
  basicLoggingExamples();
  
  logger.info("2. HTTP Logging Examples");
  httpLoggingExamples();
  
  logger.info("3. Database Logging Examples");
  databaseLoggingExamples();
  
  logger.info("4. Authentication Logging Examples");
  authLoggingExamples();
  
  logger.info("5. API Error Logging Examples");
  apiErrorLoggingExamples();
  
  logger.info("6. Performance Logging Examples");
  performanceLoggingExamples();
  
  logger.info("7. Security Logging Examples");
  securityLoggingExamples();
  
  logger.info("8. Child Logger Examples");
  childLoggerExamples();
  
  logger.info("=== Logger Examples Complete ===");
};

// Export default for easy import
export default {
  basicLoggingExamples,
  httpLoggingExamples,
  databaseLoggingExamples,
  authLoggingExamples,
  apiErrorLoggingExamples,
  performanceLoggingExamples,
  securityLoggingExamples,
  childLoggerExamples,
  runAllExamples
};