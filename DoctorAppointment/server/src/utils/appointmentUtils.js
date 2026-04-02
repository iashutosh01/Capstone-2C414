import User from '../models/User.js';
import Waitlist from '../models/Waitlist.js';
import {
  isDoctorAvailableForSlot,
  isTimeRangeValid,
  calculatePriorityScore,
} from './aiScheduler.js';
import { createNotification } from './notificationService.js';
import { normalizeDate } from './dateUtils.js';

export const validateBookingInput = (
  { doctorId, appointmentDate, startTime, endTime },
  { allowMissingTime = false } = {}
) => {
  if (!doctorId || !appointmentDate) {
    throw {
      status: 400,
      code: 'MISSING_FIELDS',
      message: 'doctorId and appointmentDate are required',
    };
  }

  if ((startTime && !endTime) || (!startTime && endTime)) {
    throw {
      status: 400,
      code: 'MISSING_FIELDS',
      message: 'startTime and endTime must both be provided',
    };
  }

  if (!allowMissingTime && (!startTime || !endTime)) {
    throw {
      status: 400,
      code: 'MISSING_FIELDS',
      message: 'doctorId, appointmentDate, startTime, and endTime are required',
    };
  }

  if (startTime && endTime && !isTimeRangeValid(startTime, endTime)) {
    throw {
      status: 400,
      code: 'INVALID_TIME_RANGE',
      message: 'Start time must be earlier than end time',
    };
  }
};

export const loadDoctor = async (doctorId) => {
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) {
    throw {
      status: 404,
      code: 'DOCTOR_NOT_FOUND',
      message: 'Doctor not found',
    };
  }
  return doctor;
};

export const checkDoctorAvailability = async (
  doctorId,
  appointmentDate,
  startTime,
  endTime,
  options = {}
) => {
  try {
    validateBookingInput({ doctorId, appointmentDate, startTime, endTime });

    const doctor = options.doctor || (await loadDoctor(doctorId));

    return await isDoctorAvailableForSlot({
      doctor,
      appointmentDate,
      startTime,
      endTime,
      patientId: options.patientId || null,
      excludeAppointmentId: options.excludeAppointmentId || null,
    });
  } catch (error) {
    return false;
  }
};

export const buildWaitlistEntry = async ({
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

export const validateAndPrepareAppointment = async ({
  doctorId,
  appointmentDate,
  startTime,
  endTime,
  patientId,
  reason,
  emergencyLevel,
  isFollowUp,
  noShowHistory,
}) => {
  validateBookingInput(
    { doctorId, appointmentDate, startTime, endTime },
    { allowMissingTime: true }
  );

  const doctor = await loadDoctor(doctorId);

  if (!startTime || !endTime) {
    const waitlistEntry = await buildWaitlistEntry({
      patientId,
      doctorId,
      appointmentDate,
      startTime: '',
      endTime: '',
      reason,
      emergencyLevel,
      isFollowUp,
      noShowHistory,
    });

    return { waitlist: waitlistEntry, doctor };
  }

  const slotAvailable = await checkDoctorAvailability(
    doctorId,
    appointmentDate,
    startTime,
    endTime,
    {
      doctor,
      patientId,
    }
  );

  if (!slotAvailable) {
    const waitlistEntry = await buildWaitlistEntry({
      patientId,
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      reason,
      emergencyLevel,
      isFollowUp,
      noShowHistory,
    });
    return { waitlist: waitlistEntry, doctor };
  }

  return { slotAvailable: true, doctor };
};
