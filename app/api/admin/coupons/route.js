import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Coupon from '@/models/Coupon';
import { getUserFromCookie } from '@/utils/auth';
import { normalizeCouponPayload } from '@/lib/coupons';

function ensureAdmin() {
  const user = getUserFromCookie();
  return user && ['admin', 'staff'].includes(user.role) ? user : null;
}

export async function GET() {
  try {
    if (!ensureAdmin()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const coupons = await Coupon.find({})
      .populate('courseId', 'title')
      .populate('packageId', 'name course_id')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    if (!ensureAdmin()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const payload = normalizeCouponPayload(body);

    if (!payload.code) {
      return NextResponse.json({ success: false, error: 'Coupon code is required' }, { status: 400 });
    }

    if (!payload.expiryDate) {
      return NextResponse.json({ success: false, error: 'Expiry date is required' }, { status: 400 });
    }

    const coupon = await Coupon.create(payload);
    const populatedCoupon = await Coupon.findById(coupon._id)
      .populate('courseId', 'title')
      .populate('packageId', 'name course_id');

    return NextResponse.json({ success: true, coupon: populatedCoupon }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
