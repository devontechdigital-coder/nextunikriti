import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const courses = await Course.find({ course_creator: user.id });
    const courseIds = courses.map(c => c._id);

    // Get all enrollments for instructor's courses
    const students = await Enrollment.find({ courseId: { $in: courseIds } })
      .populate('userId', 'name email avatar')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: students }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
