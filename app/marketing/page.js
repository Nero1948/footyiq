import { cookies } from 'next/headers';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import SimpleMarketingClient from './SimpleMarketingClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Marketing Dashboard',
  robots: { index: false, follow: false },
};

async function getStats() {
  const tz = { timeZone: 'Australia/Sydney' };
  const today = new Date().toLocaleDateString('en-CA', tz);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  const fromDate = fourteenDaysAgo.toLocaleDateString('en-CA', tz);

  const [totalResult, todayResult, subscriberResult, solvedResult, recentResult, gamesResult, todayGameResult] =
    await Promise.all([
      supabase.from('attempts').select('*', { count: 'exact', head: true }),
      supabase.from('attempts').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('email_subscribers').select('*', { count: 'exact', head: true }),
      supabase.from('attempts').select('*', { count: 'exact', head: true }).eq('solved', true),
      supabase.from('attempts').select('created_at, device_id').gte('created_at', fromDate).order('created_at'),
      supabase.from('games').select('*', { count: 'exact', head: true }),
      supabase
        .from('games')
        .select('game_number, date, answer_player, clue_1, clue_2, clue_3, clue_4, clue_5, clue_6, facts, drama')
        .eq('date', today)
        .maybeSingle(),
    ]);

  // Group recent attempts by date
  const dailyCounts = {};
  const dailyPeople = {};
  for (const [index, row] of (recentResult.data ?? []).entries()) {
    const date = row.created_at.slice(0, 10);
    dailyCounts[date] = (dailyCounts[date] ?? 0) + 1;
    dailyPeople[date] ??= new Set();
    dailyPeople[date].add(row.device_id ?? `attempt-${date}-${index}`);
  }

  // Fill in zeros for missing days
  const chartData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA', tz);
    chartData.push({
      date: dateStr,
      count: dailyPeople[dateStr]?.size ?? 0,
      plays: dailyCounts[dateStr] ?? 0,
    });
  }

  const totalPlays = totalResult.count ?? 0;
  const totalSolved = solvedResult.count ?? 0;
  const winRate = totalPlays > 0 ? Math.round((totalSolved / totalPlays) * 100) : 0;

  return {
    totalPlays,
    todayPlays: todayResult.count ?? 0,
    subscribers: subscriberResult.count ?? 0,
    gamesLive: gamesResult.count ?? 0,
    winRate,
    chartData,
    todayGame: todayGameResult.data
      ? {
          gameNumber: todayGameResult.data.game_number,
          date: todayGameResult.data.date,
          answer: todayGameResult.data.answer_player,
          clues: [
            todayGameResult.data.clue_1,
            todayGameResult.data.clue_2,
            todayGameResult.data.clue_3,
            todayGameResult.data.clue_4,
            todayGameResult.data.clue_5,
            todayGameResult.data.clue_6,
          ].filter(Boolean),
          facts: todayGameResult.data.facts ?? [],
          drama: todayGameResult.data.drama ?? null,
        }
      : null,
  };
}

export default async function MarketingPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get('mkt_auth')?.value === '1';

  if (!isAuthed) {
    return <SimpleMarketingClient stats={null} authed={false} />;
  }

  const stats = await getStats();
  return <SimpleMarketingClient stats={stats} authed={true} />;
}
