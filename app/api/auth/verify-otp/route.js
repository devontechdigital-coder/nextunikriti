import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { phone, hash, otp } = await req.json();

    if (!phone || !hash || !otp) {
      return NextResponse.json({ success: false, error: 'Phone, hash, and OTP are required' }, { status: 400 });
    }

    const [hashValue, expires] = hash.split('.');

    // Check if expired
    if (Date.now() > parseInt(expires)) {
      return NextResponse.json({ success: false, error: 'OTP has expired' }, { status: 400 });
    }

    // Verify hash
    const data = `${phone}.${otp}.${expires}`;
    const calculatedHash = crypto.createHmac('sha256', process.env.OTP_SECRET || 'otp_secret').update(data).digest('hex');

    if (calculatedHash !== hashValue) {
      return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
    }

    // OTP is valid, connect and issue token
    await connectDB();
    const user = await User.findOne({ phone });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
      { expiresIn: '7d' }
    );

    // Set cookie
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
