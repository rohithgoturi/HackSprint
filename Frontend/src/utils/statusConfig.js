import { CheckCircle2, Brain, Eye, UserCheck, Wrench, ShieldCheck } from 'lucide-react';

export const STATUS_STAGES = [
  {
    key: 'Reported',
    label: 'Reported',
    order: 1,
    progress: 16,
    icon: CheckCircle2,
    description: 'Your issue has been successfully submitted and is waiting for analysis.',
    nextStep: 'JanSetu AI will analyze your report.'
  },
  {
    key: 'AI Analyzed',
    label: 'AI Analyzed',
    order: 2,
    progress: 33,
    icon: Brain,
    description: 'JanSetu AI has reviewed your report and identified the issue category and priority.',
    nextStep: 'The report is being reviewed for assignment.'
  },
  {
    key: 'Under Review',
    label: 'Under Review',
    order: 3,
    progress: 50,
    icon: Eye,
    description: 'Your report has been reviewed and is awaiting assignment to the appropriate civic team.',
    nextStep: 'The issue will be routed to the appropriate civic department.'
  },
  {
    key: 'Assigned',
    label: 'Assigned',
    order: 4,
    progress: 66,
    icon: UserCheck,
    description: 'Your issue has been assigned to the responsible municipal department.',
    nextStep: 'The responsible team will begin addressing the issue.'
  },
  {
    key: 'In Progress',
    label: 'In Progress',
    order: 5,
    progress: 83,
    icon: Wrench,
    description: 'The responsible team is currently working on the reported issue.',
    nextStep: 'Track this page for resolution updates.'
  },
  {
    key: 'Resolved',
    label: 'Resolved',
    order: 6,
    progress: 100,
    icon: ShieldCheck,
    description: 'The reported issue has been addressed and marked as resolved.',
    nextStep: 'The issue has been marked as resolved.'
  }
];

// Normalize status string helper
export const normalizeStatus = (statusStr) => {
  if (!statusStr) return 'Reported';
  const s = statusStr.toLowerCase().replace(/_/g, ' ').trim();
  if (s.includes('submit') || s === 'reported') return 'Reported';
  if (s.includes('analyz')) return 'AI Analyzed';
  if (s.includes('review')) return 'Under Review';
  if (s.includes('assign')) return 'Assigned';
  if (s.includes('progress') || s.includes('working')) return 'In Progress';
  if (s.includes('resolve') || s.includes('complete')) return 'Resolved';
  return 'Reported';
};

export const getStatusConfig = (statusStr) => {
  const normalized = normalizeStatus(statusStr);
  return STATUS_STAGES.find(stage => stage.key === normalized) || STATUS_STAGES[0];
};

export const getStatusHistory = (issue) => {
  if (!issue) return [];

  const currentNormalized = normalizeStatus(issue.status);
  const currentStage = getStatusConfig(currentNormalized);
  const createdAtDate = issue.createdAt ? new Date(issue.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '12 Aug 2026';
  const createdAtTime = issue.createdAt ? new Date(issue.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '11:42 AM';

  return STATUS_STAGES.map((stage) => {
    const isCompleted = currentNormalized === 'Resolved' ? true : stage.order < currentStage.order;
    const isCurrent = currentNormalized === 'Resolved' ? (stage.key === 'Resolved') : stage.order === currentStage.order;
    const isUpcoming = currentNormalized === 'Resolved' ? false : stage.order > currentStage.order;

    let dateText = 'Pending';
    let detailText = 'Awaiting step execution.';

    if (stage.key === 'Reported') {
      dateText = `${createdAtDate} · ${createdAtTime}`;
      detailText = 'Issue submitted by citizen.';
    } else if (stage.key === 'AI Analyzed' && (isCompleted || isCurrent)) {
      dateText = `${createdAtDate} · AI Engine`;
      detailText = `Issue classified as ${issue.category || 'Maintenance'}.`;
    } else if (stage.key === 'Under Review' && (isCompleted || isCurrent)) {
      dateText = `${createdAtDate} · Dispatch`;
      detailText = `Priority assessed as ${issue.priority || 'Medium'}.`;
    } else if (stage.key === 'Assigned' && (isCompleted || isCurrent)) {
      dateText = issue.assignedAt ? new Date(issue.assignedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : `${createdAtDate}`;
      detailText = `Routed to ${issue.aiAnalysis?.recommendedDepartment || issue.assignedDepartment || 'Municipal Operations'}.`;
    } else if (stage.key === 'In Progress' && (isCompleted || isCurrent)) {
      dateText = `${createdAtDate}`;
      detailText = 'Field crew assigned and working on-site.';
    } else if (stage.key === 'Resolved' && (isCompleted || isCurrent)) {
      dateText = issue.updatedAt ? new Date(issue.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : `${createdAtDate}`;
      detailText = issue.resolutionNote || 'Issue surface repaired and inspected by ward supervisor.';
    }

    return {
      ...stage,
      isCompleted,
      isCurrent,
      isUpcoming,
      dateText,
      detailText
    };
  });
};
