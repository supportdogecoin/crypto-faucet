'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { formatUSD, formatDOGE, getTimeRemaining } from '@/lib/utils';
import { Clock, DollarSign, TrendingUp, LogOut, Gift, Code, Wallet } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claimLoading, setClaimLoading] = useState(false);
  const [dailyBonusLoading, setDailyBonusLoading] = useState(false);
  const [code, setCode] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/auth/login');
      } else {
        setUser(currentUser);
        fetchUserData();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUserData = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/user/data', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setClaimLoading(true);
    setMessage('');

    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Claimed ${formatUSD(data.rewardUSD)}!`);
        fetchUserData();
      } else {
        setMessage(data.error || 'Claim failed');
      }
    } catch (error) {
      setMessage('Claim failed');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleDailyBonus = async () => {
    setDailyBonusLoading(true);
    setMessage('');

    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/daily-bonus', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Daily bonus claimed! Streak: ${data.streakDays} days`);
        fetchUserData();
      } else {
        setMessage(data.error || 'Bonus claim failed');
      }
    } catch (error) {
      setMessage('Bonus claim failed');
    } finally {
      setDailyBonusLoading(false);
    }
  };

  const handleRedeemCode = async () => {
    setMessage('');

    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/codes/redeem', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Code redeemed! +${formatUSD(data.rewardUSD)}`);
        setCode('');
        fetchUserData();
      } else {
        setMessage(data.error || 'Code redemption failed');
      }
    } catch (error) {
      setMessage('Code redemption failed');
    }
  };

  const handleWithdraw = async () => {
    setMessage('');

    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dogeAddress: withdrawAddress }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Withdrawal request submitted!');
        setWithdrawAddress('');
        fetchUserData();
      } else {
        setMessage(data.error || 'Withdrawal failed');
      }
    } catch (error) {
      setMessage('Withdrawal failed');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-crypto-darker flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const claimTimeRemaining = userData?.user?.lastClaim
    ? getTimeRemaining(userData.user.lastClaim + 10 * 60 * 1000)
    : null;

  const dailyBonusTimeRemaining = userData?.user?.lastDailyClaim
    ? getTimeRemaining(userData.user.lastDailyClaim + 24 * 60 * 60 * 1000)
    : null;

  return (
    <div className="min-h-screen bg-crypto-darker">
      {/* Header */}
      <header className="border-b border-crypto-gold/20 bg-crypto-dark/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-crypto-gold">🐕 Crypto Faucet</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-crypto-accent hover:text-crypto-gold transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {message && (
          <div className="bg-crypto-accent/10 border border-crypto-accent text-crypto-accent px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        {/* Balance Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-1">Balance (USD)</p>
                <p className="text-3xl font-bold text-white">
                  {formatUSD(userData?.user?.balanceUSD || 0)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-crypto-gold" />
            </div>
          </div>
          <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-1">Balance (DOGE)</p>
                <p className="text-3xl font-bold text-white">
                  {formatDOGE(userData?.user?.balanceDOGE || 0)}
                </p>
              </div>
              <Wallet className="w-12 h-12 text-crypto-gold" />
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Claim */}
          <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-crypto-gold" />
              Claim Reward
            </h3>
            <p className="text-gray-400 mb-4">Get $0.0001 every 10 minutes</p>
            {claimTimeRemaining && !claimTimeRemaining.isExpired ? (
              <div className="text-center py-4">
                <Clock className="w-8 h-8 text-crypto-warning mx-auto mb-2" />
                <p className="text-crypto-warning font-bold">
                  {claimTimeRemaining.minutes}:{claimTimeRemaining.seconds.toString().padStart(2, '0')}
                </p>
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={claimLoading}
                className="w-full py-3 bg-crypto-gold text-crypto-darker rounded-lg font-bold hover:bg-crypto-accent transition disabled:opacity-50"
              >
                {claimLoading ? 'Claiming...' : 'Claim Now'}
              </button>
            )}
          </div>

          {/* Daily Bonus */}
          <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-crypto-gold" />
              Daily Bonus
            </h3>
            <p className="text-gray-400 mb-2">Streak: {userData?.user?.streakDays || 0} days</p>
            <p className="text-gray-400 mb-4">Claim once every 24 hours</p>
            {dailyBonusTimeRemaining && !dailyBonusTimeRemaining.isExpired ? (
              <div className="text-center py-4">
                <Clock className="w-8 h-8 text-crypto-warning mx-auto mb-2" />
                <p className="text-crypto-warning font-bold">
                  {dailyBonusTimeRemaining.hours}h {dailyBonusTimeRemaining.minutes}m
                </p>
              </div>
            ) : (
              <button
                onClick={handleDailyBonus}
                disabled={dailyBonusLoading}
                className="w-full py-3 bg-crypto-gold text-crypto-darker rounded-lg font-bold hover:bg-crypto-accent transition disabled:opacity-50"
              >
                {dailyBonusLoading ? 'Claiming...' : 'Claim Bonus'}
              </button>
            )}
          </div>

          {/* Redeem Code */}
          <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-crypto-gold" />
              Promo Code
            </h3>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              className="w-full px-4 py-3 bg-crypto-darker border border-crypto-gold/20 rounded-lg text-white focus:outline-none focus:border-crypto-gold mb-4"
            />
            <button
              onClick={handleRedeemCode}
              className="w-full py-3 bg-crypto-gold text-crypto-darker rounded-lg font-bold hover:bg-crypto-accent transition"
            >
              Redeem
            </button>
          </div>
        </div>

        {/* Withdrawal */}
        <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20 mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-crypto-gold" />
            Withdraw
          </h3>
          <p className="text-gray-400 mb-4">Minimum withdrawal: $0.5</p>
          <input
            type="text"
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
            placeholder="DOGE Wallet Address (starts with D)"
            className="w-full px-4 py-3 bg-crypto-darker border border-crypto-gold/20 rounded-lg text-white focus:outline-none focus:border-crypto-gold mb-4"
          />
          <button
            onClick={handleWithdraw}
            disabled={(userData?.user?.balanceUSD || 0) < 0.5}
            className="w-full py-3 bg-crypto-gold text-crypto-darker rounded-lg font-bold hover:bg-crypto-accent transition disabled:opacity-50"
          >
            Request Withdrawal
          </button>
          <p className="text-gray-400 text-sm mt-4 text-center">
            Withdrawals may take up to 1 hour to be processed for security reasons.
          </p>
        </div>

        {/* Transaction History */}
        <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-crypto-gold" />
            Recent Transactions
          </h3>
          {userData?.claims && userData.claims.length > 0 ? (
            <div className="space-y-3">
              {userData.claims.map((claim: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-crypto-gold/10">
                  <div>
                    <p className="text-white capitalize">{claim.type.replace('_', ' ')}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(claim.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-crypto-success font-bold">+{formatUSD(claim.amountUSD)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No transactions yet</p>
          )}
        </div>

        {/* Withdrawals History */}
        {userData?.withdrawals && userData.withdrawals.length > 0 && (
          <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20 mt-8">
            <h3 className="text-xl font-bold text-white mb-4">Withdrawal History</h3>
            <div className="space-y-3">
              {userData.withdrawals.map((withdrawal: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-crypto-gold/10">
                  <div>
                    <p className="text-white">{formatUSD(withdrawal.amountUSD)}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(withdrawal.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      withdrawal.status === 'approved'
                        ? 'bg-crypto-success/20 text-crypto-success'
                        : withdrawal.status === 'rejected'
                        ? 'bg-crypto-danger/20 text-crypto-danger'
                        : 'bg-crypto-warning/20 text-crypto-warning'
                    }`}
                  >
                    {withdrawal.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
