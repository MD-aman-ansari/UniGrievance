import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  FilePlus, 
  Search, 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Sparkles,
  Building,
  Laptop,
  BookOpen,
  Coffee,
  AlertCircle
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate, currentUser, loginAs, complaints } = useApp();

  const categories = [
    { title: 'Hostel & Housing', icon: Building, desc: 'Plumbing, electricity, room amenities, hygiene' },
    { title: 'IT & Lab Equipment', icon: Laptop, desc: 'Projectors, LAN, Wi-Fi, computer labs, software' },
    { title: 'Library Services', icon: BookOpen, desc: 'Book availability, catalog fines, quiet study zones' },
    { title: 'Dining & Cafeteria', icon: Coffee, desc: 'Food quality, pricing, cleanliness, menu concerns' },
  ];

  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'PENDING').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;

  return (
    <div id="page-home" className="space-y-12 pb-16">
      {/* Educational Milestone Notice */}
      <div className="bg-indigo-900 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-indigo-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-indigo-800/80 rounded-xl text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded border border-indigo-400/30">
                  Level 1 Foundation
                </span>
                <span className="text-xs text-indigo-300">Client-Side Architecture</span>
              </div>
              <h3 className="font-semibold text-base sm:text-lg text-white mt-1">
                Student Complaint & Service Management System
              </h3>
              <p className="text-xs sm:text-sm text-indigo-200 mt-0.5">
                8 complete responsive views connected with React state. All pages, forms, lists, and role views are interactive.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="demo-student-quickstart-btn"
              onClick={() => loginAs('student')}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold transition-colors"
            >
              Enter as Student
            </button>
            <button
              id="demo-admin-quickstart-btn"
              onClick={() => loginAs('admin')}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
            >
              Enter as Admin
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto pt-6 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          Transparent & Accountable Grievance Resolution
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Campus Service & Complaint Management
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Lodge your academic, hostel, and infrastructure grievances with transparency.
          Track status in real-time with automated SLA departmental assignment.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {currentUser ? (
            <>
              <button
                id="hero-file-complaint-btn"
                onClick={() => navigate('create-complaint')}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
              >
                <FilePlus className="w-4 h-4" />
                Lodge a Complaint
              </button>
              <button
                id="hero-view-my-complaints-btn"
                onClick={() => navigate(currentUser.role === 'admin' ? 'admin-dashboard' : 'my-complaints')}
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-sm transition-all flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {currentUser.role === 'admin' ? 'Open Admin Console' : 'Track My Complaints'}
              </button>
            </>
          ) : (
            <>
              <button
                id="hero-login-btn"
                onClick={() => navigate('login')}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
              >
                Sign In to Portal
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                id="hero-register-btn"
                onClick={() => navigate('register')}
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-sm transition-all"
              >
                Create Student Account
              </button>
            </>
          )}
        </div>
      </section>

      {/* Real-time System Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FilePlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
            <p className="text-xs text-slate-500 font-medium">Total Tickets Registered</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
            <p className="text-xs text-slate-500 font-medium">Pending Department Review</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{resolvedCount}</p>
            <p className="text-xs text-slate-500 font-medium">Resolved Satisfactorily</p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200 max-w-5xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-slate-900">How the Service Lifecycle Works</h2>
          <p className="text-sm text-slate-600 mt-1">
            Every grievance follows an auditable lifecycle from submission to resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
              1
            </div>
            <h3 className="font-semibold text-slate-900">Lodge Grievance</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select category, provide exact location, severity level, and description. Instant ticket reference is generated.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
              2
            </div>
            <h3 className="font-semibold text-slate-900">Department Routing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Assigned to designated authorities (e.g. HVAC, IT Labs, Hostel Warden) with status updates at each step.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
              3
            </div>
            <h3 className="font-semibold text-slate-900">Resolution & Audit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Staff logs resolution notes, time taken is tracked, and ticket closure is verified with student confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Supported Campus Services</h2>
            <p className="text-xs text-slate-500">Categories covered under the campus service level agreement</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const IconComponent = cat.icon;
            return (
              <div 
                key={i} 
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all space-y-2 group cursor-pointer"
                onClick={() => {
                  if (currentUser?.role === 'student') navigate('create-complaint');
                  else loginAs('student');
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <IconComponent className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm">{cat.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* All Pages Quick Navigator (Level 1 Exploration Helper) */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Level 1 Page Directory (Interactive Wireframes)
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Click any page below to inspect its layout, responsive design, and mock interaction state:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            id="quick-nav-home"
            onClick={() => navigate('home')}
            className="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-indigo-50 hover:border-indigo-300 font-medium text-slate-700"
          >
            1. Home Page
          </button>
          <button
            id="quick-nav-register"
            onClick={() => navigate('register')}
            className="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-indigo-50 hover:border-indigo-300 font-medium text-slate-700"
          >
            2. Register Page
          </button>
          <button
            id="quick-nav-login"
            onClick={() => navigate('login')}
            className="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-indigo-50 hover:border-indigo-300 font-medium text-slate-700"
          >
            3. Login Page
          </button>
          <button
            id="quick-nav-student-dashboard"
            onClick={() => {
              loginAs('student');
              navigate('student-dashboard');
            }}
            className="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-indigo-50 hover:border-indigo-300 font-medium text-slate-700"
          >
            4. Student Dashboard
          </button>
          <button
            id="quick-nav-create-complaint"
            onClick={() => {
              loginAs('student');
              navigate('create-complaint');
            }}
            className="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-indigo-50 hover:border-indigo-300 font-medium text-slate-700"
          >
            5. Create Complaint
          </button>
          <button
            id="quick-nav-my-complaints"
            onClick={() => {
              loginAs('student');
              navigate('my-complaints');
            }}
            className="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-indigo-50 hover:border-indigo-300 font-medium text-slate-700"
          >
            6. My Complaints
          </button>
          <button
            id="quick-nav-complaint-details"
            onClick={() => {
              navigate('complaint-details', 'cmp_1001');
            }}
            className="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-indigo-50 hover:border-indigo-300 font-medium text-slate-700"
          >
            7. Complaint Details
          </button>
          <button
            id="quick-nav-admin-dashboard"
            onClick={() => {
              loginAs('admin');
              navigate('admin-dashboard');
            }}
            className="p-2.5 rounded-lg border border-slate-200 text-left hover:bg-indigo-50 hover:border-indigo-300 font-medium text-slate-700"
          >
            8. Admin Dashboard
          </button>
        </div>
      </section>
    </div>
  );
};
