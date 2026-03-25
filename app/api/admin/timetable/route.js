import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Timetable from '@/models/Timetable';
import Batch from '@/models/Batch';
import User from '@/models/User';
import School from '@/models/School';
import { getUserFromCookie } from '@/utils/auth';
import mongoose from 'mongoose';

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');
    const teacherId = searchParams.get('teacherId');
    const batchId = searchParams.get('batchId');
    const status = searchParams.get('status');
    const dayOfWeek = searchParams.get('dayOfWeek');

    let query = {};
    if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) query.schoolId = new mongoose.Types.ObjectId(schoolId);
    if (teacherId && mongoose.Types.ObjectId.isValid(teacherId)) query.teacherId = new mongoose.Types.ObjectId(teacherId);
    if (batchId && mongoose.Types.ObjectId.isValid(batchId)) query.batchId = new mongoose.Types.ObjectId(batchId);
    if (status) query.status = status;
    if (dayOfWeek) query['schedules.dayOfWeek'] = dayOfWeek;

    if (user.role === 'school_admin' && user.schoolId) {
      query.schoolId = new mongoose.Types.ObjectId(user.schoolId);
    }

    const timetables = await Timetable.find(query)
      .populate('batchId', 'batchName programType instrument level')
      .populate('schoolId', 'schoolName')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, timetables });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { batchId, schedules, roomName, status } = body;

    if (!batchId || !schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json({ error: 'Please provide batch and at least one schedule slot' }, { status: 400 });
    }

    // Fetch batch details to auto-populate school and teacher
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    
    if (user.role === 'school_admin' && batch.schoolId.toString() !== user.schoolId.toString()) {
       return NextResponse.json({ error: 'Unauthorized access to this batch' }, { status: 403 });
    }

    if (batch.status !== 'active') {
      return NextResponse.json({ error: 'Cannot create timetable for an inactive batch' }, { status: 400 });
    }

    // Validate and check conflicts for each slot in the schedule
    for (const slot of schedules) {
      const { dayOfWeek, startTime, endTime } = slot;
      
      if (!dayOfWeek || !startTime || !endTime) {
        return NextResponse.json({ error: 'All schedule slots must have day, start time, and end time' }, { status: 400 });
      }

      const startMins = timeToMinutes(startTime);
      const endMins = timeToMinutes(endTime);

      if (startMins >= endMins) {
        return NextResponse.json({ error: `Invalid time for ${dayOfWeek}: Start time must be before end time` }, { status: 400 });
      }

      // Check for teacher overlap
      const existingTeacherSchedules = await Timetable.find({
        teacherId: batch.teacherId,
        'schedules.dayOfWeek': dayOfWeek,
        status: 'active'
      });

      for (let entry of existingTeacherSchedules) {
        for (let s of entry.schedules) {
          if (s.dayOfWeek !== dayOfWeek) continue;
          const schedStart = timeToMinutes(s.startTime);
          const schedEnd = timeToMinutes(s.endTime);
          
          if (startMins < schedEnd && endMins > schedStart) {
            return NextResponse.json({ 
              error: `Scheduling conflict: Teacher is already booked on ${dayOfWeek} (${s.startTime} - ${s.endTime}) in another batch.` 
            }, { status: 409 });
          }
        }
      }

      // Check room overlap if room is provided
      if (roomName && roomName.trim() !== '') {
        const existingRoomSchedules = await Timetable.find({
          schoolId: batch.schoolId,
          roomName: roomName.trim(),
          'schedules.dayOfWeek': dayOfWeek,
          status: 'active'
        });

        for (let entry of existingRoomSchedules) {
          for (let s of entry.schedules) {
            if (s.dayOfWeek !== dayOfWeek) continue;
            const schedStart = timeToMinutes(s.startTime);
            const schedEnd = timeToMinutes(s.endTime);
            
            if (startMins < schedEnd && endMins > schedStart) {
              return NextResponse.json({ 
                error: `Room conflict: ${roomName} is already booked on ${dayOfWeek} (${s.startTime} - ${s.endTime}).` 
              }, { status: 409 });
            }
          }
        }
      }
    }

    const timetableEntry = await Timetable.create({
      batchId,
      schoolId: batch.schoolId,
      teacherId: batch.teacherId,
      schedules,
      roomName: roomName?.trim() || '',
      status: status || 'active'
    });

    return NextResponse.json({ success: true, timetable: timetableEntry });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
