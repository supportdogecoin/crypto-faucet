'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reset link');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-crypto-darker flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-crypto-dark p-8 rounded-xl border border-crypto-gold/20 text-center">
          <h1 className="text-3xl font-bold text-crypto-success mb-4">Check Your Email</h1>
          <p className="text-gray-400 mb-6">
            We've sent a password reset link to your email address. Please check your inbox.
          </p>
          <Link href="/auth/login" className="text-crypto-accent hover:text-crypto-gold">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crypto-darker flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-crypto-dark p-8 rounded-xl border border-crypto-gold/20">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Reset Password</h1>
        <p className="text-gray-400 text-center mb-8">Enter your email to receive a reset link</p>

        {error && (
          <div className="bg-crypto-danger/10 border border-crypto-danger text-crypto-danger px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-crypto-darker border border-crypto-gold/20 rounded-lg text-white focus:outline-none focus:border-crypto-gold"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-crypto-gold text-crypto-darker rounded-lg font-bold hover:bg-crypto-accent transition disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-crypto-accent hover:text-crypto-gold">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
