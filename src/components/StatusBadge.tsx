import React from 'react';
import { ComplaintStatus } from '../types';
import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  switch (status) {
    case 'PENDING':
      return (
        <span
          id={`status-badge-${status.toLowerCase()}`}
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Pending Review
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span
          id={`status-badge-${status.toLowerCase()}`}
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}
        >
          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span
          id={`status-badge-${status.toLowerCase()}`}
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Resolved
        </span>
      );
    case 'REJECTED':
      return (
        <span
          id={`status-badge-${status.toLowerCase()}`}
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );
    default:
      return null;
  }
};
