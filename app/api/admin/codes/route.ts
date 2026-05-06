import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FAUCET_CONFIG } from '@/lib/constants';
import { usdToDOGE } from '@/lib/utils';

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

    const codesSnapshot = await adminDb.collection('dailyCodes').orderBy('createdAt', 'desc').limit(50).get();
    const codes = codesSnapshot.docs.map(doc => doc.data());

    return NextResponse.json({ codes });
  } catch (error: any) {
    console.error('Get codes error:', error);
    return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 });
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

    const { code, rewardUSD, maxUses, expiresAt } = await request.json();

    if (!code || !rewardUSD) {
      return NextResponse.json({ error: 'Code and reward are required' }, { status: 400 });
    }

    const rewardDOGE = usdToDOGE(rewardUSD, FAUCET_CONFIG.DOGE_USD_RATE);

    const codeRef = await adminDb.collection('dailyCodes').add({
      id: '',
      code,
      rewardUSD,
      rewardDOGE,
      isActive: true,
      createdAt: Date.now(),
      expiresAt: expiresAt || null,
      maxUses: maxUses || null,
      currentUses: 0,
    });

    await codeRef.update({ id: codeRef.id });

    return NextResponse.json({ success: true, codeId: codeRef.id });
  } catch (error: any) {
    console.error('Create code error:', error);
    return NextResponse.json({ error: 'Failed to create code' }, { status: 500 });
  }
}
