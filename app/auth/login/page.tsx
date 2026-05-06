'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-crypto-darker flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-crypto-dark p-8 rounded-xl border border-crypto-gold/20">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome Back</h1>
        <p className="text-gray-400 text-center mb-8">Login to your Crypto Faucet account</p>

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
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-crypto-gold text-crypto-darker rounded-lg font-bold hover:bg-crypto-accent transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/forgot-password" className="text-crypto-accent hover:text-crypto-gold">
            Forgot password?
          </Link>
        </div>

        <div className="mt-4 text-center text-gray-400">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-crypto-accent hover:text-crypto-gold">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
