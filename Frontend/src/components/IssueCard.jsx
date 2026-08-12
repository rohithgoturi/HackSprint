import React from 'react';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

const IssueCard = ({ issue, onViewDetails }) => {
  const { id, title, category, description, ward, priority, status, image, createdAt } = issue;
  
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-white border border-civic-border rounded-lg overflow-hidden shadow-civic-subtle hover:shadow-civic-normal transition-all flex flex-col h-full group">
      {image && (
        <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <span className="bg-civic-navy/95 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide font-mono">
              {id}
            </span>
          </div>
        </div>
      )}
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-civic-action tracking-wider uppercase">
            {category}
          </span>
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={priority} />
            <StatusBadge status={status} />
          </div>
        </div>
        
        <h3 className="text-base font-bold text-civic-navy mb-2 line-clamp-1 group-hover:text-civic-action transition-colors">
          {title}
        </h3>
        
        <p className="text-sm text-civic-muted line-clamp-2 mb-4 flex-1">
          {description}
        </p>
        
        <div className="border-t border-civic-light-gray pt-3.5 mt-auto flex items-center justify-between text-xs text-civic-muted">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[120px]">{ward}</span>
          </div>
          <div className="flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
      
      {onViewDetails && (
        <div className="bg-slate-50 border-t border-civic-border px-5 py-2.5 flex justify-end">
          <button 
            onClick={() => onViewDetails(issue)}
            className="text-xs font-semibold text-civic-action hover:text-civic-action-hover focus:outline-none inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            Track Progress <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default IssueCard;
