import Appointment from '../models/Appointment.js';
import Coupon from '../models/Coupon.js';
import Notification from '../models/Notification.js';
import {
  assignSlotFromWaitlist,
  assignWaitlistSlot,
  calculatePriorityScore,
} from '../utils/aiScheduler.js';
import { createNotification } from '../utils/notificationService.js';
import { validateAndPrepareAppointment } from '../utils/appointmentUtils.js';
import { normalizeDate } from '../utils/dateUtils.js';
import {
  sendAppointmentConfirmedEmail,
  sendNewAppointmentAssignedEmail,
} from '../utils/emailService.js';
import { normalizeCurrencyValue, validateCouponForAmount } from '../utils/paymentUtils.js';

const ACTIVE_APPOINTMENT_STATUSES = [
  'pending_payment',
  'confirmed',
  'scheduled',
  'rescheduled',
  'auto-assigned',
];

const ensurePatientRole = (user) => user?.role === 'patient';

const buildRequestedSlotDateTime = (appointmentDate, startTime) => {
  if (!appointmentDate || !startTime) {
    return null;
  }

  let date;

  if (typeof appointmentDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
    const [year, month, day] = appointmentDate.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(appointmentDate);
  }

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const [hours = '0', minutes = '0'] = String(startTime).split(':');
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date;
};

const createAppointmentRecord = async ({
  patientId,
  doctorId,
  appointmentDate,
  startTime,
  endTime,
  reason,
  symptoms = [],
  emergencyLevel = 1,
  isFollowUp = false,
  noShowHistory = 0,
  status = 'scheduled',
  paymentStatus,
  payment,
  source = 'manual',
  rescheduledFrom = null,
}) => {
  const priorityScore = calculatePriorityScore({
    emergencyLevel,
    isFollowUp,
    noShowHistory,
  });

  return Appointment.create({
    patient: patientId,
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
    status,
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(payment ? { payment } : {}),
    source,
    rescheduledFrom,
  });
};

export const bookAppointment = async (req, res, next) => {
  try {
    if (!ensurePatientRole(req.user)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only patients can book appointments',
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
      paymentId = '',
      paymentOrderId = '',
      paymentSignature = '',
    } = req.body;

    const requestedSlotDateTime = buildRequestedSlotDateTime(appointmentDate, startTime);

    if (requestedSlotDateTime && requestedSlotDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAST_TIME_SLOT',
          message: 'Cannot book past time slot',
        },
      });
    }

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

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_REQUIRED',
          message: 'Payment must be completed before confirming the appointment',
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
    const payment = {
      originalAmount: Math.round(baseAmount * 100),
      discountAmount: Math.round((couponDetails?.discountApplied ?? 0) * 100),
      amount: Math.round(finalAmount * 100),
      currency: 'INR',
      orderId: paymentOrderId,
      paymentId,
      signature: paymentSignature,
      paidAt: new Date(),
      coupon: couponDetails
        ? {
            couponId: couponDetails.coupon._id,
            code: couponDetails.coupon.code,
            discountType: couponDetails.coupon.discountType,
            discountValue: couponDetails.coupon.discountValue,
            discountApplied: Math.round(couponDetails.discountApplied * 100),
          }
        : undefined,
    };

    const appointment = await createAppointmentRecord({
      patientId: req.user._id,
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      reason,
      symptoms,
      emergencyLevel,
      isFollowUp,
      noShowHistory,
      status: 'confirmed',
      paymentStatus: 'paid',
      payment,
    });

    if (payment.coupon?.couponId) {
      await Coupon.findByIdAndUpdate(payment.coupon.couponId, {
        $inc: { usedCount: 1 },
      });
    }

    await createNotification({
      recipient: req.user._id,
      relatedAppointment: appointment._id,
      type: 'appointment-booked',
      title: 'Appointment booked',
      message: `Your appointment for ${startTime}-${endTime} has been booked successfully.`,
      metadata: { doctorId, appointmentDate: normalizeDate(appointmentDate) },
    });

    await createNotification({
      recipient: doctorId,
      relatedAppointment: appointment._id,
      type: 'appointment-booked',
      title: 'New appointment booked',
      message: `A patient booked an appointment for ${startTime}-${endTime}.`,
      metadata: { patientId: req.user._id, appointmentDate: normalizeDate(appointmentDate) },
    });

    await Promise.allSettled([
      sendAppointmentConfirmedEmail({
        patientEmail: req.user.email,
        patientName: `${req.user.firstName} ${req.user.lastName}`.trim(),
        doctorName: `${doctor.firstName} ${doctor.lastName}`.trim(),
        appointmentDate,
        startTime,
        endTime,
        reason,
      }),
      sendNewAppointmentAssignedEmail({
        doctorEmail: doctor.email,
        doctorName: `${doctor.firstName} ${doctor.lastName}`.trim(),
        patientName: `${req.user.firstName} ${req.user.lastName}`.trim(),
        appointmentDate,
        startTime,
        endTime,
        reason,
      }),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointment,
      },
    });
  } catch (error) {
    if (error.status && error.code) {
      return res.status(error.status).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
    return next(error);
  }
};

export const getMyAppointments = async (req, res, next) => {
  try {
    const query =
      req.user.role === 'doctor'
        ? { doctor: req.user._id }
        : req.user.role === 'patient'
          ? { patient: req.user._id }
          : {};

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phone profileImage')
      .populate('doctor', 'firstName lastName specialization availabilityStatus consultationFee profileImage rating ratingsCount')
      .sort({ appointmentDate: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      data: {
        appointments,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellationReason = '' } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPOINTMENT_NOT_FOUND',
          message: 'Appointment not found',
        },
      });
    }

    const isOwner =
      appointment.patient.toString() === req.user._id.toString() ||
      appointment.doctor.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not allowed to cancel this appointment',
        },
      });
    }

    if (!ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_APPOINTMENT_STATE',
          message: 'Only active appointments can be cancelled',
        },
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason;
    await appointment.save();

    await createNotification({
      recipient: appointment.patient,
      relatedAppointment: appointment._id,
      type: 'appointment-cancelled',
      title: 'Appointment cancelled',
      message: 'Your appointment has been cancelled.',
      metadata: { appointmentId: appointment._id, cancellationReason },
    });

    await createNotification({
      recipient: appointment.doctor,
      relatedAppointment: appointment._id,
      type: 'appointment-cancelled',
      title: 'Appointment cancelled',
      message: 'An appointment in your schedule has been cancelled.',
      metadata: { appointmentId: appointment._id, cancellationReason },
    });

    const autoAssignedAppointment =
      (await assignSlotFromWaitlist(appointment.doctor, appointment.appointmentDate, {
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      })) ||
      (await assignWaitlistSlot({
        doctorId: appointment.doctor,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        trigger: 'appointment-cancelled',
      }));

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        appointment,
        autoAssignedAppointment,
      },
    });
  } catch (error) {
    return next(error);
  }
};

import { validateBookingInput, loadDoctor } from '../utils/appointmentUtils.js';

//... (other code)

export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      reason,
      symptoms,
      emergencyLevel,
      isFollowUp,
      noShowHistory,
    } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPOINTMENT_NOT_FOUND',
          message: 'Appointment not found',
        },
      });
    }

    const isOwner =
      appointment.patient.toString() === req.user._id.toString() ||
      appointment.doctor.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not allowed to reschedule this appointment',
        },
      });
    }

    if (!ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_APPOINTMENT_STATE',
          message: 'Only active appointments can be rescheduled',
        },
      });
    }

    const targetDoctorId = doctorId || appointment.doctor;
    const requestedSlotDateTime = buildRequestedSlotDateTime(appointmentDate, startTime);

    if (requestedSlotDateTime && requestedSlotDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAST_TIME_SLOT',
          message: 'Cannot book past time slot',
        },
      });
    }
    
    try {
      validateBookingInput({
        doctorId: targetDoctorId,
        appointmentDate,
        startTime,
        endTime,
      });
    } catch (error) {
      return res.status(error.status).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    const doctor = await loadDoctor(targetDoctorId);

    const slotAvailable = await isDoctorAvailableForSlot({
      doctor,
      appointmentDate,
      startTime,
      endTime,
      patientId: appointment.patient,
      excludeAppointmentId: appointment._id, // Exclude current appointment from check
    });

    if (!slotAvailable) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'SLOT_NOT_AVAILABLE',
          message: 'The requested time slot is not available. Please choose a different time.',
        },
      });
    }

    // Now that we've confirmed the new slot is available, cancel the old one.
    appointment.status = 'cancelled';
    appointment.cancellationReason = 'Rescheduled to a new slot';
    await appointment.save();

    const newAppointment = await createAppointmentRecord({
      patientId: appointment.patient,
      doctorId: targetDoctorId,
      appointmentDate,
      startTime,
      endTime,
      reason: reason || appointment.reason,
      symptoms: symptoms || appointment.symptoms,
      emergencyLevel: emergencyLevel ?? appointment.emergencyLevel,
      isFollowUp: isFollowUp ?? appointment.isFollowUp,
      noShowHistory: noShowHistory ?? appointment.noShowHistory,
      status: 'rescheduled',
      rescheduledFrom: appointment._id,
    });

    await createNotification({
      recipient: appointment.patient,
      relatedAppointment: newAppointment._id,
      type: 'appointment-rescheduled',
      title: 'Appointment rescheduled',
      message: `Your appointment has been moved to ${startTime}-${endTime}.`,
      metadata: {
        appointmentDate: normalizeDate(appointmentDate),
        oldAppointmentId: appointment._id,
        newAppointmentId: newAppointment._id,
      },
    });

    await createNotification({
      recipient: targetDoctorId,
      relatedAppointment: newAppointment._id,
      type: 'appointment-rescheduled',
      title: 'Appointment rescheduled',
      message: `An appointment in your schedule has been rescheduled to ${startTime}-${endTime}.`,
      metadata: {
        appointmentDate: normalizeDate(appointmentDate),
        oldAppointmentId: appointment._id,
        newAppointmentId: newAppointment._id,
      },
    });

    if (appointment.doctor.toString() !== targetDoctorId.toString()) {
      await createNotification({
        recipient: appointment.doctor,
        relatedAppointment: appointment._id,
        type: 'appointment-cancelled',
        title: 'Appointment removed from schedule',
        message: 'An appointment was moved away from your schedule during rescheduling.',
        metadata: { oldAppointmentId: appointment._id },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: {
        cancelledAppointment: appointment,
        appointment: newAppointment,
      },
    });
  } catch (error) {
    if (error.status && error.code) {
      return res.status(error.status).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
    return next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        notifications,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification,
      },
    });
  } catch (error) {
    return next(error);
  }
};
