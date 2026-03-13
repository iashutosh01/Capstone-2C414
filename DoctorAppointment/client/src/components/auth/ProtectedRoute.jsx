import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user's role
    const dashboardRoutes = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      admin: '/admin/dashboard',
    };

    return <Navigate to={dashboardRoutes[user.role] || '/'} replace />;
  }

  // User is authenticated and has the required role
  return children;
};

export default ProtectedRoute;
