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
    if (!course || (course.instructor.toString() !== user.id && user.role !== 'admin')) {
        return null;
    }
    return lesson;
};

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const lessonDoc = await authorizeLessonAction(params.lessonId);
    if (!lessonDoc) return NextResponse.json({ success: false, error: 'Unauthorized or not found' }, { status: 403 });

    const body = await req.json();
    const lesson = await Lesson.findByIdAndUpdate(params.lessonId, body, { new: true, runValidators: true });
    
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
