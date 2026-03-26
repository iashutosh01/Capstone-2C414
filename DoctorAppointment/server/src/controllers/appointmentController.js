import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import Waitlist from '../models/Waitlist.js';
import User from '../models/User.js';
import {
  assignSlotFromWaitlist,
  assignWaitlistSlot,
  calculatePriorityScore,
  isDoctorAvailableForSlot,
  isTimeRangeValid,
} from '../utils/aiScheduler.js';
import { createNotification } from '../utils/notificationService.js';

const ACTIVE_APPOINTMENT_STATUSES = [
  'pending_payment',
  'confirmed',
  'scheduled',
  'rescheduled',
  'auto-assigned',
];

const ensurePatientRole = (user) => user?.role === 'patient';

const normalizeDate = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const validateBookingInput = ({ doctorId, appointmentDate, startTime, endTime }) => {
  if (!doctorId || !appointmentDate || !startTime || !endTime) {
    return {
      status: 400,
      code: 'MISSING_FIELDS',
      message: 'doctorId, appointmentDate, startTime, and endTime are required',
    };
  }

  if (!isTimeRangeValid(startTime, endTime)) {
    return {
      status: 400,
      code: 'INVALID_TIME_RANGE',
      message: 'Start time must be earlier than end time',
    };
  }

  return null;
};

const loadDoctor = async (doctorId) => {
  return User.findOne({ _id: doctorId, role: 'doctor' });
};

const buildWaitlistEntry = async ({
  patientId,
  doctorId,
  appointmentDate,
  startTime,
  endTime,
  reason,
  emergencyLevel,
  isFollowUp,
  noShowHistory,
}) => {
  const requestedDate = normalizeDate(appointmentDate);
  const priorityScore = calculatePriorityScore({
    emergencyLevel,
    isFollowUp,
    noShowHistory,
  });

  let waitlistEntry = await Waitlist.findOne({
    patient: patientId,
    doctor: doctorId,
    requestedDate,
    preferredStartTime: startTime,
    status: 'waiting',
  });

  if (!waitlistEntry) {
    waitlistEntry = await Waitlist.create({
      patient: patientId,
      doctor: doctorId,
      requestedDate,
      preferredStartTime: startTime,
      preferredEndTime: endTime,
      reason,
      emergencyLevel,
      isFollowUp,
      noShowHistory,
      priorityScore,
    });
  }

  await createNotification({
    recipient: patientId,
    type: 'system',
    title: 'Added to waitlist',
    message: 'No slot was available, so you have been added to the waitlist.',
    metadata: { waitlistId: waitlistEntry._id, doctorId, appointmentDate: requestedDate },
  });

  return waitlistEntry;
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
    } = req.body;

    const validationError = validateBookingInput({
      doctorId,
      appointmentDate,
      startTime,
      endTime,
    });

    if (validationError) {
      return res.status(validationError.status).json({
        success: false,
        error: {
          code: validationError.code,
          message: validationError.message,
        },
      });
    }

    const doctor = await loadDoctor(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCTOR_NOT_FOUND',
          message: 'Doctor not found',
        },
      });
    }

    console.log('[BookingDebug] Doctor booking request', {
      doctorId: doctor._id.toString(),
      availabilityStatus: doctor.availabilityStatus,
      isAvailable: doctor.isAvailable,
      availableSlots: doctor.availableSlots,
      appointmentDate,
      startTime,
      endTime,
    });

    const slotAvailable = await isDoctorAvailableForSlot({
      doctor,
      appointmentDate,
      startTime,
      endTime,
      patientId: req.user._id,
    });

    console.log('[BookingDebug] Slot availability result', {
      doctorId: doctor._id.toString(),
      appointmentDate,
      startTime,
      endTime,
      slotAvailable,
    });

    if (!slotAvailable) {
      const waitlistEntry = await buildWaitlistEntry({
        patientId: req.user._id,
        doctorId,
        appointmentDate,
        startTime,
        endTime,
        reason,
        emergencyLevel,
        isFollowUp,
        noShowHistory,
      });

      return res.status(201).json({
        success: true,
        message: 'No slot was available. Patient added to waitlist.',
        data: {
          waitlist: waitlistEntry,
        },
      });
    }

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
    });

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

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointment,
      },
    });
  } catch (error) {
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
    const validationError = validateBookingInput({
      doctorId: targetDoctorId,
      appointmentDate,
      startTime,
      endTime,
    });

    if (validationError) {
      return res.status(validationError.status).json({
        success: false,
        error: {
          code: validationError.code,
          message: validationError.message,
        },
      });
    }

    const doctor = await loadDoctor(targetDoctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCTOR_NOT_FOUND',
          message: 'Doctor not found',
        },
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = 'Rescheduled to a new slot';
    await appointment.save();

    const slotAvailable = await isDoctorAvailableForSlot({
      doctor,
      appointmentDate,
      startTime,
      endTime,
      patientId: appointment.patient,
    });

    if (!slotAvailable) {
      const waitlistEntry = await buildWaitlistEntry({
        patientId: appointment.patient,
        doctorId: targetDoctorId,
        appointmentDate,
        startTime,
        endTime,
        reason: reason || appointment.reason,
        emergencyLevel: emergencyLevel ?? appointment.emergencyLevel,
        isFollowUp: isFollowUp ?? appointment.isFollowUp,
        noShowHistory: noShowHistory ?? appointment.noShowHistory,
      });

      await createNotification({
        recipient: appointment.patient,
        relatedAppointment: appointment._id,
        type: 'appointment-rescheduled',
        title: 'Appointment moved to waitlist',
        message: 'Your original appointment was cancelled and the new requested slot has been added to the waitlist.',
        metadata: { oldAppointmentId: appointment._id, waitlistId: waitlistEntry._id },
      });

      return res.status(200).json({
        success: true,
        message: 'Original appointment cancelled and new request added to waitlist',
        data: {
          cancelledAppointment: appointment,
          waitlist: waitlistEntry,
        },
      });
    }

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
