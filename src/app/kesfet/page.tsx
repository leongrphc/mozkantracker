import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PosterGrid, PosterGridSkeleton } from "@/components/poster-card";
import { SetupNotice } from "@/components/setup-notice";
import {
  discover,
  getGenres,
  getProviders,
  hasTmdbCredentials,
  img,
  type DiscoverSort,
  type MediaType,
} from "@/lib/tmdb";
import { toCard } from "@/lib/to-card";

export const metadata: Metadata = { title: "Keşfet" };

type SP = Promise<Record<string, string | string[] | undefined>>;

interface Filters {
  tur: MediaType;
  platform?: number;
  kategori?: number;
  sirala: DiscoverSort;
  sayfa: number;
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function parse(sp: Awaited<SP>): Filters {
  const num = (v?: string) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : undefined;
  };
  const sort = one(sp.sirala);
  return {
    tur: one(sp.tur) === "movie" ? "movie" : "tv",
    platform: num(one(sp.platform)),
    kategori: num(one(sp.kategori)),
    sirala: sort === "rating" || sort === "new" ? sort : "popular",
    sayfa: Math.min(num(one(sp.sayfa)) ?? 1, 500),
  };
}

function href(f: Filters, patch: Partial<Filters>) {
  const next = { ...f, sayfa: 1, ...patch };
  const q = new URLSearchParams();
  q.set("tur", next.tur);
  if (next.platform) q.set("platform", String(next.platform));
  if (next.kategori) q.set("kategori", String(next.kategori));
  if (next.sirala !== "popular") q.set("sirala", next.sirala);
  if (next.sayfa > 1) q.set("sayfa", String(next.sayfa));
  return `/kesfet?${q}`;
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "flex shrink-0 items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink"
          : "flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-fg"
      }
    >
      {children}
    </Link>
  );
}

export default function DiscoverPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-4xl sm:text-5xl">Keşfet</h1>
      <p className="mt-1 text-sm text-muted">
        Türkiye&apos;deki platformlara ve türe göre filtrele.
      </p>
      <Suspense
        fallback={
          <div className="mt-6">
            <div className="mb-6 h-24 animate-pulse rounded-xl bg-surface-2" />
            <PosterGridSkeleton />
          </div>
        }
      >
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: SP }) {
  const f = parse(await searchParams);
  if (!hasTmdbCredentials())
    return (
      <div className="mt-8">
        <SetupNotice />
      </div>
    );

  const [providers, genres, data] = await Promise.all([
    getProviders(f.tur),
    getGenres(f.tur),
    discover({
      type: f.tur,
      provider: f.platform,
      genre: f.kategori,
      sort: f.sirala,
      page: f.sayfa,
    }),
  ]);
  const totalPages = Math.min(data.total_pages, 500);
  const sorts: [DiscoverSort, string][] = [
    ["popular", "Popüler"],
    ["rating", "En yüksek puan"],
    ["new", "En yeni"],
  ];

  return (
    <>
      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Chip href={href(f, { tur: "tv", platform: undefined, kategori: undefined })} active={f.tur === "tv"}>
            Diziler
          </Chip>
          <Chip href={href(f, { tur: "movie", platform: undefined, kategori: undefined })} active={f.tur === "movie"}>
            Filmler
          </Chip>
          <span className="mx-1 w-px self-stretch bg-line" />
          {sorts.map(([k, label]) => (
            <Chip key={k} href={href(f, { sirala: k })} active={f.sirala === k}>
              {label}
            </Chip>
          ))}
        </div>

        <div className="scroll-row -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip href={href(f, { platform: undefined })} active={!f.platform}>
            Tüm platformlar
          </Chip>
          {providers.map((p) => (
            <Chip
              key={p.provider_id}
              href={href(f, { platform: p.provider_id })}
              active={f.platform === p.provider_id}
            >
              <Image
                src={img(p.logo_path, "w92")!}
                alt=""
                width={20}
                height={20}
                className="rounded"
              />
              {p.provider_name}
            </Chip>
          ))}
        </div>

        <div className="scroll-row -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip href={href(f, { kategori: undefined })} active={!f.kategori}>
            Tüm türler
          </Chip>
          {genres.map((g) => (
            <Chip key={g.id} href={href(f, { kategori: g.id })} active={f.kategori === g.id}>
              {g.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {data.results.length ? (
          <PosterGrid items={data.results.map(toCard)} />
        ) : (
          <p className="rounded-xl border border-line bg-surface p-8 text-center text-muted">
            Bu filtrelerle sonuç yok.
          </p>
        )}
      </div>

      {totalPages > 1 ? (
        <nav className="mt-10 flex items-center justify-center gap-3 text-sm">
          {f.sayfa > 1 ? (
            <Link
              href={href(f, { sayfa: f.sayfa - 1 })}
              className="rounded-lg border border-line px-4 py-2 hover:border-accent"
            >
              ← Önceki
            </Link>
          ) : null}
          <span className="tabular-nums text-muted">
            {f.sayfa} / {totalPages}
          </span>
          {f.sayfa < totalPages ? (
            <Link
              href={href(f, { sayfa: f.sayfa + 1 })}
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
