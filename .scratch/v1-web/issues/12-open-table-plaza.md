# 12: Open table plaza

**What to build:** A global weekly board and season-total board show the same settlement totals as Private leagues. They are a plaza, not the product home.

**Blocked by:** 10 Ingest, settle, Reveal, league table

**Status:** done

- [x] Open table weekly and season totals match settlement, not a second formula
- [x] Visiting managers still land in a Private league as home
- [x] Open table is readable without becoming the reason to play

## Comments

`SettlementService.openWeeklyTable` and `openSeasonTable` read the same `ManagerSettlement` records as Private leagues (weekly = each manager's settled Gameweek total; season = sum of those totals), so there is no second formula. `SettlementStore.getAllSettlements` backs the season board.

`OpenTablePanel` renders the weekly and season boards as a muted, secondary "广场" section with the note "公共看板 · 私人联赛才是主场". It is the last panel in `App`, after the Private league home, packs, tasks, Album, and Reveal; a manager without a league still sees the create/join gate and not the plaza.
