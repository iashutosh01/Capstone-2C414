import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import {
  assignSlotFromWaitlist,
  assignWaitlistSlot,
  getDayName,
  getDoctorAvailableTimeSlots,
} from '../utils/aiScheduler.js';
import { createNotification } from '../utils/notificationService.js';
import { normalizeDate } from '../utils/dateUtils.js';

const ACTIVE_APPOINTMENT_STATUSES = [
  'pending_payment',
  'confirmed',
  'scheduled',
  'rescheduled',
  'auto-assigned',
];

export const getDoctors = async (req, res, next) => {
  try {
    const { availabilityStatus, department, appointmentDate } = req.query;
    const query = { role: 'doctor' };

    if (availabilityStatus) {
      query.availabilityStatus = availabilityStatus;
    }

    if (department) {
      query.department = department;
    }

    const doctors = await User.find(query).select(
      'firstName lastName email phone specialization experience consultationFee department availableSlots availabilityStatus isAvailable profileImage rating ratingsCount'
    );

    let doctorsWithSlots = doctors.map((doctor) => ({
      ...doctor.toObject(),
      availableTimeSlots: [],
    }));

    if (appointmentDate && doctors.length > 0) {
      const dayStart = normalizeDate(appointmentDate);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const appointments = await Appointment.find({
        doctor: { $in: doctors.map((doctor) => doctor._id) },
        appointmentDate: { $gte: dayStart, $lte: dayEnd },
        status: { $in: ACTIVE_APPOINTMENT_STATUSES },
      }).select('doctor startTime endTime status');

      const appointmentsByDoctor = appointments.reduce((map, appointment) => {
        const doctorId = appointment.doctor.toString();
        const doctorAppointments = map.get(doctorId) || [];
        doctorAppointments.push(appointment);
        map.set(doctorId, doctorAppointments);
        return map;
      }, new Map());

      doctorsWithSlots = doctors.map((doctor) => ({
        ...doctor.toObject(),
        availableTimeSlots: getDoctorAvailableTimeSlots({
          doctor,
          appointmentDate,
          appointments: appointmentsByDoctor.get(doctor._id.toString()) || [],
        }),
      }));
    }

    return res.status(200).json({
      success: true,
      data: {
        doctors: doctorsWithSlots,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateDoctorAvailability = async (req, res, next) => {
  try {
    const {
      availabilityStatus,
      availableSlots,
      slotDate,
      startTime,
      endTime,
      slotDuration = 30,
      availabilityNotes = '',
    } = req.body;

    if (!availabilityStatus) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'STATUS_REQUIRED',
          message: 'availabilityStatus is required',
        },
      });
    }

    const doctor = await User.findOne({ _id: req.user._id, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCTOR_NOT_FOUND',
          message: 'Doctor not found',
        },
      });
    }

    doctor.availabilityStatus = availabilityStatus;
    doctor.isAvailable = availabilityStatus === 'available';
    doctor.availabilityNotes = availabilityNotes;

    if (Array.isArray(availableSlots)) {
      doctor.availableSlots = availableSlots.map((slot) => ({
        ...slot,
        slotDuration: Number(slot.slotDuration) || 30,
      }));
    } else if (slotDate && startTime && endTime) {
      const nextSlot = {
        day: getDayName(slotDate),
        startTime,
        endTime,
        slotDuration: Number(slotDuration) || 30,
        isActive: true,
      };

      const existingSlotIndex = doctor.availableSlots.findIndex(
        (slot) => slot.day === nextSlot.day
      );

      if (existingSlotIndex >= 0) {
        doctor.availableSlots[existingSlotIndex] = nextSlot;
      } else {
        doctor.availableSlots.push(nextSlot);
      }
    }

    await doctor.save();

    await createNotification({
      recipient: doctor._id,
      type: 'availability-updated',
      title: 'Availability updated',
      message: `Your status is now ${availabilityStatus}.`,
      metadata: { slotDate, startTime, endTime },
    });

    let autoAssignedAppointment = null;
    if (availabilityStatus === 'available' && slotDate) {
      autoAssignedAppointment =
        (await assignSlotFromWaitlist(doctor._id, slotDate, { startTime, endTime })) ||
        (startTime && endTime
          ? await assignWaitlistSlot({
              doctorId: doctor._id,
              appointmentDate: slotDate,
              startTime,
              endTime,
              trigger: 'doctor-available',
            })
          : null);
    }

    return res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        doctor,
        autoAssignedAppointment,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getDoctorSchedule = async (req, res, next) => {
  try {
    const schedule = await Appointment.find({
      doctor: req.user._id,
      status: { $in: ['pending_payment', 'confirmed', 'scheduled', 'rescheduled', 'auto-assigned'] },
    })
      .populate('patient', 'firstName lastName email phone profileImage')
      .sort({ appointmentDate: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      data: {
        schedule,
      },
    });
  } catch (error) {
    return next(error);
  }
};
