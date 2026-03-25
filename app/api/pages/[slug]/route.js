import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Page from '@/models/Page';

export async function GET(req, { params }) {
  try {
    const { slug } = params;
    await connectDB();
    const page = await Page.findOne({ slug, status: 'published' });

    if (!page) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
