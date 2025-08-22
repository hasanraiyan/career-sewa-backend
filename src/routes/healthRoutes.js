import express from "express";
import {
  getBasicHealth,
  getDetailedHealth,
  getReadinessProbe,
  getLivenessProbe,
  getHealthMetrics,
} from "../controllers/healthController.js";

const router = express.Router();

/**
 * @route GET /health
 * @desc Basic health check
 * @access Public
 */
router.get("/", getBasicHealth);

/**
 * @route GET /health/detailed
 * @desc Detailed system health check with comprehensive status
 * @access Public
 */
router.get("/detailed", getDetailedHealth);

/**
 * @route GET /health/readiness
 * @desc Kubernetes readiness probe - checks if service is ready to serve traffic
 * @access Public
 */
router.get("/readiness", getReadinessProbe);

/**
 * @route GET /health/liveness
 * @desc Kubernetes liveness probe - checks if service is alive
 * @access Public
 */
router.get("/liveness", getLivenessProbe);

/**
 * @route GET /health/metrics
 * @desc Health metrics in Prometheus format
 * @access Public
 */
router.get("/metrics", getHealthMetrics);

export default router;