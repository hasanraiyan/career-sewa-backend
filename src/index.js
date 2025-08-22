import app from "./server.js";
import config from "./config/env.js";
import logger from "./config/logger.js";

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(config.server.port, () => {
  logger.info(`🚀 Server started successfully`, {
    port: config.server.port,
    environment: config.env.NODE_ENV,
    host: config.server.host,
    logLevel: config.logging.level
  });
  
  if (config.env.isDevelopment) {
    logger.info(`📍 Server URL: http://${config.server.host}:${config.server.port}`);
    logger.info(`🏥 Health check: http://${config.server.host}:${config.server.port}/health`);
  }
});
