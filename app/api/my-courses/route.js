import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Payment from '@/models/Payment';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import Attendance from '@/models/Attendance';
import BatchStudent from '@/models/BatchStudent';
import ClassSession from '@/models/ClassSession';
import Student from '@/models/Student';
import '@/models/Course';
import '@/models/Package';
import '@/models/User';
import '@/models/Batch';
import '@/models/School';
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

    const student = await Student.findOne({ userId: user.id }).select('_id').lean();
    
    const payments = await Payment.find({
      userId: user.id
    })
      .populate('courseId', 'title thumbnail')
      .populate('packageId', 'name pricingOptions gradeName')
      .populate('batchId', 'batchName programType instrument level totalDays startDate endDate timetable')
      .sort({ createdAt: -1 });

    const data = await Promise.all(payments.map(async (payment) => {
        const enrollment = await Enrollment.findOne({ paymentId: payment._id })
          .populate('packageId', 'name pricingOptions gradeName')
          .populate('batchId', 'batchName programType instrument level totalDays startDate endDate timetable')
          .sort({ updatedAt: -1 })
          .lean()
          || await Enrollment.findOne(findPreferredEnrollmentForCourse({ userId: user.id, courseId: payment.courseId?._id || payment.courseId }))
            .populate('packageId', 'name pricingOptions gradeName')
            .populate('batchId', 'batchName programType instrument level totalDays startDate endDate timetable')
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

        const pricingOptionLabel = pricingOption?.label || null;
        const batchDoc = enrollment?.batchId || payment.batchId || null;
        const batchId = batchDoc?._id || batchDoc || null;
        let batchStudentStatus = null;
        let completedClasses = 0;
        let scheduledClasses = 0;
        let totalClasses = batchDoc?.totalDays || 0;
        let classesLeft = null;
        let attendanceSummary = {
            present: 0,
            absent: 0,
            late: 0,
            totalMarked: 0,
            percentage: null
        };

        if (batchId) {
            if (student?._id) {
                const batchStudent = await BatchStudent.findOne({ batchId, studentId: student._id }).select('status').lean();
                batchStudentStatus = batchStudent?.status || null;
            }

            const [completedSessions, scheduledSessions] = await Promise.all([
                ClassSession.find({ batchId, status: 'completed' }).select('_id').lean(),
                ClassSession.countDocuments({ batchId, status: 'scheduled', classDate: { $gte: new Date() } })
            ]);

            completedClasses = completedSessions.length;
            scheduledClasses = scheduledSessions;
            if (!totalClasses) totalClasses = completedClasses + scheduledClasses;
            classesLeft = batchDoc?.totalDays
                ? Math.max(Number(batchDoc.totalDays || 0) - completedClasses, 0)
                : scheduledClasses;

            if (student?._id && completedSessions.length > 0) {
                const attendance = await Attendance.find({
                    studentId: student._id,
                    classSessionId: { $in: completedSessions.map(session => session._id) }
                }).select('status').lean();

                const summary = attendance.reduce((acc, record) => {
                    acc[record.status] = (acc[record.status] || 0) + 1;
                    acc.totalMarked += 1;
                    return acc;
                }, { present: 0, absent: 0, late: 0, totalMarked: 0 });

                const attended = summary.present + summary.late;
                attendanceSummary = {
                    ...summary,
                    percentage: summary.totalMarked ? Math.round((attended / summary.totalMarked) * 100) : null
                };
            }
        }

        return {
            payment_id: payment._id,
            enrollment_id: enrollment?._id || payment._id,
            course_id: payment.courseId?._id,
            batch_id: batchId,
            batch_name: batchDoc?.batchName || null,
            batch_program_type: batchDoc?.programType || null,
            batch_instrument: batchDoc?.instrument || null,
            batch_level: batchDoc?.level || null,
            batch_total_days: batchDoc?.totalDays || 0,
            batch_startDate: batchDoc?.startDate || null,
            batch_endDate: batchDoc?.endDate || null,
            batch_timetable: batchDoc?.timetable || [],
            batch_student_status: batchStudentStatus,
            completed_classes: completedClasses,
            scheduled_classes: scheduledClasses,
            total_classes: totalClasses,
            classes_left: classesLeft,
            attendance: attendanceSummary,
            course_title: payment.courseId?.title || 'Unknown Course',
            thumbnail: payment.courseId?.thumbnail,
            package_name: packageDoc?.name || 'Standard',
            grade_name: normalizeGradeName(enrollment?.gradeName || payment.gradeName || packageDoc?.gradeName),
            pricing_option_label: pricingOptionLabel,
            pricing_option_payment_type: pricingOption?.paymentType || null,
            pricing_option_price: pricingOption?.price ?? null,
            amount: payment.amount,
            gateway: payment.gateway,
            transaction_id: payment.transactionId,
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
            createdAt: payment.createdAt,
            purchaseDate: payment.createdAt
        };
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error /api/my-courses:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
