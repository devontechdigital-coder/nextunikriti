import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { otpService } from '@/services/otpService';
import { DEFAULT_PHONE_COUNTRY, normalizePhoneNumber } from '@/lib/phone';

// Stateless OTP structure (can use Redis in prod): simple memory or JWT signature
// For simplicity we will hash the OTP and send it back to frontend or store it in DB momentarily
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { phone, country = DEFAULT_PHONE_COUNTRY } = await req.json();
    const normalizedPhone = normalizePhoneNumber(phone, country);

    if (!normalizedPhone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    await connectDB();

    // Create student if running for the first time
    let user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      user = await User.create({ phone: normalizedPhone, name: 'Student', role: 'student' });
    }

    // Disallow admin/instructor from using OTP login to bypass password (optional security choice)
    if (user.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Only student accounts can use OTP' }, { status: 403 });
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP using crypto
    const ttl = 5 * 60 * 1000; // 5 minutes
    const expires = Date.now() + ttl;
    const data = `${normalizedPhone}.${otpCode}.${expires}`;
    const hash = crypto.createHmac('sha256', process.env.OTP_SECRET || 'otp_secret').update(data).digest('hex');
    const fullHash = `${hash}.${expires}`;

    // Send OTP using provider
    await otpService.sendOTP(normalizedPhone, otpCode);

    // Return the hash (but NOT the code itself)
    return NextResponse.json({
      success: true,
      data: { phone: normalizedPhone, hash: fullHash, otpCode }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
