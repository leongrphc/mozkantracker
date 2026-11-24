import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CardRow,
  CastRow,
  DetailHero,
  DetailSkeleton,
  NextEpisodes,
  SeasonGrid,
  Trailer,
  WhereToWatch,
} from "@/components/details";
import { SetupNotice } from "@/components/setup-notice";
import { StatusPicker, TvProgress } from "@/components/tracker-controls";
import {
  formatDate,
  getTv,
  hasTmdbCredentials,
  img,
  pickTrailer,
  providersFor,
  yearOf,
  type EpisodeRef,
} from "@/lib/tmdb";
import { toCard, tmdbCast } from "@/lib/to-card";

type Params = Promise<{ id: string }>;

const STATUS_TR: Record<string, string> = {
  "Returning Series": "Devam ediyor",
  Ended: "Final yaptı",
  Canceled: "İptal edildi",
  "In Production": "Yapımda",
  Planned: "Planlandı",
  Pilot: "Pilot",
};

function parseId(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const id = parseId((await params).id);
  if (!id || !hasTmdbCredentials()) return { title: "Dizi" };
  const t = await getTv(id);
  return t
    ? { title: `${t.name} (${yearOf(t.first_air_date)})`, description: t.overview }
    : { title: "Bulunamadı" };
}

export default function TvPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Tv params={params} />
    </Suspense>
  );
}

function epLine(label: string, ep: EpisodeRef | null, id: number) {
  return ep
    ? [
        {
          label,
          href: `/tv/${id}/season/${ep.season_number}#e${ep.episode_number}`,
          code: `S${ep.season_number} B${ep.episode_number}`,
          name: ep.name,
          date: formatDate(ep.air_date),
        },
      ]
    : [];
}

async function Tv({ params }: { params: Params }) {
  const id = parseId((await params).id);
  if (!id) notFound();
  if (!hasTmdbCredentials())
    return (
      <div className="px-4 py-12">
        <SetupNotice />
      </div>
    );

  const t = await getTv(id);
  if (!t) notFound();

  const seasons = [
    ...t.seasons.filter((s) => s.season_number > 0),
    ...t.seasons.filter((s) => s.season_number === 0),
  ];
  const totalEpisodes = t.seasons
    .filter((s) => s.season_number > 0)
    .reduce((n, s) => n + s.episode_count, 0);

  const card = {
    id: t.id,
    type: "tv" as const,
    title: t.name,
    year: yearOf(t.first_air_date),
    poster: img(t.poster_path, "w342"),
    rating: t.vote_average || undefined,
    totalEpisodes,
    runtime: t.episode_run_time[0] ?? undefined,
  };

  const endYear =
    t.status === "Ended" || t.status === "Canceled" ? yearOf(t.last_air_date) : "";
  const years =
    endYear && endYear !== yearOf(t.first_air_date)
      ? `${yearOf(t.first_air_date)}–${endYear}`
      : yearOf(t.first_air_date);

  return (
    <>
      <DetailHero
        backdrop={img(t.backdrop_path, "w1280")}
        poster={img(t.poster_path, "w500")}
        title={t.name}
        originalTitle={t.original_name}
        tagline={t.tagline}
        meta={[
          "Dizi",
          years,
          `${t.number_of_seasons} sezon`,
          `${totalEpisodes} bölüm`,
          STATUS_TR[t.status] ?? t.status,
          t.networks[0]?.name,
          t.vote_count > 0 && `★ ${t.vote_average.toFixed(1)}`,
        ]}
      >
        <p className="mt-4 max-w-2xl leading-relaxed text-fg/90">
          {t.overview || "Türkçe özet bulunmuyor."}
        </p>
        <div className="mt-6 space-y-4">
          <StatusPicker card={card} />
          <TvProgress card={card} total={totalEpisodes} className="max-w-sm" />
        </div>
        <NextEpisodes
          items={[
            ...epLine("Son yayınlanan", t.last_episode_to_air, t.id),
            ...epLine("Sıradaki bölüm", t.next_episode_to_air, t.id),
          ]}
        />
      </DetailHero>

      <WhereToWatch providers={providersFor(t)} title={t.name} />

      <SeasonGrid
        card={card}
        seasons={seasons.map((s) => ({
          key: s.id,
          number: s.season_number,
          name: s.name,
          episodeCount: s.episode_count,
          year: yearOf(s.air_date),
          poster: img(s.poster_path ?? t.poster_path, "w185"),
          href: `/tv/${t.id}/season/${s.season_number}`,
        }))}
      />

      <Trailer video={pickTrailer(t.videos)} />
      <CastRow cast={tmdbCast(t.credits?.cast)} />
      <CardRow
        title="Bunları da sevebilirsin"
        items={(t.recommendations?.results ?? [])
          .map((r) => toCard({ ...r, media_type: r.media_type ?? "tv" }))
          .slice(0, 15)}
      />
    </>
  );
}
