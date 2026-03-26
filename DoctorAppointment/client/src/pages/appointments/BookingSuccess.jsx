import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { getMyAppointments } from '../../redux/slices/appointmentSlice';

const BookingSuccess = () => {
  const dispatch = useDispatch();
  const { appointmentId } = useParams();
  const { appointments } = useSelector((state) => state.appointments);

  useEffect(() => {
    if (!appointments.length) {
      dispatch(getMyAppointments());
    }
  }, [appointments.length, dispatch]);

  const appointment = useMemo(
    () => appointments.find((item) => item._id === appointmentId),
    [appointments, appointmentId]
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dcfce7,_#ffffff_42%,_#eff6ff)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-emerald-200 bg-white p-8 shadow-xl shadow-emerald-100/70">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600">
          ✓
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Payment Successful
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Appointment Confirmed</h1>
          <p className="mt-3 text-sm text-slate-600">
            Your appointment has been confirmed and the receipt is ready.
          </p>
        </div>

        {appointment ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar
                src={appointment.doctor?.profileImage}
                name={`${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`}
                size="xl"
              />
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                </p>
                <p className="text-sm text-slate-500">{appointment.doctor?.specialization}</p>
                <p className="mt-3 text-sm text-slate-600">
                  {new Date(appointment.appointmentDate).toLocaleDateString()} |{' '}
                  {appointment.startTime} - {appointment.endTime}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                  Appointment ID: {appointment._id}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to={`/patient/invoice/${appointmentId}`}>
            <Button variant="primary">View Appointment</Button>
          </Link>
          <Link to="/patient/appointments">
            <Button variant="outline">Go to Appointments</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
