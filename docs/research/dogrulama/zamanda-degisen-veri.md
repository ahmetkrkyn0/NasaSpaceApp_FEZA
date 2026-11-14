# Doğrulama: Zamanla değişen verinin hazırlanması

Bu dosya [ANALIZ-OZETI.md](../ANALIZ-OZETI.md) belgesinin ekidir. Araştırma notundaki her kontrol edilebilir iddia, notun gösterdiği kaynak açılarak karşılaştırıldı.

- **Doğrulama tarihi:** 14 Kasım 2026
- **İncelenen dosyalar:** [zamanda-degisen-veri-hazirlama.md](../zamanda-degisen-veri-hazirlama.md), [Ay’da Zaman Işık, Gölge, Isı.pdf](../Ay’da%20Zaman%20Işık,%20Gölge,%20Isı.pdf)
- **Not:** Kanıt sütunundaki alıntılar kaynaktaki haliyle bırakıldı. Sayılar ve birimler kaynakla aynı yazıldı.

| Etiket | Adet |
|---|---:|
| doğrulandı | 86 |
| kısmen doğru | 12 |
| yanlış | 1 |
| kaynağı yok | 16 |
| doğrulanamadı | 6 |
| **Toplam** | **121** |

İncelenen dosyalar:
- `docs/research/zamanda-degisen-veri-hazirlama.md` (980 satır, ana belge)
- `docs/research/Ay’da Zaman Işık, Gölge, Isı.pdf` (aynı konunun sunum metni)


## 1. Belge özeti

- **Konu:** Zamanla değişen katmanların (Güneş/Dünya konumu, aydınlanma, Dünya görünürlüğü, güç, sıcaklık, tutulma) nasıl üretileceği, saklanacağı ve doğrulanacağı.
- **Ana fikir (ayrıştırma):** Sahaya bağlı statik kısım (ufuk maskesi, normal, albedo) ile tüm sahalar için ortak efemeris ayrı tutulur. Böylece depolama O(N_site + N_t) olur.
- **Zaman ve çerçeve:** Zamanda UTC etiket, TDB hesap; çerçeve `MOON_ME`.
- **Efemeris üretimi:** Ana yol SPICE (DE440 kernel'leri), doğrulama yolu JPL Horizons.
- **Efemeris tablosu:** 2026–2032 için saatlik float32 tablo, yaklaşık 1.7 MB.
- **Gölge:** Saha başına 720 azimutluk ufuk maskesi (1.4 KB) ile hesaplanır. Güneş ve Dünya disk olarak modellenir.
- **Olaylar:** Örnekleme yerine kök bulma ile hesaplanır. Belge tutulmayı örnek gösterir: 20–21 Şubat 2027, Apollo 11 sahası.
- **Güç ve termal:** Güç modeli ve batarya boyutlandırması verilir. Hayne et al. (2017) 1-B regolit termal modelinin yeniden yazımı Ek A'da.
- **Kalan bölümler:** Hata bütçesi, veri hattı, dosya düzeni ve uygulama sırası. Formatın ADR ile kesinleşmesi öneriliyor.

## 2. İddia tablosu

Kısaltmalar:
- HZ = JPL Horizons API sorgusu (bu oturumda çalıştırıldı, `dl/zaman/*.txt`).
- SP = belgedeki Ek A.1 SPICE kodu, bu oturumda NAIF kernel'leriyle çalıştırıldı (`scripts-zaman/spice_a1.py`).
- "yeniden hesaplandı" = ekip hesabı bu oturumda tekrarlandı.

### 2.1 Ana belge

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt | Not |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Seriler Horizons (DE441) ve SPICE (DE440) ile çekildi | Başlık, Doğrulama | Horizons, NAIF | doğrulandı | HZ başlığı: "Target body name: Sun (10) {source: DE441}"; NAIF spk/planets: de440s.bsp | yeniden sorgulandı |
| 2 | R = 1737.4 km LOLA referans küresi | §0 | yok | kaynağı yok | — | PGDA 69: "referenced to a 1737.4 km sphere"; HZ başlığı "Center radii: 1737.4" |
| 3 | S0 = 1361 W m⁻² (Kopp & Lean 2011) | §0, §7.1 | Kopp & Lean 2011 | doğrulandı | api.openalex.org (doi:10.1029/2010GL045777) özet: "1360.8 ± 0.5 W m−2" | Hayne 2017 Tablo A1 de 1361 kullanır |
| 4 | r = 0.2615°–0.2717° (2027) | §0 | hesaplandı | doğrulandı | HZ Q13, 89.5°G: 0.2615–0.2717° | yeniden hesaplandı |
| 5 | r⊕ = 0.899°–1.023° (2027); §5.4'te 0.9–1.02° | §0, §5.4 | hesaplandı | doğrulandı | HZ Q13, 89.5°G: 0.8985–1.0232° | yeniden hesaplandı; Apollo 11'den 0.902–1.028° |
| 6 | d⊕ "Ay–Dünya merkez uzaklığı" 357 172–406 732 km | §0 | hesaplandı | kısmen doğru | HZ 89.5°G topo-merkezli: 357 172–406 732 km; HZ CENTER=500@301 (Ay merkezi): 357 278–406 611 km | yeniden hesaplandı; belgedeki sayılar sahadan ölçülen uzaklık, merkezden merkeze uzaklık değil |
| 7 | Dönemler: 29.530589 g, 27.212221 g, 27.554550 g, 346.62 g, 18.61 y | §0, §1 | yok | kaynağı yok | — | Hayne 2017 Tablo A1: sinodik ay 29.5306 d |
| 8 | Ay ekvatoru–ekliptik açısı 1.543° | §0 | yok | kaynağı yok | — | Williams 2019 özeti: "1.54° angle between the Moon's spin pole and the ecliptic plane" |
| 9 | σ = 5.670374×10⁻⁸ W m⁻² K⁻⁴ | §0 | yok | kaynağı yok | — | — |
| 10 | Link bütçesi "±1.13 dB", gecikme 1.19–1.36 s | §1 tablo | hesaplandı (§9) | kısmen doğru | 20log10(406732/357172) = 1.129 dB (toplam aralık); 1.191–1.357 s | yeniden hesaplandı; 1.13 dB toplam aralıktır, ± ile yazılırsa ±0.56 dB olmalı (§9 "1.13 dB fark" ile çelişki) |
| 11 | Tutulma: yılda 0–3 olay | §1 tablo | yok | kaynağı yok | — | — |
| 12 | Kutup istatistikleri tam 18.6 yıl üzerinden; Mazarico 2011 ve Gläser 2014 bu yaklaşımı izler | §1 not | Mazarico 2011, Gläser 2014 | doğrulandı | NTRS 20120010094 özeti: "several 18.6-years lunar precession cycles ... (6 h)"; elib.dlr.de/94240: "A 19-year study covering the lunar precessional cycle" | Gläser'in 19 yıllık koşusu yalnız Connecting Ridge sahası için |
| 13 | Güneş paralaksı R/1 AU = 1.16×10⁻⁵ rad ≈ 2.4″ | §2, §4.5 | hesap | doğrulandı | 1737.4/1.496e8 = 1.161e-5 rad = 2.40″ | yeniden hesaplandı |
| 14 | Dünya paralaksı ≈ 4.5×10⁻³ rad ≈ 0.26° | §2, §4.5 | hesap | doğrulandı | 1737.4/384400 = 4.52e-3 rad = 0.259° | yeniden hesaplandı |
| 15 | Naif saklama 8.8 GB/yıl; ayrıştırılmış 1.44 GB + 0.25 MB; GPU belleği 1.44 GB | §2, §5.6 | hesap | doğrulandı | 1e6×8760 B = 8.76 GB; 1e6×720×2 B = 1.44 GB; 8760×28 B = 0.245 MB | yeniden hesaplandı |
| 16 | TT = TAI + 32.184 s; ΔAT = 37 s (2017'den beri) | §3.1 | yok | kaynağı yok | — | naif0012.tls: "37, @2017-JAN-1" |
| 17 | TDB−TT ≈ 0.001657 sin g + 0.000014 sin 2g | §3.1 | yok | kaynağı yok | — | — |
| 18 | TDB−UTC ≈ 69.184 s; karışırsa azimut hatası 0.0098° | §3.1, §10.1 | hesap | doğrulandı | 37 + 32.184 = 69.184 s; 69.184 s × 0.508°/sa = 0.0098° | yeniden hesaplandı |
| 19 | `str2et` UTC girdisini `naif0012.tls` ile TDB'ye çevirir | §3.1, Ek A.1 | NAIF generic kernels | doğrulandı | SP: UTC girdili kod, HZ'nin UT çıktısıyla 1e-6° içinde aynı | kod çalıştırıldı |
| 20 | Horizons gözlemci tabloları varsayılan olarak UT, istenirse TT | §3.1 | Horizons API dokümanı | doğrulandı | ssd-api.jpl.nasa.gov/doc/horizons.html, TIME_TYPE: "observer tables: UT or TT"; HZ başlığı "...00:00:00.0000 UT" | — |
| 21 | Ay saatleri günde ~56 µs hızlı işler (LTC) | §3.1 | yok | kaynağı yok | — | — |
| 22 | ME–PA farkı ~0.02886°, yüzeyde ~875 m | §3.2 | moon_de440_250416.tf yorumu | doğrulandı | tf: "the rotation angle between the MOON_ME and MOON_PA frames is approximately 0.02886 degrees ... approximately 875 m" | SP pxform ile de 0.02886° bulundu |
| 23 | 89.5°G 0°D'de ME→PA kayması 663 m | §3.2, §10.1 | hesaplandı | doğrulandı | SP pxform('MOON_ME','MOON_PA'): 663 m | yeniden hesaplandı; Apollo 11'de 832 m |
| 24 | Horizons Ay için mean-Earth (DE421) kullanır; başlıkta "Center pole/equ : MEAN_ME (high precision)" | §3.2 | Horizons manual | doğrulandı | ssd.jpl.nasa.gov/horizons/manual.html: "Lunar Mean-Earth Frame of DE421"; HZ başlığında satır aynen var | Manual ayrıca: "The lunar PA frame is not currently available in Horizons" |
| 25 | Güncel çift: moon_pa_de440_200625.bpc + moon_de440_250416.tf; MOON_ME, MOON_ME_DE440_ME421'in takma adı ve DE421 ME ile hizalı | §3.2, §4.2 | NAIF tf | doğrulandı | tf: "MOON_ME is an alias for the frame MOON_ME_DE440_ME421, which is closely aligned with ... DE421" | tf'ye göre DE421 ME ile fark 2000–2040 için ≤53.4 cm. PGDA 78 LDEM'leri "MOON_ME reference frame of ephemeris DE421" |
| 26 | Eski moon_de440_220930.tf artık a_old_versions/ altında | §3.2 | NAIF | doğrulandı | fk/satellites/a_old_versions/ listesi: "moon_de440_220930.tf 2022-09-30" | 250416.tf başlığı önceki sürümü "moon_pa_de440_220930.tf" diye yazıyor; bu, NAIF'in kendi yazımı |
| 27 | Çerçeve karışırsa saha ~0.7–0.9 km kayar | §3.2 | tf + hesap | doğrulandı | 663 m (89.5°G), 832 m (Apollo 11), en fazla 875 m | yeniden hesaplandı; alt uç 0.66 km |
| 28 | Kutup stereografik formülleri; k = 2/(1−sin φ), 80°G'de 1.0076 | §3.4 | yok (PDS etiketiyle teyit önerilmiş) | kaynağı yok | — | Aritmetik tutarlı: k(−80°) = 1.00765 |
| 29 | SPICE kernel yükü ~45 MB | §4.1 | NAIF | doğrulandı | İndirilen boyutlar: de440s 32 726 016 B, bpc 12 863 488 B, pck00011 131 226 B, tf+tls ~25 KB; toplam ≈ 45.8 MB | — |
| 30 | de440s.bsp kapsamı 1849–2150, boyutu 32 MB | §4.2 | NAIF | doğrulandı | spk/planets/aa_summaries.txt: "1849 DEC 26 ... 2150 JAN 22"; dosya 32.7 MB | — |
| 31 | Kernel adları ve görevleri (tls, tpc, bsp, bpc, tf) | §4.2, Ek A | NAIF | doğrulandı | lsk/, pck/, spk/planets/, fk/satellites/ listeleri; .cmt: "high-accuracy lunar orientation data from ... DE440" | — |
| 32 | SPICE ve Horizons az/el tablosu (4 satır), fark ≤10⁻⁶° | §4.2, Ek A.1 | hesaplandı | doğrulandı | SP: 263.107140/0.953942; 5.703098/−6.428524; 88.513836/67.428442; 288.494574/72.823768. HZ: aynı, yalnız son hanede ±1 | yeniden hesaplandı; iki sütun belgeyle birebir |
| 33 | Horizons parametreleri: COMMAND 10/399, CENTER coord@301, GEODETIC, SITE_COORD = doğu boylamı, enlem, km; Q4 = Az/El, Q13 = açısal çap, Q20 = uzaklık | §4.3 | Horizons API dokümanı, manual | doğrulandı | manual: "4. Apparent AZ & EL", "13. Target angular diameter", "20. Observer range & range-rate"; "E-long ... lat ... h (km)" | Sorgu aynı parametrelerle çalıştı |
| 34 | Çıktı başlığında "Atmos refraction: NO (AIRLESS)" | §4.3 | Horizons | doğrulandı | HZ başlığında satır aynen var | — |
| 35 | Yükseklik açısı küresel ufka göre; Horizons arazi kullanmaz | §4.3 | Horizons manual | doğrulandı | manual: "Elevation angle is with respect to plane perpendicular to local zenith direction"; HZ başlığı küre yarıçapı 1737.4 | — |
| 36 | Bir yıl, 2 sa adım = 4369 satır, tek istek | §4.3 | hesaplandı | doğrulandı | Dört HZ sorgusunun her biri tek istekte 4369 satır | yeniden sorgulandı |
| 37 | ω = 0.508°/sa; Horizons'ta medyan azimut hızı 0.5080°/sa | §4.4 | hesaplandı | doğrulandı | 360/(29.530589×24) = 0.50795°/sa; HZ 89.5°G medyanı 0.5080°/sa | yeniden hesaplandı |
| 38 | Teorik ara-değerleme hatası: normalize 0.002″ / 0.50″ / 32″; θ²/8 ile 2.0″ / 73″ / 1167″ | §4.4 | hesap | doğrulandı | Sayısal: 0.0023″, 0.498″, 31.9″; 2.0″, 73.0″, 1167″ | yeniden hesaplandı; yalnız sabit hızlı büyük-daire dönmesi için geçerli |
| 39 | Normalize edilince yörünge-dışı hata sıfırlanır, geriye O(θ³) kalır (gerçek veri için de ima ediliyor) | §4.4 | hesap | kısmen doğru | Gerçek HZ verisinde hata θ² ile büyür: Güneş 4 sa 0.88″, 6 sa 1.83″, 12 sa 7.93″ | yeniden hesaplandı. Belgenin varsayımı sabit hızlı büyük daire. Gerçekte Güneş Ay-sabit çerçevede küçük bir daire çizer (δ ≤ 1.54°). |
| 40 | Gerçek veri tablosu: Güneş 1.83/1.28″, 7.9/5.4″, 41/29″; Dünya 15.3/8.8″, 69/32″, 275/121″ | §4.4 | hesaplandı | doğrulandı | Güneş 1.83/1.28, 7.93/5.38, 41.0/29.2. Dünya 15.28/8.83, 68.7/31.8, 274.6/121.0 | yeniden hesaplandı |
| 41 | 1 sa düğüm + normalizasyon iki cisim için fazlasıyla yeterli; Güneş yarıçapı ~960″ | §4.4 | hesap | doğrulandı | HZ 30 dk serisi, 1 sa düğüm: Güneş en fazla 0.057″, Dünya en fazla 0.40″; r = 941–978″ | yeniden hesaplandı |
| 42 | Yıldız aberasyonu Güneş için ~20″ (v ≈ 30 km/s), Dünya için ~1″ | §4.5, §10.1 | hesap | doğrulandı | 29.8/c = 20.5″; 1 km/s'lik bağıl hız için ~0.7″ | yeniden hesaplandı |
| 43 | Işık zamanı: Güneş 499 s, Dünya 1.19–1.36 s | §4.5 | hesap | doğrulandı | 1 AU/c = 499.0 s; HZ mesafeleriyle 1.191–1.357 s | yeniden hesaplandı |
| 44 | 61 368 saat × 7 float32 = 1.72 MB | §4.6, §11.1 | hesap | doğrulandı | 2557 gün × 24 = 61 368; ×28 B = 1 718 304 B | yeniden hesaplandı |
| 45 | float32, 384 400 km'de ~0.03 km çözünürlük | §4.6 | hesap | doğrulandı | numpy spacing(float32(384400)) = 0.03125 km | yeniden hesaplandı |
| 46 | Eğrilik düşümü d²/2R: 29 / 719 / 2878 / 6475 m | §5.1 | hesap | doğrulandı | 29, 719, 2878, 6475 m | yeniden hesaplandı |
| 47 | 2 m direk: ufuk uzaklığı 2.64 km (Dünya'da 5.05 km), dip açısı 0.087° | §5.1 | hesaplandı | doğrulandı | 2.64 km; 5.05 km; 0.0869° | yeniden hesaplandı |
| 48 | Kutupta Güneş en fazla ~2° yükselir; 89.5°G'de −2.0° ile +2.0° arası | §5.1, Özet 4 | hesaplandı | doğrulandı | HZ 2027: −2.024° … +2.017° | yeniden hesaplandı |
| 49 | 100–150 km uzaklıkta birkaç km'lik masif hâlâ ~1° ufuk yapar | §5.1 | hesap | kısmen doğru | 1° için gereken göreli yükseklik: 100 km'de 4.6 km, 150 km'de 9.1 km | yeniden hesaplandı; 100 km için tutuyor, 150 km için tutmuyor |
| 50 | K ≈ 440 adım, site başına ~3.2×10⁵ okuma (Δ0 = 50 m, γ = 1.01, 150 km) | §5.2 | hesap | doğrulandı | Adım sayısı 442; 720 × 440 = 3.17e5 | yeniden hesaplandı; Ek A.2 kodu Δ0 = res/2 kullanıyor (20 m DEM'de K = 604) |
| 51 | Ufuk maskesi site başına ~0.03 s (numpy) | Özet 3, §5.2 | hesaplandı | doğrulanamadı | — | ekip hesabı, tekrar edilmedi |
| 52 | Sentetik test: algoritma 3.635°, beklenen 3.630°; düz yön −0.087° | §5.2, Ek A.2 | hesaplandı | doğrulanamadı | "Beklenen" değerin kontrolü: küçük açı formülüyle 3.630°, tam küresel geometriyle (tepe noktası, 2 m direk) 3.623°. Dip açısı −0.0869° | ekip hesabı (algoritma koşusu) tekrar edilmedi; "beklenen" değer yaklaşık formülden geliyor |
| 53 | Azimut adımı 0.5° ≈ Güneş çapı 0.53°; kutupta Güneş bir azimut kutusunu ~1 sa'te geçer | §5.2 | hesap | doğrulandı | Çap 0.523–0.543°; 0.5/0.508 = 0.98 sa | yeniden hesaplandı |
| 54 | 0–5 km bandında 5 m/px PGDA saha DEM'leri (Barker et al. 2021) | §5.2 | PGDA 78, Barker 2021 | doğrulandı | pgda.gsfc.nasa.gov/products/78: "The new 5 m/pix LDEMs are substantially more realistic..." | 20 m ve 240 m bantları için kaynak gösterilmemiş |
| 55 | Görünen disk oranı F(x); F(−1) = 0, F(0) = 1/2, F(1) = 1 | §5.3, Ek A.3 | türetme | doğrulandı | Daire parçası alanı arccos x − x√(1−x²); uç değerler sağlanıyor | analitik kontrol |
| 56 | Mazarico 2011 Güneş'i sonlu bir disk olarak modeller (PGDA sayfası) | §5.3 | PGDA 69 | doğrulandı | pgda.gsfc.nasa.gov/products/69: "our light source is not a point but rather a finite disc" | — |
| 57 | Gläser 2014: Connecting Ridge (Shackleton–de Gerlache); 2 m'de %92.27, 10 m'de %95.65; en uzun karanlık 3–5 gün | §5.5 | Gläser 2014 (ADS bağlantısı) | doğrulandı | elib.dlr.de/94240 özeti: "sunlight for 92.27% of the time at 2 m above ground and 95.65% of the time at 10 m ... typically only 3-5 days" | ADS açılamadı (405); aynı makalenin DLR kayıt özeti kullanıldı |
| 58 | "Gerçek sırtlarda aydınlanma oranı %92'ye çıkar"; "sırtlar %90'ın üzerinde" | Özet 4, §6.3 | Gläser 2014 | kısmen doğru | Gläser: "We identified locations receiving sunlight for 92.27% of the time at 2 m above ground" | Değer belirli noktalar ve zeminden 2 m için geçerli; özet ve §6.3 bunu bütün sırtlara genelliyor |
| 59 | Fourier K = 32 ile 65 katsayı, 11× küçültme | §5.6 | hesap | doğrulandı | 720/65 = 11.1 | yeniden hesaplandı |
| 60 | Oyun motoru gölge haritasının mesafesi birkaç km | §5.6 | yok | kaynağı yok | — | — |
| 61 | Max (1988) horizon mapping, The Visual Computer 4, 109–117 | §5.6, §13 | Max 1988 | doğrulandı | api.openalex.org (doi:10.1007/BF01905562): "Horizon mapping: shadows for bump-mapped surfaces", Vis. Comput. 4(2), 109–117 | yalnız künye ve başlık |
| 62 | PGDA 69: 240 m/px ve 60 m/px; saatlik adım; 18.6 yıl; aydınlanma ve Dünya görünürlüğü haritaları | §5.7 | PGDA 69 | doğrulandı | "averaged over hourly timesteps spanning 18.6 years"; 240 m/px ve 60 m/px ürünler, Earth visibility haritaları | 120 m/px ürün de var. Kaynaklar arasında fark: PGDA sayfası Mazarico 2011 için saatlik adım diyor, makale özeti uzun koşular için 6 sa. |
| 63 | Gläser 2014: 20 m/px DTM, 19 yıl | §5.7 | Gläser 2014 | doğrulandı | elib özeti: "20 m/pixel Digital Terrain Model"; "A 19-year study" | — |
| 64 | Mazarico 2011 LROC görüntüleriyle doğrulama yaptı | §5.7 | Mazarico 2011 | doğrulandı | NTRS özeti: "We validated our modeling with recent Lunar Reconnaissance Orbiter Wide-Angle Camera images" | — |
| 65 | SPICE GF aynı adım kuralını kullanır; `gfoclt` olay bulucusu var | §6.2, §6.4 | yok | kaynağı yok | — | NAIF GF Required Reading: "the step size must be shorter than any event of interest, and it must be shorter than any gap"; gfoclt_c mevcut |
| 66 | Kutupta Ė en fazla 0.0055°/sa (89.5°G); ekvatorda ≈ 0.51°/sa | §6.2, §10.1 | hesaplandı | doğrulandı | HZ 2 sa farkları: 89.5°G'de en fazla 0.00552°/sa, Apollo 11'de en fazla 0.510°/sa | yeniden hesaplandı |
| 67 | 2027 arazisiz tablo. 89.5°G: %52.0, %57.1, 143.8 g, %49.4, 13.9 g, %25.5. Apollo 11: %48.7, %48.9, 14.8 g, %100 (el 58°–73°), 0, %48.7 | §6.3 | hesaplandı (HZ 2 sa) | doğrulandı | HZ 2 sa: değerlerin hepsi aynı; Apollo 11'de Dünya yüksekliği 57.97–73.17° | yeniden hesaplandı. 143.8 g, disk merkezinin ufkun altında kaldığı en uzun süre; diskin hiç görünmediği en uzun süre 138.0 g |
| 68 | Kutupta Dünya ±6.8° salınır, ayın yaklaşık yarısında ufkun altında | §6.3 | hesaplandı | doğrulandı | HZ: −6.60° … +7.07° (yarı genlik 6.83°); zamanın %49.4'ünde üstte | yeniden hesaplandı |
| 69 | Lens alanı formülü; γ ≤ r⊕ − r olunca örtülme tam | §6.4 | türetme | doğrulandı | Formül yeniden hesapta kullanıldı, HZ ve SP ile aynı sonucu verdi | — |
| 70 | 20–21 Şubat 2027, Apollo 11: 22:09–00:36 UTC (2 sa 27 dk), en fazla %34.3; 2 sa'lik Horizons serisi olayı yalnız 00:00'da yakalıyor | Özet 7, §6.4 | hesaplandı (SPICE 1 dk) | doğrulandı | SP 1 dk: 22:09–00:36, en fazla 0.3430. HZ 1 dk: aynı. HZ 2 sa: yalnız 21 Şub 00:00 (%22) | yeniden hesaplandı |
| 71 | 18 Temmuz 2027: örtülme yok, en küçük ayrım 1.408° | §6.4 | hesaplandı | doğrulandı | SP 1 dk: 1.4077° (16:16 UTC), eşik 1.165° | yeniden hesaplandı |
| 72 | 17 Ağustos 2027: en küçük ayrım 1.1730°, eşik ~1.168°, olay 0.005° farkla kaçıyor | §6.4 | hesaplandı | doğrulandı | SP 1 dk: 1.1730° (07:27 UTC), eşik 1.1682° | yeniden hesaplandı |
| 73 | r_AU 2027'de 0.9807–1.0190 | §7.1 | hesaplandı | doğrulandı | HZ delta: 0.9807–1.0190 au | yeniden hesaplandı |
| 74 | Güneş akısı ±%3.4 oynar | §7.1 | hesap | yanlış | 1/0.9807² = 1.0397, 1/1.0190² = 0.9631. 1 AU'ya göre +%4.0 / −%3.7, yarı aralık ±%3.8 | yeniden hesaplandı; belge kendi r_AU aralığıyla çelişiyor |
| 75 | Sıcaklık katsayısı β: Si için −0.4…−0.5 %/K, üç eklemli GaAs için −0.2…−0.3 %/K | §7.1 | yok | kaynağı yok | — | — |
| 76 | E = 1.5°'de yatay panel 0.026, takipli dikey panel 0.9997; dikey takipli panel 38 kat fazla güç | §7.2 | hesaplandı | doğrulandı | sin 1.5° = 0.0262; cos 1.5° = 0.9997; oran 38.2 | yeniden hesaplandı |
| 77 | Batarya: 15.8 kWh (5 g karanlık) ve 46.7 kWh (14.8 g) | §7.3 | hesap | doğrulandı | 100×120/0.76 = 15.79 kWh; 100×355/0.76 = 46.71 kWh | yeniden hesaplandı |
| 78 | Günlük nüfuz derinliği ~4–10 cm (Hayne et al. 2017) | §8.1 | Hayne 2017 | kısmen doğru | arXiv:1711.00977 s.8: "varies from ~4.4 cm for large values of H, and up to ~7 cm for H = 0"; özet "~4–7 cm" | Makalede ~10 cm, Diviner'ın örneklediği üst katman için geçiyor, nüfuz derinliği için değil |
| 79 | Bizim ızgarada z_s = 2.85 cm | §8.1 | hesaplandı | doğrulandı | Ek A.4 formülü (Ks, ρs, cp(250 K) = 671.8) ile 0.0285 m | yeniden hesaplandı. Yüzey değerleri kullanıldığından Hayne aralığının altında. 0.30 m'lik model tabanı, Hayne'nin nüfuz derinliğiyle yalnız ~4–7 z_s eder. |
| 80 | Denklemler: ρ(z), Kc(ρ), K = Kc[1+χ(T/350)³], cp polinomu, üst ve alt sınır koşulu, A(θ) | §8.2 | Hayne 2017 Ek A | doğrulandı | Denklem A2–A8 ve A12 aynı biçimde | — |
| 81 | Parametreler: ρs 1100, ρd 1800, H 0.06 m (ort. 0.068), Ks 7.4e-4, Kd 3.4e-3, χ 2.7, ε 0.95, A0 0.12, a 0.06, b 0.25, c0..c4, Q 0.018 | §8.2, Ek A.4 | Hayne 2017 | doğrulandı | Tablo A1'de aynı değerler; §4.1: "The mean values are 0.068 m" | Ek A.4 kodundaki sabitler de aynı |
| 82 | Küresel ortalama termal eylemsizlik 273 K'de ~55 J m⁻² K⁻¹ s⁻½ | §8.2 | Hayne 2017 | doğrulandı | Özet: "thermal inertia of 55 ± 2 J m−2 K−1 s−1/2 at 273 K" | — |
| 83 | Izgara m = 10, n = 5; alt sınır ~10 z_s, sönüm e⁻¹⁰; toplam 15–20 katman | §8.3 | Hayne 2017 | doğrulandı | A2.2: "m = 10 and n = 5"; "typically ~10 ... exp(-10)"; "~15–20 layers" | — |
| 84 | Bizim ızgara 18 katman, Δt = 900 s | §8.3, Özet 6 | hesaplandı | doğrulandı | Ek A.4 ızgara kodu: 18 düğüm; ham Δt 1056 s, 2 alt adım, 900 s | yeniden hesaplandı (zaman döngüsü koşulmadı) |
| 85 | Açık şema; Fourier sayısı < 0.5; Δt_max ~ Δz² | §8.3 | Hayne 2017 | doğrulandı | A19–A20 | — |
| 86 | Yüzey sınırı Newton yöntemiyle, 3 noktalı gradyanla çözülür | §8.3 | Hayne 2017 | doğrulandı | A21–A29: "three-point numerical scheme" | — |
| 87 | Hayne ısınma (spin-up) için 5 yıl kullanır | §8.3 | Hayne 2017 | doğrulandı | A2.4: "~2 yr, but we conservatively require typically 5 yr" | — |
| 88 | Model sonuçları: ekvator 385.2/92.2 K; kutup senaryoları (117.1/45.4/71.5, 278.5/54.5/117.4, 274.0/47.0/103.8 K); ~3 s; ısınma 8 Ay günü ve 2 yıl | Özet 6, §8.3, §8.5 | hesaplandı | doğrulanamadı | — | ekip hesabı, tekrar edilmedi (lider talimatıyla termal koşu yapılmadı) |
| 89 | Aynı noktada 20° eğim maksimum sıcaklığı ~160 K artırır | §8.5 | hesaplandı | doğrulanamadı | Tablo farkı 278.5 − 117.1 = 161.4 K (aritmetik tutarlı) | ekip hesabı, tekrar edilmedi |
| 90 | Diviner: öğle ~390 K, şafak öncesi ~95 K | §8.5 | yok | kaynağı yok | — | Hayne 2017 Tablo A2: öğle 385 K, gece yarısı 101 K, gün doğumundan hemen önce 95 K (Keihm 1973; Vasavada 2012) |
| 91 | T_eq: Güneş tepedeyken 386 K, cos i = sin 1.5° iken 155 K | §8.5 | hesap | kısmen doğru | A = 0.12 sabit tutulursa 386.1 K ve 155.3 K. Belgenin kendi A(θ) yasasıyla 88.5° gelişte A ≈ 0.80 ve T_eq ≈ 108 K | yeniden hesaplandı |
| 92 | Jeotermal taban (Q/εσ)^¼ ≈ 24 K | §8.6 | hesap | doğrulandı | 24.0 K | yeniden hesaplandı |
| 93 | Diviner, güney kutbu PSR'lerinde ~35 K (−238 °C) ölçmüştür (Paige 2010; ikincil) | §8.6 | Paige 2010 | doğrulanamadı | PubMed 20966246 özeti: "subsurface temperatures are estimated to be 38 kelvin" (LCROSS çarpma bölgesi) | 35 K özette geçmiyor; tam metin ücretli. Hayne 2017: "< 30 K; Paige et al., 2010b". −238 °C = 35.15 K dönüşümü doğru. |
| 94 | Williams 2019: kışın <110 K yüzey alanı güneyde 2.8 kat, kuzeyde 4.3 kat artar (1 milyar yıl) | §8.6 | Williams 2019 | doğrulandı | Özet: "surfaces below 110 K capable of cold trapping water over 1 Gyr increases by factors of 2.8 and 4.3 in the winter for the south and north" | — |
| 95 | Diviner H-parametresi haritası ±70° enlem arasını kapsar | §8.6 | Hayne 2017 | doğrulandı | §3.2: "Global maps of the H-parameter ... extending from the equator to ±70°" | Hayne ~60° üstünde topografya artefaktlarına dikkat çekiyor |
| 96 | DSN istasyonları boylamda ~120° aralıklı | §9 | yok | kaynağı yok | — | — |
| 97 | Ay deklinasyonu 18.6 yılda ±18.3° ile ±28.6° arasında salınır | §9 | yok | kaynağı yok | — | HZ (Ay, yer merkezli, 2024–2035, 6 sa): aylık mutlak δ tepeleri 18.15° (Mart 2034) ile 28.73° (Mart 2025) arasında |
| 98 | 2027 mesafe aralığı serbest uzay kaybında 1.13 dB fark yaratır; gecikme 1.19–1.36 s | §9 | hesaplandı | doğrulandı | 20log10(406732/357172) = 1.129 dB; 1.191–1.357 s | yeniden hesaplandı; merkezden merkeze mesafeyle 1.124 dB |
| 99 | ġ: ekvatorda 0.51°/sa; kutupta h' = 0.05 ile ~0.03°/sa; düz ufukta ≤0.0055°/sa, hatalar ~5 kat büyür | §10.1 | hesap | doğrulandı | 0.0055 + 0.05×0.508 = 0.031°/sa; 0.031/0.0055 = 5.6 | yeniden hesaplandı; iki terimin aynı yönde toplandığı varsayılmış |
| 100 | Hata bütçesi kaymaları: aberasyon 40 s / ~11 dk; DEM 0.057° için 6.7 dk / 1.9 sa / ~10 sa; nokta kaynak 0.267° için ±31 dk / ±9 sa | §10.1, Özet 5 | hesap | doğrulandı | 40 s / 11.4 dk; 6.7 dk / 1.91 sa / 10.4 sa; 31.4 dk / 8.9 sa | yeniden hesaplandı |
| 101 | Ara-değerleme hatası (1 sa düğüm, normalize) < 0.01″ | §10.1 | hesap | kısmen doğru | HZ 30 dk serisi, 1 sa düğüm: Güneş en fazla 0.057″, Dünya en fazla 0.40″ | yeniden hesaplandı. Teori 0.002″ veriyor, gerçek veri 25–200 kat büyük. Yine de "ihmal" sonucu geçerli. |
| 102 | 100 m kayma, 2 km'deki 500 m'lik sırtın açısını 0.72° değiştirir; "hep güneşli"yi "hep gölge"ye çevirebilir | §10.2 | hesap | kısmen doğru | Küçük açı yaklaşımı 0.716°. Tam değer 0.64° (uzaklaşınca) / 0.71° (yaklaşınca). Sırtın kendisi 14.0°'lik ufuk yapar. | yeniden hesaplandı. 14°'lik bir engel kutup Güneşini (≤2°) zaten her zaman keser, bu yüzden örnek sonucu desteklemiyor. İlke yalnız 0–2° bandındaki engeller için geçerli. |
| 103 | 89.5°G'de günlük Güneş salınımı ±0.5° | §10.2 | hesap | doğrulandı | HZ: her Ay günü için trendden arındırılmış tepe-tepe değer 0.89–0.97° | yeniden hesaplandı |
| 104 | Dosya boyutları: horizon.i16 1.4 KB, thermal 17.5 KB/yıl, efemeris 1.7 MB | §11.1 | hesap | doğrulandı | 720×2 = 1440 B; 4380×4 = 17 520 B; 1.72 MB | yeniden hesaplandı |
| 105 | Künyeler: Mazarico 2011 (Icarus 211, 1066–1081), Gläser 2014 (Icarus 243, 78–90), Hayne 2017 (JGR 122, 2371–2400, arXiv:1711.00977), Williams 2019 (JGR 124, 2505–2521), Paige 2010 (Science 330, 479–482) | §13 | DOI / ADS / arXiv | doğrulandı | OpenAlex kayıtlarında cilt ve sayfalar aynı | — |
| 106 | Barker et al. (2021), PSS 203, 105119 | §13 | doi | doğrulandı | OpenAlex: Planetary and Space Science 203, 105119 | Tam başlık "...: Error estimates and their impact on illumination conditions"; çevrimiçi yayın yılı 2020 |
| 107 | Kopp & Lean (2011), GRL 38, L01706 | §13 | yok (yalnız künye) | doğrulandı | OpenAlex: Geophysical Research Letters 38(1), başlık aynı | L01706 makale numarası OpenAlex kaydında görünmüyor |
| 108 | PGDA ürün 69 / 78 / 104 adları | §13 | PGDA | doğrulandı | Sayfa başlıkları: "Lunar Polar Illumination"; "High-Resolution LOLA Topography for Lunar South Pole Sites"; "Enhanced Topography Models for Selected Lunar South Pole Regions with Shape-from-Shading" | — |

### 2.2 Sunum metni (pdf-ayda-zaman-isik-golge-isi) ve ana belgeyle tutarlılık

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt | Not |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | Bir Ay günü 29.5 gün; ekvatorda kesintisiz gece 14.8 gün | Sunum s.2 | FEZA hesabı | doğrulandı | HZ Apollo 11: Güneş merkezi en uzun 14.8 g ufuk altında | Ana belgeyle tutarlı |
| S2 | Şafaktan hemen önce −181 °C, öğlen +112 °C | Sunum s.2, s.4 | FEZA hesabı (Hayne modeli) | doğrulanamadı | 92.2 K = −180.95 °C; 385.2 K = +112.05 °C | ekip hesabı, tekrar edilmedi; ana belgeyle tutarlı |
| S3 | Diviner ölçümleriyle uyumlu (~390 K / ~95 K) | Sunum s.2 | yok | kaynağı yok | — | Hayne 2017 Tablo A2: öğle 385 K, gün doğumu öncesi 95 K |
| S4 | Kutupta Güneş en fazla ±2°; 144 gün Güneş yok | Sunum s.3 | JPL Horizons (DE441), 89.5°G | doğrulandı | HZ: −2.02°/+2.02°; disk merkezi en uzun 143.8 g ufuk altında | Ana belgeyle tutarlı |
| S5 | "144 gün: Arazi olmasaydı Güneş hiç doğmazdı" | Sunum s.3 | JPL Horizons | kısmen doğru | 143.8 g, disk merkezinin ufkun altında kaldığı süre; diskin hiç görünmediği en uzun süre 138.0 g | yeniden hesaplandı. Bu sürenin bir kısmında diskin üst kenarı ufkun üstünde. |
| S6 | Gerçek bir sırtta zamanın %92'si güneşli (Gläser 2014, Connecting Ridge, zeminden 2 m) | Sunum s.3 | Gläser 2014 | doğrulandı | elib özeti: "92.27% of the time at 2 m above ground" | Dipnotta "2 m" niteliği var |
| S7 | Ufuk maskesi 720 yön, 1.4 KB; efemeris 7 yıl saatlik 1.7 MB; site başına ~0.03 s | Sunum s.4 | FEZA hesabı | doğrulandı | 1440 B; 1.72 MB | yeniden hesaplandı. 0.03 s kısmı ekip hesabı, tekrar edilmedi (bkz. 51). |
| S8 | Kutupta dikey panel yataydan 38 kat fazla güç üretir (Güneş 1.5°) | Sunum s.5 | FEZA hesabı | doğrulandı | cos1.5°/sin1.5° = 38.2 | yeniden hesaplandı |
| S9 | "+161 °C": 20° eğimli yamaç kutupta düz zeminden bu kadar sıcak | Sunum s.5 | FEZA hesabı | kısmen doğru | 278.5 − 117.1 = 161.4 K; bu bir sıcaklık farkı | "+112 °C"nin yanında mutlak sıcaklık gibi okunuyor (+161 °C = 434 K). Model koşusu tekrar edilmedi. |
| S10 | 18 katmanlı model, saniyeler içinde | Sunum s.5 | FEZA hesabı | doğrulandı | Ek A.4 ızgarası 18 düğüm | yeniden hesaplandı (katman sayısı). Süre ekip hesabı. |
| S11 | 2 km'deki 500 m'lik sırtın açısı 0.72° değişir; kutupta Güneş "günde" yalnızca ±0.5° salınır | Sunum s.6 | FEZA araştırma notu | kısmen doğru | Küçük açı 0.716°, tam değer 0.64–0.71°. ±0.5° bir Ay günü (29.5 g) içindir; bir Dünya gününde yükseklik en fazla ~0.13° değişir (0.0055°/sa × 24). | "günde" ifadesi yanıltıcı; ayrıca No 102'deki mantık sorunu |
| S12 | 1 m yükseklik hatası (1 km'de): ekvatorda 7 dk, kutupta 2–10 sa. Nokta kaynak varsayımı: ±31 dk / ±9 sa | Sunum s.6 | FEZA notu, h' = 0.05 | doğrulandı | 6.7 dk; 1.9–10.4 sa; 31.4 dk; 8.9 sa | yeniden hesaplandı; ana belgeyle tutarlı |
| S13 | Veri JPL Horizons (DE441) | Sunum s.3 | Horizons | doğrulandı | HZ başlığı: "{source: DE441}" | — |

Sunumdaki sayıların hepsi ana belgeyle aynı. Sunuma özgü sorunlar S5, S9 ve S11'de; bunlar ifade sorunları, sayısal fark yok.

## 3. Öneriler ve tasarım kararları (belgenin önerdikleri)

**Veri modeli ve sözleşme**
- Ayrıştırma ilkesi: sahaya özgü statik tanımlayıcı (ufuk maskesi, normal, albedo, H) ile ortak efemeris ayrı tutulur. Sıcaklık geçmişe bağlı olduğu için tablodan okunmaz, hesaplanır.
- Çerçeve `MOON_ME`; zamanda UTC etiket, TDB hesap; azimut kuzeyden doğuya, kutupta grid-kuzey kuralı. Bunlar ADR ile sabitlenecek.
- Efemeris için ana yol SPICE (spiceypy, 5 kernel), doğrulama yolu Horizons.
- Efemeris tablosu:
  - Kapsam: 2026–2032, saatlik.
  - Alanlar: `sun_u` (3), `sun_dist`, `earth_r` (3); float32, LT+S.
  - Biçim: JSON manifest + ikili dosya.
  - İstemci tarafı: ara-değerleme, normalizasyon, saha vektörünün çıkarılması ve ENU dönüşümü.

**Ufuk ve aydınlanma**
- Ufuk maskesi: 720 azimut (0.5°), int16 0.01° birim, varsayılan 2 m direk, D_max 150–200 km.
- DEM: çok çözünürlüklü (5 / 20 / 240 m/px), uzak bölge için maks-filtre piramidi, geometrik ışın adımı (γ = 1.01).
- Güneş ve Dünya sonlu disk olarak modellenir; eğimli ufukta 16–32 şeritlik integral.
- DTE koşulu: Ay tarafında ε_min 0–5°, Dünya tarafında DSN istasyonunda Ay yüksekliği ≥10°.

**Olaylar ve metrikler**
- Olay hesabı: kaba tarama, Brent ile ~1 s'ye inceltme, sıyırma (grazing) için altın-oran araması. Tutulmalar için `gfoclt` ya da ince arama.
- Pencere cebri: W ∩ W⊕ ∩ W_T. Metrikler: aydınlanma oranı, en uzun gece, gün batımına kalan süre, ortak pencere.

**Güç ve termal**
- Güç: P(t) formülü, dikey veya takipli panel, SOC adımı, gece için batarya boyutlandırması (örnekler 100 W yük ile).
- Termal: Hayne 2017 1-B modeli Web Worker'da ya da sunucuda koşar. Kutupta ek olarak arazi kaynaklı ısıtma, mevsimsellik ve sabit H = 0.06 m gerekir.

**Bölge haritaları ve uygulama**
- Bölge haritaları: çevrimdışı özet rasterler (COG). Animasyon için GPU ufuk haritalama. Yakın alan görseli için oyun motoru gölgesi, saha cevabı için ufuk maskesi. Ufuk maskesi Fourier ile sıkıştırılabilir (K = 32).
- Dosya düzeni: `data/ephem/`, `data/sites/<id>/{horizon.i16, meta.json, events_*.json, thermal_*.f32}`, `data/regions/<region>/illum_pct.tif`.
- Uygulama sırası 1–7; kritik yol efemeris → ufuk maskesi → olay bulucu. Termal ve bölge haritaları MVP'yi bloke etmez.

## 4. Belge içi çelişkiler ve eskimiş bilgiler

1. **±1.13 dB:** §1 tablosu "Link bütçesi (±1.13 dB)" diyor, §9 ise "1.13 dB fark". 1.13 dB toplam aralıktır; ± ile yazılırsa ±0.56 dB olmalı.
2. **d⊕ etiketi:** §0'da d⊕ "Ay–Dünya merkez uzaklığı" diye etiketlenmiş. Oysa 357 172–406 732 km, 89.5°G sahasından ölçülen topo-merkezli uzaklık. Ay merkezinden Dünya merkezine 2027 aralığı 357 278–406 611 km (HZ). Gecikme ve dB sonuçları pratikte değişmiyor.
3. **Akı oynaması:** §7.1'deki "akı ±%3.4", aynı paragraftaki r_AU aralığıyla (0.9807–1.0190) çelişiyor. Bu aralık +%4.0 / −%3.7 verir.
4. **Albedo:** §8.5'teki T_eq = 155 K sabit A = 0.12 ile hesaplanmış. Belgenin §8.2'de verdiği A(θ) yasası 88.5° gelişte A ≈ 0.80 verir, bu da T_eq ≈ 108 K demek. Belge bu formülün kutup farkını "açıkladığını" söylüyor, ama kendi albedo modeliyle tutarsız.
5. **Nüfuz derinliği:** §8.1, Hayne için "~4–10 cm" diyor; makale ~4.4–7 cm diyor. Belgenin kendi ızgarası 2.85 cm (yüzey Ks ve ρs ile). Bu yüzden 0.30 m'lik model tabanı Hayne'nin nüfuz derinliğiyle ~4–7 z_s eder, belgenin hedeflediği 10 z_s değil.
6. **Ara-değerleme hatası:** §4.4 "normalize edilince yörünge-dışı hata sıfırlanır, O(θ³) kalır" diyor. Ama belgenin kendi gerçek veri tablosu θ² ile ölçekleniyor (6→12→24 sa: ×4.3, ×5.2). §10.1'deki "<0.01″" değeri ölçülen 0.057″ (Güneş) ve 0.40″ (Dünya) ile uyuşmuyor. Sonuç (ihmal edilebilir) değişmiyor.
7. **Adım boyu:** §5.2 metni Δ0 = 50 m (K ≈ 440) diyor; Ek A.2 kodu ise ilk adım ve en küçük adım olarak res/2 kullanıyor (20 m DEM için K ≈ 604, 5 m DEM için ≈ 743).
8. **"Güneş-yok" sütunu:** §6.3'te "En uzun Güneş-yok 143.8 gün" yazıyor; bu, disk merkezinin ufkun altında kaldığı süre. Diskin hiçbir parçasının görünmediği en uzun süre 138.0 gün. Sunum aynı değeri "Güneş hiç doğmazdı" diye sunuyor.
9. **%92 genellemesi:** Özet 4 ("gerçek sırtlarda %92") ve §6.3 ("sırtlar %90'ın üzerinde"), Gläser'in tek bir sahadaki, zeminden 2 m yükseklikteki belirli noktalar için verdiği değeri genelliyor. §5.5 doğru nitelikle veriyor.
10. **0.72° örneği:** §10.2'deki örnekte engel olan 500 m'lik sırt 2 km'den 14° ufuk yapar. Kutup Güneşi 2°'yi geçmediğinden bu yön her durumda gölgededir; 0.72°'lik değişim "hep güneşli → hep gölge" geçişini göstermez. Aynı örnek sunumun "Neden önemli" sayfasında kullanılıyor.
11. **Sentetik test:** §5.2'deki "beklenen 3.630°" küçük açı formülünden geliyor. Tam küresel geometri 3.623° verir. Algoritma ile beklenen arasındaki gerçek fark 0.005° değil, ~0.012° olabilir; bu, tepe şekline bağlı ve tekrar edilmedi.
12. **Sunum ifadeleri:** "+161 °C" bir sıcaklık farkı, mutlak değer gibi okunuyor. "Kutupta Güneş günde ±0.5° salınır" ifadesindeki "gün" Ay günü; bir Dünya gününde değişim ~0.13°.
13. **Eskimiş not:** §13'teki "Gläser ve Williams sayıları yayın özetlerinden ve ikincil kaynaklardan alındı" notu artık güncellenebilir. Her iki sayı seti makale özetlerinden doğrulandı (elib.dlr.de, OpenAlex). Paige (35 K) için not hâlâ geçerli.
14. **NAIF kaynak notu (belgenin hatası değil):** moon_pa_de440_200625.cmt hâlâ eski `moon_de440_200625.tf` dosyasının yüklenmesini söylüyor. 250416.tf başlığı ise önceki sürümü `moon_pa_de440_220930.tf` diye anıyor; a_old_versions'taki gerçek ad `moon_de440_220930.tf`. Belge güncel ve doğru adları kullanıyor.
15. **Eksik ama yanlış değil:** PGDA 69'da 120 m/px ürünler de var; belge yalnız 240 ve 60 m/px'i anıyor.

## 5. Etiket sayıları

Ana tablo (108 satır) ile sunum tablosu (13 satır) birlikte, 121 iddia. Sayım, yazılı tablodan grep ile yapıldı.

| Etiket | Ana belge | Sunum | Toplam |
| --- | --- | --- | --- |
| doğrulandı | 78 | 8 | 86 |
| kısmen doğru | 9 | 3 | 12 |
| yanlış | 1 | 0 | 1 |
| kaynağı yok | 15 | 1 | 16 |
| doğrulanamadı | 5 | 1 | 6 |

## 6. Açılamayan kaynaklar

| Adres | Hata | Yapılan |
| --- | --- | --- |
| https://ui.adsabs.harvard.edu/abs/2014Icar..243...78G/abstract (Gläser 2014, belgenin verdiği bağlantı) | HTTP 405, AWS WAF CAPTCHA | Aynı makalenin özeti elib.dlr.de/94240 kaydından okundu (HTTP 200) |
| https://ntrs.nasa.gov/api/citations/20120010094/downloads/20120010094.pdf (Mazarico 2011 tam metin) | HTTP 404 | NTRS metadata API'sindeki özet kullanıldı (https://ntrs.nasa.gov/api/citations/20120010094) |
| Semantic Scholar API: Gläser 2014, Paige 2010, Mazarico 2011 | Özet alanı yayıncı tarafından gizlenmiş ("elided by the publisher") | Gläser için DLR elib, Paige için PubMed (PMID 20966246), Mazarico için NTRS |
| Paige et al. 2010 tam metni (doi:10.1126/science.1187726) | Ücretli; denenmedi | Yalnız PubMed özeti; 35 K iddiası doğrulanamadı |
| https://ssd.jpl.nasa.gov/api/horizons.api (paralel ilk deneme) | HTTP 503 (bir sorguda, geçici) | İkinci denemede açıldı; bütün Horizons sorguları tamamlandı |
