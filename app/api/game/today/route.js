import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function GET() {
  // Derive today's date in AEST (Australia/Sydney).
  // en-CA locale formats as YYYY-MM-DD, matching the Supabase date column.
  const todayAEST = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Australia/Sydney',
  });

  let data, error;

  try {
    ({ data, error } = await supabase
      .from('games')
      .select('id, game_number, date, clue_1')
      .eq('date', todayAEST)
      .single());
  } catch {
    return Response.json(
      { error: 'Failed to query database' },
      { status: 500 }
    );
  }

  if (error) {
    // PostgREST returns PGRST116 when .single() finds no rows
    if (error.code === 'PGRST116') {
      return Response.json(
        { error: 'No game found for today' },
        { status: 404 }
      );
    }
    return Response.json(
      { error: 'Failed to load game' },
      { status: 500 }
    );
  }

  return Response.json(data);
}
