# Doğrulama: Ufuk hesabı ile ışık ve ısı katmanı

Bu dosya [ANALIZ-OZETI.md](../ANALIZ-OZETI.md) belgesinin ekidir. Araştırma notundaki her kontrol edilebilir iddia, notun gösterdiği kaynak açılarak karşılaştırıldı.

- **Doğrulama tarihi:** 14 Kasım 2026
- **İncelenen dosyalar:** [README.md](../lunar-horizon/README.md), [README.md](../light-heat-layer/README.md)
- **Not:** Kanıt sütunundaki alıntılar kaynaktaki haliyle bırakıldı. Sayılar ve birimler kaynakla aynı yazıldı.

| Etiket | Adet |
|---|---:|
| doğrulandı | 73 |
| kısmen doğru | 9 |
| yanlış | 2 |
| kaynağı yok | 11 |
| doğrulanamadı | 2 |
| **Toplam** | **97** |

Doğrulanan belgeler:

- **Belge A:** `docs/research/lunar-horizon/README.md` (Atmosfersiz Ay'da ufuk hesabı)
- **Belge B:** `docs/research/light-heat-layer/README.md` (Işık ve ısı katmanı: rover için gölge, pil ve sıcaklık)

Doğrulama tarihi: 2026-11-14. Bütün hükümler bu oturumda açılan kaynaklara dayanır.

**Etiketleme kuralı (birleştirme için):**

- Formül sonucu olan sayılar (ufuk mesafesi, açısal çaplar, dosya boyutları) kendim hesapladım. Uyuyorsa "doğrulandı", uymuyorsa "yanlış" yazdım ve Not'a "yeniden hesaplandı" ekledim. Belge bu sayılar için ayrıca kaynak göstermese de bu kuralı uyguladım.
- Hesapla üretilemeyen ve kaynağı gösterilmeyen olgular (kırılma değeri, k katsayısı, ±1,54°, 1361 W/m², MOON_ME/PA kernel zinciri, teslim tarihi) "kaynağı yok" olarak etiketlendi.
- Proje içi kaynaklara (ephemeris raporu, pptx, LICENSE) atıf yapan iddialar o dosyalar açılarak kontrol edildi.

---

# BELGE A: lunar-horizon/README.md

## A1. Belge özeti

- Ay'da atmosfer olmadığı için ufuk hesabının tamamen geometrik olduğunu anlatıyor (kırılma yok, k = 1).
- Düz arazide küre kenarı ufkunu tablolaştırıyor: ufuk mesafesi ve ufuk alçalması (dip). Ardından eğriliğin uzak arazinin görünen açısını nasıl düşürdüğünü gösteriyor (d/2R; 100 km'de ≈ 1,65°).
- Standart "ufuk profili" yöntemini adım adım veriyor:
  - Kartezyen koordinatta 720 azimut (0,5°) ışın.
  - Değişken adımlı örnekleme (ICAT) ya da iç içe DEM (Barker).
  - Sonuç: `H(az)` profili ve `e > H(az)` testi.
- Güneş diskinin kısmi görünürlüğü için daire kesiti formülünü öneriyor ve literatürdeki yaklaşımlarla karşılaştırıyor.
- Dünya görünürlüğünü ele alıyor: açısal çap, librasyon ±6,5° / ±8°, ~14 günlük pencere ve paralaks.
- Literatür parametrelerini tablolaştırıyor (Mazarico 2011, De Rosa 2012, Gläser 2014, Barker, Fritsch 2025). Gözlemci yüksekliğinin etkisini ve tuzakları anlatıyor.
- Proje önerisi:
  - Hazır siteler için çevrimdışı 720 değerlik profiller (JSON) hesaplanır.
  - Tarayıcı yalnızca karşılaştırma yapar; özel koordinatlar arka uçta hesaplanır.
  - Panorama siluetiyle görselleştirilir ve PGDA ile doğrulanır.
- Bölüm 11'de NumPy örnek kodu var.

## A2. İddia tablosu (Belge A)

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt (açılan adres + alıntı/sayı) | Not |
|---|---|---|---|---|---|---|
| A-1 | Kırılma olmadığı için ufku yerel arazi ve Ay küresinin kenarı belirler (problem metni) | §1 | docs/challenge/lunar-landing-site-navigator.md | doğrulandı | Yerel dosya, satır 34: "Without atmospheric refraction, the horizon is determined by local terrain and the edge of the lunar sphere" | |
| A-2 | Dünya'da ufukta kırılma ≈ 0,57°; Güneş geometrik olarak −0,83°'deyken doğmuş sayılır | §1 tablo | yok | kaynağı yok | — | Standart astronomi değerleriyle (34′ kırılma + 16′ yarıçap ≈ 0,833°) tutarlı. Belge kaynak göstermiyor. |
| A-3 | Etkin yarıçap katsayısı: optikte k ≈ 7/6, radyoda 4/3 | §1 tablo | yok | kaynağı yok | — | |
| A-4 | Astronotlar havasız ortamda mesafe tahmininde zorlandı | §1 eğitim notu | yok | kaynağı yok | — | |
| A-5 | LOLA referans küresi R = 1737,4 km; LOLA yükseklikleri bu küreye göredir | §2, §9 | PGDA ürün 69 (Kaynaklar listesi) | doğrulandı | https://pgda.gsfc.nasa.gov/products/69: "Elevation maps ... (referenced to a 1737.4 km sphere)". NSSDC Moon fact sheet: mean radius 1737.4 km | |
| A-6 | Ay'da ufuk uzaklığı: 1 m 1,86; 1,7 m 2,43; 2 m 2,64; 5 m 4,17; 10 m 5,89 km | §2 tablo | formül d = √(2Rh + h²) | doğrulandı | Hesap: 1,864 / 2,430 / 2,636 / 4,168 / 5,895 km | Yeniden hesaplandı (R = 1737,4 km) |
| A-7 | Ufuk alçalması: 0,061° / 0,080° / 0,087° / 0,137° / 0,194° | §2 tablo | formül arccos(R/(R+h)) | doğrulandı | Hesap: 0,0615 / 0,0802 / 0,0869 / 0,1375 / 0,1944° | Yeniden hesaplandı |
| A-8 | Dünya'da ufuk uzaklığı: 3,57 / 4,65 / 5,05 / 7,98 / 11,29 km | §2 tablo | formül | doğrulandı | Hesap (R_E = 6371 km): 3,570 / 4,654 / 5,048 / 7,982 / 11,288 km | Yeniden hesaplandı. Belge Dünya yarıçapını yazmıyor; 6371 km ile birebir tutuyor. |
| A-9 | Ay'da ufuk, Dünya'dakinin yaklaşık yarısı kadar yakın | §2 | formül | doğrulandı | √(1737,4 / 6371) = 0,522 | Yeniden hesaplandı |
| A-10 | Eğrilik düşüşü d²/2R: 1 km 0,3 m … 100 km 2,9 km … 200 km 11,5 km | §3 tablo | formül | doğrulandı | Hesap: 0,29 / 28,8 / 179,9 / 719,5 / 2878 / 6475 / 11 512 m | Yeniden hesaplandı |
| A-11 | Açıya etkisi d/2R. Ay: 0,016° … 1,649° … 3,298°. Dünya: 0,004° … 0,450° … 0,899° | §3 tablo | formül | doğrulandı | Hesap Ay: 0,0165 / 0,1649 / 0,4122 / 0,8244 / 1,6489 / 2,4733 / 3,2978°. Dünya: 0,0045 / 0,045 / 0,1124 / 0,2248 / 0,4497 / 0,6745 / 0,8993° | Yeniden hesaplandı. 150 km için Dünya değeri 0,67449°; belgedeki 0,674 doğru yuvarlama. |
| A-12 | 2 m gözlemci, 100 km'de tepe. 1500 m: −0,79° (eğrilikle), +0,86° (düz). 5000 m: +1,21° / +2,86°. Fark ≈ 1,65° | §3 örnekler | formül e ≈ atan(Δz/d − d/2R) | doğrulandı | Hesap: −0,791° / 0,858° / 1,215° / 2,861°; fark 1,646° | Yeniden hesaplandı. Kesin Kartezyen hesap 5000 m için 1,207° veriyor; yaklaşık formülle fark 0,01°. 1500 m'lik tepe 100 km'de gerçekten görünmez: 72,2 + 2,6 km < 100 km. |
| A-13 | Güneş'in kutuptaki yükseklik aralığı ±1,54°; 1,65°'lik fark "bütün yükseklik aralığından büyük" | §3 | yok | kaynağı yok | — | NSSDC Moon fact sheet: yörüngeye eğiklik 6,68°, ekliptiğe eğim 5,145° → ekvator ile ekliptik arası ≈ 1,54°. Ancak ±1,54° yalnızca tam kutupta geçerli; −85°'de Güneş −6,5°'ye kadar iniyor (De Rosa). Ayrıca toplam aralık 3,08° olduğundan 1,65° "bütün aralıktan" değil, yalnızca genlikten büyük. |
| A-14 | Mazarico 2011, "ESA'nın ICAT aracı (De Rosa 2012)" ve Barker aynı ufuk yöntemini izler | §4 | Mazarico, De Rosa, Barker | kısmen doğru | arXiv 1208.5587: "Astrium ST Illumination and Communication Analysis Tool (ICAT)". Barker PDF: "we use the horizon method outlined in Mazarico et al. (2011)" | Yöntem benzerliği doğru. Ancak ICAT bir Astrium aracıdır (ESA Lunar Lander projesi için geliştirildi). ESA'nın kendi aracı STK tabanlı "Coverage tool". Belge ICAT'i boyunca "ESA" diye anıyor. |
| A-15 | ICAT 720 azimut (0,5°) kullanır; gerekçe Güneş'in ~1 saatte kendi çapı (~0,53°) kadar yer değiştirmesi | §4 adım 2 | De Rosa 2012 | doğrulandı | arXiv 1208.5587: "720 azimuth lines (0.5 degree spacing)... the Sun takes approximately 1 hour (the simulation step) to cover its own size" | Hesap: 0,533° / 0,508°·h⁻¹ = 1,05 saat |
| A-16 | ICAT örneklemesi: 3 km'ye kadar 20 m, 75 km ötesi 2 km, arası doğrusal, en fazla 150 km | §4 adım 3 | De Rosa 2012 | doğrulandı | arXiv 1208.5587: "points within 3 km are sampled every 20 m, points further than 75 km are sampled every 2 km ... linear variation" | |
| A-17 | Barker iç içe ızgara: < 5 km 5 m/px, 5–100 km 80 m/px, ötesi 240 m/px | §4 adım 3, §7 | Barker vd. | doğrulandı | NTRS Barker PDF: "5 m/pix LDEM is used for distances <5 km, the 80 m/pix ... 5–100 km, and the 240 m/pix ... larger distances" | |
| A-18 | Profil bir kez hesaplanıp saklanır; en pahalı adım DEM erişimidir | §4 adım 5 | De Rosa 2012 | doğrulandı | arXiv 1208.5587: "being the data access operation the most consuming process"; "they are stored for later assessment" | |
| A-19 | Güneş azimutundaki ufuk değeri komşu iki azimut arasında doğrusal enterpolasyonla bulunur | §4 adım 6 | De Rosa 2012 | doğrulandı | arXiv 1208.5587: "obtained by linear interpolation of the elevation values at the surrounding points of the horizon" | |
| A-20 | 150 km gerekçesi: en yüksek arazi noktası en düşük Güneş yüksekliğinin altında kalır (−85° enlemde ≈ −6,5°) | §4 | De Rosa 2012 | doğrulandı | arXiv 1208.5587: "range at which the highest terrain point ... lower than the minimum Sun elevation (e.g. -6.5° at -85° latitude)" | |
| A-21 | Güneş'in Ay'dan açısal çapı 0,524°–0,542°, ortalama 0,533° (r ≈ 0,2665°) | §5 | formül (ICAT 0,533° kullanıyor) | doğrulandı | Hesap (R = 695 700 km): perihel 0,542°, 1 AU 0,533°, afel 0,524°. ICAT: "angular diameter of 0.533°" | Yeniden hesaplandı. Ay'ın Dünya çevresindeki konumu ±0,0014° ekler (0,523–0,543°); ihmal edilebilir. |
| A-22 | Görünen disk oranı f = 1 − (acos x − x√(1−x²))/π; x = −0,5 → %19,6, 0 → %50, 0,5 → %80,4 | §5, §11 kod | formül | doğrulandı | Hesap: %0 / %19,6 / %50,0 / %80,4 / %100 | Yeniden hesaplandı. Kod (`sun_fraction`) metindeki formülle aynı. |
| A-23 | Barker diski ufkun yüksekliğinden yatay böler ve 550 nm'de kenar kararmasını hesaba katar | §5 tablo | Barker vd. | doğrulandı | Barker PDF: "extended source with limb darkening at 550 nm ... approximated by horizontally dividing the disk at the horizon's elevation" | |
| A-24 | ICAT 0,533°'lik diskin yalnızca dikey oranını alır | §5 tablo, §7 | De Rosa 2012 | doğrulandı | arXiv 1208.5587: "Sun disc with an angular diameter of 0.533°. Only the vertical fraction of the visible Sun is computed" | De Rosa'ya göre gerçek oranla farkı ihmal edilebilir (%0,4). |
| A-25 | ESA'nın STK tabanlı aracı Güneş'i nokta kaynak sayar; bu %50 eşiğine denk gelir | §5 tablo | De Rosa 2012 | doğrulandı | arXiv 1208.5587: "the Sun is simulated only as a point source ... roughly equivalent to having a 50% threshold" | |
| A-26 | DLR (HPG 2025): "sabit ufuk yüksekliği" yaklaşımı düşük maliyetle iyi sonuç verir | §5 tablo | Fritsch vd., HPG 2025 | doğrulandı | HPG 2025 PDF, slayt 11: "Constant Altitude has proven to produce good results at low computational cost" | |
| A-27 | Dünya'nın Ay'dan görünen çapı 1,80°–2,05° | §6 | formül | doğrulandı | Hesap (R_E = 6371 km): apoje 405 500 km → 1,80°; perije 363 300 km → 2,01°; uç perije 356 400 km → 2,05° | Yeniden hesaplandı. Mesafeler NSSDC Moon fact sheet'ten. |
| A-28 | Güney kutbunda Dünya merkezi her ay yükseklikte ≈ ±6,5°, azimutta ≈ ±8° salınır (ESA) | §6 | De Rosa 2012 | doğrulandı | arXiv 1208.5587: "Earth centre follows a pattern of approximately ±6.5° in elevation every months, constrained to approximately ±8° in azimuth" | |
| A-29 | Kutup bölgelerinde Dünya görünürlük pencereleri yaklaşık 14 gün | §6 | De Rosa 2012 | doğrulandı | arXiv 1208.5587: "Earth visibility has a windows of approximately 14 days" | Aynı kaynak −85° civarında pencerenin ~19 güne çıktığını yazıyor (LP1, Leibnitz beta = projenin test sahası bölgesi). |
| A-30 | ESA, Ay merkezli efemerisi gözlemci konumuna göre paralaks için düzeltir | §6 | De Rosa 2012 | doğrulandı | arXiv 1208.5587: "Data was derived for Moon centred coordinates and is corrected to the current observer position to account for parallax" | |
| A-31 | Ay yarıçapı Dünya uzaklığının ≈ %0,45'i, yani ≈ 0,26° | §6 | formül | doğrulandı | 1737,4 / 384 400 = %0,452; atan = 0,259° | Yeniden hesaplandı |
| A-32 | Mazarico 2011: LOLA 240 m/px, 75° enleme kadar, çok yönlü ufuk profilleri | §7 tablo | NTRS 20120010094 | doğrulandı | https://ntrs.nasa.gov/api/citations/20120010094 (özet): "horizon elevation in a number of directions based on 240 m-resolution polar digital elevation models reaching down to 75 latitude" | |
| A-33 | Mazarico 2011: 1 saat adım, 18,6 yıllık "nütasyon" döngüsü | §7 tablo | NTRS 20120010094, PGDA 69 | kısmen doğru | PGDA 69: "over an entire lunar nutation cycle (~18.6 years) with a timestep of one hour". NTRS özeti: "several 18.6-years lunar precession cycles with a high temporal resolution (6 h)" | İki kaynak çelişiyor. Makale özeti uzun simülasyonlar için 6 saat diyor; 1 saat yalnızca PGDA sayfasında geçiyor. Tam metin açılamadı. |
| A-34 | De Rosa/ICAT: LOLA, 720, ≤ 150 km, 0,533° disk, 12 sinodik ay | §7 tablo | De Rosa 2012 | doğrulandı | arXiv 1208.5587: "simulation period of 12 synodic periods (~29.53 days)" | |
| A-35 | Gläser 2014 (Icarus): LOLA 20 m/px; 19 yıl; yüzeyde, 2 m ve 10 m | §7 tablo | ADS 2014Icar..243...78G | doğrulandı | ADS CAPTCHA verdi; aynı özet https://elib.dlr.de/94240/ adresinden açıldı: "20 m/pixel Digital Terrain Model ... A 19-year study ... at surface level, 2 and 10 m above ground" | 19 yıllık çalışma yalnızca Connecting Ridge sahası için. 20×20 km'lik alan 1 yıl boyunca, yalnızca yüzeyde ve 2 m'de incelendi. |
| A-36 | Barker satırı: 720 (0,5°); yakın alan ~100 m, uzak alan 50–200 km; kenar kararmalı disk; 1 saat; 2024–2026 | §7 tablo | Barker vd. | doğrulandı | Barker PDF: "720 sight lines spaced 0.5 apart"; "near-field component roughly 100 m away ... far-field ... 50–200 km"; "1-h intervals"; "Jan. 1, 2024 and Jan. 1, 2026" | |
| A-37 | Fritsch HPG 2025: 360 azimut → 16 Fourier katsayısı; gerçek zamanlı; RTX 4090'da 0,1–0,25 ms ek yük | §7 tablo | HPG 2025 sunumu | kısmen doğru | HPG 2025 PDF, slayt 6: "360 real horizon samples ... Truncate Fourier series to 16 complex coefficients". Slayt 12: 8 katsayı "RTX 4090: 0.1ms / 0.25ms"; 16 katsayı "RTX 4090: 0.19ms / 0.55ms" | 0,1–0,25 ms, 8 katsayının ek yükü (vertex/fragment shader). Satırdaki 16 katsayı için RTX 4090 değeri 0,19–0,55 ms. |
| A-38 | ESA sonuçları Mazarico 2011 ufuklarıyla ve LROC birikimiyle (Speyerer ve Robinson) uyuşuyor | §7 | De Rosa 2012 | doğrulandı | arXiv 1208.5587: "compared to those reported in Mazarico et al. (2011a) showing a good match ... compares very well with results from Speyerer and Robinson" | |
| A-39 | Barker, Site 1, ortalama aydınlanmanın en kötü %1'i: 1 m'de %67–71, 5 m'de %83–89 | §8 tablo | Barker vd. | doğrulandı | Barker PDF: "At z = 1 m, the 1st percentile of average illumination ranges from 67% (RoI 7) to 71% (RoI 6)"; 5 m'de "83% (RoI 7) to 89% (RoI 1)" | |
| A-40 | Gläser 2014, Connecting Ridge güneşli zaman oranı: 2 m %92,3; 10 m %95,7 | §8 tablo | Gläser 2014 | doğrulandı | https://elib.dlr.de/94240/: "92.27% of the time at 2 m above ground and 95.65% of the time at 10 m" | EPSC 2014 özetinde de aynı değerler var (https://elib.dlr.de/94242/: 92.3% ve 95.66%). |
| A-41 | Kaynaklar güneş panellerinin olabildiğince yükseğe konmasını öneriyor | §8 | Barker, Gläser | doğrulandı | Barker PDF: "the importance of raising a landed asset's solar panels as high as possible" | |
| A-42 | LOLA ürünleri MOON_ME çerçevesini kullanır | §9 | PGDA 78 | doğrulandı | https://pgda.gsfc.nasa.gov/products/78: "south polar stereographic X/Y coords in meters, MOON_ME reference frame of ephemeris DE421" | |
| A-43 | Ay yönelimi DE4xx PA kernel'ından gelir; MOON_ME'ye NAIF çerçeve kernel'ıyla geçilir | §9 | yok | kaynağı yok | — | |
| A-44 | DEM'deki tek bir pozitif hata ufku yükseltmeye yeter; sonuçlar iyimser çıkar | §9 | Barker vd. | doğrulandı | Barker PDF: "All it takes to raise the horizon elevation is one positive height fluctuation with sufficient magnitude along the line-of-sight" | |
| A-45 | Güneş saatte ≈ 0,5° hareket eder; 1 saatlik adım literatür standardıdır | §9 | Barker, De Rosa (dolaylı) | kısmen doğru | Hesap: 360° / 29,53 gün = 0,508°/saat. Barker ve ICAT 1 saat kullanıyor. Mazarico 2011 özeti: "(6 h)". Coyan 2025 farklı | Hız doğru. "Standart" ifadesi Barker ve ICAT için geçerli; Mazarico 2011 özeti uzun simülasyonlarda 6 saat kullanıyor. |
| A-46 | Literatürdeki standart 720 yön (0,5°) | §10 | Barker, De Rosa | kısmen doğru | Barker ve ICAT 720. Coyan vd. 2025 (https://iopscience.iop.org/article/10.3847/PSJ/adbc6c): "1440 steps in azimuth (every 0.25)". Fritsch: 360 | Yaygın ama evrensel değil. |
| A-47 | 720 değerlik H(az) profili site ve direk yüksekliği başına JSON olarak ≈ 3 KB | §10 madde 1 | ekip tahmini | doğrulandı | Hesap: 720 × float32 = 2,9 KB (ikili). JSON metinde 2–4 ondalıkla ≈ 4–6 KB | Yeniden hesaplandı. 1 ondalıklı sıkışık JSON ≈ 3,5 KB, ikili 2,9 KB; "≈ 3 KB" payı içinde. Daha fazla ondalıkla 4–6 KB olur. |
| A-48 | PGDA'daki Mazarico kutup aydınlanma haritaları doğrulama için kullanılabilir | §10 madde 5 | PGDA 69 | doğrulandı | https://pgda.gsfc.nasa.gov/products/69: "Average solar illumination 65S-90S 240 m/px ... 75S-90S 120 m/px ... 85S-90S 60 m/px" (IMG, JP2, TIF, COG) | 60 m/px ürünü yalnızca 85S–90S'yi kapsıyor; Mons Mouton (−84,78°) dışarıda kalıyor. 120 m/px 75S–90S ürünü gerekir. |
| A-49 | Haberleşme için genellikle Dünya merkezinin ufkun belli bir pay üstünde olması aranır | §6 | yok | kaynağı yok | — | De Rosa "2° minimum elevation constraint" uyguluyor. PGDA 69 ise Dünya'yı "if any part of its disc is not obscured" görünür sayıyor. |
| A-50 | NAIF DSK eğitimi SINCPT, ILLUMF, GFOCLT ile arazi destekli görünürlüğü anlatır | §12 | NAIF 37_dsk.pdf | doğrulandı | https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/Tutorials/pdf/individual_docs/37_dsk.pdf: "API: SINCPT", "API: ILLUMF", "shape: GFOCLT" | |
| A-51 | GRASS r.horizon Dünya için ufuk açısı hesaplar (eğriliği dahil) | §12 | mankier r.horizon | doğrulandı | https://www.mankier.com/1/r.horizon.1grass: "Computes horizon angle height from a digital elevation model ... takes into account the curvature of the Earth" | |
| A-52 | Künyeler: Mazarico, Icarus 211, 1066–1081 (2011); Stewart, IEEE TVCG 4(1), 82–93 (1998) | §12 | NTRS, PGDA 69, Queen's sayfası | doğrulandı | PGDA 69: "Icarus, Vol. 211, pp. 1066-1081". https://research.cs.queensu.ca/home/jstewart/papers/tvcg97.html: volume 4, number 1, pages 82--93, 1998 | Fritsch sunumunun altı yazarlı listesi slaytlarda yok; slaytlarda yalnızca Jonathan Fritsch var. |
| A-53 | Örnek kod, düz arazi ve 2 m direk: −0,0869° verdi (beklenen −0,087°) | §11 | ekip testi | doğrulandı | Belgedeki `sample_ranges` ile düz küre: −0,08694° | Yeniden hesaplandı |
| A-54 | Örnek kod, 5000 m tepe 100 km'de: 1,15° verdi (formül 1,21°) | §11 | ekip testi | doğrulanamadı | Tepe biçimi belirtilmemiş. σ = 2 km Gauss tepesiyle 1,14°, σ = 1 km ile 0,88°, σ = 5 km ile 1,22° çıktı | Ekip hesabı, birebir tekrar edilemedi. Sonuç tepenin genişliğine bağlı. |
| A-55 | Aradaki fark "o mesafedeki ~1,4 km'lik örnekleme adımından" geliyor | §11 | ekip açıklaması | yanlış | Belgedeki kodun adımı 75 km ötesinde tam 2000 m. 100 km çevresindeki örnekler: 99,49 ve 101,49 km | Yeniden hesaplandı. Adım 1,4 km değil 2 km; tepeye en yakın örnek 0,51 km uzakta. |

## A3. Öneriler ve tasarım kararları (Belge A)

- Ufuk profili, kırılma olmadan ve eğrilik dahil Kartezyen koordinatta hesaplanmalı (MOON_ME, R = 1737,4 km).
- 720 azimut (0,5°) kullanılmalı. Bellek kısıtı varsa 360 yön kabul edilebilir.
- Örnekleme ICAT tarzı değişken adımlı ya da Barker tarzı iç içe DEM ile yapılmalı. Yakın alan 5–20 m/px, uzak alan 80–240 m/px; menzil 150 km.
- Güneş disk oranı için daire kesiti formülü kullanılmalı (r = 0,2665°).
- Hazır siteler için çevrimdışı hesaplanan `H(az)` profilleri JSON'da saklanmalı. Tarayıcı yalnızca `e > H(az)` testini ve disk oranını hesaplamalı.
- Özel koordinatlar için arka uçta ışın yürütme yapılmalı.
- Panorama şeridinde siluet çizilmeli; Güneş ve Dünya yolları bunun üstüne yerleştirilmeli.
- Arayüzde panel/direk yüksekliği bir giriş parametresi olmalı.
- Sonuçlar küçük bir güvenlik payıyla sunulmalı, çünkü DEM hatası iyimser sonuç verir.
- Sonuçlar PGDA ve Quickmap aydınlanma katmanlarıyla doğrulanmalı.
- İleri seviye için DLR'nin Fourier'le sıkıştırılmış ufuk haritaları ya da Stewart (1998) algoritması değerlendirilebilir.
- NumPy, rasterio ve SpiceyPy için önce ekip kararı (ADR) alınmalı.

## A4. Belge içi çelişkiler ve eskimiş bilgiler (Belge A)

- **§11'deki örnekleme adımı:** "~1,4 km'lik örnekleme adımı" açıklaması, belgenin kendi `sample_ranges` koduyla (75 km ötesi 2 km) çelişiyor (A-55).
- **±1,54° ifadesi (§3):** ±1,54° yalnızca tam kutup için geçerli. §4'te aynı belge −85° enlemde Güneş'in −6,5°'ye indiğini yazıyor. "Bütün yükseklik aralığından büyük" ifadesi genlik ile toplam aralığı karıştırıyor.
- **"ESA ICAT" adlandırması:** ICAT bir Astrium aracıdır; ESA'nın kendi aracı STK tabanlı Coverage tool. Belge iki aracı da "ESA" diye anıyor (§4, §5, §7).
- **Mazarico zaman adımı:** §7 tablosu ve §9'daki "literatür standardı" ifadesi PGDA sayfasındaki 1 saate dayanıyor. Makale özeti 6 saat diyor (A-33).
- **"Nütasyon döngüsü" terimi:** 18,6 yıllık döngü için PGDA "nutation", Mazarico özeti ve Barker "precession" diyor. Teknik olarak düğüm presesyonu kastediliyor; belgedeki "nütasyon" PGDA'nın ifadesi.
- **Kod ile metin uyumu:** Kod ile metin formülleri tutarlı. `sample_ranges` ICAT tanımıyla, `sun_fraction` §5 formülüyle aynı; Kartezyen elevasyon formülü §4 adım 4 ile aynı. Azimut sarması `np.interp(..., period=360)` ile doğru çalışıyor (NumPy 2.2.1 ile denendi).
- **Belge B ile tutarlılık:** §10'daki "oradaki döngü d²/2R kullanıyor ve 360 yön öngörüyor" tespiti doğru (Belge B §M2). Disk modeli çelişkisi aşağıda, Belge B bölümünde.

---

# BELGE B: light-heat-layer/README.md

## B1. Belge özeti

- Rover için sıcaklık sorununu bir enerji sorunu olarak ele alan bir mimari önerisi. Ölçüt: gölgede geçen saat ve zemin sıcaklığı.
- Yedi modül tanımlıyor:
  - M1: arazi, eğim, bakı ve 15° maskesi.
  - M2: kare başına ufuk maskesi.
  - M3: Güneş ve Dünya az/el tablosu.
  - M4: ışık ve Dünya takvimi.
  - M5: Heat1d zemin sıcaklığı. Ufuk maskesinden gelen gölgeli akı `flux_series` ile verilir.
  - M6: rover enerji modeli.
  - M7: zamana bağlı A* (bekleme hamlesi dahil).
- VIPER parametrelerini varsayılan rover profili olarak öneriyor: 9,5 saat, 50 saat, 1 cm/s, 15° ve güvenli liman.
- Ön hesap Python ile bir kez yapılır; arayüz hazır dosyaları okur. Dosya boyutları 200×200 kare ve 709 saatlik adım için tahmin edilmiş.
- Açık kaynak araçları listeliyor: heat1d, HORAYZON, Schörghofer kod koleksiyonu, astroquery, SpiceyPy, astronomy-engine ve PGDA verileri.
- 15 Kasım teslimine kadar bir aşama planı var: ufuk → ışık takvimi → pil kurallı A*; Heat1d ekstra. Riskler de listelenmiş.

## B2. İddia tablosu (Belge B)

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt (açılan adres + alıntı/sayı) | Not |
|---|---|---|---|---|---|---|
| B-1 | Test sahası Mons Mouton (−84,78°, 29,13° D), ephemeris çalışmasıyla aynı | başlık | proje içi ephemeris raporu | doğrulandı | docs/research/ephemeris-rotation-ground-stations/...arastirma.pdf: "LAT, LON, H = -84.78, 29.13, 0.0" | IAU Gazetteer (https://planetarynames.wr.usgs.gov/Feature/16070): merkez −84,60°, 31,00° D, çap 130 km, enlem −83,30…−86,22. Nokta dağın sınırları içinde. |
| B-2 | Heat1d tek başına düz zemin varsayar | §1, §2 | heat1d GitHub | kısmen doğru | https://github.com/phayne/heat1d (master, python/CHANGELOG.md): "Sloped-surface modeling: Braun & Mitchell (1983) slope insolation with self-shadowing (direct flux is zero when the sun is ... below the flat horizon)" | Güncel kod eğimli yüzeyi ve PSR kraterini (`psr_d_D`) destekliyor; belgenin kendi kodu da `slope` veriyor. Eksik olan, uzak arazinin gölgesi. Belgenin ana fikri geçerli, ifadesi eskimiş. |
| B-3 | Heat1d'nin güncel sürümü v0.4.1 | §1, §4 M5, §7 | heat1d GitHub | kısmen doğru | master `python/pyproject.toml`: version = "0.4.1"; CHANGELOG: "[v0.4.1] - Unreleased". En son etiket v0.3.2; https://pypi.org/pypi/heat1d/json: 0.3.2 | v0.3.2 etiketinde yalnızca `__init__, cli, main, orbits, plotting` var; `model.py` ve `horizons.py` yok. `pip install heat1d` belgedeki API'yi vermez; GitHub master'dan kurulmalı. |
| B-4 | Heat1d dış akıyı kod değiştirmeden kabul eder: `Model(flux_series=..., flux_dt=...)` | §1, §4 M5 | heat1d kaynak kodu | doğrulandı | master `heat1d/model.py`: `def __init__(self, planet=..., flux_series=None, flux_dt=None, custom_layers=None, psr_d_D=None, slope=0.0, slope_az=0.0, ...` | Aynı dosya: "Active only during the output phase; equilibration always uses the built-in surfFlux()". Yani ısınma (spin-up) gölgesiz yerleşik akıyla yapılıyor. |
| B-5 | Kaynak kodda doğrulanan parametreler: `flux_series`, `flux_dt`, `slope`, `slope_az`, `psr_d_D`, `horizons_to_flux` | §4 M5 tablo | heat1d kaynak kodu | doğrulandı | master `model.py` imzası (B-4); `horizons.py`: `def horizons_to_flux(solar_elevation_deg, observer_range_au, planet, azimuth_deg=None, slope=0.0, slope_az=0.0)` | `slope` radyan cinsinden ve kuzeyden saat yönünde. `slope` ile `psr_d_D` birlikte verilirse ValueError. |
| B-6 | Heat1d'de `flux[0]` yerel öğlene karşılık gelir; `flux_noon_idx` vermek gerekebilir | §4 M5 Dikkat | heat1d kaynak kodu | kısmen doğru | master `model.py`: "(0 = local noon, the default when no phase information is supplied)". `_flux_time_to_noon`: "falling back ... to the peak of the first diurnal cycle (valid only for flat surfaces)" | Faz bilgisi verilmezse model öğleni ilk günün akı tepesinden tahmin ediyor. Gölgeyle kesilmiş ya da eğime göre izdüşürülmüş seride bu tahmin yanlış olur. İlk gün akı sıfırsa faz hiç belirlenemez. Kesin parametre `flux_lt0_hr`. |
| B-7 | heat1d MIT lisanslı | §4 M5, §7 | heat1d GitHub | doğrulandı | https://api.github.com/repos/phayne/heat1d: license "MIT"; LICENSE: "MIT License Copyright (c) 2017 phayne" | |
| B-8 | heat1d Python ve hızlı C sürümüyle geliyor; içinde `heat1d.horizons` modülü var | §4 M3, M5 | heat1d GitHub | doğrulandı | Depo kökünde `c/` (heat1d.c, fourier_solver.c) ve `python/heat1d/c_wrapper.py`. `horizons.py`: `"CENTER": f"'coord@{body_id}'"`, Moon "301" | |
| B-9 | Hayne vd. 2017, arXiv 1711.00977 (heat1d'nin bilimsel dayanağı) | §10 | arXiv | doğrulandı | https://arxiv.org/abs/1711.00977: "Global regolith thermophysical properties of the Moon from the Diviner Lunar Radiometer Experiment" (Hayne, Bandfield, Siegler; 2017) | |
| B-10 | VIPER: gölgede dayanma (matkap çalışırken) ~9,5 saat | §2 tablo | Shirley ve Balaban 2022 | doğrulandı | https://www.nasa.gov/wp-content/uploads/2022/05/overview_of_mission_planning_for_the_viper_rover.pdf, slayt 5: "Working endurance in shadow (w/drill): ~9.5 hrs" | |
| B-11 | VIPER: en düşük güç modunda dayanma 50 saat | §2 tablo | Shirley ve Balaban 2022 | doğrulandı | Aynı PDF, slayt 5: "Endurance in min power mode: 50 hrs" | |
| B-12 | VIPER ortalama hız (bekleme dahil) 1 cm/s ≈ 36 m/saat | §2 tablo | Shirley ve Balaban 2022 | doğrulandı | Aynı PDF, slayt 5: "1 cm/s average speed"; "10 cm/s when moving (waiting 90% of time)" | 36 m/saat yeniden hesaplandı. Ennico-Smith 2023: düz zeminde en fazla 20 cm/s, etkin hız (SMG) ≈ 1 cm/s. |
| B-13 | VIPER eğim sınırı 15° | §2 tablo, M1 | Shirley ve Balaban 2022 | doğrulandı | Aynı PDF, slayt 5: "15 deg slope limit" | Coyan 2025 de "slopes that exceed the 15° threshold" diyor. |
| B-14 | Güvenli liman: Dünya ufkun altındayken karanlık ≤ 50 saat | §2 tablo | Shirley ve Balaban 2022 | doğrulandı | Aynı PDF, slayt 12: "<= 50 hours darkness while Earth is below the horizon"; Ennico-Smith 2023: "shadow periods <50 hrs" | |
| B-15 | Kutupta gölgeler rover'ın ortalama hızıyla aynı hızda kayar | §2 | Shirley ve Balaban 2022 | doğrulandı | Aynı PDF, slayt 9: "Sun and radio shadows move at speeds similar to VIPER's average speed" | |
| B-16 | VIPER ekibi aynı problemi aynı yerde, Mons Mouton'da çözmüştü | §2 | Shirley ve Balaban 2022; Ennico-Smith 2023 | kısmen doğru | https://ntrs.nasa.gov/api/citations/20230004239/downloads/SSR2023-VIPER-Planning-Ennico.pdf: "VIPER is scheduled to land on Mons Mouton near the lunar South Pole in late 2024" | Mons Mouton hedefi Ennico-Smith 2023 ile doğrulanıyor. Ancak gösterilen 2022 sunumu Nobile, Haworth ve Shoemaker alanlarını inceliyor; Mons Mouton orada geçmiyor. |
| B-17 | VIPER üç boyutlu termal model kullandı: 2–20 m'lik üçgen ağ, 6 saatlik adım | §2 | Coyan, Siegler vd. 2025 | doğrulandı | https://iopscience.iop.org/article/10.3847/PSJ/adbc6c: "variable-sized mesh (between 2 and 20 m) of triangular 3D finite elements"; "at 6 hr time resolution" | |
| B-18 | Bu modelin kodu ve çıktıları açık değil | §2 | Coyan vd. 2025 (dolaylı) | doğrulanamadı | Açılan makale sayfasında veri/kod erişilebilirliği ifadesi bulunamadı | Olumsuz bir iddia; kaynakta dayanağı bulunamadı. |
| B-19 | PGDA 5 m saha DEM listesinde "Site20, Leibnitz beta plateau" var; eğim GeoTIFF'i de veriliyor; ızgara güney kutup stereografik, metre | §4 M1 | PGDA 78 | doğrulandı | https://pgda.gsfc.nasa.gov/products/78: "Site20: Leibnitz beta plateau"; "Site20 slope: Site20_final_adj_5mpp_slp.tif"; "5 m/pix GeoTiffs with south polar stereographic X/Y coords in meters" | "Site20v2: extended boundaries" sürümü de var. |
| B-20 | Leibnitz beta plateau, Mons Mouton'un eski adı | §4 M1 | yok | kaynağı yok | — | NASA SVS (https://svs.gsfc.nasa.gov/5074): "sometimes known informally as Leibnitz Beta, has been officially named Mons Mouton". Gazetteer onay tarihi 13 Mayıs 2022. Yani eski ad resmi değil, gayriresmi. |
| B-21 | Ufuk maskesi `horizon[200,200,360]` float16 ≈ 29 MB | §4 M2 tablo | ekip tahmini | doğrulandı | Hesap: 40 000 × 360 × 2 B = 28,8 MB | Yeniden hesaplandı. 720 yönle 57,6 MB. |
| B-22 | HORAYZON (Steger vd. 2022): ufuk maskesi, eğim ve bakı; Python | §4 M2, §7 | GMD 15, 6817 | doğrulandı | https://gmd.copernicus.org/articles/15/6817/2022/: "HORAYZON v1.2: ... ray-tracing algorithm to compute horizon and sky view factor". GitHub açıklaması: "horizon, sky view factor, topographic openness, slope angle/aspect" | Lisans MIT (GMD: "made available under the terms and conditions of the MIT license"). Dünya (WGS84) odaklı; README'de Ay ya da başka gezegen kullanımı yok. Embree, TBB ve NetCDF C++ bağımlılıkları var. |
| B-23 | Schörghofer Planetary-Code-Collection, M2 için referans algoritma | §4 M2, §7 | GitHub | doğrulandı | https://github.com/nschorgh/Planetary-Code-Collection README: "calculates horizons from a digital elevation model for terrain shadowing calculations" (`Topo3D/`) | GitHub lisans algılamıyor (license: null) ve kökte LICENSE dosyası yok. README: Numerical Recipes dosyaları "separate copyright". Apache 2.0 projede kod kopyalanamaz; yalnızca referans olarak kullanılabilir. |
| B-24 | Mons Mouton'un plato kenarı ≈ 50 km uzakta; ufku ≈ 1° değiştirebilir | §4 M2 not | proje içi ephemeris raporu | doğrulandı | `ephemeris-rotation-ground-stations/ay-geometri-katmani-ekip-sunumu.pptx`, slayt 4: "yaklaşık 50 km ötedeki plato kenarı ufku tahminen 1° alçaltır" | Kaynak bağlantılı README değil, aynı klasördeki pptx. Yeniden hesaplandı: aynı yükseklikteki bir kenar 50 km'de −0,82° verir; "≈ 1°" ile tutarlı. |
| B-25 | Efemeris işi ekipte hazır ve üç yöntemle çapraz doğrulanmış | §4 M3 | proje içi ephemeris README | doğrulandı | `ephemeris-rotation-ground-stations/README.md`: "`scripts/crosscheck.py` — Üç bağımsız yöntemle az/el çapraz doğrulaması"; `crosscheck_out.csv` | Çapraz doğrulamanın kendisi tekrar edilmedi. |
| B-26 | Bir Ay günü saatlik adımla ≈ 709 adım | §4 | formül | doğrulandı | 29,53 gün × 24 = 708,7 | Yeniden hesaplandı (NSSDC: synodic period 29.53 d) |
| B-27 | Efemeris tablosu 709 × 6, "birkaç yüz KB" (§5'te "< 1 MB") | §4 M3, §5 | ekip tahmini | yanlış | Hesap: 709 satır × ~60 B ≈ 40–50 KB | Yeniden hesaplandı. Gerçek boyut 5–10 kat küçük. "< 1 MB" ifadesi doğru, "birkaç yüz KB" yanlış. |
| B-28 | astroquery.jplhorizons Ay yüzeyindeki gözlemciyi destekler; lisansı BSD-3 | §4 M3, §7 | astroquery belgesi | doğrulandı | https://astroquery.readthedocs.io/en/stable/jplhorizons/jplhorizons.html: "{'lon': ..., 'lat': ..., 'elevation': ..., body: Horizons ID of center body}"; örnek 'body': 301. GitHub API: BSD-3-Clause | |
| B-29 | 4 km'lik bölgede yerel dikey ≈ 0,13° döner | §4 M3 | formül | doğrulandı | 4 km / 1737,4 km = 0,132° | Yeniden hesaplandı. Bölge merkezinden kenara (2 km) 0,066°. |
| B-30 | Güneş diski yarıçapı ≈ 0,27° | §4 M4 | formül | doğrulandı | 0,533° / 2 = 0,2665° | Yeniden hesaplandı |
| B-31 | `sun_vis` uint8 ≈ 28 MB; `earth_vis` bit ≈ 3,5 MB | §4 M4, §5 | ekip tahmini | doğrulandı | Hesap: 709 × 40 000 B = 28,4 MB; /8 = 3,5 MB | Yeniden hesaplandı |
| B-32 | `T_surf` 6 saatlik adımda float16 ≈ 9 MB; `terrain.npz` ≈ 0,5 MB | §4 M5, §5 | ekip tahmini | doğrulandı | Hesap: 119 × 40 000 × 2 B = 9,5 MB; 3 × float32 katman + bool = 0,52 MB | Yeniden hesaplandı |
| B-33 | Durum sayısı 40 000 × 709 ≈ 28 milyon; 1 cm/s ≈ 36 m/saat | §4 M7, §2 | formül | doğrulandı | 28,36 milyon; 0,01 × 3600 = 36 | Yeniden hesaplandı |
| B-34 | Panel formülünde güneş sabiti 1361 W/m² | §4 M6 | yok | kaynağı yok | — | heat1d `planets.py`'de `Earth.S = 1361` ("Annual mean solar constant"). |
| B-35 | Projenin lisansı Apache 2.0 | §7 | proje LICENSE | doğrulandı | `LICENSE`: "Apache License Version 2.0, January 2004" | |
| B-36 | MIT ve BSD lisanslı araçlar Apache 2.0 ile uyumlu | §7 | yok | kaynağı yok | — | Hukuki bir genelleme; kaynak gösterilmemiş. |
| B-37 | PGDA kutup aydınlanma ve Dünya görünürlük haritaları M4'ü doğrulamada kullanılabilir | §4 M4, §7 | PGDA 69 | doğrulandı | https://pgda.gsfc.nasa.gov/products/69: "Average solar illumination", "Permanent shadow", "Average Earth visibility" (IMG, JP2, TIF, COG) | 60 m/px yalnızca 85S–90S; Mons Mouton için 120 m/px (75S–90S) gerekir. PGDA'da Dünya "if any part of its disc is not obscured" görünür sayılıyor; `earth_ok` merkez ölçütüyle kıyaslanırsa PGDA iyimser kalır. |
| B-38 | NASA arazi termal modeli eğitimi Horizons ve LOLA kullanıyor | §10 | NTRS 20260007830 | doğrulandı | https://ntrs.nasa.gov/api/citations/20260007830 (tam metin): "LDEMs from the Lunar Orbiter Laser Altimeter (LOLA) ... JPL Horizons provides ephemerous data" | TFAWS 2026 kısa kursu. Kullandığı araç Thermal Desktop ticari bir yazılım, açık kaynak değil. |
| B-39 | "Kullanıcı başına çağrı yapılmaz" kararı ephemeris raporunda var | §5 | proje içi ephemeris raporu | doğrulandı | ...arastirma.pdf: "Tasarim karari: tarayicidan her kullanici için Horizons'a gitmeyin" | |
| B-40 | Dünya görünürlük ölçütü (merkez / ilk kenar / tam disk) ephemeris raporunda bekleyen bir karar | §9 | proje içi ephemeris raporu | doğrulandı | ...arastirma.pdf: "Dünya görünürlük kriteri: merkez mi, en az bir kenar mi, tam disk mi?" | |
| B-41 | Hazır kütüphaneler zamana bağlı maliyeti desteklemiyor (kendi A*'ımız gerekli) | §4 M7 | yok | kaynağı yok | — | |
| B-42 | Teslim: 15 Kasım 2026, 23:59 | §8 | yok | kaynağı yok | — | Challenge metninde ve README'de yok; yalnızca solar-panel-model notunda tekrar ediyor. |

## B3. Öneriler ve tasarım kararları (Belge B)

- Rota ölçütü sıcaklık yerine enerji olmalı: gölgede geçen saat ve zemin sıcaklığı. Heat1d, ufuk maskesinden gelen gölgeli akıyla beslenmeli.
- Aynı ufuk maskesinden Güneş takvimi, Dünya takvimi ve sıcaklık türetilmeli; hepsi zamana bağlı A*'ya girmeli.
- Ağır hesaplar önceden ve bir kez Python ile yapılmalı. Arayüz hazır dosyaları okumalı; kullanıcı başına Horizons çağrısı yapılmamalı.
- Öncelik sırası: ufuk maskesi → ışık takvimi → pil kurallı A*. Heat1d zaman kalırsa eklenmeli.
- Varsayılan rover profili VIPER değerleriyle kurulmalı ve arayüzde varsayım olduğu belirtilmeli.
- İki çözünürlüklü DEM kullanılmalı: yakın alanda 5 m saha DEM'i, uzak ufuk için 20–60 m'lik LOLA.
- Bölge için tek bir efemeris listesi kullanılmalı; gerekirse kare bazında düzeltilmeli.
- M4'te Güneş diski 0–1 arası görünür kesir olarak tutulmalı; Dünya için boolean yeterli.
- Heat1d yavaş kalırsa kareler ışık deseni, eğim ve bakıya göre gruplanmalı.
- A*'da pil durumun parçası değil etiket olmalı. Arama zaman penceresiyle sınırlanmalı; kaba ızgarada bulunan rota ince ızgarada düzeltilmeli. "Bekle" de bir hamle olmalı.
- Büyük veri dosyaları repoya konmamalı; üretim betiğiyle oluşturulmalı.
- "Python ile ön hesap" kararı ADR olarak yazılmalı.
- Gölgede ısıtıcı için önce sabit bir saatlik harcama kullanılmalı; M5 gelince sıcaklığa bağlanmalı.

## B4. Belge içi çelişkiler, eskimiş bilgiler ve eksikler (Belge B)

- **Heat1d "düz zemin" ifadesi:** Belge, "Heat1d tek başına düz zemin varsayar" diyor ama kendi M5 kodunda `slope` ve `slope_az` veriyor. Güncel Heat1d eğimi destekliyor.
  - `slope > 0` olduğunda varsayılan olarak `ground_heating` açık. Bu ek akı gölgesiz bir düz komşu çalıştırmadan geliyor.
  - Bu nedenle §9'daki "yansıyan ışık yok" varsayımı eğimli karelerde tam geçerli değil. Gölgedeki eğimli kareler fazladan ısınabilir.
- **Heat1d sürümü:** "v0.4.1 güncel sürüm" yayımlanmış bir sürüm değil (CHANGELOG: Unreleased). PyPI'deki 0.3.2'de belgedeki API yok. Kurulum talimatı GitHub master olarak yazılmalı.
- **Heat1d kod örneğindeki import:** `import numpy as np, planets` satırı güncel koda uymuyor. heat1d, 24 Mart 2026 tarihli commit ile harici `planets` paketini kaldırdı ("Added planets.py and removed planets package dependency"); doğrusu `from heat1d import planets`.
- **Isınma (spin-up) riski kaynakta yanıtlanıyor:** §9'daki "dış akı ile denge davranışı denenmeli" sorusunun cevabı heat1d kaynak kodunda var. Denge fazı her zaman yerleşik `surfFlux()` ile, yani gölgesiz akıyla yapılıyor. Kalıcı ya da uzun gölgedeki kareler sıcak başlar.
- **Öğlen hizalaması:** Gölgeyle kesilmiş akıda `flux_lt0_hr` (ya da `flux_noon_idx`) verilmezse öğlen yanlış tahmin edilir (B-6).
- **Güneş disk modeli, iki belge arasında:**
  - Belge B M4 doğrusal model kullanıyor: `clip(fark/(2·0,27) + 0,5)`, r = 0,27°. Bu ICAT'in "dikey oran" yaklaşımı.
  - Belge A §5 ise daire kesiti formülünü öneriyor (r = 0,2665°).
  - x = 0,5'te ikisi %75 ve %80,4 veriyor. Hangisinin kullanılacağına karar verilmeli.
- **Azimut sayısı:** Belge B M2 360 yön öngörüyor, Belge A 720 yön öneriyor. Belge A bunu kendisi not ediyor.
- **Efemeris dosya boyutu:** "Birkaç yüz KB" tahmini hesapla tutmuyor (≈ 40–50 KB). Aynı belgedeki "< 1 MB" ise doğru (B-27).
- **"Mons Mouton'da çözmüştü":** Gösterilen 2022 VIPER sunumu Mons Mouton'u değil Nobile, Haworth ve Shoemaker'ı ele alıyor. Mons Mouton yalnızca 2023 özetinde geçiyor.
- **"Kontrol edilmeli" diye bırakılan lisanslar:** HORAYZON MIT, SpiceyPy MIT (GitHub API), astronomy-engine MIT (GitHub API: cosinekitty/astronomy), astroquery BSD-3. Planetary-Code-Collection lisanssız (GitHub algılamıyor, LICENSE yok).
- **PGDA doğrulama verisinin kapsamı:** PGDA'nın 60 m/px ürünü test sahasını (−84,78°) kapsamıyor (B-37).

---

## 5. Etiket sayıları

| Etiket | Belge A | Belge B | Toplam |
|---|---|---|---|
| doğrulandı | 42 | 31 | 73 |
| kısmen doğru | 5 | 4 | 9 |
| yanlış | 1 | 1 | 2 |
| kaynağı yok | 6 | 5 | 11 |
| doğrulanamadı | 1 | 1 | 2 |
| **Toplam** | **55** | **42** | **97** |

## 6. Açılamayan kaynaklar ve bulunamayan bilgiler

| Adres | Hata / durum | Etki |
|---|---|---|
| https://ui.adsabs.harvard.edu/abs/2014Icar..243...78G | AWS WAF CAPTCHA ("Human Verification") | Aynı makalenin özeti https://elib.dlr.de/94240/ adresinden açıldı. A-35 ve A-40 oradan doğrulandı. |
| Mazarico vd. 2011 tam metni (https://ntrs.nasa.gov/citations/20120010094) | NTRS kaydında indirilebilir dosya yok (downloads boş); Elsevier ücretli | Yalnızca özet açıldı. 1 saat ile 6 saat arasındaki çelişki (A-33) tam metinden çözülemedi. |
| https://raw.githubusercontent.com/phayne/heat1d/v0.3.2/python/heat1d/model.py | 404 Not Found (dosya o etikette yok) | Bilgi niteliğinde: v0.3.2'de `model.py` bulunmadığını gösteriyor (B-3). |
| https://iopscience.iop.org/article/10.3847/PSJ/adbc6c | Sayfa açıldı; veri/kod erişilebilirliği bölümü metinde bulunamadı | B-18 doğrulanamadı. |
| HPG 2025 sunumu, yazar listesi | Slaytlarda yalnızca Jonathan Fritsch yazıyor | Belgedeki altı yazarlı künye doğrulanamadı (A-52 Not). |
