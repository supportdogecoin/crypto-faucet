import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { hashIP, usdToDOGE } from '@/lib/utils';
import { FAUCET_CONFIG } from '@/lib/constants';
import { validateDogeAddress } from '@/lib/paymentService';
import { logSecurityEvent } from '@/lib/security';

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

    const { dogeAddress } = await request.json();

    if (!dogeAddress) {
      return NextResponse.json(
        { error: 'DOGE address is required' },
        { status: 400 }
      );
    }

    // Validate DOGE address format
    if (!validateDogeAddress(dogeAddress)) {
      return NextResponse.json(
        { error: 'Invalid DOGE address format' },
        { status: 400 }
      );
    }

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

    // Check minimum withdrawal
    if ((userData?.balanceUSD || 0) < FAUCET_CONFIG.MIN_WITHDRAWAL_USD) {
      return NextResponse.json(
        { error: `Minimum withdrawal is $${FAUCET_CONFIG.MIN_WITHDRAWAL_USD}` },
        { status: 400 }
      );
    }

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const ipHash = hashIP(ip);

    // Calculate withdrawal amount
    const withdrawalUSD = userData?.balanceUSD || 0;
    const withdrawalDOGE = userData?.balanceDOGE || 0;

    // Create withdrawal request
    const withdrawalRef = await adminDb.collection('withdrawals').add({
      id: '', // Will be set by the ref
      userId,
      userEmail: userData?.email || '',
      amountUSD: withdrawalUSD,
      amountDOGE: withdrawalDOGE,
      dogeAddress,
      status: 'pending',
      requestedAt: Date.now(),
    });

    // Update withdrawal ID
    await withdrawalRef.update({ id: withdrawalRef.id });

    // Reset user balance
    await adminDb.collection('users').doc(userId).update({
      balanceUSD: 0,
      balanceDOGE: 0,
      updatedAt: Date.now(),
    });

    // Log security event
    await logSecurityEvent(
      userId,
      'WITHDRAWAL_REQUESTED',
      `Withdrawal of ${withdrawalUSD} USD to ${dogeAddress}`,
      ipHash,
      false
    );

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted',
      withdrawalId: withdrawalRef.id,
      amountUSD: withdrawalUSD,
      amountDOGE: withdrawalDOGE,
      estimatedProcessingTime: 'up to 1 hour',
    });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expired. Please login again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process withdrawal request' },
      { status: 500 }
    );
  }
}
