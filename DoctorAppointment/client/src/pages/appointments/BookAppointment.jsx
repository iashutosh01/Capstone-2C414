import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  bookAppointment,
  clearAppointmentError,
  clearAppointmentSuccess,
  getDoctors,
} from '../../redux/slices/appointmentSlice';

const initialForm = {
  doctorId: '',
  appointmentDate: '',
  startTime: '',
  endTime: '',
  reason: '',
  emergencyLevel: 1,
  isFollowUp: false,
  noShowHistory: 0,
};

const BookAppointment = () => {
  const dispatch = useDispatch();
  const { doctors, loading, actionLoading, error, successMessage } = useSelector(
    (state) => state.appointments
  );
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    dispatch(getDoctors());
    dispatch(clearAppointmentError());
    dispatch(clearAppointmentSuccess());
  }, [dispatch]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === formData.doctorId),
    [doctors, formData.doctorId]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = await dispatch(
      bookAppointment({
        ...formData,
        emergencyLevel: Number(formData.emergencyLevel),
        noShowHistory: Number(formData.noShowHistory),
      })
    );

    if (bookAppointment.fulfilled.match(result)) {
      setFormData(initialForm);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_55%,_#ffffff)]">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Book Appointment</h1>
            <p className="mt-1 text-sm text-slate-600">
              Select an available doctor and request a time slot.
            </p>
          </div>
          <Link to="/patient/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && doctors.length === 0 ? <LoadingSpinner /> : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input
                  label="Appointment Date"
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Start Time"
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="End Time"
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <Input
                label="Reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Describe the consultation reason"
                required
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Emergency Level
                  </label>
                  <select
                    name="emergencyLevel"
                    value={formData.emergencyLevel}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 - Low</option>
                    <option value={2}>2 - Mild</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Critical</option>
                  </select>
                </div>
                <Input
                  label="No-show History"
                  type="number"
                  min="0"
                  name="noShowHistory"
                  value={formData.noShowHistory}
                  onChange={handleChange}
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="isFollowUp"
                  checked={formData.isFollowUp}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                This is a follow-up appointment
              </label>

              <Button type="submit" variant="primary" loading={actionLoading}>
                Confirm Booking
              </Button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Doctor Details</h2>
              {selectedDoctor ? (
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </p>
                  <p>Specialization: {selectedDoctor.specialization}</p>
                  <p>Status: {selectedDoctor.availabilityStatus}</p>
                  <p>Fee: Rs. {selectedDoctor.consultationFee}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Choose a doctor to view details.</p>
              )}
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
              <h2 className="mb-2 text-lg font-semibold text-blue-900">AI Scheduling Rule</h2>
              <p className="text-sm text-blue-800">
                If the selected slot is unavailable, the request is added to the waitlist and the
                AI scheduler calculates the patient priority automatically.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookAppointment;
