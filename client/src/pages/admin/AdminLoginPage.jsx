/**
 * AdminLoginPage.jsx
 * ServeSync — Admin Dashboard (Member 3)
 *
 * Frontend-only demo login screen.
 * No real authentication is performed. This is a UI/UX demo flow.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Utensils, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';

// Demo credentials — clearly mock, no real auth
const DEMO_EMAIL = 'admin@servesync.com';
const DEMO_PASSWORD = 'admin123';

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /** Validate fields, return error map */
  function validate() {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 4) {
      errs.password = 'Password must be at least 4 characters.';
    }
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLoginError('');

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    // Simulate async check
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (
        email.trim().toLowerCase() === DEMO_EMAIL &&
        password === DEMO_PASSWORD
      ) {
        navigate('/admin/dashboard');
      } else {
        setLoginError(
          'Invalid credentials. Use admin@servesync.com / admin123 for demo.'
        );
      }
    }, 800);
  }

  function handleFieldChange(field, value) {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    // Clear the per-field error as user types
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (loginError) setLoginError('');
  }

  return (
    <div className="min-h-screen bg-[#171A19] flex flex-col items-center justify-center px-4 py-12 selection:bg-[#24543A] selection:text-[#F5F0E6]">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#24543A] to-[#171A19] border border-[#326B4B] flex items-center justify-center shadow-lg mb-4">
            <Utensils className="w-7 h-7 text-[#E5B86A]" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#F5F5F0]">
            Serve<span className="text-[#E5B86A]">Sync</span>
          </h1>
          <p className="text-xs text-[#A8B3AA] tracking-widest uppercase mt-1 font-medium">
            Admin Portal
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-[#222825] border border-[#38443C] rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#F5F5F0] mb-1">
              Sign in to Dashboard
            </h2>
            <p className="text-sm text-[#A8B3AA]">
              Manage your restaurant menu and items.
            </p>
          </div>

          {/* Demo Credentials Notice */}
          <div className="flex items-start gap-2.5 mb-5 p-3 rounded-xl bg-[#24543A]/20 border border-[#326B4B]/60">
            <ShieldCheck className="w-4 h-4 text-[#82B895] mt-0.5 shrink-0" />
            <p className="text-xs text-[#A8B3AA] leading-relaxed">
              <span className="font-semibold text-[#82B895]">Demo Mode — </span>
              Use{' '}
              <span className="font-mono text-[#F5F5F0]">admin@servesync.com</span>{' '}
              and password{' '}
              <span className="font-mono text-[#F5F5F0]">admin123</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Global Login Error */}
            {loginError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-700/60"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <p className="text-xs text-rose-300 leading-relaxed">{loginError}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="mb-4">
              <label
                htmlFor="admin-email"
                className="block text-sm font-semibold text-[#F5F5F0] mb-1.5"
              >
                Email address
                <span className="text-rose-400 ml-1" aria-hidden="true">*</span>
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="admin@servesync.com"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
                className={`
                  w-full px-4 py-3 rounded-xl bg-[#171A19] border text-sm text-[#F5F5F0]
                  placeholder-[#A8B3AA] transition-colors
                  focus:outline-none focus:ring-2 focus:ring-[#82B895]/50
                  ${
                    errors.email
                      ? 'border-rose-600 focus:border-rose-500'
                      : 'border-[#38443C] focus:border-[#82B895]'
                  }
                `}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label
                htmlFor="admin-password"
                className="block text-sm font-semibold text-[#F5F5F0] mb-1.5"
              >
                Password
                <span className="text-rose-400 ml-1" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  placeholder="Enter your password"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                  className={`
                    w-full px-4 py-3 pr-12 rounded-xl bg-[#171A19] border text-sm text-[#F5F5F0]
                    placeholder-[#A8B3AA] transition-colors
                    focus:outline-none focus:ring-2 focus:ring-[#82B895]/50
                    ${
                      errors.password
                        ? 'border-rose-600 focus:border-rose-500'
                        : 'border-[#38443C] focus:border-[#82B895]'
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8B3AA] hover:text-[#F5F5F0] transition-colors p-1 rounded cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#82B895]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full flex items-center justify-center gap-2 py-3 rounded-xl
                text-sm font-bold transition-all duration-200 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[#82B895] focus:ring-offset-2 focus:ring-offset-[#222825]
                ${
                  isLoading
                    ? 'bg-[#24543A]/60 text-[#A8B3AA] cursor-not-allowed'
                    : 'bg-[#24543A] hover:bg-[#326B4B] active:scale-[0.98] text-[#F5F0E6] shadow-md hover:shadow-lg shadow-[#24543A]/20'
                }
              `}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#A8B3AA] border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#A8B3AA] mt-6">
          ServeSync Admin — Member 3 · Frontend Demo
        </p>
      </div>
    </div>
  );
}
