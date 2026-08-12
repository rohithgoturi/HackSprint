const Complaint = require('../models/Complaint');
const slaService = require('../services/slaService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const VALID_STATUSES = [
  'REPORTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFIED',
  'CLOSED',
  'REOPENED'
];

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * @route   GET /api/worker/complaints
 * @desc    Get complaints assigned to the authenticated field worker
 * @access  Private (FIELD_WORKER)
 */
const getWorkerComplaints = async (req, res, next) => {
  try {
    const workerId = req.user._id;

    // Strict scoping: filter ONLY by authenticated worker's ID
    const filter = { assignedWorker: workerId };

    // Support optional filters
    if (req.query.status && VALID_STATUSES.includes(req.query.status.toUpperCase())) {
      filter.status = req.query.status.toUpperCase();
    }
    if (req.query.priority && VALID_PRIORITIES.includes(req.query.priority.toUpperCase())) {
      filter.priority = req.query.priority.toUpperCase();
    }

    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name email phone')
      .populate('department', 'name code category')
      .sort({ createdAt: -1 });

    // Evaluate SLA status dynamically
    for (const c of complaints) {
      if (c.sla && c.sla.deadline) {
        const oldStatus = c.sla.status;
        slaService.evaluateSlaStatus(c);
        if (c.sla.status !== oldStatus) {
          await c.save();
        }
      }
    }

    return sendSuccess(res, 200, 'Assigned complaints retrieved successfully', complaints);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/worker/summary
 * @desc    Get operational summary metrics for the authenticated field worker
 * @access  Private (FIELD_WORKER)
 */
const getWorkerSummary = async (req, res, next) => {
  try {
    const workerId = req.user._id;

    const [assigned, inProgress, resolved, overdue] = await Promise.all([
      Complaint.countDocuments({ assignedWorker: workerId, status: 'ASSIGNED' }),
      Complaint.countDocuments({ assignedWorker: workerId, status: 'IN_PROGRESS' }),
      Complaint.countDocuments({ assignedWorker: workerId, status: 'RESOLVED' }),
      Complaint.countDocuments({
        assignedWorker: workerId,
        'sla.deadline': { $lt: new Date() },
        status: { $nin: ['VERIFIED', 'CLOSED'] }
      })
    ]);

    return sendSuccess(res, 200, 'Worker operational summary retrieved', {
      assigned,
      inProgress,
      resolved,
      overdue
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkerComplaints,
  getWorkerSummary
};
