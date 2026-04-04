import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Mode from '@/models/Mode';
import Course from '@/models/Course';
import Package from '@/models/Package';
import { getUserFromCookie } from '@/utils/auth';

export async function PUT(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || !['admin', 'staff'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    const body = await req.json();
    const mode = await Mode.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!mode) {
      return NextResponse.json({ success: false, error: 'Mode not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, mode });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || !['admin', 'staff'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;

    const mode = await Mode.findById(id);
    if (!mode) {
      return NextResponse.json({ success: false, error: 'Mode not found' }, { status: 404 });
    }

    const courseCount = await Course.countDocuments({ mode: mode.name });
    if (courseCount > 0) {
      return NextResponse.json({ success: false, error: 'Cannot delete mode while courses are using it.' }, { status: 400 });
    }

    const packageCount = await Package.countDocuments({ mode: mode.name });
    if (packageCount > 0) {
      return NextResponse.json({ success: false, error: 'Cannot delete mode while packages are using it.' }, { status: 400 });
    }

    await Mode.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Mode deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
