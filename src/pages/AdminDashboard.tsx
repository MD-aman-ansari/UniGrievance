import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ComplaintStatus } from '../types';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  ArrowRight,
  Download,
  Users,
  Eye
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { complaints, navigate, updateComplaintStatus, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'ALL'>('ALL');

  // Metrics
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'PENDING').length;
  const inProgress = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolved = complaints.filter((c) => c.status === 'RESOLVED').length;
  const criticalOrHigh = complaints.filter((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH').length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Department counts
  const departments = Array.from(new Set(complaints.map((c) => c.assignedDepartment)));

  // Filtered table
  const filtered = complaints.filter((c) => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDept === 'ALL' || c.assignedDepartment === selectedDept;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div id="page-admin-dashboard" className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
              Operations Console
            </span>
            <span className="text-xs text-slate-500">Administrator: {currentUser?.name || 'Dr. Eleanor Vance'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Campus Grievance Oversight &amp; SLA Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitor resolution velocity, assign department tasks, and audit student grievance timelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="admin-export-csv-btn"
            onClick={() => alert('Simulated CSV audit trail export initiated.')}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Security Architecture Callout: RBAC & Privilege Escalation */}
      <div className="bg-indigo-900 text-white rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-300" />
          <h3 className="text-sm font-bold tracking-wide">
            Security Principle: Role-Based Access Control (OWASP A01:2021 — Broken Access Control)
          </h3>
        </div>
        <p className="text-xs text-indigo-200 leading-relaxed">
          In this Level 1 frontend, role views are managed for demonstration. In <strong>Level 4 (Security Middleware)</strong>, the backend will verify JWT claims via <code>authorizeRole(['admin', 'staff'])</code> before serving or mutating department-wide data. Crucially, user roles will be fetched directly from the database or encrypted in signed JWTs—never accepted blindly from user input payloads.
        </p>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campus Workload</span>
          <p className="text-3xl font-extrabold text-slate-900">{total}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>{pending} pending reviews</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Under Remediation</span>
          <p className="text-3xl font-extrabold text-blue-600">{inProgress}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>Dispatched to field staff</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgent Escapes</span>
          <p className="text-3xl font-extrabold text-rose-600">{criticalOrHigh}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>Critical / High priority</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution SLA</span>
          <p className="text-3xl font-extrabold text-emerald-600">{resolutionRate}%</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>{resolved} resolved tickets</span>
          </div>
        </div>
      </div>

      {/* Master Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Campus Complaints Register</h2>
            <p className="text-xs text-slate-500">Search and audit all student tickets across campus facilities</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="admin-search-input"
              type="text"
              placeholder="Search by ticket, student, keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              id="admin-dept-filter"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="admin-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'ALL')}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-3">Ticket</th>
                <th className="py-3 px-3">Subject &amp; Location</th>
                <th className="py-3 px-3">Student</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filtered.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                    {ticket.ticketNumber}
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    <p className="font-semibold text-slate-900 truncate">{ticket.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{ticket.location}</p>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <p className="font-medium text-slate-800">{ticket.studentName}</p>
                    <p className="text-[10px] text-slate-400">{ticket.studentEmail}</p>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                    {ticket.assignedDepartment}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      id={`admin-view-ticket-${ticket.id}`}
                      onClick={() => navigate('complaint-details', ticket.id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs">
              No complaint tickets match the active search and filter criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
