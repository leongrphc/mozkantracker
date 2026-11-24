"use client";

export interface PlaybackEntry {
  time: number;
  duration: number;
  updatedAt: number;
}

const KEY = "mozkantracker:playback:v1";
const COMPLETE_RATIO = 0.95;
const END_WINDOW = 90;

function readAll(): Record<string, PlaybackEntry> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<
      string,
      PlaybackEntry
    >;
  } catch {
    return {};
  }
}

export function readPlayback(key: string): PlaybackEntry | null {
  return readAll()[key] ?? null;
}

export function isComplete(entry: PlaybackEntry | null) {
  if (!entry || entry.duration <= 0) return false;
  return (
    entry.time >= entry.duration * COMPLETE_RATIO ||
    entry.duration - entry.time <= END_WINDOW
  );
}

/** Yarım kalan bölümlerde ~5 saniye geriden devam etmek için konum döndürür. */
export function resumeTime(entry: PlaybackEntry | null) {
  if (!entry || isComplete(entry)) return 0;
  return Math.max(0, entry.time - 5);
}

export function savePlayback(
  key: string,
  time: number,
  duration: number,
  completed = false,
) {
  if (!Number.isFinite(time) || time <= 0) return;
  const all = readAll();
  const done =
    completed ||
    (duration > 0 &&
      (time >= duration * COMPLETE_RATIO || duration - time <= END_WINDOW));
  all[key] = {
    time: done ? duration || time : time,
    duration: duration > 0 ? duration : 0,
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* depolama dolu ya da kapalı */
  }
}
