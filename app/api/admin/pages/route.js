import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Page from '@/models/Page';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    await connectDB();
    const pages = await Page.find({}).sort({ updatedAt: -1 });
    console.log(`Fetched ${pages.length} pages`);

    const normalizedPages = pages.map(page => {
      const obj = page.toObject();
      obj._id = obj._id.toString(); 
      return obj;
    });

    return NextResponse.json({ success: true, data: normalizedPages });
  } catch (error) {
    console.error('GET PAGES ERROR:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    await connectDB();

    console.log('Creating page with data:', JSON.stringify(data).substring(0, 100));
    const page = await Page.create(data);

    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    console.error('POST PAGE ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...data } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await connectDB();
    console.log('Updating page:', id, 'with data keys:', Object.keys(data));
    const page = await Page.findByIdAndUpdate(id, data, { new: true });

    if (!page) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    console.error('PUT PAGE ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    console.log('Attempting to delete page with ID:', id);

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await connectDB();
    const deletedPage = await Page.findByIdAndDelete(id);

    if (!deletedPage) {
      console.warn('Page not found for deletion:', id);
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
    }

    console.log('Successfully deleted page:', id);
    return NextResponse.json({ success: true, message: 'Page deleted' });
  } catch (error) {
    console.error('DELETE PAGE ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
