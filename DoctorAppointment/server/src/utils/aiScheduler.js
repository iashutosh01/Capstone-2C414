import Appointment from '../models/Appointment.js';
import Waitlist from '../models/Waitlist.js';
import User from '../models/User.js';
import { createNotification } from './notificationService.js';

const ACTIVE_APPOINTMENT_STATUSES = ['scheduled', 'rescheduled', 'auto-assigned'];

const getDayName = (date) => {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};

const normalizeDate = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const calculatePriorityScore = ({
  emergencyLevel = 1,
  isFollowUp = false,
  noShowHistory = 0,
}) => {
  return emergencyLevel * 5 + (isFollowUp ? 2 : 1) + noShowHistory * -2;
};

export const isTimeRangeValid = (startTime, endTime) => {
  return Boolean(startTime && endTime && startTime < endTime);
};

export const isDoctorSlotWithinAvailability = (doctor, appointmentDate, startTime, endTime) => {
  const dayName = getDayName(appointmentDate);

  return doctor.availableSlots.some(
    (slot) =>
      slot.isActive !== false &&
      slot.day === dayName &&
      slot.startTime <= startTime &&
      slot.endTime >= endTime
  );
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
    return false;
  }

  const normalizedDate = normalizeDate(appointmentDate);

  const doctorConflictQuery = {
    doctor: doctor._id,
    appointmentDate: normalizedDate,
    startTime,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
  };
  const queries = [Appointment.findOne(doctorConflictQuery)];

  if (excludeAppointmentId) {
    doctorConflictQuery._id = { $ne: excludeAppointmentId };
  }

  if (patientId) {
    const patientConflictQuery = {
      patient: patientId,
      appointmentDate: normalizedDate,
      startTime,
      status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    };

    if (excludeAppointmentId) {
      patientConflictQuery._id = { $ne: excludeAppointmentId };
    }

    queries.push(Appointment.findOne(patientConflictQuery));
  }

  const [doctorConflict, patientConflict] = await Promise.all(queries);

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
