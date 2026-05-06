'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatUSD, formatDOGE } from '@/lib/utils';
import { LogOut, Users, DollarSign, CheckCircle, XCircle, Plus, Code as CodeIcon } from 'lucide-react';

const ADMIN_EMAIL = 'supportdogecoin@gmail.com';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'claims' | 'withdrawals' | 'codes'>('users');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newCodeReward, setNewCodeReward] = useState('0.00001');
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { getClientAuth } = await import('@/lib/firebaseClient');
        const { onAuthStateChanged } = await import('firebase/auth');
        const auth = getClientAuth();
        
        if (!auth) {
          setLoading(false);
          return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (!currentUser) {
            router.push('/auth/login');
          } else if (currentUser.email !== ADMIN_EMAIL) {
            router.push('/dashboard');
          } else {
            setUser(currentUser);
            fetchData();
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, [router, activeTab]);

  const fetchData = async () => {
    try {
      const token = await user?.getIdToken();
      let endpoint = '/api/admin/users';
      
      if (activeTab === 'claims') endpoint = '/api/admin/claims';
      if (activeTab === 'withdrawals') endpoint = '/api/admin/withdrawals';
      if (activeTab === 'codes') endpoint = '/api/admin/codes';

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject') => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ withdrawalId, action }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to process withdrawal:', error);
    }
  };

  const handleCreateCode = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: newCode, rewardUSD: parseFloat(newCodeReward) }),
      });

      if (response.ok) {
        setNewCode('');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create code:', error);
    }
  };

  const handleLogout = async () => {
    const { getClientAuth } = await import('@/lib/firebaseClient');
    const { signOut } = await import('firebase/auth');
    const auth = getClientAuth();
    if (auth) {
      await signOut(auth);
    }
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-crypto-darker flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crypto-darker">
      {/* Header */}
      <header className="border-b border-crypto-gold/20 bg-crypto-dark/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-crypto-gold">🔧 Admin Panel</h1>
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
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => { setActiveTab('users'); setLoading(true); }}
            className={`px-4 py-2 rounded-lg font-bold transition ${
              activeTab === 'users'
                ? 'bg-crypto-gold text-crypto-darker'
                : 'bg-crypto-dark text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users
          </button>
          <button
            onClick={() => { setActiveTab('claims'); setLoading(true); }}
            className={`px-4 py-2 rounded-lg font-bold transition ${
              activeTab === 'claims'
                ? 'bg-crypto-gold text-crypto-darker'
                : 'bg-crypto-dark text-gray-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            Claims
          </button>
          <button
            onClick={() => { setActiveTab('withdrawals'); setLoading(true); }}
            className={`px-4 py-2 rounded-lg font-bold transition ${
              activeTab === 'withdrawals'
                ? 'bg-crypto-gold text-crypto-darker'
                : 'bg-crypto-dark text-gray-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            Withdrawals
          </button>
          <button
            onClick={() => { setActiveTab('codes'); setLoading(true); }}
            className={`px-4 py-2 rounded-lg font-bold transition ${
              activeTab === 'codes'
                ? 'bg-crypto-gold text-crypto-darker'
                : 'bg-crypto-dark text-gray-400 hover:text-white'
            }`}
          >
            <CodeIcon className="w-4 h-4 inline mr-2" />
            Codes
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
            <h2 className="text-xl font-bold text-white mb-4">Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="pb-4">Email</th>
                    <th className="pb-4">Balance (USD)</th>
                    <th className="pb-4">Balance (DOGE)</th>
                    <th className="pb-4">Streak</th>
                    <th className="pb-4">Total Claims</th>
                    <th className="pb-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.users?.map((u: any, i: number) => (
                    <tr key={i} className="border-t border-crypto-gold/10">
                      <td className="py-4 text-white">{u.email}</td>
                      <td className="py-4 text-crypto-success">{formatUSD(u.balanceUSD)}</td>
                      <td className="py-4 text-crypto-success">{formatDOGE(u.balanceDOGE)}</td>
                      <td className="py-4 text-white">{u.streakDays} days</td>
                      <td className="py-4 text-white">{u.totalClaims}</td>
                      <td className="py-4 text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Claims Tab */}
        {activeTab === 'claims' && (
          <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
            <h2 className="text-xl font-bold text-white mb-4">Claims</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="pb-4">User ID</th>
                    <th className="pb-4">Type</th>
                    <th className="pb-4">Amount (USD)</th>
                    <th className="pb-4">Amount (DOGE)</th>
                    <th className="pb-4">Timestamp</th>
                    <th className="pb-4">IP Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.claims?.map((c: any, i: number) => (
                    <tr key={i} className="border-t border-crypto-gold/10">
                      <td className="py-4 text-white text-sm">{c.userId}</td>
                      <td className="py-4 text-white capitalize">{c.type.replace('_', ' ')}</td>
                      <td className="py-4 text-crypto-success">{formatUSD(c.amountUSD)}</td>
                      <td className="py-4 text-crypto-success">{formatDOGE(c.amountDOGE)}</td>
                      <td className="py-4 text-gray-400">
                        {new Date(c.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 text-gray-400 text-sm">{c.ipHash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
            <h2 className="text-xl font-bold text-white mb-4">Withdrawals</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="pb-4">User</th>
                    <th className="pb-4">Amount (USD)</th>
                    <th className="pb-4">Amount (DOGE)</th>
                    <th className="pb-4">Address</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Requested</th>
                    <th className="pb-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.withdrawals?.map((w: any, i: number) => (
                    <tr key={i} className="border-t border-crypto-gold/10">
                      <td className="py-4 text-white">{w.userEmail}</td>
                      <td className="py-4 text-crypto-success">{formatUSD(w.amountUSD)}</td>
                      <td className="py-4 text-crypto-success">{formatDOGE(w.amountDOGE)}</td>
                      <td className="py-4 text-white text-sm">{w.dogeAddress}</td>
                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            w.status === 'approved'
                              ? 'bg-crypto-success/20 text-crypto-success'
                              : w.status === 'rejected'
                              ? 'bg-crypto-danger/20 text-crypto-danger'
                              : 'bg-crypto-warning/20 text-crypto-warning'
                          }`}
                        >
                          {w.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">
                        {new Date(w.requestedAt).toLocaleString()}
                      </td>
                      <td className="py-4">
                        {w.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleWithdrawalAction(w.id, 'approve')}
                              className="p-2 bg-crypto-success/20 text-crypto-success rounded hover:bg-crypto-success/30"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleWithdrawalAction(w.id, 'reject')}
                              className="p-2 bg-crypto-danger/20 text-crypto-danger rounded hover:bg-crypto-danger/30"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Codes Tab */}
        {activeTab === 'codes' && (
          <div className="space-y-6">
            <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
              <h2 className="text-xl font-bold text-white mb-4">Create New Code</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Code"
                  className="flex-1 px-4 py-3 bg-crypto-darker border border-crypto-gold/20 rounded-lg text-white focus:outline-none focus:border-crypto-gold"
                />
                <input
                  type="number"
                  value={newCodeReward}
                  onChange={(e) => setNewCodeReward(e.target.value)}
                  placeholder="Reward (USD)"
                  step="0.00001"
                  className="w-40 px-4 py-3 bg-crypto-darker border border-crypto-gold/20 rounded-lg text-white focus:outline-none focus:border-crypto-gold"
                />
                <button
                  onClick={handleCreateCode}
                  className="px-6 py-3 bg-crypto-gold text-crypto-darker rounded-lg font-bold hover:bg-crypto-accent transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </button>
              </div>
            </div>

            <div className="bg-crypto-dark p-6 rounded-xl border border-crypto-gold/20">
              <h2 className="text-xl font-bold text-white mb-4">Existing Codes</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400">
                      <th className="pb-4">Code</th>
                      <th className="pb-4">Reward (USD)</th>
                      <th className="pb-4">Reward (DOGE)</th>
                      <th className="pb-4">Uses</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.codes?.map((c: any, i: number) => (
                      <tr key={i} className="border-t border-crypto-gold/10">
                        <td className="py-4 text-white font-bold">{c.code}</td>
                        <td className="py-4 text-crypto-success">{formatUSD(c.rewardUSD)}</td>
                        <td className="py-4 text-crypto-success">{formatDOGE(c.rewardDOGE)}</td>
                        <td className="py-4 text-white">
                          {c.currentUses}{c.maxUses ? `/${c.maxUses}` : ''}
                        </td>
                        <td className="py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${
                              c.isActive
                                ? 'bg-crypto-success/20 text-crypto-success'
                                : 'bg-crypto-danger/20 text-crypto-danger'
                            }`}
                          >
                            {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-4 text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
