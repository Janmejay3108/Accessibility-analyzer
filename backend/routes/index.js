const express = require('express');
const router = express.Router();

// Import route modules
// const authRoutes = require('./auth');
// const scanRoutes = require('./scans');
// const reportRoutes = require('./reports');
// const userRoutes = require('./users');

// Mount routes
// router.use('/auth', authRoutes);
// router.use('/scans', scanRoutes);
// router.use('/reports', reportRoutes);
// router.use('/users', userRoutes);

// Default API info route
router.get('/', (req, res) => {
  res.json({
    message: 'Accessibility Analyzer API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      scans: '/api/scans',
      reports: '/api/reports',
      users: '/api/users'
    },
    documentation: '/api/docs'
  });
});

module.exports = router;
