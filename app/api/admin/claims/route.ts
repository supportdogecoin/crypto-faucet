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

    const claimsSnapshot = await adminDb.collection('claims').orderBy('timestamp', 'desc').limit(100).get();
    const claims = claimsSnapshot.docs.map(doc => doc.data());

    return NextResponse.json({ claims });
  } catch (error: any) {
    console.error('Get claims error:', error);
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 });
  }
}
