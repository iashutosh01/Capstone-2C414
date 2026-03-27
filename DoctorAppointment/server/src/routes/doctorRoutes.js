import express from 'express';
import {
  getDoctorSchedule,
  getDoctors,
  updateDoctorAvailability,
} from '../controllers/doctorController.js';
import { authorize, optionalAuth, protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getDoctors);
router.put('/availability', protect, authorize('doctor'), updateDoctorAvailability);
router.get('/schedule', protect, authorize('doctor'), getDoctorSchedule);

export default router;
