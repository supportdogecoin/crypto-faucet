import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { hashIP, usdToDOGE } from '@/lib/utils';
import { FAUCET_CONFIG } from '@/lib/constants';
import { checkRateLimit, validateIPConsistency, logSecurityEvent } from '@/lib/security';

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

    // Validate IP consistency
    const ipValid = await validateIPConsistency(userId, ipHash);
    if (!ipValid) {
      return NextResponse.json(
        { error: 'Security check failed. IP changed too recently.' },
        { status: 403 }
      );
    }

    // Check rate limits
    const rateLimit = await checkRateLimit(userId, ipHash);
    if (!rateLimit.allowed) {
      await logSecurityEvent(
        userId,
        'RATE_LIMIT_EXCEEDED',
        rateLimit.reason || 'Rate limit exceeded',
        ipHash,
        true
      );
      return NextResponse.json(
        { error: rateLimit.reason },
        { status: 429 }
      );
    }

    // Check cooldown
    const now = Date.now();
    const cooldownMs = FAUCET_CONFIG.CLAIM_COOLDOWN_MINUTES * 60 * 1000;
    
    if (userData.lastClaim && now - userData.lastClaim < cooldownMs) {
      const remainingMs = cooldownMs - (now - userData.lastClaim);
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return NextResponse.json(
        { error: `Please wait ${remainingMinutes} minutes before claiming again` },
        { status: 429 }
      );
    }

    // Calculate rewards
    const rewardUSD = FAUCET_CONFIG.REWARD_PER_CLAIM_USD;
    const rewardDOGE = usdToDOGE(rewardUSD, FAUCET_CONFIG.DOGE_USD_RATE);

    // Update user balance
    await adminDb.collection('users').doc(userId).update({
      balanceUSD: userData.balanceUSD + rewardUSD,
      balanceDOGE: userData.balanceDOGE + rewardDOGE,
      lastClaim: now,
      totalClaims: userData.totalClaims + 1,
      ipHash,
      updatedAt: now,
    });

    // Log claim
    await adminDb.collection('claims').add({
      userId,
      amountUSD: rewardUSD,
      amountDOGE: rewardDOGE,
      timestamp: now,
      ipHash,
      type: 'claim',
    });

    return NextResponse.json({
      success: true,
      rewardUSD,
      rewardDOGE,
      newBalanceUSD: userData.balanceUSD + rewardUSD,
      newBalanceDOGE: userData.balanceDOGE + rewardDOGE,
      nextClaimTime: now + cooldownMs,
    });
  } catch (error: any) {
    console.error('Claim error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expired. Please login again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process claim' },
      { status: 500 }
    );
  }
}
