import { RARITY_CAPS, type Rarity, type SkillWager } from "./catalogues.ts";
import type { Position } from "./settle-match-points.ts";

export type PlayerCard = {
  footballerName: string;
  club: string;
  position: Position;
  rarity: Rarity;
};

export type GameweekPacks = {
  basePack: readonly PlayerCard[];
  skillPack: readonly SkillWager[];
};

const POSITIONS: readonly Position[] = ["GK", "DEF", "MID", "FWD"];
const RARITY_QUOTA: Record<Rarity, number> = { epic: 2, superRare: 3, rare: 19 };
const POSITION_FLOOR: Record<Position, number> = { GK: 2, DEF: 4, MID: 4, FWD: 2 };
const SKILL_PACK_SIZE = 14;
const SKILL_BAND_FLOOR = { Easy: 5, Hard: 5 } as const;
const ULTRA_MIN = 1;
const ULTRA_MAX = 3;
const LINEUP_SIZE = 15;
const STARTING_ELEVEN = 11;
const LINEUP_CLUB_CAP = 3;
const LINEUP_FORMATION = { GK: 1, DEF: 3, MID: 2, FWD: 1 } as const;
const MAX_BASE_PACK_ATTEMPTS = 40;

export function generateGameweekPacks(
  playerCards: readonly PlayerCard[],
  skills: readonly SkillWager[],
  random: () => number,
): GameweekPacks {
  return {
    basePack: generateBasePack(playerCards, random),
    skillPack: generateSkillPack(skills, random),
  };
}

function generateBasePack(
  playerCards: readonly PlayerCard[],
  random: () => number,
): PlayerCard[] {
  for (let attempt = 0; attempt < MAX_BASE_PACK_ATTEMPTS; attempt++) {
    const pack = dealBasePack(playerCards, random);
    if (allowsLegalLineup(pack)) {
      return pack;
    }
  }
  throw new Error("catalogue cannot fill this Gameweek's Base pack");
}

function dealBasePack(
  playerCards: readonly PlayerCard[],
  random: () => number,
): PlayerCard[] {
  const available = shuffle(playerCards, random);
  const pack: PlayerCard[] = [];
  const rarityLeft: Record<Rarity, number> = { ...RARITY_QUOTA };

  for (const position of POSITIONS) {
    for (let n = 0; n < POSITION_FLOOR[position]; n++) {
      const chosen = drawMatchingCard(available, pack, (card) => {
        return card.position === position && rarityLeft[card.rarity] > 0;
      });
      rarityLeft[chosen.rarity] -= 1;
    }
  }

  for (const rarity of Object.keys(rarityLeft) as Rarity[]) {
    while (rarityLeft[rarity] > 0) {
      drawMatchingCard(available, pack, (card) => card.rarity === rarity);
      rarityLeft[rarity] -= 1;
    }
  }

  return shuffle(pack, random);
}

function generateSkillPack(
  skills: readonly SkillWager[],
  random: () => number,
): SkillWager[] {
  const byBand = {
    Easy: skills.filter((skill) => skill.band === "Easy"),
    Hard: skills.filter((skill) => skill.band === "Hard"),
    Ultra: skills.filter((skill) => skill.band === "Ultra"),
  };
  const ultraCount = ULTRA_MIN + Math.floor(random() * (ULTRA_MAX - ULTRA_MIN + 1));
  const pack: SkillWager[] = [];
  pickMany(pack, byBand.Easy, SKILL_BAND_FLOOR.Easy, random);
  pickMany(pack, byBand.Hard, SKILL_BAND_FLOOR.Hard, random);
  pickMany(pack, byBand.Ultra, ultraCount, random);

  while (pack.length < SKILL_PACK_SIZE) {
    const ultraInPack = pack.filter((skill) => skill.band === "Ultra").length;
    const pool = [
      ...byBand.Easy,
      ...byBand.Hard,
      ...(ultraInPack < ULTRA_MAX ? byBand.Ultra : []),
    ];
    pack.push(pickOne(pool, random));
  }

  return shuffle(pack, random);
}

function drawMatchingCard(
  available: PlayerCard[],
  pack: PlayerCard[],
  matches: (card: PlayerCard) => boolean,
): PlayerCard {
  const chosen = available.find(matches);
  if (!chosen) {
    throw new Error("catalogue cannot fill this Gameweek's Base pack");
  }
  available.splice(available.indexOf(chosen), 1);
  pack.push(chosen);
  return chosen;
}

function allowsLegalLineup(pool: readonly PlayerCard[]): boolean {
  return searchRoster(pool, 0, [], new Map());
}

function searchRoster(
  pool: readonly PlayerCard[],
  index: number,
  chosen: PlayerCard[],
  clubCounts: Map<string, number>,
): boolean {
  if (chosen.length === LINEUP_SIZE) {
    return hasLegalStarters(chosen);
  }
  if (index >= pool.length || chosen.length + (pool.length - index) < LINEUP_SIZE) {
    return false;
  }

  const card = pool[index]!;
  const used = clubCounts.get(card.club) ?? 0;
  if (used < LINEUP_CLUB_CAP) {
    clubCounts.set(card.club, used + 1);
    chosen.push(card);
    if (searchRoster(pool, index + 1, chosen, clubCounts)) {
      return true;
    }
    chosen.pop();
    clubCounts.set(card.club, used);
  }

  return searchRoster(pool, index + 1, chosen, clubCounts);
}

function hasLegalStarters(roster: readonly PlayerCard[]): boolean {
  const n = roster.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    if (bitCount(mask) !== STARTING_ELEVEN) {
      continue;
    }
    const starters: PlayerCard[] = [];
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) !== 0) {
        starters.push(roster[i]!);
      }
    }
    if (isLegalStartingEleven(starters)) {
      return true;
    }
  }
  return false;
}

function isLegalStartingEleven(starters: readonly PlayerCard[]): boolean {
  const gk = starters.filter((card) => card.position === "GK").length;
  const def = starters.filter((card) => card.position === "DEF").length;
  const mid = starters.filter((card) => card.position === "MID").length;
  const fwd = starters.filter((card) => card.position === "FWD").length;
  if (gk !== LINEUP_FORMATION.GK) {
    return false;
  }
  if (def < LINEUP_FORMATION.DEF || mid < LINEUP_FORMATION.MID || fwd < LINEUP_FORMATION.FWD) {
    return false;
  }
  const epic = starters.filter((card) => card.rarity === "epic").length;
  const superRare = starters.filter((card) => card.rarity === "superRare").length;
  return epic <= RARITY_CAPS.epic && superRare <= RARITY_CAPS.superRare;
}

function bitCount(mask: number): number {
  let count = 0;
  while (mask !== 0) {
    count += mask & 1;
    mask >>>= 1;
  }
  return count;
}

function pickMany(
  pack: SkillWager[],
  pool: readonly SkillWager[],
  count: number,
  random: () => number,
): void {
  for (let n = 0; n < count; n++) {
    pack.push(pickOne(pool, random));
  }
}

function pickOne<T>(pool: readonly T[], random: () => number): T {
  if (pool.length === 0) {
    throw new Error("catalogue cannot fill this Gameweek's Skill pack");
  }
  return pool[Math.floor(random() * pool.length)]!;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = swap;
  }
  return copy;
}