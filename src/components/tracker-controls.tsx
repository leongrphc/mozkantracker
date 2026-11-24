"use client";

import type { PosterCardData } from "@/components/poster-card";
import {
  STATUS_LABEL,
  epKey,
  itemKey,
  removeItem,
  setEpisodes,
  setStatus,
  useTracker,
  type Status,
} from "@/lib/tracker";

type Card = PosterCardData & { totalEpisodes?: number };

export function StatusPicker({ card }: { card: Card }) {
  const { list } = useTracker();
  const current = list[itemKey(card.type, card.id)]?.status;
  const statuses: Status[] = ["plan", "watching", "done"];

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Liste durumu">
      {statuses.map((s) => {
        const active = current === s;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={active}
            onClick={() =>
              active ? removeItem(card.type, card.id) : setStatus(card, s)
            }
            className={
              active
                ? "rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
                : "rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-accent"
            }
          >
            {active ? "✓ " : "+ "}
            {STATUS_LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}

export function TvProgress({
  tvId,
  total,
  className = "",
}: {
  tvId: number;
  total: number;
  className?: string;
}) {
  const { watched } = useTracker();
  const count = watched[String(tvId)]?.length ?? 0;
  if (!total) return null;
  const pct = Math.min(100, Math.round((count / total) * 100));
  return (
    <div className={className}>
      <div className="flex justify-between text-xs text-muted">
        <span>
          {count} / {total} bölüm
        </span>
        <span className="tabular-nums">%{pct}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SeasonCount({
  tvId,
  season,
  total,
}: {
  tvId: number;
  season: number;
  total: number;
}) {
  const { watched } = useTracker();
  const prefix = `s${season}e`;
  const count = (watched[String(tvId)] ?? []).filter((k) =>
    k.startsWith(prefix),
  ).length;
  if (!count) return null;
  return (
    <span className={count >= total ? "text-good" : "text-accent"}>
      {count >= total ? "✓ Tamamlandı" : `${count}/${total} izlendi`}
    </span>
  );
}

export function EpisodeToggle({
  tvId,
  season,
  episode,
  card,
}: {
  tvId: number;
  season: number;
  episode: number;
  card: Card;
}) {
  const { watched } = useTracker();
  const k = epKey(season, episode);
  const on = (watched[String(tvId)] ?? []).includes(k);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "İzlenmedi olarak işaretle" : "İzlendi olarak işaretle"}
      onClick={() => setEpisodes(tvId, [k], !on, card)}
      className={
        on
          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-good text-bg"
          : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted hover:border-good hover:text-good"
      }
    >
      ✓
    </button>
  );
}

export function SeasonMarkAll({
  tvId,
  season,
  episodes,
  card,
}: {
  tvId: number;
  season: number;
  episodes: number[];
  card: Card;
}) {
  const { watched } = useTracker();
  const set = new Set(watched[String(tvId)] ?? []);
  const keys = episodes.map((e) => epKey(season, e));
  const all = keys.length > 0 && keys.every((k) => set.has(k));
  return (
    <button
      type="button"
      onClick={() => setEpisodes(tvId, keys, !all, card)}
      className="rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-good"
    >
      {all ? "Sezonu izlenmedi yap" : "Tüm sezonu izledim"}
    </button>
  );
}
