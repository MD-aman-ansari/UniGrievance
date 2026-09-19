import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { CreateComplaintPage } from './pages/CreateComplaintPage';
import { MyComplaintsPage } from './pages/MyComplaintsPage';
import { ComplaintDetailsPage } from './pages/ComplaintDetailsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { InputSecurityPage } from './pages/InputSecurityPage';
import { ApiSecurityPage } from './pages/ApiSecurityPage';
import { SessionSecurityPage } from './pages/SessionSecurityPage';
import { UploadSecurityPage } from './pages/UploadSecurityPage';
import { ShieldCheck, Terminal, GitBranch } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentPage } = useApp();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'register':
        return <RegisterPage />;
      case 'login':
        return <LoginPage />;
      case 'student-dashboard':
        return <StudentDashboard />;
      case 'create-complaint':
        return <CreateComplaintPage />;
      case 'my-complaints':
        return <MyComplaintsPage />;
      case 'complaint-details':
        return <ComplaintDetailsPage />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'input-security':
        return <InputSecurityPage />;
      case 'api-security':
        return <ApiSecurityPage />;
      case 'session-security':
        return <SessionSecurityPage />;
      case 'upload-security':
        return <UploadSecurityPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Global Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {renderCurrentPage()}
      </main>

      {/* Footer & Educational Architecture Legend */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              U
            </div>
            <span className="font-semibold text-slate-800">
              Student Complaint &amp; Service Management System
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-indigo-600" />
              Level 1: Client Foundation
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              OWASP Aligned Security
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              Next: Level 2 Backend API Setup
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Campus Grievance Redressal Portal
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
