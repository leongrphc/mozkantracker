import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SetupNotice } from "@/components/setup-notice";
import {
  EpisodeToggle,
  SeasonMarkAll,
} from "@/components/tracker-controls";
import {
  formatDate,
  formatRuntime,
  getSeason,
  getTv,
  hasTmdbCredentials,
  img,
  yearOf,
} from "@/lib/tmdb";

type Params = Promise<{ id: string; season: string }>;

function parse(p: { id: string; season: string }) {
  const id = Number(p.id);
  const season = Number(p.season);
  if (!Number.isInteger(id) || id <= 0) return null;
  if (!Number.isInteger(season) || season < 0) return null;
  return { id, season };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const p = parse(await params);
  if (!p || !hasTmdbCredentials()) return { title: "Sezon" };
  const t = await getTv(p.id);
  return { title: t ? `${t.name} · ${p.season}. Sezon` : "Bulunamadı" };
}

export default function SeasonPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="h-10 w-1/2 animate-pulse rounded bg-surface-2" />
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        }
      >
        <Season params={params} />
      </Suspense>
    </div>
  );
}

async function Season({ params }: { params: Params }) {
  const p = parse(await params);
  if (!p) notFound();
  if (!hasTmdbCredentials()) return <SetupNotice />;

  const [t, s] = await Promise.all([getTv(p.id), getSeason(p.id, p.season)]);
  if (!t || !s) notFound();

  const totalEpisodes = t.seasons
    .filter((x) => x.season_number > 0)
    .reduce((n, x) => n + x.episode_count, 0);
  const card = {
    id: t.id,
    type: "tv" as const,
    title: t.name,
    year: yearOf(t.first_air_date),
    poster: img(t.poster_path, "w342"),
    rating: t.vote_average || undefined,
    totalEpisodes,
  };

  const ordered = [...t.seasons].sort((a, b) => a.season_number - b.season_number);
  const idx = ordered.findIndex((x) => x.season_number === p.season);
  const prev = ordered[idx - 1];
  const next = ordered[idx + 1];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Link href={`/tv/${t.id}`} className="text-sm text-muted hover:text-accent">
        ← {t.name}
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">{s.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {s.episodes.length} bölüm
            {s.air_date ? ` · ${formatDate(s.air_date)}` : ""}
          </p>
        </div>
        <SeasonMarkAll
          tvId={t.id}
          season={s.season_number}
          episodes={s.episodes
            .filter((e) => e.air_date && e.air_date <= today)
            .map((e) => e.episode_number)}
          card={card}
        />
      </div>
      {s.overview ? (
        <p className="mt-4 max-w-2xl text-fg/85">{s.overview}</p>
      ) : null}

      <ol className="mt-8 space-y-3">
        {s.episodes.map((e) => {
          const still = img(e.still_path, "w300");
          const aired = Boolean(e.air_date && e.air_date <= today);
          return (
            <li
              key={e.id}
              id={`e${e.episode_number}`}
              className="flex scroll-mt-24 gap-4 rounded-xl border border-line bg-surface/60 p-3 target:border-accent"
            >
              <div className="relative hidden aspect-video w-44 shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:block">
                {still ? (
                  <Image src={still} alt="" fill sizes="176px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">
                  <span className="font-semibold text-accent">
                    {e.episode_number}. Bölüm
                  </span>{" "}
                  · {formatDate(e.air_date)}
                  {formatRuntime(e.runtime) ? ` · ${formatRuntime(e.runtime)}` : ""}
                  {!aired ? " · Henüz yayınlanmadı" : ""}
                </p>
                <p className="mt-0.5 font-medium">{e.name}</p>
                {e.overview ? (
                  <p className="mt-1 line-clamp-3 text-sm text-muted">{e.overview}</p>
                ) : null}
              </div>
              {aired ? (
                <EpisodeToggle
                  tvId={t.id}
                  season={s.season_number}
                  episode={e.episode_number}
                  card={card}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <nav className="mt-8 flex justify-between text-sm">
        {prev ? (
          <Link
            href={`/tv/${t.id}/season/${prev.season_number}`}
            className="rounded-lg border border-line px-4 py-2 hover:border-accent"
          >
            ← {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/tv/${t.id}/season/${next.season_number}`}
            className="rounded-lg border border-line px-4 py-2 hover:border-accent"
          >
            {next.name} →
          </Link>
        ) : null}
      </nav>
    </>
  );
}
