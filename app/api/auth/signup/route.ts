import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { hashIP } from '@/lib/utils';
import { FAUCET_CONFIG } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists in Firebase Auth
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      if (userRecord) {
        return NextResponse.json(
          { error: 'Email already registered. Please login or use a different email.' },
          { status: 400 }
        );
      }
    } catch (error) {
      // User doesn't exist in Auth, proceed with creation
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
    });

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const ipHash = hashIP(ip);

    // Create user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      balanceUSD: 0,
      balanceDOGE: 0,
      streakDays: 0,
      lastDailyClaim: null,
      totalDailyEarned: 0,
      lastClaim: null,
      totalClaims: 0,
      ipHash,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { error: 'Email already registered. Please login or use a different email.' },
        { status: 400 }
      );
    } else if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password is too weak. Please use at least 6 characters.' },
        { status: 400 }
      );
    } else if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: error.message || 'Failed to create account' },
        { status: 500 }
      );
    }
  }
}
