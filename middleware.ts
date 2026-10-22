import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. المسارات المحمية
  const protectedRoutes = ['/admin', '/merchant-dashboard', '/api/secure', '/debt-book'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // 2. استثناء صفحات تسجيل الدخول (حتى لا نطرد المستخدم من صفحة الدخول نفسها)
  const isLoginPage = pathname === '/admin/login' || pathname === '/merchant/login' || pathname === '/login';

  if (isProtectedRoute && !isLoginPage) {
    // 3. البحث عن أي من الكوكيز (القديم أو الجديد)
    const sessionToken = 
      request.cookies.get('sanad_admin')?.value || 
      request.cookies.get('sb-access-token')?.value || 
      request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      // 4. توجيه إلى صفحة دخول الأدمن الصحيحة وليس صفحة الزوار
      const loginUrl = new URL('/admin/login', request.url); 
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // حماية التسجيل الذاتي (كما هو في كودك الأصلي)
  if (pathname === '/register' || pathname === '/api/auth/self-register') {
    const allowSelfRegister = request.headers.get('x-system-invitation-key');
    if (!allowSelfRegister || allowSelfRegister !== process.env.SYSTEM_INVITATION_SECRET) {
      return NextResponse.json(
        { error: 'التسجيل الذاتي محظور سيادياً. يجب أن تتم عملية الضم حصراً عبر المشرفين المعتمدين.' },
        { status: 403 }
      );
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");

  return response;
}

export const config = {
  // استثناء الملفات الثابتة لتسريع الموقع ومنع خطأ Too Many Requests
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)'],
};
