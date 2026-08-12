const mongoose = require('mongoose');

const resolutionEvidenceSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint reference is required']
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitter user reference is required']
    },
    note: {
      type: String,
      required: [true, 'Resolution note is required'],
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
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: {
        values: ['SUBMITTED', 'APPROVED', 'REJECTED'],
        message: 'Invalid evidence status'
      },
      default: 'SUBMITTED'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
resolutionEvidenceSchema.index({ complaint: 1, submittedAt: -1 });

resolutionEvidenceSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const ResolutionEvidence = mongoose.model('ResolutionEvidence', resolutionEvidenceSchema);

module.exports = ResolutionEvidence;
