# 01: Catalogues and Match points settlement

**What to build:** Season tables the domain can read (Rarity bands, the frozen Skill catalogue, Club set shape, Match points values). Given a locked Lineup and post-match facts, settlement returns appearance, goals, assists, clean sheets, cards, own-goal breaking a clean sheet without a personal deduction, and Double Gameweeks summing Match points across both Club matches.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Rarity, Skill catalogue, Club set shape, and Match points constants match `CONTEXT.md` and ADR 0010 / 0012
- [x] Appearance is 1 if and only if the footballer plays at least one minute this Gameweek
- [x] Goal 5, assist 3, yellow -1, red -3 for every position
- [x] Clean sheet 4 only for GK/DEF with >=60 minutes in that match and no goal conceded in that match
- [x] Own goal does not deduct personal points and does break that match's clean sheet
- [x] A Double adds Match points from both Premier League matches this Gameweek
- [x] Tests hit the Gameweek settlement seam only; no React

## Comments

Implemented Gameweek settlement at `settleMatchPoints` plus season catalogues (Rarity caps, 18 Skill wagers, Club set size 11, Match points). Own goals are a match fact: no personal points, and they break that match clean sheet.