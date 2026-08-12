const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const Department = require('../models/Department');
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
 * @route   GET /api/dashboard/citizen
 * @desc    Get dashboard analytics and recent complaints for authenticated citizen
 * @access  Private (CITIZEN)
 */
const getCitizenDashboard = async (req, res, next) => {
  try {
    const citizenId = req.user._id;

    const [total, reported, inProgress, resolved, closed, recentComplaints, unreadNotifications] =
      await Promise.all([
        Complaint.countDocuments({ citizen: citizenId }),
        Complaint.countDocuments({ citizen: citizenId, status: 'REPORTED' }),
        Complaint.countDocuments({ citizen: citizenId, status: 'IN_PROGRESS' }),
        Complaint.countDocuments({ citizen: citizenId, status: 'RESOLVED' }),
        Complaint.countDocuments({ citizen: citizenId, status: 'CLOSED' }),
        Complaint.find({ citizen: citizenId })
          .populate('department', 'name code category')
          .sort({ createdAt: -1 })
          .limit(5),
        Notification.countDocuments({ recipient: citizenId, isRead: false })
      ]);

    return sendSuccess(res, 200, 'Citizen dashboard metrics retrieved', {
      summary: {
        total,
        reported,
        inProgress,
        resolved,
        closed
      },
      recentComplaints,
      unreadNotifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/worker
 * @desc    Get dashboard analytics and recent assigned complaints for authenticated field worker
 * @access  Private (FIELD_WORKER)
 */
const getWorkerDashboard = async (req, res, next) => {
  try {
    const workerId = req.user._id;

    const [assigned, inProgress, resolved, overdue, recentComplaints] = await Promise.all([
      Complaint.countDocuments({ assignedWorker: workerId, status: 'ASSIGNED' }),
      Complaint.countDocuments({ assignedWorker: workerId, status: 'IN_PROGRESS' }),
      Complaint.countDocuments({ assignedWorker: workerId, status: 'RESOLVED' }),
      Complaint.countDocuments({
        assignedWorker: workerId,
        'sla.deadline': { $lt: new Date() },
        status: { $nin: ['VERIFIED', 'CLOSED'] }
      }),
      Complaint.find({ assignedWorker: workerId })
        .populate('citizen', 'name email phone')
        .populate('department', 'name code category')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Dynamically evaluate SLA status for recent complaints
    for (const c of recentComplaints) {
      if (c.sla && c.sla.deadline) {
        const oldStatus = c.sla.status;
        slaService.evaluateSlaStatus(c);
        if (c.sla.status !== oldStatus) {
          await c.save();
        }
      }
    }

    return sendSuccess(res, 200, 'Worker dashboard metrics retrieved', {
      summary: {
        assigned,
        inProgress,
        resolved,
        overdue
      },
      recentComplaints
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get overall system operational statistics and aggregations for admin
 * @access  Private (ADMIN)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const filter = {};

    // Apply optional filters if query params supplied
    if (req.query.status && VALID_STATUSES.includes(req.query.status.toUpperCase())) {
      filter.status = req.query.status.toUpperCase();
    }
    if (req.query.priority && VALID_PRIORITIES.includes(req.query.priority.toUpperCase())) {
      filter.priority = req.query.priority.toUpperCase();
    }
    if (req.query.category && typeof req.query.category === 'string') {
      filter.category = req.query.category.trim();
    }
    if (req.query.department && mongoose.Types.ObjectId.isValid(req.query.department)) {
      filter.department = new mongoose.Types.ObjectId(req.query.department);
    }

    const [
      totalComplaints,
      reported,
      underReview,
      assigned,
      inProgress,
      resolved,
      verified,
      closed,
      reopened,
      slaBreached,
      byCategoryRaw,
      byDepartmentRaw,
      byPriorityRaw,
      recentComplaints
    ] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.countDocuments({ ...filter, status: 'REPORTED' }),
      Complaint.countDocuments({ ...filter, status: 'UNDER_REVIEW' }),
      Complaint.countDocuments({ ...filter, status: 'ASSIGNED' }),
      Complaint.countDocuments({ ...filter, status: 'IN_PROGRESS' }),
      Complaint.countDocuments({ ...filter, status: 'RESOLVED' }),
      Complaint.countDocuments({ ...filter, status: 'VERIFIED' }),
      Complaint.countDocuments({ ...filter, status: 'CLOSED' }),
      Complaint.countDocuments({ ...filter, status: 'REOPENED' }),
      Complaint.countDocuments({
        ...filter,
        'sla.deadline': { $lt: new Date() },
        status: { $nin: ['VERIFIED', 'CLOSED'] }
      }),
      Complaint.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Complaint.aggregate([
        { $match: filter },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Complaint.aggregate([
        { $match: filter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Complaint.find(filter)
        .populate('citizen', 'name email phone')
        .populate('assignedWorker', 'name email phone')
        .populate('department', 'name code category')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Format category breakdown
    const byCategory = byCategoryRaw.map((item) => ({
      category: item._id || 'unclassified',
      count: item.count
    }));

    // Populate department breakdown
    const departmentIds = byDepartmentRaw
      .map((item) => item._id)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id));
    
    const departmentsMap = {};
    if (departmentIds.length > 0) {
      const depts = await Department.find({ _id: { $in: departmentIds } });
      depts.forEach((d) => {
        departmentsMap[d._id.toString()] = { id: d._id.toString(), name: d.name, code: d.code };
      });
    }

    const byDepartment = byDepartmentRaw.map((item) => ({
      department: item._id ? departmentsMap[item._id.toString()] || { id: item._id.toString(), name: 'Unknown' } : { id: null, name: 'Unassigned' },
      count: item.count
    }));

    // Format priority breakdown
    const byPriority = byPriorityRaw.map((item) => ({
      priority: item._id || 'UNSET',
      count: item.count
    }));

    return sendSuccess(res, 200, 'Admin dashboard metrics retrieved', {
      summary: {
        totalComplaints,
        reported,
        underReview,
        assigned,
        inProgress,
        resolved,
        verified,
        closed,
        reopened,
        slaBreached
      },
      byCategory,
      byDepartment,
      byPriority,
      recentComplaints
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/complaints
 * @desc    Get dashboard-friendly paginated complaints list with filtering
 * @access  Private (ADMIN)
 */
const getAdminComplaints = async (req, res, next) => {
  try {
    const filter = {};

    // Filters
    if (req.query.status && VALID_STATUSES.includes(req.query.status.toUpperCase())) {
      filter.status = req.query.status.toUpperCase();
    }
    if (req.query.priority && VALID_PRIORITIES.includes(req.query.priority.toUpperCase())) {
      filter.priority = req.query.priority.toUpperCase();
    }
    if (req.query.category && typeof req.query.category === 'string') {
      filter.category = req.query.category.trim();
    }
    if (req.query.department && mongoose.Types.ObjectId.isValid(req.query.department)) {
      filter.department = new mongoose.Types.ObjectId(req.query.department);
    }
    if (req.query.assignedWorker && mongoose.Types.ObjectId.isValid(req.query.assignedWorker)) {
      filter.assignedWorker = new mongoose.Types.ObjectId(req.query.assignedWorker);
    }
    if (req.query.slaStatus && typeof req.query.slaStatus === 'string') {
      filter['sla.status'] = req.query.slaStatus.toUpperCase().trim();
    }

    // Pagination
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('citizen', 'name email phone')
        .populate('assignedWorker', 'name email phone')
        .populate('department', 'name code category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Complaint.countDocuments(filter)
    ]);

    // Dynamically evaluate SLA status
    for (const c of complaints) {
      if (c.sla && c.sla.deadline) {
        const oldStatus = c.sla.status;
        slaService.evaluateSlaStatus(c);
        if (c.sla.status !== oldStatus) {
          await c.save();
        }
      }
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 200, 'Admin complaints list retrieved successfully', {
      complaints,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCitizenDashboard,
  getWorkerDashboard,
  getAdminDashboard,
  getAdminComplaints
};
