# Error Handling System

This document explains how to use the standardized error handling system implemented in this MERN stack backend.

## Overview

The error handling system consists of three main components:

1. **APIResponse** - Standardized response format for all API endpoints
2. **APIError** - Custom error class for application-specific errors
3. **Error Handler Middleware** - Centralized error processing and response formatting

## Files Structure

```
src/
├── utils/
│   ├── APIResponse.js      # Standardized response class
│   ├── APIError.js         # Custom error class
│   └── index.js           # Utility exports
├── middleware/
│   └── errorHandler.js    # Error handling middleware
└── examples/
    └── error-handling-examples.js  # Usage examples
```

## APIResponse Class

The `APIResponse` class provides a consistent format for all API responses.

### Basic Usage

```javascript
import { APIResponse } from './utils/index.js';

// Success response
const response = APIResponse.success(userData, "User retrieved successfully");
response.send(res);

// Error response
const errorResponse = APIResponse.badRequest("Invalid input data");
errorResponse.send(res);
```

### Available Methods

#### Success Responses
- `APIResponse.success(data, message, statusCode)` - Generic success (200)
- `APIResponse.created(data, message)` - Resource created (201)
- `APIResponse.noContent(message)` - No content (204)

#### Error Responses
- `APIResponse.badRequest(message, data)` - Bad request (400)
- `APIResponse.unauthorized(message, data)` - Unauthorized (401)
- `APIResponse.forbidden(message, data)` - Forbidden (403)
- `APIResponse.notFound(message, data)` - Not found (404)
- `APIResponse.conflict(message, data)` - Conflict (409)
- `APIResponse.validationError(message, data)` - Validation error (422)
- `APIResponse.internalServerError(message, data)` - Server error (500)

### Response Format

All responses follow this structure:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## APIError Class

The `APIError` class extends the native Error class and provides standardized error handling.

### Basic Usage

```javascript
import { APIError } from './utils/index.js';

// Throw an error
throw APIError.badRequest("Invalid user input");

// In async functions
try {
  // some operation
} catch (error) {
  throw APIError.internalServerError("Database connection failed");
}
```

### Available Static Methods

#### Client Errors (4xx)
- `APIError.badRequest(message)` - 400
- `APIError.unauthorized(message)` - 401
- `APIError.forbidden(message)` - 403
- `APIError.notFound(message)` - 404
- `APIError.methodNotAllowed(message)` - 405
- `APIError.conflict(message)` - 409
- `APIError.validationError(message)` - 422
- `APIError.tooManyRequests(message)` - 429

#### Server Errors (5xx)
- `APIError.internalServerError(message)` - 500
- `APIError.notImplemented(message)` - 501
- `APIError.badGateway(message)` - 502
- `APIError.serviceUnavailable(message)` - 503
- `APIError.gatewayTimeout(message)` - 504

#### Framework-Specific Errors
- `APIError.fromMongooseValidationError(error)` - Converts Mongoose validation errors
- `APIError.fromMongooseDuplicateKeyError(error)` - Converts Mongoose duplicate key errors
- `APIError.fromMongooseCastError(error)` - Converts Mongoose cast errors
- `APIError.fromJWTError(error)` - Converts JWT errors

## Error Handler Middleware

The error handler middleware provides centralized error processing and automatically converts various error types to standardized responses.

### Features

- **Automatic Error Conversion** - Converts Mongoose, JWT, Multer, and other errors to APIError instances
- **Environment-Aware Logging** - Different log levels and details based on environment
- **Security** - Hides internal error details in production
- **Request Context** - Logs request details with errors for debugging
- **Global Exception Handling** - Catches uncaught exceptions and unhandled rejections

### Integration

The middleware is already integrated in `server.js`:

```javascript
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers } from './middleware/errorHandler.js';

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Setup global error handlers
setupGlobalErrorHandlers();
```

## Usage Patterns

### 1. Controller with Success Response

```javascript
export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      throw APIError.notFound("User not found");
    }
    
    const response = APIResponse.success(user, "User retrieved successfully");
    return response.send(res);
  } catch (error) {
    next(error);
  }
};
```

### 2. Validation Middleware

```javascript
export const validateUserInput = (req, res, next) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    throw APIError.badRequest("Name and email are required");
  }
  
  if (!email.includes("@")) {
    throw APIError.validationError("Invalid email format");
  }
  
  next();
};
```

### 3. Authentication Middleware

```javascript
export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    throw APIError.unauthorized("Authorization token required");
  }
  
  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    throw APIError.unauthorized("Invalid or expired token");
  }
};
```

### 4. Database Operations

```javascript
export const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    
    // Check for existing user
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw APIError.conflict("Email already exists");
    }
    
    const newUser = await User.create(userData);
    
    const response = APIResponse.created(newUser, "User created successfully");
    return response.send(res);
  } catch (error) {
    // Mongoose errors will be automatically converted by the error handler
    next(error);
  }
};
```

## Error Response Examples

### Development Environment

```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "data": {
    "message": "User not found",
    "statusCode": 404,
    "stack": "Error: User not found\n    at getUser (...)",
    "isOperational": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Production Environment

```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Best Practices

1. **Always use try-catch in async functions** and pass errors to `next()`
2. **Use specific error types** instead of generic ones
3. **Provide meaningful error messages** for client debugging
4. **Don't expose sensitive information** in error messages
5. **Log errors with context** for debugging purposes
6. **Use validation middleware** before controller logic
7. **Handle authentication/authorization** at the middleware level

## Logging

The error handler automatically logs errors with the following information:

- Error message and stack trace
- HTTP request details (method, URL, IP, user agent)
- User information (if authenticated)
- Request body (excluding sensitive fields)
- Timestamp and environment

Log levels:
- **ERROR** (500+ status codes) - Server errors with full stack trace
- **WARN** (400-499 status codes) - Client errors
- **INFO** (< 400 status codes) - General request errors

## Testing

You can test the error handling system using the provided examples:

```javascript
// Test endpoints
GET /api/error/bad-request      # 400 error
GET /api/error/not-found        # 404 error
GET /api/error/unauthorized     # 401 error
GET /api/error/validation       # 422 error
GET /api/error/conflict         # 409 error
GET /api/error/server-error     # 500 error
```

See `src/examples/error-handling-examples.js` for complete usage examples.