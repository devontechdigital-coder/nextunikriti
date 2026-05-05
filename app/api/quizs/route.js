import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import Lesson from '@/models/Lesson';
import Section from '@/models/Section';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

const authorizeQuizAccess = async (lessonId) => {
  const user = getUserFromCookie();
  if (!user || user.role === 'student') return null;

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) return null;
  const section = await Section.findById(lesson.sectionId);
  if (!section) return null;
  const course = await Course.findById(section.courseId);
  const ownerId = (course?.course_creator || course?.instructor)?.toString();
  if (!course || (ownerId !== user.id && user.role !== 'admin')) return null;
  return lesson;
};

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');
    if (lessonId) {
      const lesson = await authorizeQuizAccess(lessonId);
      if (!lesson) return NextResponse.json({ success: false, error: 'Unauthorized or not found' }, { status: 403 });
    }
    const data = await Quiz.find(lessonId ? { lessonId } : {});
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    await connectDB();
    const lesson = await authorizeQuizAccess(body.lessonId);
    if (!lesson) return NextResponse.json({ success: false, error: 'Unauthorized or not found' }, { status: 403 });
    const data = await Quiz.create(body);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
