import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
  clearAppointmentError,
  clearAppointmentSuccess,
  getDoctorSchedule,
  updateDoctorAvailability,
} from '../../redux/slices/appointmentSlice';

const DoctorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { doctorSchedule, loading, actionLoading, error, successMessage } = useSelector(
    (state) => state.appointments
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [availabilityForm, setAvailabilityForm] = useState({
    availabilityStatus: user?.availabilityStatus || 'available',
    slotDate: '',
    startTime: '',
    endTime: '',
    availabilityNotes: '',
  });

  useEffect(() => {
    dispatch(getDoctorSchedule());
    dispatch(clearAppointmentError());
    dispatch(clearAppointmentSuccess());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleAvailabilitySubmit = async () => {
    await dispatch(updateDoctorAvailability(availabilityForm));
    dispatch(getDoctorSchedule());
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#ecfeff,_#ffffff_38%,_#f8fafc)]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            Dr. {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-gray-600">Specialization: {user?.specialization}</p>
          <p className="text-gray-600">Email: {user?.email}</p>
          <p className="text-gray-600">Phone: {user?.phone}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">Active Appointments</h3>
            <p className="text-3xl font-bold text-gray-900">{doctorSchedule.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">Unique Patients</h3>
            <p className="text-3xl font-bold text-gray-900">
              {new Set(doctorSchedule.map((appointment) => appointment.patient?._id)).size}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">Availability Status</h3>
            <p className="text-lg font-medium capitalize text-green-600">
              {availabilityForm.availabilityStatus}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Update Availability</h3>
            <div className="space-y-4">
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

              <select
                value={availabilityForm.availabilityStatus}
                onChange={(event) =>
                  setAvailabilityForm((previous) => ({
                    ...previous,
                    availabilityStatus: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="break">Break</option>
                <option value="offline">Offline</option>
              </select>

              <Input
                label="Slot date"
                type="date"
                name="slotDate"
                value={availabilityForm.slotDate}
                onChange={(event) =>
                  setAvailabilityForm((previous) => ({ ...previous, slotDate: event.target.value }))
                }
              />
              <Input
                label="Start time"
                type="time"
                name="startTime"
                value={availabilityForm.startTime}
                onChange={(event) =>
                  setAvailabilityForm((previous) => ({ ...previous, startTime: event.target.value }))
                }
              />
              <Input
                label="End time"
                type="time"
                name="endTime"
                value={availabilityForm.endTime}
                onChange={(event) =>
                  setAvailabilityForm((previous) => ({ ...previous, endTime: event.target.value }))
                }
              />
              <Input
                label="Notes"
                name="availabilityNotes"
                value={availabilityForm.availabilityNotes}
                onChange={(event) =>
                  setAvailabilityForm((previous) => ({
                    ...previous,
                    availabilityNotes: event.target.value,
                  }))
                }
                placeholder="Short note for this schedule update"
              />

              <Button variant="primary" onClick={handleAvailabilitySubmit} loading={actionLoading}>
                Save Status
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-green-200 bg-green-50 p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-900">Schedule</h3>
              {loading ? <span className="text-sm text-green-700">Loading...</span> : null}
            </div>
            <div className="space-y-3">
              {doctorSchedule.length === 0 ? (
                <p className="text-green-800">No appointments scheduled yet.</p>
              ) : (
                doctorSchedule.map((appointment) => (
                  <div key={appointment._id} className="rounded-2xl border border-green-100 bg-white p-4">
                    <p className="font-semibold text-gray-900">
                      {appointment.patient?.firstName} {appointment.patient?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.appointmentDate).toLocaleDateString()} | {appointment.startTime} - {appointment.endTime}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Status: {appointment.status}</p>
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

export default DoctorDashboard;
