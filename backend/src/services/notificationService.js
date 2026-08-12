const Notification = require('../models/Notification');

/**
 * Reusable helper to generate an in-app notification for a user
 * @param {Object} params Notification parameters
 * @param {string|Object} params.recipient Target User ID or ObjectId
 * @param {string} params.type Notification type enum
 * @param {string} params.title Notification title
 * @param {string} params.message Notification body message
 * @param {string|Object} [params.complaintId] Optional Complaint ID
 * @returns {Promise<Object|null>} Created notification document
 */
const createNotification = async ({ recipient, type, title, message, complaintId }) => {
  try {
    if (!recipient || !type || !title || !message) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      type,
      title: title.trim(),
      message: message.trim(),
      complaint: complaintId || null,
      isRead: false
    });

    return notification;
  } catch (error) {
    console.error(`[Notification Service Error] ${error.message}`);
    // Return null silently without throwing so state transition APIs aren't broken by notification errors
    return null;
  }
};

module.exports = {
  createNotification
};
