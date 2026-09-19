import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ComplaintStatus, ComplaintCategory } from '../types';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  FileText, 
  Calendar, 
  MapPin, 
  ArrowRight,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';

export const MyComplaintsPage: React.FC = () => {
  const { currentUser, complaints, navigate } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Filter complaints for this student
  const studentComplaints = complaints.filter(
    (c) => !currentUser || c.studentId === currentUser.id || c.studentEmail === currentUser.email
  );

  const filtered = studentComplaints.filter((c) => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(studentComplaints.map((c) => c.category)));

  return (
    <div id="page-my-complaints" className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            My Lodged Grievances
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Audit history, responses, and real-time status progression for your campus service requests.
          </p>
        </div>

        <button
          id="my-complaints-new-btn"
          onClick={() => navigate('create-complaint')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Complaint</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="my-complaints-search-input"
              type="text"
              placeholder="Search by ticket number, title, or room location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-56">
            <select
              id="my-complaints-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              id={`filter-status-${st.toLowerCase()}`}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st === 'ALL' ? 'All Tickets' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No matching tickets found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your search query or status filter to see all your grievance records.
          </p>
          {(searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              id={`complaint-card-${ticket.id}`}
              onClick={() => navigate('complaint-details', ticket.id)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                    {ticket.ticketNumber}
                  </span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Filed: {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {ticket.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {ticket.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    {ticket.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {ticket.location}
                  </span>
                  <span className="text-indigo-600 font-medium bg-indigo-50/70 px-2 py-0.5 rounded">
                    Dept: {ticket.assignedDepartment}
                  </span>
                </div>

                <div className="flex items-center gap-1 font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  <span>View Timeline & History</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
