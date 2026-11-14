# ADR-0003: Veri sözleşmesi

- **Status:** Proposed
- **Date:** 2026-11-14
- **Related:** [ADR-0002](0002-koordinat-sistemi-ve-zaman.md), [ADR-0004](0004-api-uc-noktalari.md), [docs/design/veri-kaynaklari-ve-on-hesap.md](../design/veri-kaynaklari-ve-on-hesap.md), [docs/research/ANALIZ-OZETI.md](../research/ANALIZ-OZETI.md) (bölüm 8)

## Context

Araştırma notları ön hesap çıktıları için dört ayrı dosya biçimi öneriyordu: ikili dosyalar, CSV ve NPZ, saha başına JSON, statik JSON ([ANALIZ-OZETI.md, bölüm 8](../research/ANALIZ-OZETI.md)). Ufkun kaç yönde hesaplanacağı da belgeden belgeye değişiyordu (720 ya da 360).

Arayüz, sunucu ve ön hesap ayrı kişilerce paralel yazılacak. Aralarında dolaşan verinin biçimi tek yerde tanımlı olmalı.

Referans arayüzün sözleşmesi iki deseni hazır veriyor ve bu taslak onları koruyor:

- Alan adları küçük harf ve alt çizgiyle; açı alanları `_deg`, zaman alanları `utc` ile bitiyor ([net-types.ts](../../frontend-migrate/design-export/api-contract/types/net-types.ts), `SunSample`).
- Her veri katmanı bir güvenilirlik etiketi taşıyor: `SYNTHETIC`, `DERIVED`, `MODEL`, `MEASURED` ([net-types.ts](../../frontend-migrate/design-export/api-contract/types/net-types.ts), `Validity`).

## Decision

### Genel kurallar

1. Bütün yapılar JSON'dır. Alan adları küçük harf ve alt çizgiyle yazılır.
2. Koordinat, zaman ve açı kuralları [ADR-0002](0002-koordinat-sistemi-ve-zaman.md) ile aynıdır: derece, metre, UTC ve sonunda `Z`.
3. Bilinmeyen değer `null` yazılır; alan atlanmaz.
4. Hesaplanmış ya da derlenmiş her yapı bir `validity` alanı taşır. Bu projedeki anlamları:

| Değer | Anlamı | Örnek |
|---|---|---|
| `MEASURED` | Doğrudan ölçüm ya da resmi kayıt | NASA tablosundaki iniş koordinatı, yükseklik haritası |
| `MODEL` | Fizik modelinin çıktısı | Güneş ve Dünya'nın konumu, sıcaklık |
| `DERIVED` | Ölçümden hesapla türetilmiş | Arazi ufku, olay saatleri, güç |
| `SYNTHETIC` | Varsayım ya da yer tutucu | Düz ufuk, varsayılan panel değeri |

Bir sonuç birden çok girdiye dayanıyorsa en düşük etiketi alır. Sıra referans arayüzdekiyle aynıdır: `SYNTHETIC`, `DERIVED`, `MODEL`, `MEASURED` ([net-types.ts](../../frontend-migrate/design-export/api-contract/types/net-types.ts), `VALIDITY_RANK`).

### Saha kaydı (`Site`)

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | metin | Küçük harf, tire ile. Örnek: `im2-athena` |
| `name` | metin | Görünen ad |
| `category` | metin | `apollo`, `clps`, `commercial`, `international`, `artemis_candidate`, `test` ya da `custom` |
| `lat_deg`, `lon_deg` | sayı | ME sisteminde; boylam doğuya artı |
| `elevation_m` | sayı ya da `null` | 1737,4 km küreye göre |
| `landing_utc` | metin ya da `null` | Varsa iniş anı |
| `status` | metin | `landed`, `landed_tipped`, `crashed`, `planned`, `candidate` ya da `reference` |
| `coordinate_source` | nesne | `label` ve `url` |
| `validity` | metin | Koordinatın güvenilirliği |
| `notes` | metin ya da `null` | Kısa açıklama |

### Ufuk profili (`HorizonProfile`)

| Alan | Tip | Açıklama |
|---|---|---|
| `lat_deg`, `lon_deg` | sayı | Hesabın yapıldığı nokta |
| `site_id` | metin ya da `null` | Hazır saha ise kimliği |
| `mast_height_m` | sayı | Gözlem noktasının zeminden yüksekliği |
| `azimuth_step_deg` | sayı | Her zaman `0.5` |
| `horizon_deg` | 720 sayılık dizi | İlk değer kuzey; sıra doğuya doğru. Arazinin o yöndeki ufuk açısı |
| `method` | metin | `terrain` (yükseklik haritasından) ya da `sphere` (düz ufuk) |
| `max_range_km` | sayı ya da `null` | Bakılan en uzak mesafe |
| `dem` | nesne ya da `null` | `product`, `resolution_m`, `url` |
| `validity` | metin | `terrain` için `DERIVED`, `sphere` için `SYNTHETIC` |

Yön sayısı 720 olarak sabitlenir (yarım derece aralık). Gerekçe: Güneş kendi çapı kadar yolu yaklaşık bir saatte alıyor ve iki ana çalışma bu değeri kullanıyor ([De Rosa ve arkadaşları, 2012](https://arxiv.org/abs/1208.5587); doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-15 ve A-36). 720 evrensel bir standart değil; 1440 ve 360 kullanan çalışmalar da var (aynı dosya, No A-46).

### Gökyüzü serisi (`SkySeries`)

| Alan | Tip | Açıklama |
|---|---|---|
| `lat_deg`, `lon_deg`, `mast_height_m` | sayı | Gözlem noktası |
| `start_utc` | metin | İlk örneğin zamanı |
| `step_minutes` | sayı | Örnekler arası süre |
| `samples` | dizi | Her eleman bir an (aşağıda) |
| `ephemeris` | nesne | `source` (örnek: `SPICE DE440`), `frame` (`MOON_ME`), `correction` (`LT+S`) |
| `horizon` | nesne | Kullanılan ufuk profilinin `method` ve `validity` değeri |
| `validity` | metin | Ufuk profilinden devralınır |

Her örnek:

| Alan | Tip | Açıklama |
|---|---|---|
| `utc` | metin | Örnek anı |
| `sun` | nesne | `azimuth_true_deg`, `elevation_deg`, `horizon_deg`, `visible_fraction`, `range_au`, `radius_deg` |
| `earth` | nesne | `azimuth_true_deg`, `elevation_deg`, `horizon_deg`, `visible_fraction`, `range_km`, `radius_deg` |

`horizon_deg` o cismin bulunduğu yöndeki ufuk açısıdır. `visible_fraction` diskin ufkun üstünde kalan kısmıdır: 0 hiç görünmüyor, 1 tamamı görünüyor.

### Olaylar, pencereler ve ölçüler (`EventList`)

| Alan | Tip | Açıklama |
|---|---|---|
| `events` | dizi | `type`, `utc`, `utc_earliest`, `utc_latest`, `criterion` |
| `windows` | dizi | `kind`, `start_utc`, `end_utc`, `duration_hours` |
| `metrics` | nesne | Aralığın özeti (aşağıda) |
| `mast_height_m` | sayı | Hesapta kullanılan gözlem yüksekliği |
| `validity` | metin | Ufuk profilinden devralınır |

- `type` değerleri: `sunrise`, `sunset`, `earthrise`, `earthset`, `eclipse_start`, `eclipse_end`.
- `kind` değerleri: `sunlit`, `dark`, `earth_visible`, `earth_hidden`.
- `utc_earliest` ve `utc_latest` olayın hata payını verir; hesaplanamadıysa `null`.
- `criterion` olayın hangi ölçüte göre sayıldığını söyler: `center`, `first_limb` ya da `full_disk`.
- `metrics` alanları: `sunlit_fraction`, `longest_dark_hours`, `max_sun_elevation_deg`, `earth_visible_fraction`, `longest_earth_hidden_hours`.

Arayüzün "şu an" göstergesi için ayrı bir yapı (`NowStatus`): `utc`, `sun_up`, `hours_to_sunset`, `hours_to_sunrise`, `earth_up`, `hours_to_earthset`, `hours_to_earthrise`, `criterion`, `mast_height_m`, `search_limited`, `validity` (ufuk profilinden devralınır). Aranan süre içinde olay bulunamazsa değer `null` olur ve `search_limited` alanı `true` döner. Bu desen referans arayüzün iletişim penceresi yanıtından alındı ([comm-window.available.json](../../frontend-migrate/design-export/api-contract/fixtures/comm-window.available.json)). `criterion` Dünya alanlarının hangi ölçüte göre sayıldığını söyler (`EventList` ile aynı değerler).

### İletişim penceresi (`CommWindow`)

`/api/comm-window` yanıtı. Alanlar referans arayüzün aynı adlı yanıtından alınır; ızgara satır ve sütunu yerine enlem ve boylam gelir. Süreler dakikadır.

| Alan | Tip | Açıklama |
|---|---|---|
| `utc` | metin | Sorgu anı |
| `lat_deg`, `lon_deg`, `mast_height_m` | sayı | Gözlem noktası |
| `visible_now` | mantıksal | Dünya o anda görünüyor mu |
| `minutes_remaining` | sayı ya da `null` | Görünüyorsa batışa kalan süre |
| `minutes_until_visible` | sayı ya da `null` | Görünmüyorsa doğuşa kalan süre |
| `next_change_utc` | metin ya da `null` | Bir sonraki doğuş ya da batış anı |
| `search_limited` | mantıksal | Aranan süre içinde olay bulunamadıysa `true` |
| `searched_hours` | sayı | Aranan süre |
| `earth_elevation_deg`, `earth_azimuth_true_deg` | sayı ya da `null` | Dünya'nın o andaki açıları |
| `horizon_deg` | sayı | Dünya yönündeki ufuk açısı |
| `criterion` | metin | `center`, `first_limb` ya da `full_disk` |
| `validity` | metin | Ufuk profilinden devralınır |

`NowStatus` içindeki Dünya alanları aynı hesaptan gelir; yalnızca birim saattir ve ayrıntı alanları yoktur. Röle alanları (`relay_status`, `relay_required`) ek alandır ve yalnızca röle etiketi yapılırsa gelir (aşağıda, "Ekstra özelliklerin ek alanları").

### Panel profili (`PanelProfile`) ve güç serisi (`PowerSeries`)

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | metin | Örnek: `vertical_tracking` |
| `type` | metin | `horizontal`, `vertical_fixed`, `vertical_tracking` ya da `two_axis` |
| `area_m2` | sayı | Panel alanı |
| `efficiency` | sayı | 0 ile 1 arası |
| `fixed_azimuth_deg` | sayı ya da `null` | Yalnızca `vertical_fixed` için |
| `mast_height_m` | sayı | Panelin zeminden varsayılan yüksekliği |
| `validity` | metin | Varsayılan değerler için `SYNTHETIC` |

`PowerSeries`: `panel_profile_id`, `mast_height_m`, `samples` dizisi (`utc`, `incidence_cos`, `sun_visible_fraction`, `irradiance_w_m2`, `power_w`), `summary` nesnesi (`mean_power_w`, `energy_kwh`, `sunlit_fraction`, `longest_dark_hours`) ve `validity` (panel profili ile ufuk profilinin düşük olanı).

### Direk yüksekliği kuralı

`mast_height_m` şu sırayla belirlenir: istekteki ya da senaryodaki (`Scenario`) değer, yoksa panel profilindeki değer, o da yoksa 2. Değer sıfır ya da daha büyük olmalıdır; eksi değer HTTP 422 ile reddedilir.

- Arazi ufku (`method: terrain`) yalnızca 2 ve 10 m için kullanılır, çünkü hazır sahaların profilleri bu iki yükseklik için önceden hesaplanıyor ([ufuk-hesabi.md](../design/ufuk-hesabi.md)).
- Başka her yükseklikte (sıfır dahil) ve özel koordinatlarda hesap düz ufukla (`method: sphere`) yapılır ve sonuç `SYNTHETIC` etiketi alır. Doğrulama testleri ve Athena demosu bu yolla sıfır yükseklik kullanır ([dogrulama-plani.md](../design/dogrulama-plani.md), [athena-demosu.md](../design/athena-demosu.md)).

Kullanılan değer yanıtta `mast_height_m` alanında döner.

### Senaryo ve karşılaştırma

`Scenario`: `scenario_id`, `label`, `site_id` (ya da `lat_deg` ile `lon_deg`), `start_utc`, `end_utc`, `mast_height_m`, `panel_profile_id`.

`CompareResponse`: `scenarios` dizisi (her biri `scenario`, `metrics`, `now`, `validity`) ve `deltas` dizisi (`metric`, `values`, `unit`, `best_scenario_id`).

### Harita katmanları

Harita üzerinde gösterilen ızgara verileri (kalıcı gölge, ortalama aydınlanma gibi) referans arayüzün taşıma biçimiyle verilir: başlıksız, küçük uçlu 32 bit kayan noktalı dizi; satır ve sütun sayısı, en küçük ve en büyük değer ile çözünürlük yanıt başlıklarında ([DESIGN.md, 6.3](../../frontend-migrate/DESIGN.md)).

### Ekstra özelliklerin ek alanları

Aşağıdaki alanlar yalnızca ilgili özellik yapılırsa kullanılır. Ayrıntıları kendi proje dokümanlarında.

| Yapı | Ek alan | Açıklama | Doküman |
|---|---|---|---|
| `EventList` ve `comm-window` yanıtı | `relay_status`, `relay_required` | Dünya hiç görünmüyorsa röle gerektiğini söyler | [role-etiketi.md](../design/role-etiketi.md) |
| Tutulma olayları | `max_obscured_fraction` | Güneş diskinin en çok ne kadarının örtüldüğü | [tutulmalar.md](../design/tutulmalar.md) |
| `Site` | `cards` | Sahaya bağlı bilgi kartları | [csa-bilgi-kartlari.md](../design/csa-bilgi-kartlari.md) |
| Geçmiş görev kaydı | `expected`, `facts`, `evidence`, `landing_utc_validity` | Beklenen açılar, doğrulanmış olgular ve kanıt düzeyi | [gecmis-gorev-vakalari.md](../design/gecmis-gorev-vakalari.md) |
| Araç kaydı (`data/vehicles.json`) | `model`, `height_m`, `span_m`, `mass_kg`, `sites` | 3B model ve ölçüler | [arac-modelleri.md](../design/arac-modelleri.md) |

Ekstra uç noktaların yanıt yapıları (saha puanı, yaklaşma profili, zemin sıcaklığı) kendi dokümanlarında tanımlıdır: [saha-puani.md](../design/saha-puani.md), [yaklasma-profili-ve-golge-uyarisi.md](../design/yaklasma-profili-ve-golge-uyarisi.md), [zemin-sicakligi.md](../design/zemin-sicakligi.md).

### Depoda tutulan dosyalar

| Yol | İçerik |
|---|---|
| `data/sites.json` | `Site` dizisi |
| `data/horizons/<site_id>_<yükseklik>m.json` | Önceden hesaplanmış `HorizonProfile` |
| `data/panel_profiles.json` | `PanelProfile` dizisi |
| `data/reference_missions.json` | Geçmiş görev kayıtları ([gecmis-gorev-vakalari.md](../design/gecmis-gorev-vakalari.md)) |

720 sayılık bir ufuk profili birkaç kilobayt tutar; depoya konabilir. Yükseklik haritaları ve SPICE dosyaları depoya konmaz.

## Consequences

Kazanılanlar:

- Arayüz, bu yapıların örnek dosyalarıyla sunucu hazır olmadan geliştirilebilir.
- Her sonuç kendi güvenilirlik etiketini taşıyor; arayüz "varsayım" ile "ölçüm"ü ayırt edebilir.
- Araştırma notlarındaki dört ayrı biçim tek biçime iniyor.

Bedeli:

- Saatlik örneklerle bir aylık `SkySeries` yaklaşık 720 örnek eder; JSON olarak yüz kilobayt düzeyindedir. Daha uzun aralıklarda adım büyütülmeli.
- Araştırma notlarındaki ikili ve NPZ biçimleri kullanılmayacak; o notlardaki dosya adları geçersiz kalıyor.

Yapılacaklar:

- Her yapı için bir örnek dosya `data/examples/` altına konmalı; arayüz ve sunucu testleri bunlara karşı yazılmalı.
- "Dünya görünüyor" ölçütünün varsayılanı ([iletisim-penceresi.md](../design/iletisim-penceresi.md)) seçildiğinde `criterion` alanının varsayılanı buraya işlenmeli.
