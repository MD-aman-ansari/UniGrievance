import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Hash, 
  Building2, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Check, 
  KeyRound
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { navigate, register } = useApp();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    department: 'Computer Science & Engineering',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = [
    'Computer Science & Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biotechnology',
    'Business Administration & MBA',
    'Applied Sciences & Humanities',
  ];

  // Password policy criteria:
  const hasMinLength = formData.password.length >= 8;
  const hasCapital = /[A-Z]/.test(formData.password);
  const hasNumeric = /[0-9]/.test(formData.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);

  const passwordScore = [hasMinLength, hasCapital, hasNumeric, hasSpecial].filter(Boolean).length;
  const isPasswordValid = passwordScore === 4;
  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = formData.fullName.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      setError('Please provide your full name.');
      return;
    }

    if (!trimmedEmail) {
      setError('Please provide your email address.');
      return;
    }

    if (!hasMinLength) {
      setError('Password policy error: Password must be at least 8 characters long.');
      return;
    }
    if (!hasCapital) {
      setError('Password policy error: Password must contain at least one capital letter (A-Z).');
      return;
    }
    if (!hasNumeric) {
      setError('Password policy error: Password must contain at least one numeric digit (0-9).');
      return;
    }
    if (!hasSpecial) {
      setError('Password policy error: Password must contain at least one special character (!@#$%^&*).');
      return;
    }
    if (!passwordsMatch) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setIsSubmitting(true);

    // Email format validation and account creation run directly on backend
    const result = await register({
      name: trimmedName,
      email: trimmedEmail,
      password: formData.password,
      role: 'student',
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('home');
      }, 1500);
    } else {
      setError(result.error || 'Failed to create account. Please check your details and try again.');
    }
  };

  return (
    <div id="page-register" className="max-w-xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create Student Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Register your student profile to lodge grievances, attach evidence, and track SLA resolutions.
          </p>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div id="register-error-banner" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">Notice:</span> {error}
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div id="register-success-banner" className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-4 rounded-xl text-xs flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-sm text-emerald-900">Account Created Successfully!</div>
              <p className="text-emerald-700">Redirecting you to your portal dashboard...</p>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="register-fullname"
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Clean Email Address (No rules below, validated on backend) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="register-email"
                  type="email"
                  placeholder="student123@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Student ID & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student / Roll ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="register-studentid"
                    type="text"
                    placeholder="STU-2026-894"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Department</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    id="register-department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  {formData.password.length > 0 && (
                    <span className={`text-[10px] font-semibold ${
                      passwordScore === 4 ? 'text-emerald-600' : passwordScore >= 2 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {passwordScore === 4 ? 'Strong' : passwordScore >= 2 ? 'Medium' : 'Weak'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="register-password"
                    type="password"
                    placeholder="Min 8 chars, 1 upper, 1 num, 1 special"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                      formData.password.length === 0
                        ? 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                        : isPasswordValid
                        ? 'border-emerald-300 bg-emerald-50/20 focus:ring-emerald-500 focus:border-emerald-500'
                        : 'border-amber-300 focus:ring-amber-500 focus:border-amber-500'
                    }`}
                    required
                  />
                </div>

                {formData.password.length > 0 && (
                  <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex gap-0.5">
                    <div className={`h-full flex-1 transition-all duration-300 ${passwordScore >= 1 ? 'bg-rose-500' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all duration-300 ${passwordScore >= 2 ? 'bg-amber-500' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all duration-300 ${passwordScore >= 3 ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all duration-300 ${passwordScore >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
                  {formData.confirmPassword.length > 0 && (
                    <span className={`text-[10px] font-semibold ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {passwordsMatch ? '✓ Matches' : '✗ Do not match'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                      formData.confirmPassword.length === 0
                        ? 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                        : passwordsMatch
                        ? 'border-emerald-300 bg-emerald-50/20 focus:ring-emerald-500 focus:border-emerald-500'
                        : 'border-rose-300 bg-rose-50/20 focus:ring-rose-500 focus:border-rose-500'
                    }`}
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Re-enter password</p>
              </div>
            </div>

            {/* Password Policy Requirements */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Password Requirements:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${hasMinLength ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                    {hasMinLength ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
                  </div>
                  <span>At least 8 characters</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasCapital ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${hasCapital ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                    {hasCapital ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
                  </div>
                  <span>One capital letter (A-Z)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasNumeric ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${hasNumeric ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                    {hasNumeric ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
                  </div>
                  <span>One numeric digit (0-9)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${hasSpecial ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                    {hasSpecial ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
                  </div>
                  <span>One special symbol (!@#$)</span>
                </div>
              </div>
            </div>

            {/* Direct Register Action Button */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-100 transition-colors flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Your Account...</span>
                </>
              ) : (
                <>
                  <span>Create Student Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Sign In Footer */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          Already registered?{' '}
          <button
            id="register-goto-login-btn"
            type="button"
            onClick={() => navigate('login')}
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
          >
            Sign In here
          </button>
        </div>

      </div>
    </div>
  );
};
