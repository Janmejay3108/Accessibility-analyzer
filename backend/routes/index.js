const express = require('express');
const router = express.Router();

// Import route modules
const analysisRoutes = require('./analysis');

// Mount routes
router.use('/analysis', analysisRoutes);

// Default API info route
router.get('/', (req, res) => {
  res.json({
    message: 'Accessibility Analyzer API',
    version: '1.0.0',
    endpoints: {
      analysis: '/api/analysis'
    },
    documentation: '/api/docs'
  });
});

module.exports = router;
