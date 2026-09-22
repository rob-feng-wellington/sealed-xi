# 07: Open packs and read cards

**What to build:** In a Gameweek a manager in a Private league opens the Base pack and Skill pack. Cards show written names and original frames only. Playing rights belong to this Gameweek's Sealed pool, not a standing collection they field next week.

**Blocked by:** 04 Pack generation; 06 Private league as home

**Status:** done

- [x] Opening a Gameweek persists this week's Sealed pool and Skill cards for the manager
- [x] Cards are readable as written footballer/Club names (or Skill names) with original frames
- [x] No portraits, crests, kit, or Premier League / FPL marks on cards
- [x] Playing rights are this Gameweek only

## Comments

Implemented at `PackService` (`src/gameweek/pack-service.ts`) over a `SealedPoolStore` (`LocalStoragePoolStore` / `InMemoryPoolStore`). The pool is keyed by manager and Gameweek, so a refresh restores it and the next Gameweek opens a fresh pool. Card UI lives in `PlayerCardView` / `SkillCardView` (original text frames, no images), surfaced by `GameweekScreen` in the Private league home. Season data is read from `FOOTBALLER_CATALOGUE` in `src/gameweek/season-catalogue.ts`; Skill names come from `describeSkill`.
