'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const res = await fetch('/api/auth/logout', { method: 'POST' });

    if (res.ok) {
      router.push('/login');
    } else {
      console.error('Logout failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="bg-gray-100 p-6 rounded-lg shadow-md text-center w-full max-w-sm border border-gray-300">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mb-6">Welcome! You are logged in.</p>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-800 transition"
        >
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}
