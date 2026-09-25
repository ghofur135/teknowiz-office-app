/**
 * In-Memory Sliding Window Rate Limiter untuk WizBilling
 * PT Tekno Wiz Indonesia
 * 
 * Melindungi endpoint sensitif (seperti /api/auth/login) dari serangan
 * Brute-Force, Credential Stuffing, dan Dictionary Attacks.
 */

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Pembersihan record usang secara berkala setiap 10 menit
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (
        now - record.firstAttempt > 30 * 60 * 1000 &&
        (!record.blockedUntil || now > record.blockedUntil)
      ) {
        rateLimitStore.delete(key);
      }
    });
  }, 10 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Cek apakah sebuah kunci (IP atau IP+Email) masih diizinkan melakukan percobaan
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
  blockDurationMs = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
  }

  // Jika sedang dalam masa hukuman blokir (lockout)
  if (record.blockedUntil && now < record.blockedUntil) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  // Jika masa blokir atau window sudah kedaluwarsa, reset record
  if (now - record.firstAttempt > windowMs) {
    rateLimitStore.delete(key);
    return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
  }

  // Jika percobaan sudah mencapai batas maksimum
  if (record.count >= maxAttempts) {
    record.blockedUntil = now + blockDurationMs;
    const retryAfterSeconds = Math.ceil(blockDurationMs / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - record.count),
    retryAfterSeconds: 0,
  };
}

/**
 * Catat kegagalan login untuk menambah counter percobaan
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts = 5,
  blockDurationMs = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || now - record.firstAttempt > 15 * 60 * 1000) {
    record = { count: 1, firstAttempt: now };
  } else {
    record.count += 1;
  }

  if (record.count >= maxAttempts) {
    record.blockedUntil = now + blockDurationMs;
    rateLimitStore.set(key, record);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(blockDurationMs / 1000),
    };
  }

  rateLimitStore.set(key, record);
  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - record.count),
    retryAfterSeconds: 0,
  };
}

/**
 * Reset counter jika login berhasil
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
