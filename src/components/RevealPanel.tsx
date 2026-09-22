import React, { useEffect, useMemo, useState } from "react";
import {
  BAND_LABELS,
  describeSkill,
  isPastDeadline,
  type LeagueTableRow,
  type ManagerSettlement,
  type SettlementService,
  type SkillWager,
} from "../gameweek/index.ts";
import type { League } from "../league/types.ts";

interface RevealPanelProps {
  league: League;
  gameweekId: string;
  settlementService: SettlementService;
  now?: Date;
}

export function RevealPanel({
  league,
  gameweekId,
  settlementService,
  now,
}: RevealPanelProps) {
  const clock = useMemo(() => now ?? new Date(), [now]);
  const revealed = isPastDeadline(clock, settlementService.deadline(gameweekId));
  const [rows, setRows] = useState<readonly LeagueTableRow[]>([]);
  const [settlements, setSettlements] = useState<readonly ManagerSettlement[]>([]);

  useEffect(() => {
    if (!revealed) {
      return;
    }
    let cancelled = false;
    (async () => {
      await settlementService.settleLeague(league, gameweekId, clock);
      const [table, list] = await Promise.all([
        settlementService.leagueTable(league, gameweekId),
        settlementService.settlementsForLeague(league, gameweekId),
      ]);
      if (cancelled) return;
      setRows(table);
      setSettlements(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [revealed, league, gameweekId, settlementService, clock]);

  return (
    <section className="space-y-4">
      <header className="text-center">
        <h2 className="text-lg font-bold">揭晓</h2>
      </header>

      {!revealed ? (
        <p className="rounded bg-slate-800 p-3 text-center text-sm text-slate-400">
          锁阵后揭晓本联赛的阵容与比分。
        </p>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="px-2 py-1 text-left">名次</th>
                <th className="px-2 py-1 text-left">经理</th>
                <th className="px-2 py-1 text-right">本周</th>
                <th className="px-2 py-1 text-right">赛季</th>
              </tr>
            </thead>
            <tbody>
              {rank(rows).map((row, index) => (
                <tr key={row.managerId} className="border-t border-slate-700">
                  <td className="px-2 py-1">{index + 1}</td>
                  <td className="px-2 py-1">好友 {row.managerId}</td>
                  <td className="px-2 py-1 text-right">{row.gameweekPoints}</td>
                  <td className="px-2 py-1 text-right">{row.seasonPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="space-y-3">
            {settlements.map((settlement) => (
              <li key={settlement.managerId} className="rounded bg-slate-800 p-3">
                <h3 className="text-sm font-medium text-slate-200">
                  好友 {settlement.managerId} · 本周 {settlement.total} 分
                </h3>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {settlement.lineup.starters.map((slot, index) => {
                    const skills = slot.skills.filter(
                      (skill): skill is SkillWager => skill !== null,
                    );
                    return (
                      <li key={slot.footballer.footballerName} className="flex flex-wrap gap-2">
                        <span>
                          {index === settlement.lineup.captainIndex ? "👑 " : ""}
                          {slot.footballer.footballerName}
                        </span>
                        {skills.map((skill, skillIndex) => (
                          <span key={skillIndex} className="text-xs text-slate-400">
                            {BAND_LABELS[skill.band]} · {describeSkill(skill)}
                          </span>
                        ))}
                        <span className="text-xs text-slate-500">
                          {settlement.slots[index]?.matchPoints ?? 0} 分
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {settlement.lineup.bench.length > 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    替补：{settlement.lineup.bench.map((card) => card.footballerName).join("、")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function rank(rows: readonly LeagueTableRow[]): readonly LeagueTableRow[] {
  return [...rows].sort(
    (left, right) =>
      right.gameweekPoints - left.gameweekPoints ||
      right.seasonPoints - left.seasonPoints ||
      left.managerId.localeCompare(right.managerId),
  );
}
