# Anti-Cheat Plan

The current leaderboard trusts values submitted by the browser:

- `cluesUsed`
- `totalTimeMs`
- `guesses`
- `deviceId`

That is acceptable while the game is small, but it means a technical user can spoof a fast score if they know the answer. The fix should be done as a dedicated backend change, not mixed into UI work.

## Recommended Implementation

1. Add an `attempt_sessions` table.

```sql
create table attempt_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  device_id text not null,
  started_at timestamptz not null default now(),
  guesses jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  unique (game_id, device_id)
);
```

2. Start a session when the player loads `/play`.

The client sends only `gameId` and `deviceId`. The server records `started_at`.

3. Record each guess server-side in `/api/guess`.

The server should append each guess to `attempt_sessions.guesses` and reject skipped clue numbers.

4. Calculate score in `/api/submit`.

`/api/submit` should ignore client-provided `cluesUsed` and `totalTimeMs` when a session exists. It should derive:

- `clues_used` from the number of recorded guesses
- `total_time_ms` from `completed_at - started_at`
- `solved` by matching the final recorded guess

5. Keep a temporary fallback.

For one deployment, keep the existing client-submitted scoring path as a fallback if no session row exists. Remove the fallback after the session flow has been verified in production.

## Notes

This will not stop every possible cheat, but it prevents the easiest leaderboard spoofing and makes the daily champion meaningfully more trustworthy.
