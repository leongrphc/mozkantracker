import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { PosterGrid, PosterGridSkeleton } from "@/components/poster-card";
import { LiteModeBanner } from "@/components/setup-notice";
import { ContinueWatching } from "@/components/continue-watching";
import { getTrending, hasTmdbCredentials } from "@/lib/tmdb";
import { toCard } from "@/lib/to-card";
import { tvmCard, tvmToday } from "@/lib/tvmaze";

export default function Home() {
  return (
    <>
      <section className="border-b border-line bg-[radial-gradient(ellipse_at_top,rgba(242,181,68,0.12),transparent_60%)]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl">
            Ne izlesem,
            <br />
            <span className="italic text-accent">nerede izlesem?</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-muted">
            Bir dizi ya da film adı yaz. Türkiye&apos;de hangi platformda
            olduğunu, fragmanını ve bölümlerini gör. İzlediklerini takip et.
          </p>
          <div className="mt-8">
            <SearchBox autoFocus />
          </div>
        </div>
      </section>

      <ContinueWatching />

      <Suspense
        fallback={
          <section className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-5 h-9 w-56 animate-pulse rounded bg-surface-2" />
            <PosterGridSkeleton />
          </section>
        }
      >
        <Discover />
      </Suspense>
    </>
  );
}

async function Discover() {
  await connection();

  if (hasTmdbCredentials()) {
    const [week, day] = await Promise.all([getTrending("week"), getTrending("day")]);
    return (
      <>
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-display text-3xl">Bugün gündemde</h2>
            <Link href="/kesfet" className="text-sm text-muted hover:text-accent">
              Keşfet →
            </Link>
          </div>
          <PosterGrid items={day.slice(0, 12).map(toCard)} />
        </section>
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <h2 className="mb-5 font-display text-3xl">Bu hafta popüler</h2>
          <PosterGrid items={week.slice(0, 18).map(toCard)} />
        </section>
      </>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const shows = await tvmToday(today);
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <LiteModeBanner />
      </div>
      <h2 className="mb-5 font-display text-3xl">Bugün yeni bölümü çıkanlar</h2>
      <PosterGrid items={shows.slice(0, 18).map(tvmCard)} />
    </section>
  );
}
