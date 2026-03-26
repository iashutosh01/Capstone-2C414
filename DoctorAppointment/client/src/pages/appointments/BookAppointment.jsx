import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import NotificationBell from '../../components/common/NotificationBell';
import RatingStars from '../../components/common/RatingStars';
import {
  applyCoupon,
  clearAppointmentError,
  clearCouponPreview,
  clearAppointmentSuccess,
  createPaymentOrder,
  getDoctors,
  verifyAppointmentPayment,
} from '../../redux/slices/appointmentSlice';

const initialForm = {
  doctorId: '',
  appointmentDate: '',
  startTime: '',
  endTime: '',
  reason: '',
  couponCode: '',
  emergencyLevel: 1,
  isFollowUp: false,
  noShowHistory: 0,
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const BookAppointment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { doctors, loading, actionLoading, couponLoading, couponPreview, error, successMessage } =
    useSelector((state) => state.appointments);
  const [formData, setFormData] = useState(initialForm);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    dispatch(getDoctors());
    dispatch(clearAppointmentError());
    dispatch(clearAppointmentSuccess());
    dispatch(clearCouponPreview());
  }, [dispatch]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === formData.doctorId),
    [doctors, formData.doctorId]
  );

  const sortedDoctors = useMemo(
    () =>
      [...doctors].sort(
        (left, right) =>
          Number(right.rating || 4) - Number(left.rating || 4) ||
          Number(left.consultationFee || 0) - Number(right.consultationFee || 0)
      ),
    [doctors]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCheckoutError('');

    if (name === 'doctorId' || name === 'couponCode') {
      dispatch(clearCouponPreview());
    }

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleApplyCoupon = async () => {
    setCheckoutError('');

    if (!selectedDoctor) {
      setCheckoutError('Select a doctor before applying a coupon.');
      return;
    }

    if (!formData.couponCode.trim()) {
      setCheckoutError('Enter a coupon code to apply the discount.');
      return;
    }

    await dispatch(
      applyCoupon({
        couponCode: formData.couponCode,
        amount: Number(selectedDoctor.consultationFee || 0),
      })
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCheckoutError('');

    const result = await dispatch(
      createPaymentOrder({
        ...formData,
        emergencyLevel: Number(formData.emergencyLevel),
        noShowHistory: Number(formData.noShowHistory),
        couponCode: formData.couponCode.trim(),
      })
    );

    if (!createPaymentOrder.fulfilled.match(result)) {
      return;
    }

    if (result.payload.data.waitlist) {
      setFormData(initialForm);
      return;
    }

    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded || !window.Razorpay) {
      setCheckoutError('Unable to load Razorpay checkout right now. Please try again.');
      return;
    }

    const { order, appointmentId, razorpayKeyId } = result.payload.data;

    const razorpay = new window.Razorpay({
      key: razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: 'AI-MediCare',
      description: 'Appointment booking payment',
      order_id: order.id,
      prefill: {
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        email: user?.email || '',
        contact: user?.phone || '',
      },
      theme: {
        color: '#2563eb',
      },
      handler: async (response) => {
        const verifyResult = await dispatch(
          verifyAppointmentPayment({
            appointmentId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
        );

        if (verifyAppointmentPayment.fulfilled.match(verifyResult)) {
          setFormData(initialForm);
          dispatch(clearCouponPreview());
          navigate(`/patient/booking-success/${appointmentId}`);
        }
      },
      modal: {
        ondismiss: () => {
          setCheckoutError('Payment was cancelled before completion.');
        },
      },
    });

    razorpay.open();
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
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
              <Avatar
                src={user?.profileImage}
                name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                size="sm"
              />
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500">Patient</p>
              </div>
            </div>
            <Link to="/patient/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
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

            {checkoutError ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">
                <p className="text-sm">{checkoutError}</p>
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
                  {sortedDoctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              {sortedDoctors.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {sortedDoctors.map((doctor) => {
                    const isSelected = doctor._id === formData.doctorId;

                    return (
                      <button
                        key={doctor._id}
                        type="button"
                        onClick={() => {
                          dispatch(clearCouponPreview());
                          setCheckoutError('');
                          setFormData((previous) => ({
                            ...previous,
                            doctorId: doctor._id,
                          }));
                        }}
                        className={`rounded-3xl border p-4 text-left transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Avatar
                            src={doctor.profileImage}
                            name={`${doctor.firstName} ${doctor.lastName}`}
                            size="lg"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-lg font-semibold text-slate-900">
                                  Dr. {doctor.firstName} {doctor.lastName}
                                </p>
                                <p className="text-sm text-slate-500">{doctor.specialization}</p>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                  doctor.availabilityStatus === 'available'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {doctor.availabilityStatus}
                              </span>
                            </div>
                            <div className="mt-3">
                              <RatingStars
                                rating={doctor.rating}
                                ratingsCount={doctor.ratingsCount}
                              />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                              <span>{doctor.experience || 0}+ years experience</span>
                              <span className="font-semibold text-slate-900">
                                Rs. {Number(doctor.consultationFee || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

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

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Coupon Code</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleChange}
                    placeholder="Enter coupon code"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyCoupon}
                    loading={couponLoading}
                  >
                    Apply Coupon
                  </Button>
                </div>

                {selectedDoctor ? (
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Consultation fee</span>
                      <span>Rs. {Number(selectedDoctor.consultationFee || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Discount</span>
                      <span className="text-emerald-600">
                        - Rs. {Number(couponPreview?.discountApplied || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                      <span>Final payable</span>
                      <span>
                        Rs.{' '}
                        {Number(
                          couponPreview?.finalAmount ?? selectedDoctor.consultationFee ?? 0
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

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
                Pay & Confirm Booking
              </Button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Doctor Details</h2>
              {selectedDoctor ? (
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={selectedDoctor.profileImage}
                      name={`${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
                      size="lg"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                      </p>
                      <p>{selectedDoctor.specialization}</p>
                    </div>
                  </div>
                  <RatingStars
                    rating={selectedDoctor.rating}
                    ratingsCount={selectedDoctor.ratingsCount}
                  />
                  <p>Status: {selectedDoctor.availabilityStatus}</p>
                  <p>Fee: Rs. {selectedDoctor.consultationFee}</p>
                  {couponPreview?.coupon?.code ? (
                    <p className="text-emerald-600">
                      Coupon: {couponPreview.coupon.code} applied
                    </p>
                  ) : null}
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
