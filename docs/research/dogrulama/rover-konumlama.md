# Doğrulama: Rover konumlama

Bu dosya [ANALIZ-OZETI.md](../ANALIZ-OZETI.md) belgesinin ekidir. Araştırma notundaki her kontrol edilebilir iddia, notun gösterdiği kaynak açılarak karşılaştırıldı.

- **Doğrulama tarihi:** 14 Kasım 2026
- **İncelenen dosyalar:** [README.md](../rover-localization/README.md), [rover-konumlama-arastirmasi.pdf](../rover-localization/rover-konumlama-arastirmasi.pdf)
- **Not:** Kanıt sütunundaki alıntılar kaynaktaki haliyle bırakıldı. Sayılar ve birimler kaynakla aynı yazıldı.

| Etiket | Adet |
|---|---:|
| doğrulandı | 45 |
| kısmen doğru | 12 |
| yanlış | 1 |
| kaynağı yok | 19 |
| doğrulanamadı | 6 |
| **Toplam** | **83** |

Dosyalar: `docs/research/rover-localization/README.md` (R) ve `rover-konumlama-arastirmasi.pdf` metni (P, `docs/research/rover-localization/rover-konumlama-arastirmasi.pdf`). Doğrulama tarihi 2026-11-14.

Kısaltmalar (hepsi bu oturumda açıldı):
- ICRA = Censible makalesi, https://www-robotics.jpl.nasa.gov/media/documents/2024_Global_Localization_ICRA.pdf
- JPLN = JPL haberi, https://www.jpl.nasa.gov/news/nasas-perseverance-now-autonomously-pinpoints-its-location-on-mars/ (ilk istek 403, ikinci istek farklı User-Agent ile 200)
- SPC = Space.com yazısı (200, yayın tarihi 2026-02-22)
- MEM = JPL 2026 bellek çözümü makalesi (2026_Global_Localization_Memory_Workaround_IEEE_Aero__final.pdf)
- POS = JPL yıldız izleyici posteri R24220p.pdf
- SRV = McKee, AAS 25-173 yüzey navigasyon taraması (ntrs 20250000720)
- VIP = VIPER LSIC 2024 sunumu (ntrs 20240013903)
- ORB = Orbital Focus Luna 17; NSS = NSSDC Apollo LRV; NAT = Nature 498284a (yalnızca önizleme, ücretli)

## 1. Belge özeti

- Belge, Ay rover'ı için konumlamayı iki katmanda ele alıyor: sürekli ama hata biriktiren göreli konum (tekerlek, IMU, görsel odometri) ve aralıklı ama hatayı sıfırlayan mutlak düzeltme (Güneş/yıldız, ufuk ve zemin eşleştirme, Dünya'dan takip). İkisi EKF ya da faktör grafiğinde birleşiyor.
- Yöntemleri tek tek anlatıyor: ufuk/Güneş açısı, yıldız izleyici (sekstant mantığı), tekerlek odometrisi, Dünya'dan menzil/Doppler/VLBI, Lunokhod 9. tekerlek ve Apollo LRV, kayma tahmini.
- NASA görevlerinde konumlamanın evrimini Apollo LRV'den Perseverance'ın Mars Global Localization (MGL) yeteneğine kadar tablolaştırıyor.
- Merkezde Censible algoritması var (Perseverance, Şubat 2026): ortoprojeksiyon, değiştirilmiş census dönüşümü, 264 panoramada 0,36 m ortalama hata.
- Projeye öneri: Censible'ı Ay'ın güney kutbuna uyarlamak; en büyük katkı olarak LOLA DEM + SPICE ile "beklenen gölge haritası" üretip eşleştirmeyi ona karşı yapmak; ufukla kaba, census ile ince konum, yıldız izleyiciyle bağımsız kontrol.
- Sentetik hackathon demosu öneriyor (LOLA DEM'den iki farklı Güneş açısıyla harita, ±30 m kaydırılmış başlangıç, census + yükseklik SSD, EKF).
- P, R'nin sayfa düzenli halidir; sayılar aynı, yalnızca birkaç cümle farkı var (Bölüm 4).

## 2. İddia tablosu

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt | Not |
|---|---|---|---|---|---|---|
| 1 | JPL LunarNav projesi ufuk/siluet eşleştirmeyi LOLA DEM ile yapıyor | R:35, R:65 | Doğrudan kaynak yok (13. bölümde SRV listeli) | yanlış | SRV Tablo 1: "Surface Crater Nav (e.g., LunarNav)"; ref [77] "LunarNav: Crater-based Localization for Long-range Autonomous Lunar Rover Navigation" | LunarNav krater tabanlı. Ufuk eşleştirme SRV'de ayrı bir yöntem (JSC/GSFC araştırması, "no space flight heritage"). P'nin kendi tablosu da "JPL araştırmaları (krater tabanlı Ay konumlama)" diyor: belge içi çelişki |
| 2 | Ufuk eşleştirme doğruluğu tipik ~100 m, en iyi ~10 m | R:37, R:65, R:246 | ICRA | doğrulandı | ICRA II: "Accuracy is typically on the order of 100m, at best 10m" | Bu sayı ICRA'nın Mars ufuk literatürü özeti; Ay için değil |
| 3 | Güneş açısı değişimi ≈ 360°/29,5 gün ≈ 0,5°/saat | R:39 | FEZA hesabı | doğrulandı | Yeniden hesaplandı: 360/29,53/24 = 0,508°/saat | Ekip hesabı |
| 4 | Ay ekvatorunda 0,5° ≈ 15 km | R:39 | FEZA hesabı | doğrulandı | Yeniden hesaplandı: 0,5° × π/180 × 1737,4 km = 15,16 km | |
| 5 | 1 yay saniyesi eğim hatası ≈ 8 m | R:44, R:108 | FEZA hesabı | doğrulandı | Yeniden hesaplandı: 1737,4 km × 4,848e-6 = 8,42 m. POS: "1 to 1.2 arcseconds ... (8 to 10 meters)" | 8,4 m için "≈ 8 m" kabul edilebilir |
| 6 | Doğruluğu sınırlayan şey eğim ölçerdir | R:44, R:101 | Sigel ve Wettergreen 2007 (açılamadı) | kısmen doğru | POS: "the position estimate accuracy is likely limited by the accuracy of the gravity map"; yerçekimi yönü ofseti yok sayılırsa "5000 meter errors". SRV: "One of the limiting factors would be the understanding the Moon's gravitational field" | Aynı belgenin gösterdiği JPL posteri sınırlayıcı etkeni yerçekimi haritası olarak veriyor; R:109 anomaliyi ayrıca anıyor ama R:44 ve R:111 sınırı eğim ölçere bağlıyor |
| 7 | Yıldız izleyici gündüz çalışır, baffle gerekir | R:45 | Gösterilmedi (Avrupa Seyrüsefer bildirisi dolaylı) | kaynağı yok | VIP yalnızca "short rigid baffle" ve "No views of the sun in Lunar polar PSRs" der | Bağımsız açık kaynak bulunmadı |
| 8 | Yokuşta kayma %10-20'yi rahatça geçer | R:49 | Yok | kaynağı yok | Hiçbir açılan kaynakta sayı yok | |
| 9 | VO hatası gidilen yolun ~%1-2'si | R:59, R:133 | Yok | kaynağı yok | SRV'de yalnızca LRV için "±2%" toplam mesafe gereksinimi var (VO için değil) | Belge iki kez tekrar ediyor |
| 10 | VO kullanıcıları: Spirit/Opportunity, Curiosity, Perseverance | R:59 | SRV (genel) | doğrulandı | SRV: "visual odometry ... became standard practice on future Mars rovers" | |
| 11 | VO kullanıcıları: Yutu | R:59 | Yok | kaynağı yok | SRV'deki Yutu-2 referansı yalnızca topografik haritalama | |
| 12 | IMU: rover dururken jiroskop sapması sıfırlanır | R:60 | Yok | kaynağı yok | Açılan kaynaklarda yok | |
| 13 | Güneş sensörü/kamerayla Güneş: Mars rover'ları ve Apollo LRV (yön) | R:62 | SRV | doğrulandı | SRV: "Mars rovers take NavCam images of the Sun ... Apollo LRV used a sundial device" | |
| 14 | Yıldız izleyici + eğim ölçer: VIPER (yön), CMU ve JPL çalışmaları | R:63 | POS, VIP | doğrulandı | VIP: "First use of a star tracker on a planetary rover"; POS: yıldız izleyici + inklinometre ile konum | CMU/Sigel kısmı ayrı (No 25) |
| 15 | MGL zemini yörünge haritasıyla eşleştirir, Perseverance 2026, metre altı | R:64 | JPLN | doğrulandı | JPLN: "pinpoint the rover's location within some 10 inches (25 centimeters)... Feb. 2, then again Feb. 16" | |
| 16 | Krater/kaya işaretleri: JPL araştırmaları | R:66 | SRV | doğrulandı | SRV: LunarNav, ShadowNav (JPL) krater tabanlı; ICRA ref [9] "Lunar rover localization using craters as landmarks" | |
| 17 | Dünya'dan takip: Chang'e (VLBI) | R:67, R:81 | Yok | kaynağı yok | Açılan kaynaklarda Chang'e VLBI yok | Belge "Yutu'da kullanıldığı doğrulanmadı" diyor, dürüst |
| 18 | Lunokhod'da lazer yansıtıcı var, Ay-Dünya mesafesi için | R:67, R:82 | ORB | kısmen doğru | ORB: "French-built laser reflector ... measure the distance between the Earth and Moon to an accuracy of twenty to thirty centimetres" | "Gerçek zamanlı sürüş için değil" kaynakta yok |
| 19 | NASA LunaNet/LCRNS Ay seyrüsefer ağı | R:68 | SRV | doğrulandı | SRV özeti: "LunaNet, LCRNS, pre-deployed moon beacons" yüzey navigasyonu varlıkları | SRV bunları "olası varlık" olarak anıyor |
| 20 | ESA Moonlight | R:68 | Yok | kaynağı yok | Açılan kaynaklarda yok | |
| 21 | LuGRE 2025'te Ay'da GPS sinyali aldı | R:68 | Yok | kaynağı yok | Açılan kaynaklarda yok | |
| 22 | Menzil: gidiş-dönüş süresi × c / 2; tek ölçüm küresel kabuk | R:79 | Yok | kaynağı yok | Temel fizik, aritmetik doğru | |
| 23 | Dünya'dan takip doğruluğu onlarca-yüzlerce metre | R:84 | Yok | kaynağı yok | SRV: Apollo LRV VLBI ile sonradan "within 25 meters" konum bulundu | Alt sınırı destekler; belge bu örneği anmıyor, eklenebilir |
| 24 | Dünya görünür olmalı, uzak yüzde çalışmaz | R:84 | Yok | kaynağı yok | Mantıksal sonuç; SRV VIPER için "radio shadows" anıyor | |
| 25 | Sigel ve Wettergreen (CMU 2007): geniş açılı yıldız izleyici + hassas eğim ölçer tasarımı | R:101, R:358 | academia.edu | doğrulanamadı | HTTP 403 (iki deneme) | Başka açık kopya bulunmadı |
| 26 | JPL küresel konumlama cihazı 2024: eğim ölçer, yıldız izleyiciler, dönen platform, eğim hizalama; hedef ~10 m | R:102 | POS | doğrulandı | POS: "inclinometer, star trackers, a rotating platform, and a tip-tilt mechanism"; "determine Lunar rover location to 10 meters" | Hedef, ölçülmüş sonuç değil: breadboard otopark testi "about 0.15 degree accuracy" (Ay'da 0,15° ≈ 4,5 km, yeniden hesaplandı) |
| 27 | VIPER: ilk yıldız izleyici (Rocket Lab); kutupta yön için yıldız; amaç yön | R:103 | VIP | doğrulandı | VIP: "First use of a star tracker on a planetary rover"; "Rocket Lab (formerly Sinclair) ST-16RT2"; "No views of the sun in Lunar polar PSRs"; "absolute orientation" | R:255 "VIPER zaten taşıyordu": uçuş durumu bu kaynaklarla doğrulanmadı |
| 28 | Avrupa Seyrüsefer Konferansı 2025: gök seyrüseferi, ~100 m hedefi | R:104, R:361 | sciforum.net/paper/24132 | doğrulanamadı | HTTP 403 (iki deneme). mdpi.com/2673-4591/126/1/53 da 403 | Arama özeti kaynak sayılmadı |
| 29 | Yıldız izleyici sonucu "birkaç on metre", ~10-100 m | R:108, R:111, R:269 | Yok (POS, SRV genel) | kısmen doğru | POS: "close to 10 to 20 meter accuracy" yalnızca iyi yerçekimi haritası varsa. SRV: SPS donanım denemesi ±421 m, Ay için ölçeklenmiş ±125 m | "10-100 m" iyimser; SRV'nin Ay tahmini 125 m |
| 30 | Yerel yerçekimi anomalileri dikeyi saptırır | R:109 | Yok | doğrulandı | POS: "Ignoring the gravity direction offset can lead to 5000 meter errors"; SRV: "'lumpiness' of the Moon's gravitational field" | |
| 31 | Sürüş titreşimi eğim ölçümünü bozar, dur-ölç-devam | R:110 | Yok | kaynağı yok | Tasarım gerekçesi | |
| 32 | Apollo LRV (1971-72): jiroskop + tekerlek sayaçları; Güneş gölgesi aletiyle yön; konum ana araca göre | R:119, R:147-152 | NSS, SRV | doğrulandı | NSS: "directional gyro and odometer ... direction and distance back to the LM ... Sun-shadow device ... Sun moved very slowly". SRV: "bearing and range to the LM" | Yıllar NSS'de açık yazmıyor (Apollo 15/16/17 geçiyor) |
| 33 | LRV Güneş gölgesi: araç Güneş'e sırtı dönük park, iğne gölgesi skalada okunur | R:152 | NSS | kısmen doğru | NSS: manuel yön, Güneş yavaş hareket eder. SRV: gölge açısı okunur, başlık yerde hesaplanıp ekibe iletilir | "Sırtı dönük park" ayrıntısı bulunamadı; yer hesabı belgede yok |
| 34 | LRV tekerlek seçim kuralı "üçüncü en hızlı" | R:153 | LRV El Kitabı (404) | kısmen doğru | SRV: "required a concurrent signal from three of its four encoders before it registered one revolution" | Belge zaten "doğrulanmadı" diyor. Üç-dörtten koşulu fiilen üçüncü en hızlı tekerleğin sayımını belirler; kaynakta "en hızlı/en yavaş" gerekçesi yok. El Kitabı açılamadı |
| 35 | Spirit/Opportunity: tekerlek+IMU, VO yalnızca gerektiğinde (işlemci yavaş), Güneş ile yön, elle yörünge düzeltme | R:120 | Yok (SRV genel) | kısmen doğru | SRV: VO "computationally expensive ... originally planned to be used only when absolutely necessary"; NavCam Güneş görüntüsü; operatörler panoramadan pozu bulur | "İşlemci yavaş" SRV'de yok. P: "yalnızca kayma riski yüksek yerlerde" |
| 36 | Curiosity: VO daha sık; HiRISE ile elle hizalama | R:121 | Yok | kısmen doğru | SRV: "Visual odometry was considered to be a main feature"; panoramalar "with the assistance of human operators" | "HiRISE" adı Curiosity için kaynaklarda geçmiyor |
| 37 | Perseverance (2021): ayrı görüntü işlemcisi, sürekli VO, rekor 699,9 m insansız, Güneş ile yön | R:122 | ICRA | doğrulandı | ICRA I: "greatest distance ... without human review is 699.9m over three days"; "sun finding activity"; SRV: FPGA | |
| 38 | MGL (Şubat 2026): araçta, ~2 dk, ~25 cm | R:123 | JPLN | doğrulandı | JPLN: "takes about two minutes ... within some 10 inches (25 centimeters)" | |
| 39 | Sol 385 dar koridor; belirsizlik engel haritasını şişirir | R:129 | ICRA | doğrulandı | ICRA Fig. 1: "On Sol 385 ... narrow corridor ... early termination of the drive" | |
| 40 | Uzun sürüşte konum 35 m'ye kadar sapabilir (JPL) | R:133 | JPLN | doğrulandı | JPLN: "off by more than 100 feet (up to 35 meters)" | |
| 41 | Elle düzeltme "günlerce" sürebilir | P Bölüm 5 (R'de yok) | Yok | kısmen doğru | JPLN: "That process can take a day or more" | Yalnızca P'de; "günlerce" abartılı |
| 42 | Lunokhod 9. tekerlek: motorsuz, arkada römork gibi, odometre | R:141-143 | ORB | kısmen doğru | ORB: "ninth wheel, attached to the rear ... a simple distance measuring device, an odometer"; "eight ... wheels each had its own electric motor" | Motorsuz oluş dolaylı; "sürtünmeyle döner" açıklaması ve kayma mantığı kaynaksız |
| 43 | Kayma ≈ 1 − (ölçüm tekerleği yolu / tahrik tekerleği yolu) | R:144 | FEZA | kaynağı yok | Tanım, ekip formülü | Tekrar edilecek hesap değil |
| 44 | LRO ile haritalamada Lunokhod 2 için ~42 km (eski ~37 km) | R:145 | NAT | doğrulanamadı | NAT önizleme paywall'lu; yalnızca "Revised data show ... outdistanced NASA's Opportunity" ve LRO NAC düzeltme notu görünüyor | Bağımsız açık sayfalar aynı sayıyı veriyor: planetary.org/articles/06211627-opportunity-lunokhod-record ("about 42 kilometers in the case of Lunokhod 2"; "Lunokhod 2's distance record is 37 kilometers"), nbcnews.com (37 km, 42 km). Etiket gösterilen kaynağa bağlı kaldı |
| 45 | Lunokhod 1 mesafesi fazla, Lunokhod 2'ninki eksik hesaplanmış | R:145 | NAT | doğrulanamadı | NAT, planetary.org ve NBC sayfalarında Lunokhod 1 düzeltmesi yok. ORB yalnızca eski değer: 10 540 m | "Lunokhod 1 fazla" hiçbir açılan kaynakta yok |
| 46 | LRV: dört tekerlek sayacı, sinyal işlemci, panelde ana araca yön/uzaklık | R:149-151 | NSS | doğrulandı | NSS: "computer which would keep track of the overall direction and distance back to the LM"; SRV: "Each of the four rover wheels had an odometer" | |
| 47 | Kayma oranı s = 1 − gerçek/beklenen; Mars'ta eşik %40-60 | R:173 | Yok | kaynağı yok | | Formül tanım; eşik sayısı kaynaksız |
| 48 | JPL kaymayı Mars'ta öğrenilmiş modellerle denedi (eğim, akım, arazi) | R:179 | Yok | kaynağı yok | SRV yalnızca "an accurate model ... allows for wheel slip prediction" der | |
| 49 | Censible: JPL, Nash, Verma ve ark., ICRA 2024 | R:194, R:352 | ICRA | kısmen doğru | Yazar listesi ve başlık eşleşiyor. PDF metninde konferans adı/yılı yok; alt bilgi "© 2023" | Dosya adında "2024_..._ICRA" var. Sayılar ve yöntem makaleyle uyumlu |
| 50 | Perseverance'ta Şubat 2026'dan beri kullanılıyor; 2 ve 16 Şubat 2026 | R:194, R:227 | JPLN, SPC | doğrulandı | JPLN: "first used successfully in regular mission operations on Feb. 2, then again Feb. 16". MEM: "sol 1762 (2 February 2026) ... sol 1775 (16 February 2026)" | |
| 51 | Mutlak yön sabitlenince arama x-y kaymasına iner | R:198 | ICRA | doğrulandı | ICRA: "simplified to a search over 2D translation" | |
| 52 | Genellikle 5 stereo çift, kırmızı kanal (HiRISE kırmızı/NIR) | R:199 | ICRA | doğrulandı | ICRA: "typically five stereo pairs"; "monochrome red channel ... red/near-infrared channel HiRISE" | |
| 53 | Işık düzeltmesi birkaç katsayılı polinomla, az veri uplink | R:200 | ICRA | doğrulandı | ICRA: "deformable radial polynomial", "third-degree", "minimize uplink data volume" | |
| 54 | SGM stereo + tutarlılık/benzersizlik/leke filtreleri | R:201 | ICRA | doğrulandı | ICRA: "semi-global matching ... consistency check, a uniqueness ratio check, and a speckle post-filter" | |
| 55 | Ortoprojeksiyon: 3-40 m, 25 cm | R:202 | ICRA | doğrulandı | ICRA: "between 3 and 40 meters ... 25cm resolution pixel grid" | |
| 56 | Arama penceresi ±30 m = 240×240 piksel | R:203 | ICRA | doğrulandı | ICRA: "A typical 30m search range results in a 240x240 pixel search region" | Yeniden hesaplandı: 60 m / 0,25 m = 240 |
| 57 | Census: 8 komşu, bit; eksik veri cezalandırılmaz | R:205-207 | ICRA | doğrulandı | ICRA: "8 comparisons"; "modified Hamming distance which does not penalize missing data" | Makalede üç kategori var (büyük/değil/veri yok); "tek bit" basitleştirme |
| 58 | Skor = census Hamming + α × yükseklik SSD; en düşük kayma seçilir | R:208 | ICRA | doğrulandı | ICRA denk. (10)-(11): "greater weight placed on the census scores" | Belge ağırlığın census lehine olduğunu belirtmiyor |
| 59 | Piksel altı: 3×3'e parabol yüzeyi; sivrilik güven ölçüsü | R:209 | ICRA | doğrulandı | ICRA: "2D quadratic surface ... 3x3 pixel neighborhood"; "minimum principal curvature ... confidence" | |
| 60 | Doğu-batı ölçek hatası ~1 m / 500 m | R:210 | ICRA | doğrulandı | ICRA: "this could amount to a 1m discrepancy between map and rover every 500m" | |
| 61 | Hesap birkaç kez çalıştırılır, ana bilgisayar sonuçları karşılaştırır | R:210 | ICRA (gösterilen) | doğrulandı | ICRA'da yok; JPLN: "runs on the HBS multiple times before one of the rover's main computers checks to ensure the results match" | Gerçek kaynak ICRA değil JPLN |
| 62 | 264 gerçek panorama, 2,5 yıl, Jezero | R:216 | ICRA | doğrulandı | ICRA IV-A: "264 in total ... past 2.5 years" | |
| 63 | Ort. hata 0,36 m, en kötü 1,07 m, >5 m hata 0/264 | R:220-222 | ICRA | doğrulandı | ICRA: "0.36m accuracy across 264 panoramas ... maximum error of 1.07m" | |
| 64 | 5 çift 81 s, bellek <1 GB, Snapdragon 801, helikopter baz istasyonu | R:223-225 | ICRA | doğrulandı | ICRA Tablo IV: "5 pairs, 81s, <1GB"; "Snapdragon 801"; JPLN: Helicopter Base Station | |
| 65 | Mars'a 744 KB program + 250 KB harita (200×200 m) | R:226 | ICRA | doğrulandı | ICRA: "binary was 744KB, with a small 250KB ... 200m x 200m area" | Sol 914 gölge modu ikilisi; Şubat 2026 sürümü farklı olabilir |
| 66 | Benzerlik ölçüleri: NCC 24,97 m/225; MI 24,33 m/216; census 0,36/0; census'suz 14,17/185 | R:229-234 | ICRA | doğrulandı | ICRA Tablo I ve II birebir | |
| 67 | Görüntü çözünürlüğü 320×240'a kadar aynı sonuç | R:240 | ICRA | doğrulandı | ICRA Tablo III: 320x240: 0,35 m, 0/264 | 80x60'ta 46/264 hata |
| 68 | 1 m'lik haritada ort. hata 0,71 m | R:241, R:264 | ICRA | doğrulandı | ICRA Tablo III: "100cm 0.71m 1.72m 0/264" | "Ay'da metre düzeyi mümkün" çıkarım (Bölüm 3) |
| 69 | 1 çiftle 264'te 6 hatalı; 10 m menzilde 3 hatalı | R:242-243 | ICRA | doğrulandı | ICRA Tablo III: "1 pair max ... 6/264"; "10m ... 3/264" | |
| 70 | Arama yarıçapı 100 m'ye kadar sağlam | R:244 | ICRA | doğrulandı | ICRA Tablo III: 100 m 0/264; 150 m 1/264 | PDF çıkarımında tablo etiketleri kaymış, değerler tutarlı |
| 71 | JPL sıradaki hedefin Ay olduğunu, Endurance'ı belirtiyor | R:257 | ICRA, JPLN | doğrulandı | ICRA: "Lunar rover missions like Endurance aim to traverse many kilometers across the Moon's south pole"; JPLN: "turned their sights to the Moon" | |
| 72 | Telefon sınıfı işlemci yetiyor | R:256 | JPLN | doğrulandı | JPLN: "processor that powered many consumer smartphones in the mid-2010s" | 81 s çalışma süresiyle |
| 73 | Ay'da stereo kamera, LRO NAC ve LOLA DEM mevcut | R:254 | Yok | kaynağı yok | | |
| 74 | Güney kutbunda Güneş birkaç derece yüksekte, gölgeler uzun ve hızlı | R:263 | Yok | kısmen doğru | SRV: "the Sun and the Earth will be along the horizon ... shadows will move at speeds of up to 1cm/s" | "Birkaç derece" sayısı kaynaksız |
| 75 | LRO NAC HiRISE'dan kaba; kutup DEM'leri metre düzeyinde | R:264 | Yok (belge "doğrulanmalı" diyor) | kaynağı yok | | Belge kendisi işaretlemiş |
| 76 | ShadowCam (KPLO) PSR'leri görüntüler | R:265 | Yok | kaynağı yok | | |
| 77 | SGM dokusuz zemine/karşıt aydınlatmaya dayanıklı | R:266 | ICRA | doğrulandı | ICRA: "SGM is particularly helpful in scenes with low texture ... opposition effect (also known as shadow hiding)" | "Panorama farklı yönlerden çekildiği için hepsi etkilenmez" belge görüşü |
| 78 | Census parlaklık farklarına dayanıklı; rover lambası | R:267 | ICRA | kısmen doğru | ICRA: "invariant to monotonic variations in intensity ... lens flare" | Rover lambası senaryosu denenmemiş, çıkarım |
| 79 | SpiceyPy, rasterio, NumPy ile birkaç yüz satır | R:340-341 | Yok | kaynağı yok | | Ekip tahmini/kararı niteliğinde |
| 80 | IEEE Aero 2024 Global Localization makalesi (belge "okunamadı" diyor) | R:355 | robotics.jpl.nasa.gov/.../2024_Global_Localization_IEEE_Aero.pdf | doğrulanamadı | Dosya indirildi (200, 20 MB) ama hiçbir iddia ona dayanmıyor, incelenmedi | Bu belgedeki sayılar için kaynak değil |
| 81 | JPL 2026 bellek çözümü makalesi var | R:356 | MEM | doğrulandı | MEM: "A Software-Based Approach to Radiation Mitigation for Planetary Missions"; sol 1762 ve 1775 | |
| 82 | LRV El Kitabı ve LRV navigasyon teknik notu | R:365-366 | nasa.gov/.../LRVSysHndbkA17.pdf, 19740003321_1974003321.pdf | doğrulanamadı | HTTP 404. Yedek hq.nasa.gov/alsj/... genel ALSJ ana sayfası döndürdü (PDF değil) | |
| 83 | Space.com yazısı Perseverance'ın "kendi GPS'i" | R:354 | SPC | doğrulandı | SPC: "now has its own 'GPS' on Mars"; "about two minutes ... 25 centimeters"; 264 stop | |

## 3. Öneriler ve tasarım kararları

- Göreli (tekerlek, IMU, VO) + mutlak (Güneş, yıldız, ufuk, zemin) iki katmanlı mimari; EKF veya faktör grafiğinde birleşim.
- Önce ufukla kaba konum (~10-100 m), sonra census ile ince konum (~1 m), yıldız izleyici + eğim ölçer bağımsız kontrol (~10 m).
- Projenin "en büyük katkısı": LOLA DEM + SPICE'tan o anki Güneş konumuyla beklenen gölge haritasını üretip eşleştirmeyi ona karşı yapmak.
- Kalıcı gölge (PSR) için ShadowCam ya da yalnızca DEM yükseklik eşleştirmesi.
- Karşıt aydınlatma için SGM'e güvenmek; gerekirse yükseklik skor ağırlığını artırmak.
- Kayma tahmini: tekerlek ile VO farkı; VO yokken eğim/akım/arazi sınıfından öğrenilmiş model; EKF'ye düzeltme terimi.
- Sentetik demo: LOLA DEM'den iki Güneş açılı harita, ±30 m kaydırılmış başlangıç, değiştirilmiş census + yükseklik SSD, skor ısı haritası, hata-Güneş farkı grafiği, EKF belirsizlik elipsi.
- Teknoloji: Python, NumPy, SpiceyPy, rasterio; yeni bağımlılık için ekip onayı (docs/adr).
- Jüri hikâyesi: "NASA'nın 2026'da Mars'ta devreye aldığı yöntemi Ay'ın güney kutbunun aydınlatmasına uyarladık".

## 4. Belge içi çelişkiler ve eskimiş bilgiler

1. LunarNav: R:35 ve R:65 LunarNav'ı ufuk eşleştirme olarak veriyor; P'nin tablosu aynı JPL işini "krater tabanlı Ay konumlama" diye anıyor ve SRV de LunarNav'ı krater tabanlı sayıyor (No 1). Düzeltilmeli.
2. Yıldız izleyici sınırlayıcısı: R:44/R:101 "eğim ölçer"; gösterilen JPL posteri "yerçekimi haritası" diyor (No 6).
3. "~10 m" sayısı (R:102, R:269, mimari şeması) ölçülmüş sonuç gibi duruyor; kaynakta hedef. SRV'nin SPS denemesi ±421 m (Ay için ±125 m), POS breadboard testi 0,15° (~4,5 km Ay'da) (No 26, 29).
4. "~10-100 m" ufuk sayısı ICRA'da Mars ufuk literatürü özeti; belge Ay'a doğrudan aktarıyor.
5. R:255 "VIPER zaten taşıyordu": VIP sunumu Kasım 2024 tarihli, SRV "still in-development" diyor; uçuş yapılmış gibi okunmamalı.
6. R:145: Lunokhod 1 için "fazla hesaplandı" hiçbir açılan kaynakta yok; 42/37 km bağımsız sayfalarda doğru.
7. R:153 LRV kuralı: SRV'de "dört encoder'dan üçünden eşzamanlı sinyal" kuralı var; belge El Kitabı'na yönlendiriyor, SRV yeterli bir ilk kaynak.
8. Kaynak yaşı: ICRA makalesi 2023 verisiyle (sol 914 gölge modu); 744 KB/250 KB rakamı Şubat 2026 uçuş sürümü için geçerli olmayabilir.
9. R ile P arasındaki farklar (sayısal fark yok):
   - P Bölüm 5: "günlerce sürebiliyor" yalnızca P'de (No 41).
   - P Bölüm 5: Spirit/Opportunity VO "yalnızca kayma riski yüksek yerlerde"; R: "riskli yerlerde".
   - P Bölüm 2 krater satırında "JPL araştırmaları (krater tabanlı Ay konumlama)"; R:66 yalnızca "JPL araştırmaları".
   - P Bölüm 4 VIPER: "Güneş yerine yıldız"; R:103 "yıldızlar kullanıldı".
   - P Bölüm 10 karşıt aydınlatma: "bazı yönler etkilenmez"; R:266 "hepsi aynı anda etkilenmez".
   - P Bölüm 3: "Çin Chang'e görevlerinde kullanıyor"; R:81 "kullandı".
   - P Bölüm 3 ranging: "tam X km"; R: "X km".

## 5. Etiket sayıları

- doğrulandı: 45
- kısmen doğru: 12
- yanlış: 1
- kaynağı yok: 19
- doğrulanamadı: 6
- toplam: 83

## 6. Açılamayan kaynaklar

- https://independent.academia.edu/DeborahSigel: HTTP 403 (2 deneme)
- https://sciforum.net/paper/24132: HTTP 403 (2 deneme); mdpi.com/2673-4591/126/1/53 da 403
- https://www.nasa.gov/wp-content/uploads/static/history/alsj/LRVSysHndbkA17.pdf: HTTP 404; yedek hq.nasa.gov adresi PDF yerine ALSJ ana sayfası
- https://www.nasa.gov/wp-content/uploads/static/history/alsj/19740003321_1974003321.pdf: HTTP 404; yedek aynı
- https://www.nature.com/articles/498284a: açıldı ama ücretli, içerik okunamadı
- https://www.jpl.nasa.gov/news/...: ilk istek 403, ikinci istek (farklı User-Agent) 200
- https://robotics.jpl.nasa.gov/media/documents/2024_Global_Localization_IEEE_Aero.pdf: indirildi, incelenmedi
