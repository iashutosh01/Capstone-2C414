import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import NotificationBell from '../../components/common/NotificationBell';
import {
  cancelAppointment,
  clearAppointmentError,
  clearAppointmentSuccess,
  getMyAppointments,
  getNotifications,
  rescheduleAppointment,
} from '../../redux/slices/appointmentSlice';

const PatientAppointments = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { appointments, notifications, loading, actionLoading, error, successMessage } =
    useSelector((state) => state.appointments);
  const [rescheduleData, setRescheduleData] = useState({});

  useEffect(() => {
    dispatch(getMyAppointments());
    dispatch(getNotifications());
    dispatch(clearAppointmentError());
    dispatch(clearAppointmentSuccess());
  }, [dispatch]);

  const handleCancel = async (id) => {
    await dispatch(cancelAppointment({ id, cancellationReason: 'Cancelled by patient' }));
    dispatch(getNotifications());
  };

  const handleReschedule = async (id) => {
    const values = rescheduleData[id];
    if (!values?.appointmentDate || !values?.startTime || !values?.endTime) {
      return;
    }

    await dispatch(rescheduleAppointment({ id, ...values }));
    dispatch(getMyAppointments());
    dispatch(getNotifications());
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc,_#ffffff_35%,_#f8fafc)]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="mt-1 text-sm text-gray-600">Manage bookings, changes, and updates.</p>
          </div>
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
            <Link to="/patient/book">
              <Button variant="primary">Book New</Button>
            </Link>
            <Link to="/patient/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <p className="text-sm">{error}</p>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
            <p className="text-sm">{successMessage}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Appointments</h2>
              {loading ? <LoadingSpinner size="sm" /> : null}
            </div>

            <div className="space-y-4">
              {appointments.length === 0 ? (
                <p className="text-sm text-gray-500">No appointments found.</p>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={appointment.doctor?.profileImage}
                          name={`${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`}
                          size="md"
                        />
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(appointment.appointmentDate).toLocaleDateString()} |{' '}
                            {appointment.startTime} - {appointment.endTime}
                          </p>
                          <p className="text-sm text-gray-600">Status: {appointment.status}</p>
                          <p className="text-sm text-gray-600">Reason: {appointment.reason}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                            Appointment ID: {appointment._id}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/patient/invoice/${appointment._id}`}>
                          <Button variant="outline" size="sm">
                            View Receipt
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(appointment._id)}
                          disabled={appointment.status === 'cancelled' || actionLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>

                    {appointment.status !== 'cancelled' ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                        <Input
                          type="date"
                          name={`appointmentDate-${appointment._id}`}
                          value={rescheduleData[appointment._id]?.appointmentDate || ''}
                          onChange={(event) =>
                            setRescheduleData((previous) => ({
                              ...previous,
                              [appointment._id]: {
                                ...previous[appointment._id],
                                appointmentDate: event.target.value,
                              },
                            }))
                          }
                        />
                        <Input
                          type="time"
                          name={`startTime-${appointment._id}`}
                          value={rescheduleData[appointment._id]?.startTime || ''}
                          onChange={(event) =>
                            setRescheduleData((previous) => ({
                              ...previous,
                              [appointment._id]: {
                                ...previous[appointment._id],
                                startTime: event.target.value,
                              },
                            }))
                          }
                        />
                        <Input
                          type="time"
                          name={`endTime-${appointment._id}`}
                          value={rescheduleData[appointment._id]?.endTime || ''}
                          onChange={(event) =>
                            setRescheduleData((previous) => ({
                              ...previous,
                              [appointment._id]: {
                                ...previous[appointment._id],
                                endTime: event.target.value,
                              },
                            }))
                          }
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleReschedule(appointment._id)}
                          disabled={actionLoading}
                        >
                          Reschedule
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Notifications</h2>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500">No notifications available.</p>
              ) : (
                notifications.map((notification) => (
                  <div key={notification._id} className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientAppointments;
