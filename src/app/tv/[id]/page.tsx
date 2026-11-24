import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CardRow,
  CastRow,
  DetailHero,
  DetailSkeleton,
  Section,
  Trailer,
  WhereToWatch,
} from "@/components/details";
import { SetupNotice } from "@/components/setup-notice";
import {
  SeasonCount,
  StatusPicker,
  TvProgress,
} from "@/components/tracker-controls";
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
import { toCard } from "@/lib/to-card";

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

function EpisodeLine({ label, ep, id }: { label: string; ep: EpisodeRef; id: number }) {
  return (
    <Link
      href={`/tv/${id}/season/${ep.season_number}#e${ep.episode_number}`}
      className="block rounded-xl border border-line bg-surface/70 px-4 py-3 hover:border-accent"
    >
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 text-sm">
        <span className="font-medium text-accent">
          S{ep.season_number} B{ep.episode_number}
        </span>{" "}
        {ep.name} · <span className="text-muted">{formatDate(ep.air_date)}</span>
      </p>
    </Link>
  );
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
  };

  const endYear = t.status === "Ended" || t.status === "Canceled" ? yearOf(t.last_air_date) : "";
  const years = endYear && endYear !== yearOf(t.first_air_date)
    ? `${yearOf(t.first_air_date)}–${endYear}`
    : yearOf(t.first_air_date);

  return (
    <>
      <DetailHero
        backdrop={t.backdrop_path}
        poster={t.poster_path}
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
          <TvProgress tvId={t.id} total={totalEpisodes} className="max-w-sm" />
        </div>
        <div className="mt-5 grid max-w-2xl gap-2 sm:grid-cols-2">
          {t.last_episode_to_air ? (
            <EpisodeLine label="Son yayınlanan" ep={t.last_episode_to_air} id={t.id} />
          ) : null}
          {t.next_episode_to_air ? (
            <EpisodeLine label="Sıradaki bölüm" ep={t.next_episode_to_air} id={t.id} />
          ) : null}
        </div>
      </DetailHero>

      <WhereToWatch providers={providersFor(t)} title={t.name} />

      <Section title="Sezonlar">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((s) => {
            const poster = img(s.poster_path ?? t.poster_path, "w185");
            return (
              <li key={s.id}>
                <Link
                  href={`/tv/${t.id}/season/${s.season_number}`}
                  className="flex gap-4 rounded-xl border border-line bg-surface/60 p-3 hover:border-accent"
                >
                  <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    {poster ? (
                      <Image src={poster} alt="" fill sizes="64px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 py-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted">
                      {s.episode_count} bölüm
                      {s.air_date ? ` · ${yearOf(s.air_date)}` : ""}
                    </p>
                    <p className="mt-1 text-xs">
                      <SeasonCount
                        tvId={t.id}
                        season={s.season_number}
                        total={s.episode_count}
                      />
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <Trailer video={pickTrailer(t.videos)} />
      <CastRow cast={t.credits?.cast} />
      <CardRow
        title="Bunları da sevebilirsin"
        items={(t.recommendations?.results ?? [])
          .map((r) => toCard({ ...r, media_type: r.media_type ?? "tv" }))
          .slice(0, 15)}
      />
    </>
  );
}
