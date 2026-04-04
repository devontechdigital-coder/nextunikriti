import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Package from '@/models/Package';
import { buildPackagePricingOptions } from '@/lib/packagePricing';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const course_id = searchParams.get('course_id');

    if (!course_id) {
      return NextResponse.json({ success: false, error: 'Course ID is required' }, { status: 400 });
    }

    const packages = await Package.find({ 
      course_id, 
      is_active: true 
    })
    .sort({ price: 1 })
    .lean();

    const data = packages.map((pkg) => ({
      ...pkg,
      pricingOptionsResolved: buildPackagePricingOptions(pkg),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
