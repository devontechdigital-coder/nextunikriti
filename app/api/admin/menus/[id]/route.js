import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Menu from '@/models/Menu';
import { getUserFromCookie } from '@/utils/auth';

export async function PUT(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    
    if (body.parentId === '') {
      body.parentId = null;
    }
    
    await connectDB();
    const menu = await Menu.findByIdAndUpdate(id, body, { new: true });
    
    if (!menu) {
      return NextResponse.json({ success: false, error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: menu });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await connectDB();
    
    // Also delete children recursively (or at least the first level as submenus)
    // For simplicity, we'll delete all submenus where parentId is this ID
    await Menu.deleteMany({ parentId: id });
    const menu = await Menu.findByIdAndDelete(id);

    if (!menu) {
      return NextResponse.json({ success: false, error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Menu item and its submenus deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
