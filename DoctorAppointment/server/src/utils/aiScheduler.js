import Appointment from '../models/Appointment.js';
import Waitlist from '../models/Waitlist.js';
import User from '../models/User.js';
import { createNotification } from './notificationService.js';

const ACTIVE_APPOINTMENT_STATUSES = [
  'pending_payment',
  'confirmed',
  'scheduled',
  'rescheduled',
  'auto-assigned',
];

const normalizeTime = (value = '') => {
  const [rawHours = '0', rawMinutes = '0'] = String(value).split(':');
  const hours = rawHours.padStart(2, '0');
  const minutes = rawMinutes.padStart(2, '0');
  return `${hours}:${minutes}`;
};

const toMinutes = (value) => {
  const [hours, minutes] = normalizeTime(value).split(':').map(Number);
  return hours * 60 + minutes;
};

const fromMinutes = (value) => {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (value % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const parseDateInput = (value) => {
  if (value instanceof Date) {
    return new Date(value);
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
};

export const getDayName = (date) => {
  return parseDateInput(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};

const normalizeDate = (value) => {
  const date = parseDateInput(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDayRange = (value) => {
  const start = normalizeDate(value);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const calculatePriorityScore = ({
  emergencyLevel = 1,
  isFollowUp = false,
  noShowHistory = 0,
}) => {
  return emergencyLevel * 5 + (isFollowUp ? 2 : 1) + noShowHistory * -2;
};

export const isTimeRangeValid = (startTime, endTime) => {
  return Boolean(startTime && endTime && toMinutes(startTime) < toMinutes(endTime));
};

export const generateTimeSlots = ({ startTime, endTime, slotDuration = 30 }) => {
  if (!isTimeRangeValid(startTime, endTime)) {
    return [];
  }

  const duration = Number(slotDuration) || 30;
  if (duration <= 0) {
    return [];
  }

  const slots = [];
  const rangeStart = toMinutes(startTime);
  const rangeEnd = toMinutes(endTime);

  for (let current = rangeStart; current + duration <= rangeEnd; current += duration) {
    slots.push({
      startTime: fromMinutes(current),
      endTime: fromMinutes(current + duration),
    });
  }

  return slots;
};

export const getDoctorAvailableTimeSlots = ({
  doctor,
  appointmentDate,
  appointments = [],
}) => {
  if (!doctor || !appointmentDate || !Array.isArray(doctor.availableSlots)) {
    return [];
  }

  const requestedDay = getDayName(appointmentDate);
  const bookedAppointments = appointments.filter((appointment) =>
    ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status)
  );

  const uniqueSlots = new Map();

  doctor.availableSlots
    .filter((slot) => slot.isActive !== false && slot.day === requestedDay)
    .forEach((slot) => {
      const generatedSlots = generateTimeSlots({
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotDuration: slot.slotDuration,
      });

      generatedSlots.forEach((generatedSlot) => {
        const hasConflict = bookedAppointments.some((appointment) => {
          return (
            toMinutes(appointment.startTime) < toMinutes(generatedSlot.endTime) &&
            toMinutes(appointment.endTime) > toMinutes(generatedSlot.startTime)
          );
        });

        if (!hasConflict) {
          const key = `${generatedSlot.startTime}-${generatedSlot.endTime}`;
          uniqueSlots.set(key, {
            ...generatedSlot,
            label: `${generatedSlot.startTime} - ${generatedSlot.endTime}`,
          });
        }
      });
    });

  return Array.from(uniqueSlots.values()).sort(
    (left, right) => toMinutes(left.startTime) - toMinutes(right.startTime)
  );
};

export const isDoctorSlotWithinAvailability = (doctor, appointmentDate, startTime, endTime) => {
  const dayName = getDayName(appointmentDate);
  const normalizedStartTime = normalizeTime(startTime);
  const normalizedEndTime = normalizeTime(endTime);

  const matchedSlot = doctor.availableSlots.find(
    (slot) =>
      slot.isActive !== false &&
      slot.day === dayName &&
      toMinutes(slot.startTime) <= toMinutes(normalizedStartTime) &&
      toMinutes(slot.endTime) >= toMinutes(normalizedEndTime)
  );

  console.log('[BookingDebug] Availability slot check', {
    doctorId: doctor._id?.toString(),
    appointmentDate: normalizeDate(appointmentDate).toISOString(),
    requestedDay: dayName,
    requestedStartTime: normalizedStartTime,
    requestedEndTime: normalizedEndTime,
    doctorSlots: doctor.availableSlots,
    matchedSlot: matchedSlot || null,
  });

  return Boolean(matchedSlot);
};

export const canDoctorAcceptAppointments = (doctor) => {
  return doctor.availabilityStatus === 'available' && doctor.isAvailable;
};

export const isDoctorAvailableForSlot = async ({
  doctor,
  appointmentDate,
  startTime,
  endTime,
  patientId = null,
  excludeAppointmentId = null,
}) => {
  if (!doctor || doctor.role !== 'doctor') {
    return false;
  }

  if (!isTimeRangeValid(startTime, endTime)) {
    return false;
  }

  if (!canDoctorAcceptAppointments(doctor)) {
    return false;
  }

  if (!isDoctorSlotWithinAvailability(doctor, appointmentDate, startTime, endTime)) {
    console.log('[BookingDebug] Doctor slot unavailable', {
      doctorId: doctor._id?.toString(),
      appointmentDate,
      startTime: normalizeTime(startTime),
      endTime: normalizeTime(endTime),
      availabilityStatus: doctor.availabilityStatus,
      isAvailable: doctor.isAvailable,
    });
    return false;
  }

  const { start: dayStart, end: dayEnd } = getDayRange(appointmentDate);
  const normalizedStartTime = normalizeTime(startTime);
  const normalizedEndTime = normalizeTime(endTime);

  const PENDING_EXPIRATION_MINUTES = 15;
  const expirationDate = new Date(Date.now() - PENDING_EXPIRATION_MINUTES * 60 * 1000);

  const conflictClause = {
    appointmentDate: { $gte: dayStart, $lte: dayEnd },
    startTime: { $lt: normalizedEndTime },
    endTime: { $gt: normalizedStartTime },
    $or: [
      { status: { $in: ['confirmed', 'scheduled', 'rescheduled', 'auto-assigned'] } },
      { status: 'pending_payment', createdAt: { $gte: expirationDate } },
    ],
  };

  if (excludeAppointmentId) {
    conflictClause._id = { $ne: excludeAppointmentId };
  }

  const doctorConflictQuery = {
    doctor: doctor._id,
    ...conflictClause,
  };

  const queries = [Appointment.findOne(doctorConflictQuery)];

  if (patientId) {
    const patientConflictQuery = {
      patient: patientId,
      ...conflictClause,
    };
    queries.push(Appointment.findOne(patientConflictQuery));
  }

  const [doctorConflict, patientConflict] = await Promise.all(queries);

  console.log('[BookingDebug] Conflict check', {
    doctorId: doctor._id?.toString(),
    patientId: patientId?.toString?.() || patientId || null,
    appointmentDate: normalizeDate(appointmentDate).toISOString(),
    requestedStartTime: normalizedStartTime,
    requestedEndTime: normalizedEndTime,
    doctorConflict: doctorConflict
      ? {
          id: doctorConflict._id.toString(),
          startTime: doctorConflict.startTime,
          endTime: doctorConflict.endTime,
        }
      : null,
    patientConflict: patientConflict
      ? {
          id: patientConflict._id.toString(),
          startTime: patientConflict.startTime,
          endTime: patientConflict.endTime,
        }
      : null,
  });

  return !doctorConflict && !patientConflict;
};

export const assignWaitlistSlot = async ({
  doctorId,
  appointmentDate,
  startTime,
  endTime,
  trigger = 'availability-update',
}) => {
  const doctor = await User.findById(doctorId);

  if (!doctor || !canDoctorAcceptAppointments(doctor)) {
    return null;
  }

  const candidate = await Waitlist.findOne({
    doctor: doctorId,
    requestedDate: normalizeDate(appointmentDate),
    status: 'waiting',
  })
    .sort({ priorityScore: -1, createdAt: 1 })
    .populate('patient', 'firstName lastName role');

  if (!candidate) {
    return null;
  }

  const slotAvailable = await isDoctorAvailableForSlot({
    doctor,
    appointmentDate,
    startTime,
    endTime,
  });

  if (!slotAvailable) {
    return null;
  }

  const appointment = await Appointment.create({
    patient: candidate.patient._id,
    doctor: doctorId,
    appointmentDate: normalizeDate(appointmentDate),
    startTime,
    endTime,
    status: 'auto-assigned',
    reason: candidate.reason,
    emergencyLevel: candidate.emergencyLevel,
    isFollowUp: candidate.isFollowUp,
    noShowHistory: candidate.noShowHistory,
    priorityScore: candidate.priorityScore,
    source: 'waitlist-auto',
  });

  candidate.status = 'assigned';
  candidate.assignedAppointment = appointment._id;
  await candidate.save();

  await createNotification({
    recipient: candidate.patient._id,
    relatedAppointment: appointment._id,
    type: 'waitlist-assigned',
    title: 'Slot assigned from waitlist',
    message: `A slot with Dr. ${doctor.firstName} ${doctor.lastName} has been assigned from the waitlist.`,
    metadata: { trigger, doctorId, appointmentDate: normalizeDate(appointmentDate), startTime, endTime },
  });

  await createNotification({
    recipient: doctorId,
    relatedAppointment: appointment._id,
    type: 'waitlist-assigned',
    title: 'Waitlist patient assigned',
    message: `A waitlisted patient has been auto-assigned to ${startTime}-${endTime}.`,
    metadata: { trigger, patientId: candidate.patient._id, appointmentDate: normalizeDate(appointmentDate) },
  });

  return appointment;
};

export const assignSlotFromWaitlist = async (doctorId, date, slotOverrides = {}) => {
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor || !canDoctorAcceptAppointments(doctor)) {
    return null;
  }

  const requestedDate = normalizeDate(date);

  const waitlistEntries = await Waitlist.find({
    doctor: doctorId,
    requestedDate,
    status: 'waiting',
  })
    .sort({ priorityScore: -1, createdAt: 1 })
    .populate('patient', 'firstName lastName');

  if (!waitlistEntries.length) {
    return null;
  }

  for (const entry of waitlistEntries) {
    const startTime = slotOverrides.startTime || entry.preferredStartTime;
    const endTime = slotOverrides.endTime || entry.preferredEndTime;

    if (!isTimeRangeValid(startTime, endTime)) {
      continue;
    }

    const slotAvailable = await isDoctorAvailableForSlot({
      doctor,
      appointmentDate: requestedDate,
      startTime,
      endTime,
    });

    if (!slotAvailable) {
      continue;
    }

    const appointment = await Appointment.create({
      patient: entry.patient._id,
      doctor: doctorId,
      appointmentDate: requestedDate,
      startTime,
      endTime,
      status: 'auto-assigned',
      reason: entry.reason,
      emergencyLevel: entry.emergencyLevel,
      isFollowUp: entry.isFollowUp,
      noShowHistory: entry.noShowHistory,
      priorityScore: entry.priorityScore,
      source: 'waitlist-auto',
    });

    entry.status = 'assigned';
    entry.assignedAppointment = appointment._id;
    await entry.save();

    await createNotification({
      recipient: entry.patient._id,
      relatedAppointment: appointment._id,
      type: 'waitlist-assigned',
      title: 'Slot assigned from waitlist',
      message: `A new appointment slot on ${requestedDate.toDateString()} has been assigned to you.`,
      metadata: { doctorId, date: requestedDate, startTime, endTime },
    });

    await createNotification({
      recipient: doctorId,
      relatedAppointment: appointment._id,
      type: 'waitlist-assigned',
      title: 'Waitlist slot filled',
      message: `A waitlisted patient has been assigned to ${startTime}-${endTime}.`,
      metadata: { patientId: entry.patient._id, date: requestedDate },
    });

    return appointment;
  }

  return null;
};
