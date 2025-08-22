import { APIResponse, APIError } from "../utils/index.js";
import config from "../config/env.js";
import logger from "../config/logger.js";
import database from "../config/database.js";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

/**
 * Get basic health check status
 * @route GET /health
 * @access Public
 */
export const getBasicHealth = async (req, res, next) => {
  try {
    logger.info("Basic health check requested");
    
    const healthData = {
      status: "OK",
      service: "career-sewa-api",
      environment: config.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    const response = APIResponse.success(healthData, "Service is healthy");
    return response.send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed system health status
 * @route GET /health/detailed
 * @access Public
 */
export const getDetailedHealth = async (req, res, next) => {
  try {
    logger.info("Detailed health check requested");

    const startTime = Date.now();
    const healthChecks = {};

    // 1. Application Status
    healthChecks.application = {
      status: "healthy",
      name: "career-sewa-api",
      version: process.env.npm_package_version || "1.0.0",
      environment: config.env.NODE_ENV,
      nodeVersion: process.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    // 2. Database Status
    try {
      const dbStatus = database.getConnectionStatus();
      const isHealthy = await database.isHealthy();
      
      healthChecks.database = {
        status: isHealthy ? "healthy" : "unhealthy",
        state: dbStatus.currentState,
        host: dbStatus.host,
        name: dbStatus.name,
        port: dbStatus.port,
        readyState: dbStatus.readyState,
        isConnected: dbStatus.isConnected,
      };

      // Add response time if connected
      if (isHealthy) {
        const pingStart = Date.now();
        await database.isHealthy(); // This includes a ping
        healthChecks.database.responseTime = Date.now() - pingStart;
      }
    } catch (error) {
      healthChecks.database = {
        status: "unhealthy",
        error: error.message,
        state: "error",
      };
    }

    // 3. Memory Usage
    const memoryUsage = process.memoryUsage();
    healthChecks.memory = {
      status: "healthy",
      usage: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      heapUsagePercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    };

    // 4. CPU Information
    try {
      const cpuUsage = process.cpuUsage();
      healthChecks.cpu = {
        status: "healthy",
        usage: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        loadAverage: process.platform !== "win32" ? require("os").loadavg() : "N/A (Windows)",
      };
    } catch (error) {
      healthChecks.cpu = {
        status: "error",
        error: error.message,
      };
    }

    // 5. Disk Space (for non-Windows systems)
    try {
      if (process.platform !== "win32") {
        const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $4,$5}'");
        const [available, used] = stdout.trim().split(" ");
        healthChecks.disk = {
          status: "healthy",
          available,
          used,
        };
      } else {
        healthChecks.disk = {
          status: "skipped",
          reason: "Windows platform - disk check not implemented",
        };
      }
    } catch (error) {
      healthChecks.disk = {
        status: "error",
        error: "Unable to check disk space",
      };
    }

    // 6. Environment Variables Check
    const requiredEnvVars = ["NODE_ENV", "PORT", "MONGODB_URI"];
    const envStatus = requiredEnvVars.every(envVar => process.env[envVar]);
    
    healthChecks.environment = {
      status: envStatus ? "healthy" : "unhealthy",
      requiredVariables: requiredEnvVars.reduce((acc, envVar) => {
        acc[envVar] = !!process.env[envVar];
        return acc;
      }, {}),
      nodeEnv: config.env.NODE_ENV,
      port: config.server.port,
    };

    // 7. Dependencies Status
    try {
      // Read package.json for version information
      const packageJson = await import('../../package.json', { assert: { type: 'json' } });
      
      healthChecks.dependencies = {
        status: "healthy",
        mongoose: packageJson.default.dependencies.mongoose,
        node: process.version,
        npm: process.env.npm_version || "unknown",
        express: packageJson.default.dependencies.express,
        winston: packageJson.default.dependencies.winston,
      };
    } catch (error) {
      // Fallback if package.json import fails
      healthChecks.dependencies = {
        status: "healthy",
        node: process.version,
        npm: process.env.npm_version || "unknown",
        note: "Package.json import not available",
      };
    }

    // 8. External Services (add your external service checks here)
    healthChecks.externalServices = {
      status: "healthy",
      services: {
        // Add checks for external APIs, email services, etc.
        // email: await checkEmailService(),
        // redis: await checkRedisConnection(),
      },
    };

    // 9. Overall Health Calculation
    const overallStatus = calculateOverallHealth(healthChecks);
    const responseTime = Date.now() - startTime;

    const healthResponse = {
      status: overallStatus,
      service: "career-sewa-api",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks: healthChecks,
    };

    // Log health check results
    logger.info("Detailed health check completed", {
      status: overallStatus,
      responseTime,
      checks: Object.keys(healthChecks).reduce((acc, key) => {
        acc[key] = healthChecks[key].status;
        return acc;
      }, {}),
    });

    const response = overallStatus === "healthy" 
      ? APIResponse.success(healthResponse, "All systems operational")
      : APIResponse.success(healthResponse, "Some systems have issues", 207); // 207 Multi-Status

    return response.send(res);
  } catch (error) {
    logger.error("Health check failed", { error: error.message, stack: error.stack });
    next(APIError.internalServerError("Health check failed"));
  }
};

/**
 * Get health check in Kubernetes format
 * @route GET /health/readiness
 * @access Public
 */
export const getReadinessProbe = async (req, res, next) => {
  try {
    // Check if the application is ready to serve traffic
    const isReady = await database.isHealthy();

    if (isReady) {
      const response = APIResponse.success(
        { ready: true, timestamp: new Date().toISOString() },
        "Service is ready"
      );
      return response.send(res);
    } else {
      const response = APIResponse.serviceUnavailable(
        "Service not ready - database not connected",
        { ready: false, timestamp: new Date().toISOString() }
      );
      return response.send(res);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get liveness probe for Kubernetes
 * @route GET /health/liveness
 * @access Public
 */
export const getLivenessProbe = async (req, res, next) => {
  try {
    // Simple check to see if the application is alive
    const response = APIResponse.success(
      { 
        alive: true, 
        uptime: process.uptime(),
        timestamp: new Date().toISOString() 
      },
      "Service is alive"
    );
    return response.send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate overall health status based on individual checks
 * @param {Object} healthChecks - Individual health check results
 * @returns {string} Overall health status
 */
const calculateOverallHealth = (healthChecks) => {
  const criticalServices = ["application", "database"];
  const warningServices = ["memory", "cpu", "environment"];

  // Check critical services
  for (const service of criticalServices) {
    if (healthChecks[service]?.status !== "healthy") {
      return "unhealthy";
    }
  }

  // Check warning services
  for (const service of warningServices) {
    if (healthChecks[service]?.status !== "healthy") {
      return "degraded";
    }
  }

  return "healthy";
};

/**
 * Get health metrics in Prometheus format
 * @route GET /health/metrics
 * @access Public
 */
export const getHealthMetrics = async (req, res, next) => {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const dbStatus = database.getConnectionStatus();
    const isDbHealthy = await database.isHealthy();

    // Prometheus format metrics
    const metrics = [
      `# HELP career_sewa_uptime_seconds Application uptime in seconds`,
      `# TYPE career_sewa_uptime_seconds counter`,
      `career_sewa_uptime_seconds ${uptime}`,
      ``,
      `# HELP career_sewa_memory_usage_bytes Memory usage in bytes`,
      `# TYPE career_sewa_memory_usage_bytes gauge`,
      `career_sewa_memory_usage_bytes{type="rss"} ${memoryUsage.rss}`,
      `career_sewa_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal}`,
      `career_sewa_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed}`,
      `career_sewa_memory_usage_bytes{type="external"} ${memoryUsage.external}`,
      ``,
      `# HELP career_sewa_database_status Database connection status (1=connected, 0=disconnected)`,
      `# TYPE career_sewa_database_status gauge`,
      `career_sewa_database_status ${isDbHealthy ? 1 : 0}`,
      ``,
      `# HELP career_sewa_database_ready_state Database ready state (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`,
      `# TYPE career_sewa_database_ready_state gauge`,
      `career_sewa_database_ready_state ${dbStatus.readyState}`,
      ``,
    ].join("\n");

    res.set("Content-Type", "text/plain");
    res.status(200).send(metrics);
  } catch (error) {
    next(error);
  }
};