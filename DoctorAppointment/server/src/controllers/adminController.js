import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Waitlist from '../models/Waitlist.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [totalAppointments, completedAppointments, cancelledAppointments, waitlistCount] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Waitlist.countDocuments({ status: 'waiting' }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        waitlistCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getDoctorUtilization = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('_id firstName lastName specialization');
    const appointments = await Appointment.find({
      status: { $in: ['scheduled', 'rescheduled', 'auto-assigned', 'completed'] },
    }).select('doctor');

    const totalAssigned = appointments.length;
    const averageLoad = doctors.length ? totalAssigned / doctors.length : 0;

    const countsByDoctor = appointments.reduce((accumulator, appointment) => {
      const doctorId = appointment.doctor.toString();
      accumulator[doctorId] = (accumulator[doctorId] || 0) + 1;
      return accumulator;
    }, {});

    const utilization = doctors.map((doctor) => {
      const appointmentCount = countsByDoctor[doctor._id.toString()] || 0;
      const loadShare = totalAssigned ? Number(((appointmentCount / totalAssigned) * 100).toFixed(2)) : 0;

      return {
        doctorId: doctor._id,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        specialization: doctor.specialization,
        appointmentCount,
        loadShare,
        relativeLoad:
          appointmentCount > averageLoad ? 'high' : appointmentCount < averageLoad ? 'low' : 'balanced',
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalAssigned,
        averageLoad: Number(averageLoad.toFixed(2)),
        utilization,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAnalytics = getDashboardStats;

export const getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName specialization')
      .sort({ appointmentDate: -1, startTime: 1 });

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

export const getDoctorsOverview = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select(
      'firstName lastName specialization availabilityStatus isAvailable'
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
