import crypto from 'crypto';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  return razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes,
  });
};

export const verifyPayment = ({ orderId, paymentId, signature }) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
};
