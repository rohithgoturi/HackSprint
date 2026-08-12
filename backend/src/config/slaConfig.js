/**
 * Configurable SLA targets (in hours) per priority level.
 * Configurable via environment variables or project defaults for hackathon demonstration.
 * Note: These are configurable demo business rules, not official government policy.
 */
const DEFAULT_SLA_HOURS = {
  CRITICAL: parseInt(process.env.SLA_CRITICAL_HOURS, 10) || 4,
  HIGH: parseInt(process.env.SLA_HIGH_HOURS, 10) || 12,
  MEDIUM: parseInt(process.env.SLA_MEDIUM_HOURS, 10) || 24,
  LOW: parseInt(process.env.SLA_LOW_HOURS, 10) || 72
};

/**
 * Get configured SLA target hours for a given priority level
 * @param {string} priority Priority level ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
 * @returns {number} SLA target hours
 */
const getSlaHours = (priority) => {
  const normPriority = (priority || 'MEDIUM').toUpperCase().trim();
  return DEFAULT_SLA_HOURS[normPriority] || DEFAULT_SLA_HOURS.MEDIUM;
};

module.exports = {
  DEFAULT_SLA_HOURS,
  getSlaHours
};
