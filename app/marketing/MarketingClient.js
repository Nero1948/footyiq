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
      'Account live: @SetforsixNRL — post daily using the Content Schedule below',
      'Morning post: today\'s Clue 1 as a teaser — no answer, just the mystery',
      'Evening post: yesterday\'s answer reveal with one interesting fact',
      'Use hashtags: #NRL #NRLTwitter on every single post',
      'Don\'t pitch the game directly — let the content pull people in naturally',
      'Engage: like and reply to NRL accounts before expecting anything back',
    ],
  },
  {
    platform: 'Twitter — Who to Follow',
    colour: '#38bdf8',
    status: 'Do this week',
    statusColour: '#facc15',
    points: [
      'Follow 30–50 quality accounts this week — do NOT mass follow (Twitter restricts new accounts that move too fast)',
      'Official: @NRL, @NRLW, @NRLDoubleHeader',
      'All 16 clubs: @brisbanebroncos @SydneyRoosters @SeaEagles @PanthersNRL @sharksNRL @RabbitohsNRL @NRLDragons @NRLWarriors @melbournestorm @NQCowboys @ParraEels @TitansNRL @NRLRoosters @WestsTigers @dogsNRL @newcastleknights',
      'Journalists & media: @foxleague @9NewsNRL — search "NRL journalist" on Twitter to find active reporters',
      'Stats & fan accounts: search "NRL stats" and "NRL trivia" to find engaged communities',
      'Engage first — like or reply to 2–3 of their posts before following. They\'re more likely to notice you.',
      'Never follow-unfollow. It looks spammy and can get your account restricted.',
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

// ── Content schedule ──────────────────────────────────────────────────────────

const SCHEDULE = [
  {
    date: '2026-04-20',
    label: 'Sun 20 Apr',
    posts: [
      {
        id: 'apr20_am', time: 'Morning', platform: 'Twitter/X', label: 'Clue teaser — Robbie Farah',
        text: `🏉 Today's clue on #SetForSix:\n\n"Won the NRL premiership in his third season of first-grade football."\n\nWho is today's mystery NRL legend? Six clues, one player.\n\nsetforsix.com #NRL #NRLTwitter`,
      },
      {
        id: 'apr20_pm', time: 'Evening', platform: 'Twitter/X', label: 'Answer reveal — Mark Gasnier',
        text: `Yesterday's #SetForSix answer: Mark Gasnier 🎉\n\nHis uncle Reg Gasnier was named in Australia's Team of the Century — giving Mark enormous expectations from the moment he stepped onto a first-grade field.\n\nNew game is live now → setforsix.com #NRL`,
      },
    ],
  },
  {
    date: '2026-04-21',
    label: 'Mon 21 Apr',
    posts: [
      {
        id: 'apr21_am', time: 'Morning', platform: 'Twitter/X', label: 'Clue teaser — Manu Vatuvei',
        text: `🏉 Today's clue on #SetForSix:\n\n"Became the first player in NRL history to score at least 10 tries in every one of 10 consecutive seasons."\n\nWho is today's mystery player?\n\nsetforsix.com #NRL #NRLTwitter`,
      },
      {
        id: 'apr21_pm', time: 'Evening', platform: 'Twitter/X', label: 'Answer reveal — Robbie Farah',
        text: `Yesterday's #SetForSix answer: Robbie Farah 🎉\n\nHis record of 63 tackles in State of Origin Game II in 2012 is the most in a single Origin match — a stat most fans don't know.\n\nNew game is live → setforsix.com #NRL`,
      },
    ],
  },
  {
    date: '2026-04-22',
    label: 'Tue 22 Apr',
    posts: [
      {
        id: 'apr22_am', time: 'Morning', platform: 'Twitter/X', label: 'Clue teaser — Preston Campbell',
        text: `🏉 Today's clue on #SetForSix:\n\n"Won the Dally M Player of the Year award by a single point — edging out the player widely considered the best in the world at the time."\n\nWho could beat Andrew Johns to that award?\n\nsetforsix.com #NRL #NRLTwitter`,
      },
      {
        id: 'apr22_pm', time: 'Evening', platform: 'Twitter/X', label: 'Answer reveal — Manu Vatuvei',
        text: `Yesterday's #SetForSix answer: Manu Vatuvei 🎉\n\nThe Beast broke New Zealand's all-time try-scoring record, finishing with 22 tries in 28 Tests. All 226 of his NRL games were for the Warriors.\n\nNew game is live → setforsix.com #NRL`,
      },
    ],
  },
  {
    date: '2026-04-23',
    label: 'Wed 23 Apr',
    posts: [
      {
        id: 'apr23_am', time: 'Morning', platform: 'Twitter/X', label: 'Clue teaser — Paul Gallen',
        text: `🏉 Today's clue on #SetForSix:\n\n"Led his club to their first-ever NRL premiership after 49 years of trying — an achievement that reduced grown men to tears across an entire city."\n\nWho captained that fairytale season?\n\nsetforsix.com #NRL #NRLTwitter`,
      },
      {
        id: 'apr23_pm', time: 'Evening', platform: 'Twitter/X', label: 'Answer reveal — Preston Campbell',
        text: `Yesterday's #SetForSix answer: Preston Campbell 🎉\n\nHe played every single minute of every match in Penrith's 2003 premiership-winning season — then went on to become the first-ever signing for the Gold Coast Titans.\n\nNew game is live → setforsix.com #NRL`,
      },
    ],
  },
  {
    date: '2026-04-24',
    label: 'Thu 24 Apr',
    posts: [
      {
        id: 'apr24_am', time: 'Morning', platform: 'Twitter/X', label: 'Clue teaser — Stacey Jones',
        text: `🏉 Today's clue on #SetForSix:\n\n"His grandfather was a celebrated New Zealand rugby league player — meaning the game ran in his blood long before he ever stepped onto a first-grade field."\n\nWho is the mystery player?\n\nsetforsix.com #NRL #NRLTwitter`,
      },
      {
        id: 'apr24_pm', time: 'Evening', platform: 'Twitter/X', label: 'Answer reveal — Paul Gallen',
        text: `Yesterday's #SetForSix answer: Paul Gallen 🎉\n\nDespite being a lock forward, Gallen scored 63 NRL tries. He also holds the record as the longest-serving NSW State of Origin captain.\n\nNew game is live → setforsix.com #NRL`,
      },
    ],
  },
  {
    date: '2026-04-25',
    label: 'Fri 25 Apr',
    posts: [
      {
        id: 'apr25_am', time: 'Morning', platform: 'Twitter/X', label: 'Clue teaser — Greg Inglis',
        text: `🏉 Today's clue on #SetForSix:\n\n"As a teenager from regional NSW, he was already being talked about as an exceptional all-round back with the frame, speed and instincts to become a future superstar."\n\nOne of the greatest. Can you name him from clue 1?\n\nsetforsix.com #NRL #NRLTwitter`,
      },
      {
        id: 'apr25_pm', time: 'Evening', platform: 'Twitter/X', label: 'Answer reveal — Stacey Jones',
        text: `Yesterday's #SetForSix answer: Stacey Jones 🎉\n\nThe Little General won the 2002 Golden Boot as the world's best international player — only the second New Zealander ever to receive that honour. 261 games, one club.\n\nNew game is live → setforsix.com #NRL`,
      },
    ],
  },
  {
    date: '2026-04-26',
    label: 'Sat 26 Apr',
    posts: [
      {
        id: 'apr26_am', time: 'Morning', platform: 'Twitter/X', label: 'Clue teaser — Corey Parker',
        text: `🏉 Today's clue on #SetForSix:\n\n"Scored a try in his very first NRL match — a debut that hinted at the longevity and loyalty that would define an entire career at a single club."\n\n347 games. One club. Who is it?\n\nsetforsix.com #NRL #NRLTwitter`,
      },
      {
        id: 'apr26_pm', time: 'Evening', platform: 'Twitter/X', label: 'Answer reveal — Greg Inglis',
        text: `Yesterday's #SetForSix answer: Greg Inglis 🎉\n\nGI retired as Queensland's all-time leading try scorer in Origin history — 18 tries in 32 matches. His Goanna crawl in the 2014 Grand Final remains one of the most iconic images the game has ever produced.\n\nNew game is live → setforsix.com #NRL`,
      },
    ],
  },
  {
    date: '2026-04-27',
    label: 'Sun 27 Apr',
    posts: [
      {
        id: 'apr27_am', time: 'Morning', platform: 'Twitter/X', label: 'Clue teaser — Laurie Daley',
        text: `🏉 Today's clue on #SetForSix:\n\n"Was spotted by a club talent scout at just 15 — and debuted in the top grade at 17 without ever playing a reserve grade match."\n\nCanberra legend. Who is it?\n\nsetforsix.com #NRL #NRLTwitter`,
      },
      {
        id: 'apr27_pm', time: 'Evening', platform: 'Twitter/X', label: 'Answer reveal — Corey Parker',
        text: `Yesterday's #SetForSix answer: Corey Parker 🎉\n\n1,328 career points — 586 goals and 39 tries, all for Brisbane across 347 games. Wayne Bennett described him as the ultimate professional.\n\nNew game is live → setforsix.com #NRL`,
      },
    ],
  },
  {
    date: '2026-04-28',
    label: 'Mon 28 Apr',
    posts: [
      {
        id: 'apr28_am', time: 'Morning', platform: 'Twitter/X', label: 'Clue teaser — Anthony Minichiello',
        text: `🏉 Today's clue on #SetForSix:\n\n"Repeated back and neck injuries threatened his career in the middle years, yet he fought through them to become one of the most durable and decorated one-club players of the NRL era."\n\n302 games. One club. Who is it?\n\nsetforsix.com #NRL #NRLTwitter`,
      },
      {
        id: 'apr28_pm', time: 'Evening', platform: 'Twitter/X', label: 'Answer reveal — Laurie Daley',
        text: `Yesterday's #SetForSix answer: Laurie Daley 🎉\n\nGrowing up in Junee, Daley was the only boy among seven sisters — a detail that surprises everyone who watched him play. He went on to captain both NSW and Australia.\n\nNew game is live → setforsix.com #NRL`,
      },
    ],
  },
  {
    date: '2026-04-29',
    label: 'Tue 29 Apr',
    posts: [
      {
        id: 'apr29_am', time: 'Morning', platform: 'Twitter/X', label: 'Clue teaser — Jason Croker',
        text: `🏉 Today's clue on #SetForSix:\n\n"Despite being named Rookie of the Year in his debut season, he never became a household name — instead building a quiet reputation as one of the most durable forwards of his era."\n\n318 games. Canberra legend. Who is it?\n\nsetforsix.com #NRL #NRLTwitter`,
      },
      {
        id: 'apr29_pm', time: 'Evening', platform: 'Twitter/X', label: 'Answer reveal — Anthony Minichiello',
        text: `Yesterday's #SetForSix answer: Anthony Minichiello 🎉\n\nThe Count was the first fullback to captain his side to a Grand Final victory since 1934 — a 79-year gap. He appeared in six Grand Finals across his career.\n\nNew game is live → setforsix.com #NRL`,
      },
    ],
  },
  {
    date: '2026-04-30',
    label: 'Wed 30 Apr',
    posts: [
      {
        id: 'apr30_am', time: 'Morning', platform: 'Twitter/X', label: 'Clue teaser — Daly Cherry-Evans',
        text: `🏉 Today's clue on #SetForSix:\n\n"Won an NRL premiership in his debut season — scoring a try in the grand final — a fairytale introduction to the highest level of the game."\n\nStill playing. One of the great halfbacks. Who is it?\n\nsetforsix.com #NRL #NRLTwitter`,
      },
      {
        id: 'apr30_pm', time: 'Evening', platform: 'Twitter/X', label: 'Answer reveal — Jason Croker',
        text: `Yesterday's #SetForSix answer: Jason Croker 🎉\n\nWhen Croker played his final game for the Raiders, the ACT Chief Minister presented him with the keys to the city in front of 21,000 fans — a civic honour rarely given to a sportsperson.\n\nNew game is live → setforsix.com #NRL`,
      },
    ],
  },
  {
    date: 'evergreen',
    label: 'Evergreen',
    posts: [
      {
        id: 'ev_intro', time: 'Anytime', platform: 'Twitter/X', label: 'Site launch intro (post once)',
        text: `I built a free daily NRL trivia game 🏉\n\nSix clues. One mystery NRL legend. The fewer clues you need, the better your score. Ties go to fastest time.\n\nA new player drops every day — free to play, no sign-up needed.\n\nsetforsix.com #NRL #NRLTwitter`,
      },
      {
        id: 'ev_reddit_karma', time: 'Anytime', platform: 'Reddit',
        label: 'Karma builder — post in r/nrl',
        text: `Who is the most underrated player of the NRL era?\n\nEvery year the same names come up — Johns, Lockyer, Cronk, Slater. But who flew under the radar and deserved more recognition?\n\nFor me it's [YOUR PICK] — [ONE SENTENCE WHY]. Would love to hear who you'd pick.`,
      },
      {
        id: 'ev_reddit_promote', time: 'After 200 karma', platform: 'Reddit',
        label: 'Site mention — r/nrl (wait for karma first)',
        text: `I made a free daily NRL trivia game — similar to Wordle but for footy fans\n\nSix clues. One mystery NRL legend. The fewer clues you use, the better your score. Ties go to fastest time.\n\nA new player every day. Free, no sign-up. setforsix.com\n\nWould love feedback from people who actually know their NRL history.`,
      },
    ],
  },
];

function ContentSchedule() {
  const [copied, setCopied] = useState(null);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });

  function handleCopy(id, text) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const platformColour = p => p === 'Twitter/X' ? '#38bdf8' : '#fb923c';

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #222' }}>
      <div className="px-4 py-3" style={{ background: '#111' }}>
        <p className="text-sm font-semibold text-white">Content Schedule</p>
        <p className="text-xs text-gray-500 mt-0.5">Ready-to-post — copy and paste directly. Today is highlighted.</p>
      </div>
      {SCHEDULE.map(day => {
        const isToday = day.date === today;
        return (
          <div key={day.date} style={{ borderTop: '1px solid #1a1a1a' }}>
            <div
              className="px-4 py-2 flex items-center gap-2"
              style={{ background: isToday ? 'rgba(34,197,94,0.08)' : '#0e0e0e' }}
            >
              <span className="text-xs font-semibold" style={{ color: isToday ? '#22c55e' : '#555' }}>
                {day.label}
              </span>
              {isToday && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e30' }}>
                  Today
                </span>
              )}
            </div>
            {day.posts.map(post => (
              <div key={post.id} className="px-4 pb-4 pt-2" style={{ background: isToday ? 'rgba(34,197,94,0.03)' : '#0a0a0a' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: platformColour(post.platform) }}>{post.platform}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-600">{post.time}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{post.label}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(post.id, post.text)}
                    className="text-xs px-3 py-1 rounded-lg transition-colors flex-shrink-0"
                    style={{
                      background: copied === post.id ? '#22c55e20' : '#1a1a1a',
                      color: copied === post.id ? '#22c55e' : '#888',
                      border: `1px solid ${copied === post.id ? '#22c55e40' : '#2a2a2a'}`,
                    }}
                  >
                    {copied === post.id ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed font-sans">{post.text}</pre>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// keep for rendering below — replaces old ContentQueue
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
        {[].map(item => (
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

        {/* Content schedule */}
        <ContentSchedule />

      </div>
    </div>
  );
}
