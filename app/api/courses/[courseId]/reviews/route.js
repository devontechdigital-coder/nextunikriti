import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Review from '@/models/Review';
import Course from '@/models/Course';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const reviews = await Review.find({ courseId: params.courseId }).populate('userId', 'name avatar');
    return NextResponse.json({ success: true, count: reviews.length, data: reviews }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const body = await req.json();
    body.courseId = params.courseId;
    
    // In a real app, user ID comes from the authenticated session
    body.userId = req.headers.get('x-user-id') || '664213d2a3f789abc1234567';

    await connectDB();
    
    // Check if user already reviewed
    const existingReview = await Review.findOne({ courseId: params.courseId, userId: body.userId });
    if (existingReview) {
      return NextResponse.json({ success: false, error: 'You have already reviewed this course' }, { status: 400 });
    }

    const review = await Review.create(body);
    
    // Optionally: Update course average rating here
    
    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
