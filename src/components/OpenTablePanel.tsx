import React, { useEffect, useState } from "react";
import type { OpenTableRow, SettlementService } from "../gameweek/index.ts";

interface OpenTablePanelProps {
  gameweekId: string;
  settlementService: SettlementService;
}

export function OpenTablePanel({
  gameweekId,
  settlementService,
}: OpenTablePanelProps) {
  const [weekly, setWeekly] = useState<readonly OpenTableRow[]>([]);
  const [season, setSeason] = useState<readonly OpenTableRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      settlementService.openWeeklyTable(gameweekId),
      settlementService.openSeasonTable(),
    ]).then(([weekRows, seasonRows]) => {
      if (cancelled) return;
      setWeekly(weekRows);
      setSeason(seasonRows);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [gameweekId, settlementService]);

  return (
    <section className="space-y-3">
      <header className="text-center">
        <h2 className="text-base font-bold text-slate-300">广场</h2>
        <p className="text-xs text-slate-500">公共看板 · 私人联赛才是主场</p>
      </header>

      {!loaded ? (
        <p className="text-center text-slate-400">加载中…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Board title="本周榜" rows={weekly} />
          <Board title="赛季榜" rows={season} />
        </div>
      )}
    </section>
  );
}

function Board({ title, rows }: { title: string; rows: readonly OpenTableRow[] }) {
  const ranked = [...rows].sort((left, right) => right.points - left.points);
  return (
    <div className="rounded bg-slate-900 p-2">
      <h3 className="mb-1 text-xs font-medium text-slate-400">{title}</h3>
      {ranked.length === 0 ? (
        <p className="text-xs text-slate-500">暂无数据。</p>
      ) : (
        <ol className="space-y-0.5">
          {ranked.map((row, index) => (
            <li
              key={row.managerId}
              className="flex justify-between text-xs text-slate-300"
            >
              <span>
                {index + 1}. 经理 {row.managerId}
              </span>
              <span>{row.points}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
