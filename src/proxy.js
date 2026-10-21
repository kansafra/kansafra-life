import { NextResponse } from 'next/server';

const rateLimit = new Map();

function checkRateLimit(ip, limit = 100, windowMs = 60000) {
  const now = Date.now();
  let bucket = rateLimit.get(ip);
  if (!bucket || bucket.reset < now) {
    bucket = { count: 0, reset: now + windowMs };
    rateLimit.set(ip, bucket);
  }
  bucket.count++;
  if (bucket.count > limit) {
    return { success: false, remaining: 0, reset: bucket.reset };
  }
  return { success: true, remaining: limit - bucket.count, reset: bucket.reset };
}

export default function proxy(req) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  const blocked = [/\/\.env/, /\/\.git/, /\/wp-admin/, /\/config\./, /\/\.DS_Store/];
  if (blocked.some(r => r.test(pathname))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const rl = checkRateLimit(ip, 100, 60000);
  if (!rl.success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) },
    });
  }

  const res = NextResponse.next();
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)'],
};
