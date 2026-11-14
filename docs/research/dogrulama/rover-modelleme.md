# Doğrulama: Rover modelleme ve Unreal

Bu dosya [ANALIZ-OZETI.md](../ANALIZ-OZETI.md) belgesinin ekidir. Araştırma notundaki her kontrol edilebilir iddia, notun gösterdiği kaynak açılarak karşılaştırıldı.

- **Doğrulama tarihi:** 14 Kasım 2026
- **İncelenen dosyalar:** [rover-modelleme-ve-unreal-gecis.md](../rover-modelleme-ve-unreal-gecis.md), [ay-rover-dijital-ikiz.pdf](../ay-rover-dijital-ikiz.pdf)
- **Not:** Kanıt sütunundaki alıntılar kaynaktaki haliyle bırakıldı. Sayılar ve birimler kaynakla aynı yazıldı.

| Etiket | Adet |
|---|---:|
| doğrulandı | 9 |
| kısmen doğru | 7 |
| yanlış | 0 |
| kaynağı yok | 24 |
| doğrulanamadı | 1 |
| **Toplam** | **41** |

Dosyalar:
- A = `docs/research/rover-modelleme-ve-unreal-gecis.md` (367 satır)
- B = `docs/research/ay-rover-dijital-ikiz.pdf` (314 satır, PDF metni)

Çalışma kuralı: Belge çoğu iddiaya kaynak göstermiyor (yalnızca "Bekker", "Wong'un kitabı ve Apollo verileri" anılıyor). Kaynak gösterilmeyen iddialar "kaynağı yok" etiketi aldı; Not sütununda bağımsız kaynağın ne dediği yazıldı. Bekker-Wong formülleri ve regolit değerleri "Bekker/Wong" atfı taşıdığı için standart literatürle (açık erişimli NASA NTRS belgesi ve UMD ders notu) karşılaştırıldı. Wong'un kitabının kendisi ücretli olduğu için açılamadı; eşleşme bağımsız ikincil kaynaklarla yapıldı.

## 1. Belge özeti

- Blender'da modellenen rover'ı Unreal Engine 5'e (Chaos Vehicles) taşıyıp Ay koşullarında çalışan bir "dijital ikize" dönüştürme notları. Cesium for Unreal ile LOLA DEM tabanlı arazi de kapsanıyor.
- Karar: Blender (model, rig), Unreal 5 (fizik, görselleştirme), Cesium for Unreal (büyük ölçekli Ay arazisi), veri 5 m/px LOLA DEM. Stack kararı ADR'ye yazılmalı.
- Rover simülasyonu ana konu değil, iniş sahası seçimini destekleyen özellik; 3 aşamalı (düz zemin, gerçek arazi, çoklu rover).
- FBX yalnızca geometri/iskelet taşır; fizik, sürüş, süspansiyon, Ay yerçekimi (-162 cm/s²), regolit Unreal'da kurulur. Skeletal Mesh, bone hiyerarşisi `root>chassis>rocker>bogie>wheel`.
- Ay/Dünya farkı: yerçekimi parametresi, atmosfer yok (drag 0), yay sertliği ~1/6, deforme olan zemin için Bekker-Wong terramechanics (batma, sıkıştırma direnci, Mohr-Coulomb itiş, Janosi-Hanamoto kayma, net çekiş), regolit parametre tablosu.
- Rocker-bogie: Chaos'ta 6 bağımsız tekerlek + Animation Blueprint ile görsel kol açıları (önerilen); mekanik constraint yaklaşımı önerilmiyor.
- Cesium 3D Tileset (tüm Ay, bölge seçimi) ile Unreal Landscape (sürüş) iş bölümü, Sub-Level + Cartographic Polygon geçişi, 5 m/px DEM için upsample + prosedürel kaya uyarısı.

### A ile B arasındaki farklar
Sayılar, formüller ve tablolar iki halde aynı. Fark yalnızca ek cümlelerde:
- B, ADR notuna "böylece tüm ekip ve ajanlar aynı kararı görür" ekliyor; A'da yok.
- B, LRV notuna "Jüriye anlatılabilecek güçlü bir detay." ekliyor; A'da yok.
- B, FBX bölümünün başında "Rover'ın nasıl sürüleceği, ne kadar ağır olduğu ve Ay zemininde nasıl kaydığı Unreal'da tanımlanır." cümlesini içeriyor; A'da yok.
- B, Chaos için "Dışarıdan bir şey eklenmiyor." ve regolit için "Tekerlek batar ve zemini kaydırır." cümlelerini içeriyor; A'da yok.
- A, başta "literatür değerleri ve rover özellikleri birincil kaynaklardan teyit edilmeli; görseller Grok ile üretilmiştir" notunu ve içindekiler listesini içeriyor; B'de içindekiler dışında bu uyarı yok (görsel altyazılarında Grok notu var).

## 2. İddia tablosu

Açılan kaynaklar:
- [NASA-WP] NASA NTRS, "Terramechanics for LTV Modeling and Simulation" white paper: https://ntrs.nasa.gov/api/citations/20220010732/downloads/Terramechanics_white_paper.pdf
- [UMD] D. Akin, ENAE 788X Terramechanics ders notu: https://spacecraft.ssl.umd.edu/academics/788XF20/788XF20L06.terramechanics1x.pdf
- [LPSC] NASA NTRS, Connolly/Carrier LPSC 2023 özeti: https://ntrs.nasa.gov/api/citations/20220018853/downloads/LPSC%202023%20Abstract_Connolly_Carrier_v2.pdf
- [HU25] Hu ve ark. 2025, NASA NTRS: https://ntrs.nasa.gov/api/citations/20250001809/downloads/main-20250215.pdf
- [CM] Cesium Moon sayfası: https://cesium.com/platform/cesium-ion/content/cesium-moon-terrain/
- [CU-MM] Cesium for Unreal, Moon ve Mars eğitimi: https://cesium.com/learn/unreal/unreal-moon-mars/
- [CU-CP] Cartographic Polygon eğitimi: https://cesium.com/learn/unreal/unreal-clipping/
- [CU-SL] Sublevel eğitimi: https://cesium.com/learn/unreal/unreal-sublevels/
- [CU-FAQ] https://cesium.com/learn/unreal/unreal-faq/
- [PDS] LOLA GDR dizini: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/
- [LRV] https://en.wikipedia.org/wiki/Lunar_Roving_Vehicle
- [RB] https://en.wikipedia.org/wiki/Rocker-bogie
- [MSL] https://en.wikipedia.org/wiki/Curiosity_(rover)
- [MOON] NASA Moon Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html
- [UE-FBX] https://dev.epicgames.com/documentation/en-us/unreal-engine/fbx-static-mesh-pipeline-in-unreal-engine

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt | Not |
|---|---|---|---|---|---|---|
| 1 | NASA 3D Resources'taki rover modelleri başlangıç olarak kullanılabilir, lisans kontrol edilmeli | Bölüm 1 tablo | Yok | kaynağı yok | Kaynak açılmadı | Belge zaten "lisans kontrol edilmeli" diyor; hangi model/lisans olduğu yazılmamış. |
| 2 | Cesium for Unreal ayrı platform değil, Unreal plugin'i | Bölüm 1, 7 | Yok | kaynağı yok | [CU] https://cesium.com/learn/unreal/ : "Download the free, open source plugin" | Cesium ion (bulut servisi) hesabı gerektiği belgede yok; Cesium Moon/Mars akışı için ion hesabı şart ([CU-MM]). |
| 3 | Veri "5 m/px LOLA DEM" | Bölüm 1, 7 | Yok (LOLA adı anılıyor) | kısmen doğru | [PDS] polar dizinde `ldem_875n_5m`, `ldem_875s_5m` var; en ince ürün 87.5 derece enlemden kutba. [CM]: 5 m yalnızca 87.5-90 N/S; 60N-60S arası ~59 m (LOLA+Kaguya birleşimi) | 5 m/px sadece kutup bölgesi. 85 dereceden öte 10 m, 80 dereceden 20 m, 75 dereceden 30 m, 60 dereceden 60 m. Orta enlem iniş sahaları için 5 m LOLA DEM yok. Ürünün temel veri varsayımı; ekip kutup bölgesi hedefliyorsa geçerli. |
| 4 | Çarpışma mesh'leri `UCX_` önekiyle | Bölüm 2 | Yok | kaynağı yok | [UE-FBX]: "UCX_[RenderMeshName]_##", "your collision mesh should be... named UCX_Tree_01" | UCX_ kuralı Static Mesh boru hattının sayfasında; belgenin kendisi rover'ı Skeletal Mesh + Physics Asset yapıyor. Skeletal Mesh çarpışması Physics Asset'ten gelir; UCX_ rover gövdesi için gereksiz olabilir (bu sayfa Skeletal için bir şey söylemiyor). |
| 5 | Blender metre / Unreal cm, ön yön +X, Apply Transforms | Bölüm 2 | Yok | kaynağı yok | Doğrulayıcı kaynak açılmadı | Epic'in FBX sayfası ölçek konusunda net bir cümle vermedi (aranan terimler bulunamadı). |
| 6 | Chaos Vehicles plugin, `WheeledVehiclePawn`, Wheel sınıfı, Tire Config, Drag Coefficient=0, bone adıyla tekerlek bulma | Bölüm 2, 3, 4 | Yok | kaynağı yok | Epic Chaos Vehicles sayfaları (chaos-vehicles-overview, vehicles-in-unreal-engine) boş/JS içerikli geldi (25 bayt metin) | Epic dokümantasyonu otomatik çekimle okunamadı; bu iddialar bağımsız olarak doğrulanamadı. Sayfaların şu anda UE 5.9 olduğu görüldü. Ekip UE içinde elle denemeli. |
| 7 | Ay yerçekimi -162 cm/s², Dünya -980 | Bölüm 2 | Yok | kaynağı yok | [MOON] Surface gravity (m/s²): Ay 1.62, Dünya 9.80 | Değerler tutarlı (162 cm/s²). Epic World Settings sayfası "override the World Gravity" diyor ama sayı vermiyor; -980 varsayılanı doğrulanamadı. |
| 8 | Ay sıcaklığı yaklaşık -170 ile +120 °C | Bölüm 4 | Yok | kaynağı yok | [MOON]: "Diurnal temperature range (equator): 95 K to 390 K" | 95 K = -178 °C, 390 K = +117 °C; belge değeri yaklaşık doğru. |
| 9 | Yerçekimi azalınca normal kuvvet ve sürtünme (F=μN) 1/6'ya düşer, süspansiyon az sıkışır | Bölüm 4 | Yok | kaynağı yok | Fizik türetmesi; 1.62/9.80 = 0.165 ([MOON]) | [HU25] özet: "gravitational offset... misleading"; BWJH modellerinin "Earth gravitation" ile geliştirildiği ve düşük yerçekimi terramechanics'inin "poorly understood" olduğu yazıyor. Basit 1/6 ölçeklemeye güvenmek konusunda uyarı notu eklenmeli. |
| 10 | Physical Material birleştirme kuralı (ortalama/min/çarpım/max), Landscape katmanına atama | Bölüm 4, 5 | Yok | kaynağı yok | Epic Physical Materials sayfası açıldı ama içerik kısa; bu ayrıntı görülmedi | Doğrulanamadı. |
| 11 | Terramechanics Bekker (1950-60'lar) ve Wong'un yarı-ampirik modelleri | Bölüm 5 | "M. G. Bekker", "J. Y. Wong (Theory of Ground Vehicles)" | kısmen doğru | [LRV]: "In 1956 and 1962... Bekker published two books on land locomotion" | Bekker tarihi destekleniyor. Wong'un kitabı ücretli, açılamadı; formüllerin kökeni Wong değil Bekker/Reece/Janosi olabilir, "yarı-ampirik" nitelemesi [HU25] ile uyumlu. |
| 12 | Apollo LRV tasarımında bu modeller kullanıldı | Bölüm 5 | Yok | kısmen doğru | [LRV]: Bekker "later played a central role in developing the mobility system of the Lunar Roving Vehicle" | Bekker'in LRV mobilite sistemindeki rolü destekleniyor; "bu modellerin tasarımda kullanıldığı" doğrudan söylenmiyor. |
| 13 | Basınç-batma: p = (kc/b + kφ) z^n | Bölüm 5a | Bekker/Wong | doğrulandı | [NASA-WP] Eq.(6): "P = (kc/b + kφ) z^n" | Standart Bekker biçimi; aynı. |
| 14 | Rijit tekerlek batması z ≈ [3W / ((3−n)(kc+bkφ)√D)]^(2/(2n+1)) | Bölüm 5a | Bekker/Wong | doğrulandı | [NASA-WP] Eq.(8): z = [3W/((3−n)(kc+bkφ)√D)]^(2/(2n+1)) | Aynı. NASA belgesi bu türetmeyi Akin'e atfediyor. |
| 15 | Sıkıştırma direnci Rc = b(kc/b+kφ) z^(n+1)/(n+1) | Bölüm 5b | Bekker/Wong | doğrulandı | [NASA-WP] Eq.(7): Rc = (kc+bkφ) z^(n+1)/(n+1) | Cebirsel olarak eşdeğer (b ile çarpılan kc/b+kφ = kc+bkφ). |
| 16 | Hmax = A c + W tan φ | Bölüm 5c | Bekker/Wong | doğrulandı | [NASA-WP] Eq.(25): H_smooth,ideal = Ac + W tan φ | Aynı. |
| 17 | Kayma s = 1 − v/(ωr) | Bölüm 5d | Bekker/Wong | doğrulandı | [NASA-WP] Eq.(22): s = 1 − Vw/(ωr) | Aynı; s=0 kaymasız, s=1 yerinde dönme. |
| 18 | Janosi-Hanamoto: H(s)=Hmax[1−(K/(sL))(1−e^(−sL/K))] | Bölüm 5d | Janosi-Hanamoto | doğrulandı | [NASA-WP] Eq.(23): H = (Ac+W tanφ)[1 − K/(sl)(1 − e^(−sl/K))]; [HU25]: "Janosi-Hanamoto formula" | Aynı (L = temas uzunluğu l). NASA belgesi l = (D/2) arccos(1 − 2z/D) veriyor; belge L'nin nasıl bulunacağını söylemiyor. |
| 19 | Net çekiş DP = H(s) − Rc; tırmanma DP > W sinθ | Bölüm 5 | Bekker/Wong | kısmen doğru | [NASA-WP]: toplam direnç = sıkıştırma Rc + yuvarlanma Rr + bulldozing Rb (ön tekerlek) + yerçekimi Rg | Belgedeki DP yalnızca Rc'yi çıkarıyor; Rr, Rb ve Rg ayrı terimler. Eğim terimi W sinθ ayrıca konmuş, tutarlı; bulldozing ve yuvarlanma direnci yok. Basitleştirme olarak kabul edilebilir ama belgede söylenmemiş. |
| 20 | Ay'da A·c terimi yerçekiminden bağımsız, W tanφ 1/6'ya düşer; batma azalır | Bölüm 5 (Ay'a özel sonuç) | Yok | kaynağı yok | Formülden türetme (z ∝ W^(2/(2n+1)) ) | Cebirsel olarak tutarlı. [HU25] düşük yerçekiminde bu semi-ampirik çerçevenin öngörü gücünü sorguluyor (bkz. madde 9). |
| 21 | n = 1 | Bölüm 5 tablo | Wong/Apollo | doğrulandı | [UMD] s.22: "Lunar Regolith n=1"; [NASA-WP]: "n = 1 for lunar soil" | |
| 22 | kc = 1.4 kN/m^(n+1) | Bölüm 5 tablo | Wong/Apollo | doğrulandı | [UMD]: kc 1400 N/m²; [NASA-WP]: "kc = 1400 N/m2 for lunar soil" | 1400 N/m² = 1.4 kN/m². |
| 23 | kφ = 820 kN/m^(n+2) | Bölüm 5 tablo | Wong/Apollo | kısmen doğru | [UMD] s.22 tablo: 820,000 N/m³; aynı notun s.25 "Canonical Values": 830,000; [NASA-WP]: "830000N/m3" | 820 ile 830 kN/m³ arasında %1 fark; kaynaklar kendi içinde iki değer veriyor. Pratikte fark yok. |
| 24 | c ≈ 0.17 kPa (0.1-1 kPa aralığı) | Bölüm 5 tablo | Wong/Apollo | kısmen doğru | [UMD]/[NASA-WP]: "Cohesion c = 170 N/m2" | 0.17 kPa doğrulandı. 0.1-1 kPa aralığı bu kaynaklarda yok. [LPSC]: kohezyon derinlikle artar, "beyond 3 kPa at depths below 50 cm". |
| 25 | φ ≈ 35° (30-50° aralığı) | Bölüm 5 tablo | Wong/Apollo | kısmen doğru | [LPSC]: "Apollo experiments estimated the internal friction angle of the lunar soil to be between 30 and 50 degrees"; [UMD] Canonical: φ = 33° | 30-50° aralığı doğrulandı; merkez değer kaynaklarda 33° (35 değil). [LPSC] derinlikle 55° civarına çıkabildiğini de yazıyor. |
| 26 | K ≈ 1.8 cm | Bölüm 5 tablo | Wong/Apollo | doğrulandı | [NASA-WP]: "Typical value of K for lunar soil is about 1.78 cm" | |
| 27 | Değerler "Wong'un kitabı ve Apollo verilerinde sık geçen" | Bölüm 5 | Wong'un kitabı | doğrulanamadı | Wong'un kitabı ücretli, açılamadı | Değerler UMD (Akin) ve NASA white paper'da var; Wong kitabından geldiği doğrulanmadı. |
| 28 | Apollo LRV tel örgü tekerlek, titanyum tırnaklı | Bölüm 4 | Yok | kaynağı yok | [LRV]: "zinc-coated woven 0.033-inch... steel strands... Titanium chevrons covered 50% of the contact area" | Tel örgü + titanyum chevron doğru. Tekerlek 81 cm çap, 23 cm genişlik. |
| 29 | Kauçuk Ay koşullarında bozulduğu için LRV tel örgü kullandı | Bölüm 4 | Yok | kaynağı yok | [LRV]: tel örgü "resilient wheel" tasarımı (Pavlics); düşük-g testlerinde "very soft wheel and suspension" gereği | Kauçuğun bozulması nedeniyle seçildiği sayfada yazmıyor; sebep olarak yumuşak/esnek tekerlek gereksinimi veriliyor. Sunumda "bu yüzden seçildi" cümlesi doğrulanmadan kullanılmamalı. |
| 30 | Rocker-bogie 1980'lerin sonunda JPL'de, yaysız | Bölüm 6 | Yok | kaynağı yok | [RB]: "invented by NASA engineer Donald B. Bickler in 1988"; patent 1987'de başvuru, 1989'da verildi; "unsprung" | Tarih/yaysız nitelemesi uyumlu. |
| 31 | Sojourner, Spirit, Opportunity, Curiosity, Perseverance'ta kullanıldı | Bölüm 6 | Yok | kaynağı yok | [RB]: aynı beş rover + Pragyan (Chandrayaan-3, 2023) | Pragyan eksik; Ay'da kullanılan tek örnek bu. |
| 32 | Çin'in Yutu ve Yutu-2'si benzer yapı kullanıyor | Bölüm 6 | Yok | kaynağı yok | [Yutu sayfası] https://en.wikipedia.org/wiki/Yutu_(rover): rocker/bogie geçmiyor; "wheel design... influenced by Lunokhod 1" | Doğrulanamadı; Ay için doğrulanan örnek Pragyan ([RB]). Sunumda Yutu iddiası kullanılmamalı. |
| 33 | Diferansiyel: gövde iki rocker açısının ortalaması kadar eğilir | Bölüm 6 | Yok | kaynağı yok | [RB]: "The chassis maintains the average pitch angle of both rockers" | Uyumlu. |
| 34 | Curiosity ~50 cm tekerlek, ~65 cm engel | Bölüm 6 | Yok | kaynağı yok | [MSL]: "six 50-centimetre-diameter wheels"; "roll over obstacles approaching 65 cm" | Uyumlu. [RB]: MER için tasarım hedefi ~20 cm engel; "tekerlek çapı kadar veya biraz fazlası" genelleme olarak okunmalı. |
| 35 | Curiosity ~45° yan yatmaya dayanır, yazılım ~30° sınırlar | Bölüm 6 | Yok | kaynağı yok | [MSL]: "withstand a tilt of at least 50° ... sensors limit... 30° tilts"; [RB]: "at least 45 degrees" | 30° doğru. 45° ile 50° arasında kaynaklar kendi aralarında farklı; "en az 45-50°" yazılmalı. |
| 36 | Mars rover'ları saniyede birkaç cm gider; rocker-bogie yavaş kullanım içindir | Bölüm 6 | Yok | kaynağı yok | [RB]: "typically used at low speeds to reduce dynamic shock loads"; [MSL]: azami hız tahmini "200 m..." (saat) | Uyumlu (200 m/saat ≈ 5.6 cm/s, tam metin kesik görüldü). |
| 37 | Cesium 3D Tileset ile Ay arazisi, CesiumGeoreference ile enlem/boylam | Bölüm 1, 7 | Yok | kaynağı yok | [CM]: "Cesium Moon is complete 3D Tiles of the lunar surface"; [CU-MM]: Cesium for Unreal 2.7.0 veya üstü, CesiumGeoreference Ellipsoid = `IAU2015_Moon`, CesiumSunSky atmosferi sıfırlanmalı | Cesium Moon var, doğru. Belgede eksik: ellipsoid ayarı ("Without this step, you may see erratic tile loading"), sürüm şartı, ion hesabı, SunSky ayarı. Belge "Cesium Moon" adını hiç anmıyor. |
| 38 | Landscape altında kalan Cesium arazisi Cartographic Polygon ile kesilip gizlenir, titreşme olmaz | Bölüm 7 | Yok | kaynağı yok | [CU-CP]: "they do not affect physics... you can still collide with the hidden parts of a tileset" | Önemli: polygon yalnızca görüntüyü gizler; hidden kısım çarpışmaya devam eder. Rover simülasyonunda iki zemin fiziği çakışabilir. Tileset'te "Create Physics Meshes" kapatılmalı ([CU-FAQ]). |
| 39 | Cesium Sub-Level ile bölge içeriği yüklenir | Bölüm 7 | Yok | kaynağı yok | [CU-SL]: georeferenced sublevels, "no more than one georeferenced sub-level is active at any given time" | Uyumlu. Sublevel başına ayrı "merkez konum" ve küçük koordinatlar sağlıyor. |
| 40 | Cesium tileset'te LOD değişince çarpışma mesh'i değişir | Bölüm 7 tablo | Yok | kaynağı yok | [CU-FAQ]: ekran dışı tile'lar unload edilir, "physics objects that are not on screen run the risk of falling through the tileset" | Destekleniyor; belge bunu "zayıf yan" diye yazıyor ama düşme riskini söylemiyor. |
| 41 | Landscape 5 m'de ~8k×8k vertex ile ~40 km'ye sınırlı | Bölüm 7 tablo | Yok | kaynağı yok | Yeniden hesaplandı: 8129 × 5 m ≈ 40.6 km | Aritmetik doğru. Unreal'ın 8k sınırı kaynakla doğrulanmadı; ayrıca madde 3'e göre 5 m yalnızca kutup bölgesinde var. |

## 3. Öneriler ve tasarım kararları (iddia sayılmadı)

- Stack: Unreal 5 + Cesium for Unreal + Blender; ADR yazılacak.
- Rover simülasyonu destekleyici özellik; 3 aşamalı geliştirme.
- Rover Skeletal Mesh olacak, bone düzeni `root>chassis>rocker>bogie>wheel`.
- Chaos Vehicles'ı Bekker-Wong ile ya "basit yol" (sürtünme çarpanı + ek yuvarlanma direnci) ya da "doğru yol" (AddForceAtLocation) bağla; basit yol önerilen.
- Rocker-bogie'yi Chaos'ta 6 bağımsız uzun süspansiyonlu tekerlek + Animation Blueprint açı hesabıyla taklit et; mekanik constraint yaklaşımı önerilmiyor.
- Rover profillerine "maksimum güvenli hız" parametresi koy.
- İki Data Table (zemin tablosu, rover tablosu); öncelik: eğim + Bekker kayma/batma + batarya.
- Cesium ile tüm Ay, Landscape ile sürüş alanı; Sub-Level + Cartographic Polygon geçişi.
- 5 m DEM'i sürüş alanında upsample et, prosedürel kaya/küçük krater (PCG) ekle.
- Tekerlek aşınması ve batarya için basit modeller (kendi yazılacak).

## 4. Belge içi çelişkiler ve eskimiş bilgiler

- "5 m/px LOLA DEM" tüm Ay için varmış gibi anlatılıyor; gerçekte yalnızca 87.5 derece enlemden kutba (madde 3). Bölüm 7'deki "40 km Landscape" bu 5 m varsayımına bağlı.
- Bölüm 7, Cartographic Polygon ile "iki zemin üst üste binip titreşmez" diyor; Cesium dokümanı polygon'un fiziği etkilemediğini, gizli tile'ların çarpışmaya devam ettiğini yazıyor (madde 38). Fizik zemini olarak Landscape seçiliyorsa Cesium tileset fizik mesh'i kapatılmalı.
- Cesium'un Ay desteği için gerekli `IAU2015_Moon` ellipsoid ayarı, Cesium for Unreal 2.7.0+ şartı ve CesiumSunSky atmosfer ayarı belgede yok; Cesium varsayılan olarak WGS84 kullanır ve ayar yapılmazsa "erratic tile loading" olur ([CU-MM]).
- UCX_ kuralı Static Mesh sayfasında geçerli; belge rover'ı Skeletal Mesh yaparken Physics Asset'ten de söz ediyor (madde 4).
- Bölüm 6: Chaos tek tek tekerleğe uzun süspansiyon verir diye öneriliyor, oysa Bölüm 4'te "yay sertliğini 1/6'ya indir" deniyor; rocker-bogie yaysız mekanizma olduğundan ikisinin birlikte nasıl ayarlanacağı belirtilmemiş.
- DP formülü bulldozing ve yuvarlanma direncini içermiyor (madde 19).
- Eşik uyarısı: Bekker-Wong/Janosi-Hanamoto Dünya yerçekiminde geliştirilmiş; [HU25] düşük yerçekimi terramechanics'inin hâlâ iyi anlaşılmadığını ve "yerçekimi ofseti" yaklaşımının yanıltıcı olabileceğini yazıyor. Belge bunu hiç anmıyor.
- Curiosity yan yatma değeri iki Wikipedia sayfasında farklı (45° / 50°).
- Belge, Unreal sürümünü söylemiyor; Epic dokümanları şu anda UE 5.9 gösteriyor.
- Wong atfı: değerlerin gerçek kaynağı UMD/NASA belgeleri görünüyor, Wong kitabı değil.
- Unreal dokümantasyonu (Chaos Vehicles, Physical Material, Tire Config) otomatik çekimle okunamadığı için Bölüm 4'ün Unreal API iddiaları bağımsız doğrulanamadı.

## 5. Etiket sayıları

- doğrulandı: 9
- kısmen doğru: 7
- yanlış: 0
- kaynağı yok: 24
- doğrulanamadı: 1

(Toplam 41 satır.)

## 6. Açılamayan kaynaklar

- Wong, "Theory of Ground Vehicles" (kitap): ücretli, açılmadı.
- https://dev.epicgames.com/documentation/en-us/unreal-engine/chaos-vehicles-overview : HTTP 200 ama içerik JS ile üretiliyor, metin yok (iki deneme: aynı alan adında chaos-vehicles-in-unreal-engine, API/AWheeledVehiclePawn, physics-settings da boş).
- https://science.nasa.gov/mission/msl-curiosity/rover-components/ : HTTP 404 (NASA Rover Basics sayfası açıldı ama tekerlek/tilt sayıları orada yoktu; Curiosity sayıları Wikipedia'dan).
- https://cesium.com/learn/unreal/unreal-cartographic-polygons/ ve unreal-globe-sublevels/ : HTTP 404 (doğru adresler unreal-clipping ve unreal-sublevels ile açıldı).
- NASA 3D Resources (madde 1): belgede adres yok, açılmadı.
