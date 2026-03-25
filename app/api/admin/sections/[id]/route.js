import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Section from '@/models/Section';
import { getUserFromCookie } from '@/utils/auth';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const { title, order } = await req.json();

    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const updatedSection = await Section.findByIdAndUpdate(
      id,
      { title, order },
      { new: true }
    );

    if (!updatedSection) {
      return NextResponse.json({ success: false, message: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedSection });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const deletedSection = await Section.findByIdAndDelete(id);

    if (!deletedSection) {
      return NextResponse.json({ success: false, message: 'Section not found' }, { status: 404 });
    }

    // Optionally: Delete associated lessons here if needed
    // await Lesson.deleteMany({ sectionId: id });

    return NextResponse.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
