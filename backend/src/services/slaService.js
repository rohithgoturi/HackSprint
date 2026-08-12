const { getSlaHours } = require('../config/slaConfig');

/**
 * Calculate SLA deadline from priority and timestamp
 * @param {string} priority Complaint priority level ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
 * @param {Date|string} [creationDate] Base timestamp (defaults to now)
 * @returns {Object} Calculated SLA object
 */
const calculateSlaDeadline = (priority, creationDate = new Date()) => {
  const targetHours = getSlaHours(priority);
  const baseTime = new Date(creationDate);
  const deadline = new Date(baseTime.getTime() + targetHours * 60 * 60 * 1000);

  return {
    targetHours,
    deadline,
    status: 'ON_TRACK',
    completedAt: null,
    wasBreachedOnCompletion: false
  };
};

/**
 * Dynamically evaluate SLA status for a complaint
 * @param {Object} complaint Mongoose Complaint document
 * @returns {Object|null} Evaluated SLA subdocument object
 */
const evaluateSlaStatus = (complaint) => {
  if (!complaint || !complaint.sla || !complaint.sla.deadline) {
    return null;
  }

  const now = new Date();
  const deadline = new Date(complaint.sla.deadline);

  // If complaint is completed
  if (complaint.status === 'VERIFIED' || complaint.status === 'CLOSED') {
    const completedAt = complaint.sla.completedAt || complaint.updatedAt || now;
    const wasBreached = new Date(completedAt) > deadline;

    complaint.sla.status = 'COMPLETED';
    complaint.sla.completedAt = completedAt;
    complaint.sla.wasBreachedOnCompletion = wasBreached;
  } else {
    // Active complaint: evaluate breach against current time
    if (now > deadline) {
      complaint.sla.status = 'BREACHED';
    } else {
      complaint.sla.status = 'ON_TRACK';
    }
  }

  return complaint.sla;
};

/**
 * Get structured SLA metrics for API responses
 * @param {Object} complaint Complaint document or JSON
 * @returns {Object|null} API formatted SLA details
 */
const getSlaDetails = (complaint) => {
  if (!complaint || !complaint.sla || !complaint.sla.deadline) {
    return null;
  }

  const deadline = new Date(complaint.sla.deadline);
  const now = new Date();
  const remainingMinutes = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60));

  // Determine active status
  let status = complaint.sla.status || 'ON_TRACK';
  if (complaint.status === 'VERIFIED' || complaint.status === 'CLOSED') {
    status = 'COMPLETED';
  } else if (now > deadline) {
    status = 'BREACHED';
  }

  return {
    priority: complaint.priority || 'MEDIUM',
    targetHours: complaint.sla.targetHours || getSlaHours(complaint.priority),
    deadline: complaint.sla.deadline,
    status,
    remainingMinutes
  };
};

module.exports = {
  calculateSlaDeadline,
  evaluateSlaStatus,
  getSlaDetails
};
