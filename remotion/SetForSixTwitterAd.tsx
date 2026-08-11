import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const GREEN = '#00e676';
const ORANGE = '#fb923c';
const RED = '#f87171';
const BG = '#0a0e13';

const game = {
  number: 16,
  answer: 'Daly Cherry-Evans',
  clues: [
    'Won an NRL premiership in his debut season — scoring a try in the grand final.',
    'Was at the centre of one of the most dramatic contract sagas of the modern era.',
    'Holds the NRL era record for most field goals.',
    'Captained Queensland to repeated Origin success.',
    'First halfback in NRL history to play 300 games in the same position.',
    "Manly captain, 2011 premiership winner, 2013 Clive Churchill Medallist, and his club's most-capped player.",
  ],
  drama:
    'In 2015, Cherry-Evans signed with the Gold Coast Titans — then reversed his decision weeks later and recommitted to Manly on a reported eight-year, $10m contract.',
};

const stats = {
  totalPlayers: 60,
  solvedCount: 57,
  avgClues: '2.8',
  fastest: '11.4s',
  oneCluePercent: 23,
  distribution: [
    ['1 clue', 13],
    ['2 clues', 16],
    ['3 clues', 11],
    ['4 clues', 7],
    ['5 clues', 5],
    ['6 clues', 5],
    ['Failed', 3],
  ] as const,
};

const leaderboard = [
  {rank: 1, displayName: 'Snicko', cluesUsed: 1, totalTime: '11.4s'},
  {rank: 2, displayName: 'Secret Selector', cluesUsed: 1, totalTime: '14.4s'},
  {rank: 3, displayName: 'Reddit Clowns', cluesUsed: 1, totalTime: '17.1s'},
  {rank: 4, displayName: 'Liz', cluesUsed: 1, totalTime: '17.2s'},
  {rank: 5, displayName: 'Ya Boi, Eyesie', cluesUsed: 1, totalTime: '18.8s'},
];

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const fade = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, start + 10, end - 10, end], [0, 1, 1, 0], clamp);
const rise = (frame: number, start: number, px = 34) =>
  interpolate(frame, [start, start + 18], [px, 0], {...clamp, easing: ease});

const Background = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 900], [0, -150], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: BG, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #0a0e13 0px, #0a0e13 42px, #0c1219 42px, #0c1219 45px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: -120,
          background:
            'radial-gradient(circle at 20% 10%, rgba(0,230,118,0.22), transparent 26%), radial-gradient(circle at 82% 78%, rgba(68,153,255,0.13), transparent 30%)',
        }}
      />
      {Array.from({length: 26}).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${((i * 47 + 7) % 92) + 4}%`,
            top: `${((i * 31 + 11) % 86) + 5}%`,
            width: 4 + (i % 4),
            height: 4 + (i % 4),
            borderRadius: 999,
            background: i % 4 === 0 ? GREEN : 'rgba(255,255,255,0.7)',
            opacity: 0.1 + (i % 5) * 0.035,
            transform: `translateY(${drift * (0.25 + (i % 6) * 0.08)}px)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const Brand = ({compact = false}: {compact?: boolean}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: compact ? 12 : 18}}>
    <div
      style={{
        width: compact ? 44 : 66,
        height: compact ? 44 : 66,
        borderRadius: '50% / 42%',
        background: GREEN,
        color: '#07100c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: compact ? 22 : 32,
        fontWeight: 1000,
        boxShadow: '0 0 36px rgba(0,230,118,0.32)',
      }}
    >
      6
    </div>
    <div>
      <div style={{fontSize: compact ? 25 : 43, lineHeight: 1, fontWeight: 1000, color: 'white'}}>
        Set For Six
      </div>
      {!compact && <div style={{fontSize: 22, color: '#8b949e', marginTop: 7, fontWeight: 800}}>Daily NRL guessing game</div>}
    </div>
  </div>
);

const Card = ({children, style}: {children: React.ReactNode; style?: React.CSSProperties}) => (
  <div
    style={{
      borderRadius: 24,
      background: 'rgba(13,17,23,0.94)',
      border: '1px solid rgba(255,255,255,0.10)',
      boxShadow: '0 24px 80px rgba(0,0,0,0.34)',
      ...style,
    }}
  >
    {children}
  </div>
);

const Phone = ({children}: {children: React.ReactNode}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - fps * 2.2, fps, config: {damping: 18, stiffness: 90}});
  return (
    <div
      style={{
        position: 'absolute',
        left: 98,
        top: 320,
        width: 884,
        height: 1275,
        borderRadius: 58,
        padding: 20,
        background: 'linear-gradient(145deg, #1d2632, #06090d)',
        boxShadow: '0 44px 120px rgba(0,0,0,0.48)',
        transform: `translateY(${interpolate(s, [0, 1], [68, 0])}px) rotate(-0.8deg)`,
      }}
    >
      <div style={{width: '100%', height: '100%', borderRadius: 40, overflow: 'hidden', background: BG, border: '1px solid rgba(255,255,255,0.08)', position: 'relative'}}>
        {children}
      </div>
    </div>
  );
};

const HeaderText = ({
  start,
  end,
  kicker,
  title,
  body,
  center = false,
}: {
  start: number;
  end: number;
  kicker: string;
  title: string;
  body?: string;
  center?: boolean;
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top: center ? 190 : 92,
        opacity: fade(frame, start, end),
        transform: `translateY(${rise(frame, start)}px)`,
        textAlign: center ? 'center' : 'left',
      }}
    >
      <div style={{fontSize: 26, color: GREEN, fontWeight: 1000, textTransform: 'uppercase'}}>{kicker}</div>
      <div style={{fontSize: center ? 79 : 61, lineHeight: 0.98, color: 'white', fontWeight: 1000, marginTop: 13}}>{title}</div>
      {body && <div style={{fontSize: 30, lineHeight: 1.22, color: '#b6c2cf', fontWeight: 800, marginTop: 21}}>{body}</div>}
    </div>
  );
};

const StatPill = ({label, value}: {label: string; value: string}) => (
  <div style={{display: 'flex', alignItems: 'baseline', gap: 8, padding: '12px 16px', borderRadius: 18, background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.20)', color: '#d1d5db', fontSize: 22, fontWeight: 800}}>
    <span style={{color: 'white', fontWeight: 1000}}>{value}</span>
    {label}
  </div>
);

const HomeScreen = () => (
  <Phone>
    <div style={{padding: 42, textAlign: 'center'}}>
      <Brand compact />
      <div style={{marginTop: 118}}>
        <div style={{fontSize: 60, lineHeight: 0.98, color: 'white', fontWeight: 1000}}>
          Guess the NRL player
          <br />
          <span style={{color: GREEN}}>Before your mates do.</span>
        </div>
        <div style={{fontSize: 27, lineHeight: 1.28, color: '#9ca3af', fontWeight: 800, marginTop: 25}}>
          Six clues. One player. Two minutes. New every day.
        </div>
      </div>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 44}}>
        <StatPill value={`${stats.totalPlayers}`} label="played yesterday" />
        <StatPill value={stats.avgClues} label="avg clues" />
        <StatPill value={stats.fastest} label="fastest" />
        <StatPill value={`${stats.oneCluePercent}%`} label="in 1 clue" />
      </div>
      <div style={{margin: '54px auto 0', width: 430, borderRadius: 24, padding: '25px 28px', background: GREEN, color: BG, fontSize: 30, fontWeight: 1000, textTransform: 'uppercase', letterSpacing: 0.5}}>
        Play today&apos;s game
      </div>
    </div>
  </Phone>
);

const ClueRow = ({i, active}: {i: number; active: boolean}) => (
  <div
    style={{
      display: 'flex',
      gap: 15,
      padding: '18px 18px',
      borderRadius: 19,
      background: active ? 'rgba(0,230,118,0.075)' : 'rgba(255,255,255,0.035)',
      border: `1px solid ${active ? 'rgba(0,230,118,0.26)' : 'rgba(255,255,255,0.07)'}`,
      borderLeft: `5px solid ${active ? GREEN : 'rgba(255,255,255,0.14)'}`,
    }}
  >
    <div style={{width: 34, height: 34, borderRadius: 999, flexShrink: 0, background: active ? GREEN : 'rgba(255,255,255,0.10)', color: active ? BG : '#8b949e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 1000}}>
      {i + 1}
    </div>
    <div style={{fontSize: 22, color: 'white', fontWeight: 850, lineHeight: 1.23}}>{game.clues[i]}</div>
  </div>
);

const PlayScreen = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const shown = Math.min(3, Math.max(1, Math.floor((frame - fps * 5.8) / 28) + 1));
  const typed = interpolate(frame, [fps * 9.2, fps * 10.55], [0, game.answer.length], clamp);
  const answer = game.answer.slice(0, Math.floor(typed));
  return (
    <Phone>
      <div style={{padding: 38}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <Brand compact />
          <div style={{borderRadius: '50% / 42%', padding: '10px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: 22, fontWeight: 1000, fontFamily: 'monospace'}}>
            0:{String(Math.min(29, Math.floor(frame / 18))).padStart(2, '0')}
          </div>
        </div>
        <div style={{marginTop: 50}}>
          <div style={{fontSize: 21, color: GREEN, fontWeight: 1000, textTransform: 'uppercase'}}>Clue {shown} of 6</div>
          <div style={{fontSize: 45, color: 'white', lineHeight: 1.04, fontWeight: 1000, marginTop: 11}}>Guess today&apos;s mystery NRL player</div>
        </div>
        <div style={{display: 'grid', gap: 16, marginTop: 34}}>
          {Array.from({length: shown}).map((_, i) => <ClueRow key={i} i={i} active={i === shown - 1} />)}
        </div>
        <div style={{position: 'absolute', left: 38, right: 38, bottom: 46}}>
          <div style={{fontSize: 18, color: '#6b7280', marginBottom: 11, fontWeight: 750}}>Type a player&apos;s full name</div>
          <div style={{borderRadius: 23, padding: '24px 25px', color: 'white', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 30, fontWeight: 900, minHeight: 84}}>
            {answer}
            <span style={{color: GREEN}}>|</span>
          </div>
        </div>
      </div>
    </Phone>
  );
};

const MiniStat = ({label, value, tone = 'white'}: {label: string; value: string; tone?: string}) => (
  <Card style={{padding: '20px 12px', textAlign: 'center', background: tone === GREEN ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.045)'}}>
    <div style={{fontSize: 16, color: '#8b949e', fontWeight: 900, textTransform: 'uppercase'}}>{label}</div>
    <div style={{fontSize: 34, color: tone, fontWeight: 1000, marginTop: 7}}>{value}</div>
  </Card>
);

const ResultScreen = () => (
  <Phone>
    <div style={{padding: 34}}>
      <Brand compact />
      <Card style={{padding: 26, marginTop: 28, textAlign: 'center', borderColor: 'rgba(0,230,118,0.24)'}}>
        <div style={{fontSize: 20, color: GREEN, fontWeight: 1000, textTransform: 'uppercase'}}>You got it</div>
        <div style={{fontSize: 45, color: 'white', fontWeight: 1000, lineHeight: 1.02, marginTop: 10}}>{game.answer}</div>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 24}}>
          <div style={{fontSize: 36, color: GREEN, fontWeight: 1000}}>3 <span style={{color: '#6b7280', fontWeight: 600}}> / 6</span></div>
          <div style={{display: 'flex', gap: 10}}>
            {[0, 1, 2, 3, 4, 5].map((n) => <div key={n} style={{width: 20, height: 20, borderRadius: 999, background: n === 2 ? GREEN : n < 3 ? RED : 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)'}} />)}
          </div>
        </div>
      </Card>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14}}>
        <MiniStat label="Time" value="29s" />
        <MiniStat label="Rank" value="#12" />
        <MiniStat label="Streak" value="5" tone={GREEN} />
      </div>
      <Card style={{padding: 18, marginTop: 14, background: 'rgba(255,255,255,0.035)'}}>
        <div style={{fontSize: 17, color: '#8b949e', fontWeight: 950, textTransform: 'uppercase', marginBottom: 12}}>Remaining clues</div>
        <div style={{display: 'grid', gap: 11}}>
          {game.clues.slice(3).map((clue, idx) => (
            <div key={clue} style={{display: 'flex', gap: 12, alignItems: 'flex-start'}}>
              <div style={{width: 29, height: 29, borderRadius: 999, flexShrink: 0, background: 'rgba(255,255,255,0.08)', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 1000}}>{idx + 4}</div>
              <div style={{fontSize: 18, lineHeight: 1.22, color: '#d1d5db', fontWeight: 760}}>{clue}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card style={{padding: 18, marginTop: 14, background: 'rgba(251,146,60,0.055)', borderColor: 'rgba(251,146,60,0.22)', borderLeft: `4px solid ${ORANGE}`}}>
        <div style={{fontSize: 21, color: ORANGE, fontWeight: 1000, marginBottom: 8}}>Drama</div>
        <div style={{fontSize: 18, lineHeight: 1.24, color: '#d1d5db', fontWeight: 760}}>{game.drama}</div>
      </Card>
    </div>
  </Phone>
);

const DistributionScreen = () => (
  <Phone>
    <div style={{padding: 38}}>
      <Brand compact />
      <div style={{marginTop: 48}}>
        <div style={{fontSize: 48, lineHeight: 1.04, color: 'white', fontWeight: 1000}}>How everyone did</div>
        <div style={{fontSize: 23, color: '#8b949e', fontWeight: 800, marginTop: 10}}>{stats.totalPlayers} players yesterday</div>
      </div>
      <Card style={{padding: 24, marginTop: 34, background: 'rgba(255,255,255,0.035)'}}>
        <div style={{display: 'grid', gap: 16}}>
          {stats.distribution.map(([label, count]) => {
            const pct = (count / stats.totalPlayers) * 100;
            const isBest = label === '2 clues';
            const isFail = label === 'Failed';
            return (
              <div key={label} style={{display: 'grid', gridTemplateColumns: '98px 1fr 34px', gap: 14, alignItems: 'center'}}>
                <div style={{fontSize: 20, color: '#9ca3af', textAlign: 'right', fontWeight: 820}}>{label}</div>
                <div style={{height: 24, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden'}}>
                  <div style={{width: `${Math.max(pct, 4)}%`, height: '100%', borderRadius: 999, background: isBest ? GREEN : isFail ? 'rgba(248,113,113,0.52)' : 'rgba(255,255,255,0.22)'}} />
                </div>
                <div style={{fontSize: 20, color: isBest ? GREEN : '#9ca3af', fontWeight: 1000, textAlign: 'right'}}>{count}</div>
              </div>
            );
          })}
        </div>
      </Card>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18}}>
        <MiniStat label="Solved" value={`${stats.solvedCount}/60`} tone={GREEN} />
        <MiniStat label="Avg solve" value={`${stats.avgClues} clues`} />
      </div>
    </div>
  </Phone>
);

const LeaderboardScreen = () => (
  <Phone>
    <div style={{padding: 38}}>
      <Brand compact />
      <div style={{marginTop: 50}}>
        <div style={{fontSize: 48, lineHeight: 1.04, color: 'white', fontWeight: 1000}}>Yesterday&apos;s leaderboard</div>
        <div style={{fontSize: 22, color: '#8b949e', fontWeight: 800, marginTop: 10}}>Game #{game.number} · fewest clues, fastest time.</div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 34}}>
        <div style={{width: 14, height: 14, borderRadius: 999, background: GREEN, boxShadow: '0 0 22px rgba(0,230,118,0.65)'}} />
        <div style={{fontSize: 20, color: '#8b949e', fontWeight: 900}}>Final</div>
        <div style={{fontSize: 20, color: '#6b7280', fontWeight: 800, marginLeft: 'auto'}}>60 players</div>
      </div>
      <div style={{display: 'grid', gap: 14, marginTop: 20}}>
        {leaderboard.map((entry) => (
          <div key={entry.rank} style={{display: 'grid', gridTemplateColumns: '58px 1fr 90px 78px', alignItems: 'center', gap: 14, padding: '21px 21px', borderRadius: 22, background: entry.rank === 1 ? 'rgba(255,184,0,0.08)' : 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `5px solid ${entry.rank === 1 ? '#ffb800' : GREEN}`}}>
            <div style={{fontSize: 27, color: entry.rank === 1 ? '#ffb800' : GREEN, fontWeight: 1000}}>#{entry.rank}</div>
            <div style={{fontSize: 27, color: 'white', fontWeight: 950, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{entry.displayName}</div>
            <div style={{fontSize: 20, color: '#9ca3af', fontWeight: 850}}>{entry.cluesUsed} clue</div>
            <div style={{fontSize: 21, color: entry.rank === 1 ? '#ffb800' : GREEN, fontWeight: 1000, fontFamily: 'monospace'}}>{entry.totalTime}</div>
          </div>
        ))}
      </div>
    </div>
  </Phone>
);

const ShareScreen = () => (
  <div style={{position: 'absolute', left: 82, right: 82, top: 490}}>
    <Card style={{padding: 36, background: '#121821', borderColor: 'rgba(0,230,118,0.22)'}}>
      <div style={{fontSize: 25, color: GREEN, fontWeight: 1000, textTransform: 'uppercase'}}>Share with mates</div>
      <div style={{display: 'grid', gap: 14, marginTop: 25}}>
        {['Your mate challenged you:', 'beat 3/6 clues in 29s.', '⬛ ⬛ 🏉 ⬜ ⬜ ⬜', '#12 of 60 yesterday', 'Can you top it?'].map((line) => (
          <div key={line} style={{fontSize: line.includes('⬛') ? 36 : 32, lineHeight: 1.15, color: line.includes('#12') ? GREEN : 'white', fontWeight: line.includes('Can you') ? 1000 : 850}}>{line}</div>
        ))}
      </div>
      <div style={{marginTop: 34, borderRadius: 21, padding: '23px 28px', background: GREEN, color: BG, textAlign: 'center', fontSize: 31, fontWeight: 1000}}>Send challenge</div>
    </Card>
  </div>
);

const FinalCta = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - fps * 25.5, fps, config: {damping: 15, stiffness: 100}});
  return (
    <div style={{position: 'absolute', inset: 0, padding: 70, display: 'flex', flexDirection: 'column', opacity: fade(frame, 765, 898)}}>
      <Brand />
      <div style={{marginTop: 270}}>
        <div style={{fontSize: 86, lineHeight: 0.94, color: 'white', fontWeight: 1000}}>New NRL puzzle.<br />Every day.</div>
        <div style={{fontSize: 34, lineHeight: 1.22, color: '#b6c2cf', fontWeight: 800, marginTop: 32}}>Six clues, one player, live leaderboard, and bragging rights in the group chat.</div>
      </div>
      <div style={{marginTop: 'auto', transform: `scale(${interpolate(s, [0, 1], [0.94, 1])})`, borderRadius: 28, padding: '30px 34px', background: GREEN, color: BG, fontSize: 45, fontWeight: 1000, textAlign: 'center', boxShadow: '0 22px 70px rgba(0,230,118,0.28)'}}>Play free at setforsix.com</div>
    </div>
  );
};

export const SetForSixTwitterAd = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <Background />
      <div style={{position: 'absolute', right: 56, bottom: 44, opacity: 0.18}}>
        <Img src={staticFile('og.png')} style={{width: 235, borderRadius: 17}} />
      </div>
      <div style={{opacity: fade(frame, 0, fps * 4.4)}}>
        <HeaderText start={0} end={fps * 4.4} kicker="Yesterday's game" title="60 NRL fans played." body="Real Set For Six screens, real clues, real results." center />
      </div>
      <div style={{opacity: fade(frame, fps * 3.8, fps * 8.0)}}>
        <HeaderText start={fps * 3.8} end={fps * 8.0} kicker="Home page" title="Daily stats up front." />
        <HomeScreen />
      </div>
      <div style={{opacity: fade(frame, fps * 7.4, fps * 12.2)}}>
        <HeaderText start={fps * 7.4} end={fps * 12.2} kicker="Real clues" title="Guess when you know." />
        <PlayScreen />
      </div>
      <div style={{opacity: fade(frame, fps * 11.5, fps * 17.1)}}>
        <HeaderText start={fps * 11.5} end={fps * 17.1} kicker="Result page" title="Answer, extra clues, drama." />
        <ResultScreen />
      </div>
      <div style={{opacity: fade(frame, fps * 16.5, fps * 20.6)}}>
        <HeaderText start={fps * 16.5} end={fps * 20.6} kicker="Stats" title="See how everyone went." />
        <DistributionScreen />
      </div>
      <div style={{opacity: fade(frame, fps * 20.0, fps * 23.8)}}>
        <HeaderText start={fps * 20.0} end={fps * 23.8} kicker="Leaderboard" title="Fastest fans on top." />
        <LeaderboardScreen />
      </div>
      <div style={{opacity: fade(frame, fps * 23.2, fps * 26.4)}}>
        <HeaderText start={fps * 23.2} end={fps * 26.4} kicker="Share with mates" title="Turn your score into a challenge." />
        <ShareScreen />
      </div>
      <FinalCta />
    </AbsoluteFill>
  );
};
