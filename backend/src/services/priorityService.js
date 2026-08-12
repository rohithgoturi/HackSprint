/**
 * Deterministic rule-based priority engine for civic complaints with explainability
 * @param {Object} params Inputs for priority determination
 * @param {string} params.severity AI or input severity level ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
 * @param {string} [params.category] Category string
 * @param {Object} [params.location] Geographic location coordinates
 * @param {number} [params.affectedCount] Optional count of affected citizens
 * @param {boolean} [params.isHighPriorityLocation] Optional flag for high priority zone
 * @returns {Object} Structured output containing priority, explanation factors list, and prioritySource
 */
const calculatePriority = ({
  severity,
  category,
  location,
  affectedCount,
  isHighPriorityLocation
}) => {
  const normSeverity = (severity || 'MEDIUM').toUpperCase().trim();
  const factors = [];

  let priority = 'MEDIUM';
  switch (normSeverity) {
    case 'CRITICAL':
      priority = 'CRITICAL';
      factors.push('AI severity recommendation: CRITICAL');
      break;
    case 'HIGH':
      priority = 'HIGH';
      factors.push('AI severity recommendation: HIGH');
      break;
    case 'LOW':
      priority = 'LOW';
      factors.push('AI severity recommendation: LOW');
      break;
    case 'MEDIUM':
    default:
      priority = 'MEDIUM';
      factors.push('AI severity recommendation: MEDIUM');
      break;
  }

  // Optional Factor 1: Multiple citizens affected
  if (typeof affectedCount === 'number' && affectedCount >= 5) {
    factors.push(`Multiple citizens affected (${affectedCount} reports)`);
    if (priority === 'MEDIUM') priority = 'HIGH';
    else if (priority === 'HIGH') priority = 'CRITICAL';
  }

  // Optional Factor 2: High-priority location (e.g., hospital zone, highway, school gate)
  if (isHighPriorityLocation === true) {
    factors.push('High-priority location zone');
    if (priority === 'MEDIUM') priority = 'HIGH';
    else if (priority === 'HIGH') priority = 'CRITICAL';
  }

  return {
    priority,
    explanation: factors,
    prioritySource: 'AI_SEVERITY'
  };
};

module.exports = {
  calculatePriority
};
