import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import NotificationBell from '../../components/common/NotificationBell';
import { getMyAppointments, getNotifications } from '../../redux/slices/appointmentSlice';

const PatientDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { appointments, notifications, loading } = useSelector((state) => state.appointments);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getMyAppointments());
    dispatch(getNotifications());
  }, [dispatch]);

  const upcomingAppointments = appointments.filter((appointment) => appointment.status !== 'cancelled');

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f0f9ff,_#ffffff_32%,_#f8fafc)]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
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
                <p className="text-xs text-slate-500">Patient</p>
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
                Welcome back, {user?.firstName} {user?.lastName}!
              </h2>
              <p className="text-gray-600">Email: {user?.email}</p>
              <p className="text-gray-600">Phone: {user?.phone}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Book Appointment</h3>
            <p className="mb-4 text-sm text-gray-600">Schedule an appointment with a doctor.</p>
            <Link to="/patient/book">
              <Button variant="primary" size="sm" fullWidth>
                Book Now
              </Button>
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">My Appointments</h3>
            <p className="mb-4 text-sm text-gray-600">View and manage your appointments.</p>
            <Link to="/patient/appointments">
              <Button variant="primary" size="sm" fullWidth>
                View All
              </Button>
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Notifications</h3>
            <p className="mb-4 text-sm text-gray-600">Track booking, waitlist, and schedule updates.</p>
            <div className="text-3xl font-bold text-gray-900">{notifications.length}</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
              {loading ? <span className="text-sm text-gray-500">Loading...</span> : null}
            </div>
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 4).map((appointment) => (
                <div key={appointment._id} className="rounded-2xl border border-gray-200 p-3">
                  <p className="font-medium text-gray-900">
                    Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(appointment.appointmentDate).toLocaleDateString()} | {appointment.startTime} - {appointment.endTime}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Status: {appointment.status}</p>
                </div>
              ))}
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-gray-500">No appointments booked yet.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-2 text-lg font-semibold text-blue-900">Notification Center</h3>
            <div className="space-y-3">
              {notifications.slice(0, 4).map((notification) => (
                <div key={notification._id} className="rounded-2xl bg-white/80 p-3">
                  <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                </div>
              ))}
              {notifications.length === 0 ? (
                <p className="text-sm text-blue-900">No notifications available right now.</p>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
