/**
 * AdminLoginPage.jsx
 * ServeSync — Admin Dashboard (Member 3, Commit 5)
 *
 * Admin login screen connected to POST /api/admin/login.
 * Authenticates against the backend, handles invalid credentials,
 * displays meaningful error messages, stores the session token safely,
 * and guards against password exposure in logs.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Utensils, LogIn, AlertCircle, ShieldCheck, Info } from 'lucide-react';
import { adminLogin, setAdminSession, isAdminAuthenticated } from '../../services/adminApi';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  // Check if redirected due to expired session
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === '1') {
      setSessionExpiredNotice(true);
    }
  }, [location.search]);

  /** Validate form inputs */
  function validate() {
    const errs = {};
    if (!username.trim()) {
      errs.username = 'Username or email is required.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoginError('');
    setSessionExpiredNotice(false);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    setIsLoading(true);

    try {
      // Connect to backend POST /api/admin/login via adminApi
      const data = await adminLogin(username.trim(), password);

      // Store authentication token and admin details according to implementation
      if (data?.token) {
        setAdminSession(data.token, data.admin);

        // Redirect to intended destination or dashboard
        const destination = location.state?.from?.pathname || '/admin/dashboard';
        navigate(destination, { replace: true });
      } else {
        setLoginError('Authentication succeeded but no token was returned.');
      }
    } catch (err) {
      // Meaningful error message extracted by Axios interceptor
      const message =
        err.message ||
        (err.status === 401
          ? 'Invalid username or password.'
          : 'Failed to sign in. Please check your connection and try again.');
      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFieldChange(field, value) {
    if (field === 'username') setUsername(value);
    if (field === 'password') setPassword(value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (loginError) setLoginError('');
  }

  return (
    <div className="min-h-screen bg-[#171A19] flex flex-col items-center justify-center px-4 py-12 selection:bg-[#24543A] selection:text-[#F5F0E6]">
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
              Enter your credentials to access the admin portal.
            </p>
          </div>

          {/* Session Expired Notice */}
          {sessionExpiredNotice && (
            <div
              role="alert"
              className="flex items-start gap-2.5 mb-5 p-3 rounded-xl bg-amber-950/40 border border-amber-600/60"
            >
              <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-200 leading-relaxed">
                Your session has expired. Please sign in again to continue.
              </p>
            </div>
          )}

          {/* Demo Credentials Notice */}
          <div className="flex items-start gap-2.5 mb-5 p-3 rounded-xl bg-[#24543A]/20 border border-[#326B4B]/60">
            <ShieldCheck className="w-4 h-4 text-[#82B895] mt-0.5 shrink-0" />
            <p className="text-xs text-[#A8B3AA] leading-relaxed">
              <span className="font-semibold text-[#82B895]">Default Credentials — </span>
              Username: <span className="font-mono text-[#F5F5F0]">admin</span> (or{' '}
              <span className="font-mono text-[#F5F5F0]">admin@servesync.com</span>) · Password:{' '}
              <span className="font-mono text-[#F5F5F0]">admin123</span>
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

            {/* Username or Email Field */}
            <div className="mb-4">
              <label
                htmlFor="admin-username"
                className="block text-sm font-semibold text-[#F5F5F0] mb-1.5"
              >
                Username or Email
                <span className="text-rose-400 ml-1" aria-hidden="true">*</span>
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => handleFieldChange('username', e.target.value)}
                placeholder="admin or admin@servesync.com"
                aria-describedby={errors.username ? 'username-error' : undefined}
                aria-invalid={!!errors.username}
                className={`
                  w-full px-4 py-3 rounded-xl bg-[#171A19] border text-sm text-[#F5F5F0]
                  placeholder-[#A8B3AA] transition-colors
                  focus:outline-none focus:ring-2 focus:ring-[#82B895]/50
                  ${
                    errors.username
                      ? 'border-rose-600 focus:border-rose-500'
                      : 'border-[#38443C] focus:border-[#82B895]'
                  }
                `}
              />
              {errors.username && (
                <p id="username-error" role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.username}
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
          ServeSync Admin · Member 3 · Connected to Backend API
        </p>
      </div>
    </div>
  );
}
