import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lesson from '@/models/Lesson';
import Section from '@/models/Section';
import Course from '@/models/Course';
import '@/models/User';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query = {
      lessonPlan: { $exists: true, $ne: '' },
    };

    if (status && status !== 'all') {
      query.lessonPlanStatus = status;
    }

    const lessons = await Lesson.find(query)
      .populate('sectionId', 'title courseId')
      .populate('lessonPlanSubmittedBy', 'name email')
      .populate('lessonPlanReviewedBy', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    const courseIds = [
      ...new Set(
        lessons
          .map((lesson) => lesson.sectionId?.courseId?.toString())
          .filter(Boolean)
      ),
    ];

    const courses = await Course.find({ _id: { $in: courseIds } })
      .select('title course_creator instructor')
      .populate('course_creator', 'name email')
      .populate('instructor', 'name email')
      .lean();

    const courseMap = new Map(courses.map((course) => [course._id.toString(), course]));

    const data = lessons.map((lesson) => {
      const course = courseMap.get(lesson.sectionId?.courseId?.toString());
      return {
        ...lesson,
        course,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
