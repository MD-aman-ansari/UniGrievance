import React from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { 
  FilePlus, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  MapPin, 
  Calendar,
  AlertCircle,
  Building
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentUser, complaints, navigate } = useApp();

  // Filter complaints associated with the student (or show demo student's complaints)
  const myComplaints = complaints.filter(
    (c) => !currentUser || c.studentId === currentUser.id || c.studentEmail === currentUser.email
  );

  const pendingCount = myComplaints.filter((c) => c.status === 'PENDING').length;
  const inProgressCount = myComplaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = myComplaints.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div id="page-student-dashboard" className="space-y-8 pb-12">
      {/* Student Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Student Portal
            </span>
            <span className="text-xs text-slate-400">ID: {currentUser?.studentId || 'STU-2026-894'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {currentUser?.name || 'Student'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {currentUser?.department || 'Department of Engineering'} • Track your active complaints and department SLA milestones.
          </p>
        </div>

        <button
          id="student-dash-lodge-btn"
          onClick={() => navigate('create-complaint')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 flex items-center gap-2 shrink-0 transition-colors"
        >
          <FilePlus className="w-4 h-4" />
          <span>Lodge Grievance</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Filed</span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{myComplaints.length}</p>
          <p className="text-[11px] text-slate-400">All recorded grievances</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Review</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{pendingCount}</p>
          <p className="text-[11px] text-slate-400">Under triage by admin</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Loader2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{inProgressCount}</p>
          <p className="text-[11px] text-slate-400">Assigned to field staff</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{resolvedCount}</p>
          <p className="text-[11px] text-slate-400">Successfully closed</p>
        </div>
      </div>

      {/* Main Grid: Recent Tickets & Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Submissions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Complaints</h2>
              <p className="text-xs text-slate-500">Real-time status updates on your lodged grievances</p>
            </div>
            <button
              id="student-dash-view-all-btn"
              onClick={() => navigate('my-complaints')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {myComplaints.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-700">No grievances filed yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Encountering an issue in your hostel room, lab equipment, or campus facilities? Submit a ticket anytime.
              </p>
              <button
                onClick={() => navigate('create-complaint')}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                Create First Ticket
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myComplaints.slice(0, 4).map((ticket) => (
                <div
                  key={ticket.id}
                  id={`ticket-item-${ticket.id}`}
                  onClick={() => navigate('complaint-details', ticket.id)}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group cursor-pointer hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {ticket.ticketNumber}
                      </span>
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {ticket.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        {ticket.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {ticket.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-xs font-medium text-slate-500 group-hover:text-indigo-600">
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Helpful Campus Guidance */}
        <div className="space-y-4">
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-600" />
              Guidelines for Rapid Resolution
            </h3>
            <ul className="text-xs text-indigo-900/80 space-y-2 list-disc list-inside leading-relaxed">
              <li>Specify exact block number, wing, and floor (e.g., "Hostel 4, Room 204B").</li>
              <li>Include equipment barcodes if reporting lab computer or projector malfunctions.</li>
              <li>Mark <strong>Critical</strong> only for hazards (flooding, electrical sparks, fire risks).</li>
              <li>Check your timeline regularly for technician questions and site visit notices.</li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Campus Help Desks</h4>
            <div className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="font-medium text-slate-900">IT & LAN Support:</span>
                <span>Ext. 4001</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="font-medium text-slate-900">Hostel Maintenance:</span>
                <span>Ext. 2012</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">Emergency Security:</span>
                <span className="font-semibold text-rose-600">Ext. 9999</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
