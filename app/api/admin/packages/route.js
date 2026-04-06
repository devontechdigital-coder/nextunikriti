import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Package from '@/models/Package';
import { getUserFromCookie } from '@/utils/auth';
import { getPackageDisplayPrice, normalizePackagePricingInput } from '@/lib/packagePricing';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const course_id = searchParams.get('course_id');

    const query = {};
    if (course_id) query.course_id = course_id;

    const packages = await Package.find(query)
      .populate('course_id', 'title')
      .sort({ createdAt: -1 })
      .lean();

    const enrichedPackages = packages.map((pkg) => ({
      ...pkg,
      displayPrice: getPackageDisplayPrice(pkg),
    }));

    return NextResponse.json({ success: true, packages: enrichedPackages });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const payload = normalizePackagePricingInput(body);
    const pkg = await Package.create(payload);
    const populatedPackage = await Package.findById(pkg._id).populate('course_id', 'title');
    return NextResponse.json({ success: true, package: populatedPackage });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
