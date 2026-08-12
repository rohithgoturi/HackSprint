const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint reporting actual backend and MongoDB status
 * @access  Public
 */
router.get('/health', (req, res) => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbState = mongoose.connection ? mongoose.connection.readyState : 0;
  const databaseStatus = stateMap[dbState] || 'disconnected';

  return res.status(200).json({
    success: true,
    message: 'Civic platform backend is running',
    database: databaseStatus
  });
});

module.exports = router;
