import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FAUCET_CONFIG } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);

    // Verify admin email
    if (decoded.email !== FAUCET_CONFIG.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const withdrawalsSnapshot = await adminDb.collection('withdrawals').orderBy('requestedAt', 'desc').limit(100).get();
    const withdrawals = withdrawalsSnapshot.docs.map(doc => doc.data());

    return NextResponse.json({ withdrawals });
  } catch (error: any) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);

    // Verify admin email
    if (decoded.email !== FAUCET_CONFIG.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { withdrawalId, action, rejectionReason } = await request.json();

    if (!withdrawalId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const withdrawalRef = adminDb.collection('withdrawals').doc(withdrawalId);
    const withdrawalDoc = await withdrawalRef.get();

    if (!withdrawalDoc.exists) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    const withdrawalData = withdrawalDoc.data();

    if (!withdrawalData || withdrawalData.status !== 'pending') {
      return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 });
    }

    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      processedAt: Date.now(),
      processedBy: decoded.email,
    };

    if (action === 'reject' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await withdrawalRef.update(updateData);

    // If rejected, refund the user's balance
    if (action === 'reject') {
      await adminDb.collection('users').doc(withdrawalData.userId).update({
        balanceUSD: withdrawalData.amountUSD,
        balanceDOGE: withdrawalData.amountDOGE,
        updatedAt: Date.now(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Process withdrawal error:', error);
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
  }
}
