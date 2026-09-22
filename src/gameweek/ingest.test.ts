import { describe, expect, it } from "vitest";
import { fixtureKey, ingestFixture, type VendorFixture } from "./ingest.ts";

const FROZEN_KEYS = [
  "assists",
  "goals",
  "goalsConcededByClub",
  "interceptions",
  "keyPasses",
  "minutes",
  "ownGoals",
  "reds",
  "saves",
  "shotsOnTarget",
  "successfulDribbles",
  "tackles",
  "yellows",
].sort();

const fixture: VendorFixture = {
  gameweekId: "2025-W38",
  homeClub: "Home",
  awayClub: "Away",
  homeGoals: 2,
  awayGoals: 1,
  kickoff: "2025-09-20T12:30:00.000Z",
  players: [
    {
      playerName: "Home Keeper",
      club: "Home",
      minutes: 90,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      ownGoals: 0,
      shotsOnTarget: 0,
      keyPasses: 0,
      tackles: 0,
      interceptions: 0,
      successfulDribbles: 0,
      saves: 4,
    },
    {
      playerName: "Home Striker",
      club: "Home",
      minutes: 90,
      goals: 2,
      assists: 0,
      yellowCards: 1,
      redCards: 0,
      ownGoals: 0,
      shotsOnTarget: 4,
      keyPasses: 1,
      tackles: 1,
      interceptions: 0,
      successfulDribbles: 3,
      saves: 0,
    },
    {
      playerName: "Away Defender",
      club: "Away",
      minutes: 90,
      goals: 0,
      assists: 1,
      yellowCards: 0,
      redCards: 0,
      ownGoals: 1,
      shotsOnTarget: 0,
      keyPasses: 2,
      tackles: 2,
      interceptions: 3,
      successfulDribbles: 0,
      saves: 0,
    },
  ],
};

describe("ingestFixture", () => {
  it("maps a finished fixture into the frozen facts only", () => {
    const ingested = ingestFixture(fixture);

    expect(ingested.gameweekId).toBe("2025-W38");
    expect(ingested.kickoff).toBe("2025-09-20T12:30:00.000Z");
    expect(ingested.players).toHaveLength(3);
    for (const player of ingested.players) {
      expect(Object.keys(player.facts).sort()).toEqual(FROZEN_KEYS);
    }
  });

  it("derives goals conceded per Club from the fixture score", () => {
    const ingested = ingestFixture(fixture);
    const home = ingested.players.find((p) => p.footballerName === "Home Striker");
    const away = ingested.players.find((p) => p.footballerName === "Away Defender");

    expect(home!.facts.goalsConcededByClub).toBe(1);
    expect(away!.facts.goalsConcededByClub).toBe(2);
  });

  it("keeps Public events and Vendor stats, including an own goal", () => {
    const ingested = ingestFixture(fixture);
    const striker = ingested.players.find((p) => p.footballerName === "Home Striker");
    const defender = ingested.players.find((p) => p.footballerName === "Away Defender");

    expect(striker!.facts).toMatchObject({
      minutes: 90,
      goals: 2,
      yellows: 1,
      shotsOnTarget: 4,
      successfulDribbles: 3,
    });
    expect(defender!.facts).toMatchObject({ assists: 1, ownGoals: 1, tackles: 2 });
  });

  it("ignores vendor fields outside the freeze", () => {
    const withExtras: VendorFixture = {
      ...fixture,
      players: [
        {
          ...fixture.players[0]!,
          passAccuracy: 91,
          xG: 0.4,
          rating: 8.1,
          clearances: 3,
        } as VendorFixture["players"][number],
      ],
    };

    const ingested = ingestFixture(withExtras);

    expect(Object.keys(ingested.players[0]!.facts).sort()).toEqual(FROZEN_KEYS);
  });

  it("keys a fixture by Gameweek and the two Clubs", () => {
    expect(fixtureKey(ingestFixture(fixture))).toBe("2025-W38:Home:Away");
  });
});
