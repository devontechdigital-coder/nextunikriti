import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Assignment from '@/models/Assignment';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const assignments = await Assignment.find({ lessonId: params.lessonId });
    return NextResponse.json({ success: true, count: assignments.length, data: assignments }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const body = await req.json();
    body.lessonId = params.lessonId;
    await connectDB();
    const assignment = await Assignment.create(body);
    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
