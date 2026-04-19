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
  // empty — add pending games here once approved
];

// ── Already-inserted games (reference only, not re-inserted) ──────────────────
// Games 7, 8, 9, 10 are confirmed in the DB from a previous session.
// Keeping here for reference:
const _INSERTED_REFERENCE = [
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
]; // end _INSERTED_REFERENCE

// ── PENDING REVIEW — not yet inserted ─────────────────────────────────────────
// Run through each game, approve clues/facts, then move into NEW_GAMES above.

const PENDING_GAMES = [
  {
    game_number: 11,
    date: '2026-04-25',
    answer_player: 'Greg Inglis',
    clue_1: 'As a teenager from regional NSW, he was already being talked about as an exceptional all-round back with the frame, speed and instincts to become a future superstar',
    clue_2: 'Won the Clive Churchill Medal as player of the match in his first NRL grand final — a remarkable individual honour for someone only in his early twenties',
    clue_3: 'When he moved clubs, he helped end a 43-year premiership drought for one of the most storied franchises in the history of the game',
    clue_4: 'His try celebration after the match-clinching score in his second premiership victory — crawling on all fours — became one of the most iconic and culturally significant images in modern NRL history',
    clue_5: 'Retired as Queensland\'s all-time leading try-scorer in State of Origin history with 18 tries in 32 appearances across an 11-year period of Maroons dominance',
    clue_6: "Melbourne Storm and South Sydney Rabbitohs centre/fullback nicknamed 'GI' who scored 149 NRL tries, won the 2014 NRL premiership (the 2007 Storm premiership was stripped for salary cap breaches), the 2009 Golden Boot, and retired as Queensland's all-time State of Origin top tryscorer",
    facts: [
      'His "Goanna crawl" celebration after scoring the match-clinching try in the 2014 NRL Grand Final became one of rugby league\'s most iconic and culturally significant images.',
      'Inglis retired as Queensland\'s all-time top try-scorer in State of Origin history with 18 tries in 32 matches across an 11-year period.',
      'He won the 2009 Golden Boot as the world\'s best rugby league player — the same year he won the Wally Lewis Medal as Queensland\'s player of the series. His 2007 NRL premiership with Melbourne Storm was later stripped when the club\'s systematic salary cap rorting was exposed in 2010.',
    ],
    drama: "In 2019, Inglis was caught drink-driving and speeding in Queensland and resigned the Australian captaincy the following morning — just months before the World Cup. He later said the arrest was the moment he finally confronted his struggles with alcohol and mental health.",
  },
  {
    game_number: 12,
    date: '2026-04-26',
    answer_player: 'Corey Parker',
    clue_1: 'Scored a try in his very first NRL match — a debut that hinted at the longevity and loyalty that would define an entire career at a single club',
    clue_2: 'Surpassed one of Queensland rugby league\'s most celebrated names to become his club\'s all-time highest points scorer — 1,302 points over 16 seasons',
    clue_3: 'Was given the captaincy in the final year of his career — a fitting honour for a player who had given everything to one club across nearly two decades',
    clue_4: 'Swept every major forward award available in a single season — Dally M Lock of the Year, International Lock of the Year, and Rugby League Week Player of the Year all in 2013',
    clue_5: 'When he retired, he was placed fourth on the all-time list of most NRL games played — all 347 of them for the same club',
    clue_6: 'Brisbane Broncos lock who played 347 NRL games across 16 seasons — all for the Broncos — surpassed Darren Lockyer as the club\'s all-time points scorer, and won the 2006 premiership',
    facts: [
      'Parker scored a try in his very first NRL match in 2001 — and went on to play 347 games, all for the Brisbane Broncos.',
      'He surpassed Darren Lockyer as the Brisbane Broncos\' all-time leading points scorer in 2015, finishing with 1,302 career points.',
      'Parker swept the major forward awards in 2013 — winning the Dally M Lock of the Year, International Lock of the Year, and Rugby League Week Player of the Year all in the same season.',
      'He retired fourth on the all-time list of most NRL games played, having never pulled on a jersey for any club other than the Broncos.',
      'Parker won the 2015 Wally Lewis Medal as Queensland\'s player of the State of Origin series after the Maroons\' dominant series victory.',
    ],
  },
  {
    game_number: 13,
    date: '2026-04-27',
    answer_player: 'Laurie Daley',
    clue_1: 'Was spotted by a club talent scout at just 15 years of age playing senior first-grade club football in the country — and debuted in the top grade at 17 without ever playing a reserve grade match',
    clue_2: 'Won three NRL premierships with the same club across a six-year span — a dynasty built around his ability to control a game from five-eighth',
    clue_3: 'Of Aboriginal heritage, born in a small country town, he became one of the most beloved and influential players in the history of his club and a trailblazer for Indigenous footballers',
    clue_4: 'When he retired, his club unveiled a life-size statue in his honour at their home ground — recognition usually reserved for only the very greatest players of a generation',
    clue_5: 'Captained both his state and his country, winning the Dally M Medal as the competition\'s best player in 1995 and being named club Player of the Year on five separate occasions',
    clue_6: 'Canberra Raiders five-eighth who won three NRL premierships (1989, 1991, 1994), the 1995 Dally M Medal, captained Australia in 26 Tests, and had a statue erected in his honour at Bruce Stadium',
    facts: [
      'Daley was talent-spotted at 15 while playing first grade for the Junee Diesels in the country competition — and debuted for the Raiders at 17 without ever playing reserve grade.',
      'He won three NRL premierships with the Raiders — in 1989, 1991, and 1994 — as the heartbeat of one of the greatest club sides in Australian rugby league history.',
      'Of Aboriginal heritage, born in the country town of Junee, Daley became a prominent advocate for Indigenous communities and a trailblazer for the next generation.',
      'When he retired mid-season in 2000 due to chronic knee problems, the Raiders unveiled a statue at Bruce Stadium — one of only a handful of players to receive such recognition.',
      'Daley won the Dally M Medal in 1995 and was named Canberra Raiders Player of the Year on five occasions, cementing his status as the club\'s greatest ever player.',
    ],
  },
  {
    game_number: 14,
    date: '2026-04-28',
    answer_player: 'Anthony Minichiello',
    clue_1: 'Won two NRL premierships 11 years apart at the same club — once as a young winger early in his career, and once as captain and fullback more than a decade later',
    clue_2: 'Was signed to his NRL club at age 16 by one of rugby league\'s most celebrated former players — a chance encounter at a trial game that changed the course of his career',
    clue_3: 'Despite representing Australia, he also qualified to represent a European nation in international rugby league through his heritage — and chose to do so',
    clue_4: 'Won the Golden Boot Award in 2005 as the world\'s best rugby league player — recognition that he had reached the very pinnacle of his position',
    clue_5: 'Retired as his club\'s all-time leading try-scorer with 139 NRL tries and their most-capped player with 302 games — all played for one club',
    clue_6: 'Sydney Roosters fullback and captain who played 302 NRL games (all for the Roosters), scored a club-record 139 tries, won the 2002 and 2013 premierships, and the 2005 Golden Boot as world\'s best player',
    facts: [
      'Minichiello was signed to the Roosters at age 16 by legendary forward Arthur Beetson after a trial game — one of rugby league\'s most celebrated talent identification stories.',
      'He won two NRL premierships 11 years apart — in 2002 as a winger and in 2013 as captain and fullback — showing a rare ability to reinvent himself at the elite level.',
      'Despite representing Australia, Minichiello also represented Italy in international rugby league, qualifying through his Italian heritage.',
      'He won the Golden Boot Award in 2005 as the world\'s best rugby league player, and the Dally M Fullback of the Year in 2004.',
      'Minichiello retired as the Sydney Roosters\' all-time leading try-scorer with 139 NRL tries and most-capped player with 302 appearances — every one of them in the red, white and blue.',
    ],
  },
  {
    game_number: 15,
    date: '2026-04-29',
    answer_player: 'Jason Croker',
    clue_1: 'Despite being named Rookie of the Year in his debut season, he never became a household name in the way flashier players did — instead building a quiet reputation as one of the most durable and versatile forwards of his era',
    clue_2: 'After his NRL career wound down, he extended his playing life by spending three seasons in France — adding 62 games at the top level of European rugby league',
    clue_3: 'Won the Dally M Lock of the Year award in 2000, a recognition that had been quietly earned through years of consistent, unspectacular excellence',
    clue_4: 'Began his career as a winger but over 318 games also appeared at centre, second-row, lock, and five-eighth — a versatility that made him almost impossible to leave out of a side',
    clue_5: 'Retired holding both the games record and the try-scoring record at his club — the most appearances and the most tries by any player in that club\'s entire history',
    clue_6: "Canberra Raiders forward nicknamed 'Toots' who won the 1994 premiership, holds the club records for most games (318) and most tries (120), represented Australia at the 2000 World Cup, and later played for the Catalans Dragons in France",
    facts: [
      'Croker won the Canberra Raiders\' Rookie of the Year award in 1991 — his debut season — having made his first-grade debut at just 18 years of age.',
      'He holds the Canberra Raiders\' all-time records for most games played (318) and most tries scored (120) — both records that stood for decades.',
      'Croker won the 2000 Dally M Lock of the Year award after transforming himself from a teenager who debuted on the wing into one of the competition\'s most reliable forwards.',
      'After his NRL career, he played 62 games for the Catalans Dragons in France across three seasons, extending his playing career until 2009.',
      'Croker represented Australia at the 2000 Rugby League World Cup, scoring two tries across four appearances for the Kangaroos.',
    ],
  },
  {
    game_number: 16,
    date: '2026-04-30',
    answer_player: 'Daly Cherry-Evans',
    clue_1: 'Won an NRL premiership in his debut season — scoring a try in the grand final — a fairytale introduction to the highest level of the game',
    clue_2: 'Turned down a lucrative deal with a rival club, triggering one of the biggest controversies in NRL off-season history — before ultimately staying loyal to the only club he has played for',
    clue_3: 'Holds the NRL era record for most field goals — a precision skill under pressure that became one of his most reliable trademarks as a halfback',
    clue_4: 'Has captained his state to three State of Origin series victories, leading from the front in the same composed and fearless style he brings to club football every week',
    clue_5: 'Became the first halfback in NRL history to play 300 games in the same position — and the most-capped player in his club\'s entire history',
    clue_6: 'Manly-Warringah Sea Eagles captain and halfback who won the 2011 premiership in his debut season, the 2013 Clive Churchill Medal, became the NRL era\'s all-time record holder for field goals (28), and the club\'s most-capped player',
    facts: [
      'Cherry-Evans won the 2011 NRL Premiership in his debut NRL season, scoring a try in the grand final victory over the New Zealand Warriors.',
      'In 2014 he signed a contract with the Gold Coast Titans before controversially withdrawing and recommitting to Manly — one of the most talked-about off-season sagas in NRL history.',
      'He holds the NRL era record for most field goals with 28 — a precision skill under pressure that became one of his defining traits as a halfback.',
      'Cherry-Evans captained Queensland to State of Origin series victories in 2020, 2022, and 2023, leading the Maroons in 18 of his 25 Origin appearances.',
      'He became the first halfback in NRL history to play 300 games in the same position, and is the most-capped player in the Manly Sea Eagles\' history.',
    ],
    drama: "In 2014, Cherry-Evans signed a contract with the Gold Coast Titans worth an estimated $10 million over five years — then sensationally withdrew weeks later and recommitted to Manly. The Titans received $900,000 in NRL compensation. It remains one of the most controversial off-season sagas in NRL history.",
  },
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
