const mongoose = require('mongoose');

const complaintUpdateSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint reference is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: [
          'REPORTED',
          'UNDER_REVIEW',
          'ASSIGNED',
          'IN_PROGRESS',
          'RESOLVED',
          'VERIFIED',
          'CLOSED',
          'REOPENED'
        ],
        message: 'Invalid status for complaint update'
      }
    },
    note: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes
complaintUpdateSchema.index({ complaint: 1, createdAt: -1 });

/**
 * Transform JSON response
 */
complaintUpdateSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const ComplaintUpdate = mongoose.model('ComplaintUpdate', complaintUpdateSchema);

module.exports = ComplaintUpdate;
