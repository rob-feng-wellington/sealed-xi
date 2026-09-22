import type { SkillWager, VendorStat } from "./catalogues.ts";

const STAT_LABELS: Record<VendorStat, string> = {
  shotsOnTarget: "射正",
  keyPasses: "关键传球",
  tackles: "抢断",
  interceptions: "拦截",
  successfulDribbles: "成功过人",
  saves: "扑救",
};

export const BAND_LABELS = {
  Easy: "简单",
  Hard: "困难",
  Ultra: "超难",
} as const;

export function describeSkill(wager: SkillWager): string {
  switch (wager.kind) {
    case "vendor":
      return `${STAT_LABELS[wager.stat]} ≥ ${wager.atLeast}`;
    case "public":
      return "零封（门将 / 后卫）";
    case "derived":
      if (wager.event === "brace") {
        return "梅开二度";
      }
      if (wager.event === "goalAndAssist") {
        return "进球 + 助攻";
      }
      return "帽子戏法";
  }
}
