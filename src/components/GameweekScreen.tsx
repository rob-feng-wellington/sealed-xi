import React, { useEffect, useState } from "react";
import {
  createPackService,
  LocalStoragePoolStore,
  type LineupService,
  type PackService,
  type SealedPool,
} from "../gameweek/index.ts";
import { LineupBuilder } from "./LineupBuilder.tsx";
import { PlayerCardView } from "./PlayerCardView.tsx";
import { SkillCardView } from "./SkillCardView.tsx";

const defaultPackService = createPackService(new LocalStoragePoolStore());

interface GameweekScreenProps {
  managerId: string;
  gameweekId: string;
  packService?: PackService;
  lineupService?: LineupService;
  now?: Date;
  onTentativeSaved?: () => void;
  onPoolOpened?: () => void;
}

export function GameweekScreen({
  managerId,
  gameweekId,
  packService = defaultPackService,
  lineupService,
  now,
  onTentativeSaved,
  onPoolOpened,
}: GameweekScreenProps) {
  const [pool, setPool] = useState<SealedPool | null | undefined>(undefined);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;
    packService.getPool(managerId, gameweekId).then((found) => {
      if (!cancelled) setPool(found ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [managerId, gameweekId, packService]);

  async function handleOpen() {
    setOpening(true);
    const opened = await packService.openPacks(managerId, gameweekId);
    setPool(opened);
    setOpening(false);
    onPoolOpened?.();
  }

  return (
    <section className="space-y-6">
      <header className="text-center">
        <h2 className="text-lg font-bold">本周卡包</h2>
        <p className="text-xs text-slate-500">{gameweekId} · 仅限本周使用</p>
      </header>

      {pool === undefined && <p className="text-center text-slate-400">加载中…</p>}

      {pool === null && (
        <div className="text-center">
          <button
            type="button"
            onClick={handleOpen}
            disabled={opening}
            className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:bg-slate-600"
          >
            {opening ? "开包中…" : "开启本周卡包"}
          </button>
        </div>
      )}

      {pool !== null && pool !== undefined && (
        <>
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-300">
              基础包 · {pool.basePack.length} 张
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {pool.basePack.map((card, index) => (
                <PlayerCardView key={`${card.footballerName}-${index}`} card={card} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-300">
              技能包 · {pool.skillPack.length} 张
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {pool.skillPack.map((skill, index) => (
                <SkillCardView key={index} skill={skill} />
              ))}
            </div>
          </div>

          <LineupBuilder
            managerId={managerId}
            gameweekId={gameweekId}
            pool={pool}
            lineupService={lineupService}
            now={now}
            onTentativeSaved={onTentativeSaved}
          />
        </>
      )}
    </section>
  );
}
