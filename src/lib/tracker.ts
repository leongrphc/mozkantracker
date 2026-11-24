"use client";

import { useSyncExternalStore } from "react";
import type { PosterCardData } from "@/components/poster-card";

export type Status = "plan" | "watching" | "done";

export const STATUS_LABEL: Record<Status, string> = {
  plan: "İzleyeceğim",
  watching: "İzliyorum",
  done: "Bitirdim",
};

export interface ListItem extends PosterCardData {
  status: Status;
  addedAt: number;
  updatedAt: number;
  totalEpisodes?: number;
}

export interface TrackerState {
  list: Record<string, ListItem>;
  /** tv id -> ["s1e1", "s1e2", ...] */
  watched: Record<string, string[]>;
}

const KEY = "mozkantracker:v1";
const EMPTY: TrackerState = { list: {}, watched: {} };

let cache: TrackerState | null = null;
const listeners = new Set<() => void>();

function read(): TrackerState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<TrackerState>) : {};
    cache = { list: parsed.list ?? {}, watched: parsed.watched ?? {} };
  } catch {
    cache = { list: {}, watched: {} };
  }
  return cache;
}

function write(next: TrackerState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* depolama dolu ya da kapalı: bellekte devam */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useTracker(): TrackerState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const itemKey = (type: "movie" | "tv", id: number) => `${type}:${id}`;
export const epKey = (season: number, episode: number) => `s${season}e${episode}`;

/* ---------- actions ---------- */

export function setStatus(
  card: PosterCardData & { totalEpisodes?: number },
  status: Status,
) {
  const s = read();
  const k = itemKey(card.type, card.id);
  const prev = s.list[k];
  const now = Date.now();
  write({
    ...s,
    list: {
      ...s.list,
      [k]: {
        ...prev,
        ...card,
        status,
        addedAt: prev?.addedAt ?? now,
        updatedAt: now,
      },
    },
  });
}

export function removeItem(type: "movie" | "tv", id: number) {
  const s = read();
  const list = { ...s.list };
  delete list[itemKey(type, id)];
  write({ ...s, list });
}

export function setEpisodes(
  tvId: number,
  keys: string[],
  watched: boolean,
  card?: PosterCardData & { totalEpisodes?: number },
) {
  const s = read();
  const current = new Set(s.watched[String(tvId)] ?? []);
  for (const k of keys) {
    if (watched) current.add(k);
    else current.delete(k);
  }
  const next: TrackerState = {
    ...s,
    watched: { ...s.watched, [String(tvId)]: [...current] },
  };
  // bölüm işaretlenince diziyi otomatik "İzliyorum"a al
  const lk = itemKey("tv", tvId);
  if (watched && card && !next.list[lk]) {
    const now = Date.now();
    next.list = {
      ...next.list,
      [lk]: { ...card, status: "watching", addedAt: now, updatedAt: now },
    };
  }
  write(next);
}

export function exportData() {
  return JSON.stringify(read(), null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json) as Partial<TrackerState>;
  if (typeof parsed !== "object" || !parsed) throw new Error("Geçersiz dosya");
  write({ list: parsed.list ?? {}, watched: parsed.watched ?? {} });
}
