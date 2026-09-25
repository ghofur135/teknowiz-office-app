import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_SECRET = process.env.SESSION_SECRET || 'teknowiz-secret-key-2026-auth-session';

/**
 * Verifikasi token sesi secara kriptografis menggunakan Web Crypto API (Edge-compatible).
 * Memastikan token tidak dipalsukan (anti-tamper) dan belum kedaluwarsa.
 */
async function verifySessionEdge(token: string | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [base64Payload, signature] = parts;
  if (!base64Payload || !signature) return false;

  try {
    // 1. Periksa batas kedaluwarsa (exp)
    const normalizedPayload = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(normalizedPayload);
    const payload = JSON.parse(jsonStr);

    if (!payload.id || !payload.exp || Date.now() > payload.exp) {
      return false;
    }

    // 2. Verifikasi HMAC-SHA256 signature secara matematis
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const normalizedSig = signature.replace(/-/g, '+').replace(/_/g, '/');
    const binarySig = atob(normalizedSig);
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const dataBytes = enc.encode(base64Payload);
    return await crypto.subtle.verify('HMAC', key, sigBytes, dataBytes);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto');

  // 1. Enforce HTTPS: Redirect HTTP -> HTTPS secara permanen (301)
  if (proto === 'http' && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 2. Lewati aset statis, gambar, berkas upload publik, dan internal Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/api/verify') ||
    pathname.startsWith('/api/auth') ||
    pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js|pdf)$/i)
  ) {
    return NextResponse.next();
  }

  // 3. Verifikasi keabsahan kriptografis token sesi
  const token = request.cookies.get('wiz_session')?.value;
  const isAuthenticated = await verifySessionEdge(token);

  // 4. Penanganan Endpoint API Privat (seperti /api/documents, /api/clients, dll)
  if (pathname.startsWith('/api')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi otentikasi tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 5. Jika sedang berada di halaman login:
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 6. Jika belum login dan mengakses halaman internal (dashboard, faktur, settings, dll):
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
