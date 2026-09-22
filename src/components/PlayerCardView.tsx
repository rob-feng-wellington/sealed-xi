import React from "react";
import type { PlayerCard } from "../gameweek/generate-packs.ts";

const RARITY_FRAMES = {
  epic: { label: "史诗", frame: "border-fuchsia-400 bg-fuchsia-950/40" },
  superRare: { label: "超稀有", frame: "border-sky-400 bg-sky-950/40" },
  rare: { label: "稀有", frame: "border-slate-500 bg-slate-800" },
} as const;

const POSITION_LABELS = {
  GK: "门将",
  DEF: "后卫",
  MID: "中场",
  FWD: "前锋",
} as const;

export function PlayerCardView({ card }: { card: PlayerCard }) {
  const rarity = RARITY_FRAMES[card.rarity];
  return (
    <article className={`rounded-lg border-2 ${rarity.frame} p-3`}>
      <header className="flex items-center justify-between text-xs">
        <span className="rounded bg-black/30 px-2 py-0.5">
          {POSITION_LABELS[card.position]}
        </span>
        <span className="rounded bg-black/30 px-2 py-0.5">{rarity.label}</span>
      </header>
      <h3 className="mt-2 text-sm font-bold leading-tight">{card.footballerName}</h3>
      <p className="mt-1 text-xs text-slate-300">{card.club}</p>
    </article>
  );
}
