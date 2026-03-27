import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, login } from '../../redux/slices/authSlice';
import Button from '../../components/common/Button';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  const dashboardRoute = useMemo(() => {
    const routes = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      admin: '/admin/dashboard',
    };

    return routes[user?.role] || '/';
  }, [user?.role]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('[AuthDebug] Redirecting authenticated user from login page', {
        role: user.role,
        route: dashboardRoute,
      });
      navigate(dashboardRoute, { replace: true });
    }
  }, [dashboardRoute, isAuthenticated, navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await dispatch(login(formData));

    if (login.fulfilled.match(result)) {
      const payload = result.payload.data;
      console.log('[AuthDebug] Login response received', payload);
      console.log('[AuthDebug] Token stored after login', {
        accessToken: localStorage.getItem('accessToken'),
        user: localStorage.getItem('user'),
      });
      console.log('[AuthDebug] Redirect execution after login', {
        role: payload.user.role,
      });
    }
  };

  const handleGoogleLogin = () => {
    const googleAuthUrl =
      import.meta.env.VITE_GOOGLE_AUTH_URL || 'http://localhost:5000/api/auth/google';

    console.log('[AuthDebug] Redirecting to Google OAuth', { googleAuthUrl });
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex font-sans">
      <Link
        to="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 sm:left-6 sm:top-6"
      >
        Home
      </Link>

      {/* Left Side - Form Area */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">TeleHealth🩺</span>
            </Link>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                Create a free account
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-medium text-slate-700">Email address</label>
                <div className="mt-1.5">
                  <input
                    type="email"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-white"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="mt-1.5">
                  <input
                    type="password"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-white"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <Button 
                type="submit"
                variant="primary" 
                size="lg" 
                className="w-full flex justify-center py-3 rounded-xl shadow-md hover:shadow-lg transition-all" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-50 text-slate-500 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center rounded-xl py-3"
                  onClick={handleGoogleLogin}
                >
                  Continue with Google
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Brand Graphic (Hidden on mobile) */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 text-white max-w-lg border border-white/20 shadow-2xl relative z-10">
            <h3 className="text-3xl font-bold mb-4 tracking-tight">Streamline Your Healthcare Journey</h3>
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              Join TeleHealth🩺 to access AI-powered scheduling, reduce wait times, and get seamless care all in one place.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-700 bg-indigo-400 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    U{i}
                  </div>
                ))}
              </div>
              <span className="text-sm font-medium text-blue-50">Trusted by 10k+ users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
