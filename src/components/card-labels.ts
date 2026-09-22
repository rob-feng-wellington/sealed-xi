import type { Rarity } from "../gameweek/catalogues.ts";
import type { Position } from "../gameweek/settle-match-points.ts";

export const POSITION_LABELS: Record<Position, string> = {
  GK: "门将",
  DEF: "后卫",
  MID: "中场",
  FWD: "前锋",
};

export const RARITY_LABELS: Record<Rarity, string> = {
  epic: "史诗",
  superRare: "超稀有",
  rare: "稀有",
};
