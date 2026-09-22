import React from "react";
import { SKILL_WAGER_PAYOUTS, type SkillWager } from "../gameweek/catalogues.ts";
import { BAND_LABELS, describeSkill } from "../gameweek/skill-text.ts";

const BAND_FRAMES = {
  Easy: "border-emerald-400 bg-emerald-950/40",
  Hard: "border-amber-400 bg-amber-950/40",
  Ultra: "border-rose-400 bg-rose-950/40",
} as const;

export function SkillCardView({ skill }: { skill: SkillWager }) {
  const payout = SKILL_WAGER_PAYOUTS[skill.band];
  return (
    <article className={`rounded-lg border-2 ${BAND_FRAMES[skill.band]} p-3`}>
      <header className="flex items-center justify-between text-xs">
        <span className="rounded bg-black/30 px-2 py-0.5">
          {BAND_LABELS[skill.band]}
        </span>
        <span className="text-slate-200">
          +{payout.hit} / {payout.miss}
        </span>
      </header>
      <h3 className="mt-2 text-sm font-bold leading-tight">{describeSkill(skill)}</h3>
    </article>
  );
}
