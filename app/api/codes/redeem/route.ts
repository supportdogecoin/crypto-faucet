import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { hashIP, usdToDOGE } from '@/lib/utils';
import { FAUCET_CONFIG } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Get user data
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const ipHash = hashIP(ip);

    // Find the code
    const codeQuery = await adminDb
      .collection('dailyCodes')
      .where('code', '==', code)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (codeQuery.empty) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    const codeDoc = codeQuery.docs[0];
    const codeData = codeDoc.data();

    // Check if code is expired
    if (codeData.expiresAt && codeData.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'Code has expired' }, { status: 400 });
    }

    // Check if code has reached max uses
    if (codeData.maxUses && codeData.currentUses >= codeData.maxUses) {
      return NextResponse.json({ error: 'Code has reached maximum uses' }, { status: 400 });
    }

    // Check if user already redeemed this code today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const redemptionQuery = await adminDb
      .collection('codeRedemptions')
      .where('userId', '==', userId)
      .where('codeId', '==', codeDoc.id)
      .where('redeemedAt', '>=', todayTimestamp)
      .limit(1)
      .get();

    if (!redemptionQuery.empty) {
      return NextResponse.json({ error: 'Code already redeemed today' }, { status: 400 });
    }

    // Update user balance
    await adminDb.collection('users').doc(userId).update({
      balanceUSD: (userData?.balanceUSD || 0) + codeData.rewardUSD,
      balanceDOGE: (userData?.balanceDOGE || 0) + codeData.rewardDOGE,
      updatedAt: Date.now(),
    });

    // Log redemption
    await adminDb.collection('codeRedemptions').add({
      id: '',
      userId,
      codeId: codeDoc.id,
      code: codeData.code,
      rewardUSD: codeData.rewardUSD,
      rewardDOGE: codeData.rewardDOGE,
      redeemedAt: Date.now(),
      ipHash,
    });

    // Update code usage
    await adminDb.collection('dailyCodes').doc(codeDoc.id).update({
      currentUses: codeData.currentUses + 1,
    });

    // Log claim
    await adminDb.collection('claims').add({
      userId,
      amountUSD: codeData.rewardUSD,
      amountDOGE: codeData.rewardDOGE,
      timestamp: Date.now(),
      ipHash,
      type: 'code',
      codeId: codeDoc.id,
    });

    return NextResponse.json({
      success: true,
      rewardUSD: codeData.rewardUSD,
      rewardDOGE: codeData.rewardDOGE,
      newBalanceUSD: (userData?.balanceUSD || 0) + codeData.rewardUSD,
      newBalanceDOGE: (userData?.balanceDOGE || 0) + codeData.rewardDOGE,
    });
  } catch (error: any) {
    console.error('Redeem code error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token expired. Please login again.' }, { status: 401 });
    }

    return NextResponse.json({ error: error.message || 'Failed to redeem code' }, { status: 500 });
  }
}
