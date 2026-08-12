const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient reference is required']
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: [
          'COMPLAINT_CREATED',
          'COMPLAINT_ANALYZED',
          'COMPLAINT_ASSIGNED',
          'STATUS_CHANGED',
          'RESOLUTION_SUBMITTED',
          'RESOLUTION_VERIFIED',
          'COMPLAINT_REOPENED',
          'COMPLAINT_CLOSED',
          'SLA_WARNING',
          'SLA_BREACHED'
        ],
        message: 'Invalid notification type'
      }
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Database indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

notificationSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
