'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Nav from './components/Nav';

const GREEN = '#00e676';

// ── Deterministic floating particles (no Math.random — avoids hydration issues) ──
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left:     `${((i * 43 + 11) % 88) + 6}%`,
  bottom:   `${((i * 29 + 7)  % 55) + 8}%`,
  size:     `${2 + (i % 4)}px`,
  color:    i % 3 === 0 ? '#00e676' : 'rgba(255,255,255,0.85)',
  opacity:  0.10 + (i % 5) * 0.03,
  duration: `${9 + (i % 7) * 1.8}s`,
  delay:    `${-((i * 3.7) % 14)}s`, // negative = start mid-animation → staggered
}));

// ── Scroll-reveal wrapper ──────────────────────────────────────────────────────
function ScrollReveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.07 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
      }}
    >
      {children}
    </div>
  );
}

// ── How-it-works cards config ──────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: '01',
    emoji: '🔍',
    title: 'Get a clue',
    body: 'A mystery NRL player is revealed one clue at a time. Guess early, score big. Wait too long and everyone beats you to it.',
    bg: '#0d1117',
  },
  {
    step: '02',
    emoji: '✏️',
    title: 'Make your guess',
    body: "Type the player's name. Fewer clues used = higher score. Get it in 1 and you're a legend.",
    bg: '#111a22',   // slightly brighter centre card
    accent: true,
  },
  {
    step: '03',
    emoji: '🏆',
    title: 'Rub it in',
    body: "Share your result in the group chat. Let them know where they stand.",
    bg: '#0d1117',
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const [leaderboard, setLeaderboard] = useState(null);
  const [yesterday, setYesterday] = useState(null);
  const [email, setEmail] = useState('');
  const [emailState, setEmailState] = useState('idle');

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

  return (
    <div className="bg-texture min-h-screen text-white">

      <Nav />

      {/* ════════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16 md:pt-28 md:pb-20 text-center">

        {/* ── Green radial glow ── */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <div
            className="w-[800px] h-[600px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(ellipse, rgba(0,230,118,0.07) 0%, transparent 60%)' }}
          />
        </div>

        {/* ── Rugby ball SVG — large, right side, rotated ── */}
        <div
          className="pointer-events-none absolute hidden sm:block"
          style={{
            right: '-40px',
            top: '50%',
            transform: 'translateY(-48%) rotate(-15deg)',
            width: '440px',
            opacity: 0.09,
          }}
          aria-hidden
        >
          <svg viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Ball outline (pointy oval via bezier) */}
            <path
              d="M 250,6 C 435,6 494,82 494,150 C 494,218 435,294 250,294 C 65,294 6,218 6,150 C 6,82 65,6 250,6 Z"
              stroke="#00e676"
              strokeWidth="4"
              fill="rgba(0,230,118,0.04)"
            />
            {/* Horizontal equator seam (slightly curved) */}
            <path
              d="M 6,150 C 82,170 166,177 250,177 C 334,177 418,170 494,150"
              stroke="#00e676"
              strokeWidth="2.5"
              fill="none"
              opacity="0.6"
            />
            {/* Vertical lace centre line */}
            <line x1="250" y1="50" x2="250" y2="250" stroke="#00e676" strokeWidth="2" opacity="0.45"/>
            {/* Lace cross-marks */}
            <line x1="233" y1="96"  x2="267" y2="96"  stroke="#00e676" strokeWidth="4"/>
            <line x1="231" y1="118" x2="269" y2="118" stroke="#00e676" strokeWidth="4"/>
            <line x1="231" y1="140" x2="269" y2="140" stroke="#00e676" strokeWidth="4"/>
            <line x1="231" y1="162" x2="269" y2="162" stroke="#00e676" strokeWidth="4"/>
            <line x1="233" y1="184" x2="267" y2="184" stroke="#00e676" strokeWidth="4"/>
          </svg>
        </div>

        {/* ── Floating particles ── */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="pointer-events-none absolute rounded-full"
            style={{
              left:      p.left,
              bottom:    p.bottom,
              width:     p.size,
              height:    p.size,
              background: p.color,
              opacity:   p.opacity,
              animation: `particle-drift ${p.duration} ease-in-out ${p.delay} infinite`,
            }}
            aria-hidden
          />
        ))}

        {/* ── Content ── */}
        <div className="relative max-w-3xl mx-auto">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-gray-400 mb-8"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <span>🏉</span>
            <span>Daily NRL guessing game</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none mb-6 text-white">
            Guess today's NRL player<br />
            <span style={{ color: GREEN }}>Before your mates do.</span>
          </h1>

          {/* Subtext */}
          <p className="text-xl text-gray-400 mb-8 max-w-xl mx-auto">
            Six clues. One player. Two minutes. New every day.
          </p>

          {/* Today's stats pill */}
          {stats && stats.totalAttempts > 0 && (
            <div
              className="inline-flex items-center gap-3 rounded-full px-5 py-2 text-sm mb-8"
              style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)' }}
            >
              <span className="text-gray-300">
                <span className="text-white font-bold">{stats.totalAttempts}</span> playing today
              </span>
              {stats.avgClues && (
                <>
                  <span style={{ color: 'rgba(0,230,118,0.35)' }}>|</span>
                  <span className="text-gray-300">
                    avg <span className="text-white font-bold">{stats.avgClues}</span> clues
                  </span>
                </>
              )}
            </div>
          )}

          {/* CTA — pulsing glow */}
          <div className="mb-8">
            <Link
              href="/play"
              className="inline-block font-black text-xl uppercase tracking-widest rounded-2xl px-10 py-5 active:scale-95 transition-transform animate-cta-pulse"
              style={{ background: GREEN, color: '#000' }}
            >
              PLAY TODAY'S GAME →
            </Link>
          </div>

          {/* Live stats row */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 flex-wrap min-h-[20px]">
            {stats ? (
              <>
                {stats.totalAttempts === 0 && <span>No scores yet — be the first to play</span>}
                {stats.oneCluePercent > 0 && <span>{stats.oneCluePercent}% cracked it in 1 clue</span>}
              </>
            ) : (
              <span className="animate-pulse text-gray-700">Loading stats…</span>
            )}
          </div>

        </div>
      </section>

      {/* ── Thin green divider ── */}
      <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)`, opacity: 0.5 }} />

      {/* ════════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════════════ */}
      <section
        className="px-4 py-16 md:py-20"
        style={{ background: 'rgba(7,11,16,0.95)' }}
      >
        <div className="max-w-5xl mx-auto">

          <ScrollReveal>
            <p className="text-center text-xs font-bold tracking-[0.3em] text-gray-500 uppercase mb-12">
              How it works
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {HOW_IT_WORKS.map(({ step, emoji, title, body, bg, accent }, idx) => (
              <ScrollReveal key={step} delay={idx * 120}>
                <div
                  className="relative rounded-2xl p-7 h-full transition-transform hover:-translate-y-1"
                  style={{
                    background: bg,
                    borderLeft: `3px solid ${GREEN}`,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Step number */}
                  <span
                    className="block font-black mb-4 leading-none"
                    style={{ color: GREEN, fontSize: '2.2rem', opacity: 0.9 }}
                  >
                    {step}
                  </span>
                  <div className="text-3xl mb-4">{emoji}</div>
                  <h3 className="font-bold text-lg text-white mb-3">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          YESTERDAY'S ANSWER
      ════════════════════════════════════════════════════════════════════ */}
      {yesterday && (
        <ScrollReveal>
          <section className="bg-texture px-4 py-16 md:py-20 text-center">
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
        </ScrollReveal>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          EMAIL SIGNUP
      ════════════════════════════════════════════════════════════════════ */}
      <ScrollReveal>
        <section
          className="px-4 py-16"
          style={{
            background: 'linear-gradient(to bottom, #070d15, #0d1a28)',
            borderTop: `2px solid ${GREEN}`,
          }}
        >
          <div className="max-w-md mx-auto text-center">
            <p className="font-black text-3xl text-white mb-3 tracking-tight">
              Don't miss tomorrow's game
            </p>
            <p className="text-gray-400 text-sm mb-8">
              Fresh game every morning for Aus and NZ. No spam. Just footy.
            </p>

            {emailState === 'done' ? (
              <p className="font-bold text-lg" style={{ color: GREEN }}>
                You're in! See you tomorrow at 7am.
              </p>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
                <button
                  type="submit"
                  disabled={emailState === 'loading'}
                  className="font-bold px-5 py-3 rounded-xl text-sm text-white disabled:opacity-50 transition-colors whitespace-nowrap"
                  style={{ background: '#1e2f45', border: '1px solid rgba(255,255,255,0.12)' }}
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
      </ScrollReveal>

      {/* ════════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════════ */}
      <footer
        className="bg-texture px-4 py-12 text-center"
        style={{ borderTop: `1px solid ${GREEN}`, opacity: undefined }}
      >
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-evenly text-sm text-gray-500 max-w-xs mx-auto">
            <Link href="/play"        className="hover:text-[#00e676] transition-colors">Play</Link>
            <span style={{ color: 'rgba(0,230,118,0.2)' }}>|</span>
            <Link href="/leaderboard" className="hover:text-[#00e676] transition-colors">Leaderboard</Link>
            <span style={{ color: 'rgba(0,230,118,0.2)' }}>|</span>
            <Link href="/champion"    className="hover:text-[#00e676] transition-colors">Champions</Link>
          </div>
          <p className="text-xs text-gray-700">
            Made for rugby league tragics across Aus and NZ · setforsix.com.au
          </p>
        </div>
      </footer>

    </div>
  );
}
