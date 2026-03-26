import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { assignSlotFromWaitlist, assignWaitlistSlot } from '../utils/aiScheduler.js';
import { createNotification } from '../utils/notificationService.js';

export const getDoctors = async (req, res, next) => {
  try {
    const { availabilityStatus, department } = req.query;
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

    return res.status(200).json({
      success: true,
      data: {
        doctors,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const { availabilityStatus, availableSlots, slotDate, startTime, endTime, availabilityNotes = '' } = req.body;

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
      doctor.availableSlots = availableSlots;
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

export const updateAvailabilityStatus = updateAvailability;

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
