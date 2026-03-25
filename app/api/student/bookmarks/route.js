import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Bookmark from '@/models/Bookmark';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const bookmarks = await Bookmark.find({ userId: user.id })
      .populate('lessonId', 'title videoUrl')
      .populate('courseId', 'title thumbnail')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: bookmarks }, { status: 200 });
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

    const { lessonId, courseId } = await req.json();
    if (!lessonId || !courseId) {
      return NextResponse.json({ success: false, error: 'Lesson ID and Course ID are required' }, { status: 400 });
    }

    await connectDB();

    const existingBookmark = await Bookmark.findOne({ userId: user.id, lessonId });

    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      return NextResponse.json({ success: true, message: 'Bookmark removed', bookmarked: false }, { status: 200 });
    } else {
      await Bookmark.create({ userId: user.id, lessonId, courseId });
      return NextResponse.json({ success: true, message: 'Bookmark added', bookmarked: true }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
