"use client";

import Image from "next/image";
import Link from "next/link";
import { epKey, setEpisodes } from "@/lib/tracker";
import { showHref, useShowProgress, type ShowRow } from "@/lib/use-progress";

export function NextUpCard({
  row,
  className = "w-72 shrink-0",
}: {
  row: ShowRow;
  className?: string;
}) {
  const { item, nextUp, remaining } = row;
  if (!nextUp) return null;
  return (
    <div className={`flex gap-3 rounded-xl border border-line bg-surface/70 p-3 ${className}`}>
      <Link
        href={showHref(item)}
        className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2"
      >
        {item.poster ? (
          <Image src={item.poster} alt="" fill sizes="64px" className="object-cover" />
        ) : null}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={showHref(item)} className="truncate font-medium hover:text-accent">
          {item.title}
        </Link>
        <Link
          href={`/izle/${item.type}/${item.id}?s=${nextUp.season}&e=${nextUp.episode}`}
          className="text-sm text-accent hover:underline"
        >
          ▶ Sıradaki: S{nextUp.season} B{nextUp.episode}
        </Link>
        <p className="text-xs text-muted">{remaining} bölüm kaldı</p>
        <button
          type="button"
          onClick={() => setEpisodes(item, [epKey(nextUp.season, nextUp.episode)], true)}
          className="mt-auto self-start rounded-full border border-line px-3 py-1 text-xs hover:border-good hover:text-good"
        >
          ✓ İzledim
        </button>
      </div>
    </div>
  );
}

export function ContinueWatching() {
  const { rows, loading, empty } = useShowProgress(["watching"]);
  const visible = rows.filter((r) => r.nextUp);
  if (empty || (!loading && visible.length === 0)) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-3xl">Kaldığın yerden devam</h2>
        <Link href="/takvim" className="text-sm text-muted hover:text-accent">
          Takvim →
        </Link>
      </div>
      {loading && visible.length === 0 ? (
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 w-72 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      ) : (
        <div className="scroll-row -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {visible.map((r) => (
            <NextUpCard key={`${r.item.type}-${r.item.id}`} row={r} />
          ))}
        </div>
      )}
    </section>
  );
}
