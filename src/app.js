const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sanitizeData } = require('./middleware/validation');

// Route files
const auth = require('./routes/auth');
const users = require('./routes/users');
const projects = require('./routes/projects');
const tasks = require('./routes/tasks');

const app = express();

// Security middleware
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Compression middleware
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(logger.dev);
} else {
  app.use(logger.prod);
}

// Rate limiting
app.use('/api/', generalLimiter);

// Sanitize data
app.use(sanitizeData);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/projects', projects);
app.use('/api/tasks', tasks);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

module.exports = app;
