import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { upsertStudentProfile } from '@/lib/studentProfile';
import { DEFAULT_PHONE_COUNTRY, normalizePhoneNumber } from '@/lib/phone';

// Public endpoint — updates name/email for a student by phone (called after OTP verification)
export async function POST(req) {
  try {
    const { phone, name, email, studentProfile, country = DEFAULT_PHONE_COUNTRY } = await req.json();
    const normalizedPhone = normalizePhoneNumber(phone, country);

    if (!normalizedPhone) {
      return NextResponse.json({ success: false, error: 'Phone is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ phone: normalizedPhone, role: 'student' });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    await upsertStudentProfile({
      userId: user._id,
      userFields: {
        name,
        email,
      },
      studentFields: {
        ...(studentProfile || {}),
        name: name || studentProfile?.name,
      },
    });

    const updatedUser = await User.findById(user._id);

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
