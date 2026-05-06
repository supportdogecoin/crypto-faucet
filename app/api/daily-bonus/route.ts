import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { hashIP, usdToDOGE, calculateDailyBonus } from '@/lib/utils';
import { FAUCET_CONFIG } from '@/lib/constants';
import { checkRateLimit, logSecurityEvent } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    // Get user data
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const ipHash = hashIP(ip);

    // Check rate limits
    const rateLimit = await checkRateLimit(userId, ipHash);
    if (!rateLimit.allowed) {
      await logSecurityEvent(
        userId,
        'DAILY_BONUS_RATE_LIMIT',
        rateLimit.reason || 'Rate limit exceeded',
        ipHash,
        true
      );
      return NextResponse.json(
        { error: rateLimit.reason },
        { status: 429 }
      );
    }

    // Check daily bonus cooldown (24 hours)
    const now = Date.now();
    const cooldownMs = FAUCET_CONFIG.DAILY_BONUS_COOLDOWN_HOURS * 60 * 60 * 1000;
    
    if (userData.lastDailyClaim && now - userData.lastDailyClaim < cooldownMs) {
      const remainingMs = cooldownMs - (now - userData.lastDailyClaim);
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      return NextResponse.json(
        { error: `Daily bonus already claimed. Come back in ${remainingHours} hours.` },
        { status: 429 }
      );
    }

    // Check if streak is broken (more than 48 hours since last claim)
    const streakBreakMs = 48 * 60 * 60 * 1000;
    let newStreakDays = userData.streakDays;

    if (userData.lastDailyClaim && now - userData.lastDailyClaim > streakBreakMs) {
      // Streak reset
      newStreakDays = 1;
      await logSecurityEvent(
        userId,
        'STREAK_RESET',
        `Streak reset from ${userData.streakDays} to 1`,
        ipHash,
        false
      );
    } else {
      // Increment streak
      newStreakDays = userData.streakDays + 1;
    }

    // Calculate bonus based on streak
    const bonusUSD = calculateDailyBonus(newStreakDays);
    const bonusDOGE = usdToDOGE(bonusUSD, FAUCET_CONFIG.DOGE_USD_RATE);

    // Update user
    await adminDb.collection('users').doc(userId).update({
      balanceUSD: userData.balanceUSD + bonusUSD,
      balanceDOGE: userData.balanceDOGE + bonusDOGE,
      streakDays: newStreakDays,
      lastDailyClaim: now,
      totalDailyEarned: userData.totalDailyEarned + bonusUSD,
      ipHash,
      updatedAt: now,
    });

    // Log claim
    await adminDb.collection('claims').add({
      userId,
      amountUSD: bonusUSD,
      amountDOGE: bonusDOGE,
      timestamp: now,
      ipHash,
      type: 'daily_bonus',
    });

    return NextResponse.json({
      success: true,
      bonusUSD,
      bonusDOGE,
      streakDays: newStreakDays,
      newBalanceUSD: userData.balanceUSD + bonusUSD,
      newBalanceDOGE: userData.balanceDOGE + bonusDOGE,
      nextBonusTime: now + cooldownMs,
    });
  } catch (error: any) {
    console.error('Daily bonus error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expired. Please login again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process daily bonus' },
      { status: 500 }
    );
  }
}
