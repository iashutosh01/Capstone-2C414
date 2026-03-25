import express from 'express';
import {
  getDashboardStats,
  getDoctorUtilization,
} from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/utilization', getDoctorUtilization);

export default router;
