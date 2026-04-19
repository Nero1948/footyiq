# Set For Six

## What this project is
A daily NRL "Guess the Player" game at setforsix.com. Players get 6 progressive
clues about a mystery NRL player and type their guess. Fewer clues = better
score. Ties broken by speed (fastest time wins).

## Tech stack
- Next.js (App Router, JavaScript — not TypeScript)
- Supabase (database + real-time)
- Tailwind CSS (styling)
- Vercel (hosting + cron jobs)
- Resend (email)

## Code conventions
- Use JavaScript, not TypeScript
- Use Tailwind CSS for all styling — no separate CSS files
- Mobile-first design — dark theme
- All API routes validate server-side — never send the answer to the browser
- Use descriptive variable names

## Project structure
- app/page.js — Landing page
- app/play/page.js — The game (client component)
- app/leaderboard/page.js — Leaderboard
- app/champion/page.js — Daily champion + hall of fame
- app/api/ — All backend routes
- lib/ — Shared utilities (supabase client, matching logic, etc.)

## Answer matching rules (CRITICAL)
Player name matching must be:
1. Case-insensitive
2. Full name or last name only (if surname is distinctive)
3. Allow 1-2 character typos via edit distance
4. NEVER match on first name alone
5. NEVER match partial strings — "greg jackson" must NOT match "greg inglis"

## Database
Supabase. Tables: games, attempts, users, email_subscribers.
Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
