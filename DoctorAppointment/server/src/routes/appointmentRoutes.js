import express from 'express';
import {
  bookAppointment,
  cancelAppointment,
  getMyAppointments,
  getNotifications,
  markNotificationAsRead,
  rescheduleAppointment,
} from '../controllers/appointmentController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/notifications', protect, getNotifications);
router.patch('/notifications/:id/read', protect, markNotificationAsRead);

// Appointments
router.get('/my', protect, authorize('patient'), getMyAppointments);
router.post('/book', protect, authorize('patient'), bookAppointment);
router.delete('/cancel/:id', protect, authorize('patient'), cancelAppointment);
router.put('/reschedule/:id', protect, authorize('patient'), rescheduleAppointment);
router.get('/', protect, authorize('patient'), getMyAppointments);
router.post('/', protect, authorize('patient'), bookAppointment);
router.patch('/:id/cancel', protect, authorize('patient'), cancelAppointment);
router.patch('/:id/reschedule', protect, authorize('patient'), rescheduleAppointment);

export default router;
