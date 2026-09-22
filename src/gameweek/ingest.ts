import type { GameweekId } from "./gameweek.ts";
import type { SkillMatchFacts } from "./settle-skill-wager.ts";

/**
 * What the paid post-match feed hands us: Public events plus the frozen v1
 * Vendor stats only. Body part, xG, rating, pass accuracy, and clearances are
 * deliberately absent.
 */
export type VendorPlayerStat = {
  playerName: string;
  club: string;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  shotsOnTarget: number;
  keyPasses: number;
  tackles: number;
  interceptions: number;
  successfulDribbles: number;
  saves: number;
};

export type VendorFixture = {
  gameweekId: GameweekId;
  homeClub: string;
  awayClub: string;
  homeGoals: number;
  awayGoals: number;
  kickoff: string;
  players: readonly VendorPlayerStat[];
};

export type IngestedPlayerFacts = {
  footballerName: string;
  club: string;
  facts: SkillMatchFacts;
};

export type IngestedFixture = {
  gameweekId: GameweekId;
  homeClub: string;
  awayClub: string;
  kickoff: string;
  players: readonly IngestedPlayerFacts[];
};

export function fixtureKey(fixture: IngestedFixture): string {
  return `${fixture.gameweekId}:${fixture.homeClub}:${fixture.awayClub}`;
}

/**
 * Map a finished fixture into Public events and the six Vendor stats. Goals
 * conceded are derived from the fixture score for each Club.
 */
export function ingestFixture(fixture: VendorFixture): IngestedFixture {
  const conceded = new Map<string, number>([
    [fixture.homeClub, fixture.awayGoals],
    [fixture.awayClub, fixture.homeGoals],
  ]);

  return {
    gameweekId: fixture.gameweekId,
    homeClub: fixture.homeClub,
    awayClub: fixture.awayClub,
    kickoff: fixture.kickoff,
    players: fixture.players.map((player) => ({
      footballerName: player.playerName,
      club: player.club,
      facts: {
        minutes: player.minutes,
        goals: player.goals,
        assists: player.assists,
        yellows: player.yellowCards,
        reds: player.redCards,
        goalsConcededByClub: conceded.get(player.club) ?? 0,
        ownGoals: player.ownGoals,
        shotsOnTarget: player.shotsOnTarget,
        keyPasses: player.keyPasses,
        tackles: player.tackles,
        interceptions: player.interceptions,
        successfulDribbles: player.successfulDribbles,
        saves: player.saves,
      },
    })),
  };
}
