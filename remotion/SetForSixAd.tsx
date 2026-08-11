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
const YELLOW = '#ffb800';
const RED = '#ff4466';
const BG = '#0a0e13';

const clues = [
  'Won a premiership before age 24',
  'Represented Queensland in Origin',
  'Has played centre and fullback',
  'Scored 15+ tries in one NRL season',
  'Current club wears red and white',
  'Answer: Hamiso Tabuai-Fidow',
];

const leaderboard = [
  {rank: 1, name: 'Matty', score: '2 clues', time: '18.4s', color: YELLOW},
  {rank: 2, name: 'Tara', score: '3 clues', time: '24.9s', color: '#d1d5db'},
  {rank: 3, name: 'You', score: '3 clues', time: '29.1s', color: GREEN},
  {rank: 4, name: 'Jono', score: '4 clues', time: '41.6s', color: '#8b949e'},
];

const shareLines = [
  'Your mate challenged you:',
  'beat 3/6 clues in 29s.',
  '⬛ ⬛ 🏉 ⬜ ⬜ ⬜',
  '#3 of 184 today',
  'Can you top it?',
];

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const fade = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, start + 12, end - 12, end], [0, 1, 1, 0], clamp);

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const Background = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 900], [0, -180], clamp);

  return (
    <AbsoluteFill style={{backgroundColor: BG, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #0a0e13 0px, #0a0e13 46px, #0c1219 46px, #0c1219 49px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: -120,
          background:
            'radial-gradient(circle at 28% 15%, rgba(0,230,118,0.22), transparent 24%), radial-gradient(circle at 82% 70%, rgba(68,153,255,0.14), transparent 28%)',
        }}
      />
      {Array.from({length: 34}).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${((i * 47 + 9) % 94) + 3}%`,
            top: `${((i * 31 + 13) % 86) + 5}%`,
            width: 4 + (i % 5),
            height: 4 + (i % 5),
            borderRadius: 999,
            background: i % 4 === 0 ? GREEN : 'rgba(255,255,255,0.72)',
            opacity: 0.12 + (i % 5) * 0.04,
            transform: `translateY(${drift * (0.3 + (i % 6) * 0.08)}px)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const Brand = ({small = false}: {small?: boolean}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: small ? 14 : 20}}>
    <div
      style={{
        width: small ? 50 : 72,
        height: small ? 50 : 72,
        borderRadius: '50% / 42%',
        background: GREEN,
        color: '#07100c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: small ? 24 : 34,
        fontWeight: 1000,
        boxShadow: '0 0 42px rgba(0,230,118,0.32)',
      }}
    >
      6
    </div>
    <div>
      <div
        style={{
          fontSize: small ? 28 : 46,
          lineHeight: 1,
          fontWeight: 1000,
          color: 'white',
          letterSpacing: 0,
        }}
      >
        Set For Six
      </div>
      {!small && (
        <div style={{fontSize: 23, color: '#8b949e', marginTop: 8, fontWeight: 700}}>
          Daily NRL guessing game
        </div>
      )}
    </div>
  </div>
);

const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      borderRadius: 28,
      background: 'rgba(13,17,23,0.92)',
      border: '1px solid rgba(255,255,255,0.10)',
      boxShadow: '0 28px 90px rgba(0,0,0,0.34)',
      ...style,
    }}
  >
    {children}
  </div>
);

const PhoneFrame = ({children}: {children: React.ReactNode}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lift = spring({frame: frame - fps * 2.1, fps, config: {damping: 18, stiffness: 90}});

  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 330,
        width: 840,
        height: 1260,
        borderRadius: 58,
        padding: 22,
        background: 'linear-gradient(145deg, #1d2632, #06090d)',
        boxShadow: '0 46px 120px rgba(0,0,0,0.46)',
        transform: `translateY(${interpolate(lift, [0, 1], [70, 0])}px) rotate(-1.2deg)`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 42,
          overflow: 'hidden',
          background: BG,
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const ClueRow = ({index, active}: {index: number; active: boolean}) => (
  <div
    style={{
      display: 'flex',
      gap: 18,
      padding: '22px 22px',
      borderRadius: 22,
      background: active ? 'rgba(0,230,118,0.07)' : 'rgba(255,255,255,0.035)',
      border: `1px solid ${active ? 'rgba(0,230,118,0.26)' : 'rgba(255,255,255,0.07)'}`,
      borderLeft: `5px solid ${active ? GREEN : 'rgba(255,255,255,0.14)'}`,
    }}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        flexShrink: 0,
        background: active ? GREEN : 'rgba(255,255,255,0.10)',
        color: active ? BG : '#8b949e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        fontWeight: 1000,
      }}
    >
      {index + 1}
    </div>
    <div style={{fontSize: 28, color: 'white', fontWeight: 800, lineHeight: 1.25}}>
      {clues[index]}
    </div>
  </div>
);

const GameScreen = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const shown = Math.min(4, Math.max(1, Math.floor((frame - fps * 4.9) / 24) + 1));
  const typed = interpolate(frame, [fps * 8.6, fps * 10.1], [0, 21], clamp);
  const answer = 'Hamiso Tabuai-Fidow'.slice(0, Math.floor(typed));

  return (
    <PhoneFrame>
      <div style={{padding: 38}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <Brand small />
          <div
            style={{
              borderRadius: '50% / 42%',
              padding: '12px 20px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'white',
              fontSize: 24,
              fontWeight: 1000,
              fontFamily: 'monospace',
            }}
          >
            0:{String(Math.min(29, Math.floor(frame / 18))).padStart(2, '0')}
          </div>
        </div>

        <div style={{marginTop: 52}}>
          <div style={{fontSize: 22, color: GREEN, fontWeight: 1000, textTransform: 'uppercase'}}>
            Clue {shown} of 6
          </div>
          <div style={{fontSize: 48, color: 'white', lineHeight: 1.05, fontWeight: 1000, marginTop: 12}}>
            Guess today&apos;s mystery NRL player
          </div>
        </div>

        <div style={{display: 'grid', gap: 18, marginTop: 42}}>
          {Array.from({length: shown}).map((_, i) => (
            <ClueRow key={i} index={i} active={i === shown - 1} />
          ))}
        </div>

        <div style={{position: 'absolute', left: 38, right: 38, bottom: 48}}>
          <div style={{fontSize: 20, color: '#6b7280', marginBottom: 12, fontWeight: 700}}>
            Type a player&apos;s full name
          </div>
          <div
            style={{
              borderRadius: 24,
              padding: '24px 26px',
              color: answer ? 'white' : '#6b7280',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: 31,
              fontWeight: 850,
              minHeight: 88,
            }}
          >
            {answer}
            <span style={{color: GREEN}}>|</span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
};

const ResultScreen = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dots = Math.min(6, Math.max(0, Math.floor((frame - fps * 11.3) / 8)));

  return (
    <PhoneFrame>
      <div style={{padding: 40}}>
        <Brand small />
        <Card style={{padding: 34, marginTop: 70, textAlign: 'center', borderColor: 'rgba(0,230,118,0.24)'}}>
          <div style={{fontSize: 22, color: GREEN, fontWeight: 1000, textTransform: 'uppercase'}}>
            You got it
          </div>
          <div style={{fontSize: 57, color: 'white', fontWeight: 1000, lineHeight: 1.02, marginTop: 14}}>
            Hamiso Tabuai-Fidow
          </div>
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, marginTop: 34}}>
            <div style={{fontSize: 39, color: GREEN, fontWeight: 1000}}>
              3 <span style={{color: '#6b7280', fontWeight: 600}}> / 6</span>
            </div>
            <div style={{display: 'flex', gap: 12}}>
              {Array.from({length: 6}).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: i === 2 && dots > 2 ? GREEN : i < dots ? RED : 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.14)',
                  }}
                />
              ))}
            </div>
          </div>
        </Card>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 20}}>
          {[
            ['Time', '29s', '#ffffff'],
            ['Rank', '#3', '#ffffff'],
            ['Streak', '5', GREEN],
          ].map(([label, value, color]) => (
            <Card key={label} style={{padding: '24px 14px', textAlign: 'center', background: label === 'Streak' ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.045)'}}>
              <div style={{fontSize: 18, color: '#8b949e', fontWeight: 900, textTransform: 'uppercase'}}>{label}</div>
              <div style={{fontSize: 38, color, fontWeight: 1000, marginTop: 8}}>{value}</div>
            </Card>
          ))}
        </div>

        <div
          style={{
            marginTop: 22,
            borderRadius: 24,
            padding: '28px 30px',
            background: GREEN,
            color: BG,
            textAlign: 'center',
            fontSize: 34,
            fontWeight: 1000,
          }}
        >
          Challenge a mate
        </div>
      </div>
    </PhoneFrame>
  );
};

const LeaderboardScreen = () => (
  <PhoneFrame>
    <div style={{padding: 40}}>
      <Brand small />
      <div style={{marginTop: 66}}>
        <div style={{fontSize: 52, color: 'white', fontWeight: 1000, lineHeight: 1}}>Today&apos;s Leaderboard</div>
        <div style={{fontSize: 22, color: '#6b7280', marginTop: 14, fontWeight: 800}}>
          Fewest clues, then fastest time.
        </div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 44}}>
        <div style={{width: 14, height: 14, borderRadius: 999, background: GREEN, boxShadow: '0 0 22px rgba(0,230,118,0.65)'}} />
        <div style={{fontSize: 21, color: '#8b949e', fontWeight: 900}}>Live</div>
        <div style={{fontSize: 21, color: '#6b7280', fontWeight: 800, marginLeft: 'auto'}}>184 players finished</div>
      </div>
      <div style={{display: 'grid', gap: 16, marginTop: 24}}>
        {leaderboard.map((entry) => (
          <div
            key={entry.rank}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '24px 24px',
              borderRadius: 24,
              background: entry.name === 'You' ? 'rgba(0,230,118,0.10)' : 'rgba(255,255,255,0.045)',
              border: `1px solid ${entry.name === 'You' ? 'rgba(0,230,118,0.30)' : 'rgba(255,255,255,0.08)'}`,
              borderLeft: `5px solid ${entry.color}`,
            }}
          >
            <div style={{width: 70, fontSize: 32, color: entry.color, fontWeight: 1000}}>#{entry.rank}</div>
            <div style={{flex: 1, fontSize: 30, color: 'white', fontWeight: 950}}>{entry.name}</div>
            <div style={{fontSize: 24, color: '#8b949e', fontWeight: 800}}>{entry.score}</div>
            <div style={{fontSize: 25, color: entry.color, fontWeight: 1000, fontFamily: 'monospace'}}>{entry.time}</div>
          </div>
        ))}
      </div>
    </div>
  </PhoneFrame>
);

const ShareCard = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = Math.min(shareLines.length, Math.max(0, Math.floor((frame - fps * 21.4) / 11)));

  return (
    <div style={{position: 'absolute', left: 86, right: 86, top: 500}}>
      <Card style={{padding: 42, background: '#121821', borderColor: 'rgba(0,230,118,0.22)'}}>
        <div style={{fontSize: 26, color: GREEN, fontWeight: 1000, textTransform: 'uppercase'}}>Share with mates</div>
        <div style={{display: 'grid', gap: 18, marginTop: 28}}>
          {shareLines.slice(0, reveal).map((line) => (
            <div
              key={line}
              style={{
                fontSize: line.includes('⬛') ? 37 : 34,
                lineHeight: 1.18,
                color: line.includes('#3') ? GREEN : 'white',
                fontWeight: line.includes('Can you') ? 1000 : 850,
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 38,
            borderRadius: 22,
            padding: '24px 28px',
            background: GREEN,
            color: BG,
            textAlign: 'center',
            fontSize: 32,
            fontWeight: 1000,
          }}
        >
          Send challenge
        </div>
      </Card>
    </div>
  );
};

const Caption = ({
  start,
  end,
  kicker,
  title,
  body,
  align = 'left',
}: {
  start: number;
  end: number;
  kicker: string;
  title: string;
  body?: string;
  align?: 'left' | 'center';
}) => {
  const frame = useCurrentFrame();
  const opacity = fade(frame, start, end);
  const y = interpolate(frame, [start, start + 16], [26, 0], {...clamp, easing: ease});

  return (
    <div
      style={{
        position: 'absolute',
        left: 76,
        right: 76,
        top: align === 'center' ? 180 : 112,
        opacity,
        transform: `translateY(${y}px)`,
        textAlign: align,
      }}
    >
      <div style={{fontSize: 26, color: GREEN, fontWeight: 1000, textTransform: 'uppercase'}}>{kicker}</div>
      <div style={{fontSize: align === 'center' ? 82 : 66, lineHeight: 0.96, color: 'white', fontWeight: 1000, marginTop: 14}}>
        {title}
      </div>
      {body && <div style={{fontSize: 32, lineHeight: 1.22, color: '#b6c2cf', fontWeight: 800, marginTop: 22}}>{body}</div>}
    </div>
  );
};

const FinalCta = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = spring({frame: frame - fps * 25.2, fps, config: {damping: 15, stiffness: 100}});

  return (
    <div style={{position: 'absolute', inset: 0, padding: 76, display: 'flex', flexDirection: 'column'}}>
      <div style={{opacity: fade(frame, 750, 890)}}>
        <Brand />
      </div>
      <div style={{marginTop: 260, opacity: fade(frame, 750, 890)}}>
        <div style={{fontSize: 91, lineHeight: 0.94, color: 'white', fontWeight: 1000}}>
          Six clues.<br />One player.<br />Every day.
        </div>
        <div style={{fontSize: 35, lineHeight: 1.22, color: '#b6c2cf', fontWeight: 800, marginTop: 34}}>
          Beat your mates to the answer and climb the live leaderboard.
        </div>
      </div>
      <div
        style={{
          marginTop: 'auto',
          opacity: fade(frame, 760, 898),
          transform: `scale(${interpolate(scale, [0, 1], [0.94, 1])})`,
          borderRadius: 28,
          padding: '30px 34px',
          background: GREEN,
          color: BG,
          fontSize: 46,
          fontWeight: 1000,
          textAlign: 'center',
          boxShadow: '0 22px 70px rgba(0,230,118,0.28)',
        }}
      >
        Play free at setforsix.com
      </div>
    </div>
  );
};

export const SetForSixAd = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <Background />
      <div style={{position: 'absolute', right: 58, bottom: 50, opacity: 0.24}}>
        <Img src={staticFile('og.png')} style={{width: 250, borderRadius: 18}} />
      </div>

      <div style={{opacity: fade(frame, 0, fps * 4.25)}}>
        <Caption
          start={0}
          end={fps * 4.25}
          kicker="Free daily NRL game"
          title="Think you know footy?"
          body="Guess the mystery player before your mates do."
          align="center"
        />
      </div>

      <div style={{opacity: fade(frame, fps * 3.8, fps * 11.2)}}>
        <Caption
          start={fps * 3.8}
          end={fps * 11.2}
          kicker="How it works"
          title="Six clues. Lock in when you know."
        />
        <GameScreen />
      </div>

      <div style={{opacity: fade(frame, fps * 10.6, fps * 16.5)}}>
        <Caption
          start={fps * 10.6}
          end={fps * 16.5}
          kicker="Score fast"
          title="Fewer clues beats the clock."
        />
        <ResultScreen />
      </div>

      <div style={{opacity: fade(frame, fps * 15.8, fps * 21.6)}}>
        <Caption
          start={fps * 15.8}
          end={fps * 21.6}
          kicker="Live leaderboard"
          title="See where you stack up."
        />
        <LeaderboardScreen />
      </div>

      <div style={{opacity: fade(frame, fps * 20.8, fps * 25.7)}}>
        <Caption
          start={fps * 20.8}
          end={fps * 25.7}
          kicker="Share with mates"
          title="Send your score. Start the challenge."
        />
        <ShareCard />
      </div>

      <FinalCta />
    </AbsoluteFill>
  );
};
