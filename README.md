# mozkantracker

Dizi ve filmleri ara, Türkiye'de **hangi yasal platformda** izlenebildiğini gör, izlediklerini takip et.

## Özellikler

- **Arama + canlı öneriler:** yazarken afişli öneri listesi, klavyeyle seçim
- **Detay sayfası:** özet, tür, süre, puan, oyuncular, fragman (YouTube), öneriler, IMDb linki
- **Nerede izlenir:** Türkiye için abonelik / ücretsiz / kiralık / satın alma platformları (TMDB + JustWatch verisi)
- **Keşfet:** platforma (Netflix, Prime, Disney+, BluTV…) ve türe göre filtrele; popüler / en iyi / en yeni
- **Diziler:** sezon ve bölüm listesi, son ve sıradaki bölüm
- **Takip (Listem):** İzleyeceğim / İzliyorum / Bitirdim, bölüm bölüm "izledim", ilerleme çubuğu, istatistikler
- **Kaldığın yerden devam:** ana sayfada her dizinin izlenmemiş ilk bölümü, tek tıkla "izledim"
- **Takvim:** takip ettiğin dizilerin yaklaşan bölümleri, tarihe göre
- **Yedekleme:** liste tarayıcıda saklanır, JSON olarak indirip geri yüklenebilir
- **Telefona eklenebilir (PWA)**

## Basit mod (anahtarsız)

TMDB anahtarı yoksa site **TVmaze** ile çalışır: dizi arama, detay, sezon/bölüm, takip, takvim çalışır.
Filmler, "Türkiye'de nerede izlenir" ve Keşfet için TMDB anahtarı gerekir.

## Kurulum

1. https://www.themoviedb.org adresinde ücretsiz hesap aç.
2. https://www.themoviedb.org/settings/api sayfasından **API Read Access Token** değerini al.
3. Proje kökünde `.env.local` oluştur:

   ```
   TMDB_READ_TOKEN=eyJhbGciOi...
   ```

   (Alternatif: `TMDB_API_KEY=` ile v3 anahtarı.)
4. Çalıştır:

   ```bash
   npm install
   npm run dev
   ```

   http://localhost:3000

## Teknoloji

Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, TypeScript.
TMDB/TVmaze yanıtları sunucuda `use cache` ile saatlik önbelleğe alınır. Anahtar sadece sunucuda kullanılır, tarayıcıya gitmez.

## Yayına alma (Vercel)

```bash
npm i -g vercel
vercel
vercel env add TMDB_READ_TOKEN
vercel --prod
```

---

Bu ürün TMDB API'sini kullanır ancak TMDB tarafından onaylanmamıştır. Platform verileri JustWatch kaynaklıdır.
