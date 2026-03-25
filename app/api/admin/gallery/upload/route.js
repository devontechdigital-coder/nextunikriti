import { NextResponse } from 'next/server';
import { generateV4UploadSignedUrl } from '@/lib/gcs';
import { getUserFromCookie } from '@/utils/auth';

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ success: false, error: 'Filename and Content Type are required' }, { status: 400 });
    }

    const url = await generateV4UploadSignedUrl(filename, contentType);
    return NextResponse.json({ success: true, url });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
