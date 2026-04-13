import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Coupon from '@/models/Coupon';
import { getUserFromCookie } from '@/utils/auth';
import { normalizeCouponPayload } from '@/lib/coupons';

function ensureAdmin() {
  const user = getUserFromCookie();
  return user && ['admin', 'staff'].includes(user.role) ? user : null;
}

export async function GET(req, { params }) {
  try {
    if (!ensureAdmin()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const coupon = await Coupon.findById(params.id)
      .populate('courseId', 'title')
      .populate('packageId', 'name course_id');

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
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

    const coupon = await Coupon.findByIdAndUpdate(params.id, payload, {
      new: true,
      runValidators: true,
    })
      .populate('courseId', 'title')
      .populate('packageId', 'name course_id');

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    if (!ensureAdmin()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const coupon = await Coupon.findByIdAndDelete(params.id);
    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
