import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';

export async function POST(req) {
  try {
    await dbConnect();
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, message: 'Please provide phone and OTP' }, { status: 400 });
    }

    // TODO: Verify OTP against Twilio/MSG91/Redis
    // For this mock, we accept '123456' as valid OTP.
    if (otp !== '123456') {
      return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 401 });
    }

    // Check user, if not exists, create as student
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        name: 'New Student', // Default name
        role: 'student'
      });
    }

    // Create token
    const token = signToken({ id: user._id, role: user.role });

    const response = NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      }
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    return response;

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
