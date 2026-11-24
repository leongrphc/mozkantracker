# mozkantracker

Dizi ve filmleri ara, Türkiye'de **hangi yasal platformda** izlenebildiğini gör, izlediklerini takip et.

## Özellikler

- **Arama:** dizi + film birlikte (TMDB multi search), sayfalı sonuçlar
- **Detay sayfası:** özet, tür, süre, puan, oyuncular, fragman (YouTube), öneriler, IMDb linki
- **Nerede izlenir:** Türkiye için abonelik / ücretsiz / kiralık / satın alma platformları (TMDB + JustWatch verisi)
- **Diziler:** sezon listesi, bölüm listesi, son ve sıradaki bölüm bilgisi
- **Takip (Listem):** İzleyeceğim / İzliyorum / Bitirdim, bölüm bölüm "izledim" işareti, ilerleme çubuğu
- **Yedekleme:** liste tarayıcıda saklanır, JSON olarak indirip geri yüklenebilir

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
TMDB yanıtları sunucuda `use cache` ile saatlik önbelleğe alınır. Anahtar sadece sunucuda kullanılır, tarayıcıya gitmez.

## Yayına alma (Vercel)

```bash
npm i -g vercel
vercel
vercel env add TMDB_READ_TOKEN
vercel --prod
```

---

Bu ürün TMDB API'sini kullanır ancak TMDB tarafından onaylanmamıştır. Platform verileri JustWatch kaynaklıdır.
