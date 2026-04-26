#!/usr/bin/env node
/**
 * Game management script for Set For Six.
 *
 * Usage:
 *   node scripts/manage-games.js          — preview what will be changed
 *   node scripts/manage-games.js --commit — actually apply the changes
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (in addition to the two public vars).
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Load .env.local ────────────────────────────────────────────────────────────

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
  console.error('Could not read .env.local — run this from the project root.');
  process.exit(1);
}

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;

if (!url || !serviceKey) {
  console.error('\n  Missing env vars. Add SUPABASE_SERVICE_ROLE_KEY to .env.local');
  console.error('  Get it from: Supabase Dashboard → Project Settings → API → service_role key\n');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const COMMIT = process.argv.includes('--commit');

// ── Games to delete ────────────────────────────────────────────────────────────

const GAMES_TO_DELETE = [
  { game_number: 1, player: 'Nathan Cleary', reason: 'Trial game — weak clues, no facts' },
];

// ── Drama updates for already-inserted games ───────────────────────────────────
// These games are live in the DB — we only need to SET the drama column.

const DRAMA_UPDATES = [
  {
    game_number: 5,
    player: 'Robbie Farah',
    drama: "During his final years at the Tigers, Farah was reportedly at the centre of a player-led push to have head coach Jason Taylor sacked — triggering a formal NRL investigation and making his departure from the club he captained for 15 years deeply bitter.",
  },
  {
    game_number: 10,
    player: 'Manu Vatuvei',
    drama: "In 2016, Vatuvei appeared in court charged with importing MDMA — he told the court the drugs were intended as gifts for friends. He received an intensive corrections order and avoided a prison sentence.",
  },
  {
    game_number: 8,
    player: 'Paul Gallen',
    drama: "Gallen was at the centre of the 2011 Cronulla peptides scandal — players were injected with substances including Thymosin Beta-4 under the club's supplements programme. He faced a lengthy ASADA investigation but was ultimately cleared of intentional doping.",
  },
];

// ── Games to insert ────────────────────────────────────────────────────────────
// Move approved PENDING_GAMES here when ready to go live.

const NEW_GAMES = [];

// ── Already-inserted games (reference only, not re-inserted) ──────────────────
// Games 5-20 are confirmed live in the DB. Older entries (7-10) kept here for reference.
// Full data for #11-20 preserved in git history (see commit 55d96b2).
void [
  {
    game_number: 10,
    date: '2026-04-21',
    answer_player: 'Manu Vatuvei',
    clue_1: 'Became the first player in NRL history to score at least 10 tries in every one of 10 consecutive seasons — a feat of consistency no winger had ever managed before',
    clue_2: 'His try-scoring record for his country broke a mark that had stood for over a decade, surpassing a record set in 2006',
    clue_3: 'His 2011 season ended on the biggest stage — he scored a try in a grand final, but finished on the losing side despite playing all season in irresistible form',
    clue_4: 'Of Tongan descent but raised in Auckland, he played his entire 14-season NRL career for a single club',
    clue_5: "His size, power and finishing ability earned him the nickname 'The Beast' — one of the most iconic wingers of the Warriors era",
    clue_6: 'New Zealand Warriors winger who scored 152 NRL tries — the club\'s all-time leading tryscorer — and broke the Kiwis\' international try-scoring record with 22 tries in 28 Tests',
    facts: [
      'Vatuvei was the first player in NRL history to score 10 or more tries in 10 consecutive seasons — a record that still stands.',
      'He broke Nigel Vagana\'s New Zealand Kiwis try-scoring record of 19, finishing his Test career with 22 tries in 28 matches.',
      'Born in Auckland of Tongan descent, he joined the Warriors development squad at just 16 and went on to play 226 first-grade games — all for the Warriors.',
    ],
  },
  {
    game_number: 7,
    date: '2026-04-22',
    answer_player: 'Preston Campbell',
    clue_1: 'Won the Dally M Player of the Year award by a single point — edging out the player widely considered the best in the world at the time',
    clue_2: 'When a brand-new NRL club was being established from scratch, he was the very first player they signed — becoming the face of the franchise before it had played a single game',
    clue_3: 'In a premiership-winning season, he played every single minute of every single match — one of the most consistent performers in the competition that year',
    clue_4: 'Of Torres Strait Islander heritage, he went on to be named the first life member of the NRL club he helped launch from the ground up',
    clue_5: 'Kicked two crucial goals in a grand final victory — winning a premiership with a Western Sydney club not typically associated with sustained success',
    clue_6: 'Cronulla, Penrith Panthers and Gold Coast Titans halfback/five-eighth who won the 2003 NRL premiership, the 2001 Dally M Medal, and became the inaugural signing and first life member of the Titans',
    facts: [
      'Campbell won the 2001 Dally M Medal by just one point over Andrew Johns — widely regarded as the best player in the world at the time.',
      'He played every minute of every match in Penrith\'s 2003 premiership-winning season, finishing as the club\'s top points scorer for the year.',
      'He was the inaugural signing for the Gold Coast Titans in 2005, two full years before the club played its first NRL game, and was later named the club\'s first life member in 2019.',
    ],
  },
  {
    game_number: 8,
    date: '2026-04-23',
    answer_player: 'Paul Gallen',
    clue_1: 'Led his club to their first-ever NRL premiership after 49 years of trying — an achievement that reduced grown men to tears across an entire city',
    clue_2: 'Played over 300 games for a single club without ever pulling on another team\'s jersey — a loyalty that defined his entire professional life',
    clue_3: 'Became the first player in NRL history to accumulate 50,000 career running metres — a record that speaks to his extraordinary durability and relentless work rate',
    clue_4: 'Won the Harry Sunderland Medal as Australian Player of the Year in back-to-back seasons — a rare distinction reserved for only the truly elite',
    clue_5: 'After retiring from league, he pursued a professional boxing career — stepping into the ring against some of Australia\'s most recognisable sporting names',
    clue_6: 'Cronulla-Sutherland Sharks captain and lock who led the club to their maiden 2016 NRL premiership, won back-to-back Harry Sunderland Medals in 2010 and 2011, played a record 348 games for the club, and became a professional boxer after retiring',
    facts: [
      'Gallen grew up a Penrith Panthers fan but signed with Cronulla at 17 — a decision that would define his entire career and make him the greatest player in the club\'s history.',
      'He captained the Cronulla Sharks for over 200 matches — one of the longest club captaincy stints in NRL history. He also surpassed Danny Buderus\' record to become the longest-serving NSW State of Origin captain.',
      'Despite being a lock forward, Gallen scored 63 NRL tries across his career — an impressive total for a player whose defensive contributions were equally valued.',
    ],
  },
  {
    game_number: 9,
    date: '2026-04-24',
    answer_player: 'Stacey Jones',
    clue_1: 'His grandfather was a celebrated New Zealand rugby league player — meaning the game ran in his blood long before he ever stepped onto a first-grade field',
    clue_2: 'Made his NRL debut in his club\'s very first season in the competition at just 18 years old, and went on to play over 100 consecutive first-grade matches',
    clue_3: 'Nicknamed "the little general" for his ability to control a game from halfback despite his modest physical size — the heartbeat of his club for over a decade',
    clue_4: 'Led his club to an NRL grand final in 2002, where they ultimately fell short — one of the great nearly-moments in New Zealand rugby league history',
    clue_5: 'Won the Golden Boot Award as the world\'s best international rugby league player in 2002 — only the second New Zealander ever to receive the honour',
    clue_6: "New Zealand Warriors halfback nicknamed 'the little general' who played 261 games for the club, led them to the 2002 grand final, and won the 2002 Golden Boot as the world's best international player",
    facts: [
      'Jones was the grandson of Maunga Emery, a celebrated New Zealand rugby league player, making him part of one of the country\'s great football families.',
      'He made his NRL debut in the Warriors\' inaugural 1995 season at age 18 and went on to play over 100 consecutive first-grade matches between 1995 and 1999.',
      'Jones won the 2002 Golden Boot Award as the world\'s best international rugby league player — only the second New Zealander to receive the honour after Gary Freeman.',
    ],
  },
]; // end inserted reference

// ── PENDING REVIEW — not yet inserted ─────────────────────────────────────────
// Run through each game, approve clues/facts, then move into NEW_GAMES above.

const PENDING_GAMES = [
];

// ── Preview ────────────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(60)}`);
console.log(`  SET FOR SIX — Game Management Script`);
console.log(`  Mode: ${COMMIT ? 'COMMIT (live changes)' : 'PREVIEW (dry run — add --commit to apply)'}`);
console.log(`${'═'.repeat(60)}\n`);

console.log('  DELETIONS:\n');
for (const g of GAMES_TO_DELETE) {
  console.log(`  ✕  Game #${g.game_number} — ${g.player}`);
  console.log(`     Reason: ${g.reason}\n`);
}

console.log('  INSERTIONS (approved):\n');
for (const g of NEW_GAMES) {
  console.log(`  +  Game #${g.game_number} | ${g.date} | ${g.answer_player}`);
  console.log(`     Clue 1: ${g.clue_1.slice(0, 80)}…`);
  console.log(`     Facts: ${g.facts.length}\n`);
}

console.log('  DRAMA UPDATES (live games):\n');
for (const g of DRAMA_UPDATES) {
  console.log(`  🔥  Game #${g.game_number} — ${g.player}`);
  console.log(`     ${g.drama.slice(0, 80)}…\n`);
}

console.log('  PENDING REVIEW (not included in this run):\n');
for (const g of PENDING_GAMES) {
  console.log(`  ⏸  Game #${g.game_number} | ${g.date} | ${g.answer_player}`);
}

if (!COMMIT) {
  console.log(`${'─'.repeat(60)}`);
  console.log('  DRY RUN — no changes made.');
  console.log('  Run with --commit to apply.\n');
  process.exit(0);
}

// ── Apply changes ──────────────────────────────────────────────────────────────

console.log(`${'─'.repeat(60)}`);
console.log('  Applying changes…\n');

// Delete
for (const g of GAMES_TO_DELETE) {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('game_number', g.game_number);

  if (error) {
    console.error(`  ✕  Failed to delete Game #${g.game_number}: ${error.message}`);
  } else {
    console.log(`  ✓  Deleted Game #${g.game_number} — ${g.player}`);
  }
}

// Insert
for (const g of NEW_GAMES) {
  const { error } = await supabase
    .from('games')
    .insert({
      game_number: g.game_number,
      date: g.date,
      answer_player: g.answer_player,
      clue_1: g.clue_1,
      clue_2: g.clue_2,
      clue_3: g.clue_3,
      clue_4: g.clue_4,
      clue_5: g.clue_5,
      clue_6: g.clue_6,
      facts: g.facts,
      drama: g.drama ?? null,
    });

  if (error) {
    console.error(`  ✕  Failed to insert Game #${g.game_number} (${g.answer_player}): ${error.message}`);
  } else {
    console.log(`  ✓  Inserted Game #${g.game_number} | ${g.date} | ${g.answer_player}`);
  }
}

// Drama updates for already-inserted games
for (const g of DRAMA_UPDATES) {
  const { error } = await supabase
    .from('games')
    .update({ drama: g.drama })
    .eq('game_number', g.game_number);

  if (error) {
    console.error(`  ✕  Failed to update drama for Game #${g.game_number} (${g.player}): ${error.message}`);
  } else {
    console.log(`  ✓  Drama updated — Game #${g.game_number} | ${g.player}`);
  }
}

console.log(`\n${'═'.repeat(60)}`);
console.log('  Done.\n');
