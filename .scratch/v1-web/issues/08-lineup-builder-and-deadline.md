# 08: Lineup builder and Deadline lock

**What to build:** From the Sealed pool the manager sets 11 starters, 4 ordered bench, Captain (two Skill slots, no Match-points double), and optional Naked slots. Illegal formation, Rarity cap, or Club cap cannot lock. Deadline is 90 minutes before this Gameweek's first Premier League kickoff; after lock, Player cards and Skill cards cannot change.

**Blocked by:** 07 Open packs and read cards

**Status:** done

- [x] Lineup can be saved as tentative and edited until Deadline
- [x] Formation floor, Rarity cap (3 epic / 4 rare starters), and Club cap (3) reject illegal locks
- [x] Captain has two Skill slots and does not double Match points
- [x] Bench has no Skill slot; starters may be Naked
- [x] Deadline is first Premier League kickoff minus 90 minutes
- [x] After Deadline the Lineup cannot change

## Comments

The issue text says "4 rare starters" for the Rarity cap; `CONTEXT.md` and the spec say 3 epic / 4 super rare, so the cap is implemented as `RARITY_CAPS` (3 epic, 4 superRare, rare uncapped).

Domain lives in `src/gameweek/lineup.ts` (draft editing + validation), `deadline.ts` (`firstKickoff - 90m`, `isPastDeadline`), `lineup-store.ts`, and `lineup-service.ts` (tentative vs locked, past-Deadline refusal). `toLockedLineup` maps the draft onto the settlement seam without a Match-points double. UI is `LineupBuilder` inside `GameweekScreen`.

The first-kickoff source is a placeholder (`scheduledFirstKickoff`, Saturday 12:30 UTC of the ISO week) until the fixture ingest ticket lands; the Deadline rule itself is kickoff minus 90 minutes.
