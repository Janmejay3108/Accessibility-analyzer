const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin SDK
const { initializeFirebase } = require('./config/firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase on startup (optional)
let firebaseInitialized = false;
try {
  initializeFirebase();
  firebaseInitialized = true;
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.warn('⚠️ Firebase not configured - authentication features will be disabled');
  console.warn('Firebase error:', error.message);
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for React app
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false, // Disable COOP to prevent popup issues
  crossOriginResourcePolicy: false // Disable CORP for better compatibility
})); // Security headers

// CORS configuration for production
const parseAllowedOrigins = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const productionAllowedOrigins = (() => {
  const fromEnv = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
  if (fromEnv.length > 0) return fromEnv;

  return [
    process.env.FRONTEND_URL,
    process.env.RAILWAY_STATIC_URL,
    process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : undefined,
    /\.railway\.app$/
  ].filter(Boolean);
})();

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? productionAllowedOrigins
  : ['http://localhost:3001', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    return callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions)); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Accessibility Analyzer API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage()
  });
});

// API routes
app.use('/api', require('./routes/index'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Catch all handler for React Router (must be after API routes)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({
      message: 'Route not found',
      path: req.originalUrl
    });
  });
}

// Firebase configuration check (optional)
if (!process.env.FIREBASE_PROJECT_ID) {
  console.warn('⚠️ Firebase not configured - authentication features will be disabled');
  console.warn('📖 See README.md for Firebase setup instructions');
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);

  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Production URL: http://${process.env.PUBLIC_IP || 'your-server-ip'}`);
    console.log(`📱 Frontend: Serving React build from /frontend/build`);
  }
});

module.exports = app;

