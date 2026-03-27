import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { clearCredentials, setCredentials } from '../../redux/slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OAuthSuccess = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const completeOAuthLogin = async () => {
      const token = new URLSearchParams(location.search).get('token');

      console.log('[AuthDebug] OAuth token extraction', { token });

      if (!token) {
        dispatch(clearCredentials());
        navigate('/login?error=missing_oauth_token', { replace: true });
        return;
      }

      try {
        localStorage.setItem('accessToken', token);
        console.log('[AuthDebug] OAuth token stored', {
          accessToken: localStorage.getItem('accessToken'),
        });

        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });

        const user = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        dispatch(setCredentials({ user, accessToken: token }));
        console.log('[AuthDebug] OAuth user stored', { user });

        const dashboardRoutes = {
          patient: '/patient/dashboard',
          doctor: '/doctor/dashboard',
          admin: '/admin/dashboard',
        };

        const redirectPath = dashboardRoutes[user.role] || '/';
        console.log('[AuthDebug] Redirect execution after OAuth', {
          role: user.role,
          redirectPath,
        });

        navigate(redirectPath, { replace: true });
      } catch (error) {
        console.error('[AuthDebug] OAuth completion failed', error);
        dispatch(clearCredentials());
        navigate('/login?error=oauth_login_failed', { replace: true });
      }
    };

    completeOAuthLogin();
  }, [dispatch, location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-600">Completing Google sign-in...</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;
