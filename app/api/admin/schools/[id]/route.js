import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import School from '@/models/School';
import { getUserFromCookie } from '@/utils/auth';
import { normalizeSchoolSchedule, validateSchoolSchedule } from '@/lib/schoolSchedule';

export async function PUT(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const body = await req.json();
    if (body.weeklySchedule !== undefined) {
      body.weeklySchedule = normalizeSchoolSchedule(body.weeklySchedule);
      const scheduleError = validateSchoolSchedule(body.weeklySchedule);
      if (scheduleError) {
        return NextResponse.json({ success: false, error: scheduleError }, { status: 400 });
      }
    }
    const school = await School.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json({ success: true, school });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    await School.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
