import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import '@/models/Course';
import Package from '@/models/Package';
import { getUserFromCookie } from '@/utils/auth';
import { normalizePackagePricingInput } from '@/lib/packagePricing';
import { normalizeGradeName } from '@/lib/gradeUtils';

export async function PUT(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await dbConnect();
    const body = await req.json();
    const payload = {
      ...normalizePackagePricingInput(body, { partial: true }),
      ...(Object.prototype.hasOwnProperty.call(body, 'gradeName') ? { gradeName: normalizeGradeName(body?.gradeName) } : {}),
    };

    const pkg = await Package.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true, context: 'query' }
    ).populate('course_id', 'title');
    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await dbConnect();
    
    // Hard delete the package
    const pkg = await Package.findByIdAndDelete(id);
    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
