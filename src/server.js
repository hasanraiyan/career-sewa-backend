import express from "express";
import logger, { requestLogger, loggerUtils } from "./config/logger.js";
import config from "./config/env.js";

const app = express();

// Request logging middleware
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  logger.info("Health check requested");
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: config.env.NODE_ENV,
    service: "career-sewa-api"
  });
});

// Global error handler
app.use((error, req, res, next) => {
  loggerUtils.apiError(error, req);
  
  const statusCode = error.statusCode || 500;
  const message = config.env.isProduction ? "Internal Server Error" : error.message;
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.env.isDevelopment && { stack: error.stack })
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });
  
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});



export default app;
