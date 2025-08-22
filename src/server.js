import express from "express";
import cors from "cors";
import logger, { requestLogger, loggerUtils } from "./config/logger.js";
import config from "./config/env.js";
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers } from "./middleware/errorHandler.js";
import { APIResponse } from "./utils/index.js";
import healthRoutes from "./routes/healthRoutes.js";

const app = express();

// CORS configuration - Allow all origins
const corsOptions = {
  origin: "*", // Allow all origins
  credentials: false, // Set to false when using wildcard origin
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "X-Requested-With"
  ],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Security and middleware logging
logger.info("CORS middleware configured", {
  origin: corsOptions.origin,
  credentials: corsOptions.credentials,
  methods: corsOptions.methods
});

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
