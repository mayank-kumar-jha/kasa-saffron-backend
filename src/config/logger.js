import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const transports = [];

// Vercel's filesystem is read-only, so we cannot write log files there.
if (!process.env.VERCEL) {
  transports.push(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  transports.push(new winston.transports.File({ filename: 'logs/combined.log' }));
}

// Always log to console (Vercel captures this in their dashboard)
transports.push(new winston.transports.Console({
  format: process.env.NODE_ENV !== 'production' ? combine(colorize(), myFormat) : myFormat,
}));

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    myFormat
  ),
  transports,
});

export default logger;
