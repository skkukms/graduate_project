'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const url = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { email, password, name } : { email, password };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-zinc-200">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">
          {isRegister ? '회원가입' : '로그인'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-600"
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-600"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-600"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className="rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            {isRegister ? '가입하기' : '로그인'}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-800"
        >
          {isRegister ? '이미 계정이 있어요 → 로그인' : '계정이 없어요 → 회원가입'}
        </button>
      </div>
    </div>
  );
}
