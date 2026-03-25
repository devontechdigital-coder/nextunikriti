import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Menu from '@/models/Menu';
import { getUserFromCookie } from '@/utils/auth';

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await req.json(); // Array of { _id, order, parentId }
    await connectDB();

    const bulkOps = items.map(item => ({
      updateOne: {
        filter: { _id: item._id },
        update: { 
          order: item.order,
          parentId: item.parentId || null
        }
      }
    }));

    await Menu.bulkWrite(bulkOps);

    return NextResponse.json({ success: true, message: 'Menus reordered successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
