import crypto from 'crypto';
import { getDb } from './db';

const SESSION_SECRET = process.env.SESSION_SECRET || 'teknowiz-secret-key-2026-auth-session';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

/**
 * Hash password menggunakan Scrypt dengan random salt 16-byte (OWASP standard).
 * Format: "scrypt:<salt>:<hash>"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt + SESSION_SECRET, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

/**
 * Verifikasi password dengan dukungan backwards compatibility (Scrypt, legacy SHA-256, plaintext)
 * dan menggunakan constant-time comparison (crypto.timingSafeEqual) untuk mencegah Timing Attacks.
 */
export function verifyPassword(passwordInput: string, storedHash: string): { isValid: boolean; needsRehash: boolean } {
  if (!storedHash || !passwordInput) {
    return { isValid: false, needsRehash: false };
  }

  // 1. Format Modern: Scrypt (scrypt:<salt>:<hash>)
  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return { isValid: false, needsRehash: false };

    const [, salt, expectedHashHex] = parts;
    const computedHashHex = crypto.scryptSync(passwordInput, salt + SESSION_SECRET, 64).toString('hex');

    const expectedBuf = Buffer.from(expectedHashHex, 'hex');
    const computedBuf = Buffer.from(computedHashHex, 'hex');

    if (expectedBuf.length !== computedBuf.length) {
      return { isValid: false, needsRehash: false };
    }

    const isValid = crypto.timingSafeEqual(expectedBuf, computedBuf);
    return { isValid, needsRehash: false };
  }

  // 2. Format Legacy: Single-iteration SHA-256 (64 hex characters)
  const legacySha256Hex = crypto.createHash('sha256').update(passwordInput + SESSION_SECRET).digest('hex');
  if (storedHash.length === legacySha256Hex.length) {
    const storedBuf = Buffer.from(storedHash, 'utf8');
    const legacyBuf = Buffer.from(legacySha256Hex, 'utf8');
    if (crypto.timingSafeEqual(storedBuf, legacyBuf)) {
      return { isValid: true, needsRehash: true };
    }
  }

  // 3. Format Legacy Initial Seed: Plaintext
  if (storedHash.length === passwordInput.length) {
    const storedBuf = Buffer.from(storedHash, 'utf8');
    const inputBuf = Buffer.from(passwordInput, 'utf8');
    if (crypto.timingSafeEqual(storedBuf, inputBuf)) {
      return { isValid: true, needsRehash: true };
    }
  }

  return { isValid: false, needsRehash: false };
}

/**
 * Buat JWT-like signed session token dengan HMAC-SHA256
 */
export function createSessionToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 hari
  };
  const jsonStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Payload)
    .digest('base64url');

  return `${base64Payload}.${signature}`;
}

/**
 * Verifikasi signature token dengan constant-time check
 */
export function verifySessionToken(token: string): AuthUser | null {
  try {
    if (typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [base64Payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(base64Payload)
      .digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const jsonStr = Buffer.from(base64Payload, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr);

    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Autentikasi Pengguna dengan:
 * 1. Sanitasi dan validasi tipe ketat (cegah Prototype/Object Injection)
 * 2. Parameterized SQL query (cegah SQL Injection)
 * 3. Constant-time dummy computation jika email tidak ditemukan (cegah Username Enumeration via timing)
 * 4. Silent password auto-upgrade ke Scrypt jika akun masih menggunakan plaintext / legacy hash
 */
export async function authenticateUser(email: unknown, passwordInput: unknown): Promise<AuthUser | null> {
  // 1. Validasi Tipe & Batas Panjang String
  if (typeof email !== 'string' || typeof passwordInput !== 'string') {
    return null;
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || cleanEmail.length > 100 || passwordInput.length > 128) {
    return null;
  }

  try {
    const db = getDb();

    // 2. Parameterized SQL Query (kebal SQL Injection)
    const res = await db.execute({
      sql: 'SELECT id, name, email, password, role FROM users WHERE LOWER(email) = ? LIMIT 1',
      args: [cleanEmail]
    });

    // 3. Proteksi Timing Attack / Username Enumeration:
    // Jika email tidak ditemukan, tetap jalankan operasi komputasi Scrypt palsu (dummy)
    // agar waktu respon server sama persis dengan saat user ditemukan.
    if (res.rows.length === 0) {
      crypto.scryptSync(passwordInput, 'dummy-salt-constant-time' + SESSION_SECRET, 64);
      return null;
    }

    const user = res.rows[0];
    const storedPassword = String(user.password || '');

    // 4. Verifikasi Password dengan Constant-time comparison
    const { isValid, needsRehash } = verifyPassword(passwordInput, storedPassword);

    if (!isValid) {
      return null;
    }

    // 5. Silent Auto-Upgrade: Jika password masih plaintext atau legacy SHA-256,
    // langsung upgrade ke salted Scrypt di database secara otomatis dan transparan.
    if (needsRehash) {
      try {
        const newStrongHash = hashPassword(passwordInput);
        await db.execute({
          sql: 'UPDATE users SET password = ? WHERE id = ?',
          args: [newStrongHash, user.id]
        });
      } catch (rehashErr) {
        console.error('Silent rehash error (non-fatal):', rehashErr);
      }
    }

    return {
      id: Number(user.id),
      name: String(user.name),
      email: String(user.email),
      role: String(user.role || 'ADMIN'),
    };
  } catch (err) {
    console.error('Auth error:', err);
    return null;
  }
}
