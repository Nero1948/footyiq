import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#07111f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '0 96px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            color: '#00e676',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 4,
            marginBottom: 28,
            display: 'flex',
          }}
        >
          THE DAILY NRL GUESSING GAME
        </div>

        {/* Heading */}
        <div
          style={{
            color: '#ffffff',
            fontSize: 86,
            fontWeight: 900,
            lineHeight: 1.05,
            marginBottom: 28,
            display: 'flex',
          }}
        >
          Set For Six
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#00e676',
            fontSize: 32,
            fontWeight: 600,
            marginBottom: 48,
            display: 'flex',
          }}
        >
          6 clues. 1 player. Can you guess who?
        </div>

        {/* CTA */}
        <div
          style={{
            background: '#00e676',
            color: '#000000',
            fontSize: 22,
            fontWeight: 900,
            padding: '16px 40px',
            borderRadius: 12,
            display: 'flex',
          }}
        >
          Play at setforsix.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
