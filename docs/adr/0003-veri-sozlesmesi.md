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

### Cisim serisi (`BodySeries`)

Ay küresinin aydınlanması ve Dünya yönü için ([#97](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/97), bölüm 4.1). Arayüz bu değerlerden yalnızca çizim yapar; gök mekaniği hesabı sunucudadır.

| Alan | Tip | Açıklama |
|---|---|---|
| `frame` | metin | Her zaman `MOON_ME` |
| `earth_frame` | metin | Her zaman `IAU_EARTH`; `earth_sub_*` alanlarının çerçevesi |
| `samples` | dizi | Her eleman bir an (aşağıda) |
| `assumptions` | metin dizisi | Dünya'ya bağlı noktaların model sınırı (dönüş modeli, enlem türü) |
| `validity` | metin | Her zaman `DERIVED` |

Her örnek:

| Alan | Tip | Açıklama |
|---|---|---|
| `utc` | metin | Örnek anı |
| `sub_solar_lat_deg`, `sub_solar_lon_deg` | sayı | Güneş altı noktası: Güneş'in tam tepede olduğu yer. Boylam eksi 180 ile artı 180 arası (ADR-0002, madde 3) |
| `sub_earth_lat_deg`, `sub_earth_lon_deg` | sayı | Dünya altı noktası: Dünya'nın tam tepede olduğu yer. Aynı boylam kuralı |
| `earth_distance_km` | sayı | Ay merkezinden Dünya merkezine görünür uzaklık (ışık süresi düzeltmeli) |
| `earth_sub_lunar_lat_deg`, `earth_sub_lunar_lon_deg` | sayı | Ay altı noktası Dünya üzerinde (`IAU_EARTH`): Ay'ın tam tepede olduğu yer. Enlem planetosentrik (Dünya merkezinden yön), boylam doğu pozitif, eksi 180 ile artı 180 arası |
| `earth_sub_solar_lat_deg`, `earth_sub_solar_lon_deg` | sayı | Güneş altı noktası Dünya üzerinde (`IAU_EARTH`), aynı kurallar |

Noktalar Ay'ın merkezinden, `LT+S` düzeltmesiyle hesaplanır (ADR-0002, madde 11): o anda Ay'dan bakınca Güneş ve Dünya'nın göründüğü yön. 1737,4 km kürede alt nokta, cismin yönünün yüzeyi kestiği noktadır. Güneş altı noktası JPL Horizons ile 0,0002 derece içinde tutuyor. Dünya altı noktası en çok 0,006 derece farklı, çünkü Horizons `ObsSub` değerini yıldız sapınımı (aberration) düzeltmesi olmadan veriyor; aynı ayarla SPICE, Horizons'ı 0,0001 derece içinde tutuyor (`backend/tests/core/test_sub_points.py`).

### Aday bölgeler (`Candidates`)

Bir harita bölgesinin yükseklik haritalarından çıkarılan aday bölgeler ([#97](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/97), bölüm 4.3; [#103](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/103)). `backend/scripts/make_candidates.py` üretir, `data/candidates.json` olarak depoda durur. Adaylar "candidate region" diye anılır; iniş güvenliği garantisi değildir.

| Alan | Tip | Açıklama |
|---|---|---|
| `region` | metin | Bölge kimliği (`mons-mouton`) |
| `method` | nesne | `window_m`, `stride_m`, `slope_limit_deg`, `slope_limit_source`, `min_separation_km`, `max_candidates`, `assumed` (dayanağı olmayan, "Assumed" sayılan alanların adları), `source`, `note` (yöntem ve modellenmeyenler: kaya ve 20 m'den küçük krater) |
| `candidates` | dizi | Her eleman bir aday ya da bölgedeki bir katalog sahası (aşağıda) |
| `validity` | metin | Her zaman `DERIVED` |

Her eleman:

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | metin | Aday için `cand-NN`, katalog sahası için `Site.id`. Aday kimliği konum alan bütün uç noktalarda `site_id` olarak geçer |
| `kind` | metin | `candidate` ya da `catalogue` |
| `name` | metin | `Candidate N` ya da saha adı |
| `lat_deg`, `lon_deg` | sayı | Pencere merkezi (katalog sahasında saha konumu) |
| `elevation_m` | sayı | Penceredeki ortalama yükseklik (1737,4 km küreye göre) |
| `mean_slope_deg`, `max_slope_deg`, `slope_std_deg` | sayı | Penceredeki 20 m hücrelerin eğim ortalaması, en büyüğü, standart sapması |
| `safe_cell_fraction` | sayı | Eğimi `slope_limit_deg` ya da altında ve kalıcı gölgede olmayan hücrelerin oranı |
| `psr_fraction` | sayı | Kalıcı gölgedeki hücrelerin oranı |
| `distance_to_psr_km` | sayı ya da `null` | Merkezden bölgedeki en yakın kalıcı gölge hücresine uzaklık; bölgede kalıcı gölge yoksa `null` |
| `has_terrain_horizon` | mantıksal | `data/horizons/<id>_2m.json` ve `_10m.json` var mı |
| `validity` | metin | Her zaman `DERIVED` |

Seçim: merkezi kalıcı gölgede olmayan ve ortalama eğimi sınırı aşmayan pencereler, önce `safe_cell_fraction` büyükten küçüğe, sonra `mean_slope_deg` küçükten büyüğe sıralanır; birbirine `min_separation_km` uzaklıktan yakın olanlar atlanır. Dayanağı olan tek eşik eğim 12°'dir ([dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 89).

### Saha önerisi (`RecommendRequest`, `RecommendResponse`)

`POST /api/recommend` ([#97](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/97), bölüm 4.4; [#100](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/100)). Bir bölgenin `Candidates` kayıtlarını dönem boyunca puanlar ve sıralar. Puan bir sıralama aracıdır, iniş sahası onayı değildir ([saha-puani.md](../design/saha-puani.md)). Örnek dosya `data/examples/recommend.json`.

İstek:

| Alan | Tip | Açıklama |
|---|---|---|
| `region` | metin | Varsayılan `mons-mouton` |
| `start_utc`, `end_utc` | metin | Dönem; `/api/events` ile aynı kurallar (en fazla 60 gün) |
| `mast_height_m` | sayı ya da `null` | Direk yüksekliği kuralı (aşağıda); `null` ise 2 m |
| `weights` | nesne | `sunlit`, `dark`, `earth`, `slope`, `roughness`, `psr_distance`; her biri 0 ile 1 arası, en az biri 0'dan büyük |
| `limits` | nesne | `max_slope_deg` (varsayılan 12; 0'dan büyük, en fazla 90) |
| `psr_preference` | metin | `far` (varsayılan, güç için uzak iyi) ya da `near` (bilim için yakın iyi) |
| `include_catalogue_sites` | mantıksal | Varsayılan `true`; `kind: "catalogue"` kayıtları da sıralanır |

Yanıt: `ranked` (önce puan alanlar puana göre büyükten küçüğe, eşitlikte kayıt sırası; sonra elenenler), `weights` ve `limits` (kullanılan değerler), `assumptions` (metin dizisi), `validity` (bütün sahaların en düşüğü).

`ranked[]` elemanı: `site_id`, `name`, `lat_deg`, `lon_deg`, `score` (0 ile 100, bir ondalık; elenen sahada `null`), `eliminated`, `eliminated_by` (bozulan sınırların adları, ör. `max_slope_deg`), `components`, `validity` (bileşenlerin en düşüğü).

`components[]` elemanı: `metric`, `value`, `unit`, `normalized` (0 ile 1, 1 en iyi, üç ondalık), `weight`, `validity`. Sıra ve ölçekler:

| `metric` | Kaynak | `unit` | `normalized` | Ölçek dayanağı |
|---|---|---|---|---|
| `sunlit_fraction` | Olay hesabı (`EventMetrics`) | `1` | Değerin kendisi | — |
| `longest_dark_hours` | Olay hesabı | `h` | `1 - değer / 336`, en az 0 | Assumed (saha-puani.md, 4: 14 gün) |
| `earth_visible_fraction` | Olay hesabı, `earth_criterion` `center` | `1` | Değerin kendisi | — |
| `mean_slope_deg` | `Candidates` kaydı | `deg` | `1 - değer / max_slope_deg` | Assumed |
| `slope_std_deg` | `Candidates` kaydı | `deg` | `1 - değer / bölgedeki en büyük` | Assumed (saha-puani.md, 4) |
| `distance_to_psr_km` | `Candidates` kaydı | `km` | `far`: `değer / bölgedeki en büyük`; `near`: `1 -` bunu. `null` (bölgede kalıcı gölge yok) `far` için 1, `near` için 0 | Assumed |

"Bölgedeki en büyük" bütün aday ve katalog kayıtları üzerinden alınır; `include_catalogue_sites` ölçeği değiştirmez. `score = 100 × Σ(weight × normalized) / Σ weight`, yanıttaki yuvarlanmış `normalized` değerlerinden hesaplanır; bu yüzden bileşenlerden yeniden hesaplanınca aynı sayı çıkar. Olay ölçülerinin `validity` değeri ufuktan gelir (arazi ufku `DERIVED`, düz ufuk `SYNTHETIC`); arazi ölçüleri kaydın `validity` değerini taşır.

Eleme: sahanın penceresindeki en büyük eğim (`Candidates.max_slope_deg`) `limits.max_slope_deg` değerini aşarsa saha elenir. 12° dayanaklıdır (No 89); başka bir değer `assumptions` içinde "Assumed" diye yazılır. Aynı saha, direk yüksekliği ve dönem için olay hesabı süreç içinde önbellekte tutulur; yalnızca ağırlık ya da sınır değişince yeniden hesaplanmaz.

### Yer istasyonu (`GroundStation`) ve Dünya bağlantısı (`EarthLink`)

Dünya tarafındaki görüş için ([#97](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/97), bölüm 4.2). `/api/ground-stations` yanıtı `GroundStation` dizisidir; kayıtlar `data/ground_stations.json` dosyasından olduğu gibi gelir.

| Alan | Tip | Açıklama |
|---|---|---|
| `id`, `name` | metin | `dsn-goldstone`, `dsn-madrid`, `dsn-canberra` |
| `lat_deg`, `lon_deg` | sayı | WGS 84 jeodezik enlem ve boylam. Boylam eksi 180 ile artı 180 arası |
| `elevation_m` | sayı | WGS 84 elipsoidi üstündeki yükseklik (deniz seviyesi değil) |
| `source` | nesne | `label` ve `url`: koordinatın resmî kaynağı |
| `validity` | metin | `MEASURED` |

Her kompleks için 70 m anten alınır: DSS 14, DSS 63 ve DSS 43, DSN 810-005, modül 301, Rev. P, Tablo 5. Kaynağı gösterilemeyen koordinat dosyaya yazılmaz.

`/api/earth-link` yanıtı (`EarthLink`):

| Alan | Tip | Açıklama |
|---|---|---|
| `min_station_elevation_deg` | sayı | İstasyonun Ay'ı görmüş sayılması için en düşük yükseklik açısı. Varsayılan 10, "Assumed" (aşağıda) |
| `stations` | dizi | Her istasyon: `id`, `name`, `in_view_fraction` (aralığın Ay'ın eşiğin üstünde olduğu payı, 0 ile 1 arası), `windows` (`start_utc`, `end_utc`) |
| `link_windows` | dizi | `start_utc`, `end_utc`, `mode`, `station_ids` |
| `assumptions` | metin dizisi | Modelin varsayımları ve sınırları, İngilizce; hiçbir zaman boş değil |
| `validity` | metin | `DERIVED` ile ufuk profilinin etiketinden düşük olanı; düz ufukta `SYNTHETIC` |

- `mode` değerleri: `direct` (sahadan Dünya görünüyor ve en az bir istasyon Ay'ı görüyor), `relay_needed` (sahadan Dünya görünmüyor), `no_station` (Dünya görünüyor ama hiçbir istasyon Ay'ı görmüyor). Röle uydusu modellenmez; `relay_needed` yalnızca doğrudan görüşün olmadığını söyler.
- `link_windows` aralığı boşluksuz ve çakışmasız kaplar: ilk pencere `start_utc`'de başlar, son pencere `end_utc`'de biter, her pencerenin sonu bir sonrakinin başıdır. Art arda gelen aynı kipteki parçalar birleştirilir, yani komşu iki pencerenin kipi hiçbir zaman aynı değildir. `direct` penceresinin `station_ids` alanı pencere boyunca Ay'ı gören bütün istasyonları ilk görünme sırasıyla verir; öteki iki kipte boş dizidir.
- Sahadan Dünya görünürlüğü `EventList` ile aynı hesaptır (aynı ufuk, aynı `earth_criterion`).
- İstasyon pencereleri `EventList` olayları gibi aranarak bulunur: 10 dakikalık ızgara, sonra her adımda yeni SPICE konumuyla ikiye bölme, bir saniyeye kadar. Izgara adımından kısa bir geçiş kaçabilir. Pencereler sorgu uçlarında kesilir.
- İstasyondan Ay yüksekliği Ay'ın merkezi için hesaplanır, sahanın kendisi için değil (fark Dünya'dan bakınca en çok yaklaşık 0,26 derece). Dünya yönelimi çekirdek setindeki `IAU_EARTH` modelidir: nütasyon ve UT1 düzeltmesi yok. JPL Horizons ile fark 36 anda en çok 0,071 derece; aynı hesap ITRF93 yönelimiyle Horizons'ı 0,0001 derece içinde tutuyor. 0,07 derecelik dönme hatası yaklaşık 17 saniyedir, pencere uçları bir dakikadan çok daha az kayar (`backend/tests/core/test_stations.py`). Atmosfer kırılması yok.
- Eşik dayanağı: DSN 810-005, modül 301, anten için mekanik sınırı yaklaşık 6 derece, gönderim (uplink) için en düşük açıyı 10,1 derece veriyor ([dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 61). Varsayılan 10 derece bu iki değerden doğrudan gelmediği için "Assumed" olarak yazılır; istekte başka değer verilirse `assumptions` bunu söyler.

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
- `utc_earliest` ve `utc_latest` olayın hata payını verir; hesaplanamadıysa `null`. İlk sürümde bu iki an, ufuk profili bir yay dakikası (derecenin altmışta biri) alçaltılarak ve yükseltilerek bulunur. Aralık bir güven aralığı değil, olayın ufuk hatasına duyarlılığının göstergesidir; arayüz de öyle adlandırır ([olaylar-ve-sureler.md](../design/olaylar-ve-sureler.md), bölüm 8).
- `criterion` olayın hangi ölçüte göre sayıldığını söyler: `center`, `first_limb` ya da `full_disk`.
- `metrics` alanları: `sunlit_fraction`, `longest_dark_hours`, `max_sun_elevation_deg`, `earth_visible_fraction`, `longest_earth_hidden_hours`.

Arayüzün "şu an" göstergesi için ayrı bir yapı (`NowStatus`): `utc`, `sun_up`, `hours_to_sunset`, `hours_to_sunrise`, `earth_up`, `hours_to_earthset`, `hours_to_earthrise`, `night_hours`, `criterion`, `mast_height_m`, `search_limited`, `validity` (ufuk profilinden devralınır). `night_hours`, Güneş batmışsa içinde bulunulan karanlık pencerenin, batmamışsa bir sonraki karanlık pencerenin toplam süresidir. Aranan süre içinde olay bulunamazsa değer `null` olur ve `search_limited` alanı `true` döner. Bu desen referans arayüzün iletişim penceresi yanıtından alındı ([comm-window.available.json](../../frontend-migrate/design-export/api-contract/fixtures/comm-window.available.json)). `criterion` Dünya alanlarının hangi ölçüte göre sayıldığını söyler (`EventList` ile aynı değerler).

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

`PowerSeries`: `panel_profile_id`, `mast_height_m`, `fixed_azimuth_deg` (yalnızca `vertical_fixed` için; kullanılan panel yönü, diğer tiplerde `null`), `samples` dizisi (`utc`, `incidence_cos`, `sun_visible_fraction`, `irradiance_w_m2`, `power_w`), `summary` nesnesi (`mean_power_w`, `energy_kwh`, `sunlit_fraction`, `longest_dark_hours`) ve `validity` (panel profili ile ufuk profilinin düşük olanı).

### Direk yüksekliği kuralı

`mast_height_m` şu sırayla belirlenir: istekteki ya da senaryodaki (`Scenario`) değer, yoksa panel profilindeki değer, o da yoksa 2. Değer sıfır ya da daha büyük olmalıdır; eksi değer HTTP 422 ile reddedilir.

- Arazi ufku (`method: terrain`) yalnızca 2 ve 10 m için kullanılır, çünkü hazır sahaların profilleri bu iki yükseklik için önceden hesaplanıyor ([ufuk-hesabi.md](../design/ufuk-hesabi.md)).
- Başka her yükseklikte (sıfır dahil) ve özel koordinatlarda hesap düz ufukla (`method: sphere`) yapılır ve sonuç `SYNTHETIC` etiketi alır. Doğrulama testleri ve Athena demosu bu yolla sıfır yükseklik kullanır ([dogrulama-plani.md](../design/dogrulama-plani.md), [athena-demosu.md](../design/athena-demosu.md)).

Kullanılan değer yanıtta `mast_height_m` alanında döner.

### Senaryo ve karşılaştırma

`Scenario`: `scenario_id`, `label`, `site_id` (ya da `lat_deg` ile `lon_deg`), `start_utc`, `end_utc`, `mast_height_m`, `panel_profile_id`. İsteğe bağlı iki alan: `fixed_azimuth_deg` (yalnızca `vertical_fixed` panel için kullanıcının seçtiği yön) ve `earth_criterion` (verilmezse `center`).

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
| `data/candidates.json` | `Candidates` (aday bölgeler; ufukları `data/horizons/cand-NN_<yükseklik>m.json`) |
| `data/panel_profiles.json` | `PanelProfile` dizisi |
| `data/reference_missions.json` | Geçmiş görev kayıtları ([gecmis-gorev-vakalari.md](../design/gecmis-gorev-vakalari.md)) |
| `data/ground_stations.json` | `GroundStation` dizisi (DSN kompleksleri, koordinat kaynaklarıyla) |

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

## Değişiklik notu

- 14 Kasım 2026, kullanım senaryolarıyla eşleştirme ([use-cases-and-scenarios.md](../product/use-cases-and-scenarios.md), [PLAN.md](../PLAN.md)): `NowStatus` yapısına `night_hours` eklendi (`UC-05`, gecenin uzunluğu). `Scenario` ve `PowerSeries` yapılarına `fixed_azimuth_deg` eklendi (`UC-06`, dik sabit panelde kullanıcının seçtiği yön). `Scenario` yapısına isteğe bağlı `earth_criterion` eklendi (`UC-07`). `utc_earliest` ve `utc_latest` alanlarının ilk sürümde nasıl bulunduğu yazıldı (`UC-10`; [PLAN.md](../PLAN.md), bölüm 12, karar 4).
- 15 Kasım 2026, [#98](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/98): `BodySeries` yapısı eklendi (`GET /api/body-series`; Güneş altı ve Dünya altı noktası, Dünya uzaklığı). Alan adları [#97](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/97) bölüm 4.1 ile aynı; örnek dosya `data/examples/body-series.json`.
- 15 Kasım 2026, [#103](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/103): `Candidates` yapısı eklendi (`GET /api/candidates`, `data/candidates.json`). Alanlar #97 bölüm 4.3 ile aynı; ek olarak `kind` (#97 eki) ve `method` içinde `stride_m`, `slope_limit_source`, `max_candidates`, `assumed`, `note`. Örnek dosya `data/examples/candidates.json` ve arayüz tipi bu alanları #109 ile alır. Aday kimlikleri (`cand-NN`) `site_id` olarak çözülür; `/api/sites` yalnızca katalog sahalarını döndürür.
- 15 Kasım 2026, [#99](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/99): `GroundStation` ve `EarthLink` yapıları eklendi (`GET /api/ground-stations`, `GET /api/earth-link`); `data/ground_stations.json` depoda tutulan dosyalara eklendi. Alan adları [#97](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/97) bölüm 4.2 ile aynı; örnek dosyalar `data/examples/earth-link.json` ve `data/examples/ground-stations.json` ([#108](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/108)). `link_windows` kaplama ve birleştirme kuralı, `station_ids` sırası ve varsayılan eşik yazıldı.
- 15 Kasım 2026, [#100](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/100): `RecommendRequest` ve `RecommendResponse` yapıları eklendi (`POST /api/recommend`). Alan adları [#97](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/97) bölüm 4.4 ve `data/examples/recommend.json` ile aynı. Ölçekler ve dayanakları, eleme kuralı (penceredeki en büyük eğim, `max_slope_deg` ile) ve `validity` kuralı "Saha önerisi" bölümünde.
- 15 Kasım 2026, [#122](https://github.com/ahmetkrkyn0/NasaSpaceApp_FEZA/issues/122): `BodySeries` yanıtına `earth_frame` ve `assumptions`, örneklere `earth_sub_lunar_lat_deg`, `earth_sub_lunar_lon_deg`, `earth_sub_solar_lat_deg`, `earth_sub_solar_lon_deg` eklendi (#97 4.1 eki). Dünya, Ay'dan göründüğü haliyle alınır: yönelimi bir ışık süresi (yaklaşık 1,3 s) öncesinden, Güneş Dünya'dan `LT+S` ile. Enlemler planetosentriktir (jeodezik değil; fark en çok 0,19°). Mevcut alanlar ve değerleri değişmedi. Örnek dosya `data/examples/body-series.json` canlı yanıttan yenilendi.
