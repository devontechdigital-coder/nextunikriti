import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course'; // Required for population
import Package from '@/models/Package'; // Required for population
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import { getUserFromCookie } from '@/utils/auth';

// GET /api/my-courses — Returns all enrollments for the logged-in student
export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Fetch all enrollments for this user
    const enrollments = await Enrollment.find({ 
      userId: user.id
    })
      .populate('courseId', 'title thumbnail')
      .populate('packageId', 'name price')
      .sort({ updatedAt: -1 });

    // For each enrollment, we might want the total lesson count
    // To keep it efficient, we can fetch all relevant sections in one go or just skip for now if not critical
    // Let's add the count properly

    const data = await Promise.all(enrollments.map(async (e) => {
        let lessonsCount = 0;
        if (e.courseId?._id) {
            const sections = await Section.find({ courseId: e.courseId._id }).select('_id');
            const sectionIds = sections.map(s => s._id);
            lessonsCount = await Lesson.countDocuments({ 
                sectionId: { $in: sectionIds } 
            });
        }

        return {
            enrollment_id: e._id,
            course_id: e.courseId?._id,
            course_title: e.courseId?.title || 'Unknown Course',
            thumbnail: e.courseId?.thumbnail,
            package_name: e.packageId?.name || 'Standard',
            payment_status: e.paymentStatus,
            status: e.status,
            progress: e.progress,
            lessons_count: lessonsCount,
            updatedAt: e.updatedAt,
            createdAt: e.createdAt
        };
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error /api/my-courses:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
