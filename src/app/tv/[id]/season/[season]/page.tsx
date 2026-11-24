import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeasonSkeleton, SeasonView } from "@/components/episode-list";
import { SetupNotice } from "@/components/setup-notice";
import { getSeason, getTv, hasTmdbCredentials, img, yearOf } from "@/lib/tmdb";

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
      <Suspense fallback={<SeasonSkeleton />}>
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

  const card = {
    id: t.id,
    type: "tv" as const,
    title: t.name,
    year: yearOf(t.first_air_date),
    poster: img(t.poster_path, "w342"),
    rating: t.vote_average || undefined,
    totalEpisodes: t.seasons
      .filter((x) => x.season_number > 0)
      .reduce((n, x) => n + x.episode_count, 0),
    runtime: t.episode_run_time[0] ?? undefined,
  };

  const ordered = [...t.seasons].sort((a, b) => a.season_number - b.season_number);
  const idx = ordered.findIndex((x) => x.season_number === p.season);
  const prev = ordered[idx - 1];
  const next = ordered[idx + 1];
  const nav = (x?: (typeof ordered)[number]) =>
    x ? { href: `/tv/${t.id}/season/${x.season_number}`, label: x.name } : undefined;

  return (
    <SeasonView
      card={card}
      showHref={`/tv/${t.id}`}
      season={s.season_number}
      title={s.name}
      overview={s.overview}
      airDate={s.air_date}
      prev={nav(prev)}
      next={nav(next)}
      episodes={s.episodes.map((e) => ({
        id: e.id,
        number: e.episode_number,
        name: e.name,
        overview: e.overview,
        airDate: e.air_date,
        runtime: e.runtime,
        still: img(e.still_path, "w300"),
      }))}
    />
  );
}
