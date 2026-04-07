import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Payment from '@/models/Payment';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import { getUserFromCookie } from '@/utils/auth';
import { resolvePackagePriceOptionById } from '@/lib/packagePricing';
import { findPreferredEnrollmentForCourse } from '@/lib/enrollmentLifecycle';
import { normalizeGradeName } from '@/lib/gradeUtils';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const diffDaysCeil = (from, to) => {
  if (!from || !to) return null;
  return Math.max(0, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / MS_PER_DAY));
};

const diffDaysFloor = (from, to) => {
  if (!from || !to) return null;
  return Math.max(0, Math.floor((new Date(to).getTime() - new Date(from).getTime()) / MS_PER_DAY));
};

const toStudentPaymentStatus = (status) => {
  if (status === 'completed') return 'paid';
  if (status === 'pending') return 'pending';
  if (status === 'refunded') return 'refunded';
  return 'failed';
};

// GET /api/my-courses — Returns all course purchase records for the logged-in student
export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const payments = await Payment.find({
      userId: user.id
    })
      .populate('courseId', 'title thumbnail')
      .populate('packageId', 'name pricingOptions gradeName')
      .sort({ createdAt: -1 });

    const data = await Promise.all(payments.map(async (payment) => {
        const enrollment = await Enrollment.findOne({ paymentId: payment._id })
          .populate('packageId', 'name pricingOptions gradeName')
          .sort({ updatedAt: -1 })
          .lean()
          || await Enrollment.findOne(findPreferredEnrollmentForCourse({ userId: user.id, courseId: payment.courseId?._id || payment.courseId }))
            .populate('packageId', 'name pricingOptions gradeName')
            .sort({ updatedAt: -1 })
            .lean();

        let lessonsCount = 0;
        if (payment.courseId?._id) {
            const sections = await Section.find({ courseId: payment.courseId._id }).select('_id');
            const sectionIds = sections.map(s => s._id);
            lessonsCount = await Lesson.countDocuments({ 
                sectionId: { $in: sectionIds } 
            });
        }

        const packageDoc = payment.packageId || enrollment?.packageId || null;
        const pricingOptionId = payment.pricingOptionId || enrollment?.pricingOptionId || null;
        const pricingOption = packageDoc ? resolvePackagePriceOptionById(packageDoc, pricingOptionId) : null;
        const totalDurationDays = pricingOption?.durationDays ?? diffDaysCeil(enrollment?.startDate, enrollment?.endDate);
        const daysLeft = enrollment?.endDate ? diffDaysCeil(new Date(), enrollment.endDate) : null;
        const daysUsed = enrollment?.startDate ? diffDaysFloor(enrollment.startDate, new Date()) : 0;
        const requestedDaysAgo = diffDaysFloor(payment.createdAt, new Date());

        return {
            payment_id: payment._id,
            enrollment_id: enrollment?._id || payment._id,
            course_id: payment.courseId?._id,
            course_title: payment.courseId?.title || 'Unknown Course',
            thumbnail: payment.courseId?.thumbnail,
            package_name: packageDoc?.name || 'Standard',
            grade_name: normalizeGradeName(enrollment?.gradeName || payment.gradeName || packageDoc?.gradeName),
            pricing_option_label: packageDoc ? resolvePackagePriceOptionById(packageDoc, pricingOptionId).label : null,
            pricing_option_price: pricingOption?.price ?? null,
            payment_status: toStudentPaymentStatus(payment.status),
            order_status: payment.status,
            status: enrollment?.status || (payment.status === 'completed' ? 'active' : 'pending_payment'),
            startDate: enrollment?.startDate || null,
            endDate: enrollment?.endDate || null,
            billingCycleStart: enrollment?.billingCycleStart || null,
            billingCycleEnd: enrollment?.billingCycleEnd || null,
            renewalCount: enrollment?.renewalCount || 0,
            total_duration_days: totalDurationDays,
            days_left: daysLeft,
            days_used: daysUsed,
            requested_days_ago: requestedDaysAgo,
            progress: enrollment?.progress || 0,
            lessons_count: lessonsCount,
            updatedAt: payment.updatedAt,
            createdAt: payment.createdAt
        };
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error /api/my-courses:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
