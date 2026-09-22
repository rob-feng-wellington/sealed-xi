import React from "react";
import type { PlayerCard } from "../gameweek/generate-packs.ts";
import { POSITION_LABELS, RARITY_LABELS } from "./card-labels.ts";

const RARITY_FRAMES = {
  epic: "border-fuchsia-400 bg-fuchsia-950/40",
  superRare: "border-sky-400 bg-sky-950/40",
  rare: "border-slate-500 bg-slate-800",
} as const;

export function PlayerCardView({ card }: { card: PlayerCard }) {
  return (
    <article className={`rounded-lg border-2 ${RARITY_FRAMES[card.rarity]} p-3`}>
      <header className="flex items-center justify-between text-xs">
        <span className="rounded bg-black/30 px-2 py-0.5">
          {POSITION_LABELS[card.position]}
        </span>
        <span className="rounded bg-black/30 px-2 py-0.5">
          {RARITY_LABELS[card.rarity]}
        </span>
      </header>
      <h3 className="mt-2 text-sm font-bold leading-tight">{card.footballerName}</h3>
      <p className="mt-1 text-xs text-slate-300">{card.club}</p>
    </article>
  );
}
