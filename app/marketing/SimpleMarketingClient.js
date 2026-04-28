'use client';

import { useMemo, useState } from 'react';

const GREEN = '#00e676';
const PANEL = '#101820';
const PANEL_2 = '#0d141b';
const LINE = 'rgba(255,255,255,0.09)';
const MUTED = '#8b98a8';
const PLAY_URL = 'https://www.setforsix.com/play';

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

function Panel({ children, className = '' }) {
  return (
    <section className={cx('rounded-lg', className)} style={{ background: PANEL, border: `1px solid ${LINE}` }}>
      {children}
    </section>
  );
}

function SectionHeader({ eyebrow, title, note }) {
  return (
    <div className="border-b px-4 py-4" style={{ borderColor: LINE }}>
      {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: GREEN }}>{eyebrow}</p>}
      <h2 className="mt-1 text-base font-bold text-white">{title}</h2>
      {note && <p className="mt-1 text-xs leading-relaxed" style={{ color: MUTED }}>{note}</p>}
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

function CopyButton({ text, id, copied, onCopy }) {
  return (
    <button
      onClick={() => onCopy(id, text)}
      className="rounded px-3 py-1.5 text-xs font-bold"
      style={{
        color: copied === id ? '#061016' : GREEN,
        background: copied === id ? GREEN : 'rgba(0,230,118,0.08)',
        border: '1px solid rgba(0,230,118,0.28)',
      }}
    >
      {copied === id ? 'Copied' : 'Copy'}
    </button>
  );
}

function CopyCard({ id, channel, title, when, text, copied, onCopy }) {
  return (
    <article className="rounded-lg p-4" style={{ background: PANEL_2, border: `1px solid ${LINE}` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GREEN }}>{channel}</p>
          <h3 className="mt-1 text-sm font-bold text-white">{title}</h3>
          {when && <p className="mt-1 text-xs" style={{ color: MUTED }}>{when}</p>}
        </div>
        <CopyButton id={id} text={text} copied={copied} onCopy={onCopy} />
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-lg p-3 font-sans text-sm leading-relaxed text-gray-200" style={{ background: '#071016', border: `1px solid ${LINE}` }}>{text}</pre>
    </article>
  );
}

function Checklist({ items }) {
  const todayKey = `mkt_simple_${new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })}`;
  const [checked, setChecked] = useState(() => readLocalJson(todayKey));
  const done = items.filter(item => checked[item.id]).length;

  function toggle(id) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    localStorage.setItem(todayKey, JSON.stringify(next));
  }

  return (
    <Panel>
      <SectionHeader eyebrow="Today's path" title={`Simple promotion loop ${done}/${items.length}`} note="Do these in order. The goal is steady useful activity, not blasting links everywhere." />
      <div className="divide-y" style={{ borderColor: LINE }}>
        {items.map((item, index) => (
          <button key={item.id} onClick={() => toggle(item.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-black" style={{ background: checked[item.id] ? GREEN : '#071016', color: checked[item.id] ? '#000' : MUTED, border: `1px solid ${checked[item.id] ? GREEN : LINE}` }}>
              {checked[item.id] ? '✓' : index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-white">{item.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: MUTED }}>{item.detail}</span>
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function TodayGame({ game }) {
  return (
    <Panel>
      <SectionHeader eyebrow="Today's puzzle" title={game ? `Game #${game.gameNumber}: ${game.answer}` : 'No game loaded'} note="Use the clues as hooks. Avoid spoiling the answer until the evening." />
      {game ? (
        <div className="p-4">
          <ol className="space-y-2">
            {game.clues.map((clue, index) => (
              <li key={clue} className="grid grid-cols-[28px_1fr] gap-3 text-sm leading-relaxed text-gray-300">
                <span className="flex h-6 w-6 items-center justify-center rounded text-xs font-black text-black" style={{ background: index === 0 ? GREEN : 'rgba(255,255,255,0.16)', color: index === 0 ? '#000' : '#fff' }}>{index + 1}</span>
                <span>{clue}</span>
              </li>
            ))}
          </ol>
          {game.facts?.[0] && <p className="mt-4 rounded-lg p-3 text-sm text-gray-300" style={{ background: '#071016', border: `1px solid ${LINE}` }}>Evening fact: {game.facts[0]}</p>}
        </div>
      ) : (
        <p className="p-4 text-sm" style={{ color: MUTED }}>Today&apos;s game was not found, so the templates will use placeholders.</p>
      )}
    </Panel>
  );
}

function buildTemplates(game) {
  const clue1 = game?.clues?.[0] ?? '[PASTE CLUE 1]';
  const clue2 = game?.clues?.[1] ?? '[PASTE CLUE 2]';
  const clue3 = game?.clues?.[2] ?? '[PASTE CLUE 3]';
  const answer = game?.answer ?? '[ANSWER]';
  const fact = game?.facts?.[0] ?? '[PASTE ONE FACT]';

  return [
    {
      id: 'x-morning',
      channel: 'X/Twitter',
      title: 'Morning clue post',
      when: 'Post from @setforsix before work or around team/news chatter.',
      text: `Today's Set For Six is live.\n\nClue 1:\n"${clue1}"\n\n6 clues. 1 mystery NRL player.\nCan you get it before clue 3?\n\n${PLAY_URL}\n\n#NRL #NRLTwitter`,
    },
    {
      id: 'x-second-clue',
      channel: 'X/Twitter',
      title: 'Follow-up if the first post gets nothing',
      when: 'Use 2-4 hours later. No shame if the first one is quiet.',
      text: `Clue 2 for today's Set For Six:\n"${clue2}"\n\nIf clue 1 cooked you, this one should start narrowing it down.\n\n${PLAY_URL}`,
    },
    {
      id: 'x-reply',
      channel: 'X/Twitter',
      title: 'Soft reply under a relevant NRL post',
      when: 'Use under player-history, Dally M, milestone, club nostalgia, or selection posts.',
      text: `This is exactly the type of player who makes a good Set For Six clue.\n\nEveryone knows the name once it is revealed, but clue 1 can be brutal.`,
    },
    {
      id: 'x-evening',
      channel: 'X/Twitter',
      title: 'Evening answer reveal',
      when: 'Post after most people have had a chance to play.',
      text: `Today's Set For Six answer was ${answer}.\n\nOne clue was:\n"${clue3}"\n\n${fact}\n\nTomorrow's game goes live in the morning:\n${PLAY_URL}`,
    },
    {
      id: 'reddit-discussion',
      channel: 'Reddit',
      title: 'Discussion post or comment with no link',
      when: 'Use from the Set For Six Reddit account. Build trust before linking.',
      text: `Who is the best NRL player who would be hard to guess from career clues alone?\n\nI always find players with multiple clubs or a weird representative career make the best trivia names.`,
    },
    {
      id: 'reddit-feedback',
      channel: 'Reddit',
      title: 'Feedback ask after you have commented first',
      when: 'Use sparingly. Be transparent that you built it.',
      text: `I built a daily NRL player guessing game and I am trying to make the clues tough but fair.\n\nToday's first clue was:\n"${clue1}"\n\nWould that make you want to keep guessing, or is it too obscure?`,
    },
    {
      id: 'facebook-personal',
      channel: 'Personal Facebook',
      title: 'Gentle personal post',
      when: 'Use from your personal account. Make it sound like a player, not a page.',
      text: `I got today's Set For Six in [X]/6.\n\nFirst clue had me nowhere:\n"${clue1}"\n\nAnyone else having a crack? ${PLAY_URL}`,
    },
  ];
}

function PostBank({ templates }) {
  const [copied, setCopied] = useState(null);

  async function copy(id, text) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <Panel>
      <SectionHeader eyebrow="Posts" title="Copy for today" note="Start with X morning. Use Reddit mostly as discussion. Use personal Facebook gently and infrequently." />
      <div className="grid gap-3 p-4 lg:grid-cols-2">
        {templates.map(template => (
          <CopyCard key={template.id} {...template} copied={copied} onCopy={copy} />
        ))}
      </div>
    </Panel>
  );
}

function ReplyBank() {
  const [copied, setCopied] = useState(null);
  const replies = [
    {
      id: 'dally-m',
      title: 'Dally M / surprise leaderboard reply',
      text: 'This is why early-season Dally M voting is fun. Some names look surprising until you actually watch the workload every week.',
    },
    {
      id: 'history',
      title: 'History/trivia reply',
      text: 'That is a proper NRL memory test. Easy name after the reveal, hard name if you only get one clue.',
    },
    {
      id: 'club',
      title: 'Club nostalgia reply',
      text: 'There are a few players from that era who would make brutal trivia answers. Everyone remembers the moments, not always the career path.',
    },
    {
      id: 'engage',
      title: 'Ask a question back',
      text: 'Who is the first player from that squad you would use in a trivia question?',
    },
  ];

  async function copy(id, text) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <Panel>
      <SectionHeader eyebrow="Replies" title="Low-promo replies for X and Reddit" note="Use these more than links. Replies are how a new account gets seen." />
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {replies.map(reply => (
          <CopyCard key={reply.id} id={reply.id} channel="Reply" title={reply.title} text={reply.text} copied={copied} onCopy={copy} />
        ))}
      </div>
    </Panel>
  );
}

function Tracker() {
  const [values, setValues] = useState(() => readLocalJson('mkt_simple_tracker'));
  const rows = [
    ['x_posts', 'X posts from @setforsix', '1-2'],
    ['x_replies', 'Useful X replies', '8'],
    ['reddit_comments', 'Reddit comments without links', '3'],
    ['fb_posts', 'Personal FB/group actions', '0-1'],
    ['players', 'Players today', 'Watch trend'],
  ];

  function update(id, value) {
    const next = { ...values, [id]: value };
    setValues(next);
    localStorage.setItem('mkt_simple_tracker', JSON.stringify(next));
  }

  return (
    <Panel>
      <SectionHeader eyebrow="Track" title="Daily input tracker" />
      <div className="divide-y" style={{ borderColor: LINE }}>
        {rows.map(([id, label, target]) => (
          <label key={id} className="grid grid-cols-[1fr_72px_72px] items-center gap-3 px-4 py-3">
            <span className="text-sm font-semibold text-white">{label}</span>
            <input
              value={values[id] ?? ''}
              onChange={e => update(id, e.target.value)}
              inputMode="numeric"
              className="rounded px-3 py-2 text-sm text-white outline-none"
              style={{ background: '#071016', border: `1px solid ${LINE}` }}
            />
            <span className="text-xs" style={{ color: MUTED }}>{target}</span>
          </label>
        ))}
      </div>
    </Panel>
  );
}

function QuickLinks() {
  const links = [
    ['Play page', PLAY_URL],
    ['X profile', 'https://x.com/setforsixnrl'],
    ['r/nrl', 'https://reddit.com/r/nrl'],
    ['Reddit submit', 'https://reddit.com/submit'],
    ['Vercel Analytics', 'https://vercel.com/nero1948s-projects/footyiq/analytics'],
    ['Supabase', 'https://supabase.com/dashboard'],
  ];

  return (
    <Panel>
      <SectionHeader eyebrow="Links" title="Launch pad" />
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {links.map(([label, url]) => (
          <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg px-3 py-3 text-sm font-bold text-white" style={{ background: PANEL_2, border: `1px solid ${LINE}` }}>
            {label}
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
    <div className="rounded-lg px-5 py-6 md:px-7" style={{ background: '#071016', border: `1px solid ${LINE}` }}>
      <p className="text-xs font-bold uppercase tracking-[0.26em]" style={{ color: GREEN }}>Set For Six promotion path</p>
      <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-white md:text-4xl">Post the clue. Join the conversation. Ask for the play.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed" style={{ color: MUTED }}>
        Use @setforsix for X and Reddit. Use personal Facebook lightly. The daily job is simple: one clue post, useful replies, one discussion prompt, then an evening reveal.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <StatCard label="Today" value={stats.todayPlays.toLocaleString()} note={today} tone="#60a5fa" />
        <StatCard label="7-day avg" value={sevenDayAverage.toLocaleString()} note="Unique daily players" />
        <StatCard label="Email list" value={stats.subscribers.toLocaleString()} note="Owned audience" tone="#facc15" />
        <StatCard label="Win rate" value={`${stats.winRate}%`} note="Solved attempts" tone="#a78bfa" />
      </div>
    </div>
  );
}

export default function SimpleMarketingClient({ stats, authed }) {
  if (!authed) return <PasswordForm />;

  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Australia/Sydney',
  });
  const templates = buildTemplates(stats.todayGame);
  const checklist = [
    { id: 'x_morning', title: 'Post the X morning clue', detail: 'Use the first X template. It is okay if the account has no followers yet; this gives your profile a daily heartbeat.' },
    { id: 'x_replies', title: 'Reply to 8 NRL posts', detail: 'Dally M, team lists, club posts, player milestones, or match chatter. Link only if it is genuinely relevant.' },
    { id: 'reddit', title: 'Make 3 Reddit comments without a link', detail: 'Use discussion prompts. Build account history before promotion.' },
    { id: 'fb', title: 'Optional personal Facebook post', detail: 'Use once or twice a week. Keep it personal and low-pressure because the page was banned.' },
    { id: 'evening', title: 'Post the answer reveal', detail: 'Use the answer/fact template at night and point people toward tomorrow.' },
  ];

  return (
    <main className="min-h-screen px-4 py-5 text-white md:py-8" style={{ background: '#061016' }}>
      <div className="mx-auto max-w-6xl space-y-4">
        <Hero stats={stats} today={today} />

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Checklist items={checklist} />
          <TodayGame game={stats.todayGame} />
        </div>

        <PostBank templates={templates} />
        <ReplyBank />

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Tracker />
          <QuickLinks />
        </div>
      </div>
    </main>
  );
}
