import { createOrder, verifyPayment } from '../services/paymentService.js';
import { validateCouponForAmount } from '../utils/paymentUtils.js';

const ensurePatientRole = (user) => user?.role === 'patient';

export const applyCoupon = async (req, res, next) => {
  try {
    if (!ensurePatientRole(req.user)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only patients can apply coupons',
        },
      });
    }

    const { couponCode, amount } = req.body;

    if (!couponCode || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_COUPON_FIELDS',
          message: 'couponCode and amount are required',
        },
      });
    }

    const pricing = await validateCouponForAmount({ couponCode, amount });

    return res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon: {
          id: pricing.coupon._id,
          code: pricing.coupon.code,
          discountType: pricing.coupon.discountType,
          discountValue: pricing.coupon.discountValue,
          maxDiscount: pricing.coupon.maxDiscount,
        },
        originalAmount: pricing.originalAmount,
        discountApplied: pricing.discountApplied,
        finalAmount: pricing.finalAmount,
      },
    });
  } catch (error) {
    if (error?.status && error?.error) {
      return res.status(error.status).json({
        success: false,
        error: error.error,
      });
    }

    return next(error);
  }
};

export const createPaymentOrder = async (req, res, next) => {
  try {
    if (!ensurePatientRole(req.user)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only patients can create payment orders',
        },
      });
    }

    const {
      amount,
      currency = 'INR',
      receipt = `receipt_${Date.now()}`,
    } = req.body;

    const normalizedAmount = Math.round(Number(amount));

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'A valid payment amount is required',
        },
      });
    }

    const normalizedCurrency = String(currency || 'INR').toUpperCase();

    const order = await createOrder({
      amount: normalizedAmount,
      currency: normalizedCurrency,
      receipt,
    });

    return res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: order.id,
        order,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    if (error?.status && error?.error) {
      return res.status(error.status).json({
        success: false,
        error: error.error,
      });
    }

    return next(error);
  }
};

export const verifyAppointmentPayment = async (req, res, next) => {
  try {
    if (!ensurePatientRole(req.user)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only patients can verify payment',
        },
      });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature = '' } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PAYMENT_FIELDS',
          message: 'razorpayOrderId and razorpayPaymentId are required',
        },
      });
    }

    const isPaymentValid = verifyPayment({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isPaymentValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYMENT_SIGNATURE',
          message: 'Payment verification failed',
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        signature: razorpaySignature,
      },
    });
  } catch (error) {
    return next(error);
  }
};
