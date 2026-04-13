import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Coupon from '@/models/Coupon';
import Package from '@/models/Package';
import { normalizeCouponCode, serializeCouponForClient, validateCouponForCheckout } from '@/lib/coupons';
import { resolvePackagePriceOption } from '@/lib/packagePricing';

export async function POST(req) {
  try {
    await connectDB();
    const { code, package_id, package_price_key, course_id } = await req.json();
    const normalizedCode = normalizeCouponCode(code);

    if (!normalizedCode) {
      return NextResponse.json({ success: false, error: 'Coupon code is required' }, { status: 400 });
    }

    let amount = 0;
    let resolvedCourseId = course_id || '';

    if (package_id) {
      const pkg = await Package.findById(package_id).populate('course_id', 'title');
      if (!pkg) {
        return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
      }

      const selectedOption = resolvePackagePriceOption(pkg, package_price_key);
      amount = selectedOption.price;
      resolvedCourseId = pkg.course_id?._id?.toString() || resolvedCourseId;
    }

    const coupon = await Coupon.findOne({ code: normalizedCode });
    const validation = validateCouponForCheckout({
      coupon,
      courseId: resolvedCourseId,
      packageId: package_id,
      amount,
    });

    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      coupon: serializeCouponForClient(coupon, amount),
      discountAmount: validation.discountAmount,
      finalAmount: validation.finalAmount,
      message: validation.message,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
