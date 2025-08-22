/**
 * Example usage of APIResponse and APIError classes
 * This file demonstrates how to use the standardized response and error handling
 */

import { APIResponse, APIError } from "../utils/index.js";

/**
 * Example controller demonstrating successful responses
 */
export const successExamples = {
  // Basic success response
  getUser: (req, res) => {
    const userData = {
      id: 1,
      name: "John Doe",
      email: "john@example.com"
    };
    
    const response = APIResponse.success(userData, "User retrieved successfully");
    return response.send(res);
  },

  // Created response
  createUser: (req, res) => {
    const newUser = {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com"
    };
    
    const response = APIResponse.created(newUser, "User created successfully");
    return response.send(res);
  },

  // No content response
  deleteUser: (req, res) => {
    const response = APIResponse.noContent("User deleted successfully");
    return response.send(res);
  },
};

/**
 * Example controller demonstrating error responses
 */
export const errorExamples = {
  // Bad request
  invalidInput: (req, res, next) => {
    const error = APIError.badRequest("Invalid input data provided");
    return next(error);
  },

  // Not found
  userNotFound: (req, res, next) => {
    const error = APIError.notFound("User not found");
    return next(error);
  },

  // Unauthorized
  accessDenied: (req, res, next) => {
    const error = APIError.unauthorized("Access denied. Please login first");
    return next(error);
  },

  // Validation error
  validationFailed: (req, res, next) => {
    const error = APIError.validationError("Email is required and must be valid");
    return next(error);
  },

  // Conflict
  duplicateEmail: (req, res, next) => {
    const error = APIError.conflict("Email already exists");
    return next(error);
  },

  // Internal server error
  serverError: (req, res, next) => {
    const error = APIError.internalServerError("Something went wrong on our end");
    return next(error);
  },
};

/**
 * Example async controller with try-catch error handling
 */
export const asyncExamples = {
  getUserAsync: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Simulate database operation
      if (!id || isNaN(id)) {
        throw APIError.badRequest("Invalid user ID");
      }
      
      // Simulate user not found
      if (id === "999") {
        throw APIError.notFound("User not found");
      }
      
      // Simulate successful data retrieval
      const user = {
        id: parseInt(id),
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date().toISOString()
      };
      
      const response = APIResponse.success(user, "User retrieved successfully");
      return response.send(res);
      
    } catch (error) {
      next(error);
    }
  },

  createUserAsync: async (req, res, next) => {
    try {
      const { name, email } = req.body;
      
      // Validation
      if (!name || !email) {
        throw APIError.badRequest("Name and email are required");
      }
      
      if (!email.includes("@")) {
        throw APIError.validationError("Invalid email format");
      }
      
      // Simulate duplicate check
      if (email === "existing@example.com") {
        throw APIError.conflict("Email already exists");
      }
      
      // Simulate user creation
      const newUser = {
        id: Math.floor(Math.random() * 1000),
        name,
        email,
        createdAt: new Date().toISOString()
      };
      
      const response = APIResponse.created(newUser, "User created successfully");
      return response.send(res);
      
    } catch (error) {
      next(error);
    }
  },
};

/**
 * Example middleware demonstrating error conversion
 */
export const middlewareExamples = {
  // Validate user input
  validateUserData: (req, res, next) => {
    const { name, email, age } = req.body;
    
    const errors = [];
    
    if (!name || name.length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    
    if (!email || !email.includes("@")) {
      errors.push("Valid email is required");
    }
    
    if (age && (age < 18 || age > 100)) {
      errors.push("Age must be between 18 and 100");
    }
    
    if (errors.length > 0) {
      const error = APIError.validationError(`Validation failed: ${errors.join(", ")}`);
      return next(error);
    }
    
    next();
  },

  // Authentication middleware
  requireAuth: (req, res, next) => {
    const token = req.headers.authorization;
    
    if (!token) {
      const error = APIError.unauthorized("Authorization token is required");
      return next(error);
    }
    
    if (!token.startsWith("Bearer ")) {
      const error = APIError.unauthorized("Invalid token format");
      return next(error);
    }
    
    // Simulate token validation
    const actualToken = token.replace("Bearer ", "");
    if (actualToken !== "valid-token") {
      const error = APIError.unauthorized("Invalid or expired token");
      return next(error);
    }
    
    // Add user to request object
    req.user = {
      id: 1,
      email: "user@example.com"
    };
    
    next();
  },
};

/**
 * Example route definitions
 */
export const exampleRoutes = `
// Import the examples
import { successExamples, errorExamples, asyncExamples, middlewareExamples } from './path/to/examples.js';

// Success examples
app.get('/api/users/:id', successExamples.getUser);
app.post('/api/users', successExamples.createUser);
app.delete('/api/users/:id', successExamples.deleteUser);

// Error examples
app.get('/api/error/bad-request', errorExamples.invalidInput);
app.get('/api/error/not-found', errorExamples.userNotFound);
app.get('/api/error/unauthorized', errorExamples.accessDenied);
app.get('/api/error/validation', errorExamples.validationFailed);
app.get('/api/error/conflict', errorExamples.duplicateEmail);
app.get('/api/error/server-error', errorExamples.serverError);

// Async examples
app.get('/api/async/users/:id', asyncExamples.getUserAsync);
app.post('/api/async/users', middlewareExamples.validateUserData, asyncExamples.createUserAsync);

// Protected route example
app.get('/api/protected/profile', middlewareExamples.requireAuth, (req, res) => {
  const response = APIResponse.success(req.user, 'Profile retrieved successfully');
  return response.send(res);
});
`;