import Image from "next/image";
import Link from "next/link";
import { EpisodeToggle, SeasonMarkAll } from "@/components/tracker-controls";
import { formatDate, formatRuntime } from "@/lib/tmdb";
import type { Card } from "@/lib/tracker";

export interface NormalizedEpisode {
  id: number;
  number: number;
  name: string;
  overview: string;
  airDate: string | null;
  runtime: number | null;
  still: string | null;
}

export interface SeasonNav {
  href: string;
  label: string;
}

export function SeasonView({
  card,
  showHref,
  season,
  title,
  overview,
  airDate,
  episodes,
  prev,
  next,
}: {
  card: Card;
  showHref: string;
  season: number;
  title: string;
  overview?: string;
  airDate?: string | null;
  episodes: NormalizedEpisode[];
  prev?: SeasonNav;
  next?: SeasonNav;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const isAired = (e: NormalizedEpisode) => Boolean(e.airDate && e.airDate <= today);

  return (
    <>
      <Link href={showHref} className="text-sm text-muted hover:text-accent">
        ← {card.title}
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            {episodes.length} bölüm
            {airDate ? ` · ${formatDate(airDate)}` : ""}
          </p>
        </div>
        <SeasonMarkAll
          card={card}
          season={season}
          episodes={episodes.filter(isAired).map((e) => e.number)}
        />
      </div>
      {overview ? <p className="mt-4 max-w-2xl text-fg/85">{overview}</p> : null}

      <ol className="mt-8 space-y-3">
        {episodes.map((e) => {
          const aired = isAired(e);
          const rt = formatRuntime(e.runtime);
          return (
            <li
              key={e.id}
              id={`e${e.number}`}
              className="flex scroll-mt-24 gap-4 rounded-xl border border-line bg-surface/60 p-3 target:border-accent"
            >
              <div className="relative hidden aspect-video w-44 shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:block">
                {e.still ? (
                  <Image src={e.still} alt="" fill sizes="176px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">
                  <span className="font-semibold text-accent">{e.number}. Bölüm</span>{" "}
                  · {formatDate(e.airDate)}
                  {rt ? ` · ${rt}` : ""}
                  {!aired ? " · Henüz yayınlanmadı" : ""}
                </p>
                <p className="mt-0.5 font-medium">{e.name}</p>
                {e.overview ? (
                  <p className="mt-1 line-clamp-3 text-sm text-muted">{e.overview}</p>
                ) : null}
              </div>
              {aired ? (
                <EpisodeToggle card={card} season={season} episode={e.number} />
              ) : null}
            </li>
          );
        })}
      </ol>

      <nav className="mt-8 flex justify-between gap-3 text-sm">
        {prev ? (
          <Link
            href={prev.href}
            className="rounded-lg border border-line px-4 py-2 hover:border-accent"
          >
            ← {prev.label}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={next.href}
            className="rounded-lg border border-line px-4 py-2 hover:border-accent"
          >
            {next.label} →
          </Link>
        ) : null}
      </nav>
    </>
  );
}

export function SeasonSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-10 w-1/2 animate-pulse rounded bg-surface-2" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-2" />
      ))}
    </div>
  );
}
