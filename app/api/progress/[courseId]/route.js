import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import { getUserFromCookie } from '@/utils/auth';

// GET /api/progress/[courseId] - Fetch enrollment data including progress and lastLessonId
export async function GET(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    await connectDB();

    const enrollment = await Enrollment.findOne({ userId: user.id, courseId })
      .select('progress completed completedLessons lastLessonId')
      .lean();

    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: enrollment }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/progress/[courseId] - Update last-accessed lesson for the resume feature
export async function PATCH(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const { lastLessonId } = await req.json();

    if (!lastLessonId) {
      return NextResponse.json({ success: false, error: 'Lesson ID is required' }, { status: 400 });
    }

    await connectDB();

    const enrollment = await Enrollment.findOneAndUpdate(
      { userId: user.id, courseId },
      { lastLessonId },
      { new: true }
    );

    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: enrollment }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
