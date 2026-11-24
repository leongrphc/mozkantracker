import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeasonSkeleton, SeasonView } from "@/components/episode-list";
import { stripHtml, tvmCard, tvmImg, tvmShow } from "@/lib/tvmaze";

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
  const s = p ? await tvmShow(p.id) : null;
  return { title: s && p ? `${s.name} · ${p.season}. Sezon` : "Sezon" };
}

export default function TvmSeasonPage({ params }: { params: Params }) {
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
  const s = await tvmShow(p.id);
  if (!s) notFound();

  const seasons = [...s._embedded.seasons].sort((a, b) => a.number - b.number);
  const idx = seasons.findIndex((x) => x.number === p.season);
  if (idx === -1) notFound();
  const season = seasons[idx];

  const all = s._embedded.episodes.filter((e) => e.number != null);
  const episodes = all.filter((e) => e.season === p.season);
  const nav = (x?: (typeof seasons)[number]) =>
    x
      ? { href: `/tvm/${s.id}/season/${x.number}`, label: x.name || `${x.number}. Sezon` }
      : undefined;

  return (
    <SeasonView
      card={{
        ...tvmCard(s),
        totalEpisodes: all.length,
        runtime: s.averageRuntime ?? s.runtime ?? undefined,
      }}
      showHref={`/tvm/${s.id}`}
      season={season.number}
      title={season.name || `${season.number}. Sezon`}
      overview={stripHtml(season.summary)}
      airDate={season.premiereDate}
      prev={nav(seasons[idx - 1])}
      next={nav(seasons[idx + 1])}
      episodes={episodes.map((e) => ({
        id: e.id,
        number: e.number!,
        name: e.name,
        overview: stripHtml(e.summary),
        airDate: e.airdate || null,
        runtime: e.runtime,
        still: tvmImg(e.image),
      }))}
    />
  );
}
