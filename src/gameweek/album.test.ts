import { describe, expect, it } from "vitest";
import {
  ALBUM_PULL,
  clubSetProgress,
  completedClubSets,
  emptyAlbum,
} from "./album.ts";
import { CLUB_SETS, FOOTBALLER_CATALOGUE } from "./season-catalogue.ts";

const arsenal = CLUB_SETS.find((set) => set.club === "Arsenal")!;

describe("Album", () => {
  it("starts empty", () => {
    expect(emptyAlbum("m1")).toEqual({
      managerId: "m1",
      stamps: [],
      albumPullFor: null,
    });
  });

  it("publishes an 11-name Club set per Club from the catalogue", () => {
    const known = new Set(
      FOOTBALLER_CATALOGUE.map((card) => `${card.club}|${card.footballerName}`),
    );
    expect(CLUB_SETS).toHaveLength(8);
    for (const clubSet of CLUB_SETS) {
      expect(clubSet.footballerNames).toHaveLength(11);
      for (const name of clubSet.footballerNames) {
        expect(known.has(`${clubSet.club}|${name}`)).toBe(true);
      }
    }
  });

  it("completes a Club set only with all 11 names", () => {
    expect(completedClubSets([])).toEqual([]);
    expect(completedClubSets(arsenal.footballerNames.slice(0, 10))).toEqual([]);
    expect(completedClubSets(arsenal.footballerNames)).toEqual(["Arsenal"]);
  });

  it("reports Club set progress", () => {
    const progress = clubSetProgress(arsenal.footballerNames.slice(0, 3)).find(
      (entry) => entry.club === "Arsenal",
    );

    expect(progress).toEqual({
      club: "Arsenal",
      stamped: 3,
      total: 11,
      complete: false,
    });
  });

  it("grants only a player pull, never a Skill pull", () => {
    expect(ALBUM_PULL).toEqual({ player: 1, skill: 0 });
  });
});
