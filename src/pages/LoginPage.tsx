import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, KeyRound, Info, Loader2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate, login, loginAs } = useApp();

  const [email, setEmail] = useState('alex.rivera@campus.edu');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both institutional email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Authentication failed.');
    }
  };

  const handleFillCredentials = (userRole: 'student' | 'admin') => {
    if (userRole === 'student') {
      setEmail('alex.rivera@campus.edu');
      setPassword('student123');
    } else {
      setEmail('e.vance@campus.edu');
      setPassword('admin123');
    }
    setError(null);
  };

  return (
    <div id="page-login" className="max-w-md mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Authentication</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Sign in with institutional credentials. Passwords are encrypted with bcrypt and verified via Express JWT tokens.
          </p>
        </div>

        {/* Quick Demo Credentials Panel for Level 4 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              Pre-Seeded Accounts (Level 4 Auth)
            </span>
            <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
              bcrypt (10 rounds)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Click an account to populate credentials and test the full authentication flow:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="quick-fill-student-btn"
              type="button"
              onClick={() => handleFillCredentials('student')}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 shadow-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              Student (alex)
            </button>
            <button
              id="quick-fill-admin-btn"
              type="button"
              onClick={() => handleFillCredentials('admin')}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 shadow-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Admin (dr. vance)
            </button>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div id="login-error-banner" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Authentication Error:</span> {error}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@campus.edu"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <span className="text-[11px] text-slate-400">Min 6 characters</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Authenticate Session (POST /api/auth/login)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Architecture Note */}
        <div className="border-t border-slate-100 pt-4 flex items-start gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Security Architecture:</strong> Never stores plain-text passwords. Express validates input, verifies timing-safe hash with <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">bcrypt.compare()</code>, and signs a JWT token returned to the client for subsequent protected API requests.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          Do not have an account?{' '}
          <button
            id="login-goto-register-btn"
            type="button"
            onClick={() => navigate('register')}
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Register Student Profile
          </button>
        </div>
      </div>
    </div>
  );
};
