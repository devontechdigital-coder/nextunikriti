import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Timetable from '@/models/Timetable';
import Batch from '@/models/Batch';
import { getUserFromCookie } from '@/utils/auth';

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export async function PUT(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    const body = await req.json();
    const { schedules, roomName, status } = body;

    const existingEntry = await Timetable.findById(id);
    if (!existingEntry) {
      return NextResponse.json({ error: 'Timetable entry not found' }, { status: 404 });
    }

    if (user.role === 'school_admin' && existingEntry.schoolId.toString() !== user.schoolId.toString()) {
      return NextResponse.json({ error: 'Unauthorized to modify this entry' }, { status: 403 });
    }

    let finalSchedules = schedules || existingEntry.schedules;
    let finalRoomName = roomName !== undefined ? roomName : existingEntry.roomName;

    if (!Array.isArray(finalSchedules) || finalSchedules.length === 0) {
      return NextResponse.json({ error: 'At least one schedule slot is required' }, { status: 400 });
    }

    // Validate and check conflicts for each slot
    for (const slot of finalSchedules) {
      const { dayOfWeek, startTime, endTime } = slot;
      const startMins = timeToMinutes(startTime);
      const endMins = timeToMinutes(endTime);

      if (startMins >= endMins) {
        return NextResponse.json({ error: `Invalid time for ${dayOfWeek}: Start time must be before end time` }, { status: 400 });
      }

      // Check for teacher overlap (excluding this entry)
      const existingTeacherSchedules = await Timetable.find({
        _id: { $ne: id },
        teacherId: existingEntry.teacherId,
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
      if (finalRoomName && finalRoomName.trim() !== '') {
        const existingRoomSchedules = await Timetable.find({
          _id: { $ne: id },
          schoolId: existingEntry.schoolId,
          roomName: finalRoomName.trim(),
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
                error: `Room conflict: ${finalRoomName} is already booked on ${dayOfWeek} (${s.startTime} - ${s.endTime}).` 
              }, { status: 409 });
            }
          }
        }
      }
    }

    const updatedEntry = await Timetable.findByIdAndUpdate(
      id,
      {
        schedules: finalSchedules,
        roomName: finalRoomName?.trim() || '',
        status: status !== undefined ? status : existingEntry.status
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, timetable: updatedEntry });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  
    await dbConnect();
    const { id } = params;

    const entry = await Timetable.findById(id);
    if (!entry) {
       return NextResponse.json({ error: 'Timetable entry not found' }, { status: 404 });
    }

    if (user.role === 'school_admin' && entry.schoolId.toString() !== user.schoolId.toString()) {
      return NextResponse.json({ error: 'Unauthorized to delete this entry' }, { status: 403 });
    }

    await Timetable.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Timetable entry deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
