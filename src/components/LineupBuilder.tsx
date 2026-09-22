import React, { useEffect, useMemo, useState } from "react";
import {
  BAND_LABELS,
  createLineupService,
  describeSkill,
  emptyDraft,
  isPastDeadline,
  lineupRole,
  LocalStorageLineupStore,
  LocalStoragePoolStore,
  moveBench,
  setCaptain,
  setSkill,
  skillKey,
  validateLineup,
  type LineupDraft,
  type LineupIssue,
  type LineupService,
  type LineupStatus,
  type SealedPool,
  type SkillWager,
} from "../gameweek/index.ts";
import { addBench, addStarter, removeFromLineup } from "../gameweek/lineup.ts";
import { POSITION_LABELS, RARITY_LABELS } from "./card-labels.ts";
import { PlayerCardView } from "./PlayerCardView.tsx";

const defaultLineupService = createLineupService(
  new LocalStorageLineupStore(),
  new LocalStoragePoolStore(),
);

const ISSUE_MESSAGES: Record<LineupIssue, string> = {
  "wrong-starter-count": "首发必须是 11 人。",
  "wrong-bench-count": "替补必须是 4 人。",
  "duplicate-footballer": "同一名球员不能重复出现。",
  "unknown-footballer": "阵容里有本周卡包之外的球员。",
  "missing-captain": "需要指定一名队长。",
  "captain-not-starter": "队长必须是首发。",
  formation: "阵型需要 1 门将、至少 3 后卫、2 中场、1 前锋。",
  "rarity-cap": "首发最多 3 张史诗、4 张超稀有。",
  "club-cap": "同一 Club 最多 3 人。",
  "too-many-skills": "队长 2 个技能槽，其他首发 1 个，替补没有。",
  "skill-on-bench": "替补没有技能槽。",
  "skill-not-in-pool": "技能不在本周卡包里。",
};

export function issueMessage(issue: LineupIssue): string {
  return ISSUE_MESSAGES[issue];
}

interface LineupBuilderProps {
  managerId: string;
  gameweekId: string;
  pool: SealedPool;
  lineupService?: LineupService;
  now?: Date;
  onTentativeSaved?: () => void;
}

export function LineupBuilder({
  managerId,
  gameweekId,
  pool,
  lineupService = defaultLineupService,
  now,
  onTentativeSaved,
}: LineupBuilderProps) {
  const clock = useMemo(() => now ?? new Date(), [now]);
  const [draft, setDraft] = useState<LineupDraft>(() => emptyDraft());
  const [status, setStatus] = useState<LineupStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    lineupService.getState(managerId, gameweekId).then((state) => {
      if (cancelled) return;
      if (state) {
        setDraft(state.draft);
        setStatus(state.status);
      } else {
        setDraft(emptyDraft());
        setStatus(null);
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [managerId, gameweekId, lineupService]);

  const deadline = lineupService.deadline(gameweekId);
  const locked = status === "locked" || isPastDeadline(clock, deadline);
  const issues = validateLineup(draft, pool);

  const byName = useMemo(
    () => new Map(pool.basePack.map((card) => [card.footballerName, card])),
    [pool.basePack],
  );
  const skillByKey = useMemo(() => {
    const map = new Map<string, SkillWager>();
    for (const skill of pool.skillPack) {
      map.set(skillKey(skill), skill);
    }
    return map;
  }, [pool.skillPack]);
  const skillOptions = [...skillByKey.entries()];

  function update(next: LineupDraft) {
    setDraft(next);
    setMessage(null);
  }

  async function handleSave() {
    const result = await lineupService.saveTentative(
      managerId,
      gameweekId,
      draft,
      clock,
    );
    if (result.kind === "ok") {
      setStatus(result.state.status);
      setMessage("草稿已保存。");
      onTentativeSaved?.();
    } else if (result.kind === "past-deadline") {
      setMessage("已过截止时间，阵容不能修改。");
    } else if (result.kind === "locked") {
      setMessage("阵容已锁定，不能修改。");
    }
  }

  async function handleLock() {
    const result = await lineupService.lock(managerId, gameweekId, draft, clock);
    if (result.kind === "ok") {
      setStatus(result.state.status);
      setMessage("阵容已锁定。");
      onTentativeSaved?.();
    } else if (result.kind === "invalid") {
      setMessage(result.issues.map(issueMessage).join(" "));
    } else if (result.kind === "past-deadline") {
      setMessage("已过截止时间，阵容不能修改。");
    } else if (result.kind === "locked") {
      setMessage("阵容已锁定，不能修改。");
    } else {
      setMessage("还没有开启本周卡包。");
    }
  }

  return (
    <section className="space-y-6">
      <header className="text-center">
        <h2 className="text-lg font-bold">我的阵容</h2>
        <p className="text-xs text-slate-500">
          {locked ? "已锁定，无法修改" : "截止："} {formatDeadline(deadline)} UTC
        </p>
      </header>

      {!loaded && <p className="text-center text-slate-400">加载中…</p>}

      {loaded && (
        <>
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-300">
              卡包 · 首发 {draft.starters.length}/11 · 替补 {draft.bench.length}/4
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {pool.basePack.map((card) => {
                const role = lineupRole(draft, card.footballerName);
                return (
                  <div key={card.footballerName} className="space-y-1">
                    <PlayerCardView card={card} />
                    <select
                      aria-label={`安排 ${card.footballerName}`}
                      value={role}
                      disabled={locked}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (next === "starter") {
                          update(addStarter(draft, card.footballerName));
                        } else if (next === "bench") {
                          update(addBench(draft, card.footballerName));
                        } else {
                          update(removeFromLineup(draft, card.footballerName));
                        }
                      }}
                      className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
                    >
                      <option value="pool">未选</option>
                      <option value="starter">首发</option>
                      <option value="bench">替补</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-300">首发</h3>
            <ol className="space-y-1">
              {draft.starters.map((name) => {
                const card = byName.get(name);
                const isCaptain = draft.captain === name;
                const worn = draft.skills[name] ?? [];
                return (
                  <li
                    key={name}
                    className="flex flex-wrap items-center gap-2 rounded bg-slate-800 px-2 py-1 text-sm"
                  >
                    <span className="font-medium">
                      {card
                        ? `${POSITION_LABELS[card.position]} ${name} · ${card.club} · ${RARITY_LABELS[card.rarity]}`
                        : name}
                    </span>
                    <button
                      type="button"
                      aria-label={`设为队长 ${name}`}
                      onClick={() => update(setCaptain(draft, name))}
                      disabled={locked || isCaptain}
                      className="rounded bg-slate-700 px-2 py-0.5 text-xs text-white hover:bg-slate-600 disabled:bg-slate-600"
                    >
                      {isCaptain ? "队长" : "设为队长"}
                    </button>
                    {Array.from({ length: isCaptain ? 2 : 1 }, (_, slot) => (
                      <select
                        key={slot}
                        aria-label={`技能 ${name} ${slot + 1}`}
                        value={worn[slot] ? skillKey(worn[slot]!) : ""}
                        disabled={locked}
                        onChange={(event) => {
                          const key = event.target.value;
                          update(
                            setSkill(
                              draft,
                              name,
                              slot,
                              key === "" ? null : skillByKey.get(key) ?? null,
                            ),
                          );
                        }}
                        className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-xs text-slate-100"
                      >
                        <option value="">裸装</option>
                        {skillOptions.map(([key, skill]) => (
                          <option key={key} value={key}>
                            {BAND_LABELS[skill.band]} · {describeSkill(skill)}
                          </option>
                        ))}
                      </select>
                    ))}
                  </li>
                );
              })}
            </ol>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-300">替补（顺序决定换人）</h3>
            <ol className="space-y-1">
              {draft.bench.map((name) => (
                <li
                  key={name}
                  className="flex items-center gap-2 rounded bg-slate-800 px-2 py-1 text-sm"
                >
                  <span className="font-medium">{name}</span>
                  <button
                    type="button"
                    aria-label={`上移 ${name}`}
                    onClick={() => update(moveBench(draft, name, -1))}
                    disabled={locked}
                    className="rounded bg-slate-700 px-2 py-0.5 text-xs text-white hover:bg-slate-600"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`下移 ${name}`}
                    onClick={() => update(moveBench(draft, name, 1))}
                    disabled={locked}
                    className="rounded bg-slate-700 px-2 py-0.5 text-xs text-white hover:bg-slate-600"
                  >
                    ↓
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {!locked && issues.length > 0 && (
            <ul className="space-y-1 rounded bg-amber-950/40 p-3 text-xs text-amber-200">
              {issues.map((issue) => (
                <li key={issue}>{issueMessage(issue)}</li>
              ))}
            </ul>
          )}

          {message && <p className="text-center text-sm text-slate-300">{message}</p>}

          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={locked}
              className="rounded bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500"
            >
              保存草稿
            </button>
            <button
              type="button"
              onClick={handleLock}
              disabled={locked}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500"
            >
              锁定阵容
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function formatDeadline(deadline: Date): string {
  return deadline.toISOString().slice(0, 16).replace("T", " ");
}
