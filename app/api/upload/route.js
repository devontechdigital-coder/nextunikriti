import { NextResponse } from 'next/server';
import { generateV4UploadSignedUrl } from '@/lib/gcs';
import { getUserFromCookie } from '@/utils/auth';

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role === 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ success: false, error: 'Filename and contentType are required' }, { status: 400 });
    }

    // Generate a unique filename to prevent overwrites
    const uniqueFilename = `${user.id}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Get signed URL from GCS utility
    const signedUrl = await generateV4UploadSignedUrl(uniqueFilename, contentType);

    // Return the signed URL and the final public/retrieval path
    return NextResponse.json({ 
        success: true, 
        data: { 
            signedUrl, 
            fileUrl: uniqueFilename // We store the path, not the full URL, to generate read URLs later
        } 
    }, { status: 200 });

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
