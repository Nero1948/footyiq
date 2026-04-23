import { cache } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import PlayClient from './PlayClient';

export const dynamic = 'force-dynamic';

const PLAY_OG = {
  title: "Set For Six — Today's Game is Live 🏉",
  description: 'Six clues. One mystery NRL player. Can you crack it before your mates?',
  images: [{ url: 'https://www.setforsix.com/api/og', width: 1200, height: 630, alt: 'Set For Six — Play Today' }],
  url: 'https://www.setforsix.com/play',
  type: 'website',
};

const getTodayGame = cache(async function getTodayGame() {
  const todayAEST = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  try {
    const { data: game } = await supabase
      .from('games')
      .select('id, game_number, date, clue_1')
      .eq('date', todayAEST)
      .single();
    return game ?? null;
  } catch {
    return null;
  }
});

export async function generateMetadata() {
  const game = await getTodayGame();
  if (game) {
    return {
      title: `Set For Six — Game #${game.game_number}`,
      description: 'Six clues. One mystery NRL player. Can you crack it before your mates?',
      alternates: { canonical: '/play' },
      openGraph: PLAY_OG,
      twitter: { card: 'summary_large_image', ...PLAY_OG },
    };
  }
  return {
    title: 'Set For Six — Play',
    description: 'Six clues. One mystery NRL player. Can you crack it before your mates?',
    alternates: { canonical: '/play' },
    openGraph: PLAY_OG,
    twitter: { card: 'summary_large_image', ...PLAY_OG },
  };
}

const gameSchema = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Set For Six',
  description: 'Six progressive clues reveal a mystery NRL player. Guess correctly in as few clues as possible. New game every day.',
  url: 'https://www.setforsix.com/play',
  genre: ['Sports Trivia', 'Guessing Game', 'Daily Puzzle'],
  gamePlatform: 'Web Browser',
  applicationCategory: 'Game',
  operatingSystem: 'Any',
  inLanguage: 'en-AU',
  isAccessibleForFree: true,
  about: {
    '@type': 'SportsOrganization',
    name: 'National Rugby League',
    alternateName: 'NRL',
  },
};

export default async function PlayPage() {
  const initialGame = await getTodayGame();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameSchema) }}
      />
      <PlayClient initialGame={initialGame} />
    </>
  );
}
