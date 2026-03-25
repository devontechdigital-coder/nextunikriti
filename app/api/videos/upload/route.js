import { NextResponse } from 'next/server';
import { generateV4UploadSignedUrl } from '@/lib/gcs';
import { verifyToken } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'instructor' && decoded.role !== 'admin')) {
      return NextResponse.json({ success: false, message: 'Only instructors can upload videos' }, { status: 403 });
    }

    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ success: false, message: 'Filename and content type required' }, { status: 400 });
    }

    // Generate unique filename to avoid overwrites
    const uniqueFilename = `videos/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    
    const signedUrl = await generateV4UploadSignedUrl(uniqueFilename, contentType);

    return NextResponse.json({
      success: true,
      uploadUrl: signedUrl,
      // After processing (mocked), the HLS manifest would be available at uniqueFilename + '/index.m3u8'
      // We store the base filename and construct paths later.
      videoKey: uniqueFilename 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
