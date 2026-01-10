const winston = require('winston');
const path = require('path');

const logDir = 'logs';
const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logs directory only in development
const fs = require('fs');
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (error) {
    console.warn('Could not create logs directory:', error.message);
  }
}

// Configure transports based on environment
const transports = [
  // Always include console output
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      consoleFormat
    ),
    silent: process.env.NODE_ENV === 'test'
  })
];

// Only add file transports in development or when filesystem is writable
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760,
      maxFiles: 5,
      tailable: true
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'tarto-server' },
  transports,
  
  // Only handle exceptions/rejections with files in development
  ...(process.env.NODE_ENV !== 'production' && {
    exceptionHandlers: [
      new winston.transports.File({ 
        filename: path.join(logDir, 'exceptions.log'),
        maxsize: 10485760,
        maxFiles: 3
      })
    ],
    
    rejectionHandlers: [
      new winston.transports.File({ 
        filename: path.join(logDir, 'rejections.log'),
        maxsize: 10485760,
        maxFiles: 3
      })
    ]
  })
});

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;