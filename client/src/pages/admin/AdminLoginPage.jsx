import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle, Info, Utensils } from 'lucide-react';
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

  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === '1') {
      setSessionExpiredNotice(true);
    }
  }, [location.search]);

  function validate() {
    const errs = {};
    if (!username.trim()) errs.username = 'Username or email is required.';
    if (!password) errs.password = 'Password is required.';
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
      const data = await adminLogin(username.trim(), password);
      if (data?.token) {
        setAdminSession(data.token, data.admin);
        const destination = location.state?.from?.pathname || '/admin/dashboard';
        navigate(destination, { replace: true });
      } else {
        setLoginError('Authentication succeeded but no token was returned.');
      }
    } catch (err) {
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

  const inputBase =
    'w-full px-3.5 py-2.5 rounded-md bg-white border text-sm text-[#20251F] placeholder-[#74796F] transition-colors focus:outline-none focus:ring-2 focus:ring-[#526B50]/30';

  return (
    <div className="min-h-screen bg-[#F7F7F4] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#526B50] flex items-center justify-center mb-3 shadow-sm">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#20251F] tracking-tight">Dinning Room</h1>
          <p className="text-sm text-[#74796F] mt-1">Admin Portal</p>
        </div>

        <div className="bg-white border border-[#E6E8E1] rounded-lg p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#20251F] mb-1">Sign in to Dashboard</h2>
            <p className="text-sm text-[#74796F]">Enter your credentials to continue.</p>
          </div>

          {sessionExpiredNotice && (
            <div
              role="alert"
              className="flex items-start gap-2.5 mb-4 p-3 rounded-md bg-amber-50 border border-amber-200"
            >
              <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Your session has expired. Please sign in again to continue.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {loginError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 mb-4 p-3 rounded-md bg-red-50 border border-red-200"
              >
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 leading-relaxed">{loginError}</p>
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="admin-username"
                className="block text-sm font-medium text-[#20251F] mb-1.5"
              >
                Username or Email
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => handleFieldChange('username', e.target.value)}
                placeholder="admin or admin@example.com"
                aria-describedby={errors.username ? 'username-error' : undefined}
                aria-invalid={!!errors.username}
                className={`${inputBase} ${
                  errors.username
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-[#E6E8E1] focus:border-[#526B50]'
                }`}
              />
              {errors.username && (
                <p id="username-error" role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.username}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-[#20251F] mb-1.5"
              >
                Password
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
                  className={`${inputBase} pr-11 ${
                    errors.password
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-[#E6E8E1] focus:border-[#526B50]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74796F] hover:text-[#20251F] transition-colors p-1 rounded cursor-pointer focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#526B50]/40 ${
                isLoading
                  ? 'bg-[#526B50]/60 text-white cursor-not-allowed'
                  : 'bg-[#526B50] hover:bg-[#40563F] text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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

        <p className="text-center text-xs text-[#74796F] mt-6">
          Dinning Room Admin Portal
        </p>
      </div>
    </div>
  );
}
