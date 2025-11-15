import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';


// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define format for file logging (JSON format for better parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define which transports to use
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format,
  }),
];

// Add file transports in production or when LOG_TO_FILE is enabled
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  // Use process.cwd() for logs directory to work in both dev and production
  const logsDir = path.join(process.cwd(), 'logs');

  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );

  // Combined log file (all levels)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );

  // HTTP request log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format: fileFormat,
  transports,
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.Console({
      format,
    }),
      ...(process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true'
      ? [
          new DailyRotateFile({
            filename: path.join(process.cwd(), 'logs/exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            format: fileFormat,
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
          }),
        ]
      : []),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format,
    }),
      ...(process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true'
      ? [
          new DailyRotateFile({
            filename: path.join(process.cwd(), 'logs/rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            format: fileFormat,
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
          }),
        ]
      : []),
  ],
});

export default logger;

