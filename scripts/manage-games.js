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
    clue_2: 'Surpassed one of Queensland rugby league\'s most celebrated names to become his club\'s all-time highest points scorer — 1,328 points over 16 seasons',
    clue_3: 'Was given the captaincy in the final year of his career — a fitting honour for a player who had given everything to one club across nearly two decades',
    clue_4: 'Swept every major forward award available in a single season — Dally M Lock of the Year, International Lock of the Year, and Rugby League Week Player of the Year all in 2013',
    clue_5: 'When he retired, he was placed fourth on the all-time list of most NRL games played — all 347 of them for the same club',
    clue_6: 'Brisbane Broncos lock who played 347 NRL games across 16 seasons — all for the Broncos — surpassed Darren Lockyer as the club\'s all-time points scorer, and won the 2006 premiership',
    facts: [
      'Parker finished with 1,328 career points — 586 goals and 39 tries across 347 games, all for Brisbane. The vast majority came through his boot, making him one of the most prolific goal-kicking forwards in NRL history.',
      'He spent the majority of his career under legendary coach Wayne Bennett, who described Parker as the ultimate professional — a player who maximised every ounce of his ability through dedication rather than natural flair.',
      'After retiring in 2016, Parker moved straight into a media career with Fox Sports, becoming one of the network\'s most recognised NRL analysts and commentators.',
    ],
  },
  {
    game_number: 14,
    date: '2026-04-28',
    answer_player: 'Anthony Minichiello',
    clue_1: 'Repeated back and neck injuries threatened his career in the middle years, yet he fought through them to become one of the most durable and decorated one-club players of the NRL era',
    clue_2: 'Was signed to his NRL club at age 16 by one of rugby league\'s most celebrated former players — a chance encounter at a trial game that changed the course of his career',
    clue_3: 'Despite representing Australia, he also qualified to represent a European nation in international rugby league through his heritage — and chose to do so',
    clue_4: 'Won the Golden Boot Award in 2005 as the world\'s best rugby league player — recognition that he had reached the very pinnacle of his position',
    clue_5: 'Retired as his club\'s all-time leading try-scorer with 139 NRL tries and their most-capped player with 302 games — all played for one club',
    clue_6: 'Sydney Roosters fullback and captain who played 302 NRL games (all for the Roosters), scored a club-record 139 tries, won the 2002 and 2013 premierships, and the 2005 Golden Boot as world\'s best player',
    facts: [
      'When he led the Roosters to the 2013 Grand Final as captain and fullback, he became the first fullback to captain his side to a Grand Final victory since Frank \'Skinny\' McMillan in 1934 — 79 years between the two.',
      'He featured in six Grand Finals during his career — winning two and losing four — more Grand Final appearances than almost any player of his generation.',
      'His nickname "The Count" was given to him in 2001 by City Origin coach Brett Kenny — reportedly a reference to his resemblance to the Muppets character of the same name.',
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
      'Growing up in Junee, Daley was the only boy among seven sisters — a detail that surprises most people who picture the fiercely competitive player he became.',
      'Coach Tim Sheens deliberately moved him from centre to five-eighth in 1990 with a specific plan — to groom him as the long-term successor to Wally Lewis at Test five-eighth. The gamble paid off spectacularly.',
      'Daley scored 87 tries across his career — a remarkable total for a player whose defensive work and playmaking ability were considered equally valuable.',
    ],
  },
  {
    game_number: 16,
    date: '2026-04-30',
    answer_player: 'Daly Cherry-Evans',
    clue_1: 'Won an NRL premiership in his debut season — scoring a try in the grand final — a fairytale introduction to the highest level of the game',
    clue_2: 'Was at the centre of one of the most dramatic contract sagas of the modern era',
    clue_3: 'Holds the NRL era record for most field goals — a precision skill under pressure that became one of his most reliable trademarks as a halfback',
    clue_4: 'He eventually took charge of his state side during a new era, captaining Queensland to repeated Origin success',
    clue_5: 'Became the first halfback in NRL history to play 300 games in the same position — and the most-capped player in his club\'s entire history',
    clue_6: 'Manly-Warringah Sea Eagles captain and halfback who won the 2011 premiership in his debut season, the 2013 Clive Churchill Medal, became the NRL era\'s all-time record holder for field goals (28), and the club\'s most-capped player',
    facts: [
      'His father Troy Evans played as a hooker for the Norths Devils and Redcliffe Dolphins in the Brisbane competition during the 1980s and 90s — meaning DCE grew up in a rugby league household long before Manly came calling.',
      'England coach Steve McNamara offered him a starting spot for the 2011 Four Nations through his English-born mother — an offer DCE turned down to remain eligible for Australia, in his debut NRL season no less.',
      'Just one season into his NRL career, his management requested a release from Manly believing he was underpaid at $85,000 — within a week Manly re-signed him for reportedly over $500,000, an extraordinary leap that showed how quickly the club valued him.',
    ],
    drama: "In 2015, Cherry-Evans announced he had signed a four-year deal to join the Gold Coast Titans — then sensationally reversed his decision weeks later and recommitted to Manly on a reported eight-year, $10 million contract. The NRL required compensation to be paid to the Titans. It remains one of the most controversial off-season sagas in NRL history.",
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
      'His nickname "Toots" was given to him by his mum when he was a youngster — and despite being embarrassed by it for years, the name followed him all the way to the highest level of the game.',
      'When he played his final game for the Raiders, the ACT Chief Minister presented him with the keys to the city in front of more than 21,000 fans — a civic honour rarely given to a sportsperson.',
      'His nephew Lachlan Croker also played rugby league professionally — Jason actually turned out alongside him at the 2016 Auckland Nines, briefly bringing two generations of the family onto the same field.',
    ],
  },
  {
    game_number: 17,
    date: '2026-05-01',
    answer_player: 'Todd Carney',
    clue_1: 'As a 17-year-old country boy from Goulburn, he debuted for Canberra in 2004 — but his career off the field would soon become as turbulent as his on-field talent was undeniable',
    clue_2: 'His off-field issues — drink-driving, alcohol-related incidents and vandalism — led to deregistration and meant he was sacked by all three NRL clubs he played for, despite being one of the most naturally gifted playmakers of his generation',
    clue_3: 'In a remarkable 2010 season he won the Dally M Medal, the Provan-Summons People\'s Choice award, and the RLIF International Player of the Year award as the game\'s world player of the year',
    clue_4: 'He helped his second club reach the 2010 NRL grand final — losing to the Dragons — while playing alongside Mitchell Pearce in one of the most dangerous attacking combinations of that season',
    clue_5: 'After his final NRL sacking he played out his top-level career in the English Super League with Catalans Dragons, Salford Red Devils and Hull Kingston Rovers — and in 2024 returned to an NRL club system as a Gold Coast Titans pathways coach',
    clue_6: 'Canberra Raiders, Sydney Roosters and Cronulla Sharks five-eighth/halfback nicknamed "Toddy", who won the 2010 Dally M Medal at 24 before off-field controversies ultimately ended his NRL playing career',
    facts: [
      'He was born in Goulburn, NSW, and was spotted early as a junior star, playing for Australian Schoolboys before making his NRL debut as a teenager.',
      'During his year out of the NRL in 2009, he played local rugby league for Atherton Roosters in Far North Queensland before rebuilding his career with the Sydney Roosters.',
      'His vandalism spree in Goulburn in early 2009 — months after he had already been sacked by Canberra — earned him a 12-month suspended jail sentence and alcohol counselling, adding to the off-field reputation that followed him throughout his career.',
    ],
    drama: 'Pick a year, any year.',
  },
  {
    game_number: 18,
    date: '2026-05-02',
    answer_player: 'Sam Burgess',
    clue_1: 'Before becoming one of the defining forwards of his era, he built his reputation on a rare mix of size, aggression, ball-playing skill and relentless work rate — the kind of package that made him valuable in the middle, on an edge, and as a leader',
    clue_2: 'He began his first-grade career overseas before making a high-profile move to Australia, where he became the face of a club\'s long-awaited return to the top',
    clue_3: 'His three brothers also played professional rugby league for the same NRL club — creating one of the game\'s most unusual family dynasties',
    clue_4: 'He was recruited to Australia after an extraordinary pitch involving a Hollywood actor, his mother Julie, and a meeting on the set of Robin Hood in England',
    clue_5: 'He played the entire 2014 NRL grand final despite suffering a broken cheekbone and fractured eye socket from a head clash on the first tackle — then won the Clive Churchill Medal',
    clue_6: 'South Sydney Rabbitohs lock/prop nicknamed "Slammin\' Sam", who won the 2014 NRL premiership and Clive Churchill Medal, captained England, briefly switched to rugby union, and was famously recruited from England by Russell Crowe',
    facts: [
      'Burgess made his senior debut for Bradford Bulls in 2006 at age 17, before going on to play for Great Britain as a teenager.',
      'His mother, Julie Burgess, became a well-known figure in the South Sydney story after all four Burgess brothers eventually moved into the Rabbitohs system.',
      'After retiring as a player due to a chronic shoulder injury, Burgess moved into coaching and was appointed head coach of Warrington Wolves from the 2024 Super League season.',
    ],
    drama: "Burgess's post-playing career was overshadowed by a public legal saga involving allegations made during and after the breakdown of his marriage. In February 2021, he was found guilty of intimidating his former father-in-law, but that conviction was overturned on appeal in March 2021. In October 2021, NSW Police confirmed no criminal prosecutions would proceed after investigating further allegations, including domestic violence and drug use claims.",
  },
  {
    game_number: 19,
    date: '2026-05-03',
    answer_player: 'Brad Fittler',
    clue_1: 'Before becoming one of the game\'s most decorated playmakers, he was already trusted in first grade as a teenager — a rare case of a young centre/ball-player whose composure matched his physical gifts long before his peak years',
    clue_2: 'His career bridged two very different eras of the same competition: the final years before the Super League war, and the early NRL era, where he became the centrepiece of a glamour club\'s rebuild',
    clue_3: 'He won premierships more than a decade apart, first as a teenage prodigy in a western Sydney side and later as the veteran captain of an eastern Sydney powerhouse',
    clue_4: 'He won major individual honours on both sides of the domestic/international divide: a Rothmans Medal in the late 1990s and the Golden Boot three years later',
    clue_5: 'He remains the youngest player ever selected for New South Wales in State of Origin, debuting at 18 years and 114 days',
    clue_6: 'Penrith Panthers and Sydney Roosters five-eighth/lock nicknamed "Freddy", who won the 1991 and 2002 premierships, played 336 first-grade games, captained Australia in 20 Tests, won the 2000 Golden Boot, and later coached the NSW Blues',
    facts: [
      'He was the youngest Australian Kangaroos debutant in history at 18 years and 247 days — a record that stood until Israel Folau debuted in 2007.',
      'Fittler played 119 first-grade games for Penrith and 217 for the Sydney Roosters, giving him 336 games across a 16-season club career.',
      'Before coaching NSW, he coached the Sydney Roosters from late 2007 to 2009, taking them to the finals in 2008 and coaching 58 matches overall.',
    ],
  },
  {
    game_number: 20,
    date: '2026-05-04',
    answer_player: 'Wendell Sailor',
    clue_1: 'Before becoming one of rugby league\'s most recognisable outside backs, he was a teenage finisher in a star-studded Queensland side where future internationals were everywhere',
    clue_2: 'He changed expectations of what an outside back could look like, bringing kick-return metres, contact carries and showmanship to a position usually judged mainly on finishing',
    clue_3: 'At the 2000 Rugby League World Cup he finished as the tournament\'s leading try-scorer and was named player of the tournament',
    clue_4: 'Won four top-grade premierships with his original club — in 1993, 1997, 1998 and 2000 — as part of one of the great club dynasties of the modern era',
    clue_5: 'After the 2001 NRL season he switched codes, winning 37 Wallabies caps and playing in the 2003 Rugby World Cup final, before a two-year ban for a positive cocaine test preceded his NRL comeback with St George Illawarra',
    clue_6: 'Brisbane Broncos and St George Illawarra Dragons winger nicknamed "Dell", who scored 110 tries in 189 games for the Broncos, won four top-grade premierships, played 16 Tests for Australia in league and 37 for the Wallabies in union, and was named player of the 2000 Rugby League World Cup',
    facts: [
      'Sailor was born in Sarina, Queensland, and became one of the Broncos\' great home-grown success stories after joining Brisbane as a teenager.',
      'His son Tristan Sailor also became an NRL player, making appearances for St George Illawarra and Brisbane.',
      'Post-retirement, Sailor became a regular rugby league media personality and crossed into entertainment television, including appearances on Dancing with the Stars, The Celebrity Apprentice Australia and The Masked Singer Australia.',
    ],
    drama: 'In 2006, while playing for the NSW Waratahs, Sailor tested positive to cocaine after a Super 14 match against the Brumbies. He was suspended for two years and his ARU contract was terminated, ending his rugby union career. After the ban expired, he returned to rugby league with St George Illawarra in 2008.',
  },
];

// ── Already-inserted games (reference only, not re-inserted) ──────────────────
// Games 7, 8, 9, 10 are confirmed in the DB from a previous session.
// Keeping here for reference:
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
