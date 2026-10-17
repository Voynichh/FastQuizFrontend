# Fast Quiz — Frontend

Proje dokümanı: `docs/PROJECT.md` (Bölüm 8–9: ekranlar, bileşenler, tema). Backend ayrı repoda: `..\FastQuizBackend` (API sözleşmesi orada; `CLAUDE.md` → "API notları").

## Kalıcı kurallar
- Tüm iş mantığı backend'de: süre, puan, doğru cevap sunucudan gelir. İstemci sayacı yalnızca görseldir; puan hesaplanmaz.
- API'ye yalnızca `src/api/` üzerinden erişilir (tek axios istemcisi). Tipler `src/types/api.d.ts` içinde **üretilir**, elle düzenlenmez: backend'de `manage.py spectacular --file ..\FastQuizFrontend\openapi\schema.yml`, sonra `npm run gen:api`.
- `v-html` yasak (ESLint kuralı); kullanıcı metni her zaman metin olarak basılır.
- Renkler yalnızca `src/styles/main.css` içindeki `@theme` tokenlarından gelir; bileşenlerde hex yok. Kategori rengi API'den token adı (`cat-ai`) olarak gelir ve `var(--color-…)` ile okunur (bu yüzden `@theme static`).
- Doğru/yanlış yalnızca renkle değil ikonla (✓/✕) da gösterilir; dokunma alanı ≥ 44px, odak halkası görünür, `prefers-reduced-motion` desteklenir.
- Depolama yalnızca `src/lib/storage.ts` üzerinden (şimdilik sessionStorage). `X-Client` değeri `src/lib/platform.ts` içinde.
- Arayüz metinleri Türkçe, kod/identifier İngilizce.

## Komutlar
```
npm run dev           # http://localhost:5173 (PowerShell'de `npm.cmd run dev`) (backend: ..\FastQuizBackend, runserver :8000)
npm run test          # vitest
npm run lint && npm run type-check && npm run format:check
npm run build
```
`.env.example` → `.env` (`VITE_API_BASE_URL`).

## Sürüm notları
- TypeScript **6.0.3**: `vue-tsc` henüz TS 7'yi desteklemiyor, `openapi-typescript` peer'ı `overrides` ile TS 6'ya bağlı. TS 7 + Vue desteği gelince ayrı PR'da geçilir.
- Dokümandakinden bilinçli sapmalar (kullanıcı "en güncel sürümler" istedi): Pinia 4.x (doc: 3.x), Vitest 5.x (doc: 4). Vite 8.3, Vue 3.5.44, Vue Router 5.4, Tailwind 4.3.3, Node ≥ 24.
- `eslint` yapılandırması `@vue/eslint-config-typescript` olmadan doğrudan `typescript-eslint` + `eslint-plugin-vue` ile (npm audit temiz kalsın diye).

## Quiz akışı (Faz 5)
- `QuizView` → `useQuizSession` (durum makinesi: loading → countdown → question → feedback → error) → Pinia `quiz` store → `src/api/endpoints.ts`.
- Geri sayım (3-2-1) yalnızca yeni açılan oturumda gösterilir (`needsCountdown`); sunucuda süre ilk `GET /current/` ile başlar, bu yüzden bu istek geri sayımdan SONRA atılır. Yenilemede geri sayım yok, `loadCurrent` aynı `deadline`'ı döner.
- `useCountdown`: `deadline − server_time` farkıyla yerel bitişi hesaplar (cihaz saatinden bağımsız), `performance.now()` + rAF kullanır; süre dolunca `choice_id: null` gönderilir.
- Cevap gönderilince şıklar kilitlenir (`busy`), ~800 ms (`FEEDBACK_MS`) doğru/yanlış gösterilir, sonra sıradaki soru istenir. `already_answered`/`question_mismatch` gelirse sunucudaki duruma göre yeniden senkronize olunur; ağ hatasında "Tekrar dene" aynı cevabı yeniden gönderir; `invalid_session_token`/`not_found`/`session_abandoned` kurtarılamaz sayılır (oturum silinip ana sayfaya dönülür).
- Klavye: 1–4 veya A–D. Çıkış: ✕ veya tarayıcı geri tuşu → "Quizden çıkılsın mı?" onayı (`onBeforeRouteLeave`; bu koruma yalnızca `RouterView` içinde çalışır).
- Store sonuç şeridini (`results`) ve skoru depolamaya yazar; aktif soru yenilemede sunucudan alınır.

## Sonuç ve skor tablosu (Faz 6)
- `ResultView`: `quiz.loadResult()` ile özet (puan `ScoreCounter` ile sayarak artar, doğru/yanlış/boş, ortalama süre, tahmini sıra). İsim `NameForm` ile anlık doğrulanır (`lib/playerName.ts`, sunucuyla aynı karakter kuralı; küfür denetimi yalnızca sunucuda, hata alanın altında gösterilir). Kayıt başarılıysa ilk 10'da `ConfettiBurst` (hareketi azalt tercihinde çizilmez).
- Kaydedilen skor store'da `saved` olarak tutulup depolamaya yazılır; skor tablosunda satırı vurgulamak için kullanılır (kategori sekmesinde isim+puan+sıra, genel sekmede isim+puan eşleşmesi).
- `LeaderboardView`: Genel + kategori sekmeleri (`?kategori=slug`, URL'de tutulur), yarış durumuna karşı istek sayacı, boş/hata/yükleniyor durumları. İlk üç sıra madalya rozetli (`--color-medal-*`).
- `Tekrar oyna` / `Kaydetmeden çık` oturumu siler (`quiz.reset()`).

## Kapsam
Yerelde çalışan portföy projesi; **canlıya alma iptal edildi** (bkz. `..\CLAUDE.md`). README'deki ekran görüntüleri `docs/screenshots/` altında (mobil görünüm 375×812).

## Durum
Faz 4–6 tamam: kategori → quiz → sonuç → isim → skor tablosu uçtan uca çalışıyor (128 test). **Mobil uygulama iptal edildi (kullanıcı kararı); proje web olarak tamamlandı.** İsteğe bağlı kalanlar: Playwright E2E, erişilebilirlik denetimi, ses efektleri (varsayılan kapalı).
