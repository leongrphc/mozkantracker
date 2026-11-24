"use client";

import { useSyncExternalStore } from "react";
import type { MediaKind, PosterCardData } from "@/components/poster-card";

export type Status = "plan" | "watching" | "done";
export type ShowKind = Exclude<MediaKind, "movie">;

export const STATUS_LABEL: Record<Status, string> = {
  plan: "İzleyeceğim",
  watching: "İzliyorum",
  done: "Bitirdim",
};

export type Card = PosterCardData & {
  totalEpisodes?: number;
  /** dakika: film süresi ya da ortalama bölüm süresi */
  runtime?: number;
};

export interface ListItem extends Card {
  status: Status;
  addedAt: number;
  updatedAt: number;
}

export interface TrackerState {
  list: Record<string, ListItem>;
  /** "tv:123" | "tvm:45" -> ["s1e1", "s1e2", ...] */
  watched: Record<string, string[]>;
}

const KEY = "mozkantracker:v1";
const EMPTY: TrackerState = { list: {}, watched: {} };

let cache: TrackerState | null = null;
const listeners = new Set<() => void>();

/** Eski sürümde izlenen bölümler sadece TMDB id ile tutuluyordu ("123"). */
function migrate(watched: Record<string, string[]>) {
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(watched)) {
    out[k.includes(":") ? k : `tv:${k}`] = v;
  }
  return out;
}

function normalize(parsed: Partial<TrackerState>): TrackerState {
  return { list: parsed.list ?? {}, watched: migrate(parsed.watched ?? {}) };
}

function read(): TrackerState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = normalize(raw ? (JSON.parse(raw) as Partial<TrackerState>) : {});
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

export const itemKey = (type: MediaKind, id: number) => `${type}:${id}`;
export const epKey = (season: number, episode: number) => `s${season}e${episode}`;

export function parseEpKey(k: string) {
  const m = /^s(\d+)e(\d+)$/.exec(k);
  return m ? { season: Number(m[1]), episode: Number(m[2]) } : null;
}

/* ---------- actions ---------- */

export function setStatus(card: Card, status: Status) {
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

export function removeItem(type: MediaKind, id: number) {
  const s = read();
  const list = { ...s.list };
  delete list[itemKey(type, id)];
  write({ ...s, list });
}

export function setEpisodes(card: Card, keys: string[], watched: boolean) {
  const s = read();
  const sk = itemKey(card.type, card.id);
  const current = new Set(s.watched[sk] ?? []);
  for (const k of keys) {
    if (watched) current.add(k);
    else current.delete(k);
  }
  const next: TrackerState = {
    ...s,
    watched: { ...s.watched, [sk]: [...current] },
  };
  const now = Date.now();
  const prev = next.list[sk];
  if (watched && !prev) {
    // bölüm işaretlenince diziyi otomatik "İzliyorum"a al
    next.list = {
      ...next.list,
      [sk]: { ...card, status: "watching", addedAt: now, updatedAt: now },
    };
  } else if (prev) {
    // son hareket tarihi "Devam et" sıralaması için güncellenir
    next.list = {
      ...next.list,
      [sk]: { ...prev, ...card, status: prev.status, updatedAt: now },
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
  write(normalize(parsed));
}
