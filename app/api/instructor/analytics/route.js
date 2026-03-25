import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Payment from '@/models/Payment';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // 1. Get instructor's courses
    const courses = await Course.find({ course_creator: user.id });
    const courseIds = courses.map(c => c._id);

    // 2. Count total students (unique users enrolled in instructor's courses)
    const uniqueStudents = await Enrollment.distinct('userId', { courseId: { $in: courseIds } });
    const totalStudents = uniqueStudents.length;

    // 3. Total revenue from instructor's courses
    const payments = await Payment.find({ courseId: { $in: courseIds }, status: 'completed' });
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

    // 4. Enrollments trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEnrollments = await Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds }, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // 5. Course performance breakdown
    const courseStats = await Promise.all(courses.map(async (course) => {
       const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });
       const revenue = payments.filter(p => p.courseId.toString() === course._id.toString())
                              .reduce((acc, curr) => acc + curr.amount, 0);
       return {
          title: course.title,
          enrollments: enrollmentCount,
          revenue: revenue,
          published: course.isPublished
       };
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        totalRevenue,
        totalCourses: courses.length,
        trends: recentEnrollments,
        courseStats
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
