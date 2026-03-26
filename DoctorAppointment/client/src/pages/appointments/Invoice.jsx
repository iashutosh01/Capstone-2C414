import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getMyAppointments } from '../../redux/slices/appointmentSlice';

const formatMoney = (amount) => Number(amount || 0).toFixed(2);

const Invoice = () => {
  const dispatch = useDispatch();
  const { appointmentId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const { appointments, loading } = useSelector((state) => state.appointments);

  useEffect(() => {
    if (!appointments.length) {
      dispatch(getMyAppointments());
    }
  }, [appointments.length, dispatch]);

  const appointment = useMemo(
    () => appointments.find((item) => item._id === appointmentId),
    [appointments, appointmentId]
  );

  const pricing = useMemo(() => {
    const originalAmount =
      appointment?.payment?.originalAmount !== undefined
        ? appointment.payment.originalAmount / 100
        : appointment?.doctor?.consultationFee || 0;
    const discountAmount =
      appointment?.payment?.discountAmount !== undefined
        ? appointment.payment.discountAmount / 100
        : 0;
    const finalAmount =
      appointment?.payment?.amount !== undefined
        ? appointment.payment.amount / 100
        : originalAmount - discountAmount;

    return {
      originalAmount,
      discountAmount,
      finalAmount,
    };
  }, [appointment]);

  if (loading && !appointment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Invoice not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            This appointment receipt is not available in your account yet.
          </p>
          <Link to="/patient/appointments" className="mt-6 inline-flex">
            <Button variant="primary">Back to Appointments</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc,_#ffffff_35%,_#eff6ff)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to="/patient/appointments">
            <Button variant="outline">Back to Appointments</Button>
          </Link>
          <Button variant="primary" onClick={() => window.print()}>
            Download PDF
          </Button>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
          <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
                Payment Receipt
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Appointment Invoice</h1>
              <p className="mt-2 text-sm text-slate-500">Appointment ID: {appointment._id}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">Status</p>
              <p className="mt-1 text-lg font-semibold capitalize text-emerald-900">
                {appointment.paymentStatus || 'paid'}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Patient
              </p>
              <div className="mt-4 flex items-center gap-4">
                <Avatar
                  src={user?.profileImage}
                  name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                  size="lg"
                />
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Doctor
              </p>
              <div className="mt-4 flex items-center gap-4">
                <Avatar
                  src={appointment.doctor?.profileImage}
                  name={`${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`}
                  size="lg"
                />
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                  </p>
                  <p className="text-sm text-slate-500">{appointment.doctor?.specialization}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Booking Details</h2>
              <div className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Date</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {new Date(appointment.appointmentDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Time</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {appointment.startTime} - {appointment.endTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Booking Status</p>
                  <p className="mt-1 font-medium capitalize text-slate-900">{appointment.status}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Coupon</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {appointment.payment?.coupon?.code || 'Not applied'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
              <h2 className="text-lg font-semibold text-blue-950">Amount Summary</h2>
              <div className="mt-4 space-y-3 text-sm text-blue-900">
                <div className="flex items-center justify-between">
                  <span>Consultation fee</span>
                  <span>Rs. {formatMoney(pricing.originalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span>- Rs. {formatMoney(pricing.discountAmount)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-blue-200 pt-3 text-base font-semibold">
                  <span>Final amount</span>
                  <span>Rs. {formatMoney(pricing.finalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
