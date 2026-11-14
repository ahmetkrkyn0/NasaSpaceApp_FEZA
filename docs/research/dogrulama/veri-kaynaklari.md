# Doğrulama: Veri kaynakları kataloğu

Bu dosya [ANALIZ-OZETI.md](../ANALIZ-OZETI.md) belgesinin ekidir. Araştırma notundaki her kontrol edilebilir iddia, notun gösterdiği kaynak açılarak karşılaştırıldı.

- **Doğrulama tarihi:** 14 Kasım 2026
- **İncelenen dosyalar:** [README.md](../data-sources/README.md)
- **Not:** Kanıt sütunundaki alıntılar kaynaktaki haliyle bırakıldı. Sayılar ve birimler kaynakla aynı yazıldı.

| Etiket | Adet |
|---|---:|
| doğrulandı | 49 |
| kısmen doğru | 10 |
| yanlış | 1 |
| kaynağı yok | 6 |
| doğrulanamadı | 5 |
| **Toplam** | **71** |

Tarih: 14 Kasım 2026. Bu raporda her hüküm, bu oturumda açılan bir kaynağa (HTTP başlığı, sayfa, dizin listesi, etiket dosyası, GitHub API, canlı kod çalıştırma) dayanır.

## 1. Belge özeti

- Belge, ekibin diğer araştırma notlarında önerilen özellikler için gereken veri kaynaklarının kataloğudur: saha listesi, efemeris, arazi (PGDA 90), aydınlanma ve Dünya görünürlüğü (PGDA 69), Diviner sıcaklık ürünleri, saha puanı katmanları, yer istasyonları, buz/hidrojen, rover konumlama, 3B sahne ve araç lisansları.
- Ana öneri: güney kutbu arazisi için tek adres olarak PGDA 90 (Barker vd. 2023, COG). Dosyalar 2-5 GB olduğundan indirmek yerine /vsicurl/ ile 10x10 km pencere okunuyor.
- Doğrulama verisi olarak PGDA 69 (AVGVISIB, Güneş ve Dünya görünürlüğü) ve Diviner (PRP, PCP, GDR) öneriliyor; heat1d girdisi ekibin kendi ufuk ve efemeris hesabından gelecek, Diviner yalnızca doğrulama için.
- Saha listesi için NSSDC "insan yapımı nesneler" tablosu ve USGS Artemis III bölgeleri; rover konumlama demosu için PGDA 90 içindeki 9 NAC/MODEL görüntü çifti öneriliyor.
- Kutuplarda eksik olanlar: Diviner kaya yoğunluğu ve H-parametresi (70°K-70°G), röle yörüngeleri, Artemis III poligonlarının otomatik indirilmesi.
- Lisans bölümü, diğer notlarda "kontrol edilmeli" yazan araçların lisanslarını GitHub API'den okuyup Apache-2.0 proje lisansıyla uyumlu bulduğunu söylüyor.
- Bölüm 14, tek 20x20 km pencere ile başlama, repo dışı indirme betiği, doğrulama zinciri ve bir ADR öneriyor.
- Kapsam: belgedeki 28 adresin tamamı denendi; 2 adres (USGS veri sayfası ve ScienceBase/Zenodo) otomatik isteklere kapalı. Kendi hesabı olan üç iddia grubu (SPICE-Horizons uyumu, DSN koordinatları, okuma testi) yeniden hesaplandı.

## 2. İddia tablosu

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt | Not |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | NSSDC tablosu var; "iniş ve çarpma koordinatları", HTML tablo | Bölüm 2 | nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html | doğrulandı | Sayfa açıldı (HTTP 200, 77 KB). Sütunlar: Spacecraft, Landing Type, Date, Latitude Longitude. | Sayfa sonu: "Last Updated: 13 August 2025" |
| 2 | Apollo 11 LM 20.07.1969, 0,67416°K 23,47314°D | Bölüm 2 | NSSDC tablosu | doğrulandı | "Apollo 11 LM descent stage ... 20 July 1969 ... 0.67416 N, 23.47314 E" | - |
| 3 | Chang'e 4, 03.01.2019, 45,4561°G 177,5885°D | Bölüm 2 | NSSDC tablosu | doğrulandı | "Chang'e 4 ... 3 January 2019 ... 45.4561 S, 177.5885 E" | - |
| 4 | SLIM, 19.01.2024, 13,3160°G 25,2510°D | Bölüm 2 | NSSDC tablosu | doğrulandı | "SLIM ... 19 January 2024 ... 13.3160 S, 25.2510 E" | - |
| 5 | IM-1 Odysseus, 22.02.2024, 80,13°G 1,44°D | Bölüm 2 | NSSDC tablosu | doğrulandı | "Odysseus (IM-1) ... 22 February 2024 ... 80.13 S, 1.44 E" | - |
| 6 | Chang'e 6, 01.06.2024, 41,6385°G 206,0148°D | Bölüm 2 | NSSDC tablosu | doğrulandı | "Chang'e 6 ... 1 June 2024 ... 41.6385 S, 153.9852 W ... -41.6385, 206.0148" | Tablo batı boylamını da veriyor (153,9852°B = 206,0148°D) |
| 7 | Blue Ghost 1, 02.03.2025, 18,562°K 61,810°D | Bölüm 2 | NSSDC tablosu | doğrulandı | "Blue Ghost 1 ... 2 March 2025 ... 18.562 N, 61.810 E" | - |
| 8 | "IM-2 Athena ve ispace Resilience bu tabloda yok" | Bölüm 2 (Bulunamayanlar) ve Bölüm 13 | NSSDC tablosu | yanlış | Tabloda "Intuitive Machines 2, Lander, 6 March 2025, 84.7906 S, 29.1957 E" ve "Hakuto-R Mission 2, Impact, 5 June 2025, 60.4445 N, 4.588 W" satırları var. | Satırlar "Athena" ve "Resilience" adıyla değil görev adıyla (IM-2, Hakuto-R Mission 2) yazılı; Resilience "iniş" değil "çarpma" olarak geçiyor. Belgenin LROC'a yönlendirme önerisine gerek kalmıyor |
| 9 | Chandrayaan-3 sahası 69,37°G 32,32°D, 532 m (LROC) | Bölüm 2 | lroc.asu.edu/images/1314 | doğrulandı | Sayfa açıldı (lroc.im-ldi.com/images/1314 adresine yönleniyor): "69.3741°S, 32.32°E, 532 m elevation" | Belge "arama sonucu" demişti; sayfa doğrudan açılıyor. NSSDC tablosu da Chandrayaan 3'ü 69.3741 S, 32.32 E ile veriyor |
| 10 | USGS Artemis III aday bölgeleri: 9 bölge, 1 km/100 m/10 m ızgara, DOI 10.5066/P1MEQ6UK, shapefile | Bölüm 2, Kısa özet 4 | usgs.gov/data/down-selected-artemis-iii-... | doğrulanamadı | usgs.gov sayfası HTTP 403 ("Request blocked"). doi.org/10.5066/P1MEQ6UK sciencebase.gov/catalog/item/671a6fa8d34efed5620f89f8 adresine çözülüyor ama o da 403 (Cloudflare "Just a moment"). | Belge de aynı engeli kendisi bildiriyor. 9 bölge, ızgara adımları ve shapefile biçimi doğrulanamadı |
| 11 | PGDA 104: 13 orijinal Artemis III bölgesi için 5 m Shape-from-Shading DEM | Bölüm 2, 4.2 | pgda.gsfc.nasa.gov/products/104 | doğrulandı | "5 m/pix Shape-from-Shading digital elevation models (SDEMs) for the 13 original Artemis III Candidate Landing Regions" | Sayfa HTTP 200 |
| 12 | PGDA 104 biçimi "GeoTIFF (Zenodo)" | Bölüm 2 | pgda.gsfc.nasa.gov/products/104 | doğrulanamadı | Sayfa arşivi "Zenodo archive, doi 10.5281/zenodo.17954508" diye anıyor, "SDEM elevation raster" diyor; dosya biçimi yazmıyor. zenodo.org/api/records/17954508 HTTP 403. | Biçim Zenodo dosya listesinden doğrulanmalı |
| 13 | NAIF generic_kernels içinde naif0012.tls, pck00011.tpc, de440s.bsp, moon_pa_de440_200625.bpc, moon_de440_250416.tf | Bölüm 3 | naif.jpl.nasa.gov/pub/naif/generic_kernels/ | doğrulandı | Beşi de HTTP 200: tls 5257 B, tpc 131226 B, bsp 32,7 MB, bpc 12,9 MB, tf 19478 B. | Dosyalar lsk, pck, spk/planets, pck, fk/satellites alt klasörlerinde |
| 14 | SPICE kernel'leri Horizons ile 10^-6 derece uyumlu | Bölüm 3 | Ekip hesabı | doğrulandı | Yeniden hesaplandı: ekibin yöntemiyle (azlcpo, LT+S, MOON_ME, site -84,78 / 29,13) SPICE ile Horizons API (CENTER coord@301) karşılaştırıldı; 2026-12-01 00:00 UTC'den 12 saatlik adımla 5 epok: en büyük fark 3,7e-7 derece (Güneş en çok 9e-9, Dünya azimut en çok 3,7e-7). | Ekip betiğindeki str2et("2026-12-01T00:00:00 UTC") dizgesi bu CSPICE N0067 sürümünde SPICE(UNPARSEDTIME) hatası veriyor ("T" ayracı ile " UTC" son eki birlikte kabul edilmiyor). "2026-12-01 00:00:00 UTC" çalışıyor |
| 15 | Horizons API: CENTER='coord@301' ile Ay yüzeyinden az/el | Bölüm 3 | ssd-api.jpl.nasa.gov/doc/horizons.html | kısmen doğru | API belgesi CENTER için "coord" dizgesini (SITE_COORD ve COORD_TYPE ile) tanımlıyor; "@301" gövde eki bu sayfada yok. Canlı sorgu (CENTER='coord@301', SITE_COORD='29.13,-84.78,0', QUANTITIES=4) az/el döndürdü ($$SOE: 97.597 0.871). | Davranış çalışıyor, ama sözdizimi bu API sayfasında değil Horizons ana belgesinde |
| 16 | Ekibin lunar-navigator-hesaplar.zip dosyası: çapraz doğrulanmış az/el, doğuş/batış | Bölüm 3 | Repo | doğrulandı | Zip repoda var (19575 B): code/, scripts/crosscheck.py, scripts/crossings.py, crosscheck_out.csv, data/hz_*.txt. crosscheck_out.csv: Horizons ile bağımsız M3 yöntemi farkı ~2e-4 derece, M2 ~3e-3 derece. | Belgede sayısal uyum iddiası yok; zip içeriği iddiayı destekliyor |
| 17 | PGDA 90: Barker vd. 2023, COG, güney kutup stereografik, metre, MOON_ME (DE421) | Bölüm 4.1 başlık | pgda.gsfc.nasa.gov/products/90 | doğrulandı | "All TIF files are cloud-optimized GeoTiffs (COGs) with south polar stereographic X/Y coordinates in meters and in the MOON_ME reference frame of the JPL DE421 ephemeris"; "Barker et al., 2023 Planet. Sci. J., 4, 183" | rasterio ile açılınca: 30400x30400, 512x512 blok, overview 2/4/8, float32 |
| 18 | PGDA 90 kapsam 60°G-90°G, çözünürlük 10 m ile 240 m | Kısa özet 1, 4.1 | PGDA 90 sayfası | doğrulandı | Dosya adı kuralı: "latitude limit (80S, 83S, 75S or 60S)", "10MPP, 20MPP, 30MPP, 40MPP, 60MPP"; listede 240MPP, 120MPP, 80MPP dosyaları var. | 10 m ürün yalnızca 83°G-90°G'yi, 20 m ürün 80°G-90°G'yi kapsıyor |
| 19 | LDEM yüksekliği metre, 1737,4 km küreye göre | Bölüm 4.1 tablo | PGDA 90 sayfası | doğrulandı | Sayfa yalnızca "surface height (in meters)" diyor. GeoTIFF CRS (rasterio): SPHEROID "Moon (2015) - Sphere", 1737400 m; z aralığı -7297 ... 7027 m | Referans küre bilgisi sayfada değil dosya üst verisinde |
| 20 | LDEM ekleri _ERR, _HILL (gölgeli kabartma), _EFFRES (etkin çözünürlük) | Bölüm 4.1 | PGDA 90 sayfası | doğrulandı | "_ERR surface height error", "_HILL hillshade (45 deg altitude, 45 deg azimuth)", "_EFFRES effective resolution" | - |
| 21 | LDEM boyutları: 83S_10MPP 5,1 GB; 80S_20MPP 2,7 GB; 75S_30MPP 2,8 GB; 60S_60MPP 3,1 GB | Bölüm 4.1 | Dosya başlıkları | doğrulandı | Content-Length: 5116709568; 2696082051; 2802850273; 3089110093 bayt (ondalık GB) | Sayfa ikili (GiB) tavan yuvarlama kullanıyor (4,8G, 2,6G, 2,7G, 2,9G); belge ondalık GB'ye çevirmiş |
| 22 | LDSM_80S_20MPP_ADJ.TIF 3,8 GB; LDSM 10 m'den 240 m'ye | Bölüm 4.1 | Dosya başlığı | doğrulandı | Content-Length: 3778056355 bayt; LDSM_83S_10MPP ... LDSM_60S_240MPP dosyaları sayfada listeli | - |
| 23 | LPSR_80S_20MPP_ADJ.TIF 154 MB, kalıcı gölge maskesi | Bölüm 4.1, 5 | Dosya başlığı | doğrulandı | Content-Length: 154221202 bayt; sayfa "All PSRs (N=506349): LPSR_80S_20MPP_ADJ.TIF - PSR map" | - |
| 24 | LDRM: 100-1600 m tabanlarda pürüzlülük, eğim, RMS sapma; 50 m ve 1000 m ızgaralarda 37 dosya | Bölüm 4.1, 7 | PGDA 90 sayfası | doğrulandı | Sayfada ROUGH 10, SLP 10, RMSD 10, RGB 2, H 2, CLASS, AVGROUGH, SPSLP = 37 dosya; baz çizgileri 100/200/400/800/1600 m | Belge ROUGH_RGB, H, CLASS gibi ek ürünleri saymıyor ama toplam tutuyor |
| 25 | LDEC piksel başına LOLA ölçüm sayısı, 8 dosya | Bölüm 4.1 | PGDA 90 sayfası | doğrulandı | "LDEC ... number of LOLA spots per pixel"; LDEC_60S_240/120/60, 75S_30, 80S_80/40/20, 83S_10 = 8 dosya | - |
| 26 | 9 gerçek LROC NAC görüntüsü + LOLA'dan hesaplanmış MODEL eşleri; 20 m örnekleme; kimlikler M1188426614 ... M184288222 | Kısa özet 5, 4.1, Bölüm 10 | PGDA 90 sayfası | doğrulandı | "M*_20MPP_MODEL.TIF - Simulated image using the 20MPP LDEM (W/m^2)"; "M*E_20MPP.TIF - 20MPP NAC image map-projected onto the 20MPP LDEM (I/F)"; 9 kimlik de listede, her biri LE, RE ve MODEL dosyalı | Sayfada görüntüler I/F birimli ve 20 m'ye izdüşürülmüş |
| 27 | Uzaktan okuma testi: Shackleton çevresi 10x10 km (500x500 piksel); LDEM -2872...-297 m, LDSM 0...40° ort. 20,8°, LPSR tamamı PSR; 7,7 / 7,7 / 0,9 s | Bölüm 4.1 | Ekip testi | kısmen doğru | Yeniden çalıştırıldı (rasterio, aynı ortam ayarları). Yöntem çalışıyor: (500,500) pencere okundu, süreler LDEM 2,4-9,0 s, LDSM 2,5-7,0 s, LPSR 0,2-0,8 s. Belgenin pencere merkezi verilmediği için (0,0) kutup merkezli 10x10 km pencere okundu: LDEM -2556...1668 m, eğim 0,02...39,5° ort. 22,4°, LPSR ortalaması 0,23. | Belgedeki sayılar aynen tekrar edilemedi: pencere koordinatı belgede ve lunar-horizon bölüm 9'da yok; Shackleton merkezi bir kaynaktan alınamadı (IAU Gazetteer HTTP 500). Süre ve yöntem iddiası doğru, sayısal sonuçlar doğrulanamadı |
| 28 | Kod örneği (rasterio, /vsicurl/, from_bounds, GDAL_DISABLE_READDIR_ON_OPEN) | Bölüm 4.1 | Ekip kodu | doğrulandı | Aynı Env ayarları, aynı URL kalıbı ve from_bounds ile 500x500 pencere okundu | Belgedeki x, y değişkenleri tanımsız; kod parçası tam betik değil |
| 29 | PGDA 78: Site 1, 4, 7, 11; 5 m; yatay ~10-20 cm, dikey ~2-4 cm; ~%90 ara değerlenmiş; dosya listesi sayfa metninde yok | Bölüm 4.2 | pgda.gsfc.nasa.gov/products/78 | kısmen doğru | Sayfa: "Sites 1, 4, 7, 11", "~10 - 20 cm horizontally and ~2 - 4 cm vertically", "~90%" interpolated. Ancak sayfa artık Site 20, 23, 42, Haworth, Shoemaker, DM1/2, SL2/3, NPA-D dahil ~19 saha listeliyor ve indirme bağlantıları (TIF) sayfa metninde var. | Sayısal parametreler doğru; "Site 1, 4, 7, 11" ve "dosya listesi yok" eskimiş |
| 30 | PDS LOLA kutup GDR: ldem_875s_5m, 85s_10m, 80s_20m...; IMG ~1,8 GB, JP2 ~255 MB; ölçek 0,5 m/DN; referans 1737,4 km | Bölüm 4.2 | pds-geosciences.wustl.edu/.../lola_gdr/polar/ | doğrulandı | Dizin listesi: ldem_80s_20m.img 1.848.320.000 B, ldem_875s_5m.img 1.840.545.792 B; ldem_80s_20m.jp2 267.689.172 B (= 255 MiB). ldem_80s_20m.lbl: SCALING_FACTOR = 0.5, OFFSET = 1737400., "relative to a radius of 1737.4 km" | JP2 boyutları 18 MB ile 299 MB arası değişiyor; "~255 MB" yalnızca 80s_20m için |
| 31 | "PGDA 90'ın eski PDS sürümü" | Bölüm 4.2 | PDS GDR dizini | doğrulanamadı | .lbl: PRODUCT_VERSION_ID V2.0, "generated using preliminary LOLA data ... through mission phase LRO_ES_54", yayın 2016-2017. PGDA 90 sayfası PDS ürününü kendi öncülü olarak anmıyor. | İki ürün aynı kutup ızgara yapısını paylaşıyor; koordinat ayarlı (ADJ) PGDA 90 ayrı bir hesap |
| 32 | USGS SLDEM2015: 60°K-60°G, 59 m | Bölüm 4.2 | astrogeology.usgs.gov/search/map/moon_lro_lola_selene_kaguya_tc_dem_merge_60n60s_59m | doğrulandı | "covering latitudes within ±60°, at a horizontal resolution of 512 pixels per degree (~59 meters per pixel at the equator)"; indirme 22 GB | Sayfada "public domain" ibaresi var |
| 33 | PGDA 106: yapay zekâyla 320 m'den 20 m'ye DEM, 2026, deneysel | Bölüm 4.2 | pgda.gsfc.nasa.gov/products/106 | doğrulandı | "improving the resolution ... by a factor of 16x, from a 320 m/pix a priori DEM to a 20 m/pix"; "this work is a methodological demonstration"; Repasky vd., 2026, PSJ | "Kullanılması önerilmez" ekibin kararı |
| 34 | PGDA 69: AVGVISIB (Güneş görünürlüğü), AVGVISIB_*_EARTH (Dünya), LPSR; 18,6 yıllık ortalama; 65°G/240 m, 75°G/120 m, 85°G/60 m | Bölüm 5 | pgda.gsfc.nasa.gov/products/69 | doğrulandı | "averaged over hourly timesteps spanning 18.6 years"; "65S-90S, 240 m/px; 75S-90S, 120 m/px; 85S-90S, 60 m/px"; AVGVISIB_*_EARTH ve LPSR_* dosyaları listede | Sayfada kritik not: Dünya, diskinin herhangi bir parçası engellenmemişse "görünür" sayılıyor (DSN bağlantısı için "slightly optimistic"). Belge bu uyarıyı yazmıyor |
| 35 | AVGVISIB_85S_060M_201608.IMG 51 MB; sunucu imbrium.mit.edu (http) | Bölüm 5 | PGDA 69 sayfası | doğrulandı | http://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/AVGVISIB_85S_060M_201608.IMG HTTP 200, Content-Length 51166728 | Sayfa 2025-03-20'den beri GeoTIFF de sunuyor (pgda.gsfc.nasa.gov/data/MoonIllumination/AVGVISIB_85S_060M_201608.TIF, 34 MB, çalışıyor); sayfanın "_COG.TIF" bağlantısı için sunucu "PGDA - Not Found" sayfası döndürüyor |
| 36 | PGDA 90 LPSR 20 m PSR maskesi okundu | Bölüm 5 | Ekip testi | doğrulandı | rasterio ile LPSR_80S_20MPP_ADJ.TIF okundu: 500x500 pencere, değerler 0/1 | Bkz. okuma testi satırı |
| 37 | Diviner PDS kökü lro_diviner_derived1 | Bölüm 6 | pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/ | doğrulandı | HTTP 200; klasörler data_derived_prp, pcp, gdr_l2, gdr_l3, ghrm, gcp, rcp | Dizinde md5 dosyasının tarihi 9/21/2026 |
| 38 | PRP: dlre_prp_south.tab 2,88 milyon satır, 605 MB; Paige; yıllık ortalama ve maksimum yüzey sıcaklığı; buzun kararlı derinliği | Bölüm 6 | PDS data_derived_prp | kısmen doğru | .lbl: FILE_RECORDS = 2880000, RECORD_BYTES 210; dosya 604.800.210 B; PRODUCER_FULL_NAME "DAVID A. PAIGE"; ice_depth sütunu var. Ancak .xml: yıllık ortalama sıcaklık "calculated at a depth of 2 cm below the surface"; maksimum "calculated at the surface". | Ortalama sıcaklık yüzeyde değil 2 cm derinlikte |
| 39 | PCP (diurnal, seasonal): Williams vd. 2019, günlük ve mevsimlik sıcaklıklar; UCLA duyurusu | Bölüm 6 | PDS data_derived_pcp; diviner.ucla.edu blog | doğrulandı | Klasörler diurnal/{ltim,slon} ve seasonal/slon var. UCLA yazısı: "temperatures poleward of 80° latitude at fixed local times and fixed subsolar longitudes ... winter and summer seasons"; "From Williams et al., JGR, 2019" | Sayfa HTTP 200 |
| 40 | GDR_L2: yıllara göre ızgaralanmış; kutuplar 240 m stereografik; gece ve gündüz ayrı | Bölüm 6 | PDS data_derived_gdr_l2 | doğrulandı | Klasörler 2009-2016; 2016/polar/img/dgdr_jd_avg_poln_20160111d_240_img.img ("d" gündüz), ..._20160125n_240_img.img ("n" gece); "Polar Stereographic" | Aynı çerçeve: "MEAN EARTH/POLAR AXIS OF DE421" |
| 41 | GHRM (kaya yoğunluğu, regolit sıcaklığı, H-parametresi) yalnızca 70°K-70°G | Bölüm 6, Kısa özet 6, 13 | PDS data_derived_ghrm | doğrulandı | Dosyalar dghrm_*_70s70n_img.img (3,3 GB); XML'de enlem sınırları 70 / -70 | Sütun adlarının (ra_sam, tb6, tb7) kaya yoğunluğu ve H-parametresi karşılığı açıklama dosyasından tek tek doğrulanmadı |
| 42 | Kutupta sabit H = 0,06 m kullanılır (Hayne 2017) | Bölüm 6, 13 | Gösterilmemiş | kaynağı yok | Belge Hayne 2017'yi adıyla anıyor ama bağlantı vermiyor. | Değer bir kaynağa dayanıyor, o kaynak açılmadı |
| 43 | "Diviner kaya yoğunluğu (GHRM, GDR_L3): kutupları kapsamıyor" | Bölüm 7 | PDS | kısmen doğru | GHRM için doğru (70°K-70°G). GDR_L3'ün ise polar/ klasörü var (dgdr_tbol_avg_poln_..._240: bolometrik sıcaklık). GDR_L3 koleksiyon açıklamasında "Lunar surface rock abundance" atfı geçiyor ama kutup kaya yoğunluğu ürününü bulamadım. | GDR_L3'ün tamamı için "kutupları kapsamıyor" demek yanlış olur; kutup kaya yoğunluğunun bulunmadığı doğrulanamadı |
| 44 | Robbins krater veritabanı: >=1 km kraterler, küresel | Bölüm 7 | astrogeology.usgs.gov/search/map/moon_crater_database_v1_robbins | kısmen doğru | Sayfa: "approximately 1.3 million lunar impact craters ... approximately complete for all craters larger than about 1-2 km in diameter" (Robbins 2019; indirme 91,77 MB) | Eşik 1 değil 1-2 km |
| 45 | DSN 810-005 modül 301 (Coverage and Geometry): anten koordinatları ve görüş geometrisi | Bölüm 8 | deepspace.jpl.nasa.gov/dsndocs/810-005/301/301N.pdf | doğrulandı | PDF açıldı (3,68 MB, 48 sayfa); "DSN No. 810-005, 301, Rev. N, Issue Date: April 15, 2022"; Tablo 5 "Geodetic Coordinates for DSN Stations With Respect to the WGS 84 Ellipsoid"; DSS-14/43/63 ufuk maskesi şekilleri | Revizyon N (Nisan 2022); daha yeni revizyon aranmadı |
| 46 | dsn_coverage.py: DSS-14, DSS-43, DSS-63 koordinatları | Bölüm 8 | Ekip betiği; DSN 301 | doğrulandı | Yeniden hesaplandı: DSS-14 35°25'33.24312" = 35,425901°, 243°6'37.66244" = 243,110462°, 1001,390 m; DSS-43 -35,402424°, 148,981267°, 688,867 m; DSS-63 40,431210°, 355,751991°, 864,816 m. Betikteki değerler (1,001 / 0,689 / 0,865 km) aynı. | Belge "zip içinde okundu" diyor; zip repoda (scripts/dsn_coverage.py) |
| 47 | dsn_coverage.py: Malargüe, New Norcia, Cebreros, Misasa, IDSN Byalalu koordinatları | Bölüm 8 | Gösterilmemiş | kaynağı yok | Betikte (ör. Malargüe -35,776 / -69,398 / 1,5 km) var; belge bu istasyonlar için kaynak vermiyor, DSN 301 de kapsamıyor. | Tekrar edilmedi |
| 48 | Röle yörüngesi (Queqiao-2, Lunar Pathfinder) için hazır veri seti yok | Bölüm 8, 13 | Yok | doğrulanamadı | "Yok" iddiası; derin arama yapılmadı. | Görev talimatı gereği |
| 49 | LRO LEND (PDS): nötron sayımları ve hidrojen haritaları (Sanin vd. 2017) | Bölüm 9 | pds-geosciences.wustl.edu/missions/lro/lend.htm | kısmen doğru | Sayfa HTTP 200: "LEND is the Lunar Exploration Neutron Detector, which measures the flux of neutrons from the lunar surface"; EDR/RDR veri kümeleri. "hydrogen" ve "Sanin" sayfada hiç geçmiyor. | Nötron verisi doğru; hidrojen haritası ve Sanin 2017 atfı bu sayfada yok |
| 50 | Lunar Prospector (PDS): nötron spektrometresi | Bölüm 9 | pds-geosciences.wustl.edu/missions/lunarp/index.htm | doğrulandı | Sayfada "neutron spectrometer, an alpha particle spectrometer, ..."; görev 31 Temmuz 1999'da güney kutba çarpma ile bitiyor | Sayfa HTTP 200 |
| 51 | M3 (PDS Imaging): yüzey buzu tespitlerinin ham verisi | Bölüm 9 | pds-imaging.jpl.nasa.gov/volumes/m3.html | kısmen doğru | Sayfa M3 hacimlerini listeliyor (CH1M3_0001 ...: "raw and reduced image data, Level 0 and Level 1B"). "ice" sayfada geçmiyor. | Ham M3 verisi doğru; buz tespitleri bu sayfada yok |
| 52 | NASA SVS 4057: LEND görselleştirmesi | Bölüm 9 | svs.gsfc.nasa.gov/4057 | doğrulandı | "LEND Looks for Water at the South Pole": "LEND instrument integrates neutron counts over the three years from July 2009 to June 2012"; yayın 2013-03-25 | Belge "arama sonucu" demişti; sayfa açılıyor. "(eğitim modu)" ifadesi sayfada yok |
| 53 | "ShadowCam 2026 sonucuna göre PSR'lerde yaygın yüzey buzu yok" | Bölüm 9 uyarı kutusu | Belgenin kendi CSA notu | kaynağı yok | Dış kaynak gösterilmemiş, yalnızca iç bağlantı (csa-moon-exploration.md bölüm 8). | İlgili notun doğrulayıcısına bırakıldı |
| 54 | ShadowCam PDS: PSR içi görüntüler | Bölüm 10 | pds.shadowcam.asu.edu | kısmen doğru | Adres HTTP 200, pds.shadowcam.im-ldi.com adresine yönleniyor; kök dizin "bundle_kplo-shadowcam.xml" ("KPLO ShadowCam Data Archive") listeliyor. PSR ifadesi sayfada yok. | Alan adı değişmiş; belgedeki bağlantı yönleniyor |
| 55 | Yale Bright Star Catalog (BSC5), yıldız izleyici simülasyonu için | Bölüm 10 | tdc-www.harvard.edu/catalogs/bsc5.html | doğrulandı | "version 5 of the Yale Bright Star Catalog of 9,110 stars ... complete to V=7" | Sayfa HTTP 200; "yıldız izleyici simülasyonu" ekibin kullanım önerisi |
| 56 | Cesium Moon Terrain: LOLA + LROC, 3D Tiles; kutuplarda ~5 m, orta enlemlerde ~60 m; Asset ID 2684829 | Bölüm 11 | cesium.com/platform/cesium-ion/content/cesium-moon-terrain | kısmen doğru | Sayfa "Cesium Moon" adıyla açılıyor (yönlendirme), 2684829 sayfada var. Format "3D Tiles". Orta enlem arazi 60N-60S "59 m"; kuzey kutbu 87,5N-90N "5 m"; 75-90 enlem için 30 m, 80-90 için 20 m, 85-90 için 10 m katmanlar. Görüntü: WAC 100 m, kutuplarda NAC 1 m. | Ad değişmiş. "~60 m orta enlem" 59 m'ye uyuyor; çözünürlük enlem bandına göre kademeli (belge yalnızca iki uç değeri veriyor) |
| 57 | Cesium ion hesabı gerekir | Bölüm 11 | Cesium sayfası | doğrulandı | "Sign up for a Cesium ion account to use this 3D tileset in your custom applications." | - |
| 58 | Ticari olmayan kullanım ücretsiz ("ikincil kaynağa göre") | Bölüm 11 | Gösterilmemiş | kaynağı yok | Cesium sayfasında fiyat ya da lisans metni bulunmadı. | Belge de ikincil kaynak diyor |
| 59 | Bir forum gönderisi araziyi LOLA'dan ~2,5 km yüksek bildiriyor | Bölüm 11 | Gösterilmemiş | kaynağı yok | Gönderi bağlantısı yok; belge "doğrulanmadı" diyor. | Belge kendisi uyarıyor |
| 60 | Cesium for Unreal Apache-2.0 | Bölüm 11, 12 | GitHub API | doğrulandı | api.github.com/repos/CesiumGS/cesium-unreal: spdx_id "Apache-2.0" | - |
| 61 | NASA 3D Resources: Apollo Lunar Module, LRO, Apollo 11-17 iniş sahası 3B baskı modelleri; VIPER ve LRV yok | Bölüm 11 | github.com/nasa/NASA-3D-Resources | doğrulandı | git ağacı (1583 yol): "3D Models/Apollo Lunar Module/Apollo Lunar Module.glb", "Lunar Reconnaissance Orbiter (A)" ve "(B)", "3D Printing/Apollo 11/12/14/15/16/17 - Landing Site" (.stl); viper/lrv/lunar rover içeren yol yok | Apollo 13 yok (iniş yapmadı) |
| 62 | NASA 3D Resources lisansı: NASA medya yönergesi | Bölüm 11 | GitHub README | doğrulandı | README: "These assets are free and without copyright"; kullanım yönergesi bağlantısı nasa.gov/nasa-brand-center/images-and-media. GitHub API lisans: yok | Lisans dosyası yok, yönerge README'de |
| 63 | Moon Trek WMTS: küresel LROC WAC mozaiği karoları; kutup projeksiyonlu katmanlar doğrulanmadı | Bölüm 11, 13 | trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/WMTSCapabilities.xml | doğrulandı | HTTP 200; katman LRO_WAC_Mosaic_Global_303ppd_v02, sınırlar -180 -90 / 180 90, SupportedCRS urn:ogc:def:crs:EPSG::104903 | Bu katman EQ (global); kutup katmanı açılmadı |
| 64 | USGS LROC WAC 100 m mozaiği: indirilebilir, kamu malı | Bölüm 11 | astrogeology.usgs.gov/search/map/moon_lro_lroc_wac_global_morphology_mosaic_100m | doğrulandı | Sayfa: "Global Mosaic, Raster Data", "public domain", indirme 5,5 GB | Sayfa HTTP 200 |
| 65 | Lisanslar: heat1d MIT, HORAYZON MIT, astronomy-engine MIT, SpiceyPy MIT, astroquery BSD-3-Clause | Bölüm 12 | GitHub API (depo adresi belgede yok) | doğrulandı | GitHub API spdx_id: phayne/heat1d MIT; ChristianSteger/HORAYZON MIT; cosinekitty/astronomy MIT; AndrewAnnex/SpiceyPy MIT; astropy/astroquery BSD-3-Clause | Belge depo adreslerini yazmıyor; depolar adla bulundu |
| 66 | Planetary-Code-Collection (Schörghofer): GitHub lisans tespit edemedi | Bölüm 12 | GitHub API | doğrulandı | nschorgh/Planetary-Code-Collection: license null; kök klasörde LICENSE yok (CITATION.cff, README.md, UserGuide.pdf ...) | "Lisans yoksa yeniden kullanılamaz" hukuki yorum, kaynağı yok |
| 67 | rasterio: GitHub otomatik tanıyamadı, LICENSE kontrol edilmeli | Bölüm 12 | GitHub API | doğrulandı | spdx_id NOASSERTION ("Other"). LICENSE.txt: "Copyright (c) 2013-2021, Mapbox ... Redistribution and use in source and binary forms" (BSD tipi) | Kontrol edildi: BSD tipi izin; kesin SPDX etiketi belgeye yazılmalı |
| 68 | Projenin lisansı Apache-2.0; MIT, BSD, Apache uyumlu | Bölüm 12 | Gösterilmemiş | kaynağı yok | Belge kaynak göstermiyor. Bağımsız kontrol: repo kökündeki LICENSE dosyası "Apache License Version 2.0". | Proje lisansı doğru; "uyumlu" hukuki genel değerlendirme, kaynak gösterilmemiş |
| 69 | Artemis III poligonları: ScienceBase otomatik indirmeyi engelliyor | Bölüm 2, 13 | USGS / ScienceBase | doğrulandı | usgs.gov sayfası ve doi.org/10.5066/P1MEQ6UK yönlendirmesi (sciencebase.gov) HTTP 403 verdi | Belgenin gözlemi yeniden üretildi |
| 70 | Chandrayaan-2 OHRC (ISRO PRADAN) kayıt gerektiriyor, denenmedi | Bölüm 13 | Yok | doğrulanamadı | Belge de denemediğini söylüyor. | Denenmedi |
| 71 | Çerçeve: MOON_ME, DE421 uyumlu (ADR'ye yazılacak) | Bölüm 14 adım 4, 3 | NAIF moon_de440_250416.tf | doğrulandı | FK: "MOON_ME  MOON_ME_DE440_ME421  FIXED  31001"; PGDA 90 sayfası "MOON_ME reference frame of the JPL DE421 ephemeris" | DE440 kernel'leri ile DE421 tabanlı MOON_ME uyumu FK ile sağlanıyor |

## 3. Öneriler ve tasarım kararları (iddia sayılmadı)

- Güney kutup arazisi için tek kaynak PGDA 90; ufuk maskesinde yakın alan için LDEM_83S_10MPP veya LDEM_80S_20MPP, uzak alan (~200 km) için LDEM_75S_30MPP veya LDEM_60S_60MPP.
- DEM dosyalarını indirmeden /vsicurl/ ile pencere okumak; repo dışı indirme betiği, yerel `data/` klasörü `.gitignore`'da.
- Ufuk ve aydınlanma sonucunu PGDA 69 AVGVISIB ile piksel piksel karşılaştırmak; sıcaklık sonucunu Diviner PRP ile karşılaştırmak.
- heat1d girdisi ekibin kendi ufuk ve efemeris hesabı olacak, Diviner yalnızca doğrulama.
- Kutupta H-parametresi için sabit H = 0,06 m; kutupta kaya riski için LDRM pürüzlülüğünü vekil kullanmak.
- Röle modu için hazır veri yerine idealize L2 halo / ELFO modeli.
- Buz katmanını "olası buz" değil "belirsiz" olarak göstermek.
- PGDA 90 NAC/MODEL çiftleriyle rover konumlama demosu kurmak.
- PGDA 106 (yapay zekâyla büyütülmüş DEM) kullanılmamalı.
- Cesium Moon Terrain'i 3B görsel için kullanıp ufuk hesabında LOLA kullanmak.
- Artemis III poligonlarını bir ekip üyesinin tarayıcıdan indirmesi.
- Başlangıç bölgesi olarak Mons Mouton (-84,78°, 29,13°D), tek 20x20 km pencere; seçilen kaynaklar ve çerçeve (MOON_ME, DE421 uyumlu) bir ADR'ye yazılmalı.
- Planetary-Code-Collection yalnızca referans olarak okunmalı (lisans yok).

## 4. Belge içi çelişkiler ve eskimiş bilgiler

- Bölüm 2 ve 13 "IM-2 Athena ve ispace Resilience NSSDC tablosunda yok" diyor; tabloda "Intuitive Machines 2" (84,7906°G, 29,1957°D, 6 Mart 2025) ve "Hakuto-R Mission 2" (çarpma, 5 Haziran 2025, 60,4445°K, 4,588°B) satırları var. Bölüm 13'teki "LROC sayfalarına bakılmalı" önerisi gereksiz.
- Bölüm 4.2 PGDA 78 için "Site 1, 4, 7, 11" ve "dosya listesi sayfa metninde yok" diyor; sayfada artık ~19 saha ve TIF bağlantıları listeli.
- Bölüm 6 PRP için "yıllık ortalama yüzey sıcaklığı" diyor; etiket dosyası ortalamayı 2 cm derinlikte tanımlıyor (maksimum yüzeyde).
- Bölüm 7 "GDR_L3 kutupları kapsamıyor" ima ediyor; GDR_L3'ün polar/ klasörü var (bolometrik sıcaklık). Yalnızca GHRM 70°K-70°G ile sınırlı.
- Bölüm 9 LEND satırındaki "hidrojen haritaları (Sanin vd. 2017)" ifadesi gösterilen PDS sayfasında yok; M3 satırındaki "yüzey buzu tespitleri" ifadesi de yok.
- Bölüm 4.1 okuma testi sayıları (-2872...-297 m, tamamı PSR) pencere koordinatı verilmediği için tekrar edilemedi; belge x, y için lunar-horizon bölüm 9'a atıf yapıyor ama o bölüm koordinat vermiyor.
- Bölüm 5: PGDA 69 sayfası "Dünya, diskinin herhangi bir parçası engellenmemişse görünür sayılır; DSN gibi bağlantılar için hafif iyimser" uyarısını içeriyor. Belge AVGVISIB_EARTH'ü doğrulama verisi olarak öneriyor ama bu uyarıyı aktarmıyor.
- Bölüm 5: PGDA 69 sayfasının "_COG.TIF" bağlantıları (denenen AVGVISIB_85S_060M_201608_COG.TIF) PGDA sunucusunda "Not Found" sayfası döndürüyor; GeoTIFF (.TIF, 34 MB) çalışıyor. Belge IMG öneriyor, GeoTIFF seçeneğini anmıyor.
- Bölüm 11: Cesium sayfa adı "Cesium Moon Terrain" yerine "Cesium Moon" olmuş (yönlendirme çalışıyor). ShadowCam PDS alan adı pds.shadowcam.im-ldi.com'a taşınmış; LROC alan adı lroc.im-ldi.com'a taşınmış (yönlendirmeler çalışıyor).
- Ekip betiği `site_azel_spice.py` içindeki `sp.str2et("2026-12-01T00:00:00 UTC")` dizgesi CSPICE N0067'de hata veriyor (zip içinde; belge metninde değil). Bölüm 3'ün " okundu (10^-6° uyum)" sonucu bu düzeltmeyle (boşluklu biçim) yeniden üretildi.
- Kısa özet "Dosyalar 2-5 GB" diyor; seçilen LDEM dosyaları için doğru (2,7-5,1 GB). Aynı ürün ailesinde _EFFRES/_ERR dosyaları 7,5 GB'a, LDSM_83S_10MPP 7,1 GB'a çıkıyor.

## 5. Etiket sayıları

- doğrulandı: 49
- kısmen doğru: 10
- yanlış: 1
- kaynağı yok: 6
- doğrulanamadı: 5
- Toplam iddia satırı: 71

## 6. Açılamayan kaynaklar

| Adres | Hata |
| --- | --- |
| https://www.usgs.gov/data/down-selected-artemis-iii-candidate-landing-site-navigational-grids | HTTP 403, "Request blocked" (2 deneme) |
| https://doi.org/10.5066/P1MEQ6UK (sciencebase.gov/catalog/item/671a6fa8d34efed5620f89f8 adresine çözülüyor) | HTTP 403, Cloudflare "Just a moment" (JSON uç noktası dahil 2 deneme) |
| https://zenodo.org/api/records/17954508 (PGDA 104 arşivi) | HTTP 403 |
| Hayne 2017 (H = 0,06 m) | Belge bağlantı vermiyor, açılmadı |
| Cesium forum gönderisi (LOLA'dan ~2,5 km yüksek) | Belge bağlantı vermiyor |
| Chandrayaan-2 OHRC (ISRO PRADAN) | Belge de denemedi, ben de denemedim |
| csa-moon-exploration.md bölüm 8 (ShadowCam 2026 sonucu) | İç bağlantı, başka doğrulayıcının kapsamında |

Not: belgedeki diğer tüm adresler HTTP 200 döndürdü (bazıları taşınmış alan adına yönlendirerek: lroc.asu.edu, pds.shadowcam.asu.edu, cesium-moon-terrain).

## Yeniden hesaplama kayıtları

- SPICE-Horizons: kernel'ler NAIF'ten indirilip (45 MB) spiceypy ile yüklendi; betik doğrulama sırasında yazılan deneme betiği `spice_cmp.py` (depoda yok). Sonuç: 5 epokta en büyük fark 3,7e-7 derece.
- Uzaktan okuma: betikler doğrulama sırasında yazılan deneme betiği `cogtest.py` (depoda yok), `cogtest2.py`, `crs.py` (rasterio, /vsicurl/).
- DSN koordinatları: DSN 301 Rev. N Tablo 5 ile ekip betiğindeki değerler elle dönüştürülüp karşılaştırıldı.
- Lisanslar: doğrulama sırasında yazılan deneme betiği `gh.py` (depoda yok) (GitHub REST API, kimlik doğrulamasız).
