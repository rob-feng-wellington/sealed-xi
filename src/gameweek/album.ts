import type { GameweekId } from "./gameweek.ts";
import { CLUB_SETS } from "./season-catalogue.ts";

/**
 * The Album only ever grants an extra player pull next Gameweek. It never adds
 * Skill pulls and never touches Match points or Skill wagers.
 */
export const ALBUM_PULL = { player: 1, skill: 0 } as const;

export type AlbumState = {
  managerId: string;
  stamps: readonly string[];
  /** The Gameweek an Album pull is owed for, or null. At most one at a time. */
  albumPullFor: GameweekId | null;
};

export type ClubSetProgress = {
  club: string;
  stamped: number;
  total: number;
  complete: boolean;
};

export function emptyAlbum(managerId: string): AlbumState {
  return { managerId, stamps: [], albumPullFor: null };
}

export function completedClubSets(stamps: readonly string[]): readonly string[] {
  const owned = new Set(stamps);
  return CLUB_SETS.filter((clubSet) =>
    clubSet.footballerNames.every((name) => owned.has(name)),
  ).map((clubSet) => clubSet.club);
}

export function clubSetProgress(stamps: readonly string[]): readonly ClubSetProgress[] {
  const owned = new Set(stamps);
  return CLUB_SETS.map((clubSet) => {
    const stamped = clubSet.footballerNames.filter((name) => owned.has(name)).length;
    return {
      club: clubSet.club,
      stamped,
      total: clubSet.footballerNames.length,
      complete: stamped === clubSet.footballerNames.length,
    };
  });
}
