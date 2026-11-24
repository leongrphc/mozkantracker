"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PosterCard } from "@/components/poster-card";
import { TvProgress } from "@/components/tracker-controls";
import {
  STATUS_LABEL,
  exportData,
  importData,
  removeItem,
  setStatus,
  useTracker,
  type Status,
} from "@/lib/tracker";

const TABS: (Status | "all")[] = ["watching", "plan", "done", "all"];
const TAB_LABEL = { ...STATUS_LABEL, all: "Tümü" };

export function MyList() {
  const { list } = useTracker();
  const [tab, setTab] = useState<Status | "all">("watching");
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "tv">("all");
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const items = Object.values(list).sort((a, b) => b.updatedAt - a.updatedAt);
  const counts = {
    all: items.length,
    plan: items.filter((i) => i.status === "plan").length,
    watching: items.filter((i) => i.status === "watching").length,
    done: items.filter((i) => i.status === "done").length,
  };
  const shown = items.filter(
    (i) =>
      (tab === "all" || i.status === tab) &&
      (typeFilter === "all" || i.type === typeFilter),
  );

  function download() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mozkantracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function upload(file: File) {
    try {
      importData(await file.text());
      setMsg("Liste içe aktarıldı.");
    } catch {
      setMsg("Dosya okunamadı. Geçerli bir yedek dosyası seç.");
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={
              tab === t
                ? "rounded-full bg-fg px-4 py-1.5 text-sm font-medium text-bg"
                : "rounded-full border border-line px-4 py-1.5 text-sm text-muted hover:text-fg"
            }
          >
            {TAB_LABEL[t]}{" "}
            <span className="tabular-nums opacity-60">{counts[t]}</span>
          </button>
        ))}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          aria-label="Türe göre filtrele"
          className="ml-auto rounded-lg border border-line bg-surface px-3 py-1.5 text-sm"
        >
          <option value="all">Dizi + Film</option>
          <option value="tv">Sadece dizi</option>
          <option value="movie">Sadece film</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-lg">Burada henüz bir şey yok.</p>
          <p className="mt-1 text-sm text-muted">
            Bir dizi ya da film aç, &quot;İzleyeceğim&quot; veya
            &quot;İzliyorum&quot; butonuna bas.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-ink"
          >
            Keşfetmeye başla
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
          {shown.map((i) => (
            <li key={`${i.type}-${i.id}`} className="flex flex-col">
              <PosterCard item={i} />
              {i.type === "tv" && i.totalEpisodes ? (
                <TvProgress tvId={i.id} total={i.totalEpisodes} className="mt-2" />
              ) : null}
              <div className="mt-2 flex items-center gap-1">
                <select
                  value={i.status}
                  onChange={(e) => setStatus(i, e.target.value as Status)}
                  aria-label={`${i.title} durumu`}
                  className="min-w-0 flex-1 rounded-md border border-line bg-surface px-2 py-1 text-xs"
                >
                  {(["plan", "watching", "done"] as Status[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeItem(i.type, i.id)}
                  aria-label={`${i.title} listeden çıkar`}
                  title="Listeden çıkar"
                  className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:border-red-400 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-6 text-sm">
        <button
          type="button"
          onClick={download}
          className="rounded-lg border border-line px-4 py-2 hover:border-accent"
        >
          Yedeği indir (JSON)
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-line px-4 py-2 hover:border-accent"
        >
          Yedekten geri yükle
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        {msg ? <span className="text-muted">{msg}</span> : null}
      </div>
    </>
  );
}
