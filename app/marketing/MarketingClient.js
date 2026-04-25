'use client';

import { useMemo, useState } from 'react';

const GREEN = '#00e676';
const PANEL = '#101820';
const PANEL_2 = '#0d141b';
const LINE = 'rgba(255,255,255,0.09)';
const MUTED = '#8b98a8';

function readLocalJson(key, fallback = {}) {
  if (typeof window === 'undefined') return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

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
      return;
    }

    setError('Incorrect password');
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#071016' }}>
      <div className="w-full max-w-sm rounded-lg p-6" style={{ background: PANEL, border: `1px solid ${LINE}` }}>
        <p className="text-2xl font-black text-white">Marketing Command</p>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>Set For Six internal dashboard</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none"
            style={{ background: '#071016', border: `1px solid ${LINE}` }}
            autoFocus
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg py-3 text-sm font-bold text-black" style={{ background: GREEN }}>
            {loading ? 'Checking...' : 'Enter dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Panel({ children, className = '', style = {} }) {
  return (
    <section className={cx('rounded-lg', className)} style={{ background: PANEL, border: `1px solid ${LINE}`, ...style }}>
      {children}
    </section>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b px-4 py-4" style={{ borderColor: LINE }}>
      <div>
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: GREEN }}>{eyebrow}</p>}
        <h2 className="mt-1 text-base font-bold text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, note, tone = GREEN }) {
  return (
    <div className="rounded-lg p-4" style={{ background: PANEL_2, border: `1px solid ${LINE}` }}>
      <p className="text-xs font-medium" style={{ color: MUTED }}>{label}</p>
      <p className="mt-2 text-3xl font-black leading-none" style={{ color: tone }}>{value}</p>
      {note && <p className="mt-2 text-xs" style={{ color: MUTED }}>{note}</p>}
    </div>
  );
}

function GrowthChart({ data }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 680;
  const H = 130;
  const PAD = 16;
  const coords = data.map((d, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - (d.count / max) * (H - PAD * 2);
    return [x, y];
  });
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `M${coords[0][0]},${H - PAD} ${coords.map(([x, y]) => `L${x},${y}`).join(' ')} L${coords[coords.length - 1][0]},${H - PAD} Z`;
  const hoverZones = coords.map(([x], i) => {
    const left = i === 0 ? 0 : (coords[i - 1][0] + x) / 2;
    const right = i === coords.length - 1 ? W : (x + coords[i + 1][0]) / 2;
    return { left, width: right - left };
  });
  const hoveredPoint = hovered === null ? null : {
    ...data[hovered],
    x: coords[hovered][0],
    y: coords[hovered][1],
  };

  return (
    <Panel>
      <SectionHeader eyebrow="Signal" title="Daily players: last 14 days" />
      <div className="relative px-4 py-4">
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg px-3 py-2 text-xs shadow-xl"
            style={{
              left: `clamp(12px, ${((hoveredPoint.x / W) * 100).toFixed(2)}%, calc(100% - 150px))`,
              top: 12,
              background: '#061016',
              border: `1px solid ${LINE}`,
            }}
          >
            <p className="font-bold text-white">{hoveredPoint.date}</p>
            <p className="mt-1" style={{ color: GREEN }}>{hoveredPoint.count} unique players</p>
            <p style={{ color: MUTED }}>{hoveredPoint.plays ?? hoveredPoint.count} total plays</p>
          </div>
        )}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }} onMouseLeave={() => setHovered(null)}>
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity="0.28" />
              <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2].map(i => (
            <line key={i} x1="16" x2={W - 16} y1={22 + i * 42} y2={22 + i * 42} stroke="rgba(255,255,255,0.06)" />
          ))}
          <path d={areaPath} fill="url(#growthFill)" />
          <path d={linePath} fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map(([x, y], i) => (
            <g key={data[i].date}>
              <rect
                x={hoverZones[i].left}
                y="0"
                width={hoverZones[i].width}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseMove={() => setHovered(i)}
              />
              {hovered === i && <line x1={x} x2={x} y1="12" y2={H - 12} stroke="rgba(255,255,255,0.18)" strokeDasharray="4 4" />}
              <circle cx={x} cy={y} r={hovered === i ? '5.5' : '3.5'} fill={GREEN} />
            </g>
          ))}
        </svg>
        <div className="mt-2 flex justify-between text-xs" style={{ color: MUTED }}>
          <span>{data[0]?.date?.slice(5).replace('-', '/')}</span>
          <span>Peak day: {max} unique players</span>
          <span>{data[data.length - 1]?.date?.slice(5).replace('-', '/')}</span>
        </div>
      </div>
    </Panel>
  );
}

const PLAN_STEPS = [
  {
    phase: 'Week 1',
    title: 'Make the game easy to discover',
    goal: 'Set up owned channels and soft daily publishing.',
    tasks: [
      'Pin a launch post on X with the value proposition and link.',
      'Create or refresh the Facebook Page with website, description, and first post.',
      'Add UTM links to every social bio and template so referrers are obvious.',
      'Post once daily from the official account: clue teaser in the morning, answer reveal at night.',
      'Comment in r/nrl without links 10 times before trying any promotion again.',
    ],
  },
  {
    phase: 'Week 2',
    title: 'Borrow matchday attention',
    goal: 'Attach Set For Six to live rugby league conversation.',
    tasks: [
      'Reply to 8-12 high-signal NRL posts during team list, game day, and post-match windows.',
      'Run one club-specific clue post when the daily answer connects to that club.',
      'Join 8 targeted Facebook groups, read rules, and make 2 non-link comments in each.',
      'Ask friends to post their scores from their own accounts instead of only sharing the site link.',
      'Start a tiny creator list: fan podcasts, NRL meme pages, stats pages, and Warriors pages.',
    ],
  },
  {
    phase: 'Week 3',
    title: 'Convert communities without looking spammy',
    goal: 'Use participation and feedback asks, not ads disguised as posts.',
    tasks: [
      'Make the first Reddit post a genuine discussion or feedback request, not a launch announcement.',
      'Post in 2-3 Facebook groups as a player sharing a score, then answer comments manually.',
      'DM 10 small creators with a short personal note and no pressure.',
      'Publish one weekly recap: hardest player, fastest champion, one-clue rate, and best comment.',
      'Track which channel creates returning players the next day, not just clicks.',
    ],
  },
  {
    phase: 'Week 4',
    title: 'Repeat what worked',
    goal: 'Pick the top channel and double the cadence for seven days.',
    tasks: [
      'Compare X, Reddit, Facebook, direct, and email growth.',
      'Keep only the two best post formats from the month.',
      'Ask active players to tag one mate after a hard puzzle.',
      'Offer one creator a custom challenge page or shout-out if they share it.',
      'Write the next month plan around the best source of repeat players.',
    ],
  },
];

const DAILY_ACTIONS = [
  { id: 'morning', label: 'Post today\'s clue teaser on X and Facebook Page', time: '8-10am AEST' },
  { id: 'reply', label: 'Leave 5 useful replies on current NRL conversations', time: 'Lunch' },
  { id: 'reddit', label: 'Make 2 genuine Reddit comments with no site link', time: 'Anytime' },
  { id: 'group', label: 'Interact in 1 Facebook group before posting anything', time: 'Afternoon' },
  { id: 'reveal', label: 'Post yesterday\'s answer reveal with one fact', time: '7-9pm AEST' },
  { id: 'measure', label: 'Record best channel and one learning from today', time: 'Night' },
];

function DailyChecklist() {
  const todayKey = `mkt_daily_${new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })}`;
  const [checked, setChecked] = useState(() => readLocalJson(todayKey));
  const done = DAILY_ACTIONS.filter(a => checked[a.id]).length;

  function toggle(id) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    localStorage.setItem(todayKey, JSON.stringify(next));
  }

  return (
    <Panel>
      <SectionHeader
        eyebrow="Today"
        title="Daily execution loop"
        action={<span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: GREEN, background: 'rgba(0,230,118,0.12)' }}>{done}/{DAILY_ACTIONS.length}</span>}
      />
      <div className="divide-y" style={{ borderColor: LINE }}>
        {DAILY_ACTIONS.map(action => (
          <button key={action.id} onClick={() => toggle(action.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left" style={{ borderColor: LINE }}>
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded"
              style={{ background: checked[action.id] ? GREEN : '#071016', border: `1px solid ${checked[action.id] ? GREEN : LINE}` }}
            >
              {checked[action.id] && <span className="text-xs font-black text-black">✓</span>}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">{action.label}</span>
              <span className="mt-0.5 block text-xs" style={{ color: MUTED }}>{action.time}</span>
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function StepPlan() {
  const [open, setOpen] = useState(0);

  return (
    <Panel>
      <SectionHeader eyebrow="30-day plan" title="Step-by-step growth plan" />
      <div className="divide-y" style={{ borderColor: LINE }}>
        {PLAN_STEPS.map((step, index) => (
          <div key={step.phase}>
            <button onClick={() => setOpen(open === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GREEN }}>{step.phase}</p>
                <p className="mt-1 text-sm font-bold text-white">{step.title}</p>
                <p className="mt-1 text-xs" style={{ color: MUTED }}>{step.goal}</p>
              </div>
              <span className="text-xl" style={{ color: MUTED }}>{open === index ? '-' : '+'}</span>
            </button>
            {open === index && (
              <ol className="space-y-2 px-4 pb-4">
                {step.tasks.map((task, i) => (
                  <li key={task} className="grid grid-cols-[28px_1fr] gap-2 text-sm leading-snug text-gray-300">
                    <span className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-black" style={{ background: GREEN }}>{i + 1}</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

const FUNNEL = [
  { stage: 'Awareness', metric: 'Impressions and comments', action: 'Clue posts, replies, group discussion, creator mentions' },
  { stage: 'Visit', metric: 'Clicks and landing plays', action: 'Clear bio link, UTM links, one simple call to play' },
  { stage: 'Replay', metric: 'Next-day returns', action: 'Daily reminder posts, email list, evening answer reveal' },
  { stage: 'Share', metric: 'Score posts and tags', action: 'Ask players to challenge one mate after hard games' },
];

function Funnel() {
  return (
    <Panel>
      <SectionHeader eyebrow="Operating model" title="Marketing funnel to watch" />
      <div className="grid gap-3 p-4 md:grid-cols-4">
        {FUNNEL.map((item, index) => (
          <div key={item.stage} className="rounded-lg p-3" style={{ background: PANEL_2, border: `1px solid ${LINE}` }}>
            <p className="text-xs font-bold" style={{ color: GREEN }}>0{index + 1}</p>
            <p className="mt-2 text-sm font-bold text-white">{item.stage}</p>
            <p className="mt-2 text-xs font-semibold" style={{ color: MUTED }}>{item.metric}</p>
            <p className="mt-2 text-xs leading-relaxed text-gray-300">{item.action}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const CHANNELS = [
  {
    name: 'Reddit',
    stance: 'Earn trust first',
    cadence: '10 comments : 1 link',
    color: '#ff6a2a',
    moves: [
      'Use r/nrl for discussion, not direct acquisition, until karma and comment history look natural.',
      'Post questions that NRL fans want to answer: underrated players, hardest trivia, Origin memories.',
      'When you finally mention the site, ask for feedback from footy fans and disclose that you built it.',
      'Avoid repeating the same link across communities; that is the fastest path to another removal.',
    ],
  },
  {
    name: 'X',
    stance: 'Reply-led discovery',
    cadence: '2 posts + 8 replies daily',
    color: '#38bdf8',
    moves: [
      'Post a clue in the morning and an answer/fact at night.',
      'Reply under journalists, club accounts, fan accounts, and live match threads with relevant trivia.',
      'Use fewer hashtags: #NRL and #NRLTwitter are enough.',
      'Do not expect cold posts to work until replies are creating profile visits.',
    ],
  },
  {
    name: 'Facebook',
    stance: 'Groups before Page reach',
    cadence: '1 useful group action daily',
    color: '#4a9ef5',
    moves: [
      'Use the Page as your official home, but expect groups to drive reach.',
      'Read group rules, comment first, and post score-style content instead of obvious promotion.',
      'Tailor posts to the club when the day\'s answer has a club connection.',
      'If someone asks for the link, reply manually rather than pasting the same link everywhere.',
    ],
  },
  {
    name: 'Creators',
    stance: 'Small pages are the wedge',
    cadence: '10 personal DMs weekly',
    color: '#facc15',
    moves: [
      'Target podcasts, fan pages, meme pages, stats accounts, and Warriors-focused NZ pages.',
      'Lead with why their audience would enjoy the daily challenge.',
      'Offer a no-pressure shout-out, custom weekly leaderboard, or challenge post.',
      'Track responses and follow up once after a week with a new interesting stat.',
    ],
  },
];

function ChannelPlaybooks() {
  return (
    <Panel>
      <SectionHeader eyebrow="Channels" title="AUS + NZ rugby league playbooks" />
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {CHANNELS.map(channel => (
          <article key={channel.name} className="rounded-lg p-4" style={{ background: PANEL_2, border: `1px solid ${LINE}` }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">{channel.name}</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: channel.color }}>{channel.stance}</p>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: channel.color, background: `${channel.color}18` }}>{channel.cadence}</span>
            </div>
            <ul className="mt-4 space-y-2">
              {channel.moves.map(move => (
                <li key={move} className="flex gap-2 text-sm leading-snug text-gray-300">
                  <span style={{ color: channel.color }}>-</span>
                  <span>{move}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Panel>
  );
}

const AUDIENCES = [
  { segment: 'NZ Warriors fans', hook: 'One-club legends, Kiwi internationals, trans-Tasman pride', where: 'Warriors groups, NZ league pages, X replies during Warriors news' },
  { segment: 'Queensland fans', hook: 'Origin heroes, Broncos/Cowboys/Titans nostalgia, Maroons debate', where: 'Club groups, Origin threads, live match windows' },
  { segment: 'NSW fans', hook: 'Blues selection debates, Sydney club history, old-school NRL names', where: 'r/nrl, club groups, journalists covering team lists' },
  { segment: 'Fantasy and stats fans', hook: 'Difficulty rate, one-clue percentage, fastest solve', where: 'SuperCoach groups, stats pages, weekly recap posts' },
  { segment: 'Casual fans', hook: 'Six clues means you do not need expert recall', where: 'Facebook Page, friends sharing scores, broad NRL hashtags' },
];

function AudienceMap() {
  return (
    <Panel>
      <SectionHeader eyebrow="Targeting" title="Audience angles" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr style={{ color: MUTED, background: '#071016' }}>
              <th className="px-4 py-3 font-semibold">Segment</th>
              <th className="px-4 py-3 font-semibold">Hook</th>
              <th className="px-4 py-3 font-semibold">Where to show up</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: LINE }}>
            {AUDIENCES.map(row => (
              <tr key={row.segment} className="align-top">
                <td className="px-4 py-3 font-bold text-white">{row.segment}</td>
                <td className="px-4 py-3 text-gray-300">{row.hook}</td>
                <td className="px-4 py-3 text-gray-300">{row.where}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

const X_REPLY_RULES = [
  'Reply to the post in front of you first. The game link is optional and usually unnecessary.',
  'Use specific NRL knowledge: player names, clubs, years, Origin moments, stats, or memory hooks.',
  'Ask a small question when possible. Questions create replies better than statements.',
  'Keep most replies under 160 characters so they read like a person, not a brand post.',
  'Only mention Set For Six after you have added value, or when the topic is directly trivia/player-history related.',
];

const X_REPLY_SCENARIOS = [
  {
    group: 'Matchday chatter',
    aim: 'Join live conversation without forcing the game.',
    prompts: [
      {
        label: 'Player comparison',
        use: 'When people are debating a standout performance.',
        text: 'Feels like the kind of game people will bring up in 10 years when arguing how good [PLAYER] actually was.',
      },
      {
        label: 'Memory hook',
        use: 'When a player has a big moment or milestone.',
        text: 'That is going straight into the "[PLAYER] was better than people remember" file.',
      },
      {
        label: 'Debate starter',
        use: 'When a club wins or loses through one player.',
        text: 'Where does that rank among [CLUB] individual performances in the last few seasons?',
      },
      {
        label: 'Trivia angle',
        use: 'When a less obvious player is trending.',
        text: 'This is the exact type of player who makes a brutal clue 1. Everyone knows the name, but not the career details.',
      },
    ],
  },
  {
    group: 'Journalists and analysts',
    aim: 'Sound informed, not thirsty for clicks.',
    prompts: [
      {
        label: 'Add a stat question',
        use: 'When a journalist posts a stat or team note.',
        text: 'Interesting one. Do you think [PLAYER] gets remembered more for peak impact or longevity?',
      },
      {
        label: 'Selection debate',
        use: 'Around team lists, Origin, injuries, or positional changes.',
        text: 'The hard part with [PLAYER] is separating current form from reputation. What do you weigh more for this spot?',
      },
      {
        label: 'Historical comparison',
        use: 'When a post references a record, streak, or milestone.',
        text: 'Who is the closest modern comparison for that career arc? I keep landing on [PLAYER], but not sure it is perfect.',
      },
      {
        label: 'Low-key game mention',
        use: 'Only when the original post is about trivia, history, records, or guessing players.',
        text: 'This is exactly why I built Set For Six. NRL history has so many players everyone remembers, but only after the right clue.',
      },
    ],
  },
  {
    group: 'Club fan accounts',
    aim: 'Use club pride and nostalgia.',
    prompts: [
      {
        label: 'Club legend prompt',
        use: 'When a club posts an old photo, milestone, or alumni content.',
        text: 'There are at least three [CLUB] players from that era who would make elite trivia answers.',
      },
      {
        label: 'Underrated player',
        use: 'When fans are discussing past squads.',
        text: 'Most underrated [CLUB] player of the NRL era? I feel like [PLAYER] never gets enough credit.',
      },
      {
        label: 'One-club hook',
        use: 'For loyalty, milestone, retirement, or Hall of Fame posts.',
        text: 'One-club careers always make better trivia clues. You can usually tell who actually watched them.',
      },
      {
        label: 'Club-specific soft mention',
        use: 'Only when today\'s answer genuinely connects to the club.',
        text: 'Today\'s Set For Six answer has a [CLUB] link. I reckon proper fans get it by clue 3.',
      },
    ],
  },
  {
    group: 'Fan and meme accounts',
    aim: 'Be casual and conversational.',
    prompts: [
      {
        label: 'Funny but useful',
        use: 'When a player is being praised or roasted.',
        text: 'The streets will never forget [PLAYER]. The stats might, but the group chats will not.',
      },
      {
        label: 'Prompt replies',
        use: 'When a post asks for opinions.',
        text: 'Give me the most "you had to be there" NRL player. Not the best, just the one YouTube clips do not explain properly.',
      },
      {
        label: 'Hard clue angle',
        use: 'When a niche name appears.',
        text: 'If this was clue 1, half of NRL Twitter is cooked.',
      },
      {
        label: 'No-link invitation',
        use: 'When someone directly engages with trivia or guessing.',
        text: 'I have been turning these kinds of names into daily clues. The hardest part is making clue 1 fair but not obvious.',
      },
    ],
  },
  {
    group: 'When someone replies to you',
    aim: 'Turn attention into conversation before link clicks.',
    prompts: [
      {
        label: 'If they guess a player',
        use: 'A person replies with a name or opinion.',
        text: 'That is a strong shout. What clue would give it away fastest for you: club, Origin, position, or career stat?',
      },
      {
        label: 'If they ask what Set For Six is',
        use: 'Only after direct curiosity.',
        text: 'It is a free daily NRL guessing game: 6 clues, 1 mystery player, new one every morning. setforsix.com',
      },
      {
        label: 'If they say it was too hard',
        use: 'After a player complains or jokes about difficulty.',
        text: 'Fair. I want clue 1 to reward sicko-level NRL memory, but clue 4 or 5 should still feel gettable.',
      },
      {
        label: 'If they share a score',
        use: 'When someone posts a result.',
        text: 'That is a proper score. If you got it before clue 3, you definitely know your footy.',
      },
    ],
  },
];

function XReplyLab() {
  const [copied, setCopied] = useState(null);
  const [open, setOpen] = useState(0);

  async function copy(id, text) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <Panel>
      <SectionHeader eyebrow="X reply lab" title="Reply patterns that do not read like promotion" />
      <div className="grid gap-3 p-4 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-lg p-4" style={{ background: PANEL_2, border: `1px solid ${LINE}` }}>
          <p className="text-sm font-bold text-white">Rules before replying</p>
          <ul className="mt-3 space-y-2">
            {X_REPLY_RULES.map(rule => (
              <li key={rule} className="flex gap-2 text-sm leading-snug text-gray-300">
                <span style={{ color: GREEN }}>-</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${LINE}` }}>
          {X_REPLY_SCENARIOS.map((scenario, scenarioIndex) => (
            <div key={scenario.group} style={{ borderTop: scenarioIndex === 0 ? 'none' : `1px solid ${LINE}` }}>
              <button onClick={() => setOpen(open === scenarioIndex ? -1 : scenarioIndex)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left" style={{ background: '#071016' }}>
                <div>
                  <p className="text-sm font-bold text-white">{scenario.group}</p>
                  <p className="mt-0.5 text-xs" style={{ color: MUTED }}>{scenario.aim}</p>
                </div>
                <span className="text-lg" style={{ color: MUTED }}>{open === scenarioIndex ? '-' : '+'}</span>
              </button>

              {open === scenarioIndex && (
                <div className="divide-y" style={{ borderColor: LINE }}>
                  {scenario.prompts.map(prompt => {
                    const id = `${scenario.group}-${prompt.label}`;
                    return (
                      <article key={prompt.label} className="px-4 py-3" style={{ background: PANEL_2 }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: GREEN }}>{prompt.label}</p>
                            <p className="mt-1 text-xs" style={{ color: MUTED }}>{prompt.use}</p>
                          </div>
                          <button
                            onClick={() => copy(id, prompt.text)}
                            className="rounded px-3 py-1.5 text-xs font-bold"
                            style={{ color: copied === id ? '#061016' : GREEN, background: copied === id ? GREEN : 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.28)' }}
                          >
                            {copied === id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <p className="mt-3 rounded-lg p-3 text-sm leading-relaxed text-gray-200" style={{ background: '#071016', border: `1px solid ${LINE}` }}>{prompt.text}</p>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

const TEMPLATES = [
  {
    id: 'x-clue',
    channel: 'X',
    title: 'Morning clue post',
    text: 'Today\'s Set For Six is live.\n\nClue 1: "[PASTE CLUE]"\n\nSix clues. One mystery NRL player. Can you get it before your mates?\n\nsetforsix.com #NRL #NRLTwitter',
  },
  {
    id: 'x-reply',
    channel: 'X',
    title: 'Reply under live NRL conversation',
    text: 'This is exactly the kind of player that makes a Set For Six clue brutal. I reckon today\'s one is gettable in 3 if you know your [CLUB/ORIGIN] history.',
  },
  {
    id: 'x-journo',
    channel: 'X',
    title: 'Journalist reply',
    text: 'Interesting one. Do you think [PLAYER] gets remembered more for peak impact or longevity?',
  },
  {
    id: 'x-club-history',
    channel: 'X',
    title: 'Club history reply',
    text: 'Most underrated [CLUB] player of the NRL era? I feel like [PLAYER] never gets enough credit.',
  },
  {
    id: 'x-direct-ask',
    channel: 'X',
    title: 'When someone asks what the game is',
    text: 'It is a free daily NRL guessing game: 6 clues, 1 mystery player, new one every morning. setforsix.com',
  },
  {
    id: 'reddit-karma',
    channel: 'Reddit',
    title: 'Karma-building discussion',
    text: 'Who is the NRL player everyone remembers as great, but still somehow underrates?\n\nI keep coming back to [PLAYER] because [ONE SPECIFIC REASON]. Curious who other people would pick.',
  },
  {
    id: 'reddit-feedback',
    channel: 'Reddit',
    title: 'Feedback post after trust is built',
    text: 'I built a free daily NRL guessing game and would genuinely love feedback from people who know their footy.\n\nIt is six clues, one mystery player, and a new game each day. I am trying to make the clues hard enough for diehards but still playable for casual fans.\n\nIf anyone has two minutes, I would appreciate thoughts on whether the clues feel fair: setforsix.com',
  },
  {
    id: 'facebook-group',
    channel: 'Facebook',
    title: 'Group-safe score post',
    text: 'Took me [X] clues on today\'s Set For Six. The first clue had me nowhere, but clue [Y] gave it away.\n\nAnyone else playing today?',
  },
  {
    id: 'creator-dm',
    channel: 'Creator',
    title: 'Small creator DM',
    text: 'Hey [NAME] - I built Set For Six, a free daily NRL player guessing game. Your audience seems exactly like the kind of fans who would argue over the clues.\n\nNo pressure, but if you want to try today\'s puzzle I would love feedback. Happy to shout out your page in a weekly recap if your followers get around it.',
  },
];

function CopyBank() {
  const [copied, setCopied] = useState(null);
  const [filter, setFilter] = useState('All');
  const filters = ['All', ...new Set(TEMPLATES.map(t => t.channel))];
  const visible = filter === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.channel === filter);

  async function copy(id, text) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <Panel>
      <SectionHeader
        eyebrow="Copy bank"
        title="Templates to adapt, not paste blindly"
        action={
          <div className="flex flex-wrap gap-1">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded px-2.5 py-1 text-xs font-bold"
                style={{ color: filter === f ? '#061016' : MUTED, background: filter === f ? GREEN : '#071016', border: `1px solid ${LINE}` }}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />
      <div className="divide-y" style={{ borderColor: LINE }}>
        {visible.map(template => (
          <article key={template.id} className="px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GREEN }}>{template.channel}</p>
                <h3 className="mt-1 text-sm font-bold text-white">{template.title}</h3>
              </div>
              <button
                onClick={() => copy(template.id, template.text)}
                className="rounded px-3 py-1.5 text-xs font-bold"
                style={{ color: copied === template.id ? '#061016' : GREEN, background: copied === template.id ? GREEN : 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.28)' }}
              >
                {copied === template.id ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg p-3 font-sans text-xs leading-relaxed text-gray-300" style={{ background: '#071016', border: `1px solid ${LINE}` }}>{template.text}</pre>
          </article>
        ))}
      </div>
    </Panel>
  );
}

const TRACKERS = [
  { id: 'x_replies', label: 'X replies made today', target: '8' },
  { id: 'reddit_comments', label: 'Reddit comments without links', target: '2' },
  { id: 'fb_groups', label: 'Facebook group interactions', target: '1' },
  { id: 'creator_dms', label: 'Creator DMs this week', target: '10' },
  { id: 'share_posts', label: 'Friend/player score shares', target: '3' },
];

function Tracker() {
  const [values, setValues] = useState(() => readLocalJson('mkt_tracker'));

  function update(id, value) {
    const next = { ...values, [id]: value };
    setValues(next);
    localStorage.setItem('mkt_tracker', JSON.stringify(next));
  }

  return (
    <Panel>
      <SectionHeader eyebrow="Manual tracking" title="Inputs that create distribution" />
      <div className="divide-y" style={{ borderColor: LINE }}>
        {TRACKERS.map(item => (
          <label key={item.id} className="grid grid-cols-[1fr_72px_56px] items-center gap-3 px-4 py-3">
            <span className="text-sm font-semibold text-white">{item.label}</span>
            <input
              value={values[item.id] ?? ''}
              onChange={e => update(item.id, e.target.value)}
              inputMode="numeric"
              className="rounded px-3 py-2 text-sm text-white outline-none"
              style={{ background: '#071016', border: `1px solid ${LINE}` }}
            />
            <span className="text-xs" style={{ color: MUTED }}>/{item.target}</span>
          </label>
        ))}
      </div>
    </Panel>
  );
}

const LINKS = [
  { label: 'Vercel Analytics', url: 'https://vercel.com/nero1948s-projects/footyiq/analytics' },
  { label: 'Supabase', url: 'https://supabase.com/dashboard' },
  { label: 'X profile', url: 'https://x.com/setforsixnrl' },
  { label: 'X Analytics', url: 'https://analytics.twitter.com' },
  { label: 'r/nrl', url: 'https://reddit.com/r/nrl' },
  { label: 'Facebook Pages', url: 'https://www.facebook.com/pages/create' },
];

function QuickLinks() {
  return (
    <Panel>
      <SectionHeader eyebrow="Launch pad" title="Platform links" />
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {LINKS.map(link => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-lg px-3 py-3 text-sm font-bold text-white" style={{ background: PANEL_2, border: `1px solid ${LINE}` }}>
            {link.label}
          </a>
        ))}
      </div>
    </Panel>
  );
}

function Hero({ stats, today }) {
  const sevenDayAverage = useMemo(() => {
    const lastSeven = stats.chartData.slice(-7);
    const total = lastSeven.reduce((sum, item) => sum + item.count, 0);
    return Math.round(total / Math.max(lastSeven.length, 1));
  }, [stats.chartData]);

  return (
    <div className="relative overflow-hidden rounded-lg px-5 py-6 md:px-7 md:py-8" style={{ background: '#071016', border: `1px solid ${LINE}` }}>
      <div className="absolute inset-y-0 right-0 hidden w-1/2 md:block" aria-hidden>
        <svg viewBox="0 0 520 320" className="h-full w-full opacity-20">
          <path d="M260 16C430 16 504 90 504 160S430 304 260 304 16 230 16 160 90 16 260 16Z" fill="none" stroke={GREEN} strokeWidth="6" />
          <path d="M16 160c70 20 150 30 244 30s174-10 244-30" fill="none" stroke={GREEN} strokeWidth="4" />
          <path d="M260 62v196" stroke={GREEN} strokeWidth="4" />
          {[112, 136, 160, 184, 208].map(y => <path key={y} d={`M232 ${y}h56`} stroke={GREEN} strokeWidth="7" strokeLinecap="round" />)}
        </svg>
      </div>
      <div className="relative max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.26em]" style={{ color: GREEN }}>Set For Six growth command</p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">Get the daily NRL game in front of AUS and NZ league fans.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: MUTED }}>
          Focus on trust-led community participation, matchday replies, club-specific hooks, and creator outreach. The target is not one viral post; it is a repeatable daily loop that turns NRL attention into returning players.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatCard label="Today" value={stats.todayPlays.toLocaleString()} note={today} tone="#60a5fa" />
          <StatCard label="7-day avg" value={sevenDayAverage.toLocaleString()} note="Daily plays" />
          <StatCard label="Subscribers" value={stats.subscribers.toLocaleString()} note="Owned audience" tone="#facc15" />
        </div>
      </div>
    </div>
  );
}

export default function MarketingClient({ stats, authed }) {
  if (!authed) return <PasswordForm />;

  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Australia/Sydney',
  });

  return (
    <main className="min-h-screen px-4 py-5 text-white md:py-8" style={{ background: '#061016' }}>
      <div className="mx-auto max-w-6xl space-y-4">
        <Hero stats={stats} today={today} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total plays" value={stats.totalPlays.toLocaleString()} note="All time" />
          <StatCard label="Plays today" value={stats.todayPlays.toLocaleString()} note="Sydney time" tone="#60a5fa" />
          <StatCard label="Win rate" value={`${stats.winRate}%`} note="Solved attempts" tone="#a78bfa" />
          <StatCard label="Games live" value={stats.gamesLive.toLocaleString()} note="Content runway" tone="#fb923c" />
          <StatCard label="Email list" value={stats.subscribers.toLocaleString()} note="Daily reminder base" tone="#facc15" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <GrowthChart data={stats.chartData} />
          <DailyChecklist />
        </div>

        <Funnel />

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <StepPlan />
          <ChannelPlaybooks />
        </div>

        <XReplyLab />

        <AudienceMap />

        <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
          <CopyBank />
          <div className="space-y-4">
            <Tracker />
            <QuickLinks />
          </div>
        </div>
      </div>
    </main>
  );
}
