/**
 * Deterministic rule-based priority engine for civic complaints
 * @param {Object} params Inputs for priority determination
 * @param {string} params.severity Severity level ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
 * @param {string} [params.category] Category string
 * @param {Object} [params.location] Geographic location coordinates
 * @returns {string} Calculated priority level ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
 */
const calculatePriority = ({ severity, category, location }) => {
  const normSeverity = (severity || 'MEDIUM').toUpperCase().trim();

  // Primary rule: Severity mapping
  switch (normSeverity) {
    case 'CRITICAL':
      return 'CRITICAL';
    case 'HIGH':
      return 'HIGH';
    case 'LOW':
      return 'LOW';
    case 'MEDIUM':
    default:
      return 'MEDIUM';
  }
};

module.exports = {
  calculatePriority
};
