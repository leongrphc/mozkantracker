export type PlayerKind = "movie" | "tv";

export interface EmbedOptions {
  tmdbId: number;
  type: PlayerKind;
  season?: number;
  episode?: number;
  color?: string;
}

export interface PlayerProvider {
  id: string;
  name: string;
  origin: string;
  /** iframe sandbox kullanılsın mı (reklam/yeni sekme engellemesi için). */
  sandbox?: boolean;
  /** postMessage olayları ve kaldığın yerden devam destekleniyor mu. */
  events?: boolean;
  /** Reklam/yeni sekme açabilen kaynak. */
  ads?: boolean;
  /** Otomatik yedekleme zincirine dahil mi. */
  auto?: boolean;
  embed: (opts: EmbedOptions) => string;
}

const cinesrc: PlayerProvider = {
  id: "cinesrc",
  name: "CineSrc",
  origin: "https://cinesrc.st",
  sandbox: true,
  events: true,
  auto: true,
  embed({ tmdbId, type, season, episode, color = "#f2b544" }) {
    const url = new URL(`/embed/${type}/${tmdbId}`, "https://cinesrc.st");
    if (type === "tv") {
      url.searchParams.set("s", String(season ?? 1));
      url.searchParams.set("e", String(episode ?? 1));
    }
    url.searchParams.set("autoplay", "false");
    url.searchParams.set("controls", "true");
    url.searchParams.set("back", "close");
    url.searchParams.set("autonext", "false");
    url.searchParams.set("seek", "10");
    url.searchParams.set("quality", "1080");
    url.searchParams.set("color", color);
    return url.toString();
  },
};

const vidsrcParty: PlayerProvider = {
  id: "vidsrc-party",
  name: "VidSrc",
  origin: "https://vidsrc.party",
  sandbox: true,
  auto: true,
  embed({ tmdbId, type, season, episode }) {
    return type === "movie"
      ? `https://vidsrc.party/embed/movie/${tmdbId}`
      : `https://vidsrc.party/embed/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`;
  },
};

const vidnest: PlayerProvider = {
  id: "vidnest",
  name: "VidNest",
  origin: "https://vidnest.pro",
  sandbox: true,
  auto: true,
  embed({ tmdbId, type, season, episode }) {
    return type === "movie"
      ? `https://vidnest.pro/movie/${tmdbId}`
      : `https://vidnest.pro/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`;
  },
};

const vidsrcPm: PlayerProvider = {
  id: "vidsrc-pm",
  name: "VidSrc PM",
  origin: "https://vidsrc.pm",
  sandbox: true,
  auto: true,
  embed({ tmdbId, type, season, episode }) {
    return type === "movie"
      ? `https://vidsrc.pm/embed/movie/${tmdbId}`
      : `https://vidsrc.pm/embed/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`;
  },
};

const embedwave: PlayerProvider = {
  id: "embedwave",
  name: "EmbedWave",
  origin: "https://embedwave.cc",
  sandbox: true,
  auto: true,
  embed({ tmdbId, type, season, episode }) {
    return type === "movie"
      ? `https://embedwave.cc/embed/movie/${tmdbId}`
      : `https://embedwave.cc/embed/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`;
  },
};

/* ---------- reklamlı kaynaklar (elle seçim için, sandbox kapalı) ---------- */

const vidsrcTo: PlayerProvider = {
  id: "vidsrc-to",
  name: "VidSrc.to",
  origin: "https://vidsrc.to",
  ads: true,
  embed({ tmdbId, type, season, episode }) {
    return type === "movie"
      ? `https://vidsrc.to/embed/movie/${tmdbId}`
      : `https://vidsrc.to/embed/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`;
  },
};

const vidlink: PlayerProvider = {
  id: "vidlink",
  name: "VidLink",
  origin: "https://vidlink.pro",
  ads: true,
  embed({ tmdbId, type, season, episode }) {
    return type === "movie"
      ? `https://vidlink.pro/movie/${tmdbId}`
      : `https://vidlink.pro/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`;
  },
};

const vidfast: PlayerProvider = {
  id: "vidfast",
  name: "VidFast",
  origin: "https://vidfast.pro",
  ads: true,
  embed({ tmdbId, type, season, episode }) {
    return type === "movie"
      ? `https://vidfast.pro/movie/${tmdbId}?autoPlay=false&theme=f2b544`
      : `https://vidfast.pro/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}?autoPlay=false&theme=f2b544`;
  },
};

const twoembed: PlayerProvider = {
  id: "2embed",
  name: "2Embed",
  origin: "https://2embed.cc",
  ads: true,
  embed({ tmdbId, type, season, episode }) {
    return type === "movie"
      ? `https://2embed.cc/embed/${tmdbId}`
      : `https://2embed.cc/embedtv/${tmdbId}&s=${season ?? 1}&e=${episode ?? 1}`;
  },
};

/**
 * Sıra, listedeki sıradır. İlk beş kaynak sandbox'lı iframe içinde oynamayı
 * kabul eder; sandbox `allow-popups` ve `allow-top-navigation` içermediği
 * için reklamlar yeni sekme açamaz. Sondaki reklamlı kaynaklar sandbox kabul
 * etmediğinden yalnızca elle seçilebilir.
 */
export const PLAYER_PROVIDERS: PlayerProvider[] = [
  cinesrc,
  vidsrcParty,
  vidnest,
  vidsrcPm,
  embedwave,
  vidsrcTo,
  vidlink,
  vidfast,
  twoembed,
];

export interface PlayerSource {
  id: string;
  name: string;
  origin: string;
  src: string;
  sandbox: boolean;
  events: boolean;
  ads: boolean;
  auto: boolean;
}

export function playerSources(opts: EmbedOptions): PlayerSource[] {
  return PLAYER_PROVIDERS.map((p) => ({
    id: p.id,
    name: p.name,
    origin: p.origin,
    src: p.embed(opts),
    sandbox: Boolean(p.sandbox),
    events: Boolean(p.events),
    ads: Boolean(p.ads),
    auto: p.auto ?? !p.ads,
  }));
}
