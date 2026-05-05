import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Enquiry from '@/models/Enquiry';
import School from '@/models/School';
import { sendTrialEnquiryNotification } from '@/lib/email';

const clean = (value) => (typeof value === 'string' ? value.trim() : '');
const cleanList = (value) => (
  Array.isArray(value)
    ? value.map(clean).filter(Boolean)
    : clean(value).split(',').map(clean).filter(Boolean)
);
const cleanSchedule = (value) => (
  Array.isArray(value)
    ? value
      .map((entry) => ({
        dayOfWeek: clean(entry?.dayOfWeek),
        timeSlots: cleanList(entry?.timeSlots),
      }))
      .filter((entry) => entry.dayOfWeek && entry.timeSlots.length)
    : []
);
const formatScheduleSlots = (schedule) => (
  schedule.flatMap((entry) => entry.timeSlots.map((slot) => `${entry.dayOfWeek}: ${slot}`))
);

export async function POST(req) {
  try {
    const body = await req.json();
    const name = clean(body.name);
    const phone = clean(body.phone);
    const enquiryType = clean(body.enquiryType) === 'general' ? 'general' : 'trial_class';

    if (!name || (!phone && !clean(body.email))) {
      return NextResponse.json({ success: false, error: 'Name and phone or email are required.' }, { status: 400 });
    }

    await connectDB();

    let school = null;
    if (body.schoolId && mongoose.Types.ObjectId.isValid(body.schoolId)) {
      school = await School.findById(body.schoolId).select('schoolName contactEmail city weeklySchedule').lean();
    }

    const preferredSchedule = cleanSchedule(body.preferredSchedule);
    const preferredDays = [...new Set([
      ...cleanList(body.preferredDays),
      ...preferredSchedule.map((entry) => entry.dayOfWeek),
    ])];
    const preferredTimeSlots = preferredSchedule.length
      ? formatScheduleSlots(preferredSchedule)
      : cleanList(body.preferredTimeSlots);

    if (school && (preferredDays.length || preferredTimeSlots.length || preferredSchedule.length)) {
      const scheduleByDay = new Map(
        (school.weeklySchedule || [])
          .filter((entry) => entry?.dayOfWeek && entry?.isOpen)
          .map((entry) => [entry.dayOfWeek, entry])
      );
      const hasInvalidDay = preferredDays.some((day) => !scheduleByDay.has(day));
      if (hasInvalidDay) {
        return NextResponse.json({ success: false, error: 'One or more selected days are not available for this school.' }, { status: 400 });
      }

      if (preferredSchedule.length) {
        const hasInvalidScheduleTime = preferredSchedule.some((entry) => {
          const validSlotValues = new Set(
            (scheduleByDay.get(entry.dayOfWeek)?.slots || [])
              .map((slot) => `${slot.startTime || ''} - ${slot.endTime || ''}`.trim())
              .filter((slotValue) => slotValue && slotValue !== '-')
          );
          return entry.timeSlots.some((slotValue) => !validSlotValues.has(slotValue));
        });
        if (hasInvalidScheduleTime) {
          return NextResponse.json({ success: false, error: 'One or more selected time slots are not available for the selected day.' }, { status: 400 });
        }
      } else {
        const validSlotValues = new Set();
        preferredDays.forEach((day) => {
          const daySchedule = scheduleByDay.get(day);
          (daySchedule?.slots || [])
            .map((slot) => `${slot.startTime || ''} - ${slot.endTime || ''}`.trim())
            .filter((slotValue) => slotValue && slotValue !== '-')
            .forEach((slotValue) => validSlotValues.add(slotValue));
        });

        const hasInvalidTime = preferredTimeSlots.some((slotValue) => !validSlotValues.has(slotValue));
        if (hasInvalidTime) {
          return NextResponse.json({ success: false, error: 'One or more selected time slots are not available for this school.' }, { status: 400 });
        }
      }
    }

    const enquiry = await Enquiry.create({
      enquiryType,
      source: clean(body.source) || 'dynamic_page',
      pageSlug: clean(body.pageSlug),
      pageTitle: clean(body.pageTitle),
      subject: clean(body.subject),
      message: clean(body.message),
      name,
      age: clean(body.age),
      gender: clean(body.gender),
      email: clean(body.email),
      phone,
      center: clean(body.center),
      instrument: clean(body.instrument),
      schoolId: school?._id,
      schoolName: school?.schoolName || clean(body.schoolName),
      preferredDay: preferredDays[0] || clean(body.preferredDay),
      preferredTimeSlot: preferredTimeSlots[0] || clean(body.preferredTimeSlot),
      preferredDays,
      preferredTimeSlots,
      preferredSchedule,
    });

    sendTrialEnquiryNotification({ enquiry, school }).catch((error) => {
      console.error('Trial enquiry email failed:', error.message);
    });

    return NextResponse.json({ success: true, data: enquiry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
