# 10: Ingest, settle, Reveal, league table

**What to build:** Finished fixtures enter through the match-data adapter as Public events and the six Vendor stats. Gameweek settlement writes each manager's totals. After Deadline the Private league Reveals locked Lineups, worn Skill cards, and scores, and shows a Gameweek table plus season total of those scores.

**Blocked by:** 05 Auto-sub settlement; 08 Lineup builder and Deadline lock

**Status:** done

- [x] Adapter maps a finished fixture into Public events plus the frozen Vendor stats only
- [x] Settlement uses the domain seam (Match points, Skill wagers, Auto-sub); UI does not reimplement scoring
- [x] Reveal after Deadline shows locked Lineups, worn Skill cards, and per-manager totals
- [x] Private league has a Gameweek table and a season total of those Gameweeks
- [x] No live in-play scoring

## Comments

Adapter: `ingestFixture` in `src/gameweek/ingest.ts` maps a vendor fixture into Public events plus the six frozen Vendor stats only, deriving `goalsConcededByClub` from the fixture score and ignoring pass accuracy / xG / rating / clearances. `MatchFactsStore` (`match-facts-store.ts`) keys fixtures by Gameweek + Clubs and aggregates one fact entry per footballer per match for Doubles.

Settlement: `SettlementService.settleLeague` refuses before the Deadline (`too-early`, so no live scoring), runs `settleLineup` over `toLockedLineup` for each league member, and writes `ManagerSettlement`. `seasonTotal`, `leagueTable`, and `settlementsForLeague` back the Gameweek table and season total. The UI (`RevealPanel`) only calls the service and renders; it does not score.

The app has no automatic ingest source yet; finished fixtures enter through the adapter when ingested (an operator step until a real feed is wired).
