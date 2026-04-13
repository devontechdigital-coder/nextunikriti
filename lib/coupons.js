import Coupon from '@/models/Coupon';

export function normalizeCouponCode(value) {
  return String(value || '').trim().toUpperCase();
}

function getCouponDiscountType(coupon = {}) {
  return coupon.discountType === 'fixed' ? 'fixed' : 'percentage';
}

function getCouponDiscountValue(coupon = {}) {
  if (coupon.discountValue !== undefined && coupon.discountValue !== null && coupon.discountValue !== '') {
    return Number(coupon.discountValue) || 0;
  }

  if (coupon.discountPercentage !== undefined && coupon.discountPercentage !== null && coupon.discountPercentage !== '') {
    return Number(coupon.discountPercentage) || 0;
  }

  return 0;
}

export function calculateCouponDiscount({ coupon, amount }) {
  const numericAmount = Math.max(0, Number(amount || 0));
  const discountType = getCouponDiscountType(coupon);
  const discountValue = Math.max(0, getCouponDiscountValue(coupon));

  let discountAmount = 0;
  if (discountType === 'fixed') {
    discountAmount = discountValue;
  } else {
    discountAmount = (numericAmount * discountValue) / 100;
  }

  const maxDiscountAmount = coupon?.maxDiscountAmount;
  if (maxDiscountAmount !== undefined && maxDiscountAmount !== null && maxDiscountAmount !== '') {
    discountAmount = Math.min(discountAmount, Math.max(0, Number(maxDiscountAmount) || 0));
  }

  discountAmount = Math.min(numericAmount, Math.max(0, Math.round(discountAmount)));
  return {
    discountAmount,
    finalAmount: Math.max(0, numericAmount - discountAmount),
  };
}

export function validateCouponForCheckout({
  coupon,
  courseId,
  packageId,
  amount,
  now = new Date(),
}) {
  if (!coupon) {
    return { valid: false, message: 'Coupon not found.' };
  }

  if (!coupon.isActive) {
    return { valid: false, message: 'This coupon is inactive.' };
  }

  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return { valid: false, message: 'This coupon is not active yet.' };
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
    return { valid: false, message: 'This coupon has expired.' };
  }

  if (Number(coupon.maxUsage || 0) > 0 && Number(coupon.usageCount || 0) >= Number(coupon.maxUsage || 0)) {
    return { valid: false, message: 'This coupon has reached its usage limit.' };
  }

  if (coupon.courseId && String(coupon.courseId) !== String(courseId)) {
    return { valid: false, message: 'This coupon is not valid for the selected course.' };
  }

  if (coupon.packageId && String(coupon.packageId) !== String(packageId)) {
    return { valid: false, message: 'This coupon is not valid for the selected package.' };
  }

  const minOrderAmount = Math.max(0, Number(coupon.minOrderAmount || 0));
  if (minOrderAmount > 0 && Number(amount || 0) < minOrderAmount) {
    return { valid: false, message: `Coupon works on orders of Rs.${minOrderAmount.toLocaleString()} or more.` };
  }

  const { discountAmount, finalAmount } = calculateCouponDiscount({ coupon, amount });
  if (discountAmount <= 0) {
    return { valid: false, message: 'This coupon does not apply to the selected package.' };
  }

  return {
    valid: true,
    message: 'Coupon applied successfully.',
    discountAmount,
    finalAmount,
  };
}

export async function findCouponByCode(code) {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return null;

  return Coupon.findOne({ code: normalizedCode });
}

export function serializeCouponForClient(coupon, amount) {
  if (!coupon) return null;

  const discountType = getCouponDiscountType(coupon);
  const discountValue = getCouponDiscountValue(coupon);
  const { discountAmount, finalAmount } = calculateCouponDiscount({ coupon, amount });

  return {
    _id: coupon._id,
    code: coupon.code,
    title: coupon.title || '',
    description: coupon.description || '',
    discountType,
    discountValue,
    discountAmount,
    finalAmount,
    maxUsage: coupon.maxUsage || 0,
    usageCount: coupon.usageCount || 0,
    expiryDate: coupon.expiryDate || null,
  };
}

export function normalizeCouponPayload(body = {}) {
  const discountType = body.discountType === 'fixed' ? 'fixed' : 'percentage';
  const discountValue = Math.max(0, Number(body.discountValue ?? body.discountPercentage ?? 0) || 0);

  return {
    code: normalizeCouponCode(body.code),
    title: String(body.title || '').trim(),
    description: String(body.description || '').trim(),
    discountType,
    discountValue,
    discountPercentage: discountType === 'percentage' ? Math.min(100, discountValue) : 0,
    minOrderAmount: Math.max(0, Number(body.minOrderAmount || 0) || 0),
    maxDiscountAmount: body.maxDiscountAmount === '' || body.maxDiscountAmount === undefined || body.maxDiscountAmount === null
      ? null
      : Math.max(0, Number(body.maxDiscountAmount || 0) || 0),
    startDate: body.startDate || null,
    expiryDate: body.expiryDate || null,
    courseId: body.courseId || null,
    packageId: body.packageId || null,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    maxUsage: Math.max(0, Number(body.maxUsage || 0) || 0),
  };
}
