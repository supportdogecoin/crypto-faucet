'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Clock, CheckCircle } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-crypto-darker">
      {/* Header */}
      <header className="border-b border-crypto-gold/20 bg-crypto-dark/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-crypto-gold">DogeCoin Faucet</h1>
          <div className="flex gap-4">
            <Link href="/auth/login" className="px-4 py-2 text-crypto-accent hover:text-crypto-gold transition">
              Login
            </Link>
            <Link href="/auth/signup" className="px-4 py-2 bg-crypto-gold text-crypto-darker rounded-lg hover:bg-crypto-accent transition">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-white mb-6">
            Claim Free <span className="text-crypto-gold">Dogecoin</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Get $0.0001 in DOGE every 10 minutes with daily bonuses and special promo codes
          </p>
          <Link href="/auth/signup" className="inline-block px-8 py-4 bg-crypto-gold text-crypto-darker rounded-lg font-bold text-lg hover:bg-crypto-accent transition">
            Start Earning Now
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
            <Clock className="w-12 h-12 text-crypto-gold mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">10 Minute Claims</h3>
            <p className="text-gray-400">Claim rewards every 10 minutes with no waiting periods</p>
          </div>
          <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
            <CheckCircle className="w-12 h-12 text-crypto-gold mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Daily Bonuses</h3>
            <p className="text-gray-400">Earn increasing rewards with consecutive daily claims</p>
          </div>
          <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
            <Shield className="w-12 h-12 text-crypto-gold mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Secure System</h3>
            <p className="text-gray-400">Protected with anti-abuse measures and manual withdrawal review</p>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-16 bg-crypto-dark p-8 rounded-xl border border-crypto-gold/20">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Why Trust Us?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-crypto-success mt-1" />
              <div>
                <h4 className="text-white font-semibold">Secure System</h4>
                <p className="text-gray-400 text-sm">All transactions protected with server-side validation</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-crypto-success mt-1" />
              <div>
                <h4 className="text-white font-semibold">Manual Withdrawal Review</h4>
                <p className="text-gray-400 text-sm">Every withdrawal reviewed for security</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-crypto-success mt-1" />
              <div>
                <h4 className="text-white font-semibold">Anti-Abuse Protected</h4>
                <p className="text-gray-400 text-sm">Advanced protection against fraud and abuse</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-crypto-success mt-1" />
              <div>
                <h4 className="text-white font-semibold">Transparent Operations</h4>
                <p className="text-gray-400 text-sm">Clear rules and instant transaction tracking</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h3>
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-crypto-gold text-crypto-darker rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="text-white font-semibold">Create Account</h4>
                  <p className="text-gray-400 text-sm">Sign up with your email address</p>
                </div>
              </div>
            </div>
            <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-crypto-gold text-crypto-darker rounded-full flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="text-white font-semibold">Claim Rewards</h4>
                  <p className="text-gray-400 text-sm">Click claim every 10 minutes to earn DOGE</p>
                </div>
              </div>
            </div>
            <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-crypto-gold text-crypto-darker rounded-full flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="text-white font-semibold">Withdraw Earnings</h4>
                  <p className="text-gray-400 text-sm">Request withdrawal when you reach $0.5 minimum</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-crypto-gold/20 bg-crypto-dark/50 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>&copy; 2024 DogeCoin Faucet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
