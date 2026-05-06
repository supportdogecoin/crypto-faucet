import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const link = await adminAuth.generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    // In production, you would send this link via email
    // For now, we'll return it (for development only)
    console.log('Password reset link:', link);

    return NextResponse.json({
      success: true,
      message: 'Password reset link generated',
      // Remove this in production and send email instead
      link: process.env.NODE_ENV === 'development' ? link : undefined,
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate reset link' },
      { status: 500 }
    );
  }
}
