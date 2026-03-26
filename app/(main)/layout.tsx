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
    <div className="min-h-screen bg-(--background)">
      <nav className="bg-(--surface) border-b border-(--border) px-8 py-0 flex items-center justify-between h-14 sticky top-0 z-50">
        <div className="flex items-center gap-1">
          <span className="font-bold text-(--text-strong) text-base mr-6 tracking-tight">MockStock</span>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-(--border) text-(--text-strong)'
                  : 'text-(--text-muted) hover:text-(--text-strong) hover:bg-(--surface-2)'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-(--text-subtle) hover:text-[#ff4b4b] border border-(--border) hover:border-[#ff4b4b]/30 px-3 py-1.5 rounded-lg transition-colors"
        >
          로그아웃
        </button>
      </nav>
      <main>{children}</main>
    </div>
  );
}
