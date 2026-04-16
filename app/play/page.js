import { supabase } from '@/lib/supabase';
import PlayClient from './PlayClient';

export const dynamic = 'force-dynamic';

const PLAY_OG = {
  title: "Set For Six — Today's Game is Live 🏉",
  description: 'Six clues. One mystery NRL player. Can you crack it before your mates?',
  images: [{ url: 'https://www.setforsix.com/api/og', width: 1200, height: 630, alt: 'Set For Six — Play Today' }],
  url: 'https://www.setforsix.com/play',
  type: 'website',
};

export async function generateMetadata() {
  const todayAEST = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  try {
    const { data: game } = await supabase
      .from('games').select('game_number').eq('date', todayAEST).single();
    if (game) {
      return {
        title: `Set For Six — Game #${game.game_number}`,
        description: 'Six clues. One mystery NRL player. Can you crack it before your mates?',
        openGraph: PLAY_OG,
        twitter: { card: 'summary_large_image', ...PLAY_OG },
      };
    }
  } catch { /* fall through */ }
  return {
    title: 'Set For Six — Play',
    description: 'Six clues. One mystery NRL player. Can you crack it before your mates?',
    openGraph: PLAY_OG,
    twitter: { card: 'summary_large_image', ...PLAY_OG },
  };
}

async function getTodayGame() {
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
}

export default async function PlayPage() {
  const initialGame = await getTodayGame();
  return <PlayClient initialGame={initialGame} />;
}
