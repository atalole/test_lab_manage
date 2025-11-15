# Logging Documentation

This project uses Winston for comprehensive logging with file rotation and structured logging.

## Features

- **Multiple Log Levels**: error, warn, info, http, debug
- **File Rotation**: Daily log rotation with automatic cleanup
- **Structured Logging**: JSON format for easy parsing
- **Request Logging**: Automatic HTTP request/response logging
- **Error Tracking**: Comprehensive error logging with stack traces
- **Environment-Aware**: Different log levels for development and production

## Log Levels

1. **error** (0): Error events that might still allow the application to continue
2. **warn** (1): Warning messages for potentially harmful situations
3. **info** (2): Informational messages highlighting the progress of the application
4. **http** (3): HTTP request/response logging
5. **debug** (4): Detailed information for debugging

## Configuration

### Environment Variables

```env
# Log level (error, warn, info, http, debug)
LOG_LEVEL=info

# Enable file logging (true/false)
LOG_TO_FILE=true

# Node environment
NODE_ENV=production
```

### Default Behavior

- **Development**: Console logging only, debug level
- **Production**: Console + file logging, info level
- **File Logging**: Enabled when `LOG_TO_FILE=true` or `NODE_ENV=production`

## Log Files

When file logging is enabled, logs are stored in the `logs/` directory:

- `error-YYYY-MM-DD.log` - Error level logs only
- `combined-YYYY-MM-DD.log` - All log levels
- `http-YYYY-MM-DD.log` - HTTP request/response logs
- `exceptions-YYYY-MM-DD.log` - Uncaught exceptions
- `rejections-YYYY-MM-DD.log` - Unhandled promise rejections

### Log Rotation

- **Max Size**: 20MB per file
- **Retention**: 14 days
- **Compression**: Old logs are automatically zipped

## Usage

### Basic Logging

```typescript
import logger from './config/logger.js';

// Different log levels
logger.error('Error message', { context: 'additional data' });
logger.warn('Warning message', { context: 'additional data' });
logger.info('Info message', { context: 'additional data' });
logger.http('HTTP message', { context: 'additional data' });
logger.debug('Debug message', { context: 'additional data' });
```

### Request Logging

Request logging is automatically enabled via middleware:

```typescript
import { requestLogger } from './middleware/logger.js';

app.use(requestLogger);
```

This logs:

- Request method, URL, IP, user agent
- Request body (for non-GET requests)
- Query parameters
- Response status code
- Response time

### Error Logging

Errors are automatically logged in the error handler:

```typescript
// Server errors (500+) are logged as 'error'
// Client errors (400-499) are logged as 'warn'
```

### Structured Logging

Always include context objects for better log analysis:

```typescript
logger.info('User created', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});
```

## Log Format

### Console Format

```
2024-01-01 12:00:00:000 info: Server is running on port 3000
```

### File Format (JSON)

```json
{
  "timestamp": "2024-01-01 12:00:00:000",
  "level": "info",
  "message": "Server is running on port 3000",
  "port": 3000
}
```

## Best Practices

1. **Use Appropriate Log Levels**

   - `error`: For errors that need attention
   - `warn`: For warnings that might indicate issues
   - `info`: For important application events
   - `http`: For HTTP requests (automatic)
   - `debug`: For detailed debugging information

2. **Include Context**

   ```typescript
   // Good
   logger.error('Failed to create book', {
     isbn: book.isbn,
     error: err.message,
     userId: req.user?.id,
   });

   // Bad
   logger.error('Failed to create book');
   ```

3. **Don't Log Sensitive Data**

   ```typescript
   // Bad - logs passwords
   logger.info('User login', { email, password });

   // Good - excludes sensitive data
   logger.info('User login', { email, userId });
   ```

4. **Use Structured Logging**

   - Always include context objects
   - Use consistent field names
   - Include relevant IDs and timestamps

5. **Log at Appropriate Times**
   - Log at the start of important operations
   - Log errors with full context
   - Log successful operations for audit trails

## Production Considerations

1. **Log Aggregation**: Consider using log aggregation services (ELK, Splunk, Datadog)
2. **Log Retention**: Adjust retention period based on requirements
3. **Log Level**: Use `info` or `warn` in production, avoid `debug`
4. **Monitoring**: Set up alerts for error logs
5. **Performance**: File logging has minimal performance impact

## Viewing Logs

### Development

Logs are displayed in the console with colors.

### Production

View log files:

```bash
# View latest error log
tail -f logs/error-$(date +%Y-%m-%d).log

# View latest combined log
tail -f logs/combined-$(date +%Y-%m-%d).log

# Search logs
grep "error" logs/combined-*.log

# View HTTP logs
tail -f logs/http-$(date +%Y-%m-%d).log
```

## Integration with Monitoring Tools

### ELK Stack

Logs are in JSON format, ready for Elasticsearch ingestion.

### CloudWatch / Datadog

Configure log forwarders to send logs to your monitoring service.

### Sentry

Integrate Sentry for error tracking alongside Winston logs.
