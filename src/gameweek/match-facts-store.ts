import type { GameweekId } from "./gameweek.ts";
import { fixtureKey, type IngestedFixture } from "./ingest.ts";
import type { SkillMatchFacts } from "./settle-skill-wager.ts";

export interface MatchFactsStore {
  saveFixture(fixture: IngestedFixture): Promise<void>;
  getFixtures(gameweekId: GameweekId): Promise<readonly IngestedFixture[]>;
  getFacts(
    gameweekId: GameweekId,
  ): Promise<ReadonlyMap<string, readonly SkillMatchFacts[]>>;
}

export function factsByFootballer(
  fixtures: readonly IngestedFixture[],
): Map<string, SkillMatchFacts[]> {
  const facts = new Map<string, SkillMatchFacts[]>();
  for (const fixture of fixtures) {
    for (const player of fixture.players) {
      const existing = facts.get(player.footballerName) ?? [];
      existing.push(player.facts);
      facts.set(player.footballerName, existing);
    }
  }
  return facts;
}

const MATCH_FACTS_STORAGE_KEY = "sealed-xi:match-facts";

interface PersistedMatchFactsData {
  fixtures: Record<string, IngestedFixture>;
}

export class LocalStorageMatchFactsStore implements MatchFactsStore {
  constructor(private storage: Storage = localStorage) {}

  private load(): PersistedMatchFactsData {
    const raw = this.storage.getItem(MATCH_FACTS_STORAGE_KEY);
    if (!raw) return { fixtures: {} };
    return JSON.parse(raw) as PersistedMatchFactsData;
  }

  private save(data: PersistedMatchFactsData): void {
    this.storage.setItem(MATCH_FACTS_STORAGE_KEY, JSON.stringify(data));
  }

  async saveFixture(fixture: IngestedFixture): Promise<void> {
    const data = this.load();
    data.fixtures[fixtureKey(fixture)] = fixture;
    this.save(data);
  }

  async getFixtures(gameweekId: GameweekId): Promise<readonly IngestedFixture[]> {
    return Object.values(this.load().fixtures).filter(
      (fixture) => fixture.gameweekId === gameweekId,
    );
  }

  async getFacts(
    gameweekId: GameweekId,
  ): Promise<ReadonlyMap<string, readonly SkillMatchFacts[]>> {
    return factsByFootballer(await this.getFixtures(gameweekId));
  }
}

export class InMemoryMatchFactsStore implements MatchFactsStore {
  private fixtures = new Map<string, IngestedFixture>();

  async saveFixture(fixture: IngestedFixture): Promise<void> {
    this.fixtures.set(fixtureKey(fixture), fixture);
  }

  async getFixtures(gameweekId: GameweekId): Promise<readonly IngestedFixture[]> {
    return [...this.fixtures.values()].filter(
      (fixture) => fixture.gameweekId === gameweekId,
    );
  }

  async getFacts(
    gameweekId: GameweekId,
  ): Promise<ReadonlyMap<string, readonly SkillMatchFacts[]>> {
    return factsByFootballer(await this.getFixtures(gameweekId));
  }

  clear(): void {
    this.fixtures.clear();
  }
}
