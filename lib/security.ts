import { adminDb } from './firebaseAdmin';
import { hashIP } from './utils';
import { SECURITY_CONFIG } from './constants';

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
}

export async function checkRateLimit(
  userId: string,
  ipHash: string
): Promise<RateLimitResult> {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Check claims in the last hour
  const hourClaims = await adminDb
    .collection('claims')
    .where('userId', '==', userId)
    .where('timestamp', '>=', oneHourAgo)
    .get();

  if (hourClaims.size >= SECURITY_CONFIG.MAX_CLAIMS_PER_HOUR) {
    return {
      allowed: false,
      reason: 'Too many claims in the last hour. Please wait.',
    };
  }

  // Check claims in the last day
  const dayClaims = await adminDb
    .collection('claims')
    .where('userId', '==', userId)
    .where('timestamp', '>=', oneDayAgo)
    .get();

  if (dayClaims.size >= SECURITY_CONFIG.MAX_CLAIMS_PER_DAY) {
    return {
      allowed: false,
      reason: 'Daily claim limit reached. Come back tomorrow.',
    };
  }

  return { allowed: true };
}

export async function logSecurityEvent(
  userId: string,
  action: string,
  details: string,
  ipHash: string,
  suspicious: boolean = false
): Promise<void> {
  await adminDb.collection('securityLogs').add({
    userId,
    action,
    details,
    ipHash,
    timestamp: Date.now(),
    suspicious,
  });
}

export async function checkSuspiciousStreak(userId: string): Promise<boolean> {
  const userDoc = await adminDb.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData) return false;

  // Check if streak is suspiciously high
  if (userData.streakDays >= SECURITY_CONFIG.SUSPICIOUS_STREAK_THRESHOLD) {
    await logSecurityEvent(
      userId,
      'SUSPICIOUS_STREAK',
      `Streak of ${userData.streakDays} days detected`,
      userData.ipHash,
      true
    );
    return true;
  }

  return false;
}

export async function validateIPConsistency(
  userId: string,
  newIpHash: string
): Promise<boolean> {
  const userDoc = await adminDb.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData) return true;

  // If this is a new user, allow
  if (!userData.ipHash) return true;

  // If IP changed recently, check cooldown
  if (userData.ipHash !== newIpHash) {
    const lastClaim = userData.lastClaim || 0;
    const cooldownMs = SECURITY_CONFIG.IP_CHANGE_COOLDOWN_MINUTES * 60 * 1000;
    
    if (Date.now() - lastClaim < cooldownMs) {
      await logSecurityEvent(
        userId,
        'IP_CHANGE_DETECTED',
        `IP changed during cooldown period`,
        newIpHash,
        true
      );
      return false;
    }
  }

  return true;
}
