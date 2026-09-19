import React from 'react';
import { ComplaintPriority } from '../types';
import { AlertCircle, AlertTriangle, Flame, Info } from 'lucide-react';

interface Props {
  priority: ComplaintPriority;
}

export const PriorityBadge: React.FC<Props> = ({ priority }) => {
  switch (priority) {
    case 'CRITICAL':
      return (
        <span
          id={`priority-badge-${priority.toLowerCase()}`}
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200"
        >
          <Flame className="w-3 h-3 text-red-600" />
          Critical
        </span>
      );
    case 'HIGH':
      return (
        <span
          id={`priority-badge-${priority.toLowerCase()}`}
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200"
        >
          <AlertTriangle className="w-3 h-3 text-orange-600" />
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          id={`priority-badge-${priority.toLowerCase()}`}
          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200"
        >
          <AlertCircle className="w-3 h-3 text-sky-600" />
          Medium
        </span>
      );
    case 'LOW':
      return (
        <span
          id={`priority-badge-${priority.toLowerCase()}`}
          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
        >
          <Info className="w-3 h-3 text-slate-500" />
          Low
        </span>
      );
    default:
      return null;
  }
};
