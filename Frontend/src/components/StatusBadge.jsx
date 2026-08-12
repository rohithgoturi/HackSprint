import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    'Submitted': 'bg-blue-50 text-blue-700 border-blue-100',
    'In Progress': 'bg-amber-50 text-amber-800 border-amber-100',
    'Resolved': 'bg-emerald-50 text-emerald-800 border-emerald-100',
  };

  const currentStyle = styles[status] || 'bg-slate-50 text-slate-700 border-slate-100';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'Submitted' ? 'bg-blue-500' :
        status === 'In Progress' ? 'bg-amber-500' :
        'bg-emerald-500'
      }`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;
