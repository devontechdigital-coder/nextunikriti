import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserFromCookie } from '@/utils/auth';
import Student from '@/models/Student';
import User from '@/models/User';
import Batch from '@/models/Batch';
import Timetable from '@/models/Timetable';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'school_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { schoolId } = user;
    if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
      return NextResponse.json({ success: false, error: 'No school assigned to this admin' }, { status: 400 });
    }

    await connectDB();
    const oid = new mongoose.Types.ObjectId(schoolId);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayString = days[new Date().getDay()];

    const [
      totalStudents,
      activeStudents,
      totalInstructors,
      activeBatches,
      rawClasses,
      recentStudents
    ] = await Promise.all([
      Student.countDocuments({ schoolId: oid }),
      Student.countDocuments({ schoolId: oid, status: 'active' }),
      User.countDocuments({ role: 'instructor', schoolId: oid }),
      Batch.countDocuments({ schoolId: oid, status: 'active' }),
      Timetable.find({ schoolId: oid, 'schedules.dayOfWeek': todayString })
        .populate('batchId', 'batchName')
        .populate('teacherId', 'name')
        .lean(),
      Student.find({ schoolId: oid })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name student_name enrolment_number status createdAt')
        .lean()
    ]);

    // Flatten classes to match frontend expectation (startTime/endTime at top level)
    const todayClasses = [];
    rawClasses.forEach(entry => {
      if (entry.schedules && Array.isArray(entry.schedules)) {
        entry.schedules.forEach(slot => {
          if (slot.dayOfWeek === todayString) {
            todayClasses.push({
              ...entry,
              startTime: slot.startTime,
              endTime: slot.endTime,
              schedules: undefined // Remove to avoid confusion
            });
          }
        });
      }
    });

    // Sort flattened classes by startTime
    todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        totalInstructors,
        activeBatches,
        todayClasses,
        recentStudents
      }
    }, { status: 200 });

  } catch (error) {
    console.error('School Dashboard Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
