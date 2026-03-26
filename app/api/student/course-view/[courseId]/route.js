import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import Enrollment from '@/models/Enrollment';
import { getUserFromCookie } from '@/utils/auth';

// GET /api/student/course-view/[courseId] — Fetch course structure ONLY if student has paid/active enrollment
export async function GET(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = params;
    await connectDB();

    // 1. Check Enrollment Status
    const enrollment = await Enrollment.findOne({ 
      courseId, 
      userId: user.id, 
      status: 'active',
      paymentStatus: 'paid' 
    });

    if (!enrollment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access Denied: You must have an active and paid enrollment to view this course.' 
      }, { status: 403 });
    }

    // 2. Fetch Course Data
    const course = await Course.findById(courseId).lean();
    if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });

    // 3. Fetch Sections and Lessons
    const sections = await Section.find({ courseId }).sort({ order: 1 }).lean();
    for (const section of sections) {
        section.lessons = await Lesson.find({ sectionId: section._id }).sort({ order: 1 }).lean();
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        course,
        sections,
        enrollment
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
