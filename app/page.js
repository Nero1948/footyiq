'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const GREEN = '#00e676';
const GREEN_DIM = 'rgba(0,230,118,0.08)';
const GREEN_BORDER = 'rgba(0,230,118,0.2)';

export default function Home() {
  const [leaderboard, setLeaderboard] = useState(null);
  const [yesterday, setYesterday] = useState(null);
  const [email, setEmail] = useState('');
  const [emailState, setEmailState] = useState('idle'); // idle | loading | done | error

  // ── Live stats ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setLeaderboard(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/yesterday')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setYesterday(d))
      .catch(() => {});
  }, []);

  // ── Email signup ───────────────────────────────────────────────────────────

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailState('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setEmailState(res.ok ? 'done' : 'error');
    } catch {
      setEmailState('error');
    }
  }

  const stats = leaderboard?.stats;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0e13] text-white">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#0a0e13]/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-black tracking-tight">FootyIQ</span>
          <Link
            href="/play"
            className="font-bold px-4 py-2 rounded-lg text-sm text-black active:scale-95 transition-transform"
            style={{ background: GREEN }}
          >
            Play Today
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0e13] px-4 pt-20 pb-16 md:pt-28 md:pb-24 text-center">

        {/* Subtle green glow blob behind headline */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(0,230,118,0.07) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-3xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-full px-4 py-1.5 text-sm text-gray-500 mb-10">
            <span>🏉</span>
            <span>New game every day at 7am AEST</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none mb-6">
            Prove you know<br />
            <span style={{ color: GREEN }}>your footy</span>
          </h1>

          {/* Subtext */}
          <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
            6 clues. 1 player. How fast can you crack it?
          </p>

          {/* Primary CTA */}
          <Link
            href="/play"
            className="inline-block font-black text-xl uppercase tracking-widest rounded-2xl px-10 py-5 mb-10 active:scale-95 transition-transform"
            style={{ background: GREEN, color: '#000' }}
          >
            Play Today's Game →
          </Link>

          {/* Live stats row */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 flex-wrap min-h-[20px]">
            {stats ? (
              <>
                {stats.totalAttempts > 0 && (
                  <span>{stats.totalAttempts} {stats.totalAttempts === 1 ? 'player' : 'players'} today</span>
                )}
                {stats.avgClues && stats.totalAttempts > 0 && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span>Average {stats.avgClues} clues</span>
                  </>
                )}
                {stats.oneCluePercent > 0 && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span>{stats.oneCluePercent}% cracked it in 1</span>
                  </>
                )}
                {stats.totalAttempts === 0 && (
                  <span>No scores yet — be the first to play</span>
                )}
              </>
            ) : (
              <span className="animate-pulse">Loading today's stats…</span>
            )}
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="bg-[#070b10] border-y border-gray-800 px-4 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">

          <p className="text-center text-xs font-bold tracking-[0.3em] text-gray-500 uppercase mb-12">
            How it works
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

            <div className="bg-[#0d1117] rounded-2xl border border-gray-800 p-7">
              <div className="text-4xl mb-5">🔍</div>
              <h3 className="font-bold text-lg text-white mb-3">Get a clue</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                A mystery NRL player is revealed one clue at a time. Guess early, score big. Wait too long and everyone beats you to it.
              </p>
            </div>

            <div className="bg-[#0d1117] rounded-2xl border border-gray-800 p-7 relative">
              {/* "Most popular" accent */}
              <div
                className="absolute -top-px left-6 right-6 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)` }}
              />
              <div className="text-4xl mb-5">✏️</div>
              <h3 className="font-bold text-lg text-white mb-3">Make your guess</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Type the player's name. Fewer clues used = higher score. Get it in 1 and you're a legend.
              </p>
            </div>

            <div className="bg-[#0d1117] rounded-2xl border border-gray-800 p-7">
              <div className="text-4xl mb-5">🏆</div>
              <h3 className="font-bold text-lg text-white mb-3">Challenge your mates</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Share your result with coloured squares. The leaderboard is live — see where you rank against every player today.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── YESTERDAY'S ANSWER ───────────────────────────────────────────── */}
      {yesterday && (
        <section className="bg-[#0a0e13] px-4 py-16 md:py-20 text-center">
          <div className="max-w-xl mx-auto">

            <p className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase mb-8">
              Yesterday's game
            </p>

            <p className="text-gray-500 text-lg mb-3">Yesterday's answer was</p>

            <p className="text-5xl md:text-6xl font-black mb-6" style={{ color: GREEN }}>
              {yesterday.answer}
            </p>

            {yesterday.oneCluePercent > 0 ? (
              <p className="text-gray-600">
                Only{' '}
                <span className="text-white font-bold">{yesterday.oneCluePercent}%</span>
                {' '}of players cracked it in 1 clue
              </p>
            ) : yesterday.solvedCount > 0 ? (
              <p className="text-gray-600">
                <span className="text-white font-bold">{yesterday.solvedCount}</span> players solved it
              </p>
            ) : null}

            <div className="mt-8">
              <Link
                href="/play"
                className="inline-block font-bold px-6 py-3 rounded-xl text-sm text-black transition-transform active:scale-95"
                style={{ background: GREEN }}
              >
                Play today's game
              </Link>
            </div>

          </div>
        </section>
      )}

      {/* ── EMAIL SIGNUP ─────────────────────────────────────────────────── */}
      <section className="bg-[#070b10] border-y border-gray-800 px-4 py-16">
        <div className="max-w-md mx-auto text-center">

          <p className="font-black text-2xl mb-2">Don't miss tomorrow's game</p>
          <p className="text-gray-500 text-sm mb-8">Delivered to your inbox at 7am AEST. No spam, ever.</p>

          {emailState === 'done' ? (
            <p className="font-bold text-lg" style={{ color: GREEN }}>
              You're in! See you tomorrow at 7am.
            </p>
          ) : (
            <form onSubmit={handleEmailSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-black border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-700 text-sm focus:outline-none focus:border-gray-600 transition-colors"
              />
              <button
                type="submit"
                disabled={emailState === 'loading'}
                className="font-bold px-5 py-3 rounded-xl text-sm disabled:opacity-50 whitespace-nowrap transition-colors"
                style={{ background: '#111', color: '#fff', border: '1px solid #333' }}
              >
                {emailState === 'loading' ? '…' : 'Notify me'}
              </button>
            </form>
          )}

          {emailState === 'error' && (
            <p className="text-red-400 text-xs mt-3">Something went wrong. Try again.</p>
          )}

        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#0a0e13] px-4 py-10 text-center">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <Link href="/play" className="hover:text-gray-300 transition-colors">Play</Link>
            <Link href="/leaderboard" className="hover:text-gray-300 transition-colors">Leaderboard</Link>
            <Link href="/champion" className="hover:text-gray-300 transition-colors">Champions</Link>
          </div>
          <p className="text-xs text-gray-600">
            Built for NRL fans in Australia and New Zealand · footyiq.au
          </p>
        </div>
      </footer>

    </div>
  );
}
