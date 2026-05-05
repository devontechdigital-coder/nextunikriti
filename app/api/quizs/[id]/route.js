import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import Lesson from '@/models/Lesson';
import Section from '@/models/Section';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

const authorizeQuiz = async (quizId) => {
  const user = getUserFromCookie();
  if (!user || user.role === 'student') return null;
  const quiz = await Quiz.findById(quizId);
  if (!quiz) return null;
  const lesson = await Lesson.findById(quiz.lessonId);
  if (!lesson) return null;
  const section = await Section.findById(lesson.sectionId);
  if (!section) return null;
  const course = await Course.findById(section.courseId);
  const ownerId = (course?.course_creator || course?.instructor)?.toString();
  if (!course || (ownerId !== user.id && user.role !== 'admin')) return null;
  return quiz;
};

export async function GET(req, { params }) {
  try {
    await connectDB();
    const data = await authorizeQuiz(params.id);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    await connectDB();
    const existing = await authorizeQuiz(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const data = await Quiz.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!data) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const existing = await authorizeQuiz(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const data = await Quiz.findByIdAndDelete(params.id);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
