export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { authenticateUser, createSessionToken } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  try {
    // 1. Ekstraksi Client IP Aman (Prioritas cf-connecting-ip dari Cloudflare)
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    const clientIp = cfConnectingIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1'));

    // 2. Parsing & Validasi Input Body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Format permintaan tidak valid' },
        { status: 400 }
      );
    }

    const { email, password, captchaAnswer, captchaToken } = body;

    // Validasi tipe data ketat
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email dan kata sandi harus berupa teks yang valid' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Batasan panjang karakter
    if (!cleanEmail || !password) {
      return NextResponse.json(
        { error: 'Email dan kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    if (cleanEmail.length > 100 || password.length > 128) {
      return NextResponse.json(
        { error: 'Panjang email atau kata sandi melebihi batas yang diizinkan' },
        { status: 400 }
      );
    }

    // 3. Pengecekan Rate Limiting (Dual-Bucket: per-Email dan per-IP)
    const emailLimitKey = `login:email:${cleanEmail}`;
    const ipLimitKey = `login:ip:${clientIp}`;
    const pairLimitKey = `login:pair:${clientIp}:${cleanEmail}`;

    const emailCheck = checkRateLimit(emailLimitKey, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    const ipCheck = checkRateLimit(ipLimitKey, 10, 15 * 60 * 1000, 30 * 60 * 1000);
    const pairCheck = checkRateLimit(pairLimitKey, 5, 15 * 60 * 1000, 15 * 60 * 1000);

    if (!emailCheck.allowed || !ipCheck.allowed || !pairCheck.allowed) {
      const waitSeconds = Math.max(
        emailCheck.retryAfterSeconds,
        ipCheck.retryAfterSeconds,
        pairCheck.retryAfterSeconds
      );
      const minutes = Math.ceil(waitSeconds / 60);

      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login yang gagal. Akun / koneksi Anda dibatasi sementara selama ${minutes} menit demi keamanan. Silakan coba lagi nanti.`,
          retryAfter: waitSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(waitSeconds),
          },
        }
      );
    }

    // 4. Verifikasi Kredensial via auth.ts
    const user = await authenticateUser(cleanEmail, password);

    if (!user) {
      // Catat kegagalan ke semua bucket
      const failEmail = recordFailedAttempt(emailLimitKey, 5, 15 * 60 * 1000);
      const failIp = recordFailedAttempt(ipLimitKey, 10, 30 * 60 * 1000);
      const failPair = recordFailedAttempt(pairLimitKey, 5, 15 * 60 * 1000);

      const remaining = Math.min(failEmail.remaining, failPair.remaining);

      let warningMessage = 'Email atau kata sandi yang Anda masukkan salah.';
      if (remaining > 0 && remaining <= 3) {
        warningMessage += ` Peringatan: Sisa percobaan login Anda tinggal ${remaining} kali lagi sebelum diblokir sementara.`;
      }

      return NextResponse.json(
        {
          error: warningMessage,
          remainingAttempts: remaining,
        },
        { status: 401 }
      );
    }

    // 5. Login Sukses: Reset Rate Limit untuk akun & IP ini
    resetRateLimit(emailLimitKey);
    resetRateLimit(ipLimitKey);
    resetRateLimit(pairLimitKey);

    // 6. Buat Token Sesi & Pasang Cookie HTTP-Only Aman
    const token = createSessionToken(user);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'Login berhasil',
    });

    response.cookies.set('wiz_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 hari
    });

    return response;
  } catch (error: any) {
    console.error('Unhandled login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    );
  }
}
