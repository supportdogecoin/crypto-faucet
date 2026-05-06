'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore via API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create account');
      }

      router.push('/dashboard');
    } catch (err: any) {
      // Handle Firebase Auth errors
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already registered. Please login or use a different email.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-crypto-darker flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-crypto-dark p-8 rounded-xl border border-crypto-gold/20">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Create Account</h1>
        <p className="text-gray-400 text-center mb-8">Start earning free Dogecoin today</p>

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

          <div>
            <label className="block text-white mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-crypto-darker border border-crypto-gold/20 rounded-lg text-white focus:outline-none focus:border-crypto-gold"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-white mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-crypto-darker border border-crypto-gold/20 rounded-lg text-white focus:outline-none focus:border-crypto-gold"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-crypto-gold text-crypto-darker rounded-lg font-bold hover:bg-crypto-accent transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-crypto-accent hover:text-crypto-gold">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
