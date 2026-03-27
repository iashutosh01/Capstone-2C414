import Message from '../models/Message.js';
import Appointment from '../models/Appointment.js';
import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types;

export const getMessages = async (req, res, next) => {
  const { appointmentId } = req.params;
  const userId = req.user._id; // Assuming userId is available from auth middleware

  if (!ObjectId.isValid(appointmentId) || !ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Invalid ID format' },
    });
  }

  try {
    // 1. Verify the appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Appointment not found' },
      });
    }

    // 2. Security Check: Ensure the user is part of the appointment
    const isUserInAppointment =
      appointment.patient.toString() === userId ||
      appointment.doctor.toString() === userId;

    if (!isUserInAppointment) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to view these messages.',
        },
      });
    }

    // 3. Fetch messages
    const messages = await Message.find({ appointmentId })
      .populate('senderId', 'name role') // Populate sender's name and role
      .sort({ createdAt: 1 }); // Sort by creation date, ascending

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
