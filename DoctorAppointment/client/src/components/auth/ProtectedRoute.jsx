import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, accessToken, user, loading } = useSelector((state) => state.auth);
  const location = useLocation();
  const storedToken = accessToken || localStorage.getItem('accessToken');

  if (loading || (storedToken && !user)) {
    return <LoadingSpinner fullScreen />;
  }

  if (!storedToken || !isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const dashboardRoutes = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      admin: '/admin/dashboard',
    };

    return <Navigate to={dashboardRoutes[user.role] || '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;
