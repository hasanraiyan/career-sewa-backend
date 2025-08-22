# Winston Logger Implementation

A comprehensive Winston logging solution for the Career Sewa API that integrates with your environment configuration.

## 📋 Features

- **Environment-based Configuration**: Uses settings from `env.js`
- **Multiple Log Levels**: info, warn, error, debug
- **File & Console Logging**: Automatic log rotation and structured output
- **HTTP Request Logging**: Automatic request/response logging middleware
- **Utility Functions**: Specialized logging for database, auth, security, and performance
- **Child Loggers**: Scoped logging with additional metadata
- **Error Handling**: Automatic uncaught exception and rejection handling
- **Production Ready**: Optimized for different environments

## 🚀 Installation

Winston has been installed and configured. The logger is ready to use!

```bash
npm install winston  # Already installed
```

## 📁 File Structure

```
src/
├── config/
│   ├── env.js               # Environment configuration
│   ├── logger.js            # Winston logger configuration
│   └── logger-examples.js   # Usage examples
├── server.js                # Express server with logger integration
└── index.js                 # Application entry point with logger
logs/                        # Log files directory
├── combined.log             # All logs
├── error.log               # Error logs only
├── warn.log                # Warning logs only
├── exceptions.log          # Uncaught exceptions
└── rejections.log          # Unhandled promise rejections
```

## 🔧 Environment Configuration

The logger uses the following environment variables from your `env.js`:

```javascript
// Logging Configuration
logging: {
  level: process.env.LOG_LEVEL || "info",           # Log level
  file: process.env.LOG_FILE || "./logs/app.log",  # Log file path
  maxSize: "20m",                                   # Max file size
  maxFiles: "14d",                                  # Max file retention
}
```

### Environment Variables

```bash
LOG_LEVEL=info          # debug, info, warn, error
LOG_FILE=./logs/app.log # Custom log file path
NODE_ENV=development    # Affects console output and format
```

## 📖 Basic Usage

### Import the Logger

```javascript
import logger from "./config/logger.js";
```

### Basic Logging

```javascript
// Different log levels
logger.info("Application started successfully");
logger.warn("This is a warning message");
logger.error("This is an error message");
logger.debug("Debug information");

// Logging with metadata
logger.info("User action", {
  userId: "12345",
  action: "login",
  ip: "192.168.1.1"
});

// Error logging with stack traces
try {
  throw new Error("Something went wrong");
} catch (error) {
  logger.error("Caught an error:", error);
}
```

## 🛠 Utility Functions

### Import Utilities

```javascript
import { loggerUtils } from "./config/logger.js";
```

### HTTP Request Logging

```javascript
// Automatic via middleware (already integrated)
// Manual logging
loggerUtils.http(req, res, responseTime);
```

### Database Operations

```javascript
loggerUtils.database("findOne", "users", { email: "user@example.com" }, 25);
loggerUtils.database("insert", "jobs", { title: "Software Engineer" }, 45);
```

### Authentication Events

```javascript
// Successful login
loggerUtils.auth("login", "user123", "192.168.1.1", true);

// Failed login attempt
loggerUtils.auth("login_attempt", "unknown_user", "192.168.1.1", false);
```

### API Errors

```javascript
loggerUtils.apiError(error, req, {
  attemptedAction: "user_registration",
  validationErrors: ["email_required"]
});
```

### Performance Monitoring

```javascript
loggerUtils.performance("database_query", 1250, {
  operation: "complex_join",
  tables: ["users", "profiles", "jobs"]
});
```

### Security Events

```javascript
loggerUtils.security("multiple_failed_logins", "warn", {
  ip: "192.168.1.1",
  attempts: 5,
  timeWindow: "5 minutes"
});
```

## 👶 Child Loggers

Create scoped loggers with additional metadata:

```javascript
import { createChildLogger } from "./config/logger.js";

// Create a module-specific logger
const userServiceLogger = createChildLogger({
  module: "UserService",
  component: "authentication"
});

userServiceLogger.info("Processing user registration");

// Create a request-specific logger
const requestLogger = createChildLogger({
  requestId: "req_12345",
  userId: "user_67890"
});
```

## 🌐 Express Middleware

The logger includes automatic HTTP request logging middleware:

```javascript
import { requestLogger } from "./config/logger.js";

// Already integrated in server.js
app.use(requestLogger);
```

This automatically logs:
- HTTP method and URL
- Response status code
- Response time
- Client IP and User-Agent
- Request metadata

## 📊 Log Formats

### Development Environment
```
23:05:15 [info]: 🚀 Server started successfully
{
  "port": 5000,
  "environment": "development",
  "host": "localhost"
}
```

### Production Environment
```json
{
  "timestamp": "2025-08-22 23:05:15",
  "level": "info",
  "message": "🚀 Server started successfully",
  "service": "career-sewa-api",
  "environment": "production",
  "port": 5000
}
```

## 🔄 Log Rotation

Automatic log rotation is configured:
- **Max File Size**: 20MB (configurable)
- **Retention**: 14 days (configurable)
- **Compression**: Automatic for rotated files

## 🎛 Log Levels

| Level | Description | File Output | Console Output |
|-------|-------------|-------------|----------------|
| error | Error messages | ✅ | ✅ |
| warn  | Warning messages | ✅ | ✅ |
| info  | General information | ✅ | ✅ (dev) |
| debug | Debug information | ✅ | ✅ (dev) |

## 🌍 Environment Behavior

### Development
- Console output with colors and formatting
- All log levels to console
- File logging enabled
- Pretty printed JSON metadata

### Production
- Minimal console output (JSON format)
- File logging enabled
- No debug logs to console
- Structured JSON format

### Testing
- Console output only
- No file logging
- Minimal output

## 📝 Examples

Run the provided examples to see the logger in action:

```javascript
import examples from "./config/logger-examples.js";

// Run all examples
examples.runAllExamples();

// Run specific examples
examples.httpLoggingExamples();
examples.databaseLoggingExamples();
```

## 🛡 Error Handling

The logger automatically handles:
- Uncaught exceptions → `logs/exceptions.log`
- Unhandled promise rejections → `logs/rejections.log`
- Process signals (SIGTERM, SIGINT) for graceful shutdown

## 🔍 Monitoring & Debugging

### View Live Logs
```bash
# Watch all logs
tail -f logs/combined.log

# Watch error logs only
tail -f logs/error.log

# Watch with pretty formatting
tail -f logs/combined.log | jq '.'
```

### Search Logs
```bash
# Search for specific user
grep "user123" logs/combined.log

# Search for errors
grep "error" logs/combined.log

# Search for performance issues
grep "performance" logs/combined.log
```

## 🚨 Health Check

The server includes a health check endpoint that uses the logger:

```bash
curl http://localhost:5000/health
```

This will log the request and return server status information.

## 🔧 Customization

### Adding Custom Log Levels
```javascript
const customLogger = winston.createLogger({
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    custom: 5
  }
});
```

### Custom Formatters
```javascript
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);
```

## 📈 Best Practices

1. **Use Appropriate Log Levels**
   - `error`: Actual errors that need attention
   - `warn`: Potential issues or deprecated usage
   - `info`: General application flow
   - `debug`: Detailed information for debugging

2. **Include Context**
   - Always include relevant metadata
   - Use request IDs for tracing
   - Include user information when available

3. **Don't Log Sensitive Data**
   - Never log passwords, tokens, or PII
   - Sanitize user input in logs
   - Use child loggers to scope sensitive operations

4. **Performance Considerations**
   - Use appropriate log levels
   - Avoid excessive logging in tight loops
   - Use child loggers for related operations

## 🐛 Troubleshooting

### No Log Files Created
- Check if `logs/` directory exists
- Verify file permissions
- Check LOG_LEVEL environment variable

### Console Output Missing
- Verify NODE_ENV setting
- Check LOG_LEVEL configuration
- Ensure proper logger import

### Performance Issues
- Reduce log level in production
- Check log file sizes
- Verify log rotation settings

## 🎯 Integration Examples

The logger is already integrated into:
- ✅ Server startup and shutdown
- ✅ HTTP request/response logging
- ✅ Error handling middleware
- ✅ Health check endpoint
- ✅ Graceful shutdown handling

Ready to use in your routes, middleware, and services!