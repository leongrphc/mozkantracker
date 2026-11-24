"use client";

import Form from "next/form";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { PosterCardData } from "@/components/poster-card";

export function SearchBox({
  defaultValue,
  compact = false,
  autoFocus = false,
}: {
  defaultValue?: string;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const [q, setQ] = useState(defaultValue ?? "");
  const [items, setItems] = useState<PosterCardData[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: PosterCardData[]) => {
          setItems(data);
          setActive(-1);
        })
        .catch(() => {});
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const shown = open && q.trim().length >= 2 ? items : [];

  function go(item: PosterCardData) {
    setOpen(false);
    router.push(`/${item.type}/${item.id}`);
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <Form
        action="/search"
        className="relative w-full"
        role="search"
        onSubmit={(e) => {
          if (active >= 0 && shown[active]) {
            e.preventDefault();
            go(shown[active]);
          } else {
            setOpen(false);
          }
        }}
      >
        <label htmlFor={`${id}-q`} className="sr-only">
          Dizi veya film ara
        </label>
        <input
          id={`${id}-q`}
          name="q"
          type="search"
          required
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, shown.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          autoFocus={autoFocus}
          autoComplete="off"
          role="combobox"
          aria-expanded={shown.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          placeholder="Dizi veya film adı yaz…"
          className={
            compact
              ? "w-full rounded-lg border border-line bg-surface py-2 pl-3 pr-20 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
              : "w-full rounded-2xl border border-line bg-surface py-4 pl-5 pr-28 text-lg placeholder:text-muted focus:border-accent focus:outline-none"
          }
        />
        <button
          type="submit"
          className={
            compact
              ? "absolute right-1 top-1 bottom-1 rounded-md bg-accent px-3 text-sm font-medium text-accent-ink hover:brightness-110"
              : "absolute right-2 top-2 bottom-2 rounded-xl bg-accent px-5 font-medium text-accent-ink hover:brightness-110"
          }
        >
          Ara
        </button>
      </Form>

      {shown.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-line bg-surface text-left shadow-2xl"
        >
          {shown.map((item, i) => (
            <li
              key={`${item.type}-${item.id}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                go(item);
              }}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
                i === active ? "bg-surface-2" : ""
              }`}
            >
              <div className="relative aspect-[2/3] w-8 shrink-0 overflow-hidden rounded bg-surface-2">
                {item.poster ? (
                  <Image src={item.poster} alt="" fill sizes="32px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted">
                  {item.type === "movie" ? "Film" : "Dizi"}
                  {item.year ? ` · ${item.year}` : ""}
                </p>
              </div>
              {item.rating ? (
                <span className="text-xs tabular-nums text-accent">
                  ★ {item.rating.toFixed(1)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
