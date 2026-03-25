import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Timetable from '@/models/Timetable';
import { getUserFromCookie } from '@/utils/auth';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Parse query params if any
    const { searchParams } = new URL(req.url);
    const dayOfWeek = searchParams.get('dayOfWeek');
    const userId = user.id || user._id;

    let query = { teacherId: new mongoose.Types.ObjectId(userId) };
    if (dayOfWeek) {
      query['schedules.dayOfWeek'] = dayOfWeek;
    }

    // Sort by most recently updated
    const timetables = await Timetable.find(query)
      .populate('batchId', 'batchName programType instrument level')
      .populate('schoolId', 'schoolName')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, timetables }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
