import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CastRow,
  DetailHero,
  DetailSkeleton,
  NextEpisodes,
  SeasonGrid,
  Section,
} from "@/components/details";
import { StatusPicker, TvProgress } from "@/components/tracker-controls";
import { formatDate } from "@/lib/tmdb";
import {
  TVM_STATUS_TR,
  genreTr,
  stripHtml,
  tvmCard,
  tvmImg,
  tvmShow,
  type TvmEpisode,
} from "@/lib/tvmaze";

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
  const s = id ? await tvmShow(id) : null;
  return s
    ? { title: s.name, description: stripHtml(s.summary).slice(0, 200) }
    : { title: "Dizi" };
}

export default function TvmPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Show params={params} />
    </Suspense>
  );
}

function epLine(label: string, e: TvmEpisode | undefined, id: number) {
  return e && e.number != null
    ? [
        {
          label,
          href: `/tvm/${id}/season/${e.season}#e${e.number}`,
          code: `S${e.season} B${e.number}`,
          name: e.name,
          date: formatDate(e.airdate),
        },
      ]
    : [];
}

async function Show({ params }: { params: Params }) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const s = await tvmShow(id);
  if (!s) notFound();

  const episodes = s._embedded.episodes.filter((e) => e.number != null);
  const today = new Date().toISOString().slice(0, 10);
  const aired = episodes.filter((e) => e.airdate && e.airdate <= today);
  const upcoming = episodes.find((e) => e.airdate && e.airdate > today);

  const countBySeason = new Map<number, number>();
  for (const e of episodes) countBySeason.set(e.season, (countBySeason.get(e.season) ?? 0) + 1);

  const card = {
    ...tvmCard(s),
    totalEpisodes: episodes.length,
    runtime: s.averageRuntime ?? s.runtime ?? undefined,
  };
  const channel = s.webChannel?.name ?? s.network?.name;
  const years = s.ended && s.ended.slice(0, 4) !== s.premiered?.slice(0, 4)
    ? `${s.premiered?.slice(0, 4)}–${s.ended.slice(0, 4)}`
    : s.premiered?.slice(0, 4);

  return (
    <>
      <DetailHero
        backdrop={tvmImg(s.image, true)}
        poster={tvmImg(s.image, true)}
        title={s.name}
        meta={[
          "Dizi",
          years,
          `${s._embedded.seasons.length} sezon`,
          `${episodes.length} bölüm`,
          TVM_STATUS_TR[s.status] ?? s.status,
          channel,
          s.genres.map(genreTr).join(", "),
          s.rating.average ? `★ ${s.rating.average.toFixed(1)}` : null,
        ]}
      >
        <p className="mt-4 max-w-2xl leading-relaxed text-fg/90">
          {stripHtml(s.summary) || "Özet bulunmuyor."}
        </p>
        <p className="mt-2 text-xs text-muted">
          Basit mod: veriler TVmaze kaynaklı, özetler İngilizce olabilir.
        </p>
        <div className="mt-6 space-y-4">
          <StatusPicker card={card} />
          <TvProgress card={card} total={episodes.length} className="max-w-sm" />
        </div>
        <NextEpisodes
          items={[
            ...epLine("Son yayınlanan", aired.at(-1), s.id),
            ...epLine("Sıradaki bölüm", upcoming, s.id),
          ]}
        />
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {s.officialSite ? (
            <a
              href={s.officialSite}
              target="_blank"
              rel="noreferrer"
              className="text-accent underline"
            >
              Resmi sayfa{channel ? ` (${channel})` : ""} ↗
            </a>
          ) : null}
          {s.externals.imdb ? (
            <a
              href={`https://www.imdb.com/title/${s.externals.imdb}/`}
              target="_blank"
              rel="noreferrer"
              className="text-muted underline hover:text-fg"
            >
              IMDb ↗
            </a>
          ) : null}
          <a
            href={`https://www.justwatch.com/tr/arama?q=${encodeURIComponent(s.name)}`}
            target="_blank"
            rel="noreferrer"
            className="text-muted underline hover:text-fg"
          >
            Türkiye&apos;de nerede izlenir? (JustWatch) ↗
          </a>
        </div>
      </DetailHero>

      <SeasonGrid
        card={card}
        seasons={s._embedded.seasons.map((x) => ({
          key: x.id,
          number: x.number,
          name: x.name || `${x.number}. Sezon`,
          episodeCount: countBySeason.get(x.number) ?? x.episodeOrder ?? 0,
          year: x.premiereDate?.slice(0, 4) ?? "",
          poster: tvmImg(x.image) ?? tvmImg(s.image),
          href: `/tvm/${s.id}/season/${x.number}`,
        }))}
      />

      <CastRow
        cast={s._embedded.cast.map((c) => ({
          key: `${c.person.id}-${c.character.id}`,
          name: c.person.name,
          character: c.character.name,
          photo: tvmImg(c.person.image),
        }))}
      />

      <Section title="Platform bilgisi">
        <p className="rounded-2xl border border-line bg-surface/50 p-5 text-sm text-muted">
          Türkiye platform bilgisi (Netflix, Prime, Disney+ vb.) için TMDB anahtarı
          ekle. Ayrıntılar README dosyasında.
        </p>
      </Section>
    </>
  );
}
