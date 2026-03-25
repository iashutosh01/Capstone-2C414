import express from 'express';
import {
  bookAppointment,
  cancelAppointment,
  getMyAppointments,
  getNotifications,
  rescheduleAppointment,
} from '../controllers/appointmentController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/notifications', protect, getNotifications);
router.get('/my', protect, authorize('patient'), getMyAppointments);
router.post('/book', protect, authorize('patient'), bookAppointment);
router.put('/reschedule/:id', protect, authorize('patient'), rescheduleAppointment);
router.delete('/cancel/:id', protect, authorize('patient'), cancelAppointment);

// Backward-compatible aliases for any existing frontend usage.
router.get('/', protect, authorize('patient'), getMyAppointments);
router.post('/', protect, authorize('patient'), bookAppointment);
router.patch('/:id/cancel', protect, authorize('patient'), cancelAppointment);
router.patch('/:id/reschedule', protect, authorize('patient'), rescheduleAppointment);

export default router;
