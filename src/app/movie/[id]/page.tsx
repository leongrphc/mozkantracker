import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CardRow,
  CastRow,
  DetailHero,
  DetailSkeleton,
  Trailer,
  WhereToWatch,
} from "@/components/details";
import { SetupNotice } from "@/components/setup-notice";
import { StatusPicker } from "@/components/tracker-controls";
import {
  formatRuntime,
  getMovie,
  hasTmdbCredentials,
  img,
  pickTrailer,
  providersFor,
  yearOf,
} from "@/lib/tmdb";
import { toCard } from "@/lib/to-card";

type Params = Promise<{ id: string }>;

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
  if (!id || !hasTmdbCredentials()) return { title: "Film" };
  const m = await getMovie(id);
  return m
    ? { title: `${m.title} (${yearOf(m.release_date)})`, description: m.overview }
    : { title: "Bulunamadı" };
}

export default function MoviePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Movie params={params} />
    </Suspense>
  );
}

async function Movie({ params }: { params: Params }) {
  const id = parseId((await params).id);
  if (!id) notFound();
  if (!hasTmdbCredentials())
    return (
      <div className="px-4 py-12">
        <SetupNotice />
      </div>
    );

  const m = await getMovie(id);
  if (!m) notFound();

  const card = {
    id: m.id,
    type: "movie" as const,
    title: m.title,
    year: yearOf(m.release_date),
    poster: img(m.poster_path, "w342"),
    rating: m.vote_average || undefined,
  };
  const imdb = m.external_ids?.imdb_id;

  return (
    <>
      <DetailHero
        backdrop={m.backdrop_path}
        poster={m.poster_path}
        title={m.title}
        originalTitle={m.original_title}
        tagline={m.tagline}
        meta={[
          "Film",
          yearOf(m.release_date),
          formatRuntime(m.runtime),
          m.genres.map((g) => g.name).join(", "),
          m.vote_count > 0 && `★ ${m.vote_average.toFixed(1)} (${m.vote_count} oy)`,
        ]}
      >
        <p className="mt-4 max-w-2xl leading-relaxed text-fg/90">
          {m.overview || "Türkçe özet bulunmuyor."}
        </p>
        <div className="mt-6">
          <StatusPicker card={card} />
        </div>
        {imdb ? (
          <a
            href={`https://www.imdb.com/title/${imdb}/`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm text-muted underline hover:text-fg"
          >
            IMDb sayfası ↗
          </a>
        ) : null}
      </DetailHero>

      <WhereToWatch providers={providersFor(m)} title={m.title} />
      <Trailer video={pickTrailer(m.videos)} />
      <CastRow cast={m.credits?.cast} />
      <CardRow
        title="Bunları da sevebilirsin"
        items={(m.recommendations?.results ?? [])
          .map((r) => toCard({ ...r, media_type: r.media_type ?? "movie" }))
          .slice(0, 15)}
      />
    </>
  );
}
