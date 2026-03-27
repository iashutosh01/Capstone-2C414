import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import OAuthSuccess from './pages/auth/OAuthSuccess';
import VerifyEmail from './pages/auth/VerifyEmail';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import BookAppointment from './pages/appointments/BookAppointment';
import BookingSuccess from './pages/appointments/BookingSuccess';
import Invoice from './pages/appointments/Invoice';
import PatientAppointments from './pages/appointments/PatientAppointments';
import Chat from './pages/Chat';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import { getCurrentUser } from './redux/slices/authSlice';

import ChatbotWidget from './components/common/ChatbotWidget';

function App() {
  const dispatch = useDispatch();
  const { accessToken, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (accessToken && !user) {
      dispatch(getCurrentUser());
    }
  }, [accessToken, dispatch, user]);

  const HomeRedirect = () => {
    if (isAuthenticated && user) {
      const dashboardRoutes = {
        patient: '/patient/dashboard',
        doctor: '/doctor/dashboard',
        admin: '/admin/dashboard',
      };

      return <Navigate to={dashboardRoutes[user.role] || '/'} replace />;
    }

    return <Landing />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/book"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/invoice/:appointmentId"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Invoice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/booking-success/:appointmentId"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <BookingSuccess />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor"
          element={<Navigate to="/doctor/dashboard" replace />}
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route
          path="/chat/:appointmentId"
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient"
          element={<Navigate to="/patient/dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatbotWidget />
    </Router>
  );
}

export default App;
