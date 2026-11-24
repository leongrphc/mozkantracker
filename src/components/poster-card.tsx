import Image from "next/image";
import Link from "next/link";

export interface PosterCardData {
  id: number;
  type: "movie" | "tv";
  title: string;
  year?: string;
  poster: string | null;
  rating?: number;
}

export function PosterCard({ item }: { item: PosterCardData }) {
  return (
    <Link
      href={`/${item.type}/${item.id}`}
      className="group block rounded-xl focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-line bg-surface-2">
        {item.poster ? (
          <Image
            src={item.poster}
            alt=""
            fill
            sizes="(min-width: 1024px) 180px, (min-width: 640px) 25vw, 45vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center font-display text-xl text-muted">
            {item.title}
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-bg/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fg backdrop-blur">
          {item.type === "tv" ? "Dizi" : "Film"}
        </span>
        {item.rating ? (
          <span className="absolute right-2 top-2 rounded bg-bg/80 px-1.5 py-0.5 text-xs font-medium tabular-nums text-accent backdrop-blur">
            ★ {item.rating.toFixed(1)}
          </span>
        ) : null}
      </div>
      <div className="mt-2 px-0.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-accent">
          {item.title}
        </p>
        {item.year ? <p className="text-xs text-muted">{item.year}</p> : null}
      </div>
    </Link>
  );
}

export function PosterGrid({ items }: { items: PosterCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
      {items.map((i) => (
        <PosterCard key={`${i.type}-${i.id}`} item={i} />
      ))}
    </div>
  );
}

export function PosterGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] animate-pulse rounded-xl bg-surface-2" />
          <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
