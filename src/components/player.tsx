"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  itemKey,
  setEpisodes,
  useTracker,
  type Card,
} from "@/lib/tracker";
import {
  readPlayback,
  resumeTime,
  savePlayback,
} from "@/lib/playback";
import type { PlayerSource } from "@/lib/player";

interface PlayerProps {
  sources: PlayerSource[];
  playbackId: string;
  title: string;
  subtitle?: string;
  overview?: string;
  backHref: string;
  poster: string | null;
  /** Sıradaki bölüm sayfası (film ise null). */
  nextHref: string | null;
  nextLabel: string | null;
  /** Bölüm oynatılıyorsa izlendi işaretleme bilgisi. */
  watch: { card: Card; epKey: string } | null;
  /** Dizi bölümleri için oynatıcı içi geçişlerde kullanılan taban yol. */
  episodeBase: string | null;
}

interface PlayerMessage {
  type?: string;
  currentTime?: number;
  duration?: number;
  season?: number;
  episode?: number;
  internalNavigation?: boolean;
  error?: unknown;
}

const AUTO_NEXT_SECONDS = 10;

export function Player({
  sources,
  playbackId,
  title,
  subtitle,
  overview,
  backHref,
  poster,
  nextHref,
  nextLabel,
  watch,
  episodeBase,
}: PlayerProps) {
  const router = useRouter();
  const frame = useRef<HTMLIFrameElement>(null);
  const playback = useRef({ currentTime: 0, duration: 0, lastSavedAt: 0 });
  const restored = useRef(false);
  const resumeTarget = useRef(0);

  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [finished, setFinished] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_NEXT_SECONDS);
  const [autoNextCanceled, setAutoNextCanceled] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const source = sources[active] ?? sources[0];

  const { watched } = useTracker();
  const marked = watch
    ? (watched[itemKey(watch.card.type, watch.card.id)] ?? []).includes(
        watch.epKey,
      )
    : false;

  const markWatched = useCallback(() => {
    if (watch) setEpisodes(watch.card, [watch.epKey], true);
  }, [watch]);

  const sendCommand = useCallback(
    (command: string, args: unknown[] = []) => {
      frame.current?.contentWindow?.postMessage(
        { type: "cinesrc:command", command, args },
        source.origin,
      );
    },
    [source.origin],
  );

  const persistProgress = useCallback(
    (completed = false) => {
      const { currentTime, duration } = playback.current;
      if (currentTime <= 0 || duration <= 0) return;
      savePlayback(playbackId, currentTime, duration, completed);
    },
    [playbackId],
  );

  const resetPlayback = () => {
    restored.current = false;
    resumeTarget.current = 0;
    playback.current = { currentTime: 0, duration: 0, lastSavedAt: 0 };
  };

  const switchTo = useCallback(
    (index: number, note?: string) => {
      if (index < 0 || index >= sources.length) return;
      persistProgress();
      resetPlayback();
      setActive(index);
      setReady(false);
      setFailed(false);
      setFinished(false);
      setAutoNextCanceled(false);
      const target = sources[index];
      setNotice(
        note ??
          (target.ads
            ? `${target.name} reklam açabilir; açılan sekmeleri kapatman önerilir.`
            : null),
      );
    },
    [persistProgress, sources],
  );

  const tryNextSource = useCallback(() => {
    const next = sources.findIndex((s, i) => i > active && s.auto);
    if (next !== -1) {
      switchTo(
        next,
        `${source.name} bu içeriği açamadı, ${sources[next].name} deneniyor…`,
      );
    } else {
      setReady(false);
      setFailed(true);
      setNotice(null);
    }
  }, [active, source.name, sources, switchTo]);

  const restoreSavedPosition = useCallback(() => {
    if (!source.events || restored.current) return;
    const target = resumeTime(readPlayback(playbackId));
    if (target <= 0) {
      restored.current = true;
      resumeTarget.current = 0;
      return;
    }
    resumeTarget.current = target;
    sendCommand("seek", [target]);
  }, [playbackId, sendCommand, source.events]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!source.events) return;
      if (event.origin !== source.origin) return;
      if (event.source !== frame.current?.contentWindow) return;
      if (!event.data || typeof event.data !== "object") return;

      const data = event.data as PlayerMessage;
      switch (data.type) {
        case "cinesrc:ready":
          setReady(true);
          setFailed(false);
          setNotice(null);
          restoreSavedPosition();
          break;
        case "cinesrc:loadedmetadata":
          if (typeof data.duration === "number")
            playback.current.duration = data.duration;
          restoreSavedPosition();
          break;
        case "cinesrc:timeupdate": {
          if (typeof data.currentTime === "number")
            playback.current.currentTime = data.currentTime;
          if (typeof data.duration === "number")
            playback.current.duration = data.duration;
          const { currentTime, duration, lastSavedAt } = playback.current;
          if (
            !restored.current &&
            resumeTarget.current > 0 &&
            Math.abs(currentTime - resumeTarget.current) <= 5
          ) {
            restored.current = true;
            resumeTarget.current = 0;
            playback.current.lastSavedAt = currentTime;
          }
          if (
            restored.current &&
            duration > 0 &&
            currentTime > 0 &&
            Math.abs(currentTime - lastSavedAt) >= 5
          ) {
            playback.current.lastSavedAt = currentTime;
            savePlayback(playbackId, currentTime, duration);
          }
          break;
        }
        case "cinesrc:seeked":
          if (typeof data.currentTime === "number")
            playback.current.currentTime = data.currentTime;
          if (typeof data.duration === "number")
            playback.current.duration = data.duration;
          if (
            typeof data.currentTime === "number" &&
            resumeTarget.current > 0 &&
            Math.abs(data.currentTime - resumeTarget.current) <= 5
          ) {
            restored.current = true;
            resumeTarget.current = 0;
            playback.current.lastSavedAt = data.currentTime;
          }
          break;
        case "cinesrc:pause":
          persistProgress();
          break;
        case "cinesrc:ended":
          persistProgress(true);
          markWatched();
          setFinished(true);
          setCountdown(AUTO_NEXT_SECONDS);
          setAutoNextCanceled(false);
          break;
        case "cinesrc:nextepisode":
          persistProgress(true);
          markWatched();
          if (
            episodeBase &&
            typeof data.season === "number" &&
            typeof data.episode === "number"
          ) {
            router.push(`${episodeBase}?s=${data.season}&e=${data.episode}`);
          } else if (nextHref) {
            router.push(nextHref);
          }
          break;
        case "cinesrc:error":
          tryNextSource();
          break;
        case "cinesrc:close":
          persistProgress();
          router.back();
          break;
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [
    episodeBase,
    markWatched,
    nextHref,
    persistProgress,
    playbackId,
    restoreSavedPosition,
    router,
    source.events,
    source.origin,
    tryNextSource,
  ]);

  useEffect(() => {
    const flush = () => persistProgress();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persistProgress();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [persistProgress]);

  useEffect(() => {
    if (!finished || !nextHref || autoNextCanceled) return;
    const timer = window.setInterval(
      () => setCountdown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [autoNextCanceled, finished, nextHref]);

  useEffect(() => {
    if (finished && nextHref && !autoNextCanceled && countdown === 0)
      router.push(nextHref);
  }, [autoNextCanceled, countdown, finished, nextHref, router]);

  const retryPlayer = () => {
    resetPlayback();
    setReady(false);
    setFailed(false);
    setFinished(false);
    setNotice(null);
    setRetry((value) => value + 1);
  };

  const safeSources = sources
    .map((s, i) => ({ s, i }))
    .filter((x) => !x.s.ads);
  const adSources = sources
    .map((s, i) => ({ s, i }))
    .filter((x) => x.s.ads);

  const sourceButton = (s: PlayerSource, i: number) => (
    <button
      key={s.id}
      type="button"
      onClick={() => switchTo(i)}
      aria-pressed={i === active}
      title={s.ads ? "Reklam açabilir; sandbox kapalı" : undefined}
      className={
        i === active
          ? "rounded-full bg-accent px-3 py-1.5 font-medium text-accent-ink"
          : "rounded-full border border-line bg-surface px-3 py-1.5 text-muted hover:border-accent hover:text-fg"
      }
    >
      {s.ads ? "⚠ " : ""}
      {s.name}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Link href={backHref} className="text-sm text-muted hover:text-accent">
        ← Geri
      </Link>

      <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black">
        <iframe
          key={`${source.id}-${retry}`}
          ref={frame}
          src={source.src}
          title={`${title} video oynatıcısı`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          sandbox={
            source.sandbox
              ? "allow-scripts allow-same-origin allow-forms allow-presentation"
              : undefined
          }
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => {
            setReady(true);
            setFailed(false);
            if (source.events) {
              setNotice(null);
              window.setTimeout(restoreSavedPosition, 600);
              window.setTimeout(restoreSavedPosition, 1600);
            }
          }}
        />

        {!ready && !failed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/80 text-sm text-muted">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
            {source.name} yükleniyor…
          </div>
        ) : null}

        {failed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/90 px-6 text-center">
            <h2 className="font-display text-2xl">İçerik açılamadı</h2>
            <p className="max-w-md text-sm text-muted">
              Tüm kaynaklar denendi. Kaynaklardan birini seçerek yeniden
              deneyebilirsin.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {safeSources.map(({ s, i }) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => switchTo(i)}
                  className="rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-accent"
                >
                  {s.name}
                </button>
              ))}
              {adSources.map(({ s, i }) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => switchTo(i)}
                  title="Reklam açabilir"
                  className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-muted hover:border-accent hover:text-fg"
                >
                  ⚠ {s.name}
                </button>
              ))}
            </div>
            {adSources.length ? (
              <p className="max-w-sm text-xs text-muted">
                ⚠ işaretli kaynaklar sandbox kapalı olduğu için yeni sekme/reklam
                açabilir.
              </p>
            ) : null}
            <button
              type="button"
              onClick={retryPlayer}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink hover:brightness-110"
            >
              Yeniden dene
            </button>
          </div>
        ) : null}

        {finished && !failed ? (
          <aside className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/90 px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {nextHref ? "Sıradaki bölüm" : "Tamamlandı"}
            </p>
            {nextHref ? (
              <>
                <strong className="font-display text-2xl">{nextLabel}</strong>
                <p className="text-sm text-muted">
                  {autoNextCanceled
                    ? "Otomatik geçiş iptal edildi."
                    : `${countdown} saniye sonra otomatik başlayacak.`}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Link
                    href={nextHref}
                    className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink hover:brightness-110"
                  >
                    ▶ Şimdi oynat
                  </Link>
                  <button
                    type="button"
                    onClick={() => setAutoNextCanceled(true)}
                    className="rounded-full border border-line px-5 py-2 text-sm hover:border-accent"
                  >
                    İptal
                  </button>
                </div>
              </>
            ) : (
              <>
                <strong className="font-display text-2xl">
                  İzleme tamamlandı
                </strong>
                <Link
                  href={backHref}
                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink hover:brightness-110"
                >
                  Detaylara dön
                </Link>
              </>
            )}
          </aside>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">Kaynak:</span>
        {safeSources.map(({ s, i }) => sourceButton(s, i))}
        {adSources.length ? (
          <span className="ml-1 text-muted">· Reklamlı:</span>
        ) : null}
        {adSources.map(({ s, i }) => sourceButton(s, i))}
      </div>

      {notice ? <p className="mt-2 text-xs text-accent">{notice}</p> : null}

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          {poster ? (
            <div className="relative hidden aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2 sm:block">
              <Image src={poster} alt="" fill sizes="64px" className="object-cover" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">
              {title}
            </h1>
            {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
            {overview ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg/85">
                {overview}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted">
              Oynatıcı: {source.name} · Video harici kaynaktan gömülü olarak
              oynatılır.
              {source.ads
                ? " Bu kaynak reklam açabilir; açılan sekmeleri kapatman önerilir."
                : ""}
              {!source.events
                ? " Otomatik ilerleme takibi yok; izlediğini elle işaretleyebilirsin."
                : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {watch ? (
            <button
              type="button"
              onClick={() => setEpisodes(watch.card, [watch.epKey], !marked)}
              aria-pressed={marked}
              className={
                marked
                  ? "rounded-full bg-good px-4 py-2 text-sm font-medium text-bg"
                  : "rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-good hover:text-good"
              }
            >
              ✓ {marked ? "İzlendi" : "İzlendi işaretle"}
            </button>
          ) : null}
          {nextHref ? (
            <Link
              href={nextHref}
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-accent"
            >
              {nextLabel} →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
