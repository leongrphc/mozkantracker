export function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-accent/40 bg-surface p-6">
      <h2 className="font-display text-2xl">TMDB anahtarı gerekli</h2>
      <p className="mt-2 text-sm text-muted">
        Arama ve detaylar için ücretsiz bir TMDB API anahtarı lazım.
      </p>
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
          adresinde hesap aç.
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
    </div>
  );
}
