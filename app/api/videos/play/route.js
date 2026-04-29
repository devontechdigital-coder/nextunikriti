import { NextResponse } from 'next/server';
import { generateV4ReadSignedUrl } from '@/lib/gcs';
import dbConnect from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Lesson from '@/models/Lesson';
import Section from '@/models/Section';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';
import { findPreferredEnrollmentForCourse } from '@/lib/enrollmentLifecycle';

const isHttpUrl = (value = '') => /^https?:\/\//i.test(value);
const ALLOWED_QUALITIES = ['auto', '240p', '360p', '480p', '720p', '1080p'];
void Section;

export async function POST(req) {
  try {
    await dbConnect();

    const user = getUserFromCookie();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { lessonId, quality = 'auto' } = await req.json();
    if (!lessonId) return NextResponse.json({ success: false, message: 'Lesson ID is required' }, { status: 400 });
    if (!ALLOWED_QUALITIES.includes(quality)) {
      return NextResponse.json({ success: false, message: 'Invalid video quality' }, { status: 400 });
    }

    const lesson = await Lesson.findById(lessonId).populate('sectionId');
    if (!lesson) return NextResponse.json({ success: false, message: 'Lesson not found' }, { status: 404 });

    const courseId = lesson.sectionId.courseId;

    if (!lesson.videoUrl) {
      return NextResponse.json({ success: false, message: 'No video available for this lesson' }, { status: 404 });
    }

    if (user.role === 'student') {
      const enrollment = await Enrollment.findOne(
        findPreferredEnrollmentForCourse({ userId: user.id, courseId })
      ).lean();
      if (!enrollment) {
        return NextResponse.json({ success: false, message: 'Not enrolled in this course' }, { status: 403 });
      }
    } else if (user.role === 'instructor') {
      const course = await Course.findById(courseId).select('course_creator instructor').lean();
      const ownerId = (course?.course_creator || course?.instructor)?.toString();
      if (ownerId !== user.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized for this lesson' }, { status: 403 });
      }
    } else if (!['admin', 'staff'].includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const qualitySource = quality === 'auto'
      ? ''
      : lesson.videoQualities?.find((item) => item.label === quality && item.url)?.url;
    const videoSource = qualitySource || lesson.videoUrl;
    const sourceUrl = isHttpUrl(videoSource)
      ? videoSource
      : await generateV4ReadSignedUrl(videoSource);

    const upstream = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Unikirti-LMS-Video-Proxy',
      },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ success: false, message: 'Unable to load video' }, { status: 502 });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'video/mp4',
        'Cache-Control': 'no-store, private',
        'Content-Disposition': 'inline; filename="lesson-video"',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
