const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

morgan.token('user-id', (req) => {
  return req.user ? req.user._id : 'anonymous';
});

morgan.token('response-time-ms', (req, res) => {
  return Math.round(morgan['response-time'](req, res));
});

const devFormat = ':method :url :status :response-time-ms ms - :res[content-length]';
const prodFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms';

const logger = {
  dev: morgan(devFormat),
  prod: morgan(prodFormat, { stream: accessLogStream }),
  error: (err, req, res, next) => {
    const logMessage = `[${new Date().toISOString()}] ${err.stack || err.message}\n`;
    errorLogStream.write(logMessage);
    next(err);
  }
};

const appLogger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  },
  error: (message, error = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  },
  debug: (message, meta = {}) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
    }
  }
};

module.exports = { logger, appLogger };
