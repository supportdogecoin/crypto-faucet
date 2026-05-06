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
    if (!userData) {
      return NextResponse.json(
        { error: 'User data not found' },
        { status: 404 }
      );
    }

    // Get IP for rate limiting and security
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const ipHash = hashIP(ip);

    // Check rate limiting
    const rateLimit = checkRateLimit(userId, 'daily_bonus');
    if (!rateLimit.allowed) {
      await logSecurityEvent(userId, 'rate_limit_exceeded', 'daily_bonus', ipHash);
      return NextResponse.json(
        { error: rateLimit.reason },
        { status: 429 }
      );
    }

    // Check daily bonus cooldown (24 hours)
    const now = Date.now();
    const cooldownMs = FAUCET_CONFIG.DAILY_BONUS_COOLDOWN_HOURS * 60 * 60 * 1000;
    
    if (userData?.lastDailyClaim && now - userData.lastDailyClaim < cooldownMs) {
      const remainingMs = cooldownMs - (now - userData.lastDailyClaim);
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      return NextResponse.json(
        { error: `Daily bonus already claimed. Come back in ${remainingHours} hours.` },
        { status: 429 }
      );
    }

    // Check if streak is broken (more than 48 hours since last claim)
    const streakBreakMs = 48 * 60 * 60 * 1000;
    const streakDays = userData?.streakDays || 0;
    const lastDailyClaim = userData?.lastDailyClaim || 0;
    
    let newStreakDays = streakDays + 1;
    if (lastDailyClaim && now - lastDailyClaim > streakBreakMs) {
      newStreakDays = 1; // Reset streak
    }

    // Calculate bonus based on streak
    const bonusUSD = calculateDailyBonus(newStreakDays);
    const bonusDOGE = usdToDOGE(bonusUSD, FAUCET_CONFIG.DOGE_USD_RATE);

    // Update user balance and streak
    await adminDb.collection('users').doc(userId).update({
      balanceUSD: (userData?.balanceUSD || 0) + bonusUSD,
      balanceDOGE: (userData?.balanceDOGE || 0) + bonusDOGE,
      lastDailyClaim: now,
      streakDays: newStreakDays,
      totalDailyEarned: (userData?.totalDailyEarned || 0) + bonusUSD,
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
      rewardUSD: bonusUSD,
      rewardDOGE: bonusDOGE,
      streakDays: newStreakDays,
      newBalanceUSD: (userData?.balanceUSD || 0) + bonusUSD,
      newBalanceDOGE: (userData?.balanceDOGE || 0) + bonusDOGE,
      nextClaimTime: now + cooldownMs,
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
      { error: 'Failed to claim daily bonus' },
      { status: 500 }
    );
  }
}
