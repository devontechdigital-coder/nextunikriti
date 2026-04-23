import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lesson from '@/models/Lesson';
import Section from '@/models/Section';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

const authorizeLessonAction = async (lessonId) => {
    const user = getUserFromCookie();
    if (!user || user.role === 'student') return null;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return null;

    const section = await Section.findById(lesson.sectionId);
    if (!section) return null;

    const course = await Course.findById(section.courseId);
    const ownerId = (course?.course_creator || course?.instructor)?.toString();
    if (!course || (ownerId !== user.id && user.role !== 'admin')) {
        return null;
    }
    return lesson;
};

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const lessonDoc = await authorizeLessonAction(params.lessonId);
    if (!lessonDoc) return NextResponse.json({ success: false, error: 'Unauthorized or not found' }, { status: 403 });

    const user = getUserFromCookie();
    const body = await req.json();
    const update = { ...body };

    if (Object.prototype.hasOwnProperty.call(body, 'lessonPlan') && user?.role !== 'admin') {
      update.lessonPlanStatus = body.lessonPlan ? 'pending' : 'draft';
      update.lessonPlanSubmittedBy = user.id;
      update.lessonPlanReviewedBy = undefined;
      update.lessonPlanReviewedAt = undefined;
      update.lessonPlanReviewNote = '';
    }

    if (Object.prototype.hasOwnProperty.call(body, 'lessonPlanStatus')) {
      if (user?.role !== 'admin') {
        delete update.lessonPlanStatus;
      } else {
        update.lessonPlanReviewedBy = user.id;
        update.lessonPlanReviewedAt = new Date();
      }
    }

    const lesson = await Lesson.findByIdAndUpdate(params.lessonId, update, { new: true, runValidators: true });
    
    return NextResponse.json({ success: true, data: lesson }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const lessonDoc = await authorizeLessonAction(params.lessonId);
    if (!lessonDoc) return NextResponse.json({ success: false, error: 'Unauthorized or not found' }, { status: 403 });

    await lessonDoc.deleteOne();
    
    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
