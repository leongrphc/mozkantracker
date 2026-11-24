import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PosterGrid, PosterGridSkeleton } from "@/components/poster-card";
import { SetupNotice } from "@/components/setup-notice";
import { hasTmdbCredentials, searchMulti } from "@/lib/tmdb";
import { toCard } from "@/lib/to-card";

type SP = Promise<{ q?: string | string[]; page?: string | string[] }>;

function first(v?: string | string[]) {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SP;
}): Promise<Metadata> {
  const q = first((await searchParams).q);
  return { title: q ? `"${q}" araması` : "Arama" };
}

export default function SearchPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Suspense
        fallback={
          <>
            <div className="mb-6 h-9 w-64 animate-pulse rounded bg-surface-2" />
            <PosterGridSkeleton />
          </>
        }
      >
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = first(sp.q);
  const page = Math.max(1, Number(first(sp.page)) || 1);

  if (!q) {
    return (
      <p className="text-muted">Aramak için yukarıya bir dizi ya da film adı yaz.</p>
    );
  }
  if (!hasTmdbCredentials()) return <SetupNotice />;

  const data = await searchMulti(q, page);
  const items = data.results.map(toCard);

  return (
    <>
      <h1 className="mb-6 font-display text-3xl sm:text-4xl">
        <span className="text-muted">Sonuçlar:</span> {q}
      </h1>
      {items.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center">
          <p className="text-lg">Hiç sonuç bulunamadı.</p>
          <p className="mt-1 text-sm text-muted">
            Yazımı kontrol et ya da orijinal (İngilizce) adını dene.
          </p>
        </div>
      ) : (
        <PosterGrid items={items} />
      )}
      {data.total_pages > 1 ? (
        <nav className="mt-10 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link
              href={{ pathname: "/search", query: { q, page: page - 1 } }}
              className="rounded-lg border border-line px-4 py-2 hover:border-accent"
            >
              ← Önceki
            </Link>
          ) : null}
          <span className="tabular-nums text-muted">
            {page} / {data.total_pages}
          </span>
          {page < data.total_pages ? (
            <Link
              href={{ pathname: "/search", query: { q, page: page + 1 } }}
              className="rounded-lg border border-line px-4 py-2 hover:border-accent"
            >
              Sonraki →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
