import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import '@/models/User';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import Enrollment from '@/models/Enrollment';
import { getUserFromCookie } from '@/utils/auth';

/**
 * GET /api/student/learn/[courseId]
 * Returns course curriculum (sections + lessons) plus enrollment data for the student.
 * Video URLs are intentionally excluded — they are fetched separately via /api/videos/play.
 */
export async function GET(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { courseId } = await params;

    // Fetch course with instructor name
    const course = await Course.findById(courseId)
      .populate('instructor', 'name avatar')
      .lean();

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Check enrollment (students must be enrolled; admins / instructors may preview)
    let enrollment = null;
    if (user.role === 'student') {
      enrollment = await Enrollment.findOne({ userId: user.id, courseId }).lean();
      if (!enrollment) {
        return NextResponse.json(
          { success: false, error: 'You are not enrolled in this course' },
          { status: 403 }
        );
      }
    }

    // Build ordered curriculum — derive hasVideo flag, then strip videoUrl for security
    const sections = await Section.find({ courseId }).sort({ order: 1 }).lean();
    for (const section of sections) {
      const rawLessons = await Lesson.find({ sectionId: section._id })
        .sort({ order: 1 })
        .select('title content duration resources order videoUrl') // fetch videoUrl internally only
        .lean();

      section.lessons = rawLessons.map(({ videoUrl, ...rest }) => ({
        ...rest,
        hasVideo: !!(videoUrl && videoUrl.trim()),
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          course_creator: course.instructor,
          level: course.level,
          language: course.language,
        },
        sections,
        enrollment: enrollment
          ? {
              _id: enrollment._id,
              completedLessons: enrollment.completedLessons,
              lastLessonId: enrollment.lastLessonId,
              progress: enrollment.progress,
              completed: enrollment.completed,
              status: enrollment.status,
              paymentStatus: enrollment.paymentStatus,
            }
          : null,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('[GET /api/student/learn/:courseId]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
