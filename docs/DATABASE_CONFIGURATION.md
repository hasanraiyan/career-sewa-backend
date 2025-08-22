# Database Configuration Documentation

## Overview

The `src/config/database.js` file provides a comprehensive MongoDB connection management system for the Career Sewa application. It integrates seamlessly with the existing environment configuration and logging system.

## Features

### Core Functionality
- **Automatic Connection**: Establishes MongoDB connection on application startup
- **Retry Logic**: Implements exponential backoff retry mechanism with configurable attempts
- **Health Monitoring**: Provides connection status and health checking capabilities
- **Graceful Shutdown**: Handles application termination with proper database disconnection
- **Environment Integration**: Uses configuration from `env.js` for database settings

### Connection Management
- **Connection Events**: Listens for MongoDB connection events (connected, disconnected, error)
- **Process Monitoring**: Handles uncaught exceptions and unhandled rejections
- **Status Tracking**: Maintains real-time connection status information

## Configuration

### Environment Variables
The database configuration uses the following environment variables (defined in `.env`):

```env
MONGODB_URI=mongodb://localhost:27017/career-sewa
MONGODB_TEST_URI=mongodb://localhost:27017/career-sewa-test
```

### Connection Options
The following connection options are configured in `src/config/env.js`:

```javascript
database: {
  uri: process.env.MONGODB_URI,
  testUri: process.env.MONGODB_TEST_URI || process.env.MONGODB_URI,
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
  },
}
```

## Usage

### Basic Import and Connection
```javascript
import database from "./config/database.js";

// Connect to database
await database.connect();

// Check connection status
const status = database.getConnectionStatus();
console.log(status);

// Check if database is healthy
const isHealthy = await database.isHealthy();
```

### Application Integration
The database is automatically initialized in `src/index.js`:

```javascript
// Initialize application
async function startApplication() {
  try {
    // Connect to database first
    await database.connect();
    
    // Setup database indexes if needed
    await database.setupIndexes();
    
    // Start the server
    app.listen(config.server.port, () => {
      // Server started successfully
    });
  } catch (error) {
    // Handle startup errors
  }
}
```

## API Reference

### DatabaseConnection Class

#### Methods

##### `connect()`
Establishes connection to MongoDB with retry logic.
- **Returns**: `Promise<void>`
- **Throws**: Connection errors after max retries exceeded

##### `disconnect()`
Gracefully disconnects from MongoDB.
- **Returns**: `Promise<void>`
- **Throws**: Disconnection errors

##### `getConnectionStatus()`
Returns current connection status information.
- **Returns**: `Object` - Connection status details
```javascript
{
  isConnected: boolean,
  readyState: number,
  host: string,
  port: number,
  name: string,
  currentState: string // "connected", "disconnected", etc.
}
```

##### `isHealthy()`
Checks if database connection is healthy and responsive.
- **Returns**: `Promise<boolean>`
- **Description**: Performs a ping test to verify database responsiveness

##### `setupIndexes()`
Sets up database indexes (extensible for future models).
- **Returns**: `Promise<void>`

### Utility Functions

#### `dbUtils.isValidObjectId(id)`
Validates if a string is a valid MongoDB ObjectId.
- **Parameters**: `id` (string) - ID to validate
- **Returns**: `boolean`

#### `dbUtils.toObjectId(id)`
Converts string to MongoDB ObjectId.
- **Parameters**: `id` (string) - String ID
- **Returns**: `mongoose.Types.ObjectId`

#### `dbUtils.generateObjectId()`
Generates a new MongoDB ObjectId.
- **Returns**: `mongoose.Types.ObjectId`

#### `dbUtils.sanitizeQuery(query)`
Sanitizes query object for logging (removes sensitive fields).
- **Parameters**: `query` (Object) - Query object
- **Returns**: `Object` - Sanitized query

## Health Monitoring

The database configuration integrates with the health monitoring system:

### Health Endpoints
- **GET /health**: Basic health check
- **GET /health/detailed**: Detailed system health including database status
- **GET /health/readiness**: Kubernetes readiness probe
- **GET /health/liveness**: Kubernetes liveness probe
- **GET /health/metrics**: Prometheus metrics

### Database Health Metrics
The health system reports:
- Connection state (connected/disconnected)
- Database host and port
- Response time for database operations
- Ready state status

## Error Handling

### Connection Errors
- Automatic retry with exponential backoff
- Maximum 5 retry attempts by default
- Comprehensive error logging
- Graceful degradation in production

### Runtime Errors
- Process event handlers for uncaught exceptions
- Unhandled promise rejection handling
- Graceful shutdown on application termination

## Security Features

### Connection String Masking
Database connection strings are automatically masked in logs to prevent credential exposure:
```
mongodb://user:****@localhost:27017/database
```

### Query Sanitization
Sensitive fields are automatically removed from logged queries:
- password
- token
- secret
- key

## Production Considerations

### Environment-Specific Behavior
- **Development**: Enhanced logging and debugging information
- **Test**: Uses separate test database URI
- **Production**: Exits process on connection failure

### Monitoring Integration
- Structured logging with Winston
- Prometheus metrics export
- Kubernetes health probes support

## Future Enhancements

The database configuration is designed to be extensible:

1. **Index Management**: Add model-specific indexes in `setupIndexes()`
2. **Connection Pooling**: Adjust pool settings based on load
3. **Replica Sets**: Configure for high availability
4. **Sharding**: Support for horizontal scaling
5. **Monitoring**: Add custom metrics and alerts

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **Authentication Errors**
   - Validate database credentials
   - Check user permissions

3. **Timeout Issues**
   - Adjust `serverSelectionTimeoutMS` and `socketTimeoutMS`
   - Check network latency

### Debug Logging
Enable debug logging by setting `LOG_LEVEL=debug` in your `.env` file.