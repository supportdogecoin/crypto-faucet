import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Note: Firebase Admin SDK doesn't have a direct login method
    // This endpoint validates credentials and returns user info
    // The actual auth token should be obtained on the client side
    // using Firebase Client SDK
    
    // For now, we'll just verify the user exists
    try {
      const user = await adminAuth.getUserByEmail(email);
      return NextResponse.json({
        success: true,
        message: 'User exists. Proceed with client-side authentication.',
        uid: user.uid,
      });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
