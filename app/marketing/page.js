import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import MarketingClient from './MarketingClient';

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

  const [totalResult, todayResult, subscriberResult, solvedResult, recentResult, gamesResult] =
    await Promise.all([
      supabase.from('attempts').select('*', { count: 'exact', head: true }),
      supabase.from('attempts').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('email_subscribers').select('*', { count: 'exact', head: true }),
      supabase.from('attempts').select('*', { count: 'exact', head: true }).eq('solved', true),
      supabase.from('attempts').select('created_at').gte('created_at', fromDate).order('created_at'),
      supabase.from('games').select('*', { count: 'exact', head: true }),
    ]);

  // Group recent attempts by date
  const dailyCounts = {};
  for (const row of recentResult.data ?? []) {
    const date = row.created_at.slice(0, 10);
    dailyCounts[date] = (dailyCounts[date] ?? 0) + 1;
  }

  // Fill in zeros for missing days
  const chartData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA', tz);
    chartData.push({ date: dateStr, count: dailyCounts[dateStr] ?? 0 });
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
  };
}

export default async function MarketingPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get('mkt_auth')?.value === '1';

  if (!isAuthed) {
    return <MarketingClient stats={null} authed={false} />;
  }

  const stats = await getStats();
  return <MarketingClient stats={stats} authed={true} />;
}
