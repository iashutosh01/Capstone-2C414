import express from 'express';
import {
  applyCoupon,
  createPaymentOrder,
  verifyAppointmentPayment,
} from '../controllers/paymentController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/apply-coupon', protect, authorize('patient'), applyCoupon);
router.post('/create-order', protect, authorize('patient'), createPaymentOrder);
router.post('/verify', protect, authorize('patient'), verifyAppointmentPayment);

export default router;
