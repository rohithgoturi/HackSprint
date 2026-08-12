import React from 'react';

const SectionHeading = ({ title, subtitle, actions, className = '' }) => {
  return (
    <div className={`border-b border-civic-border pb-5 mb-6 flex flex-col md:flex-row md:items-end md:justify-between ${className}`}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-civic-navy sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-civic-muted max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

export default SectionHeading;
