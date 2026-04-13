import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import School from '@/models/School';
import { normalizeSchoolSchedule } from '@/lib/schoolSchedule';

export async function GET() {
  try {
    await dbConnect();

    const schools = await School.find({ status: 'active' })
      .select('schoolName schoolCode city state weeklySchedule')
      .sort({ schoolName: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      schools: schools.map((school) => ({
        ...school,
        weeklySchedule: normalizeSchoolSchedule(school.weeklySchedule),
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
