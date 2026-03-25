import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Menu from '@/models/Menu';
import { getUserFromCookie } from '@/utils/auth';

export async function GET() {
  try {
    await connectDB();
    const menus = await Menu.find({}).sort({ order: 1 });
    return NextResponse.json({ success: true, data: menus });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();
    
    const parentId = body.parentId === '' ? null : body.parentId;

    // Get the highest order for the current parent and type
    const lastItem = await Menu.findOne({ 
      parentId,
      type: body.type || 'header'
    }).sort({ order: -1 });

    const newOrder = lastItem ? lastItem.order + 1 : 0;
    
    const menu = await Menu.create({
      ...body,
      parentId,
      order: newOrder
    });

    return NextResponse.json({ success: true, data: menu }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
