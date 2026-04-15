'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/champion', label: 'Champions' },
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
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight text-white">
          FootyIQ
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'text-white bg-white/8'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}

          <Link
            href="/play"
            className="ml-2 px-4 py-2 rounded-lg text-sm font-bold text-black active:scale-95 transition-transform"
            style={{ background: '#00e676' }}
          >
            Play
          </Link>
        </div>
      </div>
    </nav>
  );
}
