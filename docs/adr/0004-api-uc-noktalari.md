# ADR-0004: API uç noktaları

- **Status:** Proposed
- **Date:** 2026-11-14
- **Related:** [ADR-0001](0001-uygulama-mimarisi-ve-stack.md), [ADR-0003](0003-veri-sozlesmesi.md), [frontend-migrate/DESIGN.md](../../frontend-migrate/DESIGN.md) (bölüm 6), [docs/design/gosterim-ve-arayuz.md](../design/gosterim-ve-arayuz.md)

## Context

Referans arayüz 29 uç nokta kullanıyor; çoğu rover rota planlamayla ilgili ([DESIGN.md, 6.1](../../frontend-migrate/DESIGN.md)). Rover konuları kapsamdan çıkarıldığı için ([ANALIZ-OZETI.md, bölüm 7.5](../research/ANALIZ-OZETI.md)) bu uç noktaların büyük kısmı bu projede yok.

Bu projenin sorusu farklı: bir saha ve tarih için Güneş ve Dünya ufka göre nerede, güç ve iletişim pencereleri ne kadar sürüyor, iki senaryo arasında ne fark var. Arayüz ile sunucu arasındaki çağrıların bu soruya göre yeniden tanımlanması gerekiyor.

## Decision

Bütün uç noktalar aynı kökten `/api` altındadır ([DESIGN.md, 6](../../frontend-migrate/DESIGN.md)). Yanıt yapıları [ADR-0003](0003-veri-sozlesmesi.md) içinde tanımlıdır. Anlamı aynı kalan beş uç noktada referans arayüzdeki ad korunur: `health`, `comm-window`, `compare`, `reference-missions` ve `layers`.

### Konum parametreleri

Saha isteyen her uç nokta şu iki biçimden birini kabul eder:

- `site_id`: hazır saha listesinden bir kimlik.
- `lat_deg` ve `lon_deg`: özel koordinat. Sınırlar: enlem eksi 90 ile artı 90, boylam eksi 180 ile artı 360 arası.

İsteğe bağlı `mast_height_m` gözlem noktasının zeminden yüksekliğidir. Sıfır ya da daha büyük olmalı; arazi ufku yalnızca 2 ve 10 m için kullanılır, diğer değerlerde düz ufuk. Ayrıntı ve öncelik kuralı [ADR-0003](0003-veri-sozlesmesi.md), "Direk yüksekliği kuralı".

İsteğe bağlı `earth_criterion` (`center`, `first_limb` ya da `full_disk`; varsayılan `center`) Dünya'nın görünür sayılma ölçütüdür. Dünya bilgisi döndüren her uç nokta (`events`, `now`, `comm-window`) bu parametreyi aynı anlamla alır.

### Uç noktalar

| Yöntem | Yol | Parametreler | Yanıt | Açıklama |
|---|---|---|---|---|
| GET | `/api/health` | yok | `{ "ok": true, "kernels_loaded": true, "dem_available": true, "layers_available": true, "ephemeris_range": { "start_utc": "...", "end_utc": "..." } }` | Sunucu ve veri dosyaları hazır mı; hesaplanabilen tarih aralığı |
| GET | `/api/sites` | `category` (isteğe bağlı) | `Site` dizisi | Hazır saha listesi |
| GET | `/api/horizon` | konum, `mast_height_m` | `HorizonProfile` | Ufuk profili. Hazır sahada dosyadan; özel koordinatta ilk sürümde düz ufuk (`method: sphere`) |
| GET | `/api/sky-series` | konum, `start_utc`, `hours`, `step_minutes` | `SkySeries` | Güneş ve Dünya'nın zaman içindeki konumu |
| GET | `/api/body-series` | `utc` ya da `start_utc`, `end_utc`, `step_s` (isteğe bağlı, varsayılan 3600) | `BodySeries` | Ay üzerinde Güneş altı ve Dünya altı noktası, Dünya uzaklığı (`MOON_ME`) |
| GET | `/api/events` | konum, `start_utc`, `end_utc`, `earth_criterion` | `EventList` | Doğuş ve batış anları, pencereler, özet ölçüler |
| GET | `/api/now` | konum, `utc`, `earth_criterion` | `NowStatus` | Verilen anda durum ve kalan süreler |
| GET | `/api/comm-window` | konum, `utc`, `earth_criterion` | `CommWindow` | Dünya ile doğrudan iletişim durumu |
| GET | `/api/power` | konum, `start_utc`, `end_utc`, `panel_profile_id`, `fixed_azimuth_deg` (isteğe bağlı) | `PowerSeries` | Panel gücü. `fixed_azimuth_deg` yalnızca `vertical_fixed` panelde kullanılır; verilmezse sunucu aralıktaki en iyi yönü bulur ve yanıtta bildirir |
| POST | `/api/compare` | gövde: `{ "scenarios": [Scenario, ...] }` | `CompareResponse` | İki ya da daha çok senaryonun karşılaştırması |
| GET | `/api/reference-missions` | yok | Geçmiş görev kayıtları dizisi | Geçmiş inişler ve o andaki gökyüzü |
| GET | `/api/panel-profiles` | yok | `PanelProfile` dizisi | Hazır panel profilleri |
| GET | `/api/layers/{name}` | `format=f32`, `region` | İkili dizi ve başlıklar | Harita katmanı. Taşıma biçimi referans arayüzle aynı ([DESIGN.md, 6.3](../../frontend-migrate/DESIGN.md)) |

Harita katmanı adları (`name`): `hillshade` (gölgeli kabartma), `elevation` (yükseklik), `slope` (eğim) ve `psr` (kalıcı gölge). `region` ilk sürümde tek değer alır: `mons-mouton`. Katmanların hepsi aynı ızgarada gelir. Izgara, yükseklik haritalarının kendi izdüşümündedir: güney kutbu merkezli düz izdüşüm, metre ([dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 17). Izgaranın sınırları `X-Layer-Bounds` başlığında `x_min,y_min,x_max,y_max` olarak metre cinsinden taşınır. Arayüz, haritada tıklanan noktayı bu izdüşümün tersiyle enlem ve boylama çevirir ([zamanda-degisen-veri-hazirlama.md](../research/zamanda-degisen-veri-hazirlama.md), bölüm 3.4).

Destekleyici iki uç nokta, ilgili iş yapılırsa eklenir: `/api/validation` (doğrulama testlerinin sonuç tablosu; [dogrulama-plani.md](../design/dogrulama-plani.md)) ve `/api/ground-stations` (yer istasyonlarının Ay'ı gördüğü pencereler; [iletisim-penceresi.md](../design/iletisim-penceresi.md)).

`GET /api/validation` parametre almaz ve `data/validation_report.json` dosyasını olduğu gibi döndürür; dosya `backend/scripts/run_validation.py` ile üretilir. Dosya yoksa 503 ve `data_unavailable`. Biçim:

- Üst düzey: `generated_utc`, `target`, `summary`, `rows`.
- `summary`: `pass`, `warn`, `fail`, `skipped`, `info` sayıları.
- `rows[]`: `id`, `test` (`T1` … `T7`), `title`, `condition` (koşul metni, İngilizce), `kind`, `expected`, `measured`, `diff` (ölçülen eksi beklenen), `threshold`, `unit`, `status`, `source`, `endpoint`, `note`; isteğe bağlı `expected_range` (`[alt, üst]`, ucu `null` olabilir).
- `kind`: `reference` (eşikli referans test) ya da `approximate` (eşiksiz yaklaşık karşılaştırma; yalnızca T6).
- `status`: `pass`, `warn`, `fail`, `skipped` ya da `info`. `info` yalnızca `approximate` satırlarda kullanılır ve "doğrulandı" anlamı taşımaz; bu satırlarda `threshold` `null` olur.
- T3 satırları uç noktadan değil A hattının birim testinin hesabından (`backend/tests/core/test_power.py`) yazılır; `endpoint` `null` olur.

Ekstra özellikler için uç noktalar, o özellik yapılırsa eklenir: `/api/eclipses`, `/api/site-score`, `/api/approach-profile`, `/api/surface-temperature`. Biçimleri ilgili proje dokümanında.

### Sınırlar

- `hours` en fazla 24 çarpı 60 (iki ay). Daha uzun aralık için `step_minutes` büyütülür.
- `step_minutes` en az 1.
- `/api/sky-series` iki ucu da içerir: ilk örnek `start_utc` anındadır, son örnek aralığın sonundadır. `hours` 24 ve `step_minutes` 60 ise 25 örnek döner; `hours` sıfırsa tek örnek döner. Doğrulama testleri tek bir an için bu yolla sorgu yapar ([dogrulama-plani.md](../design/dogrulama-plani.md), bölüm 5).
- `/api/body-series` ya tek an için yalnızca `utc` alır ya da `start_utc` ve `end_utc` alır; ikisi birlikte verilirse `invalid_parameter`. Aralık iki ucu da içerir (`/api/sky-series` gibi), `end_utc` `start_utc`'den önce olamaz, eşitse tek örnek döner. Aralık en fazla 24 çarpı 60 saat (iki ay), `step_s` en az 60, örnek sayısı en fazla 10 000 (iki ay için en küçük adım 600 s). Ölçülen süre (15 Kasım 2026, tek istek, FastAPI test istemcisi, yukarıdakinden farklı bir makine): 60 gün, 600 s adım, 8641 örnek 0,41 s.
- `/api/events` ve `/api/power` aralığı (`end_utc` eksi `start_utc`) sıfırdan büyük ve en fazla 24 çarpı 60 saattir (iki ay). `/api/power` saatlik örnek verir ve iki ucu da içerir: 1 Aralık 00:00 ile 1 Ocak 00:00 arası 745 örnektir.
- `/api/now` ve `/api/comm-window` sonraki değişimi en fazla 720 saat (30 gün) ileride arar. Bulamazsa süre alanları `null`, `search_limited` `true` olur. `/api/now` gece süresini (`night_hours`) de aynı uzunlukta geriye ve ileriye arar.
- `/api/compare` en az 2, en fazla 4 senaryo alır; `scenario_id` değerleri farklı olmalıdır. Her senaryo `/api/events` ve `/api/power` sınırlarına uyar.

Ölçülen süreler (14 Kasım 2026, tek istek, sunucu ısınmış, AMD Ryzen dizüstü, Mons Mouton, 2 m direk, arazi ufku): `/api/events` 30 gün 0,14 s, 60 gün 0,28 s; `/api/power` 60 gün 0,07 s (`vertical_fixed` en iyi yön araması dahil 0,09 s); `/api/now` 0,18 s; `/api/comm-window` 0,07 s; `/api/sky-series` 60 gün saatlik 0,14 s; `/api/compare` 4 senaryo çarpı 60 gün 1,8 s. Sınırlar bu sürelerle arayüzün beklemesi kabul edilebilir kaldığı için değiştirilmedi. Süreler bir kez ölçüldü, başka makinede tekrarlanmadı.

### Hata yanıtı

Hatalı istek için HTTP 422, bulunamayan saha için 404, veri dosyası eksikse 503 döner. Gövde her durumda aynı biçimdedir:

```json
{ "error": { "code": "site_not_found", "message": "No site with id 'x'." } }
```

Hata kodları:

| HTTP | `code` | Ne zaman |
|---|---|---|
| 404 | `site_not_found` | `site_id` listede yok |
| 422 | `invalid_parameter` | Eksik ya da aralık dışı parametre (enlem, boylam, `mast_height_m`, `step_minutes`, `step_s`) |
| 422 | `date_out_of_range` | Tarih hesaplanabilen aralığın dışında. `message` geçerli aralığı söyler; aralık `/api/health` yanıtındaki `ephemeris_range` ile aynıdır |
| 422 | `too_many_scenarios` | `/api/compare` isteğinde 4'ten çok senaryo |
| 503 | `data_unavailable` | SPICE dosyaları ya da gereken veri dosyası yüklenemedi |

Referans arayüz de doğrulama hataları için 422 kullanıyor ([frontend-migrate/design-export/api-contract/fixtures/](../../frontend-migrate/design-export/api-contract/fixtures/), `survival.422-missing-goal.json`).

### Veri yoksa davranış

Özel koordinatlarda ilk sürüm her zaman düz ufukla hesap yapar ([ADR-0001](0001-uygulama-mimarisi-ve-stack.md), madde 5); hazır sahalarda da 2 ve 10 m dışındaki yüksekliklerde aynısı olur. Uç nokta hata vermez, yanıtta `validity` alanını `SYNTHETIC` ve ufuk `method` alanını `sphere` olarak döndürür. Arayüz bunu "arazi hesaba katılmadı" diye gösterir.

## Consequences

Kazanılanlar:

- Arayüz ile sunucu arasındaki her çağrı tek tabloda. İki taraf birbirini beklemeden yazılabilir.
- Referans arayüzdeki veri alma katmanının yapısı (aynı kök, 422 kullanımı, ikili katman taşıması) korunuyor.

Bedeli:

- Referans arayüzün rover rota planlamaya ait panelleri bu uç noktalarla çalışmaz; o paneller ya kaldırılır ya da yeni veriyle yeniden yazılır ([gosterim-ve-arayuz.md](../design/gosterim-ve-arayuz.md)).
- `comm-window` yanıtı referanstaki biçimle birebir aynı değil; ızgara satır ve sütunu yerine enlem ve boylam taşıyor.

Yapılacaklar:

- Her uç nokta için bir örnek yanıt dosyası hazırlanmalı.
- Sınır değerleri sunucu yazıldıktan sonra ölçümle güncellenmeli.

## Değişiklik notu

- 14 Kasım 2026, kullanım senaryolarıyla eşleştirme ([use-cases-and-scenarios.md](../product/use-cases-and-scenarios.md), [PLAN.md](../PLAN.md)): `/api/health` yanıtına `ephemeris_range` ve hata kodlarına `date_out_of_range` eklendi (`UC-03`, aralık dışı tarih). `/api/power` isteğine `fixed_azimuth_deg` eklendi (`UC-06`). Harita katmanı adları, `region` değeri ve `X-Layer-Bounds` başlığı tanımlandı (`UC-12`). `/api/validation` (`UC-10`) ve `/api/ground-stations` (`UC-07`) destekleyici uç nokta olarak eklendi. Hata kodları tablosu eklendi. `/api/sky-series` yanıtının iki ucu da içerdiği "Sınırlar" bölümüne yazıldı.
- 14 Kasım 2026, F2-A ([#37](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/37)): "Sınırlar" bölümüne `/api/events`, `/api/power`, `/api/now`, `/api/comm-window` ve `/api/compare` sınırları ile ölçülen süreler yazıldı; ölçülmemiş sınır varsayımı kaldırıldı.
- 14 Kasım 2026, F3-B ([#43](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/43)): `/api/validation` biçimi yazıldı. Rapor satırlarına `condition` ve `kind` alanları, `status` değerlerine ve `summary` sayılarına `info` eklendi (T6, yaklaşık karşılaştırma); T3 satırları birim testten yazılır ve `endpoint` `null` olur.
- 15 Kasım 2026, [#98](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/98): `GET /api/body-series` uç noktası tabloya, sınırları "Sınırlar" bölümüne eklendi; `step_s` hata kodları tablosuna yazıldı.
- 15 Kasım 2026, [#102](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/102): `/api/health` yanıtına `layers_available` eklendi; her bölgenin dört katmanı da aynı klasörde (`data/raw/layers/` ya da `data/layers/`) varsa `true`. Klasör bölge başına seçilir: tam çözünürlüklü `data/raw/layers/` yalnızca bölgenin dört katmanını da içeriyorsa kullanılır, yoksa dördü de depodaki küçültülmüş `data/layers/` kopyasından gelir; böylece bir bölgenin katmanları hep aynı ızgarada kalır. Küçültülmüş kopyada `X-Layer-Resolution-M` 40, `X-Layer-Downsample` 2, `X-Layer-Validity` `DERIVED` olur; başlık adları değişmez. Katman `.json` dosyasına `downsample_method` (`mean` ya da `fraction`) ve `source_max` (tam çözünürlükteki en büyük değer) eklendi. Küçültülmüş `psr` hücresi 0 ile 1 arasında bir orandır (gölgedeki 20 m hücrelerin payı).
