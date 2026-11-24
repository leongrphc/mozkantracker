# mozkantracker

**🔗 Canlı / Live: [mozkantracker.vercel.app](https://mozkantracker.vercel.app)**

[Türkçe](#-türkçe) · [English](#-english)

---

## 🇹🇷 Türkçe

Dizi ve filmleri ara, Türkiye'de **hangi platformda** izlenebildiğini gör, izlediklerini bölüm bölüm takip et. Hesap gerekmez; tüm veriler tarayıcında saklanır.

### Özellikler

- **Arama + canlı öneriler** — yazarken afişli öneri listesi, klavyeyle gezinme
- **Detay sayfası** — özet, tür, süre, puan, oyuncular, fragman (YouTube), benzer yapımlar, IMDb linki
- **Nerede izlenir** — Türkiye için abonelik / ücretsiz / kiralık / satın alma platformları (TMDB + JustWatch verisi)
- **Keşfet** — platforma (Netflix, Prime Video, Disney+, BluTV…) ve türe göre filtrele; popüler / en iyi / en yeni sıralama
- **Diziler** — sezon ve bölüm listesi, son yayınlanan ve sıradaki bölüm
- **Gömülü oynatıcı** (`/izle`) — birden fazla üçüncü taraf kaynak, çalışmayan kaynakta otomatik yedeğe geçiş, kaldığın saniyeden devam, bölüm bitince otomatik "izledim"
- **Listem** — İzleyeceğim / İzliyorum / Bitirdim durumları, bölüm bölüm işaretleme, ilerleme çubuğu, izleme istatistikleri
- **Kaldığın yerden devam** — ana sayfada her dizinin izlenmemiş ilk bölümü, tek tıkla işaretle
- **Takvim** — takip ettiğin dizilerin yaklaşan bölümleri, tarihe göre
- **Yedekleme** — listeni JSON olarak indir, başka cihazda geri yükle
- **PWA** — telefonun ana ekranına uygulama gibi eklenebilir

### Basit mod (anahtarsız)

TMDB anahtarı yoksa site **TVmaze** ile çalışır: dizi arama, detay, sezon/bölüm, takip ve takvim aktif kalır. Filmler, "nerede izlenir" ve Keşfet için TMDB anahtarı gerekir.

### Kurulum

1. [themoviedb.org](https://www.themoviedb.org) üzerinde ücretsiz hesap aç.
2. [API ayarları](https://www.themoviedb.org/settings/api) sayfasından **API Read Access Token** al.
3. Proje kökünde `.env.local` oluştur (`.env.example` örnek alınabilir):

   ```env
   TMDB_READ_TOKEN=eyJhbGciOi...
   # veya v3 anahtarı:
   # TMDB_API_KEY=...
   ```

4. Çalıştır:

   ```bash
   npm install
   npm run dev
   ```

   → http://localhost:3000

### Yayına alma (Vercel)

```bash
npm i -g vercel
vercel
vercel env add TMDB_READ_TOKEN
vercel --prod
```

---

## 🇬🇧 English

Search TV shows and movies, see **which streaming platforms** carry them in Turkey, and track what you watch episode by episode. No account needed — everything is stored in your browser.

### Features

- **Search with live suggestions** — poster previews as you type, keyboard navigation
- **Detail pages** — overview, genres, runtime, rating, cast, YouTube trailer, recommendations, IMDb link
- **Where to watch** — subscription / free / rent / buy providers for Turkey (TMDB + JustWatch data)
- **Discover** — filter by platform (Netflix, Prime Video, Disney+, BluTV…) and genre; sort by popular / top rated / newest
- **TV shows** — season and episode lists, last aired and next upcoming episode
- **Embedded player** (`/izle`) — multiple third-party sources, automatic fallback when a source fails, resume from the exact second, auto-mark as watched when an episode ends
- **My List (Listem)** — Plan to watch / Watching / Completed, per-episode tracking, progress bars, watch stats
- **Continue watching** — first unwatched episode of every show on the home page, one-click mark
- **Calendar (Takvim)** — upcoming episodes of the shows you follow, grouped by date
- **Backup** — export your list as JSON and import it on another device
- **PWA** — installable to your phone's home screen

### Keyless mode

Without a TMDB key the app falls back to **TVmaze**: show search, details, seasons/episodes, tracking and calendar keep working. Movies, "where to watch" and Discover require a TMDB key.

### Getting started

1. Create a free account at [themoviedb.org](https://www.themoviedb.org).
2. Grab your **API Read Access Token** from the [API settings](https://www.themoviedb.org/settings/api).
3. Create `.env.local` in the project root (see `.env.example`):

   ```env
   TMDB_READ_TOKEN=eyJhbGciOi...
   # or a v3 key:
   # TMDB_API_KEY=...
   ```

4. Run:

   ```bash
   npm install
   npm run dev
   ```

   → http://localhost:3000

### Deploy (Vercel)

```bash
npm i -g vercel
vercel
vercel env add TMDB_READ_TOKEN
vercel --prod
```

---

## Teknoloji / Tech stack

- **Next.js 16** (App Router, Cache Components) · **React 19** · **TypeScript**
- **Tailwind CSS 4**
- TMDB / TVmaze responses are cached server-side hourly with `use cache`; the API key stays on the server and never reaches the browser. / TMDB/TVmaze yanıtları sunucuda `use cache` ile saatlik önbelleğe alınır; anahtar tarayıcıya gitmez.

## Yasal not / Disclaimer

Bu ürün TMDB API'sini kullanır ancak TMDB tarafından onaylanmamıştır. Platform verileri JustWatch kaynaklıdır. Oynatıcıdaki içerikler üçüncü taraf sitelerden gömülür; bu proje herhangi bir video barındırmaz.

This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability data is provided by JustWatch. Player content is embedded from third-party sites; this project does not host any video.
