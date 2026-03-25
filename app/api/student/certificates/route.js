import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Certificate from '@/models/Certificate';
import Enrollment from '@/models/Enrollment';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const certificates = await Certificate.find({ userId: user.id })
      .populate('courseId', 'title thumbnail')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: certificates }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await req.json();
    if (!courseId) {
      return NextResponse.json({ success: false, error: 'Course ID is required' }, { status: 400 });
    }

    await connectDB();

    // Check if certificate already exists
    const existingCert = await Certificate.findOne({ userId: user.id, courseId });
    if (existingCert) {
       return NextResponse.json({ success: true, data: existingCert }, { status: 200 });
    }

    // Check if course is actually completed
    const enrollment = await Enrollment.findOne({ userId: user.id, courseId });
    if (!enrollment || !enrollment.completed) {
      return NextResponse.json({ success: false, error: 'Course not yet completed' }, { status: 400 });
    }

    // Generate certificate identifier
    const certId = `CERT-${user.id.slice(-4)}-${courseId.slice(-4)}-${Date.now().toString().slice(-4)}`.toUpperCase();
    
    // In a real app, you might generate a PDF here or just provide a URL to a dynamic renderer
    const certificate = await Certificate.create({
      userId: user.id,
      courseId,
      certificateUrl: `/certificates/${certId}`, // Mock URL
      certificateId: certId
    });

    return NextResponse.json({ success: true, data: certificate }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
