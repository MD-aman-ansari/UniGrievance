import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageView } from '../types';
import { 
  ShieldCheck, 
  ShieldAlert,
  Menu, 
  X, 
  PlusCircle, 
  FileText, 
  LayoutDashboard, 
  UserCheck, 
  LogOut, 
  Home, 
  SlidersHorizontal,
  Cookie,
  FileCheck
} from 'lucide-react';


export const Navbar: React.FC = () => {
  const { currentUser, token, currentPage, navigate, loginAs, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const handleNav = (page: PageView) => {
    navigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div 
            id="brand-logo-button"
            onClick={() => handleNav('home')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg block leading-tight">
                UniGrievance
              </span>
              <span className="text-[11px] text-slate-500 block">
                Student Complaint & Service System
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-home-btn"
              onClick={() => handleNav('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'home'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Home className="w-4 h-4" />
                Home
              </span>
            </button>

            {currentUser?.role === 'student' && (
              <>
                <button
                  id="nav-student-dash-btn"
                  onClick={() => handleNav('student-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'student-dashboard'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </span>
                </button>

                <button
                  id="nav-create-complaint-btn"
                  onClick={() => handleNav('create-complaint')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'create-complaint'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4" />
                    Lodge Complaint
                  </span>
                </button>

                <button
                  id="nav-my-complaints-btn"
                  onClick={() => handleNav('my-complaints')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'my-complaints'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    My Grievances
                  </span>
                </button>
              </>
            )}

            {currentUser?.role === 'admin' && (
              <button
                id="nav-admin-dash-btn"
                onClick={() => handleNav('admin-dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'admin-dashboard'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" />
                  Admin Console
                </span>
              </button>
            )}

            <button
              id="nav-input-security-btn"
              onClick={() => handleNav('input-security')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'input-security'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Input Security
              </span>
            </button>

            <button
              id="nav-api-security-btn"
              onClick={() => handleNav('api-security')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'api-security'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                API Security
              </span>
            </button>

            <button
              id="nav-session-security-btn"
              onClick={() => handleNav('session-security')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'session-security'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Cookie className="w-4 h-4 text-purple-600" />
                Session &amp; Cookies
              </span>
            </button>

            <button
              id="nav-upload-security-btn"
              onClick={() => handleNav('upload-security')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'upload-security'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-rose-600" />
                Upload Security
              </span>
            </button>
          </nav>

          {/* Quick Demo Persona Switcher & User Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Persona Switcher for easy testing */}
            <div className="relative">
              <button
                id="persona-switcher-toggle"
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                title="Switch persona for testing"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  Role: <span className="text-indigo-700 uppercase">{currentUser ? currentUser.role : 'Guest'}</span>
                </span>
              </button>

              {showRoleSelector && (
                <div 
                  id="persona-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in"
                >
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Mock Persona
                  </div>
                  <button
                    id="switch-student-btn"
                    onClick={() => {
                      loginAs('student');
                      setShowRoleSelector(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 flex items-center justify-between text-slate-700 hover:text-indigo-700"
                  >
                    <span>Student: Alex Rivera</span>
                    {currentUser?.role === 'student' && <span className="text-indigo-600 font-bold">✓</span>}
                  </button>
                  <button
                    id="switch-admin-btn"
                    onClick={() => {
                      loginAs('admin');
                      setShowRoleSelector(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 flex items-center justify-between text-slate-700 hover:text-indigo-700"
                  >
                    <span>Admin: Dr. Eleanor</span>
                    {currentUser?.role === 'admin' && <span className="text-indigo-600 font-bold">✓</span>}
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    id="switch-guest-btn"
                    onClick={() => {
                      logout();
                      setShowRoleSelector(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                  >
                    Log Out (Guest Mode)
                  </button>
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <p className="text-xs font-semibold text-slate-900 leading-none">{currentUser.name}</p>
                    {token && (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        JWT
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 capitalize">{currentUser.role}</p>
                </div>
                <button
                  id="header-logout-btn"
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Sign out (Clear JWT session)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => handleNav('login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Log In
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => handleNav('register')}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-nav-panel" className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <button
            id="mobile-nav-home"
            onClick={() => handleNav('home')}
            className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100"
          >
            Home
          </button>
          {currentUser?.role === 'student' && (
            <>
              <button
                id="mobile-nav-student-dashboard"
                onClick={() => handleNav('student-dashboard')}
                className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Student Dashboard
              </button>
              <button
                id="mobile-nav-create-complaint"
                onClick={() => handleNav('create-complaint')}
                className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Lodge Complaint
              </button>
              <button
                id="mobile-nav-my-complaints"
                onClick={() => handleNav('my-complaints')}
                className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100"
              >
                My Grievances
              </button>
            </>
          )}
          {currentUser?.role === 'admin' && (
            <button
              id="mobile-nav-admin-dashboard"
              onClick={() => handleNav('admin-dashboard')}
              className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Admin Console
            </button>
          )}

          <button
            id="mobile-nav-input-security"
            onClick={() => handleNav('input-security')}
            className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-amber-800 bg-amber-50 hover:bg-amber-100 flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Input Security Lab
          </button>

          <button
            id="mobile-nav-api-security"
            onClick={() => handleNav('api-security')}
            className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-indigo-800 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            API Security Lab
          </button>

          <button
            id="mobile-nav-session-security"
            onClick={() => handleNav('session-security')}
            className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-purple-800 bg-purple-50 hover:bg-purple-100 flex items-center gap-2"
          >
            <Cookie className="w-4 h-4 text-purple-600" />
            Session &amp; Cookies Lab
          </button>

          <button
            id="mobile-nav-upload-security"
            onClick={() => handleNav('upload-security')}
            className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-rose-800 bg-rose-50 hover:bg-rose-100 flex items-center gap-2"
          >
            <FileCheck className="w-4 h-4 text-rose-600" />
            Upload Security Lab
          </button>


          <div className="border-t border-slate-100 pt-2 mt-2">
            <div className="text-xs font-semibold text-slate-400 px-3 py-1 uppercase">
              Role Switcher (Level 1 Mock)
            </div>
            <div className="grid grid-cols-2 gap-2 px-3 py-1">
              <button
                id="mobile-switch-student"
                onClick={() => {
                  loginAs('student');
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-1.5 rounded text-xs text-center border font-medium ${
                  currentUser?.role === 'student' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50'
                }`}
              >
                Student Alex
              </button>
              <button
                id="mobile-switch-admin"
                onClick={() => {
                  loginAs('admin');
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-1.5 rounded text-xs text-center border font-medium ${
                  currentUser?.role === 'admin' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50'
                }`}
              >
                Admin Eleanor
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2">
            {currentUser ? (
              <button
                id="mobile-nav-logout"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out ({currentUser.name})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id="mobile-nav-login"
                  onClick={() => handleNav('login')}
                  className="w-full text-center py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Log In
                </button>
                <button
                  id="mobile-nav-register"
                  onClick={() => handleNav('register')}
                  className="w-full text-center py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
