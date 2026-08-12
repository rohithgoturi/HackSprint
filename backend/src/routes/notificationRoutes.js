const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get paginated notifications for current user
 * @access  Private
 */
router.get('/', authenticate, getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications for current user
 * @access  Private
 */
router.get('/unread-count', authenticate, getUnreadCount);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications for current user as read
 * @access  Private
 */
router.patch('/read-all', authenticate, markAllRead);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
router.patch('/:id/read', authenticate, markAsRead);

module.exports = router;
