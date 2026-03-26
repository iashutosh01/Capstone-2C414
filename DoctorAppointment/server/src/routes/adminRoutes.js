import express from 'express';
import {
  createCoupon,
  deactivateCoupon,
  getCoupons,
  getDashboardStats,
  getDoctorUtilization,
  updateCoupon,
} from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/utilization', getDoctorUtilization);
router.post('/coupons', createCoupon);
router.get('/coupons', getCoupons);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deactivateCoupon);

export default router;
