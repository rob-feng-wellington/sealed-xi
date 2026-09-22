# 11: Album Club set pull

**What to build:** Unique footballers drawn leave Album stamps. Completing a published Club set of 11 names grants +1 player pull next Gameweek, never this one, max one Album pull per Gameweek. Stamps never change Match points or Skill wagers.

**Blocked by:** 07 Open packs and read cards

**Status:** done

- [x] Drawing a unique footballer stamps the Album
- [x] Each Club has a published 11-name Club set
- [x] Completing a set grants +1 player pull the following Gameweek only
- [x] At most one Album pull per Gameweek
- [x] Album does not modify Match points or Skill wagers

## Comments

`CLUB_SETS` in `season-catalogue.ts` publishes an 11-name set per Club (a subset of the season catalogue). `AlbumService` (`album.ts`, `album-store.ts`, `album-service.ts`) stamps each unique footballer drawn, tracks completed sets, and schedules a single `albumPullFor` Gameweek id one week ahead on completion. `pullForGameweek` returns 0 or 1, so multiple completions in one Gameweek still grant one pull; `openGameweekPacks` applies it to the next Gameweek's pack and consumes it so a refresh cannot double-spend.

`PackService.openPacks` takes `extraPlayerPulls` and appends that many unique footballers only; the Skill pack is untouched and `ALBUM_PULL` is `{ player: 1, skill: 0 }`. Settlement never reads the Album, so Match points and Skill wagers are unaffected. `AlbumPanel` shows stamp count, per-Club progress, and the pending pull.
