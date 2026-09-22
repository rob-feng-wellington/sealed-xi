import React, { useEffect, useMemo, useState } from "react";
import {
  BAND_LABELS,
  describeSkill,
  isTaskCapComplete,
  taskCapReward,
  TASK_CAP_REWARD,
  type LineupDraft,
  type SkillWager,
  type TaskCapService,
  type TaskCapState,
} from "../gameweek/index.ts";
import type { League } from "../league/types.ts";

interface TaskCapPanelProps {
  managerId: string;
  league: League;
  gameweekId: string;
  taskCapService: TaskCapService;
  now?: Date;
}

export function TaskCapPanel({
  managerId,
  league,
  gameweekId,
  taskCapService,
  now,
}: TaskCapPanelProps) {
  const clock = useMemo(() => now ?? new Date(), [now]);
  const [state, setState] = useState<TaskCapState | null>(null);
  const [peekedDraft, setPeekedDraft] = useState<LineupDraft | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    taskCapService.markLoggedIn(managerId, gameweekId, clock).then((result) => {
      if (cancelled) return;
      if (result.kind === "ok") {
        setState(result.state);
      } else {
        taskCapService.getState(managerId, gameweekId).then((current) => {
          if (!cancelled) setState(current);
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [managerId, gameweekId, taskCapService, clock]);

  const friends = league.memberIds.filter((id) => id !== managerId);
  const peeked = state?.tasks.peekedManagerId ?? null;
  const complete = state !== null && isTaskCapComplete(state.tasks);
  const reward = state ? taskCapReward(state.tasks) : { player: 0, skill: 0 };

  async function handlePeek(friendId: string) {
    const result = await taskCapService.peek(managerId, gameweekId, friendId, clock);
    if (result.kind === "ok") {
      setState(result.state);
      setPeekedDraft(result.draft);
      setMessage(result.draft === null ? "好友还没有提交暂定阵容。" : null);
    } else if (result.kind === "already-peeked") {
      setMessage(`本周已经查看过好友 ${result.friendId}。`);
    } else if (result.kind === "past-deadline") {
      setMessage("已过截止时间，不能查看。");
    } else if (result.kind === "self") {
      setMessage("不能查看自己的阵容。");
    } else {
      setMessage("只能查看同一联赛的好友。");
    }
  }

  return (
    <section className="space-y-4">
      <header className="text-center">
        <h2 className="text-lg font-bold">本周任务</h2>
      </header>

      <ul className="space-y-1 text-sm">
        <TaskRow done={state?.tasks.loggedIn ?? false} label="登录" />
        <TaskRow done={state?.tasks.tentativeLineup ?? false} label="提交暂定阵容" />
        <TaskRow done={peeked !== null} label="查看一名好友的阵容" />
      </ul>

      <p className="rounded bg-slate-800 p-3 text-center text-xs text-slate-300">
        {complete
          ? `本周奖励已到账：+${TASK_CAP_REWARD.player} 球员 / +${TASK_CAP_REWARD.skill} 技能`
          : `完成三项任务获得 +${TASK_CAP_REWARD.player} 球员 / +${TASK_CAP_REWARD.skill} 技能（本周有效）`}
      </p>

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-300">联赛好友</h3>
        {friends.length === 0 ? (
          <p className="text-xs text-slate-500">联赛里还没有其他成员。</p>
        ) : (
          <ul className="space-y-1">
            {friends.map((friendId) => (
              <li
                key={friendId}
                className="flex items-center justify-between rounded bg-slate-800 px-2 py-1 text-sm"
              >
                <span>好友 {friendId}</span>
                <button
                  type="button"
                  aria-label={`查看 ${friendId}`}
                  onClick={() => handlePeek(friendId)}
                  disabled={peeked !== null && peeked !== friendId}
                  className="rounded bg-slate-700 px-2 py-0.5 text-xs text-white hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500"
                >
                  查看
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {message && <p className="text-center text-sm text-slate-300">{message}</p>}

      {peeked !== null && peekedDraft !== null && (
        <div className="space-y-2 rounded bg-slate-900 p-3">
          <h3 className="text-sm font-medium text-slate-300">好友 {peeked} 的暂定阵容</h3>
          <DraftSummary draft={peekedDraft} />
        </div>
      )}

      {!complete && reward.player === 0 && state === null && (
        <p className="text-center text-slate-400">加载中…</p>
      )}
    </section>
  );
}

function TaskRow({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={done ? "text-green-400" : "text-slate-600"}>
        {done ? "✓" : "○"}
      </span>
      <span className={done ? "text-slate-200" : "text-slate-400"}>{label}</span>
    </li>
  );
}

function DraftSummary({ draft }: { draft: LineupDraft }) {
  return (
    <div className="space-y-2 text-sm">
      <div>
        <h4 className="text-xs font-medium text-slate-400">首发</h4>
        <ul className="space-y-0.5">
          {draft.starters.map((name) => {
            const skills = (draft.skills[name] ?? []).filter(
              (skill): skill is SkillWager => skill !== null,
            );
            return (
              <li key={name} className="flex flex-wrap gap-2">
                <span>
                  {draft.captain === name ? "👑 " : ""}
                  {name}
                </span>
                {skills.map((skill, index) => (
                  <span key={index} className="text-xs text-slate-400">
                    {BAND_LABELS[skill.band]} · {describeSkill(skill)}
                  </span>
                ))}
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-medium text-slate-400">替补</h4>
        <ul className="space-y-0.5">
          {draft.bench.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
