import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Course from '@/models/Course';

export async function GET(req, { params }) {
  try {
    const { slug } = params;
    await connectDB();

    const category = await Category.findOne({ slug });
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    // Fetch courses in this category
    // Note: Course model uses categoryIds (array of ObjectIds)
    const courses = await Course.find({ 
      categoryIds: category._id,
      moderationStatus: 'approved' 
    })
    .populate('course_creator', 'name image')
    .populate('instrument_id', 'name')
    .populate('level_id', 'levelName')
    .sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      data: {
        category,
        courses
      }
    });

  } catch (error) {
    console.error('Category Public API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
