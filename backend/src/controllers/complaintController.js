const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const ComplaintUpdate = require('../models/ComplaintUpdate');
const User = require('../models/User');
const Department = require('../models/Department');
const geminiService = require('../services/geminiService');
const departmentService = require('../services/departmentService');
const priorityService = require('../services/priorityService');
const slaService = require('../services/slaService');
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

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

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

    // Optional query parameters filter
    if (req.query.status && VALID_STATUSES.includes(req.query.status.toUpperCase())) {
      filter.status = req.query.status.toUpperCase();
    }
    if (req.query.category && typeof req.query.category === 'string') {
      filter.category = req.query.category.trim();
    }
    if (
      req.query.priority &&
      VALID_PRIORITIES.includes(req.query.priority.toUpperCase())
    ) {
      filter.priority = req.query.priority.toUpperCase();
    }

    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name email phone')
      .populate('assignedWorker', 'name email phone')
      .populate('department', 'name code category')
      .sort({ createdAt: -1 });

    // Dynamically evaluate SLA status for fetched complaints
    for (const c of complaints) {
      if (c.sla && c.sla.deadline) {
        const oldStatus = c.sla.status;
        slaService.evaluateSlaStatus(c);
        if (c.sla.status !== oldStatus) {
          await c.save();
        }
      }
    }

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
      .populate('assignedWorker', 'name email phone')
      .populate('department', 'name code category');

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

    // Dynamically evaluate SLA status
    if (complaint.sla && complaint.sla.deadline) {
      const oldStatus = complaint.sla.status;
      slaService.evaluateSlaStatus(complaint);
      if (complaint.sla.status !== oldStatus) {
        await complaint.save();
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

    // Enforce workflow transition logic for Admin
    if (role === 'ADMIN') {
      if (complaint.status === targetStatus) {
        return sendError(res, 400, `Complaint is already in status ${targetStatus}`);
      }
    }

    // Update complaint status
    complaint.status = targetStatus;

    // Handle SLA completion if status becomes VERIFIED or CLOSED
    if (targetStatus === 'VERIFIED' || targetStatus === 'CLOSED') {
      if (complaint.sla && complaint.sla.deadline) {
        slaService.evaluateSlaStatus(complaint);
      }
    }

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
      .populate('assignedWorker', 'name email phone')
      .populate('department', 'name code category');

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
      .populate('assignedWorker', 'name email phone')
      .populate('department', 'name code category');

    return sendSuccess(res, 200, 'Complaint assigned successfully', {
      complaint: updatedComplaint.toJSON(),
      updateRecord: updateRecord.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/complaints/:id/analyze
 * @desc    Analyze complaint using Gemini AI, map department, calculate priority & SLA
 * @access  Private (CITIZEN, ADMIN)
 */
const analyzeComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid complaint ID format');
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return sendError(res, 404, 'Complaint not found');
    }

    // Authorization checks
    const { role, _id } = req.user;
    if (role === 'FIELD_WORKER') {
      return sendError(res, 403, 'Access denied: field workers cannot trigger AI analysis');
    }

    if (role === 'CITIZEN') {
      const citizenIdStr = complaint.citizen._id
        ? complaint.citizen._id.toString()
        : complaint.citizen.toString();
      if (citizenIdStr !== _id.toString()) {
        return sendError(res, 403, 'Access denied: insufficient permissions');
      }
    }

    if (!complaint.description || complaint.description.trim() === '') {
      return sendError(res, 400, 'Complaint description is required for AI analysis');
    }

    // Trigger Gemini AI analysis service
    const aiOutput = await geminiService.analyzeComplaint({
      description: complaint.description,
      imageUrl: complaint.imageUrl
    });

    // Map department deterministically
    const department = await departmentService.getDepartmentForCategory(aiOutput.category);

    // Calculate priority using priority engine
    const priorityResult = priorityService.calculatePriority({
      severity: aiOutput.severity,
      category: aiOutput.category,
      location: complaint.location
    });

    // Calculate SLA target hours and deadline from complaint creation date
    const slaResult = slaService.calculateSlaDeadline(priorityResult.priority, complaint.createdAt);

    // Update complaint record
    complaint.issue = aiOutput.issue;
    complaint.category = aiOutput.category;
    complaint.severity = aiOutput.severity;
    complaint.priority = priorityResult.priority;
    complaint.priorityExplanation = priorityResult.explanation;
    complaint.prioritySource = priorityResult.prioritySource;
    complaint.department = department._id;
    complaint.departmentSource = 'RULE_BASED';
    complaint.sla = slaResult;
    complaint.aiAnalysis = {
      issue: aiOutput.issue,
      category: aiOutput.category,
      severity: aiOutput.severity,
      departmentRecommendation: aiOutput.departmentRecommendation,
      reasoning: aiOutput.reasoning,
      analyzedAt: new Date()
    };

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('citizen', 'name email phone')
      .populate('assignedWorker', 'name email phone')
      .populate('department', 'name code category');

    return sendSuccess(res, 200, 'Complaint analyzed successfully', {
      complaint: updatedComplaint.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/complaints/:id/priority
 * @desc    Admin override of complaint priority and SLA recalculation
 * @access  Private (ADMIN)
 */
const overridePriority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priority, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid complaint ID format');
    }

    if (!priority || !VALID_PRIORITIES.includes(priority.toUpperCase())) {
      return sendError(res, 400, 'Valid priority level is required (LOW, MEDIUM, HIGH, CRITICAL)');
    }

    const targetPriority = priority.toUpperCase();

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return sendError(res, 404, 'Complaint not found');
    }

    // Update priority and source
    complaint.priority = targetPriority;
    complaint.prioritySource = 'ADMIN_OVERRIDE';

    const overrideReasonStr = reason && reason.trim() !== ''
      ? `Admin override: ${reason.trim()}`
      : 'Admin priority override';
    
    if (!complaint.priorityExplanation) {
      complaint.priorityExplanation = [];
    }
    complaint.priorityExplanation.push(overrideReasonStr);

    // Recalculate SLA based on new priority target from original creation date
    const newSla = slaService.calculateSlaDeadline(targetPriority, complaint.createdAt);
    complaint.sla = newSla;

    await complaint.save();

    // Create history update record
    const updateRecord = await ComplaintUpdate.create({
      complaint: complaint._id,
      user: req.user._id,
      status: complaint.status,
      note: `Priority overridden to ${targetPriority}. Reason: ${reason || 'Admin action'}`
    });

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('citizen', 'name email phone')
      .populate('assignedWorker', 'name email phone')
      .populate('department', 'name code category');

    return sendSuccess(res, 200, 'Priority overridden successfully', {
      complaint: updatedComplaint.toJSON(),
      updateRecord: updateRecord.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/complaints/:id/department
 * @desc    Admin override of department routing
 * @access  Private (ADMIN)
 */
const overrideDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { departmentId, category, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid complaint ID format');
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return sendError(res, 404, 'Complaint not found');
    }

    let targetDepartment = null;

    if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
      targetDepartment = await Department.findById(departmentId);
      if (!targetDepartment) {
        return sendError(res, 404, 'Target department not found');
      }
    } else if (category && typeof category === 'string') {
      targetDepartment = await departmentService.getDepartmentForCategory(category);
    } else {
      return sendError(res, 400, 'Valid departmentId or category string is required');
    }

    complaint.department = targetDepartment._id;
    complaint.departmentSource = 'ADMIN_OVERRIDE';
    await complaint.save();

    // Create audit history record
    const updateRecord = await ComplaintUpdate.create({
      complaint: complaint._id,
      user: req.user._id,
      status: complaint.status,
      note: `Department updated to ${targetDepartment.name}. Reason: ${reason || 'Admin action'}`
    });

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('citizen', 'name email phone')
      .populate('assignedWorker', 'name email phone')
      .populate('department', 'name code category');

    return sendSuccess(res, 200, 'Department overridden successfully', {
      complaint: updatedComplaint.toJSON(),
      updateRecord: updateRecord.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/complaints/:id/sla
 * @desc    Get SLA metric status and remaining time for a complaint
 * @access  Private
 */
const getComplaintSla = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid complaint ID format');
    }

    const complaint = await Complaint.findById(id);
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

    // Evaluate current SLA status and update if changed
    if (complaint.sla && complaint.sla.deadline) {
      const oldStatus = complaint.sla.status;
      slaService.evaluateSlaStatus(complaint);
      if (complaint.sla.status !== oldStatus) {
        await complaint.save();
      }
    }

    const slaDetails = slaService.getSlaDetails(complaint);

    if (!slaDetails) {
      return sendError(res, 400, 'SLA has not been initialized for this complaint');
    }

    return sendSuccess(res, 200, 'SLA information retrieved', slaDetails);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  analyzeComplaint,
  overridePriority,
  overrideDepartment,
  getComplaintSla
};
