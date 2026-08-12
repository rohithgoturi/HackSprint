const express = require('express');
const { getAdminComplaints } = require('../controllers/dashboardController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/admin/complaints
 * @desc    Get dashboard-friendly paginated complaint list for admins
 * @access  Private (ADMIN)
 */
router.get('/complaints', authenticate, authorizeRoles('ADMIN'), getAdminComplaints);

module.exports = router;
