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
| GET | `/api/health` | yok | `{ "ok": true, "kernels_loaded": true, "dem_available": true }` | Sunucu ve veri dosyaları hazır mı |
| GET | `/api/sites` | `category` (isteğe bağlı) | `Site` dizisi | Hazır saha listesi |
| GET | `/api/horizon` | konum, `mast_height_m` | `HorizonProfile` | Ufuk profili. Hazır sahada dosyadan; özel koordinatta ilk sürümde düz ufuk (`method: sphere`) |
| GET | `/api/sky-series` | konum, `start_utc`, `hours`, `step_minutes` | `SkySeries` | Güneş ve Dünya'nın zaman içindeki konumu |
| GET | `/api/events` | konum, `start_utc`, `end_utc`, `earth_criterion` | `EventList` | Doğuş ve batış anları, pencereler, özet ölçüler |
| GET | `/api/now` | konum, `utc`, `earth_criterion` | `NowStatus` | Verilen anda durum ve kalan süreler |
| GET | `/api/comm-window` | konum, `utc`, `earth_criterion` | `CommWindow` | Dünya ile doğrudan iletişim durumu |
| GET | `/api/power` | konum, `start_utc`, `end_utc`, `panel_profile_id` | `PowerSeries` | Panel gücü |
| POST | `/api/compare` | gövde: `{ "scenarios": [Scenario, ...] }` | `CompareResponse` | İki ya da daha çok senaryonun karşılaştırması |
| GET | `/api/reference-missions` | yok | Geçmiş görev kayıtları dizisi | Geçmiş inişler ve o andaki gökyüzü |
| GET | `/api/panel-profiles` | yok | `PanelProfile` dizisi | Hazır panel profilleri |
| GET | `/api/layers/{name}` | `format=f32`, `region` | İkili dizi ve başlıklar | Harita katmanı. Taşıma biçimi referans arayüzle aynı ([DESIGN.md, 6.3](../../frontend-migrate/DESIGN.md)) |

Ekstra özellikler için uç noktalar, o özellik yapılırsa eklenir: `/api/eclipses`, `/api/site-score`, `/api/approach-profile`, `/api/surface-temperature`. Biçimleri ilgili proje dokümanında.

### Sınırlar

- `hours` en fazla 24 çarpı 60 (iki ay). Daha uzun aralık için `step_minutes` büyütülür.
- `step_minutes` en az 1.
- `/api/compare` en fazla 4 senaryo alır.

Varsayım: Bu sınırlar ölçülmüş bir başarım değerine dayanmıyor; sunucu yazıldıktan sonra süre ölçülerek düzeltilmeli. Eldeki tek süre ölçümü (saha başına ufuk karşılaştırması için 0,03 saniye) ekibin kendi ölçümü ve tekrar edilmedi ([dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 51).

### Hata yanıtı

Hatalı istek için HTTP 422, bulunamayan saha için 404, veri dosyası eksikse 503 döner. Gövde her durumda aynı biçimdedir:

```json
{ "error": { "code": "site_not_found", "message": "No site with id 'x'." } }
```

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
