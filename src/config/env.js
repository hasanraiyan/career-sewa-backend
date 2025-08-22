import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 * Used across the entire application for consistency and type safety
 */

// Validate required environment variables
const requiredEnvVars = ["NODE_ENV", "PORT", "MONGODB_URI"];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

// Environment configuration object
const config = {
  // Application Environment
  env: {
    NODE_ENV: process.env.NODE_ENV,
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    isTest: process.env.NODE_ENV === "test",
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    host: process.env.HOST || "localhost",
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI,
    testUri: process.env.MONGODB_TEST_URI || process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    },
  },

  // JWT Configuration (with defaults for development)
  jwt: {
    secret: process.env.JWT_SECRET || "dev-fallback-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  // CORS Configuration
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf"],
    uploadPath: process.env.UPLOAD_PATH || "./uploads",
  },

  // Email Configuration (optional)
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || "noreply@career-sewa.com",
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    file: process.env.LOG_FILE || "./logs/app.log",
    maxSize: "20m",
    maxFiles: "14d",
  },

  // API Configuration
  api: {
    version: process.env.API_VERSION || "v1",
    prefix: process.env.API_PREFIX || "/api",
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    sessionSecret: process.env.SESSION_SECRET || "dev-session-secret",
    cookieSecret: process.env.COOKIE_SECRET || "dev-cookie-secret",
  },
};

// Validate configuration in production
if (config.env.isProduction) {
  const productionRequiredVars = [
    "JWT_SECRET",
    "SESSION_SECRET",
    "COOKIE_SECRET",
  ];

  const missingProdVars = productionRequiredVars.filter(
    envVar => !process.env[envVar] || process.env[envVar].includes("dev-")
  );

  if (missingProdVars.length > 0) {
    throw new Error(
      `Production environment detected but missing secure values for: ${missingProdVars.join(
        ", "
      )}`
    );
  }
}

// Freeze the configuration object to prevent runtime modifications
Object.freeze(config);

export default config;
