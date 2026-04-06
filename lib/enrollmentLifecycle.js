import { resolvePackagePriceOption, resolvePackagePriceOptionById } from '@/lib/packagePricing';

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
};

export const buildEnrollmentIdentityFilter = ({ userId, courseId }) => ({
  userId,
  courseId,
});

export const buildEnrollmentLifecycleFields = ({ paymentStatus, status, packageDoc = null, packagePriceKey = '', pricingOptionId = null }) => {
  const now = new Date();

  if (!packageDoc) {
    return {
      pricingOptionId: pricingOptionId || null,
      paymentStatus,
      status,
      startDate: now,
      endDate: null,
      billingCycleStart: now,
      billingCycleEnd: null,
      adminFeeChargedInCycle: false,
    };
  }

  const selectedOption = pricingOptionId
    ? resolvePackagePriceOptionById(packageDoc, pricingOptionId)
    : resolvePackagePriceOption(packageDoc, packagePriceKey);
  const durationDays = Number(selectedOption?.durationDays || 0);
  const cycleEnd = durationDays > 0 ? addDays(now, durationDays) : null;

  return {
    pricingOptionId: selectedOption?._id || pricingOptionId || null,
    paymentStatus,
    status,
    startDate: now,
    endDate: cycleEnd,
    billingCycleStart: now,
    billingCycleEnd: cycleEnd,
    adminFeeChargedInCycle: Number(selectedOption?.adminFee || 0) > 0,
  };
};

export const findPreferredEnrollmentForCourse = ({ userId, courseId }) =>
  ({
    userId,
    courseId,
    status: { $in: ['active', 'pending_payment'] },
  });
