import { describe, expect, it } from "vitest";
import {
  CLUB_SET_SIZE,
  MATCH_POINTS,
  RARITY_BANDS,
  RARITY_CAPS,
  SKILL_CATALOGUE,
  SKILL_WAGER_PAYOUTS,
} from "./catalogues.ts";

describe("season catalogues", () => {
  it("publishes Match points values from the always-on table", () => {
    expect(MATCH_POINTS).toEqual({
      appearance: 1,
      goal: 5,
      assist: 3,
      cleanSheet: 4,
      yellow: -1,
      red: -3,
    });
  });

  it("publishes Rarity bands and starting-11 caps", () => {
    expect(RARITY_BANDS).toEqual(["epic", "rare", "common"]);
    expect(RARITY_CAPS).toEqual({ epic: 3, rare: 4 });
  });

  it("fixes a Club set at 11 named footballers", () => {
    expect(CLUB_SET_SIZE).toBe(11);
  });

  it("freezes the 18 Skill wagers and their bands", () => {
    expect(SKILL_WAGER_PAYOUTS).toEqual({
      Easy: { hit: 2, miss: -1 },
      Hard: { hit: 4, miss: -1 },
      Ultra: { hit: 8, miss: -1 },
    });

    expect(SKILL_CATALOGUE).toEqual([
      { band: "Easy", kind: "vendor", stat: "shotsOnTarget", atLeast: 1 },
      { band: "Easy", kind: "vendor", stat: "keyPasses", atLeast: 1 },
      { band: "Easy", kind: "vendor", stat: "tackles", atLeast: 2 },
      { band: "Easy", kind: "vendor", stat: "interceptions", atLeast: 1 },
      { band: "Easy", kind: "vendor", stat: "successfulDribbles", atLeast: 2 },
      { band: "Easy", kind: "vendor", stat: "saves", atLeast: 3 },
      { band: "Easy", kind: "public", event: "cleanSheet" },
      { band: "Hard", kind: "vendor", stat: "successfulDribbles", atLeast: 5 },
      { band: "Hard", kind: "vendor", stat: "shotsOnTarget", atLeast: 4 },
      { band: "Hard", kind: "vendor", stat: "keyPasses", atLeast: 4 },
      { band: "Hard", kind: "vendor", stat: "tackles", atLeast: 6 },
      { band: "Hard", kind: "vendor", stat: "saves", atLeast: 8 },
      { band: "Hard", kind: "derived", event: "brace" },
      { band: "Hard", kind: "derived", event: "goalAndAssist" },
      { band: "Ultra", kind: "derived", event: "hatTrick" },
      { band: "Ultra", kind: "vendor", stat: "successfulDribbles", atLeast: 8 },
      { band: "Ultra", kind: "vendor", stat: "shotsOnTarget", atLeast: 6 },
      { band: "Ultra", kind: "vendor", stat: "saves", atLeast: 12 },
    ]);
  });
});