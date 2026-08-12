const express = require('express');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  getComplaintTimeline,
  updateComplaintStatus,
  assignComplaint,
  analyzeComplaint,
  overridePriority,
  overrideDepartment,
  getComplaintSla,
  submitResolution,
  getResolutionEvidence,
  verifyResolution,
  closeComplaint
} = require('../controllers/complaintController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/complaints
 * @desc    File a new civic complaint
 * @access  Private (CITIZEN)
 */
router.post('/', authenticate, authorizeRoles('CITIZEN'), createComplaint);

/**
 * @route   GET /api/complaints
 * @desc    Get complaints (scoped by user role)
 * @access  Private
 */
router.get('/', authenticate, getComplaints);

/**
 * @route   GET /api/complaints/:id
 * @desc    Get single complaint details by ID
 * @access  Private
 */
router.get('/:id', authenticate, getComplaintById);

/**
 * @route   GET /api/complaints/:id/timeline
 * @desc    Get chronological timeline events for a complaint
 * @access  Private
 */
router.get('/:id/timeline', authenticate, getComplaintTimeline);

/**
 * @route   GET /api/complaints/:id/sla
 * @desc    Get SLA metric status and remaining time
 * @access  Private
 */
router.get('/:id/sla', authenticate, getComplaintSla);

/**
 * @route   POST /api/complaints/:id/analyze
 * @desc    Analyze complaint using Gemini AI
 * @access  Private (CITIZEN, ADMIN)
 */
router.post('/:id/analyze', authenticate, authorizeRoles('CITIZEN', 'ADMIN'), analyzeComplaint);

/**
 * @route   POST /api/complaints/:id/resolution
 * @desc    Submit resolution evidence for complaint
 * @access  Private (FIELD_WORKER, ADMIN)
 */
router.post('/:id/resolution', authenticate, authorizeRoles('FIELD_WORKER', 'ADMIN'), submitResolution);

/**
 * @route   GET /api/complaints/:id/resolution
 * @desc    Get resolution evidence for complaint
 * @access  Private
 */
router.get('/:id/resolution', authenticate, getResolutionEvidence);

/**
 * @route   PATCH /api/complaints/:id/verify
 * @desc    Approve or reject complaint resolution
 * @access  Private (CITIZEN, ADMIN)
 */
router.patch('/:id/verify', authenticate, authorizeRoles('CITIZEN', 'ADMIN'), verifyResolution);

/**
 * @route   PATCH /api/complaints/:id/close
 * @desc    Close a verified complaint
 * @access  Private (ADMIN)
 */
router.patch('/:id/close', authenticate, authorizeRoles('ADMIN'), closeComplaint);

/**
 * @route   PATCH /api/complaints/:id/priority
 * @desc    Admin override of priority and SLA recalculation
 * @access  Private (ADMIN)
 */
router.patch('/:id/priority', authenticate, authorizeRoles('ADMIN'), overridePriority);

/**
 * @route   PATCH /api/complaints/:id/department
 * @desc    Admin override of department routing
 * @access  Private (ADMIN)
 */
router.patch('/:id/department', authenticate, authorizeRoles('ADMIN'), overrideDepartment);

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Update status of complaint
 * @access  Private (ADMIN, FIELD_WORKER)
 */
router.patch('/:id/status', authenticate, authorizeRoles('ADMIN', 'FIELD_WORKER'), updateComplaintStatus);

/**
 * @route   PATCH /api/complaints/:id/assign
 * @desc    Assign a field worker to complaint
 * @access  Private (ADMIN)
 */
router.patch('/:id/assign', authenticate, authorizeRoles('ADMIN'), assignComplaint);

module.exports = router;
