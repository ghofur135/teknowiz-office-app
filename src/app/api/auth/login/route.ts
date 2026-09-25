import { NextResponse } from 'next/server';
import { authenticateUser, createSessionToken } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  try {
    // 1. Ekstraksi IP Client (Mendukung reverse proxy Nginx / Cloudflare / VPS)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1');

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

    const { email, password } = body;

    // Validasi tipe data ketat (mencegah NoSQL/Prototype injection)
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email dan kata sandi harus berupa teks yang valid' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Batasan panjang karakter (mencegah ReDoS / Buffer / Memory overload)
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

    // 3. Pengecekan Rate Limiting (Proteksi Brute-Force & Credential Stuffing)
    // Batas: Maksimal 5 percobaan gagal per IP/Email dalam kurun waktu 15 menit
    const rateLimitKey = `login:${clientIp}:${cleanEmail}`;
    const ipLimitKey = `login:ip:${clientIp}`;

    const userCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    const ipCheck = checkRateLimit(ipLimitKey, 15, 15 * 60 * 1000, 30 * 60 * 1000);

    if (!userCheck.allowed || !ipCheck.allowed) {
      const waitSeconds = Math.max(userCheck.retryAfterSeconds, ipCheck.retryAfterSeconds);
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
      // Catat kegagalan untuk mengaktifkan batas rate-limit
      const failUser = recordFailedAttempt(rateLimitKey, 5, 15 * 60 * 1000);
      recordFailedAttempt(ipLimitKey, 15, 30 * 60 * 1000);

      let warningMessage = 'Email atau kata sandi yang Anda masukkan salah.';
      if (failUser.remaining > 0 && failUser.remaining <= 3) {
        warningMessage += ` Peringatan: Sisa percobaan login Anda tinggal ${failUser.remaining} kali lagi sebelum diblokir sementara.`;
      }

      return NextResponse.json(
        {
          error: warningMessage,
          remainingAttempts: failUser.remaining,
        },
        { status: 401 }
      );
    }

    // 5. Login Sukses: Reset Rate Limit untuk IP & User ini
    resetRateLimit(rateLimitKey);

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
      secure: process.env.NODE_ENV === 'production',
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
