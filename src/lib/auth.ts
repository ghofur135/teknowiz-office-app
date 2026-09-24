import crypto from 'crypto';
import { getDb } from './db';

const SESSION_SECRET = process.env.SESSION_SECRET || 'teknowiz-secret-key-2026-auth-session';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + SESSION_SECRET).digest('hex');
}

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

export function verifySessionToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [base64Payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(base64Payload)
      .digest('base64url');

    if (signature !== expectedSig) return null;

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

export async function authenticateUser(email: string, passwordInput: string): Promise<AuthUser | null> {
  const cleanEmail = email.trim().toLowerCase();

  // Support hardcoded requested credentials or database check
  if (cleanEmail === 'dhimas@teknowiz.id' && passwordInput === 'Teknowiz26#!') {
    return {
      id: 1,
      name: 'Dhimas Ghofur A. F.',
      email: 'dhimas@teknowiz.id',
      role: 'ADMIN',
    };
  }

  try {
    const db = getDb();
    const res = await db.execute({
      sql: 'SELECT * FROM users WHERE LOWER(email) = ?',
      args: [cleanEmail]
    });

    if (res.rows.length === 0) return null;
    const user = res.rows[0];

    // Cek password plain atau hashed
    const isMatch =
      user.password === passwordInput ||
      user.password === hashPassword(passwordInput);

    if (!isMatch) return null;

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
