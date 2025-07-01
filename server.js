const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./src/app');
const connectDB = require('./src/config/database');
const { appLogger } = require('./src/utils/logger');

process.on('uncaughtException', (err) => {
  appLogger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  process.exit(1);
});

connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  appLogger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  appLogger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  appLogger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    appLogger.info('💥 Process terminated!');
  });
});
