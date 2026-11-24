import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Player } from "@/components/player";
import { SetupNotice } from "@/components/setup-notice";
import { playerSources } from "@/lib/player";
import {
  formatDate,
  formatRuntime,
  getMovie,
  getSeason,
  getTv,
  hasTmdbCredentials,
  img,
  resolveTmdbId,
  yearOf,
} from "@/lib/tmdb";
import { stripHtml, tvmCard, tvmImg, tvmShow } from "@/lib/tvmaze";
import type { Card } from "@/lib/tracker";

type Params = Promise<{ type: string; id: string }>;
type SP = Promise<Record<string, string | string[] | undefined>>;

function one(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

function parseId(raw: string) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parsePosition(sp: Awaited<SP>) {
  const s = Number(one(sp.s));
  const e = Number(one(sp.e));
  return {
    season: Number.isInteger(s) && s > 0 ? s : 1,
    episode: Number.isInteger(e) && e > 0 ? e : 1,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const p = await params;
  const id = parseId(p.id);
  if (!id) return { title: "Oynatıcı" };

  if (p.type === "movie") {
    if (!hasTmdbCredentials()) return { title: "Film izle" };
    const m = await getMovie(id);
    return { title: m ? `${m.title} izle` : "Bulunamadı" };
  }
  if (p.type === "tv") {
    if (!hasTmdbCredentials()) return { title: "Dizi izle" };
    const t = await getTv(id);
    return { title: t ? `${t.name} izle` : "Bulunamadı" };
  }
  if (p.type === "tvm") {
    const s = await tvmShow(id);
    return { title: s ? `${s.name} izle` : "Bulunamadı" };
  }
  return { title: "Oynatıcı" };
}

export default function WatchPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <Watch params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Watch({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  const p = await params;
  const id = parseId(p.id);
  if (!id) notFound();
  const { season, episode } = parsePosition(await searchParams);

  if (p.type === "movie") {
    if (!hasTmdbCredentials()) return <Notice><SetupNotice /></Notice>;
    const m = await getMovie(id);
    if (!m) notFound();
    return (
      <Player
        sources={playerSources({ tmdbId: m.id, type: "movie" })}
        playbackId={`movie:${m.id}`}
        title={m.title}
        subtitle={[yearOf(m.release_date), "Film", formatRuntime(m.runtime)]
          .filter(Boolean)
          .join(" · ")}
        overview={m.overview || undefined}
        backHref={`/movie/${m.id}`}
        poster={img(m.poster_path, "w342")}
        nextHref={null}
        nextLabel={null}
        watch={null}
        episodeBase={null}
      />
    );
  }

  if (p.type === "tv") {
    if (!hasTmdbCredentials()) return <Notice><SetupNotice /></Notice>;
    const [t, s] = await Promise.all([getTv(id), getSeason(id, season)]);
    if (!t || !s) notFound();

    const eps = s.episodes
      .filter((e) => e.episode_number > 0)
      .sort((a, b) => a.episode_number - b.episode_number);
    const idx = eps.findIndex((e) => e.episode_number === episode);
    if (idx === -1) notFound();
    const current = eps[idx];
    const nextEp = eps[idx + 1];

    const card: Card = {
      id: t.id,
      type: "tv",
      title: t.name,
      year: yearOf(t.first_air_date),
      poster: img(t.poster_path, "w342"),
      rating: t.vote_average || undefined,
      totalEpisodes: t.seasons
        .filter((x) => x.season_number > 0)
        .reduce((n, x) => n + x.episode_count, 0),
      runtime: t.episode_run_time[0] ?? undefined,
    };

    return (
      <Player
        sources={playerSources({ tmdbId: t.id, type: "tv", season, episode })}
        playbackId={`tv:${t.id}:s${season}e${episode}`}
        title={current.name || `${t.name} · ${season}. Sezon`}
        subtitle={[
          t.name,
          `S${season} B${episode}`,
          formatDate(current.air_date),
          formatRuntime(current.runtime),
        ]
          .filter(Boolean)
          .join(" · ")}
        overview={current.overview || undefined}
        backHref={`/tv/${t.id}/season/${season}#e${episode}`}
        poster={img(current.still_path, "w300") ?? img(t.poster_path, "w342")}
        nextHref={
          nextEp
            ? `/izle/tv/${t.id}?s=${season}&e=${nextEp.episode_number}`
            : null
        }
        nextLabel={
          nextEp
            ? `S${season} B${nextEp.episode_number} · ${nextEp.name}`
            : null
        }
        watch={{ card, epKey: `s${season}e${episode}` }}
        episodeBase={`/izle/tv/${t.id}`}
      />
    );
  }

  if (p.type === "tvm") {
    const show = await tvmShow(id);
    if (!show) notFound();

    const eps = show._embedded.episodes
      .filter((e) => e.number != null && e.season > 0)
      .sort((a, b) => a.season - b.season || a.number! - b.number!);
    const idx = eps.findIndex(
      (e) => e.season === season && e.number === episode,
    );
    if (idx === -1) notFound();
    const current = eps[idx];
    const nextEp = eps[idx + 1];

    const tmdbId = await resolveTmdbId({
      title: show.name,
      year: show.premiered?.slice(0, 4),
      type: "tv",
    });
    if (!tmdbId) {
      return (
        <Notice>
          <p className="text-lg">Bu dizi için oynatıcı bulunamadı.</p>
          <p className="mt-2 text-sm text-muted">
            &quot;{show.name}&quot; TMDB kataloğunda eşleşmedi. TMDB anahtarı
            tanımlıysa yeniden deneyin.
          </p>
          <Link
            href={`/tvm/${show.id}/season/${season}`}
            className="mt-4 inline-block text-accent underline"
          >
            Bölümlere dön
          </Link>
        </Notice>
      );
    }

    const card: Card = {
      ...tvmCard(show),
      totalEpisodes: eps.length,
      runtime: show.averageRuntime ?? show.runtime ?? undefined,
    };

    return (
      <Player
        sources={playerSources({ tmdbId, type: "tv", season, episode })}
        playbackId={`tvm:${show.id}:s${season}e${episode}`}
        title={current.name || `${show.name} · ${season}. Sezon`}
        subtitle={[
          show.name,
          `S${season} B${episode}`,
          current.airdate ? formatDate(current.airdate) : null,
          formatRuntime(current.runtime),
        ]
          .filter(Boolean)
          .join(" · ")}
        overview={stripHtml(current.summary) || undefined}
        backHref={`/tvm/${show.id}/season/${season}#e${episode}`}
        poster={tvmImg(current.image, true) ?? tvmImg(show.image, true)}
        nextHref={
          nextEp
            ? `/izle/tvm/${show.id}?s=${nextEp.season}&e=${nextEp.number}`
            : null
        }
        nextLabel={
          nextEp ? `S${nextEp.season} B${nextEp.number} · ${nextEp.name}` : null
        }
        watch={{ card, epKey: `s${season}e${episode}` }}
        episodeBase={`/izle/tvm/${show.id}`}
      />
    );
  }

  notFound();
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-line bg-surface/60 p-6">
        {children}
      </div>
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="h-4 w-16 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 aspect-video w-full animate-pulse rounded-2xl bg-surface-2" />
      <div className="mt-5 space-y-3">
        <div className="h-8 w-1/2 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}
