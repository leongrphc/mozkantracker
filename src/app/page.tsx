import { Suspense } from "react";
import { connection } from "next/server";
import { SearchBox } from "@/components/search-box";
import { PosterGrid, PosterGridSkeleton } from "@/components/poster-card";
import { SetupNotice } from "@/components/setup-notice";
import { getTrending, hasTmdbCredentials } from "@/lib/tmdb";
import { toCard } from "@/lib/to-card";

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

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-5 font-display text-3xl">Bu hafta popüler</h2>
        <Suspense fallback={<PosterGridSkeleton />}>
          <Trending />
        </Suspense>
      </section>
    </>
  );
}

async function Trending() {
  await connection();
  if (!hasTmdbCredentials()) return <SetupNotice />;
  const items = await getTrending("week");
  return <PosterGrid items={items.slice(0, 18).map(toCard)} />;
}
