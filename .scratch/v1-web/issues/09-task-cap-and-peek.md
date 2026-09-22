# 09: Task cap and Peek

**What to build:** Before Deadline the manager can finish three tasks: log in, submit a tentative Lineup, Peek exactly one Private league friend's tentative Lineup. Finishing all three grants +2 player pulls and +1 Skill pull this Gameweek. The rest of the league's pools stay hidden until lock.

**Blocked by:** 08 Lineup builder and Deadline lock

**Status:** done

- [x] The three Task cap items are log in, submit tentative Lineup, Peek one friend
- [x] Completing all three grants +2 player pulls and +1 Skill pull this Gameweek only
- [x] Peek shows one friend's tentative Lineup, not every Sealed pool
- [x] Ads and last Gameweek's points do not grant pulls
- [x] No prediction mini-game

## Comments

Domain: `src/gameweek/task-cap.ts` (`TASK_CAP_ITEMS`, reward), `task-cap-store.ts`, and `task-cap-service.ts`. Tasks are keyed by manager + Gameweek, so the reward is this Gameweek only and does not stack (`ensureReward` is idempotent). Peek validates Deadline, self, and league membership, and locks to the first friend chosen. `PackService.grantBonusPulls` appends +2 unique footballer pulls and +1 Skill pull to the open pool, recording `bonusPulls`.

The reward is a pure function of the three tasks; there is no ad, last-Gameweek-points, or prediction path. UI is `TaskCapPanel` (task checklist, friend picker, peeked-lineup summary) wired in `App`; `LineupBuilder` notifies a successful tentative save and `GameweekScreen` notifies pool-open so the top-up lands on the open pool.
