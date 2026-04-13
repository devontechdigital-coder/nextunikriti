import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import School from '@/models/School';
import { getUserFromCookie } from '@/utils/auth';
import { createDefaultSchoolSchedule, normalizeSchoolSchedule, validateSchoolSchedule } from '@/lib/schoolSchedule';

export async function GET() {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'school_admin' || !user.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const school = await School.findById(user.schoolId).lean();
    if (!school) {
      return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      school: {
        ...school,
        weeklySchedule: normalizeSchoolSchedule(school.weeklySchedule || createDefaultSchoolSchedule()),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'school_admin' || !user.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const payload = {
      schoolName: body.schoolName || '',
      board: body.board || '',
      contactPerson: body.contactPerson || '',
      contactPhone: body.contactPhone || '',
      contactEmail: body.contactEmail || '',
      address: body.address || '',
      city: body.city || '',
      state: body.state || '',
      pinCode: body.pinCode || '',
      weeklySchedule: normalizeSchoolSchedule(body.weeklySchedule),
    };

    const scheduleError = validateSchoolSchedule(payload.weeklySchedule);
    if (scheduleError) {
      return NextResponse.json({ success: false, error: scheduleError }, { status: 400 });
    }

    const school = await School.findByIdAndUpdate(user.schoolId, payload, { new: true });
    if (!school) {
      return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, school });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
