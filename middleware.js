import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const token = request.cookies.get('auth_token')?.value;

  const { pathname } = request.nextUrl;
  
  // Basic route protection flag
  const isAuthRoute = pathname.startsWith('/login');

  if (isAuthRoute && token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_for_dev_only');
      const { payload } = await jwtVerify(token, secret);
      if (payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (payload.role === 'school_admin') {
        return NextResponse.redirect(new URL('/school/dashboard', request.url));
      }
      if (payload.role === 'instructor') return NextResponse.redirect(new URL('/instructor', request.url));
      return NextResponse.redirect(new URL('/dashboard', request.url)); // student dashboard now at /dashboard
    } catch (err) {
      // Invalid token, allow them to view login
      return NextResponse.next();
    }
  }

  // Check RBAC for protected routes
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/school');
  const isInstructorRoute = pathname.startsWith('/instructor');
  const isStudentRoute = pathname.startsWith('/learning') || pathname.startsWith('/dashboard') || pathname.startsWith('/learn');

  if (isAdminRoute || isInstructorRoute || isStudentRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_for_dev_only');
      const { payload } = await jwtVerify(token, secret);
      const role = payload.role;
      const actualRole = payload.actualRole || role;

      if (isAdminRoute && !['admin', 'school_admin'].includes(role)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (isAdminRoute && actualRole === 'sub_admin' && pathname.startsWith('/admin')) {
        const adminPermissions = Array.isArray(payload.adminPermissions) ? payload.adminPermissions : [];
        const allowedKeys = adminPermissions.filter((item) => item?.view).map((item) => item.key);
        const pathToKey = [
          ['dashboard', '/admin/dashboard'],
          ['users', '/admin/users'],
          ['instructors', '/admin/instructors'],
          ['schools', '/admin/schools'],
          ['students', '/admin/students'],
          ['batches', '/admin/batches'],
          ['instruments', '/admin/instruments'],
          ['modes', '/admin/modes'],
          ['timetable', '/admin/timetable'],
          ['attendance', '/admin/attendance'],
          ['courses', '/admin/courses'],
          ['lesson-reviews', '/admin/lesson-reviews'],
          ['packages', '/admin/packages'],
          ['coupons', '/admin/coupons'],
          ['categories', '/admin/categories'],
          ['menus', '/admin/menus'],
          ['banners', '/admin/banners'],
          ['pages', '/admin/pages'],
          ['enquiries', '/admin/enquiries'],
          ['gallery', '/admin/gallery'],
          ['orders', '/admin/orders'],
          ['payments', '/admin/payments'],
          ['data', '/admin/data'],
          ['settings', '/admin/settings'],
          ['analytics', '/admin/analytics'],
        ];
        const current = pathToKey.find(([, href]) => pathname === href || pathname.startsWith(`${href}/`));
        const requestedKey = current?.[0] || 'dashboard';
        if (!allowedKeys.includes(requestedKey)) {
          const firstAllowed = pathToKey.find(([key]) => allowedKeys.includes(key));
          return NextResponse.redirect(new URL(firstAllowed?.[1] || '/login', request.url));
        }
      }

      if (isInstructorRoute && role !== 'instructor' && role !== 'admin') {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (isStudentRoute && !['student', 'admin', 'school_admin', 'instructor'].includes(role)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      if (role === 'school_admin') {
        // If school admin tries to access /admin directly, redirect them to /school
        if (pathname.startsWith('/admin')) {
          return NextResponse.redirect(new URL(pathname.replace(/^\/admin/, '/school'), request.url));
        }

        // Validate allowed sub-paths for school admins
        if (pathname.startsWith('/school')) {
          const allowedSubPaths = ['/dashboard', '/instructors', '/students', '/batches', '/timetable', '/settings', '/attendance'];
          const subPath = pathname.replace(/^\/school/, '') || '/dashboard';
          
          const isAllowed = allowedSubPaths.some(p => subPath === p || subPath.startsWith(p + '/'));
          
          if (!isAllowed) {
            return NextResponse.redirect(new URL('/school/dashboard', request.url));
          }
        }
      }

      // Super Admin access to /school (if accidentally visited) should redirect to /admin
      if (role === 'admin' && pathname.startsWith('/school')) {
        return NextResponse.redirect(new URL(pathname.replace(/^\/school/, '/admin'), request.url));
      }

      return NextResponse.next();
    } catch (err) {
      // Token is expired or invalid
      request.cookies.delete('auth_token');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/instructor/:path*',
    '/learning/:path*',
    '/dashboard/:path*',
    '/learn/:path*',
    '/school/:path*',
    '/login'
  ]
};
