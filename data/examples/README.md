# Örnek yanıtlar

Her uç nokta için bir örnek yanıt. Arayüz, sunucu hazır olmadan bu dosyalarla çalışır ([PLAN.md](../../docs/PLAN.md), bölüm 3.1, kural 5). Sunucu testleri de yanıtlarının alan adlarını bu dosyalarla karşılaştırır.

- **Biçim:** [ADR-0003](../../docs/adr/0003-veri-sozlesmesi.md) ve [ADR-0004](../../docs/adr/0004-api-uc-noktalari.md).
- **Tipler:** [frontend/src/api/types.ts](../../frontend/src/api/types.ts).
- **Tip denetimi:** [frontend/src/api/examples.ts](../../frontend/src/api/examples.ts) her dosyayı kendi tipine atar. Eksik ya da fazla alan, yanlış tip derlemede hata verir. Kapalı değer kümeleri (`validity`, `category` gibi), sonu `Z` ile biten UTC biçimi ve alan adları `findExampleProblems()` ile denetlenir.
- **Sahiplik:** Bu klasördeki dosyalar D hattınındır. Tek istisna `test_vectors.json` ve `projection_vectors.json`; onlar B hattının ([PLAN.md](../../docs/PLAN.md), bölüm 3.2).

## Sayılar nereden geliyor

Örneklerdeki her sayı üç gruptan birine girer:

1. **Doğrulanmış değer:** [Referans testlerden](../../docs/PLAN.md#42-referans-testler) ya da [dogrulama/](../../docs/research/dogrulama/) tablolarında "doğrulandı" etiketli bir satırdan.
2. **Doğrulanmış değerden basit hesap:** İki anın farkı, oranın tümleyeni ya da birim çevirme gibi. Hangi hesap olduğu aşağıda yazılı.
3. **Yer tutucu:** Doğrulanmış değeri olmayan alanlar. Mümkün olan her yerde `null` yazıldı; `null` olamayanlar aşağıdaki tabloda tek tek listelendi.

Bütün açılar yüksekliği sıfır olan küreye göre ve arazisiz hesaplanmıştır. Bu yüzden ufuk kullanan her örnek `validity: "SYNTHETIC"` taşır.

| Dosya | Uç nokta | Koşul | Doğrulanmış değerler | Basit hesaplar |
| --- | --- | --- | --- | --- |
| `health.json` | `GET /api/health` | – | – | – |
| `sites.json` | `GET /api/sites` | On saha | [`data/sites.json`](../sites.json) ile birebir aynı: koordinat, kaynak, not ve iniş anları ([saha kataloğu](../../docs/design/saha-katalogu.md)). CSA bilgi kartları (`cards`, Apollo 11 ve Blue Ghost 1) da katalogdan: [csa-ve-diger-ulkeler.md](../../docs/research/dogrulama/csa-ve-diger-ulkeler.md), No 28 ve 30 | – |
| `horizon.json` | `GET /api/horizon` | Mons Mouton test sahası, direk 2 m, düz ufuk | Ufuk alçalması 0,087 derece (T4; [ufuk-ve-isik-isi.md](../../docs/research/dogrulama/ufuk-ve-isik-isi.md), No A-7) | – |
| `sky-series.json` | `GET /api/sky-series` | Athena iniş noktası, 2025-03-06 17:30 UTC, `hours` 0 (tek örnek), direk 0 m | Güneş yönü 65,67, yüksekliği 2,47; Dünya yönü 335,85, yüksekliği 11,19 (T1; [aciklanabilirlik.md](../../docs/research/dogrulama/aciklanabilirlik.md), No 1 ve 2) | – |
| `body-series.json` | `GET /api/body-series` | 2026-12-05 00:00 ile 2026-12-06 00:00 arası, `step_s` 43200 (üç örnek) | İlk örnek JPL Horizons ile karşılaştırıldı: Güneş altı noktası 231,377145 doğu (= eksi 128,622855) ve eksi 1,455001; Dünya altı noktası 5,966154 ve 5,929357; Ay merkezinden Dünya uzaklığı 0,00263691477836 AU. Fark açılarda en çok 0,006 derece, uzaklıkta birkaç metre ([test_sub_points.py](../../backend/tests/core/test_sub_points.py)). Diğer iki örnek sunucunun aynı hesabıdır | – |
| `events.json` | `GET /api/events` | Mons Mouton test sahası, 2026-12-01 00:00 ile 2026-12-31 00:00 arası, ölçüt `center`, direk 0 m | Dünya batıyor 3 Aralık 10:03, doğuyor 11 Aralık 04:41, yeniden batıyor 30 Aralık 11:02 (T2b; [efemeris-ve-yer-istasyonlari.md](../../docs/research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 42). Dünya sürenin yüzde 27,7'sinde ufkun altında (aynı dosya, No 43). Güneş en fazla 6,47 derece (T2a; [gunes-paneli.md](../../docs/research/dogrulama/gunes-paneli.md), No 2) | Pencere süreleri iki olay anının farkı. `earth_visible_fraction` 0,723 = 1 − 0,277. Pencereler sorgu aralığının uçlarında kesilir |
| `events-eclipse.json` | `GET /api/events` | Apollo 11 sahası, 20 ve 21 Şubat 2027, direk 0 m | Tutulma 22:09 ile 00:36 UTC arası, en fazla yüzde 34,3 örtülme (T5; [zamanda-degisen-veri.md](../../docs/research/dogrulama/zamanda-degisen-veri.md), No 70) | – |
| `now.json` | `GET /api/now` | Mons Mouton test sahası, 2026-12-05 00:00 UTC, ölçüt `center`, direk 0 m | Dünya ufkun altında (T2b) | `hours_to_earthrise` 148,68 = 5 Aralık 00:00 ile 11 Aralık 04:41 arası |
| `comm-window.json` | `GET /api/comm-window` | `now.json` ile aynı | `now.json` ile aynı | `minutes_until_visible` 8921 = aynı aralık, dakika |
| `comm-window-relay.json` | `GET /api/comm-window` | Chang'e 4 iniş anı, 2019-01-03 02:26 UTC, direk 0 m. Ek alanlar: `relay_status`, `relay_required` | Dünya yönü 190,32, yüksekliği eksi 39,20 (T1; [aciklanabilirlik.md](../../docs/research/dogrulama/aciklanabilirlik.md), No 7). Dünya 2019 boyunca hiç ufkun üstüne çıkmıyor (aynı dosya, No 14); etiket bu yüzden `required` ([role-etiketi.md](../../docs/design/role-etiketi.md)) | – |
| `power.json` | `GET /api/power` | Mons Mouton test sahası, 1 Aralık 2026 00:00 ile 1 Ocak 2027 00:00 arası, `vertical_tracking`, düz ufuk (direk 0 m) | En uzun karanlık 280 saat ([gunes-paneli.md](../../docs/research/dogrulama/gunes-paneli.md), No 6) | `mean_power_w` 207,6 = 768,8 W/m² (T3, düz ufuk, dik ve dönen panel, verim uygulanmadan; aynı dosya, No 4) × varsayılan verim 0,27 × 1 m². Verim bir varsayım; sonuç bu yüzden `SYNTHETIC` |
| `compare.json` | `POST /api/compare` | İki senaryo: `a` = `events.json` ile aynı aralık; `b` = aynı saha, başlangıç 5 gün sonra | `a` için `events.json` değerleri | – |
| `reference-missions.json` | `GET /api/reference-missions` | Altı geçmiş iniş ([gecmis-gorev-vakalari.md](../../docs/design/gecmis-gorev-vakalari.md)) | `expected` açıları T1 tablosundan ([dogrulama-plani.md](../../docs/design/dogrulama-plani.md), Test 1). Athena olgusu: [gorev-araclari.md](../../docs/research/dogrulama/gorev-araclari.md), No 35. SLIM olgusu: [aciklanabilirlik.md](../../docs/research/dogrulama/aciklanabilirlik.md), No 44 | – |
| `validation.json` | `GET /api/validation` | `backend/scripts/run_validation.py` koşusu | Sunucu [`data/validation_report.json`](../validation_report.json) dosyasını olduğu gibi döndürür; bu dosya onun kopyasıdır. Biçim: [ADR-0004](../../docs/adr/0004-api-uc-noktalari.md), `/api/validation`. Rapor yenilenince bu kopya da güncellenmeli | – |
| `panel-profiles.json` | `GET /api/panel-profiles` | Dört panel tipi | – (değerler [guc-degerlendirmesi.md](../../docs/design/guc-degerlendirmesi.md), bölüm 8'deki varsayılanlar; hepsi `SYNTHETIC`) | – |
| `error.json` | Her uç noktanın hata gövdesi | HTTP 404 | – ([ADR-0004](../../docs/adr/0004-api-uc-noktalari.md), "Hata yanıtı") | – |

## Yer tutucular

`null` yazılan alanlar burada ayrıca sayılmadı: `null` zaten "bilinmiyor" demek. Aşağıdakiler `null` olamadığı ya da bir örnek değer gerektiği için yazılmış değerlerdir. Arayüzde gerçek sonuç gibi gösterilmemeli.

| Dosya | Alan | Değer | Neden |
| --- | --- | --- | --- |
| `health.json` | `ok`, `kernels_loaded`, `dem_available` | `true` | Örnek kipinde sunucu yok; arayüzün "hazır" halini gösterir |
| `sky-series.json` | `sun.visible_fraction`, `earth.visible_fraction` | `1.0` | Hesaplanmadı. Açılar ufkun açıkça üstünde, ama değeri sunucu verecek |
| `sky-series.json` | `ephemeris.source` | `SPICE DE440` | Ürünün kullanacağı kaynak. Açılar ise Horizons (DE441) ile doğrulandı. Ekibin SPICE hesabı Horizons ile derecenin milyonda biri düzeyinde tutuyor ([dogrulama/veri-kaynaklari.md](../../docs/research/dogrulama/veri-kaynaklari.md), No 14) |
| `comm-window.json` | `searched_hours` | `336` | Sunucunun arama süresi henüz belirlenmedi |
| `comm-window-relay.json` | `searched_hours` | `744` | Aynı. Röle etiketi en az bir aylık aralık istediği için bir aydan uzun seçildi |
| `comm-window-relay.json` | `lat_deg`, `lon_deg` | -45,4446; 177,5991 | T1'in sorgu koordinatı. `sites.json` NASA tablosundaki koordinatı (-45,4561; 177,5885) kullanıyor; açı bu koordinatta doğrulandı |
| `power.json` | `samples` | `[]` | Saatlik değerlerin hiçbiri doğrulanmadı |
| `compare.json` | `scenarios[1].scenario` | 6 Aralık 2026 ile 5 Ocak 2027 arası | Yalnızca karşılaştırma yapısını göstermek için; ölçüleri `null` |
| `compare.json` | `deltas[].unit` | `fraction`, `hours`, `deg`, `W` | Birim adları sözleşmede sabitlenmedi; öneri |
| `reference-missions.json` | `landing_utc` | T1 sorgu anları | Güvenilirliği `landing_utc_validity` alanında: Blue Ghost ve Chang'e 4 `MEASURED` (NASA ve CNSA). SLIM `DERIVED`, çünkü JAXA'nın 15:19:52 anı dakikaya yuvarlandı. Athena, IM-1 ve Chandrayaan-3 `SYNTHETIC`, çünkü saatleri birincil kaynaktan doğrulanamadı ([aciklanabilirlik.md](../../docs/research/dogrulama/aciklanabilirlik.md), No 22, 35 ve 56) |
| `reference-missions.json` | `facts` | Chandrayaan-3'te `[]` | Dosya [`data/reference_missions.json`](../reference_missions.json) ile birebir aynı; olgular ve kaynakları oradan. Kaynak adı olmayan olgu yazılmadı |
| `reference-missions.json` | `facts[].evidence` | `official` | Kod adları (`official`, `preliminary`, `commentary`) tasarım belgesindeki üç kanıt düzeyinden alındı; sözleşmede tanımlı değil |
| `sites.json` | `elevation_m`; `landing_utc` (SLIM ve Blue Ghost 1 dışında) | `null` | Katalogda doğrulanmış değer yok; `data/sites.json` ile aynı |

## Sözleşmede açık kalanlar

Örnekler yazılırken çıkan ve [ADR-0003](../../docs/adr/0003-veri-sozlesmesi.md) içinde tanımlı olmayan üç nokta. Sözleşme sahibi karar verince örnekler güncellenir:

1. Kanıt düzeyi kodları: `official`, `preliminary`, `commentary` (yukarıda).
2. Karşılaştırma fark satırındaki `unit` değerleri (yukarıda).
3. Geçmiş görev kaydı `validity` alanı taşımıyor; tasarım belgesindeki örnek de taşımıyor. Kaydın güvenilirliği yalnızca `landing_utc_validity` ile veriliyor.

`sites.json`, sunucunun döndüreceği [`data/sites.json`](../sites.json) dosyasının kopyasıdır. Katalog değişince bu dosya da güncellenmeli. CSA kartları artık katalogda ([csa-bilgi-kartlari.md](../../docs/design/csa-bilgi-kartlari.md)); örnek onları aynen taşır.

## Örnek kipinin seçimi

Arayüzün veri katmanı ([client.ts](../../frontend/src/api/client.ts)) varsayılan olarak bu dosyaları kullanır. İki istisna var:

- **Röle örneği:** `getCommWindow` Chang'e 4 sahası (`change-4`) için `comm-window-relay.json` döndürür.
- **Tutulma örneği:** `getEvents` Apollo 11 sahası (`apollo-11`) için `events-eclipse.json` döndürür.

Canlı sunucuya geçmek için adres çubuğuna `?data=live` eklenir ya da uygulama açılırken `configureApi({ mode: 'live' })` çağrılır ([config.ts](../../frontend/src/api/config.ts)).
