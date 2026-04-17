#!/usr/bin/env node
/**
 * Lists all upcoming Set For Six games from Supabase.
 * Run with: node scripts/upcoming-games.js
 *
 * Requires .env.local to have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually (no dotenv dependency needed)
const envPath = resolve(process.cwd(), '.env.local');
try {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  console.error('Could not read .env.local — make sure you run this from the project root.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const todayAEST = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });

const { data: games, error } = await supabase
  .from('games')
  .select('game_number, date, answer_player, clue_1, clue_2, clue_3, clue_4, clue_5, clue_6')
  .gte('date', todayAEST)
  .order('date', { ascending: true });

if (error) {
  console.error('Supabase error:', error.message);
  process.exit(1);
}

if (!games || games.length === 0) {
  console.log('No upcoming games found. Time to add some!');
  process.exit(0);
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`  SET FOR SIX — Upcoming Games (from ${todayAEST} AEST)`);
console.log(`  ${games.length} game${games.length === 1 ? '' : 's'} scheduled`);
console.log(`${'─'.repeat(60)}\n`);

for (const game of games) {
  const isToday = game.date === todayAEST;
  const label = isToday ? ' ← TODAY' : '';
  console.log(`  Game #${game.game_number}  |  ${game.date}${label}`);
  console.log(`  Player: ${game.answer_player}`);
  console.log(`  Clues:`);
  for (let i = 1; i <= 6; i++) {
    const clue = game[`clue_${i}`];
    if (clue) console.log(`    ${i}. ${clue}`);
  }
  console.log();
}

console.log(`${'─'.repeat(60)}\n`);
