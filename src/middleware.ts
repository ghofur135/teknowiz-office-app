import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati static assets, public images, uploads, internal Next.js, API routes, dan verifikasi dokumen publik
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/verify') ||
    pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js|pdf)$/i)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('wiz_session')?.value;
  const isAuthenticated = Boolean(token && token.includes('.'));

  // Jika sedang di halaman login:
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Jika belum login dan mengakses halaman dashboard/cetak:
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
