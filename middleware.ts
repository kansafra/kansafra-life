import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const protectedRoutes = ['/admin', '/merchant-dashboard', '/api/secure', '/debt-book'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    const sessionToken = request.cookies.get('sb-access-token')?.value || request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

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
  matcher: ['/:path*'],
};
