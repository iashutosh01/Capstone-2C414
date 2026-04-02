import crypto from 'crypto';
import Razorpay from 'razorpay';

const hasRazorpayConfig = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const razorpay = hasRazorpayConfig
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

export const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  if (!razorpay) {
    return {
      id: `mock_order_${Date.now()}`,
      amount,
      currency,
      receipt,
      notes,
      status: 'created',
      provider: 'mock',
    };
  }

  return razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes,
  });
};

export const verifyPayment = ({ orderId, paymentId, signature }) => {
  if (String(orderId).startsWith('mock_order_')) {
    return Boolean(paymentId);
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
};
