import { NextResponse, type NextRequest } from "next/server";
import { getTv, hasTmdbCredentials } from "@/lib/tmdb";
import { tvmShow } from "@/lib/tvmaze";

export interface ShowProgress {
  key: string;
  /** Yayınlanmış bölümler, sırayla: ["s1e1", "s1e2", ...] */
  aired: string[];
  next: { season: number; episode: number; name: string; date: string } | null;
  status: "running" | "ended";
}

const MAX_KEYS = 60;

async function tmdbProgress(id: number): Promise<Omit<ShowProgress, "key"> | null> {
  const t = await getTv(id);
  if (!t) return null;
  const next = t.next_episode_to_air;
  const aired: string[] = [];
  for (const s of [...t.seasons].sort((a, b) => a.season_number - b.season_number)) {
    if (s.season_number === 0) continue;
    for (let e = 1; e <= s.episode_count; e++) {
      if (
        next &&
        (s.season_number > next.season_number ||
          (s.season_number === next.season_number && e >= next.episode_number))
      )
        break;
      aired.push(`s${s.season_number}e${e}`);
    }
  }
  return {
    aired,
    next:
      next && next.air_date
        ? {
            season: next.season_number,
            episode: next.episode_number,
            name: next.name,
            date: next.air_date,
          }
        : null,
    status: t.status === "Ended" || t.status === "Canceled" ? "ended" : "running",
  };
}

async function tvmProgress(id: number): Promise<Omit<ShowProgress, "key"> | null> {
  const s = await tvmShow(id);
  if (!s) return null;
  const today = new Date().toISOString().slice(0, 10);
  const eps = s._embedded.episodes.filter((e) => e.number != null && e.season > 0);
  const aired = eps.filter((e) => e.airdate && e.airdate <= today);
  const upcoming = eps.find((e) => e.airdate && e.airdate > today);
  return {
    aired: aired.map((e) => `s${e.season}e${e.number}`),
    next: upcoming
      ? {
          season: upcoming.season,
          episode: upcoming.number!,
          name: upcoming.name,
          date: upcoming.airdate!,
        }
      : null,
    status: s.status === "Ended" ? "ended" : "running",
  };
}

export async function GET(req: NextRequest) {
  const keys = (req.nextUrl.searchParams.get("keys") ?? "")
    .split(",")
    .filter((k) => /^(tv|tvm):\d+$/.test(k))
    .slice(0, MAX_KEYS);

  const tmdbOk = hasTmdbCredentials();
  const results = await Promise.all(
    keys.map(async (key): Promise<ShowProgress | null> => {
      const [type, raw] = key.split(":");
      const id = Number(raw);
      try {
        const p =
          type === "tvm"
            ? await tvmProgress(id)
            : tmdbOk
              ? await tmdbProgress(id)
              : null;
        return p ? { key, ...p } : null;
      } catch {
        return null;
      }
    }),
  );

  return NextResponse.json(results.filter(Boolean), {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
