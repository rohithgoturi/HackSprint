const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   GET /api/notifications
 * @desc    Get paginated notifications for the authenticated user
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Pagination query params
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100; // Cap max limit at 100

    const skip = (page - 1) * limit;

    const filter = { recipient: userId };

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate('complaint', 'issue category priority status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 200, 'Notifications retrieved successfully', {
      notifications,
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

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications for authenticated user
 * @access  Private
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({ recipient: userId, isRead: false });

    return sendSuccess(res, 200, 'Unread notification count retrieved', { count });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid notification ID format');
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return sendError(res, 404, 'Notification not found');
    }

    // Recipient authorization check
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied: cannot mark another user\'s notification as read');
    }

    notification.isRead = true;
    await notification.save();

    return sendSuccess(res, 200, 'Notification marked as read', notification.toJSON());
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications for current user as read
 * @access  Private
 */
const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });

    return sendSuccess(res, 200, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead
};
