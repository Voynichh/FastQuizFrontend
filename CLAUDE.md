# Fast Quiz — Frontend

Proje dokümanı: `docs/PROJECT.md` (Bölüm 8–9: ekranlar, bileşenler, tema). Backend ayrı repoda: `..\FastQuizBackend` (API sözleşmesi orada; `CLAUDE.md` → "API notları").

## Kalıcı kurallar
- Tüm iş mantığı backend'de: süre, puan, doğru cevap sunucudan gelir. İstemci sayacı yalnızca görseldir; puan hesaplanmaz.
- API'ye yalnızca `src/api/` üzerinden erişilir (tek axios istemcisi). Tipler `src/types/api.d.ts` içinde **üretilir**, elle düzenlenmez: backend'de `manage.py spectacular --file ..\FastQuizFrontend\openapi\schema.yml`, sonra `npm run gen:api`.
- `v-html` yasak (ESLint kuralı); kullanıcı metni her zaman metin olarak basılır.
- Renkler yalnızca `src/styles/main.css` içindeki `@theme` tokenlarından gelir; bileşenlerde hex yok. Kategori rengi API'den token adı (`cat-ai`) olarak gelir ve `var(--color-…)` ile okunur (bu yüzden `@theme static`).
- Doğru/yanlış yalnızca renkle değil ikonla (✓/✕) da gösterilir; dokunma alanı ≥ 44px, odak halkası görünür, `prefers-reduced-motion` desteklenir.
- Depolama yalnızca `src/lib/storage.ts` üzerinden (web: sessionStorage, mobilde Preferences). Platform farkı `src/lib/platform.ts`.
- Arayüz metinleri Türkçe, kod/identifier İngilizce.

## Komutlar
```
npm run dev           # http://localhost:5173 (backend: ..\FastQuizBackend, runserver :8000)
npm run test          # vitest
npm run lint && npm run type-check && npm run format:check
npm run build
```
`.env.example` → `.env` (`VITE_API_BASE_URL`).

## Sürüm notları
- TypeScript **6.0.3**: `vue-tsc` henüz TS 7'yi desteklemiyor, `openapi-typescript` peer'ı `overrides` ile TS 6'ya bağlı. TS 7 + Vue desteği gelince ayrı PR'da geçilir.
- Dokümandakinden bilinçli sapmalar (kullanıcı "en güncel sürümler" istedi): Pinia 4.x (doc: 3.x), Vitest 5.x (doc: 4). Vite 8.3, Vue 3.5.44, Vue Router 5.4, Tailwind 4.3.3, Node ≥ 24.
- `eslint` yapılandırması `@vue/eslint-config-typescript` olmadan doğrudan `typescript-eslint` + `eslint-plugin-vue` ile (npm audit temiz kalsın diye).

## Durum
Faz 4 tamam: iskelet, tema, API istemcisi + üretilmiş tipler, router, Pinia `quiz` store (oturum açma + yenilemeye dayanıklılık), Ana sayfa ve Kategori ekranı. `quiz`, `sonuc`, `skor-tablosu` yolları `PlaceholderView` gösterir.
Sıradaki: Faz 5 (geri sayım, soru ekranı, `TimerRing`, `useCountdown`, cevap geri bildirimi, `loadCurrent`/`submitAnswer`).
