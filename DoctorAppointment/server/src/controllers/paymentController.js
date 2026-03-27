import Appointment from '../models/Appointment.js';
import Coupon from '../models/Coupon.js';
import {
  calculatePriorityScore,
} from '../utils/aiScheduler.js';
import { createNotification } from '../utils/notificationService.js';
import { createOrder, verifyPayment } from '../services/paymentService.js';
import { validateAndPrepareAppointment } from '../utils/appointmentUtils.js';
import { normalizeDate } from '../utils/dateUtils.js';

const ensurePatientRole = (user) => user?.role === 'patient';

const normalizeCurrencyValue = (value) => {
  return Number(Number(value || 0).toFixed(2));
};

const normalizeCouponCode = (value = '') => {
  return String(value).trim().toUpperCase();
};

const buildCouponError = (status, code, message) => ({
  status,
  error: {
    code,
    message,
  },
});

const validateCouponForAmount = async ({ couponCode, amount }) => {
  const normalizedCode = normalizeCouponCode(couponCode);

  if (!normalizedCode) {
    return null;
  }

  const coupon = await Coupon.findOne({ code: normalizedCode });

  if (!coupon) {
    throw buildCouponError(404, 'COUPON_NOT_FOUND', 'Coupon not found');
  }

  if (!coupon.isActive) {
    throw buildCouponError(400, 'COUPON_INACTIVE', 'This coupon is inactive');
  }

  if (coupon.expiryDate < new Date()) {
    throw buildCouponError(400, 'COUPON_EXPIRED', 'This coupon has expired');
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw buildCouponError(400, 'COUPON_USAGE_EXCEEDED', 'This coupon has reached its usage limit');
  }

  const originalAmount = normalizeCurrencyValue(amount);

  if (originalAmount < normalizeCurrencyValue(coupon.minAmount)) {
    throw buildCouponError(
      400,
      'MINIMUM_AMOUNT_NOT_MET',
      `Coupon is valid only for amounts above Rs. ${normalizeCurrencyValue(coupon.minAmount)}`
    );
  }

  let discountApplied =
    coupon.discountType === 'percentage'
      ? (originalAmount * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.maxDiscount) {
    discountApplied = Math.min(discountApplied, coupon.maxDiscount);
  }

  discountApplied = Math.min(normalizeCurrencyValue(discountApplied), originalAmount);

  return {
    coupon,
    originalAmount,
    discountApplied,
    finalAmount: normalizeCurrencyValue(originalAmount - discountApplied),
  };
};

export const applyCoupon = async (req, res, next) => {
  try {
    if (!ensurePatientRole(req.user)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only patients can apply coupons',
        },
      });
    }

    const { couponCode, amount } = req.body;

    if (!couponCode || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_COUPON_FIELDS',
          message: 'couponCode and amount are required',
        },
      });
    }

    const pricing = await validateCouponForAmount({ couponCode, amount });

    return res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon: {
          id: pricing.coupon._id,
          code: pricing.coupon.code,
          discountType: pricing.coupon.discountType,
          discountValue: pricing.coupon.discountValue,
          maxDiscount: pricing.coupon.maxDiscount,
        },
        originalAmount: pricing.originalAmount,
        discountApplied: pricing.discountApplied,
        finalAmount: pricing.finalAmount,
      },
    });
  } catch (error) {
    if (error?.status && error?.error) {
      return res.status(error.status).json({
        success: false,
        error: error.error,
      });
    }

    return next(error);
  }
};

export const createPaymentOrder = async (req, res, next) => {
  try {
    if (!ensurePatientRole(req.user)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only patients can create payment orders',
        },
      });
    }

    const {
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      reason,
      symptoms = [],
      emergencyLevel = 1,
      isFollowUp = false,
      noShowHistory = 0,
      couponCode = '',
    } = req.body;

    const { waitlist, slotAvailable, doctor } = await validateAndPrepareAppointment({
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      patientId: req.user._id,
      reason,
      emergencyLevel,
      isFollowUp,
      noShowHistory,
    });

    if (waitlist) {
      return res.status(201).json({
        success: true,
        message: 'No slot was available. Patient added to waitlist.',
        data: {
          waitlist,
        },
      });
    }

    if (!slotAvailable) {
      // This should not happen if waitlist is not created, but as a safeguard
      return res.status(409).json({
        success: false,
        error: {
          code: 'SLOT_NOT_AVAILABLE',
          message: 'The requested time slot is not available. Please choose a different time.',
        },
      });
    }

    const baseAmount = normalizeCurrencyValue(doctor.consultationFee || 0);

    if (!baseAmount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONSULTATION_FEE',
          message: 'Doctor consultation fee is not configured properly',
        },
      });
    }

    const couponDetails = await validateCouponForAmount({
      couponCode,
      amount: baseAmount,
    });
    const finalAmount = couponDetails?.finalAmount ?? baseAmount;
    const amount = Math.round(finalAmount * 100);
    const originalAmount = Math.round(baseAmount * 100);
    const discountAmount = Math.round((couponDetails?.discountApplied ?? 0) * 100);

    const priorityScore = calculatePriorityScore({
      emergencyLevel,
      isFollowUp,
      noShowHistory,
    });

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      appointmentDate: normalizeDate(appointmentDate),
      startTime,
      endTime,
      reason,
      symptoms,
      emergencyLevel,
      isFollowUp,
      noShowHistory,
      priorityScore,
      status: 'pending_payment',
      paymentStatus: 'pending',
      payment: {
        originalAmount,
        discountAmount,
        amount,
        currency: 'INR',
        coupon: couponDetails
          ? {
              couponId: couponDetails.coupon._id,
              code: couponDetails.coupon.code,
              discountType: couponDetails.coupon.discountType,
              discountValue: couponDetails.coupon.discountValue,
              discountApplied: discountAmount,
            }
          : undefined,
      },
    });

    let order;

    try {
      order = await createOrder({
        amount,
        currency: 'INR',
        receipt: `apt_${appointment._id}_${Date.now()}`,
        notes: {
          appointmentId: appointment._id.toString(),
          patientId: req.user._id.toString(),
          doctorId: doctorId.toString(),
          couponCode: couponDetails?.coupon.code || '',
        },
      });
    } catch (paymentError) {
      appointment.status = 'cancelled';
      appointment.paymentStatus = 'failed';
      appointment.cancellationReason = 'Payment order could not be created';
      await appointment.save();
      throw paymentError;
    }

    appointment.payment = {
      ...appointment.payment,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      orderId: order.id,
    };
    await appointment.save();

    return res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        appointmentId: appointment._id,
        order,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        pricing: {
          originalAmount: baseAmount,
          discountApplied: couponDetails?.discountApplied ?? 0,
          finalAmount,
          coupon: couponDetails
            ? {
                code: couponDetails.coupon.code,
                discountType: couponDetails.coupon.discountType,
                discountValue: couponDetails.coupon.discountValue,
              }
            : null,
        },
      },
    });
  } catch (error) {
    if (error?.status && error?.error) {
      return res.status(error.status).json({
        success: false,
        error: error.error,
      });
    }

    return next(error);
  }
};

export const verifyAppointmentPayment = async (req, res, next) => {
  try {
    if (!ensurePatientRole(req.user)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only patients can verify payment',
        },
      });
    }

    const {
      appointmentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!appointmentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PAYMENT_FIELDS',
          message: 'appointmentId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required',
        },
      });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: req.user._id,
      status: 'pending_payment',
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPOINTMENT_NOT_FOUND',
          message: 'Pending appointment not found',
        },
      });
    }

    if (appointment.payment?.orderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_MISMATCH',
          message: 'Payment order does not match the appointment record',
        },
      });
    }

    const isPaymentValid = verifyPayment({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isPaymentValid) {
      appointment.paymentStatus = 'failed';
      await appointment.save();

      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYMENT_SIGNATURE',
          message: 'Payment verification failed',
        },
      });
    }

    appointment.status = 'confirmed';
    appointment.paymentStatus = 'paid';
    appointment.payment = {
      ...appointment.payment,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      paidAt: new Date(),
    };
    await appointment.save();

    if (appointment.payment?.coupon?.couponId) {
      await Coupon.findByIdAndUpdate(appointment.payment.coupon.couponId, {
        $inc: { usedCount: 1 },
      });
    }

    await createNotification({
      recipient: appointment.patient,
      relatedAppointment: appointment._id,
      type: 'appointment-booked',
      title: 'Appointment booked',
      message: `Payment received. Your appointment for ${appointment.startTime}-${appointment.endTime} is confirmed.`,
      metadata: { appointmentId: appointment._id, orderId: razorpayOrderId },
    });

    await createNotification({
      recipient: appointment.doctor,
      relatedAppointment: appointment._id,
      type: 'appointment-booked',
      title: 'New paid appointment booked',
      message: `A patient completed payment for ${appointment.startTime}-${appointment.endTime}.`,
      metadata: { appointmentId: appointment._id, patientId: appointment.patient },
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and appointment confirmed',
      data: {
        appointment,
      },
    });
  } catch (error) {
    return next(error);
  }
};
