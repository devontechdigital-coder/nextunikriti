import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Section from '@/models/Section';
import { getUserFromCookie } from '@/utils/auth';

export async function PUT(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = params;
    const { elements } = await req.json();

    await connectDB();
    
    // Bulk update the orders
    for (let el of elements) {
      await Section.updateOne(
        { _id: el._id, courseId },
        { order: el.order }
      );
    }

    return NextResponse.json({ success: true, message: 'Sections reordered successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
