import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const W = 1200;
const H = 630;

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          background: '#07111f',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            display: 'flex',
          }}
        />

        {/* Green radial glow */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 900,
            height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0,230,118,0.10) 0%, transparent 65%)',
            display: 'flex',
          }}
        />

        {/* Rugby ball silhouette (right side) */}
        <div
          style={{
            position: 'absolute',
            right: -80,
            top: '50%',
            transform: 'translateY(-50%) rotate(-15deg)',
            opacity: 0.06,
            display: 'flex',
          }}
        >
          <svg width="560" height="340" viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 250,6 C 435,6 494,82 494,150 C 494,218 435,294 250,294 C 65,294 6,218 6,150 C 6,82 65,6 250,6 Z" stroke="#00e676" strokeWidth="4" fill="rgba(0,230,118,0.04)" />
            <path d="M 6,150 C 82,170 166,177 250,177 C 334,177 418,170 494,150" stroke="#00e676" strokeWidth="2.5" fill="none" opacity="0.6" />
            <line x1="250" y1="50" x2="250" y2="250" stroke="#00e676" strokeWidth="2" opacity="0.45" />
            <line x1="233" y1="96"  x2="267" y2="96"  stroke="#00e676" strokeWidth="5" />
            <line x1="231" y1="118" x2="269" y2="118" stroke="#00e676" strokeWidth="5" />
            <line x1="231" y1="140" x2="269" y2="140" stroke="#00e676" strokeWidth="5" />
            <line x1="231" y1="162" x2="269" y2="162" stroke="#00e676" strokeWidth="5" />
            <line x1="233" y1="184" x2="267" y2="184" stroke="#00e676" strokeWidth="5" />
          </svg>
        </div>

        {/* Content */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 96px',
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                background: 'rgba(0,230,118,0.15)',
                border: '1px solid rgba(0,230,118,0.35)',
                borderRadius: 24,
                padding: '6px 20px',
                color: '#00e676',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 3,
              }}
            >
              DAILY NRL GUESSING GAME
            </div>
          </div>

          {/* Brand name */}
          <div
            style={{
              color: '#ffffff',
              fontSize: 80,
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: -2,
              marginBottom: 22,
            }}
          >
            Set For Six 🏉
          </div>

          {/* Tagline */}
          <div
            style={{
              color: '#6b8aaa',
              fontSize: 28,
              fontWeight: 500,
              lineHeight: 1.4,
              maxWidth: 640,
            }}
          >
            Six clues. One mystery NRL player.{'\n'}New every day.
          </div>

          {/* CTA pill */}
          <div
            style={{
              display: 'flex',
              marginTop: 44,
            }}
          >
            <div
              style={{
                background: '#00e676',
                color: '#000',
                fontSize: 20,
                fontWeight: 900,
                padding: '14px 36px',
                borderRadius: 14,
                letterSpacing: 1,
              }}
            >
              Play at setforsix.com →
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'relative',
            height: 6,
            background: 'linear-gradient(90deg, transparent, #00e676, transparent)',
            opacity: 0.5,
          }}
        />
      </div>
    ),
    { width: W, height: H }
  );
}
