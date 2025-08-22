import app from "./server.js";
import config from "./config/env.js";
import logger from "./config/logger.js";
import database from "./config/database.js";

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  
  // Graceful shutdown
  try {
    if (database.isConnected) {
      await database.disconnect();
    }
  } catch (shutdownError) {
    logger.error('Error during emergency shutdown:', shutdownError);
  }
  
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Graceful shutdown
  try {
    if (database.isConnected) {
      await database.disconnect();
    }
  } catch (shutdownError) {
    logger.error('Error during emergency shutdown:', shutdownError);
  }
  
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    if (database.isConnected) {
      await database.disconnect();
    }
    logger.info('Application shutdown completed');
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    if (database.isConnected) {
      await database.disconnect();
    }
    logger.info('Application shutdown completed');
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
  }
  
  process.exit(0);
});

// Initialize application
async function startApplication() {
  try {
    // Connect to database first
    await database.connect();
    
    // Setup database indexes if needed
    await database.setupIndexes();
    
    // Start the server after successful database connection
    app.listen(config.server.port, () => {
      logger.info(`🚀 Server started successfully`, {
        port: config.server.port,
        environment: config.env.NODE_ENV,
        host: config.server.host,
        logLevel: config.logging.level,
        database: database.getConnectionStatus().currentState
      });
      
      if (config.env.isDevelopment) {
        logger.info(`📍 Server URL: http://${config.server.host}:${config.server.port}`);
        logger.info(`🏥 Health check: http://${config.server.host}:${config.server.port}/health`);
        logger.info(`📊 Detailed health: http://${config.server.host}:${config.server.port}/health/detailed`);
      }
    });
    
  } catch (error) {
    logger.error('Failed to start application', {
      error: error.message,
      stack: error.stack
    });
    
    // Attempt graceful shutdown
    if (database.isConnected) {
      await database.disconnect();
    }
    
    process.exit(1);
  }
}

// Start the application
startApplication();
