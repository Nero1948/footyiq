import Link from 'next/link';
import Nav from './components/Nav';
import ScrollReveal from './components/ScrollReveal';
import EmailSignup from './components/EmailSignup';
import GamePreview from './components/GamePreview';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export const revalidate = 60;

export const metadata = {
  title: 'Set For Six — The Daily NRL Guessing Game',
  description: 'Six clues. One mystery NRL player. New every day. Can you beat your mates?',
  openGraph: {
    title: 'Set For Six — The Daily NRL Guessing Game',
    description: 'Six clues. One mystery NRL player. New every day. Can you beat your mates?',
    url: 'https://www.setforsix.com',
    images: [{ url: 'https://www.setforsix.com/api/og', width: 1200, height: 630, alt: 'Set For Six — Daily NRL Guessing Game' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Set For Six — The Daily NRL Guessing Game',
    description: 'Six clues. One mystery NRL player. New every day. Can you beat your mates?',
    images: ['https://www.setforsix.com/api/og'],
  },
};

const GREEN = '#00e676';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left:     `${((i * 43 + 11) % 88) + 6}%`,
  bottom:   `${((i * 29 + 7)  % 55) + 8}%`,
  size:     `${2 + (i % 4)}px`,
  color:    i % 3 === 0 ? '#00e676' : 'rgba(255,255,255,0.85)',
  opacity:  0.10 + (i % 5) * 0.03,
  duration: `${9 + (i % 7) * 1.8}s`,
  delay:    `${-((i * 3.7) % 14)}s`,
}));

const FAQS = [
  {
    q: 'What is Set For Six?',
    a: 'Set For Six is a free daily NRL guessing game. Each day a new mystery rugby league player is revealed through six progressive clues — the fewer clues you need to guess correctly, the better your score.',
  },
  {
    q: 'How do you play?',
    a: "Read the first clue and type the player's name. Not sure? Unlock the next clue — each one narrows things down. Lock in your guess as soon as you're confident. A new game drops every day.",
  },
  {
    q: 'Is Set For Six free to play?',
    a: 'Yes — 100% free. No account needed to play. You can optionally subscribe to get an email reminder each morning when the new game goes live.',
  },
  {
    q: 'When does a new game come out?',
    a: 'A fresh game launches every morning at midnight New Zealand time (10pm AEDT / 11pm AEST). Both Aussie and Kiwi rugby league fans can start their day with a new puzzle.',
  },
  {
    q: 'Do I need to be an NRL expert?',
    a: 'Not at all. The first clue rewards deep NRL knowledge, but later clues make the player obvious even to casual fans. If you follow footy occasionally, you should still crack most games by clue four or five.',
  },
  {
    q: 'How does scoring work?',
    a: 'Your score is based on how few clues you needed to guess correctly. Ties are broken by speed — the fastest correct guess wins the day and becomes the daily Champion on the leaderboard.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

async function getDemoPlayers() {
  const todayAEST = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  try {
    const { data } = await supabase
      .from('games')
      .select('answer_player, clue_1, clue_2, clue_3, clue_4, clue_5, clue_6')
      .lt('date', todayAEST)
      .order('date', { ascending: false })
      .limit(3);
    return data ?? [];
  } catch {
    return [];
  }
}

async function getLandingStats() {
  const todayAEST = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  try {
    const { data: game } = await supabase
      .from('games').select('id').eq('date', todayAEST).single();
    if (!game) return null;

    const [{ count: totalAttempts }, { data: solvedAttempts }] = await Promise.all([
      supabase.from('attempts').select('id', { count: 'exact', head: true }).eq('game_id', game.id),
      supabase.from('attempts').select('clues_used, total_time_ms').eq('game_id', game.id).eq('solved', true),
    ]);

    if (!totalAttempts) return null;

    let avgClues = null;
    let oneCluePercent = 0;
    let fastestMs = null;
    if (solvedAttempts?.length > 0) {
      const total = solvedAttempts.reduce((s, a) => s + a.clues_used, 0);
      avgClues = (total / solvedAttempts.length).toFixed(1);
      const oneClue = solvedAttempts.filter(a => a.clues_used === 1).length;
      oneCluePercent = Math.round((oneClue / solvedAttempts.length) * 100);
      fastestMs = Math.min(...solvedAttempts.map(a => a.total_time_ms));
    }
    return { totalAttempts, avgClues, oneCluePercent, fastestMs };
  } catch {
    return null;
  }
}

async function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterdayAEST = d.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  try {
    const { data: game } = await supabase
      .from('games').select('id, answer_player').eq('date', yesterdayAEST).single();
    if (!game) return null;

    const [{ count: totalAttempts }, { data: solvedAttempts }] = await Promise.all([
      supabase.from('attempts').select('id', { count: 'exact', head: true }).eq('game_id', game.id),
      supabase.from('attempts').select('clues_used, total_time_ms').eq('game_id', game.id).eq('solved', true),
    ]);

    const solvedCount = solvedAttempts?.length ?? 0;
    let avgClues = null;
    let oneCluePercent = 0;
    let fastestMs = null;
    if (solvedCount > 0) {
      const total = solvedAttempts.reduce((s, a) => s + a.clues_used, 0);
      avgClues = (total / solvedCount).toFixed(1);
      const oneClue = solvedAttempts.filter(a => a.clues_used === 1).length;
      oneCluePercent = Math.round((oneClue / solvedCount) * 100);
      fastestMs = Math.min(...solvedAttempts.map(a => a.total_time_ms));
    }
    return { answer: game.answer_player, totalAttempts: totalAttempts ?? 0, solvedCount, avgClues, oneCluePercent, fastestMs };
  } catch {
    return null;
  }
}

export default async function Home() {
  const [stats, yesterday, demoPlayers] = await Promise.all([getLandingStats(), getYesterday(), getDemoPlayers()]);

  const STATS_THRESHOLD = 20;
  const todayHasEnoughStats = (stats?.totalAttempts ?? 0) >= STATS_THRESHOLD;
  const showLiveTeaser = (stats?.totalAttempts ?? 0) > 0 && !todayHasEnoughStats;
  // Use today's stats if enough players have played, fall back to yesterday's
  const heroStats = todayHasEnoughStats
    ? { ...stats, isYesterday: false }
    : (yesterday?.totalAttempts > 0 ? { ...yesterday, isYesterday: true } : null);

  return (
    <div className="bg-texture min-h-screen text-white">

      <Nav />

      {/* ════════════ HERO ════════════ */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16 md:pt-28 md:pb-20 text-center">

        {/* Green radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <div
            className="w-[800px] h-[600px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(ellipse, rgba(0,230,118,0.07) 0%, transparent 60%)' }}
          />
        </div>

        {/* Rugby ball SVG */}
        <div
          className="pointer-events-none absolute hidden sm:block"
          style={{ right: '-40px', top: '50%', transform: 'translateY(-48%) rotate(-15deg)', width: '440px', opacity: 0.09 }}
          aria-hidden
        >
          <svg viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 250,6 C 435,6 494,82 494,150 C 494,218 435,294 250,294 C 65,294 6,218 6,150 C 6,82 65,6 250,6 Z" stroke="#00e676" strokeWidth="4" fill="rgba(0,230,118,0.04)" />
            <path d="M 6,150 C 82,170 166,177 250,177 C 334,177 418,170 494,150" stroke="#00e676" strokeWidth="2.5" fill="none" opacity="0.6" />
            <line x1="250" y1="50" x2="250" y2="250" stroke="#00e676" strokeWidth="2" opacity="0.45" />
            <line x1="233" y1="96"  x2="267" y2="96"  stroke="#00e676" strokeWidth="4" />
            <line x1="231" y1="118" x2="269" y2="118" stroke="#00e676" strokeWidth="4" />
            <line x1="231" y1="140" x2="269" y2="140" stroke="#00e676" strokeWidth="4" />
            <line x1="231" y1="162" x2="269" y2="162" stroke="#00e676" strokeWidth="4" />
            <line x1="233" y1="184" x2="267" y2="184" stroke="#00e676" strokeWidth="4" />
          </svg>
        </div>

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="pointer-events-none absolute rounded-full"
            style={{ left: p.left, bottom: p.bottom, width: p.size, height: p.size, background: p.color, opacity: p.opacity, animation: `particle-drift ${p.duration} ease-in-out ${p.delay} infinite` }}
            aria-hidden
          />
        ))}

        <div className="relative max-w-3xl mx-auto">

          {/* Eyebrow */}
          <p className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase mb-6">
            The daily NRL guessing game
          </p>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none mb-6 text-white">
            Guess the NRL player<br />
            <span style={{ color: GREEN }}>Before your mates do.</span>
          </h1>

          {/* Subtext */}
          <p className="text-xl text-gray-400 mb-8 max-w-xl mx-auto">
            Six clues. One player. Two minutes. New every day.
          </p>

          {/* 4-stat row */}
          {showLiveTeaser && (
            <div
              className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm mb-8"
              style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)' }}
            >
              <span className="text-gray-300">Today&apos;s game is live — be one of the first to play.</span>
            </div>
          )}
          {!showLiveTeaser && heroStats && (
            <div
              className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl px-5 py-2.5 text-sm mb-8"
              style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)' }}
            >
              {heroStats.isYesterday && (
                <span className="text-xs text-gray-500 font-medium w-full text-center -mb-0.5">Yesterday</span>
              )}
              <span className="text-gray-300">
                <span className="font-bold text-white">{heroStats.totalAttempts}</span>
                {heroStats.isYesterday ? ' played' : ' played today'}
              </span>
              {heroStats.avgClues && (
                <>
                  <span style={{ color: 'rgba(0,230,118,0.3)' }}>|</span>
                  <span className="text-gray-300">
                    Avg solve: <span className="font-bold text-white">{heroStats.avgClues}</span> clues
                  </span>
                </>
              )}
              {heroStats.fastestMs != null && (
                <>
                  <span style={{ color: 'rgba(0,230,118,0.3)' }}>|</span>
                  <span className="text-gray-300">
                    Fastest: <span className="font-bold text-white">{(heroStats.fastestMs / 1000).toFixed(1)}s</span>
                  </span>
                </>
              )}
              {heroStats.oneCluePercent > 0 && (
                <>
                  <span style={{ color: 'rgba(0,230,118,0.3)' }}>|</span>
                  <span className="text-gray-300">
                    Only <span className="font-bold text-white">{heroStats.oneCluePercent}%</span> got it in 1
                  </span>
                </>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="mb-8">
            <Link
              href="/play"
              className="inline-block font-black text-xl uppercase tracking-widest rounded-2xl px-10 py-5 active:scale-95 transition-transform animate-cta-pulse"
              style={{ background: GREEN, color: '#000' }}
            >
              Play today&apos;s game →
            </Link>
          </div>

        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)`, opacity: 0.5 }} />

      {/* ════════════ GAME PREVIEW ════════════ */}
      <section className="px-4 py-16 md:py-20" style={{ background: 'rgba(7,11,16,0.95)' }}>
        <div className="max-w-xl mx-auto">
          <ScrollReveal>
            <p className="text-center text-xs font-bold tracking-[0.3em] text-gray-500 uppercase mb-3">
              See how it works
            </p>
            <h2 className="text-center text-3xl sm:text-4xl font-black text-white mb-10">
              Watch a game in action
            </h2>
          </ScrollReveal>
          <GamePreview players={demoPlayers} />
        </div>
      </section>

      {/* ════════════ YESTERDAY ════════════ */}
      {yesterday && (
        <ScrollReveal>
          <section className="bg-texture px-4 py-16 md:py-20 text-center">
            <div className="max-w-xl mx-auto">
              <p className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase mb-8">
                Yesterday&apos;s game
              </p>
              <p className="text-gray-500 text-lg mb-3">Yesterday&apos;s answer was</p>
              <p className="text-5xl md:text-6xl font-black mb-6" style={{ color: GREEN }}>
                {yesterday.answer}
              </p>
              {yesterday.oneCluePercent > 0 && yesterday.totalAttempts >= 20 ? (
                <p className="text-gray-600">
                  Only <span className="text-white font-bold">{yesterday.oneCluePercent}%</span> of players cracked it in 1 clue
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
                  Play today&apos;s game
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ════════════ EMAIL SIGNUP ════════════ */}
      <ScrollReveal>
        <section
          className="px-4 py-16"
          style={{ background: 'linear-gradient(to bottom, #070d15, #0d1a28)', borderTop: `2px solid ${GREEN}` }}
        >
          <div className="max-w-md mx-auto text-center">
            <p className="font-black text-3xl text-white mb-3 tracking-tight">
              Get tomorrow&apos;s game first
            </p>
            <p className="text-gray-400 text-sm mb-8">
              Fresh game every morning for Aus and NZ. No spam. Just league.
            </p>
            <EmailSignup />
          </div>
        </section>
      </ScrollReveal>

      {/* ════════════ FAQ ════════════ */}
      <section className="px-4 py-14 md:py-16" style={{ background: 'rgba(7,11,16,0.95)' }}>
        <div className="max-w-2xl mx-auto">
          <ScrollReveal>
            <p className="text-center text-xs font-bold tracking-[0.3em] text-gray-500 uppercase mb-8">
              Frequently asked
            </p>
          </ScrollReveal>

          <div className="space-y-3">
            {FAQS.map(({ q, a }, idx) => (
              <ScrollReveal key={q} delay={idx * 60}>
                <details
                  className="group rounded-xl overflow-hidden"
                  style={{
                    background: '#0d1117',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <summary
                    className="cursor-pointer list-none px-5 py-4 flex items-center justify-between font-semibold text-white hover:text-[#00e676] transition-colors"
                  >
                    <span className="pr-4">{q}</span>
                    <span
                      className="text-2xl leading-none transition-transform group-open:rotate-45 flex-shrink-0"
                      style={{ color: GREEN }}
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-gray-400 text-sm leading-relaxed">
                    {a}
                  </p>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ════════════ FOOTER ════════════ */}
      <footer className="bg-texture px-4 py-12 text-center" style={{ borderTop: `1px solid ${GREEN}` }}>
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-evenly text-sm text-gray-500 max-w-xs mx-auto">
            <Link href="/play"        className="hover:text-[#00e676] transition-colors">Play</Link>
            <span style={{ color: 'rgba(0,230,118,0.2)' }}>|</span>
            <Link href="/leaderboard" className="hover:text-[#00e676] transition-colors">Leaderboard</Link>
            <span style={{ color: 'rgba(0,230,118,0.2)' }}>|</span>
            <Link href="/champion"    className="hover:text-[#00e676] transition-colors">Champions</Link>
          </div>
          <p className="text-xs text-gray-700">
            Made for rugby league tragics across Aus and NZ · setforsix.com
          </p>
        </div>
      </footer>

    </div>
  );
}
