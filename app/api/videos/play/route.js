import { NextResponse } from 'next/server';
import { generateV4ReadSignedUrl } from '@/lib/gcs';
import { verifyToken } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Lesson from '@/models/Lesson';
import User from '@/models/User';

export async function POST(req) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

    const { lessonId, deviceId } = await req.json();

    const lesson = await Lesson.findById(lessonId).populate('sectionId');
    if (!lesson) return NextResponse.json({ success: false, message: 'Lesson not found' }, { status: 404 });

    const courseId = lesson.sectionId.courseId;

    // Admin/Instructors skip enrollment check
    if (decoded.role === 'student') {
      const enrollment = await Enrollment.findOne({ userId: decoded.id, courseId });
      if (!enrollment) {
        return NextResponse.json({ success: false, message: 'Not enrolled in this course' }, { status: 403 });
      }
      
      // Implement single-device limitation check
      // User model would need a `currentDeviceId` field in a real system.
      // E.g., const user = await User.findById(decoded.id);
      // if (user.currentDeviceId && user.currentDeviceId !== deviceId) { ... }
    }

    const user = await User.findById(decoded.id);

    // Assuming lesson.videoUrl stores the GCS key or path to the HLS manifest
    const videoKey = lesson.videoUrl; 
    
    // In HLS, the manifest contains sub-urls. A real secure implementation often uses signed cookies 
    // or a proxy endpoint. For simplicity, we assume generation of a signed manifest URL, or we 
    // provide the videoKey so the client can request segments via a proxy if required.
    const signedManifestUrl = await generateV4ReadSignedUrl(videoKey);

    return NextResponse.json({
      success: true,
      playbackUrl: signedManifestUrl,
      watermarkEmail: user.email || user.phone || 'student-demo',
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
