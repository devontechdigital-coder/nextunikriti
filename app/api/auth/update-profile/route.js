import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

// Public endpoint — updates name/email for a student by phone (called after OTP verification)
export async function POST(req) {
  try {
    const { phone, name, email } = await req.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone is required' }, { status: 400 });
    }

    await connectDB();

    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (email && email.trim()) updateData.email = email.trim().toLowerCase();

    const user = await User.findOneAndUpdate(
      { phone, role: 'student' },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
