# Veri Kaynakları Kataloğu

Araştırma notlarında önerilen özellikler için internetteki veri kaynakları: ne var, nerede, hangi formatta, ne büyüklükte, hangi lisansla ve gerçekten erişilebiliyor mu.

- **Tarih:** 14 Kasım 2026
- **Durum:** Araştırma. Hangi kaynakların kullanılacağı bir ADR ile kesinleşmeli ([docs/adr/](../../adr/README.md)).
- **Kapsam:** [light-heat-layer](../light-heat-layer/README.md), [lunar-horizon](../lunar-horizon/README.md), [solar-panel-model](../solar-panel-model/README.md), [rover-localization](../rover-localization/README.md), [ephemeris-rotation-ground-stations](../ephemeris-rotation-ground-stations/README.md), [csa-moon-exploration](../csa-moon-exploration.md) (bölüm 8), [rover-modelleme-ve-unreal-gecis](../rover-modelleme-ve-unreal-gecis.md), [zamanda-degisen-veri-hazirlama](../zamanda-degisen-veri-hazirlama.md).

**Doğrulama sütunu ne anlatıyor:**

| İşaret | Anlamı |
| --- | --- |
| ✅ okundu | Dosyadan veri gerçekten okundu ya da indirildi |
| ✅ 200 | Sayfa veya dosya yanıt verdi, dosya listesi ve boyutu okundu |
| ⚠️ | Kaynak var ama otomatik erişim engelli ya da bir ayrıntı doğrulanamadı |
| ❌ | Bulunamadı |

> Büyük veri dosyaları repoya konmaz ([AGENTS.md](../../../AGENTS.md) kural 6). Bu katalog yalnızca nereden indirileceğini söyler.

---

## Kısa özet

1. **Güney kutbu arazisi için tek adres PGDA 90 (Barker vd. 2023).**
   - İçerik: yükseklik, eğim, kalıcı gölge (PSR), hata, gölgeli kabartma ve pürüzlülük.
   - Kapsam ve çözünürlük: 60°G–90°G, 10 m'den 240 m'ye.
   - Format: bulut-optimize GeoTIFF (COG).
   - **Dosyalar 2–5 GB ama indirmek gerekmiyor:** 10×10 km'lik bir pencere doğrudan internetten ~8 saniyede okundu (aşağıdaki test).
2. **Aydınlanma ve Dünya görünürlüğünü doğrulama verisi hazır:** PGDA 69. Bunlar 18,6 yıllık ortalama Güneş ve Dünya görünürlüğü haritaları.
3. **Sıcaklık doğrulama verisi hazır:** Diviner'ın kutup ürünleri.
   - Yıllık ortalama ve maksimum sıcaklık.
   - Buzun kararlı olduğu derinlik.
   - Gece ve mevsim sıcaklıkları.
4. **Küratörlü saha listesi resmî tablodan kurulabilir:** NSSDC'nin "Ay'daki insan yapımı nesneler" tablosu Apollo 11, Chang'e 4/6, SLIM, IM-1 ve Blue Ghost koordinatlarını veriyor. Artemis III'ün 9 aday bölgesi USGS'te shapefile olarak var.
5. **Rover konumlama demosu için beklenmedik bir hazır veri var:** PGDA 90 içinde 9 tane gerçek LROC NAC görüntüsü ve her birinin LOLA'dan hesaplanmış "model" görüntüsü bulunuyor. Bu, [rover-localization](../rover-localization/README.md) notundaki "beklenen gölge haritası ile gerçek görüntüyü eşleştir" fikrinin birebir verisi.
6. **Kutuplarda olmayanlar:** Diviner kaya yoğunluğu ve H-parametresi haritaları yalnızca 70°K–70°G arasını kapsıyor. Kutuplarda bunların yerine LOLA pürüzlülük haritaları kullanılmalı.

---

## 1. Özellik → veri eşlemesi

| Özellik | Gerekli veri | Önerilen kaynak | Bölüm |
| --- | --- | --- | --- |
| Saha + tarih karşılaştırma (ana ürün) | Saha listesi, efemeris, DEM, aydınlanma | NSSDC tablosu, SPICE/Horizons, PGDA 90, PGDA 69 | 2, 3, 4, 5 |
| Güneş/Dünya'nın ufka göre görünümü, gün batımı sayacı | Efemeris + ufuk maskesi | SPICE kernel'leri, PGDA 90 (iki çözünürlük) | 3, 4 |
| Panel yönüne ve yüksekliğine göre güç eğrisi | Efemeris + direk yüksekliğinde ufuk | Ek veri yok (3 ve 4 yeterli) | 3, 4 |
| Kalıcı gölge (PSR) katmanı | PSR maskesi | PGDA 90 `LPSR`, PGDA 69 `LPSR` | 5 |
| Çok kriterli saha puanı | Eğim, pürüzlülük, PSR, aydınlanma, Dünya %, krater | PGDA 90 `LDSM`, `LDRM`, PGDA 69, Robbins krater veritabanı | 4, 5, 7 |
| Zemin sıcaklığı (heat1d) ve doğrulaması | Akı serisi + Diviner gözlemi | Diviner PRP, PCP, GDR_L2 | 6 |
| DTE iletişimi ve DSN boşlukları | İstasyon koordinatları | Ekibin `dsn_coverage.py` dosyası + DSN 810-005 | 8 |
| Röle modu (Queqiao, Moonlight) | Röle yörüngesi | Hazır veri bulunamadı, idealize model | 8 |
| Buz için "belirsiz" katmanı | Hidrojen ve buz haritaları | LEND, Lunar Prospector NS, M3, Diviner PRP buz derinliği | 9 |
| İniş yaklaşma profili, gölge uyarısı | DEM + gölgeli kabartma | PGDA 90 `LDEM` ve `_HILL` | 4 |
| Rover konumlama demosu | Yörünge görüntüsü + model görüntü + DEM | PGDA 90 NAC/MODEL çiftleri, ShadowCam, Yale BSC5 | 10 |
| Rover dijital ikizi (Unreal) | 3B arazi, araç modelleri, zemin parametreleri | Cesium Moon Terrain, NASA 3D Resources, mevcut Bekker değerleri | 11 |
| Harita arka planı (2-B) | Görüntü mozaiği | Moon Trek WMTS, USGS WAC mozaiği | 11 |

---

## 2. Saha kataloğu

| Kaynak | İçerik | Format | Doğrulama |
| --- | --- | --- | --- |
| [NSSDC – Ay'daki insan yapımı nesneler](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html) | İniş ve çarpma koordinatları | HTML tablo | ✅ okundu |
| [LROC – Chandrayaan-3 iniş sahası](https://www.lroc.asu.edu/images/1314) | 69,37°G, 32,32°D, 532 m | Görüntü sayfası | ✅ arama sonucu |
| [USGS – Artemis III aday bölgeleri ızgaraları](https://www.usgs.gov/data/down-selected-artemis-iii-candidate-landing-site-navigational-grids) | 9 bölge, 1 km / 100 m / 10 m ızgara, DOI 10.5066/P1MEQ6UK | Shapefile | ⚠️ ScienceBase otomatik isteklere 403 veriyor; tarayıcıdan indirilmeli |
| [PGDA 104](https://pgda.gsfc.nasa.gov/products/104) | 13 orijinal Artemis III bölgesi için 5 m Shape-from-Shading DEM'leri | GeoTIFF (Zenodo) | ✅ 200 |

**NSSDC'den okunan satırlar:**

| Görev | Tarih | Koordinat |
| --- | --- | --- |
| Apollo 11 LM | 20.07.1969 | 0,67416°K, 23,47314°D |
| Chang'e 4 | 03.01.2019 | 45,4561°G, 177,5885°D |
| SLIM | 19.01.2024 | 13,3160°G, 25,2510°D |
| IM-1 Odysseus | 22.02.2024 | 80,13°G, 1,44°D |
| Chang'e 6 | 01.06.2024 | 41,6385°G, 206,0148°D |
| Blue Ghost 1 | 02.03.2025 | 18,562°K, 61,810°D |

**Bulunamayanlar:** IM-2 Athena ve ispace Resilience bu tabloda yok. Bunlar için LROC görüntü sayfalarına bakılmalı.

---

## 3. Efemeris

| Kaynak | Ne | Doğrulama |
| --- | --- | --- |
| [NAIF generic kernels](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) | `naif0012.tls`, `pck00011.tpc`, `de440s.bsp`, `moon_pa_de440_200625.bpc`, `moon_de440_250416.tf` | ✅ okundu (Horizons ile 10⁻⁶° uyum) |
| [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) | `CENTER='coord@301'` ile Ay yüzeyinden az/el | ✅ okundu |
| Ekibin kodu: [lunar-navigator-hesaplar.zip](../ephemeris-rotation-ground-stations/lunar-navigator-hesaplar.zip) | Çapraz doğrulanmış az/el, doğuş/batış | Repoda |

Ayrıntılar: [zamanda-degisen-veri-hazirlama](../zamanda-degisen-veri-hazirlama.md), bölüm 3–4.

---

## 4. Arazi: DEM, eğim, gölgeli kabartma

### 4.1 PGDA 90 – A New View of the Lunar South Pole from LOLA (önerilen)

[pgda.gsfc.nasa.gov/products/90](https://pgda.gsfc.nasa.gov/products/90) · Barker vd. 2023 · COG, güney kutup stereografik, metre, MOON_ME (DE421)

| Önek | İçerik | Seçilmiş dosyalar (doğrulanmış boyut) |
| --- | --- | --- |
| `LDEM` | Yükseklik (m, 1737,4 km küreye göre); `_ERR` hata, `_HILL` gölgeli kabartma, `_EFFRES` etkin çözünürlük | `LDEM_83S_10MPP_ADJ.TIF` 5,1 GB · `LDEM_80S_20MPP_ADJ.TIF` 2,7 GB · `LDEM_75S_30MPP_ADJ.TIF` 2,8 GB · `LDEM_60S_60MPP_ADJ.TIF` 3,1 GB · ayrıca 40, 80, 120, 240 m |
| `LDSM` | Eğim (derece) ve hatası | `LDSM_80S_20MPP_ADJ.TIF` 3,8 GB (10 m'den 240 m'ye kadar) |
| `LPSR` | Kalıcı gölge maskesi | `LPSR_80S_20MPP_ADJ.TIF` 154 MB |
| `LDRM` | 100–1600 m tabanlarda pürüzlülük, eğim ve RMS sapma | 50 m ve 1000 m ızgaralarda 37 dosya |
| `LDEC` | Piksel başına LOLA ölçüm sayısı (güven göstergesi) | 8 dosya |
| `M…_20MPP.TIF`, `M…_MODEL.TIF` | 9 LROC NAC görüntüsü ve LOLA'dan hesaplanmış eşleri | Bölüm 10 |

**Uzaktan okuma testi (✅ okundu).** Shackleton çevresinde 10×10 km'lik pencere (500×500 piksel), indirmeden okundu:

| Dosya | Sonuç | Süre |
| --- | --- | --- |
| `LDEM_80S_20MPP_ADJ` | Yükseklik −2872 … −297 m | 7,7 s |
| `LDSM_80S_20MPP_ADJ` | Eğim 0 … 40°, ortalama 20,8° | 7,7 s |
| `LPSR_80S_20MPP_ADJ` | Pencerenin tamamı PSR | 0,9 s |

```python
import rasterio
from rasterio.windows import from_bounds
env = {"GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR", "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".TIF"}
url = "/vsicurl/https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ.TIF"
with rasterio.Env(**env), rasterio.open(url) as ds:
    # x, y: güney kutup stereografik metre (lunar-horizon notu, bölüm 9)
    window = from_bounds(x - 5000, y - 5000, x + 5000, y + 5000, ds.transform)
    elev = ds.read(1, window=window)
```

**Ufuk maskesi için öneri** ([lunar-horizon](../lunar-horizon/README.md) bölüm 4 ve 10):

| Bölge | Dosya |
| --- | --- |
| Yakın alan (saha çevresi ~5–10 km) | `LDEM_83S_10MPP` ya da `LDEM_80S_20MPP` |
| Uzak alan (~200 km) | `LDEM_75S_30MPP` ya da `LDEM_60S_60MPP` |

İkisi aynı üründen geldiği için çerçeve ve referans tutarlı.

### 4.2 Diğer DEM'ler

| Kaynak | Ne zaman | Doğrulama |
| --- | --- | --- |
| [PGDA 78](https://pgda.gsfc.nasa.gov/products/78) – 5 m saha DEM'leri (Site 1, 4, 7, 11) | Yerel 5 m detay. Yatay konum belirsizliği ~10–20 cm, dikey ~2–4 cm. Piksellerin ~%90'ı ara değerlenmiş. | ✅ 200 (dosya listesi sayfa metninde yok) |
| [PGDA 104](https://pgda.gsfc.nasa.gov/products/104) – Shape-from-Shading 5 m | Aydınlık alanlarda daha gerçekçi detay; 13 Artemis III bölgesi | ✅ 200 |
| [PDS LOLA kutup GDR](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/) | PGDA 90'ın eski PDS sürümü. `ldem_875s_5m`, `ldem_85s_10m`, `ldem_80s_20m` … (IMG ~1,8 GB, JP2 ~255 MB). Ölçek 0,5 m/DN, referans 1737,4 km. | ✅ 200 |
| [USGS SLDEM2015](https://astrogeology.usgs.gov/search/map/moon_lro_lola_selene_kaguya_tc_dem_merge_60n60s_59m) | 60°K–60°G, 59 m; Apollo gibi kutup dışı sahalar | ✅ 200 |
| [PGDA 106](https://pgda.gsfc.nasa.gov/products/106) | Yapay zekâyla 320 m'den 20 m'ye büyütülmüş DEM'ler (2026, deneysel) | ✅ 200, kullanılması önerilmez |

---

## 5. Aydınlanma, Dünya görünürlüğü, kalıcı gölge

| Kaynak | İçerik | Doğrulama |
| --- | --- | --- |
| [PGDA 69](https://pgda.gsfc.nasa.gov/products/69) (Mazarico vd. 2011) | `AVGVISIB_*`: 18,6 yıl ortalama Güneş görünürlüğü · `AVGVISIB_*_EARTH`: Dünya görünürlüğü · `LPSR_*`: PSR. 65°G/240 m, 75°G/120 m, 85°G/60 m. Örnek: `AVGVISIB_85S_060M_201608.IMG` 51 MB. Sunucu: `imbrium.mit.edu` (http). | ✅ 200 |
| PGDA 90 `LPSR_80S_20MPP_ADJ.TIF` | 20 m PSR maskesi | ✅ okundu |

**Kullanım:** Kendi ufuk ve aydınlanma hesabımızın sonucunu `AVGVISIB` ile piksel piksel karşılaştırmak. Bu, [lunar-horizon](../lunar-horizon/README.md) notunun 10. bölümündeki doğrulama adımıdır.

---

## 6. Sıcaklık (Diviner)

Kök: [PDS lro_diviner_derived1](https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/) (✅ 200)

| Klasör | İçerik | Kutup | Not |
| --- | --- | --- | --- |
| `data_derived_prp/dlre_prp_south.tab` | Polar Resource Product (Paige): yıllık ortalama ve maksimum yüzey sıcaklığı, buzun kararlı olduğu derinlik | ✅ | 2,88 milyon satırlık tablo, 605 MB |
| `data_derived_pcp/` (`diurnal`, `seasonal`) | Polar Cumulative Products (Williams vd. 2019): günlük ve mevsimlik sıcaklıklar | ✅ | Ayrıntılar [UCLA duyurusunda](https://www.diviner.ucla.edu/single-post/2020/07/20/new-diviner-seasonal-polar-data-products) |
| `data_derived_gdr_l2/` | Yıllara göre ızgaralanmış haritalar; kutuplar 240 m stereografik | ✅ | Gece ve gündüz ayrı |
| `data_derived_ghrm/` | Kaya yoğunluğu, regolit sıcaklığı, H-parametresi | ❌ yalnızca 70°K–70°G | Kutup sahalarında kullanılamaz |

- **heat1d girdisi:** heat1d, akı serisini bizim ufuk maskesi ve efemeris hesabımızdan alır. Diviner yalnızca **doğrulama** içindir.
- **Kutupta H-parametresi:** H haritası kutupları kapsamadığı için sabit H = 0,06 m kullanılır (Hayne 2017).

---

## 7. Saha puanı için ek katmanlar

| Kaynak | Ne | Doğrulama |
| --- | --- | --- |
| PGDA 90 `LDRM_*_ROUGH_*`, `_SLP_*` | 100–1600 m ölçeklerinde pürüzlülük ve eğim. Kutupta kaya riskinin vekili. | ✅ 200 |
| [Robbins krater veritabanı (USGS)](https://astrogeology.usgs.gov/search/map/moon_crater_database_v1_robbins) | ≥1 km kraterler, küresel | ✅ 200 |
| Diviner kaya yoğunluğu (GHRM, GDR_L3) | Kaya oranı | ⚠️ kutupları kapsamıyor |

---

## 8. İletişim: yer istasyonları ve röle

| Kaynak | Ne | Doğrulama |
| --- | --- | --- |
| Ekibin `scripts/dsn_coverage.py` dosyası | DSS-14 Goldstone, DSS-43 Canberra, DSS-63 Madrid, Malargüe, New Norcia, Cebreros, Misasa, IDSN Byalalu koordinatları | ✅ zip içinde okundu |
| [DSN 810-005, modül 301 (Coverage and Geometry)](https://deepspace.jpl.nasa.gov/dsndocs/810-005/301/301N.pdf) | DSN anten koordinatları ve görüş geometrisi için resmî kaynak | ✅ 200 |
| Röle (Queqiao-2, ESA Lunar Pathfinder) | Yörünge verisi | ❌ hazır veri seti bulunamadı; [CSA notunda](../csa-moon-exploration.md) önerildiği gibi idealize model |

---

## 9. Buz ve hidrojen (bilim katmanı, "belirsiz" etiketiyle)

| Kaynak | Ne | Doğrulama |
| --- | --- | --- |
| [LRO LEND (PDS)](https://pds-geosciences.wustl.edu/missions/lro/lend.htm) | Nötron sayımları ve hidrojen haritaları (Sanin vd. 2017) | ✅ 200 |
| [Lunar Prospector (PDS)](https://pds-geosciences.wustl.edu/missions/lunarp/index.htm) | Nötron spektrometresi | ✅ 200 |
| [M3 (PDS Imaging)](https://pds-imaging.jpl.nasa.gov/volumes/m3.html) | Yüzey buzu tespitlerinin ham verisi | ✅ 200 |
| Diviner PRP, buz derinliği sütunu | Termal olarak buzun kararlı olduğu derinlik | ✅ (bölüm 6) |
| [NASA SVS 4057](https://svs.gsfc.nasa.gov/4057) | LEND görselleştirmesi (eğitim modu) | Arama sonucu |

> ShadowCam'in 2026 sonucuna göre PSR'lerde yaygın yüzey buzu yok ([CSA notu](../csa-moon-exploration.md), bölüm 8). Bu katman "olası buz" değil, "belirsiz" olarak gösterilmeli.

---

## 10. Rover konumlama

| Kaynak | Ne | Doğrulama |
| --- | --- | --- |
| PGDA 90 `M<id>LE_20MPP.TIF` / `M<id>RE_20MPP.TIF` / `M<id>_20MPP_MODEL.TIF` | 9 gerçek LROC NAC görüntüsü (20 m'ye örneklenmiş) ve aynı geometride LOLA'dan hesaplanmış model görüntü. Görüntü kimlikleri: M1188426614, M1311409938, M1312308500, M139356343, M139729686, M151364517, M154940551, M155368056, M184288222. | ✅ 200 (dosya adları sayfadan) |
| [ShadowCam PDS](https://pds.shadowcam.asu.edu/) | PSR içi görüntüler | ✅ 200 |
| [Yale Bright Star Catalog (BSC5)](http://tdc-www.harvard.edu/catalogs/bsc5.html) | Yıldız izleyici simülasyonu için katalog | ✅ 200 |

**Neden önemli:** [rover-localization](../rover-localization/README.md) notunun 12. bölümündeki demo, yörünge görüntüsünü "o anki Güneş ile yeniden üretilmiş gölge haritası" ile eşleştirmeyi öneriyor. PGDA 90'daki NAC + MODEL çiftleri bu yöntemin gerçek veriyle sınanmış örneği. Demo hem gerçek görüntüyle hem de bizim modelimizle kurulabilir.

---

## 11. 3B sahne ve harita arka planı

| Kaynak | Ne | Lisans / koşul | Doğrulama |
| --- | --- | --- | --- |
| [Cesium Moon Terrain](https://cesium.com/platform/cesium-ion/content/cesium-moon-terrain) | LOLA arazisi + LROC görüntüsü, 3D Tiles. Kutuplarda ~5 m, orta enlemlerde ~60 m. Asset ID 2684829. | Cesium ion hesabı gerekir; ikincil kaynağa göre ticari olmayan kullanım ücretsiz | ⚠️ Bir forum gönderisi araziyi LOLA'dan ~2,5 km yüksek bildiriyor (doğrulanmadı); ufuk hesabında LOLA kullanın |
| [Cesium for Unreal](https://github.com/CesiumGS/cesium-unreal) | Unreal eklentisi | Apache-2.0 | ✅ GitHub API |
| [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources) | Apollo Lunar Module, LRO modelleri, Apollo 11–17 iniş sahası 3B baskı modelleri. VIPER ve LRV yok. | NASA medya yönergesi | ✅ GitHub API |
| [Moon Trek WMTS](https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/WMTSCapabilities.xml) | Küresel LROC WAC mozaiği karoları (2-B harita arka planı) | NASA | ✅ 200 (kutup projeksiyonlu katmanlar doğrulanmadı) |
| [USGS LROC WAC 100 m mozaiği](https://astrogeology.usgs.gov/search/map/moon_lro_lroc_wac_global_morphology_mosaic_100m) | İndirilebilir küresel mozaik | USGS, kamu malı | ✅ 200 |
| Zemin (Bekker) parametreleri | k_c, k_φ, c, φ | — | Zaten [rover modelleme notunda](../rover-modelleme-ve-unreal-gecis.md), bölüm 5 |

---

## 12. Araç lisansları (diğer notlarda "kontrol edilmeli" yazanlar)

GitHub API'den okundu (14 Kasım 2026):

| Araç | Lisans | Not |
| --- | --- | --- |
| heat1d | MIT | |
| HORAYZON | MIT | [light-heat-layer](../light-heat-layer/README.md) tablosunda "kontrol edilmeli" yazıyordu |
| astronomy-engine | MIT | |
| SpiceyPy | MIT | |
| astroquery | BSD-3-Clause | |
| Cesium for Unreal | Apache-2.0 | |
| Planetary-Code-Collection (Schörghofer) | GitHub lisans tespit edemedi | Lisans yoksa kod yeniden kullanılamaz; yalnızca referans olarak okunmalı |
| rasterio | GitHub otomatik tanıyamadı | LICENSE dosyası kontrol edilmeli |

Projenin lisansı Apache-2.0. MIT, BSD ve Apache lisansları bununla uyumlu.

---

## 13. Bulunamayanlar ve açık sorular

| Konu | Durum | Öneri |
| --- | --- | --- |
| Kutupta kaya yoğunluğu | Diviner yalnızca 70°K–70°G | LOLA pürüzlülüğü (`LDRM`) vekil olarak kullanılır |
| Kutupta H-parametresi | Harita yok | Sabit H = 0,06 m |
| Röle yörüngeleri | Veri seti yok | İdealize L2 halo / ELFO modeli |
| Artemis III bölge poligonları | ScienceBase otomatik indirmeyi engelliyor | Bir ekip üyesi tarayıcıdan indirsin |
| IM-2 Athena ve Resilience koordinatları | NSSDC tablosunda yok | LROC görüntü sayfaları |
| Chandrayaan-2 OHRC (ISRO PRADAN) | Kayıt gerektiriyor, denenmedi | Gerekirse sonra |
| Moon Trek kutup karoları | Doğrulanmadı | QuickMap ya da PGDA `_HILL` dosyaları |

---

## 14. Önerilen ilk adımlar

1. **Bölge seçimi.** PGDA 90'dan tek bir 20×20 km'lik pencere ile başlanmalı. Mons Mouton (−84,78°, 29,13° D) [solar-panel-model](../solar-panel-model/README.md) notunda zaten kullanılıyor.
2. **İndirme betiği.** Repo dışında çalışan, COG pencerelerini okuyup yerel `data/` klasörüne yazan küçük bir betik. Bu klasör `.gitignore`'a eklenmeli.
3. **Doğrulama zinciri.**
   - Ufuk ve aydınlanma sonucumuz → PGDA 69 `AVGVISIB`.
   - Sıcaklık sonucumuz → Diviner PRP.
4. **ADR.** Seçilen kaynaklar ve çerçeve (MOON_ME, DE421 uyumlu) bir ADR'ye yazılmalı.
