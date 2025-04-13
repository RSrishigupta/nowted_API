'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';

    const res = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Something went wrong');
    } else {
      router.push('/dashboard'); // Redirect to home or dashboard
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 border p-6 rounded-xl shadow-lg">
      <h1 className="text-2xl font-semibold mb-4 text-center">
        {mode === 'login' ? 'Login' : 'Sign Up'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          {mode === 'login' ? 'Login' : 'Sign Up'}
        </button>
      </form>
      <p className="text-center mt-4 text-sm text-gray-600">
        {mode === 'login' ? 'Don’t have an account?' : 'Already have an account?'}{' '}
        <button
          className="text-blue-600 underline"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login' ? 'Sign up' : 'Login'}
        </button>
      </p>
    </div>
  );
}
