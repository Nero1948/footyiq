#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const [, , batchArg, ...flags] = process.argv;
const commit = flags.includes('--commit');

if (!batchArg) {
  console.error('Usage: node scripts/insert-games-batch.js data/games-batch-2.json [--commit]');
  process.exit(1);
}

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
  console.error('Could not read .env.local - run this from the project root.');
  process.exit(1);
}

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

let games;
try {
  games = JSON.parse(readFileSync(resolve(process.cwd(), batchArg), 'utf8'));
} catch (error) {
  console.error(`Could not read ${batchArg}: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(games) || games.length === 0) {
  console.error('Batch file must contain a non-empty array of games.');
  process.exit(1);
}

for (const game of games) {
  for (const field of ['game_number', 'date', 'answer_player', 'clue_1', 'clue_2', 'clue_3', 'clue_4', 'clue_5', 'clue_6']) {
    if (!game[field]) {
      console.error(`Game ${game.game_number ?? '(unknown)'} is missing ${field}.`);
      process.exit(1);
    }
  }
  if (!Array.isArray(game.facts) || game.facts.length === 0) {
    console.error(`Game ${game.game_number} must include at least one fact.`);
    process.exit(1);
  }
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const gameNumbers = games.map((game) => game.game_number);
const dates = games.map((game) => game.date);
const players = games.map((game) => game.answer_player);

const { data: existing, error: existingError } = await supabase
  .from('games')
  .select('game_number, date, answer_player')
  .or(
    `game_number.in.(${gameNumbers.join(',')}),date.in.(${dates.join(',')}),answer_player.in.(${players.map((player) => `"${player}"`).join(',')})`
  );

if (existingError) {
  console.error(`Failed to check existing games: ${existingError.message}`);
  process.exit(1);
}

if (existing.length > 0) {
  console.error('Refusing to insert because these games already conflict:');
  for (const game of existing) {
    console.error(`- Game #${game.game_number} | ${game.date} | ${game.answer_player}`);
  }
  process.exit(1);
}

console.log(`${commit ? 'Inserting' : 'Previewing'} ${games.length} games from ${batchArg}:`);
for (const game of games) {
  console.log(`- Game #${game.game_number} | ${game.date} | ${game.answer_player}`);
}

if (!commit) {
  console.log('Dry run only. Add --commit to insert.');
  process.exit(0);
}

const { error: insertError } = await supabase
  .from('games')
  .insert(games.map((game) => ({
    game_number: game.game_number,
    date: game.date,
    answer_player: game.answer_player,
    clue_1: game.clue_1,
    clue_2: game.clue_2,
    clue_3: game.clue_3,
    clue_4: game.clue_4,
    clue_5: game.clue_5,
    clue_6: game.clue_6,
    facts: game.facts,
    drama: game.drama ?? null,
  })));

if (insertError) {
  console.error(`Insert failed: ${insertError.message}`);
  process.exit(1);
}

console.log('Inserted games successfully.');
