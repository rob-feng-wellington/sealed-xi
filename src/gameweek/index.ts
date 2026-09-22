export type { GameweekId } from "./gameweek.ts";
export {
  currentGameweekId,
  isoWeekId,
  mondayOfIsoWeek,
  nextGameweekId,
  parseGameweekId,
} from "./gameweek.ts";
export type { SealedPool } from "./pool.ts";
export { hasPlayingRights } from "./pool.ts";
export type { SealedPoolStore } from "./pool-store.ts";
export { InMemoryPoolStore, LocalStoragePoolStore } from "./pool-store.ts";
export { PackService, createPackService } from "./pack-service.ts";
export { BAND_LABELS, describeSkill } from "./skill-text.ts";
export { CLUB_SETS, FOOTBALLER_CATALOGUE } from "./season-catalogue.ts";
export type { PlayerCard, GameweekPacks } from "./generate-packs.ts";
export type { SkillWager } from "./catalogues.ts";

export {
  DEADLINE_LEAD_MINUTES,
  deadlineForGameweek,
  deadlineFromFirstKickoff,
  isPastDeadline,
  scheduledFirstKickoff,
} from "./deadline.ts";
export {
  BENCH_COUNT,
  CLUB_CAP,
  FORMATION,
  STARTER_COUNT,
  addBench,
  addStarter,
  emptyDraft,
  isLegalLineup,
  lineupRole,
  moveBench,
  removeFromLineup,
  setCaptain,
  setSkill,
  skillKey,
  toLockedLineup,
  validateLineup,
} from "./lineup.ts";
export type { LineupDraft, LineupIssue, LineupRole } from "./lineup.ts";
export type { LineupState, LineupStatus, LineupStore } from "./lineup-store.ts";
export {
  InMemoryLineupStore,
  LocalStorageLineupStore,
} from "./lineup-store.ts";
export { LineupService, createLineupService } from "./lineup-service.ts";
export type { LineupResult } from "./lineup-service.ts";

export {
  TASK_CAP_ITEMS,
  TASK_CAP_REWARD,
  emptyTaskCap,
  isTaskCapComplete,
  taskCapReward,
} from "./task-cap.ts";
export type {
  TaskCapItem,
  TaskCapReward,
  TaskCapState,
  TaskCapTasks,
} from "./task-cap.ts";
export type { TaskCapStore } from "./task-cap-store.ts";
export {
  InMemoryTaskCapStore,
  LocalStorageTaskCapStore,
} from "./task-cap-store.ts";
export { TaskCapService, createTaskCapService } from "./task-cap-service.ts";
export type { PeekResult, TaskCapResult } from "./task-cap-service.ts";

export { fixtureKey, ingestFixture } from "./ingest.ts";
export type {
  IngestedFixture,
  IngestedPlayerFacts,
  VendorFixture,
  VendorPlayerStat,
} from "./ingest.ts";
export type { MatchFactsStore } from "./match-facts-store.ts";
export {
  InMemoryMatchFactsStore,
  LocalStorageMatchFactsStore,
  factsByFootballer,
} from "./match-facts-store.ts";
export type { ManagerSettlement, SettlementStore } from "./settlement.ts";
export {
  InMemorySettlementStore,
  LocalStorageSettlementStore,
} from "./settlement.ts";
export {
  SettlementService,
  createSettlementService,
} from "./settlement-service.ts";
export type { LeagueTableRow, OpenTableRow, SettleResult } from "./settlement-service.ts";

export {
  ALBUM_PULL,
  clubSetProgress,
  completedClubSets,
  emptyAlbum,
} from "./album.ts";
export type { AlbumState, ClubSetProgress } from "./album.ts";
export type { AlbumStore } from "./album-store.ts";
export {
  InMemoryAlbumStore,
  LocalStorageAlbumStore,
} from "./album-store.ts";
export { AlbumService, createAlbumService } from "./album-service.ts";
export type { AlbumDrawResult } from "./album-service.ts";
