import { cacheLife } from "next/cache";

/**
 * TVmaze: anahtar gerektirmeyen yedek kaynak. Sadece dizi verisi var
 * (film yok, platform/nerede izlenir bilgisi yok).
 * https://www.tvmaze.com/api
 */
const API = "https://api.tvmaze.com";

export interface TvmImage {
  medium: string;
  original: string;
}

export interface TvmShow {
  id: number;
  name: string;
  language: string | null;
  genres: string[];
  status: string;
  runtime: number | null;
  averageRuntime: number | null;
  premiered: string | null;
  ended: string | null;
  officialSite: string | null;
  rating: { average: number | null };
  /** 0-100 popülerlik */
  weight: number;
  network: { name: string; country: { code: string } | null } | null;
  webChannel: { name: string; officialSite: string | null } | null;
  externals: { imdb: string | null };
  image: TvmImage | null;
  summary: string | null;
}

export interface TvmSeason {
  id: number;
  number: number;
  name: string;
  episodeOrder: number | null;
  premiereDate: string | null;
  endDate: string | null;
  image: TvmImage | null;
  summary: string | null;
}

export interface TvmEpisode {
  id: number;
  name: string;
  season: number;
  number: number | null;
  type: string;
  airdate: string | null;
  airstamp: string | null;
  runtime: number | null;
  rating: { average: number | null };
  image: TvmImage | null;
  summary: string | null;
}

export interface TvmCast {
  person: { id: number; name: string; image: TvmImage | null };
  character: { id: number; name: string };
}

export interface TvmShowFull extends TvmShow {
  _embedded: {
    seasons: TvmSeason[];
    cast: TvmCast[];
    episodes: TvmEpisode[];
  };
}

async function tvm<T>(path: string): Promise<T | null> {
  const res = await fetch(API + path, {
    headers: { "User-Agent": "mozkantracker" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`TVmaze ${res.status} ${path}`);
  return (await res.json()) as T;
}

export async function tvmSearch(query: string) {
  "use cache";
  cacheLife("hours");
  const data = await tvm<{ score: number; show: TvmShow }[]>(
    `/search/shows?q=${encodeURIComponent(query)}`,
  );
  return (data ?? []).map((r) => r.show);
}

export async function tvmShow(id: number) {
  "use cache";
  cacheLife("hours");
  return tvm<TvmShowFull>(
    `/shows/${id}?embed[]=seasons&embed[]=cast&embed[]=episodes`,
  );
}

/** Bugün yayına giren yeni bölümlerin dizileri (popülerliğe göre). */
export async function tvmToday(date: string) {
  "use cache";
  cacheLife("hours");
  const [web, tv] = await Promise.all([
    tvm<(TvmEpisode & { _embedded?: { show: TvmShow } })[]>(
      `/schedule/web?date=${date}`,
    ),
    tvm<(TvmEpisode & { show?: TvmShow })[]>(`/schedule?date=${date}&country=US`),
  ]);
  const shows = new Map<number, TvmShow>();
  for (const e of web ?? []) {
    const s = e._embedded?.show;
    if (s) shows.set(s.id, s);
  }
  for (const e of tv ?? []) {
    if (e.show) shows.set(e.show.id, e.show);
  }
  return [...shows.values()]
    .filter((s) => s.image)
    .sort((a, b) => b.weight - a.weight);
}

/* ---------- helpers ---------- */

export function stripHtml(html?: string | null) {
  return (html ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function tvmImg(i: TvmImage | null | undefined, big = false) {
  if (!i) return null;
  return big ? i.original : i.medium;
}

export const TVM_STATUS_TR: Record<string, string> = {
  Running: "Devam ediyor",
  Ended: "Final yaptı",
  "To Be Determined": "Belirsiz",
  "In Development": "Yapımda",
};

const GENRE_TR: Record<string, string> = {
  Drama: "Dram",
  Comedy: "Komedi",
  Action: "Aksiyon",
  Crime: "Suç",
  Thriller: "Gerilim",
  Horror: "Korku",
  Romance: "Romantik",
  "Science-Fiction": "Bilim Kurgu",
  Fantasy: "Fantastik",
  Mystery: "Gizem",
  Supernatural: "Doğaüstü",
  Family: "Aile",
  Adventure: "Macera",
  History: "Tarih",
  War: "Savaş",
  Anime: "Anime",
  Music: "Müzik",
  Sports: "Spor",
  Medical: "Tıp",
  Legal: "Hukuk",
  Western: "Western",
  Espionage: "Casusluk",
  Children: "Çocuk",
};

export function genreTr(g: string) {
  return GENRE_TR[g] ?? g;
}

export function tvmCard(s: TvmShow) {
  return {
    id: s.id,
    type: "tvm" as const,
    title: s.name,
    year: s.premiered?.slice(0, 4) ?? "",
    poster: tvmImg(s.image),
    rating: s.rating.average ?? undefined,
  };
}
