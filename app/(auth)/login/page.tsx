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

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다.'); return; }
      router.push('/dashboard');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--background)">
      <div className="w-full max-w-sm rounded-2xl bg-(--surface) border border-(--border) p-8 animate-fade-up">
        <div className="mb-8">
          <p className="text-xs text-[#4b9eff] font-medium mb-2 tracking-widest uppercase">MockStock</p>
          <h1 className="text-2xl font-bold text-(--text-strong)">
            {isRegister ? '회원가입' : '로그인'}
          </h1>
          <p className="text-sm text-(--text-muted) mt-1">
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
              className="rounded-xl bg-(--surface-2) border border-(--border) px-4 py-3 text-sm text-(--text-strong) placeholder-(--text-subtle) outline-none focus:border-[#4b9eff] transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl bg-(--surface-2) border border-(--border) px-4 py-3 text-sm text-(--text-strong) placeholder-(--text-subtle) outline-none focus:border-[#4b9eff] transition-colors"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-xl bg-(--surface-2) border border-(--border) px-4 py-3 text-sm text-(--text-strong) placeholder-(--text-subtle) outline-none focus:border-[#4b9eff] transition-colors"
          />

          {error && <p className="text-xs text-[#ff4b4b] px-1">{error}</p>}

          <button
            type="submit"
            className="mt-2 rounded-xl bg-[#4b9eff] py-3 text-sm font-semibold text-white hover:bg-[#3a8ef0] transition-colors btn-press"
          >
            {isRegister ? '가입하기' : '로그인'}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="mt-5 w-full text-center text-sm text-(--text-subtle) hover:text-(--text-muted) transition-colors"
        >
          {isRegister ? '이미 계정이 있어요 → 로그인' : '계정이 없어요 → 회원가입'}
        </button>
      </div>
    </div>
  );
}
