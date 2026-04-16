import { supabase } from '@/lib/supabase';
import LeaderboardClient from './LeaderboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Set For Six — Leaderboard',
  description: "See today's fastest NRL guessers. Can you crack it in fewer clues?",
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
      .limit(10);

    const entries = (attempts ?? []).map((a, i) => ({
      rank: i + 1,
      username: a.username || 'Anonymous',
      deviceSuffix: a.device_id.slice(-4),
      cluesUsed: a.clues_used,
      totalTimeMs: a.total_time_ms,
      createdAt: a.created_at,
      deviceId: a.device_id,
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
