'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const navItems = [
    { href: '/dashboard', label: '대시보드' },
    { href: '/chart', label: '차트' },
  ];

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <nav className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-8 py-0 flex items-center justify-between h-14 sticky top-0 z-50">
        <div className="flex items-center gap-1">
          <span className="font-bold text-[#f0f0f0] text-base mr-6 tracking-tight">MockStock</span>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-[#2a2a2a] text-[#f0f0f0]'
                  : 'text-[#888888] hover:text-[#f0f0f0] hover:bg-[#222222]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-[#555555] hover:text-[#888888] px-3 py-1.5 rounded-lg hover:bg-[#222222] transition-colors"
        >
          로그아웃
        </button>
      </nav>
      <main>{children}</main>
    </div>
  );
}
