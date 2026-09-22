import { describe, expect, it, beforeEach } from "vitest";
import { ingestFixture, type IngestedFixture } from "./ingest.ts";
import {
  InMemoryMatchFactsStore,
  LocalStorageMatchFactsStore,
  factsByFootballer,
} from "./match-facts-store.ts";

function player(name: string, club: string, goals: number, minutes = 90) {
  return {
    playerName: name,
    club,
    minutes,
    goals,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    ownGoals: 0,
    shotsOnTarget: 0,
    keyPasses: 0,
    tackles: 0,
    interceptions: 0,
    successfulDribbles: 0,
    saves: 0,
  };
}

function fixture(homeClub: string, awayClub: string): IngestedFixture {
  return ingestFixture({
    gameweekId: "2025-W38",
    homeClub,
    awayClub,
    homeGoals: 1,
    awayGoals: 0,
    kickoff: "2025-09-20T12:30:00.000Z",
    players: [player("Target", homeClub, 1)],
  });
}

describe("factsByFootballer", () => {
  it("collects one entry per match for a Double", () => {
    const facts = factsByFootballer([fixture("Home", "Away"), fixture("Home", "Third")]);

    expect(facts.get("Target")).toHaveLength(2);
  });
});

describe("InMemoryMatchFactsStore", () => {
  it("aggregates the Gameweek's fixtures by footballer", async () => {
    const store = new InMemoryMatchFactsStore();
    await store.saveFixture(fixture("Home", "Away"));
    await store.saveFixture(fixture("Home", "Third"));

    const facts = await store.getFacts("2025-W38");

    expect(facts.get("Target")).toHaveLength(2);
    expect((await store.getFacts("2025-W39")).size).toBe(0);
  });

  it("replaces a fixture rather than duplicating it", async () => {
    const store = new InMemoryMatchFactsStore();
    await store.saveFixture(fixture("Home", "Away"));
    await store.saveFixture(fixture("Home", "Away"));

    expect(await store.getFixtures("2025-W38")).toHaveLength(1);
  });
});

describe("LocalStorageMatchFactsStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists fixtures across store instances", async () => {
    const first = new LocalStorageMatchFactsStore();
    await first.saveFixture(fixture("Home", "Away"));

    const second = new LocalStorageMatchFactsStore();
    const facts = await second.getFacts("2025-W38");

    expect(facts.get("Target")).toHaveLength(1);
  });
});
