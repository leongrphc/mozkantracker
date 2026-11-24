function Steps() {
  return (
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
      <li>
        <a
          href="https://www.themoviedb.org/signup"
          className="text-accent underline"
          target="_blank"
          rel="noreferrer"
        >
          themoviedb.org
        </a>{" "}
        adresinde ücretsiz hesap aç.
      </li>
      <li>
        <a
          href="https://www.themoviedb.org/settings/api"
          className="text-accent underline"
          target="_blank"
          rel="noreferrer"
        >
          Ayarlar → API
        </a>{" "}
        sayfasından <b>API Read Access Token</b> değerini kopyala.
      </li>
      <li>
        Proje klasöründe <code className="rounded bg-surface-2 px-1">.env.local</code>{" "}
        dosyası oluştur:
        <pre className="mt-2 overflow-x-auto rounded-lg bg-bg p-3 text-xs">
          TMDB_READ_TOKEN=eyJhbGciOi...
        </pre>
      </li>
      <li>Sunucuyu yeniden başlat.</li>
    </ol>
  );
}

/** TMDB gerektiren sayfalar (film, platform bilgisi) için tam kart. */
export function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-accent/40 bg-surface p-6">
      <h2 className="font-display text-2xl">TMDB anahtarı gerekli</h2>
      <p className="mt-2 text-sm text-muted">
        Bu sayfa film ve platform bilgisi için ücretsiz bir TMDB API anahtarı
        istiyor. Diziler anahtarsız da çalışır (basit mod).
      </p>
      <Steps />
    </div>
  );
}

/** Anahtarsız (TVmaze) modda gösterilen küçük bilgi şeridi. */
export function LiteModeBanner() {
  return (
    <details className="group rounded-xl border border-line bg-surface/60 px-4 py-3 text-sm">
      <summary className="cursor-pointer list-none text-muted marker:hidden">
        <span className="mr-2 rounded bg-accent/15 px-1.5 py-0.5 text-xs font-semibold text-accent">
          Basit mod
        </span>
        Sadece diziler gösteriliyor. Filmler ve &quot;Türkiye&apos;de nerede
        izlenir&quot; için TMDB anahtarı ekle.{" "}
        <span className="text-fg underline group-open:hidden">Nasıl?</span>
      </summary>
      <Steps />
    </details>
  );
}
