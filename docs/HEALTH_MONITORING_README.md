# Health Monitoring System

This document describes the comprehensive health monitoring system implemented for the Career Sewa API.

## Overview

The health monitoring system provides multiple endpoints for different types of health checks, from basic status to detailed system diagnostics. This system is designed to integrate with monitoring tools, load balancers, and orchestration platforms like Kubernetes.

## Endpoints

### 1. Basic Health Check
**Endpoint:** `GET /health`  
**Purpose:** Simple health check for basic monitoring  
**Access:** Public  

**Response Example:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Service is healthy",
  "data": {
    "status": "OK",
    "service": "career-sewa-api",
    "environment": "development",
    "timestamp": "2025-08-22T17:55:58.283Z",
    "uptime": 30.6454946
  },
  "timestamp": "2025-08-22T17:55:58.284Z"
}
```

### 2. Detailed Health Check
**Endpoint:** `GET /health/detailed`  
**Purpose:** Comprehensive system status with detailed diagnostics  
**Access:** Public  

**Features:**
- Application status and version info
- Database connection status and performance
- Memory usage statistics
- CPU information and load averages
- Disk space availability (Linux/Mac)
- Environment variables validation
- Dependencies versions
- External services status

**Response Example:**
```json
{
  "success": true,
  "statusCode": 207,
  "message": "Some systems have issues",
  "data": {
    "status": "unhealthy",
    "service": "career-sewa-api",
    "timestamp": "2025-08-22T17:56:11.189Z",
    "responseTime": "1ms",
    "checks": {
      "application": {
        "status": "healthy",
        "name": "career-sewa-api",
        "version": "1.0.0",
        "environment": "development",
        "nodeVersion": "v23.11.0",
        "uptime": 43.5501465,
        "timestamp": "2025-08-22T17:56:11.188Z"
      },
      "database": {
        "status": "unhealthy",
        "state": "disconnected",
        "collections": 0
      },
      "memory": {
        "status": "healthy",
        "usage": {
          "rss": "61MB",
          "heapTotal": "21MB",
          "heapUsed": "19MB",
          "external": "20MB"
        },
        "heapUsagePercentage": 94
      },
      "cpu": {
        "status": "healthy",
        "usage": {
          "user": 375000,
          "system": 296000
        },
        "loadAverage": "N/A (Windows)"
      },
      "disk": {
        "status": "skipped",
        "reason": "Windows platform - disk check not implemented"
      },
      "environment": {
        "status": "healthy",
        "requiredVariables": {
          "NODE_ENV": true,
          "PORT": true,
          "MONGODB_URI": true
        },
        "nodeEnv": "development",
        "port": 5000
      },
      "dependencies": {
        "status": "healthy",
        "mongoose": "8.18.0",
        "node": "v23.11.0",
        "npm": "unknown"
      },
      "externalServices": {
        "status": "healthy",
        "services": {}
      }
    }
  },
  "timestamp": "2025-08-22T17:56:11.190Z"
}
```

### 3. Liveness Probe
**Endpoint:** `GET /health/liveness`  
**Purpose:** Kubernetes liveness probe - checks if the application is alive  
**Access:** Public  

**Use Case:** Used by Kubernetes to determine if a pod needs to be restarted

**Response Example:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Service is alive",
  "data": {
    "alive": true,
    "uptime": 109.2159545,
    "timestamp": "2025-08-22T17:57:16.854Z"
  },
  "timestamp": "2025-08-22T17:57:16.854Z"
}
```

### 4. Readiness Probe
**Endpoint:** `GET /health/readiness`  
**Purpose:** Kubernetes readiness probe - checks if the service is ready to serve traffic  
**Access:** Public  

**Use Case:** Used by Kubernetes to determine if a pod should receive traffic

**Response Examples:**

**Ready (Database Connected):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Service is ready",
  "data": {
    "ready": true,
    "timestamp": "2025-08-22T17:57:57.097Z"
  },
  "timestamp": "2025-08-22T17:57:57.097Z"
}
```

**Not Ready (Database Disconnected):**
```json
{
  "success": false,
  "statusCode": 503,
  "message": "Service not ready - database not connected",
  "data": {
    "ready": false,
    "timestamp": "2025-08-22T17:57:57.097Z"
  },
  "timestamp": "2025-08-22T17:57:57.097Z"
}
```

### 5. Metrics Endpoint
**Endpoint:** `GET /health/metrics`  
**Purpose:** Prometheus-compatible metrics for monitoring  
**Access:** Public  
**Content-Type:** `text/plain`

**Response Example:**
```
# HELP career_sewa_uptime_seconds Application uptime in seconds
# TYPE career_sewa_uptime_seconds counter
career_sewa_uptime_seconds 8.0193143

# HELP career_sewa_memory_usage_bytes Memory usage in bytes
# TYPE career_sewa_memory_usage_bytes gauge
career_sewa_memory_usage_bytes{type="rss"} 73969664
career_sewa_memory_usage_bytes{type="heap_total"} 36065280
career_sewa_memory_usage_bytes{type="heap_used"} 22661680
career_sewa_memory_usage_bytes{type="external"} 21264011

# HELP career_sewa_database_status Database connection status (1=connected, 0=disconnected)
# TYPE career_sewa_database_status gauge
career_sewa_database_status 0
```

## Health Status Levels

The system uses three main health status levels:

### 1. Healthy
- All critical and warning services are functioning normally
- Database is connected and responsive
- Memory and CPU usage are within normal ranges
- All required environment variables are present

### 2. Degraded
- Critical services are healthy but some warning services have issues
- May include high memory usage, CPU load, or environment configuration issues
- Service can still handle requests but with reduced performance

### 3. Unhealthy
- One or more critical services are failing
- Database is disconnected or unresponsive
- Application cannot function properly
- Traffic should not be routed to this instance

## Critical vs Warning Services

### Critical Services
- **Application**: Core application status
- **Database**: MongoDB connection and responsiveness

### Warning Services
- **Memory**: Memory usage and heap statistics
- **CPU**: CPU usage and load averages
- **Environment**: Environment variable validation

## Integration Examples

### Docker Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1
```

### Kubernetes Probes
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: career-sewa-api
spec:
  containers:
  - name: api
    image: career-sewa-api:latest
    livenessProbe:
      httpGet:
        path: /health/liveness
        port: 5000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health/readiness
        port: 5000
      initialDelaySeconds: 5
      periodSeconds: 5
```

### Load Balancer Health Check
Configure your load balancer to use `/health` endpoint:
- **URL**: `http://your-api/health`
- **Method**: GET
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Success Status**: 200

### Prometheus Configuration
```yaml
scrape_configs:
  - job_name: 'career-sewa-api'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/health/metrics'
    scrape_interval: 15s
```

## Monitoring and Alerting

### Recommended Alerts

1. **Service Down**
   - Trigger: `/health` returns non-200 status
   - Severity: Critical

2. **Database Disconnected**
   - Trigger: `/health/detailed` shows database status as "unhealthy"
   - Severity: Critical

3. **High Memory Usage**
   - Trigger: Heap usage > 90%
   - Severity: Warning

4. **Service Not Ready**
   - Trigger: `/health/readiness` returns 503
   - Severity: Warning

### Grafana Dashboard Queries

**Uptime:**
```promql
career_sewa_uptime_seconds
```

**Memory Usage:**
```promql
career_sewa_memory_usage_bytes{type="heap_used"} / career_sewa_memory_usage_bytes{type="heap_total"} * 100
```

**Database Status:**
```promql
career_sewa_database_status
```

## Logging

All health check requests are automatically logged with:
- Request details (IP, user agent, endpoint)
- Response time
- Health status results
- Any errors or warnings

Health check logs can be found in the application logs with the following patterns:
- `"Basic health check requested"`
- `"Detailed health check requested"`
- `"Detailed health check completed"`

## Security Considerations

- Health endpoints are public by design for monitoring purposes
- Sensitive information is not exposed in health responses
- Database connection strings and secrets are not included in responses
- Stack traces are only shown in development environment

## Performance Impact

- **Basic Health Check**: Minimal performance impact (~1-5ms)
- **Detailed Health Check**: Low performance impact (~10-50ms)
- **Liveness Probe**: Minimal performance impact (~1-5ms)
- **Readiness Probe**: Low performance impact (includes database ping)
- **Metrics**: Minimal performance impact (~1-5ms)

All health checks are designed to be lightweight and safe to call frequently.