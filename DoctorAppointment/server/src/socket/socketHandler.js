import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Appointment from '../models/Appointment.js';

const { ObjectId } = mongoose.Types;

export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Join a room based on appointmentId
    socket.on('joinRoom', async ({ appointmentId, userId }) => {
      if (!ObjectId.isValid(appointmentId) || !ObjectId.isValid(userId)) {
        socket.emit('error', 'Invalid ID format for appointment or user.');
        return;
      }

      try {
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
          socket.emit('error', 'Appointment not found.');
          return;
        }

        // Security check: Only allow users part of the appointment to join
        const isUserInAppointment =
          appointment.patient.toString() === userId ||
          appointment.doctor.toString() === userId;

        if (!isUserInAppointment) {
          socket.emit('error', 'You are not authorized to join this chat.');
          return;
        }

        socket.join(appointmentId);
        console.log(`User ${userId} joined room: ${appointmentId}`);
        socket.emit('roomJoined', `You have joined the chat for appointment ${appointmentId}.`);
      } catch (error) {
        console.error(`Error joining room ${appointmentId}:`, error);
        socket.emit('error', 'Server error while joining room.');
      }
    });

    // Handle sending messages
    socket.on('sendMessage', async (data) => {
      const { appointmentId, senderId, receiverId, message } = data;

      if (
        !ObjectId.isValid(appointmentId) ||
        !ObjectId.isValid(senderId) ||
        !ObjectId.isValid(receiverId)
      ) {
        socket.emit('error', 'Invalid ID format.');
        return;
      }

      try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
          socket.emit('error', 'Appointment not found.');
          return;
        }
        
        const isSenderInAppointment =
        appointment.patient.toString() === senderId ||
        appointment.doctor.toString() === senderId;
        
      if (!isSenderInAppointment) {
        socket.emit('error', 'You are not authorized to send messages in this chat.');
        return;
      }


        const newMessage = new Message({
          appointmentId,
          senderId,
          receiverId,
          message,
        });

        await newMessage.save();

        // Populate sender details for the frontend
        const populatedMessage = await Message.findById(newMessage._id).populate(
          'senderId',
          'name role'
        );
        
        // Emit the message to the specific room
        io.to(appointmentId).emit('receiveMessage', populatedMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', 'Failed to send message.');
      }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};