import Coupon from '../models/Coupon.js';

export const normalizeCurrencyValue = (value) => {
  return Number(Number(value || 0).toFixed(2));
};

export const normalizeCouponCode = (value = '') => {
  return String(value).trim().toUpperCase();
};

const buildCouponError = (status, code, message) => ({
  status,
  error: {
    code,
    message,
  },
});

export const validateCouponForAmount = async ({ couponCode, amount }) => {
  const normalizedCode = normalizeCouponCode(couponCode);

  if (!normalizedCode) {
    return null;
  }

  const coupon = await Coupon.findOne({ code: normalizedCode });

  if (!coupon) {
    throw buildCouponError(404, 'COUPON_NOT_FOUND', 'Coupon not found');
  }

  if (!coupon.isActive) {
    throw buildCouponError(400, 'COUPON_INACTIVE', 'This coupon is inactive');
  }

  if (coupon.expiryDate < new Date()) {
    throw buildCouponError(400, 'COUPON_EXPIRED', 'This coupon has expired');
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw buildCouponError(400, 'COUPON_USAGE_EXCEEDED', 'This coupon has reached its usage limit');
  }

  const originalAmount = normalizeCurrencyValue(amount);

  if (originalAmount < normalizeCurrencyValue(coupon.minAmount)) {
    throw buildCouponError(
      400,
      'MINIMUM_AMOUNT_NOT_MET',
      `Coupon is valid only for amounts above Rs. ${normalizeCurrencyValue(coupon.minAmount)}`
    );
  }

  let discountApplied =
    coupon.discountType === 'percentage'
      ? (originalAmount * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.maxDiscount) {
    discountApplied = Math.min(discountApplied, coupon.maxDiscount);
  }

  discountApplied = Math.min(normalizeCurrencyValue(discountApplied), originalAmount);

  return {
    coupon,
    originalAmount,
    discountApplied,
    finalAmount: normalizeCurrencyValue(originalAmount - discountApplied),
  };
};
