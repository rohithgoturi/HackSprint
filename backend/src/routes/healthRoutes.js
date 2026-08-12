const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * Health check handler reporting actual backend and MongoDB status
 */
const getHealth = (req, res) => {
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
};

/**
 * @route   GET /api/health
 * @desc    Health check endpoint reporting actual backend and MongoDB status
 * @access  Public
 */
router.get('/health', getHealth);
router.get('/', getHealth);

module.exports = router;

