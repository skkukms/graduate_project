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
    if (!res.ok) { setError(data.error); return; }
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e]">
      <div className="w-full max-w-sm rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] p-8">
        <div className="mb-8">
          <p className="text-xs text-[#4b9eff] font-medium mb-2 tracking-widest uppercase">MockStock</p>
          <h1 className="text-2xl font-bold text-[#f0f0f0]">
            {isRegister ? '회원가입' : '로그인'}
          </h1>
          <p className="text-sm text-[#888888] mt-1">
            {isRegister ? '계정을 만들어 모의투자를 시작하세요' : '계속하려면 로그인하세요'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isRegister && (
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-[#222222] border border-[#2a2a2a] px-4 py-3 text-sm text-[#f0f0f0] placeholder-[#555555] outline-none focus:border-[#4b9eff] transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl bg-[#222222] border border-[#2a2a2a] px-4 py-3 text-sm text-[#f0f0f0] placeholder-[#555555] outline-none focus:border-[#4b9eff] transition-colors"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-xl bg-[#222222] border border-[#2a2a2a] px-4 py-3 text-sm text-[#f0f0f0] placeholder-[#555555] outline-none focus:border-[#4b9eff] transition-colors"
          />

          {error && <p className="text-xs text-[#ff4b4b] px-1">{error}</p>}

          <button
            type="submit"
            className="mt-2 rounded-xl bg-[#4b9eff] py-3 text-sm font-semibold text-white hover:bg-[#3a8ef0] transition-colors"
          >
            {isRegister ? '가입하기' : '로그인'}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="mt-5 w-full text-center text-sm text-[#555555] hover:text-[#888888] transition-colors"
        >
          {isRegister ? '이미 계정이 있어요 → 로그인' : '계정이 없어요 → 회원가입'}
        </button>
      </div>
    </div>
  );
}
