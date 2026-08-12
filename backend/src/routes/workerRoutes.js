const express = require('express');
const { getWorkerComplaints, getWorkerSummary } = require('../controllers/workerController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/worker/complaints
 * @desc    Get assigned complaints for authenticated field worker
 * @access  Private (FIELD_WORKER)
 */
router.get('/complaints', authenticate, authorizeRoles('FIELD_WORKER'), getWorkerComplaints);

/**
 * @route   GET /api/worker/summary
 * @desc    Get operational summary metrics for authenticated field worker
 * @access  Private (FIELD_WORKER)
 */
router.get('/summary', authenticate, authorizeRoles('FIELD_WORKER'), getWorkerSummary);

module.exports = router;
