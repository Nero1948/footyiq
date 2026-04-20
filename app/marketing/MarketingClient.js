'use client';

import { useState, useEffect } from 'react';

// ── Password gate ──────────────────────────────────────────────────────────────

function PasswordForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/marketing/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setError('Incorrect password');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl" style={{ background: '#111', border: '1px solid #222' }}>
        <p className="text-2xl font-bold text-white mb-2">Marketing Hub</p>
        <p className="text-sm text-gray-500 mb-6">Set For Six — internal only</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
            style={{ background: '#1a1a1a', border: '1px solid #333' }}
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: '#22c55e', color: '#000' }}
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, colour = '#22c55e' }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid #222' }}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold" style={{ color: colour }}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

// ── Growth chart ───────────────────────────────────────────────────────────────

function GrowthChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 560;
  const H = 80;
  const PAD = 10;

  const coords = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - (d.count / max) * (H - PAD * 2);
    return [x, y];
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `M${coords[0][0]},${H - PAD} ` +
    coords.map(([x, y]) => `L${x},${y}`).join(' ') +
    ` L${coords[coords.length - 1][0]},${H - PAD} Z`;

  const firstDate = data[0]?.date?.slice(5).replace('-', '/');
  const lastDate = data[data.length - 1]?.date?.slice(5).replace('-', '/');

  return (
    <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid #222' }}>
      <p className="text-xs text-gray-500 mb-3">Daily plays — last 14 days</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chartGrad)" />
        <path d={linePath} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#22c55e" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-600">{firstDate}</span>
        <span className="text-xs text-gray-600">{lastDate}</span>
      </div>
    </div>
  );
}

// ── Daily checklist ────────────────────────────────────────────────────────────

const CHECKLIST = [
  { id: 'clue_twitter', label: 'Post today\'s clue teaser on Twitter/X' },
  { id: 'engage_twitter', label: 'Reply to or like 3 NRL accounts on Twitter/X' },
  { id: 'reddit_comment', label: 'Comment genuinely on 2 posts in r/nrl' },
  { id: 'reddit_post', label: 'Post a discussion question in r/nrl (if you have content ready)' },
  { id: 'check_stats', label: 'Review today\'s player count on this dashboard' },
  { id: 'answer_reveal', label: 'Post yesterday\'s answer reveal on Twitter/X (evening)' },
];

function Checklist() {
  const todayKey = `mkt_checklist_${new Date().toLocaleDateString('en-CA')}`;
  const [checked, setChecked] = useState({});

  useEffect(() => {
    try {
      setChecked(JSON.parse(localStorage.getItem(todayKey) ?? '{}'));
    } catch {
      setChecked({});
    }
  }, [todayKey]);

  function toggle(id) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    localStorage.setItem(todayKey, JSON.stringify(next));
  }

  const done = CHECKLIST.filter(c => checked[c.id]).length;

  return (
    <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid #222' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white">Today's Checklist</p>
        <span className="text-xs text-gray-500">{done}/{CHECKLIST.length} done</span>
      </div>
      <div className="space-y-2">
        {CHECKLIST.map(item => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className="w-full flex items-start gap-3 text-left py-1"
          >
            <span
              className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center"
              style={{
                background: checked[item.id] ? '#22c55e' : 'transparent',
                borderColor: checked[item.id] ? '#22c55e' : '#444',
              }}
            >
              {checked[item.id] && (
                <svg viewBox="0 0 10 10" className="w-3 h-3" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span
              className="text-sm leading-snug"
              style={{ color: checked[item.id] ? '#555' : '#ccc', textDecoration: checked[item.id] ? 'line-through' : 'none' }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Traffic links ──────────────────────────────────────────────────────────────

function TrafficSources() {
  const links = [
    {
      name: 'Vercel Analytics',
      desc: 'Page views, visitors, referrers',
      url: 'https://vercel.com/nero1948s-projects/footyiq/analytics',
      colour: '#a78bfa',
    },
    {
      name: 'Vercel Speed Insights',
      desc: 'Core Web Vitals, LCP, CLS',
      url: 'https://vercel.com/nero1948s-projects/footyiq/speed-insights',
      colour: '#60a5fa',
    },
    {
      name: 'Supabase Dashboard',
      desc: 'Database tables, logs, queries',
      url: 'https://supabase.com/dashboard',
      colour: '#34d399',
    },
    {
      name: 'Reddit (r/nrl)',
      desc: 'Build karma here before promoting',
      url: 'https://reddit.com/r/nrl',
      colour: '#fb923c',
    },
    {
      name: '@SetforsixNRL Profile',
      desc: 'Your Twitter/X account',
      url: 'https://x.com/SetforsixNRL',
      colour: '#38bdf8',
    },
    {
      name: 'Twitter/X Analytics',
      desc: 'Tweet impressions and engagement',
      url: 'https://analytics.twitter.com',
      colour: '#38bdf8',
    },
  ];

  return (
    <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid #222' }}>
      <p className="text-sm font-semibold text-white mb-3">Analytics & Platforms</p>
      <div className="space-y-2">
        {links.map(link => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-2 px-3 rounded-lg group"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: link.colour }}>{link.name}</p>
              <p className="text-xs text-gray-600">{link.desc}</p>
            </div>
            <svg viewBox="0 0 16 16" className="w-4 h-4 text-gray-600 group-hover:text-gray-400" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Content strategy ───────────────────────────────────────────────────────────

const STRATEGY = [
  {
    platform: 'Reddit',
    colour: '#fb923c',
    status: 'Phase 1 — Build authority',
    statusColour: '#fb923c',
    points: [
      'Do NOT post about Set For Six yet — account is too new and will be removed',
      'Post 2–3 genuine NRL discussion threads per week in r/nrl',
      'Ideas: "Most underrated player of the NRL era?", "Best Origin moment you\'ve witnessed live?", "Which player would you bring back for one more season?"',
      'Comment helpfully on others\' posts — add knowledge, not noise',
      'Target: 200+ post karma before sharing your site',
      'Rule of thumb: 10 genuine contributions before 1 self-promotion',
    ],
  },
  {
    platform: 'Twitter / X',
    colour: '#38bdf8',
    status: 'Phase 1 — Active ✓',
    statusColour: '#22c55e',
    points: [
      'Account live: @SetforsixNRL — profile is set up and ready',
      'Post today\'s Clue 1 each morning as a teaser — no answer, just the mystery',
      'Post the answer reveal each evening with one interesting fact about the player',
      'Follow and engage with: @NRL, NRL club accounts, journalists (Andrew Webster, Michael Chammas)',
      'Use hashtags: #NRL #NRLTwitter on every post',
      'Don\'t pitch the game — let the content speak for itself',
    ],
  },
  {
    platform: 'Long-term',
    colour: '#a78bfa',
    status: 'Phase 2 — Months 2–3',
    statusColour: '#a78bfa',
    points: [
      'Once Twitter has 100+ followers: ask followers to share their score',
      'Once Reddit karma is 200+: share Set For Six in relevant threads naturally',
      'Reach out to small NRL podcast hosts for a mention (offer a free plug in return)',
      'Consider a weekly "hardest game of the week" post recapping the trickiest player',
      'Email list is gold — every subscriber is a daily returning player',
    ],
  },
];

function ContentStrategy() {
  const [open, setOpen] = useState(null);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #222' }}>
      <div className="px-4 py-3" style={{ background: '#111' }}>
        <p className="text-sm font-semibold text-white">Content Strategy</p>
      </div>
      {STRATEGY.map((s, i) => (
        <div key={s.platform} style={{ borderTop: '1px solid #1a1a1a', background: '#0e0e0e' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium" style={{ color: s.colour }}>{s.platform}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: `${s.statusColour}15`, color: s.statusColour, border: `1px solid ${s.statusColour}30` }}
              >
                {s.status}
              </span>
            </div>
            <svg
              viewBox="0 0 16 16"
              className="w-4 h-4 text-gray-600 transition-transform"
              style={{ transform: open === i ? 'rotate(180deg)' : 'none' }}
              fill="none"
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {open === i && (
            <ul className="px-4 pb-4 space-y-2">
              {s.points.map((p, j) => (
                <li key={j} className="flex gap-2 text-sm text-gray-400 leading-snug">
                  <span style={{ color: s.colour }} className="mt-0.5 flex-shrink-0">›</span>
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Content queue ──────────────────────────────────────────────────────────────

const CONTENT_QUEUE = [
  {
    id: 'tweet_clue',
    platform: 'Twitter/X',
    label: 'Daily clue teaser',
    colour: '#38bdf8',
    text: `🏉 Today's #SetForSix clue:\n\n"[PASTE CLUE 1 HERE]"\n\nWho is today's mystery NRL player? Six clues, one legend.\n\nsetforsix.com #NRL #NRLTwitter`,
  },
  {
    id: 'tweet_reveal',
    platform: 'Twitter/X',
    label: 'Answer reveal',
    colour: '#38bdf8',
    text: `Yesterday's #SetForSix answer: [PLAYER NAME] 🎉\n\n[PASTE AN INTERESTING FACT ABOUT THEM]\n\nNew game is live now → setforsix.com #NRL`,
  },
  {
    id: 'tweet_intro',
    platform: 'Twitter/X',
    label: 'Site launch intro',
    colour: '#38bdf8',
    text: `I built a daily NRL trivia game 🏉\n\nSix clues. One mystery NRL legend. The fewer clues you need, the better your score.\n\nA new player drops every day.\n\nsetforsix.com — free to play, no sign-up needed. Would love to know what you think. #NRL #NRLTwitter`,
  },
  {
    id: 'reddit_discussion',
    platform: 'Reddit',
    label: 'Karma-building post',
    colour: '#fb923c',
    text: `Who is the most underrated player of the NRL era?\n\nEvery year the same names come up — Johns, Lockyer, Cronk, Slater. But who flew under the radar and deserved more recognition?\n\nFor me it's [YOUR PICK] — [ONE SENTENCE WHY]. Would love to hear who you'd pick.`,
  },
  {
    id: 'reddit_promote',
    platform: 'Reddit',
    label: 'Site mention (use after 200 karma)',
    colour: '#fb923c',
    text: `I made a free daily NRL trivia game — similar to Wordle but for footy fans\n\nIt gives you six progressive clues about a mystery NRL legend. The fewer clues you need, the better your score. Ties go to fastest time.\n\nA new player every day. setforsix.com\n\nWould love feedback from people who actually know their NRL history.`,
  },
];

function ContentQueue() {
  const [copied, setCopied] = useState(null);

  function handleCopy(id, text) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #222' }}>
      <div className="px-4 py-3" style={{ background: '#111' }}>
        <p className="text-sm font-semibold text-white">Content Queue</p>
        <p className="text-xs text-gray-500 mt-0.5">Ready-to-post templates — edit the bracketed parts before posting</p>
      </div>
      <div className="divide-y" style={{ borderTop: '1px solid #1a1a1a', borderColor: '#1a1a1a' }}>
        {CONTENT_QUEUE.map(item => (
          <div key={item.id} className="p-4" style={{ background: '#0e0e0e' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: item.colour }}>{item.platform}</span>
                <span className="text-xs text-gray-600">—</span>
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
              <button
                onClick={() => handleCopy(item.id, item.text)}
                className="text-xs px-3 py-1 rounded-lg transition-colors"
                style={{
                  background: copied === item.id ? '#22c55e20' : '#1a1a1a',
                  color: copied === item.id ? '#22c55e' : '#888',
                  border: `1px solid ${copied === item.id ? '#22c55e40' : '#2a2a2a'}`,
                }}
              >
                {copied === item.id ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed font-sans">{item.text}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

export default function MarketingClient({ stats, authed }) {
  if (!authed) return <PasswordForm />;

  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Australia/Sydney',
  });

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing Hub</h1>
          <p className="text-sm text-gray-500 mt-1">{today} · Set For Six</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total plays" value={stats.totalPlays.toLocaleString()} />
          <StatCard label="Plays today" value={stats.todayPlays.toLocaleString()} colour="#60a5fa" />
          <StatCard label="Win rate" value={`${stats.winRate}%`} colour="#a78bfa" sub="players who solved it" />
          <StatCard label="Subscribers" value={stats.subscribers.toLocaleString()} colour="#fb923c" />
        </div>

        {/* Growth chart */}
        <GrowthChart data={stats.chartData} />

        {/* Checklist + Traffic */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Checklist />
          <TrafficSources />
        </div>

        {/* Strategy */}
        <ContentStrategy />

        {/* Content queue */}
        <ContentQueue />

      </div>
    </div>
  );
}
