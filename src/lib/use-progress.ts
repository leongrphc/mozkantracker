"use client";

import { useEffect, useMemo, useState } from "react";
import type { ShowProgress } from "@/app/api/progress/route";
import { parseEpKey, useTracker, type ListItem, type Status } from "@/lib/tracker";

export interface ShowRow {
  item: ListItem;
  progress: ShowProgress;
  /** izlenmemiş ilk yayınlanmış bölüm */
  nextUp: { season: number; episode: number } | null;
  remaining: number;
}

export function showHref(item: Pick<ListItem, "type" | "id">) {
  return `/${item.type}/${item.id}`;
}

export function episodeHref(
  item: Pick<ListItem, "type" | "id">,
  season: number,
  episode: number,
) {
  return `/${item.type}/${item.id}/season/${season}#e${episode}`;
}

/** Takip edilen dizilerin yayın durumunu sunucudan çekip izlenenlerle birleştirir. */
export function useShowProgress(statuses: Status[]) {
  const { list, watched } = useTracker();
  const statusKey = statuses.join(",");
  const items = useMemo(
    () =>
      Object.values(list)
        .filter((i) => i.type !== "movie" && statusKey.split(",").includes(i.status))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [list, statusKey],
  );
  const keysParam = items
    .map((i) => `${i.type}:${i.id}`)
    .sort()
    .join(",");

  const [data, setData] = useState<{ keys: string; rows: ShowProgress[] } | null>(
    null,
  );

  useEffect(() => {
    if (!keysParam) return;
    let cancelled = false;
    fetch(`/api/progress?keys=${encodeURIComponent(keysParam)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: ShowProgress[]) => {
        if (!cancelled) setData({ keys: keysParam, rows });
      })
      .catch(() => {
        if (!cancelled) setData({ keys: keysParam, rows: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [keysParam]);

  const loading = Boolean(keysParam) && data?.keys !== keysParam;
  const rows: ShowRow[] = useMemo(() => {
    if (!data) return [];
    const byKey = new Map(data.rows.map((r) => [r.key, r]));
    return items.flatMap((item) => {
      const k = `${item.type}:${item.id}`;
      const progress = byKey.get(k);
      if (!progress) return [];
      const seen = new Set(watched[k] ?? []);
      const unwatched = progress.aired.filter((e) => !seen.has(e));
      const first = unwatched[0] ? parseEpKey(unwatched[0]) : null;
      return [{ item, progress, nextUp: first, remaining: unwatched.length }];
    });
  }, [data, items, watched]);

  return { rows, loading, empty: items.length === 0 };
}
