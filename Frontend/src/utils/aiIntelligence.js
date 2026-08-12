/**
 * Deterministic AI Intelligence utility for CivicAI.
 * Analyzes issue category, title, description keywords, and location data to simulate AI classification.
 */

export const analyzeIssue = (issue) => {
  if (!issue) return null;

  const category = issue.category || 'Other';
  const descLower = (issue.description || '').toLowerCase();
  const titleLower = (issue.title || '').toLowerCase();
  const text = `${titleLower} ${descLower}`;

  let detectedIssue = category;
  let classifiedCategory = 'Infrastructure';
  let basePriority = 'Medium';
  let recommendedDepartment = 'General Civic Services';
  let baseConfidence = 88;
  let reasoning = 'Issue reported by resident requiring standard municipal review.';

  switch (category) {
    case 'Pothole':
      detectedIssue = 'Pothole Hazard';
      classifiedCategory = 'Road Infrastructure';
      basePriority = 'High';
      recommendedDepartment = 'Roads & Infrastructure';
      baseConfidence = 94;
      reasoning = 'Pothole damage affects vehicle safety and requires timely municipal attention.';
      break;

    case 'Road Damage':
      detectedIssue = 'Road Damage';
      classifiedCategory = 'Infrastructure';
      basePriority = 'High';
      recommendedDepartment = 'Municipal Roads Department';
      baseConfidence = 92;
      reasoning = 'Road damage may affect vehicle safety and requires timely municipal attention.';
      break;

    case 'Garbage Overflow':
      detectedIssue = 'Garbage Overflow';
      classifiedCategory = 'Sanitation';
      basePriority = 'Medium';
      recommendedDepartment = 'Waste Management Department';
      baseConfidence = 89;
      reasoning = 'Overflowing waste can create sanitation concerns and should be addressed promptly.';
      break;

    case 'Broken Streetlight':
      detectedIssue = 'Broken Streetlight';
      classifiedCategory = 'Public Safety / Infrastructure';
      basePriority = 'Medium';
      recommendedDepartment = 'Electrical Maintenance Department';
      baseConfidence = 91;
      reasoning = 'Poor lighting may reduce nighttime visibility and create a public safety concern.';
      break;

    case 'Water Leakage':
      detectedIssue = 'Water Leakage';
      classifiedCategory = 'Water Infrastructure';
      basePriority = 'High';
      recommendedDepartment = 'Water Supply Department';
      baseConfidence = 95;
      reasoning = 'Water leakage may cause infrastructure damage and unnecessary water loss.';
      break;

    case 'Drainage':
      detectedIssue = 'Drainage Issue';
      classifiedCategory = 'Public Infrastructure';
      basePriority = 'High';
      recommendedDepartment = 'Drainage & Sanitation Department';
      baseConfidence = 90;
      reasoning = 'Clogged or damaged drainage leads to localized flooding during rain.';
      break;

    case 'Public Infrastructure':
      detectedIssue = 'Public Infrastructure';
      classifiedCategory = 'Civic Infrastructure';
      basePriority = 'Medium';
      recommendedDepartment = 'Municipal Infrastructure Department';
      baseConfidence = 88;
      reasoning = 'Damaged public amenities require maintenance inspection.';
      break;

    default:
      detectedIssue = 'Civic Maintenance';
      classifiedCategory = 'General Civic Services';
      basePriority = 'Medium';
      recommendedDepartment = 'General Civic Services';
      baseConfidence = 78;
      reasoning = 'General civic issue routed to city service center.';
      break;
  }

  // Keyword-based severity refinement
  const highPriorityKeywords = ['danger', 'accident', 'blocked', 'overflow', 'leaking', 'hazard', 'unsafe', 'collapsed', 'emergency', 'flood'];
  const hasUrgentKeyword = highPriorityKeywords.some(kw => text.includes(kw));

  let finalPriority = basePriority;
  let confidence = baseConfidence;

  if (hasUrgentKeyword && basePriority !== 'High') {
    finalPriority = 'High';
    reasoning += ' Urgent safety keywords detected in resident report description.';
    confidence = Math.min(98, confidence + 3);
  }

  // Location insight generator
  const wardStr = issue.ward || 'District';
  const locationInsight = `Reported in ${wardStr}, where active infrastructure maintenance reports are cataloged for dispatch.`;

  return {
    detectedIssue,
    category: classifiedCategory,
    priority: finalPriority,
    confidence: `${confidence}%`,
    confidenceValue: confidence,
    recommendedDepartment,
    reasoning,
    locationInsight,
    analyzedAt: new Date().toISOString()
  };
};
