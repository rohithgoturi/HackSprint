const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const ComplaintUpdate = require('../models/ComplaintUpdate');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Allowed status lifecycle transitions
const ALLOWED_TRANSITIONS = {
  REPORTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['VERIFIED', 'REOPENED'],
  VERIFIED: ['CLOSED'],
  CLOSED: [],
  REOPENED: ['UNDER_REVIEW']
};

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

/**
 * @route   POST /api/complaints
 * @desc    Create a new complaint (Citizen only)
 * @access  Private (CITIZEN)
 */
const createComplaint = async (req, res, next) => {
  try {
    const { description, imageUrl, location } = req.body;

    // Validate description
    if (!description || description.trim() === '') {
      return sendError(res, 400, 'Description is required');
    }

    // Validate location if provided
    let locationData = undefined;
    if (location !== undefined && location !== null) {
      const { latitude, longitude } = location;
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        isNaN(latitude) ||
        isNaN(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return sendError(
          res,
          400,
          'Invalid location coordinates. Latitude must be -90 to 90, Longitude must be -180 to 180'
        );
      }
      locationData = { latitude, longitude };
    }

    // Enforce authenticated citizen identity from req.user
    const complaint = await Complaint.create({
      citizen: req.user._id,
      description: description.trim(),
      imageUrl: imageUrl ? imageUrl.trim() : null,
      location: locationData,
      status: 'REPORTED'
    });

    // Create initial lifecycle record
    await ComplaintUpdate.create({
      complaint: complaint._id,
      user: req.user._id,
      status: 'REPORTED',
      note: 'Complaint filed by citizen'
    });

    return sendSuccess(res, 201, 'Complaint submitted successfully', complaint.toJSON());
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/complaints
 * @desc    Get list of complaints filtered by user role and optional filters
 * @access  Private
 */
const getComplaints = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const filter = {};

    // Role-based access scoping
    if (role === 'CITIZEN') {
      filter.citizen = _id;
    } else if (role === 'FIELD_WORKER') {
      filter.assignedWorker = _id;
    }
    // ADMIN has no scope restriction

    // Optional query parameters filter
    if (req.query.status && VALID_STATUSES.includes(req.query.status.toUpperCase())) {
      filter.status = req.query.status.toUpperCase();
    }
    if (req.query.category && typeof req.query.category === 'string') {
      filter.category = req.query.category.trim();
    }
    if (
      req.query.priority &&
      ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(req.query.priority.toUpperCase())
    ) {
      filter.priority = req.query.priority.toUpperCase();
    }

    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name email phone')
      .populate('assignedWorker', 'name email phone')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Complaints retrieved successfully', complaints);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/complaints/:id
 * @desc    Get a single complaint by ID with authorization checks
 * @access  Private
 */
const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid complaint ID format');
    }

    const complaint = await Complaint.findById(id)
      .populate('citizen', 'name email phone')
      .populate('assignedWorker', 'name email phone');

    if (!complaint) {
      return sendError(res, 404, 'Complaint not found');
    }

    // Role authorization check
    const { role, _id } = req.user;
    const userIdStr = _id.toString();

    if (role === 'CITIZEN') {
      const citizenIdStr = complaint.citizen._id
        ? complaint.citizen._id.toString()
        : complaint.citizen.toString();
      if (citizenIdStr !== userIdStr) {
        return sendError(res, 403, 'Access denied: insufficient permissions');
      }
    } else if (role === 'FIELD_WORKER') {
      if (!complaint.assignedWorker) {
        return sendError(res, 403, 'Access denied: insufficient permissions');
      }
      const workerIdStr = complaint.assignedWorker._id
        ? complaint.assignedWorker._id.toString()
        : complaint.assignedWorker.toString();
      if (workerIdStr !== userIdStr) {
        return sendError(res, 403, 'Access denied: insufficient permissions');
      }
    }

    // Fetch update history
    const updates = await ComplaintUpdate.find({ complaint: complaint._id })
      .populate('user', 'name role email')
      .sort({ createdAt: 1 });

    const complaintObj = complaint.toJSON();
    complaintObj.history = updates;

    return sendSuccess(res, 200, 'Complaint details retrieved', complaintObj);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Update complaint status with lifecycle validation
 * @access  Private (ADMIN, FIELD_WORKER)
 */
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid complaint ID format');
    }

    if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
      return sendError(res, 400, 'Valid status is required');
    }

    const targetStatus = status.toUpperCase();

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return sendError(res, 404, 'Complaint not found');
    }

    const { role, _id } = req.user;
    const userIdStr = _id.toString();

    if (role === 'CITIZEN') {
      return sendError(res, 403, 'Access denied: citizens cannot update complaint status');
    }

    // Field workers must be assigned to the complaint
    if (role === 'FIELD_WORKER') {
      if (
        !complaint.assignedWorker ||
        complaint.assignedWorker.toString() !== userIdStr
      ) {
        return sendError(
          res,
          403,
          'Access denied: field workers can only update status for complaints assigned to them'
        );
      }

      // Enforce strict workflow transitions for field workers
      const allowedNext = ALLOWED_TRANSITIONS[complaint.status] || [];
      if (!allowedNext.includes(targetStatus)) {
        return sendError(
          res,
          400,
          `Invalid status transition from ${complaint.status} to ${targetStatus}`
        );
      }
    }

    // Enforce workflow transition logic for Admin (must be valid status transition unless admin correction)
    if (role === 'ADMIN') {
      if (complaint.status === targetStatus) {
        return sendError(res, 400, `Complaint is already in status ${targetStatus}`);
      }
      // Note: Admin has controlled ability to correct workflow state when necessary.
    }

    // Update complaint status
    complaint.status = targetStatus;
    await complaint.save();

    // Create history update record
    const updateRecord = await ComplaintUpdate.create({
      complaint: complaint._id,
      user: req.user._id,
      status: targetStatus,
      note: note ? note.trim() : `Status updated to ${targetStatus}`
    });

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('citizen', 'name email phone')
      .populate('assignedWorker', 'name email phone');

    return sendSuccess(res, 200, 'Complaint status updated successfully', {
      complaint: updatedComplaint.toJSON(),
      updateRecord: updateRecord.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/complaints/:id/assign
 * @desc    Assign field worker to complaint (Admin only)
 * @access  Private (ADMIN)
 */
const assignComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { workerId, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid complaint ID format');
    }

    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
      return sendError(res, 400, 'Valid worker ID is required');
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return sendError(res, 404, 'Complaint not found');
    }

    // Verify target worker
    const worker = await User.findById(workerId);
    if (!worker) {
      return sendError(res, 404, 'Assigned worker not found');
    }

    if (!worker.isActive) {
      return sendError(res, 400, 'Assigned worker account is inactive');
    }

    if (worker.role !== 'FIELD_WORKER') {
      return sendError(res, 400, 'Assigned user must have FIELD_WORKER role');
    }

    // Update complaint
    complaint.assignedWorker = worker._id;
    complaint.status = 'ASSIGNED';
    await complaint.save();

    // Create update history
    const updateRecord = await ComplaintUpdate.create({
      complaint: complaint._id,
      user: req.user._id,
      status: 'ASSIGNED',
      note: note ? note.trim() : `Assigned to worker ${worker.name}`
    });

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('citizen', 'name email phone')
      .populate('assignedWorker', 'name email phone');

    return sendSuccess(res, 200, 'Complaint assigned successfully', {
      complaint: updatedComplaint.toJSON(),
      updateRecord: updateRecord.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint
};
