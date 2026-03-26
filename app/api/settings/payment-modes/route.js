import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Setting from '@/models/Setting';

// Public endpoint — no auth required
// Returns { payOnline: bool, payLater: bool }
export async function GET() {
  try {
    await connectDB();
    const settings = await Setting.find({
      key: { $in: ['payment_mode_online', 'payment_mode_later', 'show_test_otp'] }
    }).lean();

    const get = (key, fallback) => settings.find(s => s.key === key)?.value ?? fallback;

    return NextResponse.json({
      success: true,
      payOnline: get('payment_mode_online', true),
      payLater: get('payment_mode_later', false),
      showTestOtp: get('show_test_otp', false),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
