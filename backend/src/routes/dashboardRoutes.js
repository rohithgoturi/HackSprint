const express = require('express');
const {
  getCitizenDashboard,
  getWorkerDashboard,
  getAdminDashboard
} = require('../controllers/dashboardController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/dashboard/citizen
 * @desc    Citizen dashboard metrics and recent complaints
 * @access  Private (CITIZEN)
 */
router.get('/citizen', authenticate, authorizeRoles('CITIZEN'), getCitizenDashboard);

/**
 * @route   GET /api/dashboard/worker
 * @desc    Field worker dashboard metrics and assigned complaints
 * @access  Private (FIELD_WORKER)
 */
router.get('/worker', authenticate, authorizeRoles('FIELD_WORKER'), getWorkerDashboard);

/**
 * @route   GET /api/dashboard/admin
 * @desc    Admin dashboard operational statistics and aggregations
 * @access  Private (ADMIN)
 */
router.get('/admin', authenticate, authorizeRoles('ADMIN'), getAdminDashboard);

module.exports = router;
