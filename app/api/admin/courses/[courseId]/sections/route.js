import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Section from '@/models/Section';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { courseId } = params;

    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const sections = await Section.find({ courseId }).sort({ order: 1 });
    return NextResponse.json({ success: true, data: sections });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { courseId } = params;
    const { title } = await req.json();

    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get the last section's order
    const lastSection = await Section.findOne({ courseId }).sort({ order: -1 });
    const order = lastSection ? lastSection.order + 1 : 0;

    const newSection = new Section({
      courseId,
      title,
      order,
    });

    await newSection.save();

    return NextResponse.json({ success: true, data: newSection }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
