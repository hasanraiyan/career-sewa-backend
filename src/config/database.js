import mongoose from "mongoose";
import config from "./env.js";
import logger from "./logger.js";

/**
 * Database Configuration
 * Handles MongoDB connection setup, events, and connection management
 * Integrates with existing environment configuration and logging system
 */

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Initialize database connection
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      // Use test database URI in test environment
      const dbUri = config.env.isTest ? config.database.testUri : config.database.uri;
      
      logger.info("Attempting to connect to MongoDB...", {
        uri: this.maskConnectionString(dbUri),
        environment: config.env.NODE_ENV,
        options: config.database.options,
      });

      // Set up mongoose connection events before connecting
      this.setupConnectionEvents();

      // Connect to MongoDB
      await mongoose.connect(dbUri, config.database.options);
      
      this.isConnected = true;
      this.connectionRetries = 0;
      
      logger.info("Successfully connected to MongoDB", {
        uri: this.maskConnectionString(dbUri),
        environment: config.env.NODE_ENV,
      });

    } catch (error) {
      logger.error("Failed to connect to MongoDB", {
        error: error.message,
        stack: error.stack,
        uri: this.maskConnectionString(config.database.uri),
        retryAttempt: this.connectionRetries,
      });

      await this.handleConnectionError(error);
    }
  }

  /**
   * Disconnect from database
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (this.isConnected) {
        await mongoose.disconnect();
        this.isConnected = false;
        logger.info("Disconnected from MongoDB");
      }
    } catch (error) {
      logger.error("Error disconnecting from MongoDB", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Setup mongoose connection event listeners
   * @private
   */
  setupConnectionEvents() {
    // Connection successful
    mongoose.connection.on("connected", () => {
      this.isConnected = true;
      logger.info("Mongoose connected to MongoDB");
    });

    // Connection error
    mongoose.connection.on("error", (error) => {
      this.isConnected = false;
      logger.error("Mongoose connection error", {
        error: error.message,
        stack: error.stack,
      });
    });

    // Connection disconnected
    mongoose.connection.on("disconnected", () => {
      this.isConnected = false;
      logger.warn("Mongoose disconnected from MongoDB");
    });

    // Application termination
    process.on("SIGINT", async () => {
      try {
        await this.disconnect();
        logger.info("MongoDB connection closed through app termination");
        process.exit(0);
      } catch (error) {
        logger.error("Error during graceful shutdown", {
          error: error.message,
        });
        process.exit(1);
      }
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at Promise", {
        reason: reason,
        promise: promise,
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });
      
      // Graceful shutdown
      this.disconnect().finally(() => {
        process.exit(1);
      });
    });
  }

  /**
   * Handle connection errors with retry logic
   * @param {Error} error - Connection error
   * @private
   */
  async handleConnectionError(error) {
    this.isConnected = false;
    this.connectionRetries++;

    if (this.connectionRetries <= this.maxRetries) {
      logger.warn(`Retrying database connection in ${this.retryDelay / 1000} seconds...`, {
        attempt: this.connectionRetries,
        maxRetries: this.maxRetries,
      });

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      
      // Exponential backoff
      this.retryDelay *= 1.5;
      
      // Retry connection
      return this.connect();
    } else {
      logger.error("Maximum connection retries exceeded. Unable to connect to MongoDB", {
        maxRetries: this.maxRetries,
        error: error.message,
      });
      
      // In production, we might want to exit the process
      if (config.env.isProduction) {
        process.exit(1);
      }
      
      throw error;
    }
  }

  /**
   * Get connection status
   * @returns {Object} Connection status information
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      states: {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
      },
      currentState: {
        0: "disconnected",
        1: "connected", 
        2: "connecting",
        3: "disconnecting",
      }[mongoose.connection.readyState],
    };
  }

  /**
   * Check if database is connected and healthy
   * @returns {Promise<boolean>} Database health status
   */
  async isHealthy() {
    try {
      if (!this.isConnected || mongoose.connection.readyState !== 1) {
        return false;
      }

      // Ping the database to ensure it's responsive
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      logger.error("Database health check failed", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Mask sensitive information in connection string for logging
   * @param {string} connectionString - MongoDB connection string
   * @returns {string} Masked connection string
   * @private
   */
  maskConnectionString(connectionString) {
    if (!connectionString) return "undefined";
    
    // Replace password in connection string with asterisks
    return connectionString.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
  }

  /**
   * Setup database indexes (call this after connection is established)
   * @returns {Promise<void>}
   */
  async setupIndexes() {
    try {
      logger.info("Setting up database indexes...");
      
      // Add any global indexes here if needed
      // This method can be extended when models are created
      
      logger.info("Database indexes setup completed");
    } catch (error) {
      logger.error("Error setting up database indexes", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

// Create singleton instance
const database = new DatabaseConnection();

// Export both the class and the instance
export { DatabaseConnection };
export default database;

/**
 * Utility functions for database operations
 */
export const dbUtils = {
  /**
   * Check if a string is a valid MongoDB ObjectId
   * @param {string} id - ID to validate
   * @returns {boolean} Whether the ID is valid
   */
  isValidObjectId: (id) => {
    return mongoose.Types.ObjectId.isValid(id);
  },

  /**
   * Convert string to ObjectId
   * @param {string} id - String ID
   * @returns {mongoose.Types.ObjectId} ObjectId instance
   */
  toObjectId: (id) => {
    return new mongoose.Types.ObjectId(id);
  },

  /**
   * Generate a new ObjectId
   * @returns {mongoose.Types.ObjectId} New ObjectId
   */
  generateObjectId: () => {
    return new mongoose.Types.ObjectId();
  },

  /**
   * Sanitize query object for logging (remove sensitive data)
   * @param {Object} query - Query object
   * @returns {Object} Sanitized query
   */
  sanitizeQuery: (query) => {
    const sensitiveFields = ["password", "token", "secret", "key"];
    const sanitized = { ...query };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = "****";
      }
    });
    
    return sanitized;
  },
};