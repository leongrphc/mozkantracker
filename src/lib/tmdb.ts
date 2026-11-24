import { cacheLife } from "next/cache";

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

export const LANG = "tr-TR";
export const REGION = "TR";

export type MediaType = "movie" | "tv";

export class TmdbConfigError extends Error {
  constructor() {
    super("TMDB_API_KEY veya TMDB_READ_TOKEN tanımlı değil.");
    this.name = "TmdbConfigError";
  }
}

export function hasTmdbCredentials() {
  return Boolean(process.env.TMDB_READ_TOKEN || process.env.TMDB_API_KEY);
}

async function tmdb<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const token = process.env.TMDB_READ_TOKEN;
  const key = process.env.TMDB_API_KEY;
  if (!token && !key) throw new TmdbConfigError();

  const url = new URL(API + path);
  url.searchParams.set("language", LANG);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  if (!token && key) url.searchParams.set("api_key", key);

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (res.status === 404) throw new NotFoundError(path);
  if (!res.ok) throw new Error(`TMDB ${res.status} ${path}`);
  return (await res.json()) as T;
}

export class NotFoundError extends Error {
  constructor(path: string) {
    super(`TMDB kaydı bulunamadı: ${path}`);
    this.name = "NotFoundError";
  }
}

export function img(
  path: string | null | undefined,
  size: "w92" | "w185" | "w300" | "w342" | "w500" | "w780" | "w1280" | "original" = "w342",
) {
  return path ? `${IMG}/${size}${path}` : null;
}

/* ---------- types ---------- */

export interface SearchItem {
  id: number;
  media_type: MediaType | "person";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
}

interface Paged<T> {
  page: number;
  total_pages: number;
  total_results: number;
  results: T[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface Video {
  key: string;
  site: string;
  type: string;
  official: boolean;
  name: string;
  iso_639_1: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface WatchProviders {
  link?: string;
  flatrate?: Provider[];
  free?: Provider[];
  ads?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}

interface DetailsBase {
  id: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: Genre[];
  vote_average: number;
  vote_count: number;
  tagline?: string;
  homepage?: string;
  videos?: { results: Video[] };
  credits?: { cast: CastMember[] };
  "watch/providers"?: { results: Record<string, WatchProviders> };
  recommendations?: Paged<SearchItem>;
  external_ids?: { imdb_id?: string | null };
}

export interface MovieDetails extends DetailsBase {
  title: string;
  original_title: string;
  release_date: string;
  runtime: number | null;
}

export interface SeasonSummary {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  overview: string;
}

export interface EpisodeRef {
  season_number: number;
  episode_number: number;
  name: string;
  air_date: string | null;
}

export interface TvDetails extends DetailsBase {
  name: string;
  original_name: string;
  first_air_date: string;
  last_air_date: string | null;
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  seasons: SeasonSummary[];
  networks: { id: number; name: string; logo_path: string | null }[];
  next_episode_to_air: EpisodeRef | null;
  last_episode_to_air: EpisodeRef | null;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  runtime: number | null;
  still_path: string | null;
  vote_average: number;
}

export interface SeasonDetails {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  air_date: string | null;
  poster_path: string | null;
  episodes: Episode[];
}

/* ---------- queries (cached) ---------- */

async function orNull<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof NotFoundError) return null;
    throw e;
  }
}

const APPEND = "videos,credits,watch/providers,recommendations,external_ids";
const VIDEO_LANGS = "tr,en,null";

export async function searchMulti(query: string, page = 1) {
  "use cache";
  cacheLife("hours");
  const data = await tmdb<Paged<SearchItem>>("/search/multi", {
    query,
    page,
    include_adult: "false",
  });
  return {
    ...data,
    results: data.results.filter(
      (r): r is SearchItem & { media_type: MediaType } =>
        r.media_type === "movie" || r.media_type === "tv",
    ),
  };
}

export async function getTrending(window: "day" | "week" = "week") {
  "use cache";
  cacheLife("hours");
  const data = await tmdb<Paged<SearchItem>>(`/trending/all/${window}`);
  return data.results.filter(
    (r) => r.media_type === "movie" || r.media_type === "tv",
  );
}

export async function getMovie(id: number) {
  "use cache";
  cacheLife("hours");
  return orNull(
    tmdb<MovieDetails>(`/movie/${id}`, {
      append_to_response: APPEND,
      include_video_language: VIDEO_LANGS,
    }),
  );
}

export async function getTv(id: number) {
  "use cache";
  cacheLife("hours");
  return orNull(
    tmdb<TvDetails>(`/tv/${id}`, {
      append_to_response: APPEND,
      include_video_language: VIDEO_LANGS,
    }),
  );
}

export async function getSeason(tvId: number, season: number) {
  "use cache";
  cacheLife("hours");
  return orNull(tmdb<SeasonDetails>(`/tv/${tvId}/season/${season}`));
}

/**
 * TVmaze gibi başka kaynaklardaki bir başlığı TMDB kimliğine çevirir.
 * Oynatıcı TMDB kimlikleriyle çalıştığı için TVmaze kayıtlarında gerekir.
 */
export async function resolveTmdbId(opts: {
  title: string;
  year?: string;
  type: MediaType;
}): Promise<number | null> {
  "use cache";
  cacheLife("days");
  if (!hasTmdbCredentials()) return null;

  const data = await tmdb<Paged<SearchItem>>(`/search/${opts.type}`, {
    query: opts.title,
  });

  const norm = (s: string) =>
    s
      .toLocaleLowerCase("tr")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const target = norm(opts.title);

  const best = data.results
    .map((r) => {
      const title = norm(titleOf(r));
      const year = (r.first_air_date ?? r.release_date ?? "").slice(0, 4);
      let score = 0;
      if (title === target) score += 4;
      else if (title.includes(target) || target.includes(title)) score += 2;
      if (opts.year && year === opts.year) score += 2;
      if (r.poster_path) score += 1;
      return { id: r.id, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  return best && best.score >= 2 ? best.id : null;
}

/* ---------- helpers ---------- */

export function titleOf(i: SearchItem) {
  return i.title ?? i.name ?? i.original_title ?? i.original_name ?? "";
}

export function yearOf(date?: string | null) {
  return date ? date.slice(0, 4) : "";
}

export function pickTrailer(videos?: { results: Video[] }) {
  const yt = (videos?.results ?? []).filter((v) => v.site === "YouTube");
  const score = (v: Video) =>
    (v.type === "Trailer" ? 4 : v.type === "Teaser" ? 2 : 0) +
    (v.official ? 1 : 0) +
    (v.iso_639_1 === "tr" ? 2 : 0);
  return yt.sort((a, b) => score(b) - score(a))[0] ?? null;
}

export function providersFor(
  d: DetailsBase,
  region = REGION,
): WatchProviders | null {
  return d["watch/providers"]?.results?.[region] ?? null;
}

export function formatDate(date?: string | null) {
  if (!date) return "Tarih yok";
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatRuntime(min?: number | null) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} sa ${m} dk` : `${m} dk`;
}

/* ---------- keşfet ---------- */

export type DiscoverSort = "popular" | "rating" | "new";

const SORT_BY: Record<DiscoverSort, { movie: string; tv: string }> = {
  popular: { movie: "popularity.desc", tv: "popularity.desc" },
  rating: { movie: "vote_average.desc", tv: "vote_average.desc" },
  new: { movie: "primary_release_date.desc", tv: "first_air_date.desc" },
};

export async function discover(opts: {
  type: MediaType;
  provider?: number;
  genre?: number;
  sort: DiscoverSort;
  page: number;
}) {
  "use cache";
  cacheLife("hours");
  const today = new Date().toISOString().slice(0, 10);
  const data = await tmdb<Paged<SearchItem>>(`/discover/${opts.type}`, {
    watch_region: REGION,
    with_watch_providers: opts.provider,
    with_watch_monetization_types: opts.provider ? "flatrate|free|ads" : undefined,
    with_genres: opts.genre,
    sort_by: SORT_BY[opts.sort][opts.type],
    "vote_count.gte": opts.sort === "rating" ? 300 : opts.sort === "new" ? 10 : undefined,
    [opts.type === "movie" ? "primary_release_date.lte" : "first_air_date.lte"]:
      opts.sort === "new" ? today : undefined,
    include_adult: "false",
    page: opts.page,
  });
  return {
    ...data,
    results: data.results.map((r) => ({ ...r, media_type: opts.type })),
  };
}

export async function getProviders(type: MediaType) {
  "use cache";
  cacheLife("days");
  const data = await tmdb<{
    results: (Provider & { display_priorities?: Record<string, number> })[];
  }>(`/watch/providers/${type}`, { watch_region: REGION });
  return data.results
    .map((p) => ({ ...p, prio: p.display_priorities?.[REGION] ?? 999 }))
    .sort((a, b) => a.prio - b.prio)
    .slice(0, 14);
}

export async function getGenres(type: MediaType) {
  "use cache";
  cacheLife("days");
  const data = await tmdb<{ genres: Genre[] }>(`/genre/${type}/list`);
  return data.genres;
}
