import React, { useEffect, useState } from "react";
import {
  clubSetProgress,
  type AlbumService,
  type AlbumState,
} from "../gameweek/index.ts";

interface AlbumPanelProps {
  managerId: string;
  albumService: AlbumService;
  refreshKey?: number;
}

export function AlbumPanel({
  managerId,
  albumService,
  refreshKey = 0,
}: AlbumPanelProps) {
  const [state, setState] = useState<AlbumState | null>(null);

  useEffect(() => {
    let cancelled = false;
    albumService.getState(managerId).then((found) => {
      if (!cancelled) setState(found);
    });
    return () => {
      cancelled = true;
    };
  }, [managerId, albumService, refreshKey]);

  return (
    <section className="space-y-4">
      <header className="text-center">
        <h2 className="text-lg font-bold">图鉴</h2>
      </header>

      {state === null ? (
        <p className="text-center text-slate-400">加载中…</p>
      ) : (
        <>
          <p className="text-center text-sm text-slate-300">
            已收集印记 {state.stamps.length} 个
          </p>

          {state.albumPullFor !== null && (
            <p className="rounded bg-slate-800 p-3 text-center text-xs text-green-300">
              下一周（{state.albumPullFor}）额外 +1 球员抽
            </p>
          )}

          <ul className="grid grid-cols-2 gap-2 text-sm">
            {clubSetProgress(state.stamps).map((entry) => (
              <li
                key={entry.club}
                className={`rounded px-2 py-1 ${
                  entry.complete ? "bg-green-900/40 text-green-200" : "bg-slate-800 text-slate-300"
                }`}
              >
                <span className="text-xs">{entry.club}</span>
                <span className="float-right text-xs">
                  {entry.complete ? "✓ " : ""}
                  {entry.stamped}/{entry.total}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
