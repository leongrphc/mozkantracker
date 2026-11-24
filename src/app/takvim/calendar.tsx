"use client";

import Image from "next/image";
import Link from "next/link";
import { NextUpCard } from "@/components/continue-watching";
import { episodeHref, useShowProgress } from "@/lib/use-progress";

function dayLabel(date: string) {
  const d = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  const pretty = d.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  if (diff === 0) return `Bugün · ${pretty}`;
  if (diff === 1) return `Yarın · ${pretty}`;
  if (diff < 7) return pretty;
  return `${pretty} · ${diff} gün sonra`;
}

export function Calendar() {
  const { rows, loading, empty } = useShowProgress(["watching", "plan"]);

  if (empty) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center">
        <p className="text-lg">Takvim boş.</p>
        <p className="mt-1 text-sm text-muted">
          Dizileri &quot;İzliyorum&quot; ya da &quot;İzleyeceğim&quot; listene
          ekle, yeni bölümler burada görünsün.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-ink"
        >
          Dizi ara
        </Link>
      </div>
    );
  }

  if (loading && rows.length === 0) {
    return (
      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-2" />
        ))}
      </div>
    );
  }

  const nextUp = rows.filter((r) => r.item.status === "watching" && r.nextUp);
  const upcoming = rows
    .filter((r) => r.progress.next)
    .sort((a, b) => a.progress.next!.date.localeCompare(b.progress.next!.date));

  const groups = new Map<string, typeof upcoming>();
  for (const r of upcoming) {
    const d = r.progress.next!.date;
    groups.set(d, [...(groups.get(d) ?? []), r]);
  }

  return (
    <>
      <section className="mt-8">
        <h2 className="mb-3 font-display text-2xl">Sıradaki bölümlerin</h2>
        {nextUp.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {nextUp.map((r) => (
              <NextUpCard key={`${r.item.type}-${r.item.id}`} row={r} className="" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            İzlediğin dizilerde yayınlanmış ve izlenmemiş bölüm yok. Hepsine yetiştin.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-2xl">Yaklaşan bölümler</h2>
        {groups.size ? (
          <ol className="space-y-6">
            {[...groups.entries()].map(([date, list]) => (
              <li key={date}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
                  {dayLabel(date)}
                </p>
                <ul className="space-y-2">
                  {list.map(({ item, progress }) => {
                    const n = progress.next!;
                    return (
                      <li key={`${item.type}-${item.id}`}>
                        <Link
                          href={episodeHref(item, n.season, n.episode)}
                          className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 p-2 pr-4 hover:border-accent"
                        >
                          <div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded bg-surface-2">
                            {item.poster ? (
                              <Image
                                src={item.poster}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.title}</p>
                            <p className="truncate text-sm text-muted">
                              S{n.season} B{n.episode} · {n.name}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted">
            Listendeki diziler için duyurulmuş yeni bölüm yok.
          </p>
        )}
      </section>
    </>
  );
}
