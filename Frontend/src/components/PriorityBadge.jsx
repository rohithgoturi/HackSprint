import React from 'react';

const PriorityBadge = ({ priority }) => {
  const styles = {
    'Low': 'bg-slate-50 text-slate-600 border-slate-200',
    'Medium': 'bg-blue-50 text-blue-700 border-blue-200',
    'High': 'bg-red-50 text-red-700 border-red-200',
  };

  const currentStyle = styles[priority] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border ${currentStyle}`}>
      {priority}
    </span>
  );
};

export default PriorityBadge;
