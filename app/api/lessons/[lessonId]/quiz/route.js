import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const quizzes = await Quiz.find({ lessonId: params.lessonId });
    return NextResponse.json({ success: true, count: quizzes.length, data: quizzes }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const body = await req.json();
    body.lessonId = params.lessonId;
    await connectDB();
    const quiz = await Quiz.create(body);
    return NextResponse.json({ success: true, data: quiz }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
