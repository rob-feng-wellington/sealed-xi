import { describe, expect, it } from "vitest";
import { describeSkill } from "./skill-text.ts";

describe("describeSkill", () => {
  it("names a vendor stat threshold", () => {
    expect(
      describeSkill({ band: "Easy", kind: "vendor", stat: "shotsOnTarget", atLeast: 1 }),
    ).toBe("射正 ≥ 1");
    expect(
      describeSkill({ band: "Hard", kind: "vendor", stat: "tackles", atLeast: 6 }),
    ).toBe("抢断 ≥ 6");
  });

  it("names a public clean sheet", () => {
    expect(describeSkill({ band: "Easy", kind: "public", event: "cleanSheet" })).toBe(
      "零封（门将 / 后卫）",
    );
  });

  it("names derived events", () => {
    expect(describeSkill({ band: "Hard", kind: "derived", event: "brace" })).toBe(
      "梅开二度",
    );
    expect(
      describeSkill({ band: "Hard", kind: "derived", event: "goalAndAssist" }),
    ).toBe("进球 + 助攻");
    expect(describeSkill({ band: "Ultra", kind: "derived", event: "hatTrick" })).toBe(
      "帽子戏法",
    );
  });
});
