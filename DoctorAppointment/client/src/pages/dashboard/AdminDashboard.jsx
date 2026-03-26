import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import NotificationBell from '../../components/common/NotificationBell';
import {
  getAdminDashboardStats,
  getDoctorUtilization,
} from '../../redux/slices/appointmentSlice';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { adminStats, doctorUtilization, loading, error } = useSelector(
    (state) => state.appointments
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getAdminDashboardStats());
    dispatch(getDoctorUtilization());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fff7ed,_#ffffff_36%,_#f8fafc)]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
              <Avatar
                src={user?.profileImage}
                name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                size="sm"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar
              src={user?.profileImage}
              name={`${user?.firstName || ''} ${user?.lastName || ''}`}
              size="xl"
            />
            <div>
              <h2 className="mb-2 text-2xl font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-600">Department: {user?.department}</p>
              <p className="text-gray-600">Email: {user?.email}</p>
              <p className="text-gray-600">Role: Administrator</p>
            </div>
          </div>
        </div>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        {loading ? <LoadingSpinner size="sm" /> : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-sm font-medium text-gray-600">Tracked Doctors</h3>
            <p className="text-3xl font-bold text-gray-900">{doctorUtilization.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-sm font-medium text-gray-600">Total Appointments</h3>
            <p className="text-3xl font-bold text-gray-900">{adminStats?.totalAppointments || 0}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-sm font-medium text-gray-600">Completed</h3>
            <p className="text-3xl font-bold text-gray-900">
              {adminStats?.completedAppointments || 0}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-sm font-medium text-gray-600">Waitlist Count</h3>
            <p className="text-3xl font-bold text-gray-900">{adminStats?.waitlistCount || 0}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Doctor Utilization</h3>
              {loading ? <span className="text-sm text-gray-500">Loading...</span> : null}
            </div>
            <div className="space-y-3">
              {doctorUtilization.map((doctor) => (
                <div key={doctor.doctorId} className="rounded-2xl border border-gray-200 p-3">
                  <p className="font-medium text-gray-900">{doctor.doctorName}</p>
                  <p className="text-sm text-gray-600">Appointments: {doctor.appointmentCount}</p>
                  <p className="text-sm text-gray-600">Load share: {doctor.loadShare}%</p>
                  <p className="mt-1 text-xs text-gray-500">Distribution: {doctor.relativeLoad}</p>
                </div>
              ))}
              {doctorUtilization.length === 0 ? (
                <p className="text-sm text-gray-500">No doctor analytics available.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-purple-200 bg-purple-50 p-6">
            <h3 className="mb-2 text-lg font-semibold text-purple-900">System Snapshot</h3>
            <div className="space-y-2 text-sm text-purple-800">
              <p>Total appointments: {adminStats?.totalAppointments || 0}</p>
              <p>Completed appointments: {adminStats?.completedAppointments || 0}</p>
              <p>Cancelled appointments: {adminStats?.cancelledAppointments || 0}</p>
              <p>Current waitlist count: {adminStats?.waitlistCount || 0}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
