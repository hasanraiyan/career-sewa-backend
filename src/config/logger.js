import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import config from "./env.js";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, "../../logs");

/**
 * Custom log format for better readability
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "HH:mm:ss",
  }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

/**
 * Create transports based on environment
 */
const createTransports = () => {
  const transports = [];

  // Console transport (always enabled in development)
  if (config.env.isDevelopment || config.env.isTest) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: config.logging.level,
      })
    );
  }

  // File transports for production and development
  if (!config.env.isTest) {
    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.resolve(logsDir, "combined.log"),
        format: logFormat,
        level: config.logging.level,
        maxsize: config.logging.maxSize || "20m",
        maxFiles: config.logging.maxFiles || "14d",
        tailable: true,
      })
    );

    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.resolve(logsDir, "error.log"),
        format: logFormat,
        level: "error",
        maxsize: config.logging.maxSize || "20m",
        maxFiles: config.logging.maxFiles || "14d",
        tailable: true,
      })
    );

    // Warning log file
    transports.push(
      new winston.transports.File({
        filename: path.resolve(logsDir, "warn.log"),
        format: logFormat,
        level: "warn",
        maxsize: config.logging.maxSize || "20m",
        maxFiles: config.logging.maxFiles || "14d",
        tailable: true,
      })
    );
  }

  // Production specific transports
  if (config.env.isProduction) {
    // Console transport for production (minimal)
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        level: "info",
      })
    );
  }

  return transports;
};

/**
 * Create the main logger instance
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: "career-sewa-api",
    environment: config.env.NODE_ENV,
  },
  transports: createTransports(),
  exitOnError: false,
});

/**
 * Handle uncaught exceptions and unhandled rejections
 */
if (!config.env.isTest) {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.resolve(logsDir, "exceptions.log"),
      format: logFormat,
    })
  );

  logger.rejections.handle(
    new winston.transports.File({
      filename: path.resolve(logsDir, "rejections.log"),
      format: logFormat,
    })
  );
}

/**
 * Logger utility functions
 */
const loggerUtils = {
  /**
   * Log HTTP requests
   */
  http: (req, res, responseTime) => {
    const { method, url, ip, headers } = req;
    const { statusCode } = res;
    
    const logData = {
      method,
      url,
      ip,
      statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: headers["user-agent"],
    };

    if (statusCode >= 400) {
      logger.warn("HTTP Request", logData);
    } else {
      logger.info("HTTP Request", logData);
    }
  },

  /**
   * Log database operations
   */
  database: (operation, collection, query = {}, executionTime) => {
    logger.info("Database Operation", {
      operation,
      collection,
      query: JSON.stringify(query),
      executionTime: `${executionTime}ms`,
    });
  },

  /**
   * Log authentication events
   */
  auth: (event, userId, ip, success = true) => {
    const logData = {
      event,
      userId,
      ip,
      success,
      timestamp: new Date().toISOString(),
    };

    if (success) {
      logger.info("Authentication Event", logData);
    } else {
      logger.warn("Authentication Failed", logData);
    }
  },

  /**
   * Log API errors with detailed context
   */
  apiError: (error, req, additionalContext = {}) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      body: req.body,
      params: req.params,
      query: req.query,
      ...additionalContext,
    };

    logger.error("API Error", errorData);
  },

  /**
   * Log performance metrics
   */
  performance: (operation, duration, metadata = {}) => {
    logger.info("Performance Metric", {
      operation,
      duration: `${duration}ms`,
      ...metadata,
    });
  },

  /**
   * Log security events
   */
  security: (event, severity = "warn", context = {}) => {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      ...context,
    };

    logger[severity]("Security Event", logData);
  },
};

/**
 * Create a child logger with additional metadata
 */
const createChildLogger = (metadata = {}) => {
  return logger.child(metadata);
};

/**
 * Express middleware for request logging
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    loggerUtils.http(req, res, duration);
  });
  
  next();
};

export default logger;
export { loggerUtils, createChildLogger, requestLogger };