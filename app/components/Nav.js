'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/leaderboard', label: 'Leaderboard', shortLabel: 'Board' },
    { href: '/champion', label: 'Champions', shortLabel: 'Champs' },
  ];

  return (
    <nav
      className="sticky top-0 z-50 border-b px-4 py-3"
      style={{
        background: 'rgba(10,14,19,0.96)',
        backdropFilter: 'blur(10px)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        <Link href="/" className="shrink-0 text-lg min-[380px]:text-xl font-black tracking-tight text-white hover:text-[#00e676] transition-colors">
          Set For Six
        </Link>

        <div className="flex min-w-0 items-center gap-0.5 min-[380px]:gap-1">
          <Link
            href="/play"
            className={`px-3 py-2 min-[380px]:px-4 rounded-lg text-sm font-bold active:scale-95 transition-all ${
              pathname === '/play'
                ? 'text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={pathname === '/play' ? { background: '#00e676' } : {}}
          >
            Play
          </Link>

          {navLinks.map(({ href, label, shortLabel }) => (
            <Link
              key={href}
              href={href}
              className={`px-2 py-1.5 min-[380px]:px-3 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="min-[430px]:hidden">{shortLabel}</span>
              <span className="hidden min-[430px]:inline">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
