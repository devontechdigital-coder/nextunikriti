import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import { getUserFromCookie } from '@/utils/auth';
import { findPreferredEnrollmentForCourse } from '@/lib/enrollmentLifecycle';

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, lessonId } = await req.json();
    if (!courseId || !lessonId) {
      return NextResponse.json({ success: false, error: 'Course ID and Lesson ID are required' }, { status: 400 });
    }

    await connectDB();

    const enrollment = await Enrollment.findOne(findPreferredEnrollmentForCourse({ userId: user.id, courseId }))
      .sort({ status: 1, updatedAt: -1 });
    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Enrollment not found' }, { status: 404 });
    }

    // Mark as completed if not already
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
      
      // Calculate progress
      const sections = await Section.find({ courseId });
      const sectionIds = sections.map(s => s._id);
      const totalLessons = await Lesson.countDocuments({ sectionId: { $in: sectionIds } });
      
      if (totalLessons > 0) {
        enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
      }
      
      if (enrollment.progress >= 100) {
        enrollment.completed = true;
      }
    }

    // Also update last lesson
    enrollment.lastLessonId = lessonId;

    await enrollment.save();

    return NextResponse.json({ success: true, data: enrollment }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
