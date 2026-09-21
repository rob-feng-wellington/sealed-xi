export const MATCH_POINTS = {
  appearance: 1,
  goal: 5,
  assist: 3,
  cleanSheet: 4,
  yellow: -1,
  red: -3,
} as const;

export const RARITY_BANDS = ["epic", "superRare", "rare"] as const;
export type Rarity = (typeof RARITY_BANDS)[number];

export const RARITY_CAPS = { epic: 3, superRare: 4 } as const;

export const CLUB_SET_SIZE = 11 as const;

export type ClubSet = {
  club: string;
  footballerNames: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
};

export const SKILL_WAGER_PAYOUTS = {
  Easy: { hit: 2, miss: -1 },
  Hard: { hit: 4, miss: -1 },
  Ultra: { hit: 8, miss: -1 },
} as const;

export type VendorStat =
  | "shotsOnTarget"
  | "keyPasses"
  | "tackles"
  | "interceptions"
  | "successfulDribbles"
  | "saves";

export type SkillWager =
  | {
      band: "Easy" | "Hard" | "Ultra";
      kind: "vendor";
      stat: VendorStat;
      atLeast: number;
    }
  | { band: "Easy"; kind: "public"; event: "cleanSheet" }
  | { band: "Hard"; kind: "derived"; event: "brace" | "goalAndAssist" }
  | { band: "Ultra"; kind: "derived"; event: "hatTrick" };

export const SKILL_CATALOGUE: readonly SkillWager[] = [
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
];