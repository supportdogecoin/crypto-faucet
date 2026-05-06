import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Get user's transaction history
    const claimsSnapshot = await adminDb
      .collection('claims')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const claims = claimsSnapshot.docs.map(doc => doc.data());

    // Get user's withdrawals
    const withdrawalsSnapshot = await adminDb
      .collection('withdrawals')
      .where('userId', '==', userId)
      .orderBy('requestedAt', 'desc')
      .limit(10)
      .get();

    const withdrawals = withdrawalsSnapshot.docs.map(doc => doc.data());

    return NextResponse.json({
      user: userData,
      claims,
      withdrawals,
    });
  } catch (error: any) {
    console.error('Get user data error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token expired. Please login again.' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}
