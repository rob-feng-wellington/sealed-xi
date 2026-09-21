# 04: Pack generation

**What to build:** Opening a Gameweek yields a Base pack of 24 Player cards (2 epic, 3 super rare, 19 rare; position floors) and a Skill pack of 14 Skill cards (at least 5 Easy, 5 Hard, 1-3 Ultra) from which a legal 11+4 Lineup is always possible.

**Blocked by:** 01 Catalogues and Match points settlement

**Status:** done

- [x] Base pack size is 24 with 2 epic, 3 super rare, and 19 rare
- [x] Base pack position floor is at least 2 GK, 4 DEF, 4 MID, 2 FWD
- [x] Skill pack size is 14 with at least 5 Easy, 5 Hard, and 1-3 Ultra
- [x] Duplicate Skill names are allowed
- [x] Generated pools can always assemble a legal Lineup (1 GK, at least 3 DEF, 2 MID, 1 FWD, 4 bench)
- [x] Tests do not go through React

## Comments

Implemented at `generateGameweekPacks` in `src/gameweek/generate-packs.ts`. Packs are generated from an injected footballer catalogue and Skill catalogue; tests stay on that Gameweek seam.

Rarity bands are now epic / super rare / rare (no common). Starting-11 caps are 3 epic and 4 super rare, with rare uncapped, so a 2+3+19 pack can still form a legal XI. This contradicts ADR 0003 / 0004 / 0012 (20-24 and 14-18 ranges, epic/rare/common bands, floor of 2 epic and 3 rare).

Review fixes (2026-09-21): `allowsLegalLineup` is exported at the Gameweek seam and the tests assert against it instead of a copied search; the predicate itself is pinned by hand-built pools against the literal formation floor, Rarity cap, and Club cap. Failed deals now fall back into the retry loop instead of throwing past it, and the pack-level Club preference was removed so same-Club overflow stays possible. ADR 0003 / 0004 / 0012 are marked superseded in part.
