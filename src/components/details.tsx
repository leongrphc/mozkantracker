import Image from "next/image";
import type { ReactNode } from "react";
import { PosterCard, type PosterCardData } from "@/components/poster-card";
import {
  img,
  type CastMember,
  type Provider,
  type Video,
  type WatchProviders,
} from "@/lib/tmdb";

export function DetailHero({
  backdrop,
  poster,
  title,
  originalTitle,
  meta,
  tagline,
  children,
}: {
  backdrop: string | null;
  poster: string | null;
  title: string;
  originalTitle?: string;
  meta: (string | null | undefined | false)[];
  tagline?: string;
  children?: ReactNode;
}) {
  const backdropUrl = img(backdrop, "w1280");
  const posterUrl = img(poster, "w500");
  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      {backdropUrl ? (
        <Image
          src={backdropUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-30"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/80 to-bg/30" />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-end sm:py-16">
        <div className="relative mx-auto aspect-[2/3] w-44 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2 shadow-2xl sm:mx-0 sm:w-60">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={`${title} afişi`}
              fill
              priority
              sizes="240px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-6xl">
            {title}
          </h1>
          {originalTitle && originalTitle !== title ? (
            <p className="mt-1 text-muted">{originalTitle}</p>
          ) : null}
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
            {meta.filter(Boolean).map((m, i) => (
              <span key={i} className="after:ml-3 after:content-['·'] last:after:content-none">
                {m}
              </span>
            ))}
          </p>
          {tagline ? (
            <p className="mt-4 font-display text-xl italic text-accent">
              {tagline}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}

export function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-3xl">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function ProviderRow({ label, items }: { label: string; items?: Provider[] }) {
  if (!items?.length) return null;
  const sorted = [...items].sort((a, b) => a.display_priority - b.display_priority);
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <ul className="flex flex-wrap gap-3">
        {sorted.map((p) => (
          <li
            key={p.provider_id}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-3"
          >
            <Image
              src={img(p.logo_path, "w92")!}
              alt=""
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-sm">{p.provider_name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WhereToWatch({
  providers,
  title,
}: {
  providers: WatchProviders | null;
  title: string;
}) {
  const has =
    providers &&
    (providers.flatrate?.length ||
      providers.free?.length ||
      providers.ads?.length ||
      providers.rent?.length ||
      providers.buy?.length);

  return (
    <Section
      title="Nerede izlenir?"
      aside={<span className="text-xs text-muted">Türkiye · JustWatch verisi</span>}
    >
      {has ? (
        <div className="space-y-5 rounded-2xl border border-line bg-surface/50 p-5">
          <ProviderRow label="Abonelikle" items={providers.flatrate} />
          <ProviderRow label="Ücretsiz" items={providers.free} />
          <ProviderRow label="Reklamlı ücretsiz" items={providers.ads} />
          <ProviderRow label="Kirala" items={providers.rent} />
          <ProviderRow label="Satın al" items={providers.buy} />
          {providers.link ? (
            <a
              href={providers.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink hover:brightness-110"
            >
              Platform bağlantılarını aç ↗
            </a>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface/50 p-5 text-sm text-muted">
          <p>
            Şu an Türkiye&apos;de yasal bir platformda bulunamadı. Sinemada
            gösterimde olabilir ya da henüz yayına girmemiş olabilir.
          </p>
          <a
            href={`https://www.justwatch.com/tr/arama?q=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-accent underline"
          >
            JustWatch&apos;ta ara ↗
          </a>
        </div>
      )}
    </Section>
  );
}

export function Trailer({ video }: { video: Video | null }) {
  if (!video) return null;
  return (
    <Section title="Fragman">
      <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-surface">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.key}?rel=0`}
          title={video.name}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </Section>
  );
}

export function CastRow({ cast }: { cast?: CastMember[] }) {
  const list = (cast ?? []).slice(0, 15);
  if (!list.length) return null;
  return (
    <Section title="Oyuncular">
      <ul className="scroll-row -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {list.map((c) => {
          const src = img(c.profile_path, "w185");
          return (
            <li key={`${c.id}-${c.character}`} className="w-28 shrink-0">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-line bg-surface-2">
                {src ? (
                  <Image src={src} alt="" fill sizes="112px" className="object-cover" />
                ) : null}
              </div>
              <p className="mt-2 text-sm font-medium leading-tight">{c.name}</p>
              <p className="text-xs text-muted">{c.character}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function CardRow({
  title,
  items,
}: {
  title: string;
  items: PosterCardData[];
}) {
  if (!items.length) return null;
  return (
    <Section title={title}>
      <ul className="scroll-row -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {items.map((i) => (
          <li key={`${i.type}-${i.id}`} className="w-36 shrink-0 sm:w-40">
            <PosterCard item={i} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:flex-row sm:items-end">
      <div className="mx-auto aspect-[2/3] w-44 animate-pulse rounded-xl bg-surface-2 sm:mx-0 sm:w-60" />
      <div className="flex-1 space-y-3">
        <div className="h-12 w-2/3 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-surface-2" />
        <div className="h-20 w-full animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}
