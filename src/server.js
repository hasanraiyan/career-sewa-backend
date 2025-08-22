import express from "express";
import logger, { requestLogger, loggerUtils } from "./config/logger.js";
import config from "./config/env.js";
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers } from "./middleware/errorHandler.js";
import { APIResponse } from "./utils/index.js";
import healthRoutes from "./routes/healthRoutes.js";

const app = express();

// Request logging middleware
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check routes
app.use("/health", healthRoutes);

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Setup global error handlers for uncaught exceptions and unhandled rejections
setupGlobalErrorHandlers();



export default app;
