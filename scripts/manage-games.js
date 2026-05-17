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

const NEW_GAMES = [
  {
    game_number: 34,
    date: '2026-05-18',
    answer_player: 'Tanah Boyd',
    clue_1: 'Born in Penrith in 2000 to a former 1990s first-grade prop, he was raised on the Gold Coast and attended a Queensland high school renowned as a rugby league nursery, earning Australian Schoolboys selection in 2017',
    clue_2: 'A halfback known for his goalkicking — he has racked up more than 175 NRL conversions across his career — whose partner is an elite-level athlete in a completely different football code',
    clue_3: 'He slotted a 2022 golden-point field goal to seal a 27-26 upset over a New Zealand opposition — the same club that would later sign him on a multi-year deal',
    clue_4: 'After six seasons and 69 NRL games as the long-suffering first-choice playmaker at a struggling Queensland franchise, he crossed the Tasman for the 2025 season seeking finals football',
    clue_5: 'In May 2026 he re-signed at his new club through to the end of 2029, locking himself in as the long-term #7 at one of the NRL’s most-watched teams',
    clue_6: 'New Zealand Warriors halfback (2025-present, signed to 2029) who spent 2019-2024 at the Gold Coast Titans — junior product of Runaway Bay Seagulls and Keebra Park State High School, son of 1990s first-grader Shayne Boyd',
    facts: [
      "Tanah's father Shayne Boyd played first-grade for Penrith Panthers and Balmain Tigers in the 1990s.",
      "His partner Jacqui Yorston plays AFL Women's football for the Port Adelaide Power.",
      'In 2022 he kicked the 27-26 golden-point match-winning field goal against the New Zealand Warriors — the team he would later sign with.',
    ],
  },
  {
    game_number: 35,
    date: '2026-05-19',
    answer_player: 'Bradley Clyde',
    clue_1: 'Born in a small NSW country town in 1970 but raised in Canberra, he played Australian Rules at junior level before switching codes and earning Australian Schoolboys selection in successive years',
    clue_2: 'A workaholic forward famed for his tireless tackling and ball-running, he was crowned man-of-the-match in his first grand final at just 19 years of age',
    clue_3: 'He won the Clive Churchill Medal twice — in 1989 and 1991 — and was later named in Australia’s official "100 Greatest Players (1908-2007)" team',
    clue_4: 'A Round 20 knee injury in 1990 ruled him out of his club’s premiership win and the subsequent Kangaroo tour, but he returned to win another title with the same club in 1994',
    clue_5: 'After a decade as one of the country’s most-feared forwards, he spent his final NRL seasons with Canterbury (1999-2000) before a one-year stint at Leeds Rhinos in Super League',
    clue_6: 'Canberra Raiders lock/second-rower (1988-1998, 178 games), two-time Clive Churchill Medal winner (1989, 1991), Harry Sunderland Medal winner in 1992, 12 Origins for NSW, 19 Tests for Australia, NRL Hall of Fame inductee',
    facts: [
      'Clyde won the Clive Churchill Medal in 1989 and 1991, becoming one of a handful of players to claim the grand-final man-of-the-match award twice.',
      'An ACL tear in Round 20 of 1990 cost him a grand final appearance — Canberra won the title without him.',
      "Clyde was named in Australia's official 100 Greatest Players of the 20th Century team (1908-2007).",
    ],
  },
  {
    game_number: 36,
    date: '2026-05-20',
    answer_player: "Henry Fa'afili",
    clue_1: 'Born in Apia, Samoa in 1980 and emigrating to New Zealand as a three-year-old, he attended two well-known Auckland rugby league schools before earning Junior Kiwi honours in 1998',
    clue_2: 'A powerful, versatile back who scored from cross-field bombs as comfortably as on the run, he played wing, centre, five-eighth and even second-row across a career split between two countries',
    clue_3: 'He topped the Super League try-scoring charts in 2007 and once produced a Test hat-trick against Great Britain in the 2003 Tri-Nations at Blackburn’s Ewood Park',
    clue_4: 'A foundation-era figure at his first NRL club, he was part of the playing group for the minor premiership of 2002 but missed the famous grand final loss to the Sydney Roosters — the closest his club has ever come to a title',
    clue_5: 'He spent four seasons at Warrington Wolves alongside playmaker Lee Briers, scoring 73 tries in 97 games before retiring to mentor underprivileged boys at a boxing academy in Tauranga',
    clue_6: "New Zealand Warriors winger/centre (2000-2003, 94 games, 38 tries) and Warrington Wolves utility back, 9-Test Kiwi with 5 international tries — Samoan-born, Auckland-raised, a cult hero of the Warriors' foundation era",
    facts: [
      "Fa'afili was born in Apia, Samoa and moved to New Zealand at three years old, eventually attending De La Salle College in Mangere East.",
      'He topped the Super League try-scoring charts in 2007 while playing for Warrington Wolves.',
      'In the 2003 Tri-Nations Test at Ewood Park he scored a hat-trick against Great Britain — one of the great individual Kiwi performances of that era.',
    ],
  },
  {
    game_number: 37,
    date: '2026-05-21',
    answer_player: 'Jamie Soward',
    clue_1: 'Born in Canberra in 1984 and a junior at a country NSW club, he came through the Raiders’ system but made his first-grade debut in Sydney with a rival outfit in 2005',
    clue_2: 'A diminutive playmaker famed for his short kicking game and goalkicking accuracy, he polarised fans throughout his career and famously feuded on-air with a Tigers winger turned TV presenter',
    clue_3: 'He played three NSW State of Origins in 2011 and finished runner-up in Dally M voting in 2009, claiming the Five-Eighth of the Year award that same season',
    clue_4: 'His most famous moment came in heavy rain at ANZ Stadium in October 2010, when he orchestrated his Wollongong-based joint venture’s first-ever premiership win — a 32-8 victory over the Sydney Roosters',
    clue_5: 'After a reported four-year, $1.5m move to Penrith, he wound down his career with two stints at London Broncos before turning to coaching — he most recently led the Samoa Women’s national team',
    clue_6: 'St George Illawarra Dragons five-eighth (2007-2013, 141 games) who orchestrated the joint venture’s first-ever premiership in 2010, played three Origins for NSW in 2011 and represented at the 2008 Rugby League World Cup',
    facts: [
      "Soward was the architect of the 2010 NRL Grand Final win — the Dragons' first premiership as a joint venture — beating the Roosters 32-8 in pouring rain.",
      'He finished runner-up in the 2009 Dally M voting and won Five-Eighth of the Year the same season.',
      'His public feud with broadcaster Beau Ryan, who repeatedly mocked his speech, became one of the longest-running media stoushes of the 2010s.',
    ],
  },
  {
    game_number: 38,
    date: '2026-05-22',
    answer_player: 'Anthony Watmough',
    clue_1: 'Born in Auburn in 1983 and a Narrabeen Sharks junior, he made his NRL debut in 2002 for a now-defunct joint-venture club before settling in at one of its parent clubs',
    clue_2: 'A snarling, fast-talking forward with a shaved head, he was as famous for headline-grabbing off-field incidents as for his ball-running — including a 2009 season-launch fracas and a 2011 post-Origin hotel-room rampage',
    clue_3: 'He won the Dally M Second Rower of the Year award twice — in 2007 and 2009 — and across 2008-2010 racked up more penalties conceded than any other player in the NRL',
    clue_4: 'A central figure in two premiership wins under Des Hasler on the Northern Beaches in 2008 and 2011, he played alongside the Stewart brothers, Steve Matai and Jamie Lyon',
    clue_5: 'He left his long-time home for one final pay-day at Parramatta in 2015, but persistent knee problems forced him into medical retirement in May 2016',
    clue_6: 'Manly-Warringah Sea Eagles second-rower (2003-2014, 278 games, 71 tries), 2008 and 2011 premiership winner, 14 Origins for NSW and 16 Tests for Australia — one of the most-feared edge forwards of his generation',
    facts: [
      'Watmough won NRL premierships with Manly in both 2008 and 2011 under coach Des Hasler.',
      'He won the Dally M Second Rower of the Year award twice (2007, 2009).',
      "He was at the centre of multiple off-field controversies, including a 2009 season-launch incident involving Manly's then-sponsor and a 2011 post-Origin hotel-room destruction allegation.",
    ],
  },
];

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
