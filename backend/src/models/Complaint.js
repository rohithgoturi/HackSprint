const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen reference is required']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null
    },
    location: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be >= -90'],
        max: [90, 'Latitude must be <= 90'],
        default: null
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be >= -180'],
        max: [180, 'Longitude must be <= 180'],
        default: null
      }
    },
    issue: {
      type: String,
      default: null,
      trim: true
    },
    category: {
      type: String,
      default: null,
      trim: true
    },
    severity: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        message: 'Invalid severity level'
      },
      default: null
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        message: 'Invalid priority level'
      },
      default: null
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
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
        message: 'Invalid complaint status'
      },
      default: 'REPORTED'
    }
  },
  {
    timestamps: true
  }
);

// Database indexes
complaintSchema.index({ citizen: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ assignedWorker: 1 });
complaintSchema.index({ createdAt: -1 });

/**
 * Transform JSON response
 */
complaintSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
