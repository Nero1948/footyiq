import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import LeaderboardClient from './LeaderboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Set For Six — Leaderboard',
  description: "See today's fastest NRL guessers. Can you crack it in fewer clues?",
  openGraph: {
    title: 'Set For Six — Leaderboard',
    description: "See today's fastest NRL guessers. Can you crack it in fewer clues?",
    url: 'https://www.setforsix.com/leaderboard',
    images: [{ url: 'https://www.setforsix.com/api/og', width: 1200, height: 630, alt: 'Set For Six Leaderboard' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Set For Six — Leaderboard',
    description: "See today's fastest NRL guessers. Can you crack it in fewer clues?",
    images: ['https://www.setforsix.com/api/og'],
  },
};

async function getLeaderboardData() {
  const todayAEST = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  try {
    const { data: game } = await supabase
      .from('games').select('id, game_number').eq('date', todayAEST).single();

    if (!game) return { gameId: null, gameNumber: null, entries: [] };

    const { data: attempts } = await supabase
      .from('attempts')
      .select('device_id, clues_used, total_time_ms, created_at, username')
      .eq('game_id', game.id)
      .eq('solved', true)
      .order('clues_used', { ascending: true })
      .order('total_time_ms', { ascending: true })
      .limit(50);

    const FALLBACK_NAMES = ['Mystery Fan', 'Secret Selector', 'Phantom Tipper', 'Ghost Player', 'Undercover Footy Brain', 'Anonymous Legend'];
    const getFallback = (id) => {
      let h = 0;
      for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0x7fffffff;
      return FALLBACK_NAMES[h % FALLBACK_NAMES.length];
    };

    const entries = (attempts ?? []).map((a, i) => ({
      rank: i + 1,
      displayName: (a.username && a.username !== 'Anonymous') ? a.username : getFallback(a.device_id),
      deviceSuffix: a.device_id.slice(-4),
      cluesUsed: a.clues_used,
      totalTimeMs: a.total_time_ms,
      createdAt: a.created_at,
    }));

    return { gameId: game.id, gameNumber: game.game_number, entries };
  } catch {
    return { gameId: null, gameNumber: null, entries: [] };
  }
}

export default async function LeaderboardPage() {
  const initialData = await getLeaderboardData();
  return <LeaderboardClient initialData={initialData} />;
}
