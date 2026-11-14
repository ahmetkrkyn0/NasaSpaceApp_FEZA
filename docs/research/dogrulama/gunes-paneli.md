# Doğrulama: Güneş paneli modeli

Bu dosya [ANALIZ-OZETI.md](../ANALIZ-OZETI.md) belgesinin ekidir. Araştırma notundaki her kontrol edilebilir iddia, notun gösterdiği kaynak açılarak karşılaştırıldı.

- **Doğrulama tarihi:** 14 Kasım 2026
- **İncelenen dosyalar:** [README.md](../solar-panel-model/README.md)
- **Not:** Kanıt sütunundaki alıntılar kaynaktaki haliyle bırakıldı. Sayılar ve birimler kaynakla aynı yazıldı.

| Etiket | Adet |
|---|---:|
| doğrulandı | 35 |
| kısmen doğru | 8 |
| yanlış | 0 |
| kaynağı yok | 9 |
| doğrulanamadı | 2 |
| **Toplam** | **54** |

Doğrulanan dosya: `docs/research/solar-panel-model/README.md` (479 satır, 17 kaynak adresi)
Horizons yeniden sorgusu (COMMAND=10, CENTER=coord@301, SITE_COORD=29.13,-84.78,0, 2026-12-01 00:00 - 2026-12-31 23:00, 1 h, QUANTITIES=4,20, DE441).

## 1. Belge özeti

- Belge, bir güneş panelinin Ay güney kutbunda saat saat ürettiği gücü hesaplayan bir model öneriyor: `P = verim x alan x 1361/r^2 x max(0, s.n) x disk_kesri`.
- Panel tiplerini (yere yatık, dik sabit, dik dönen, iki eksenli, VIPER benzeri üç panelli rover kutusu) panel normali ile tanımlıyor. Ayrıca gözlemci yüksekliğine bağlı ufuk maskesini (direk yüksekliği 2/5/10/20 m), rover eğimi, bakısı ve yönünü (`R_enu_body`) ve isteğe bağlı sıcaklık düzeltmesini ele alıyor.
- Mons Mouton (-84,78°, 29,13° D) için Aralık 2026 Horizons verisiyle sabit ufuklu (-1°, 0°, +1°) bir ön hesap veriyor: dönen dik panel iki eksenliye neredeyse eşit, 1° ufuk farkı enerjide yüzde 11-16 fark yaratıyor.
- Mimariyi light-heat-layer içine P1-P5 modülleri olarak yerleştiriyor ve `panel_profile.json`, `mast_horizon.npz`, `panel_power.csv`, `panel_summary.json` biçimlerini tanımlıyor.
- Ürüne önerdiği özellikler: panel tipi ve yükseklik seçimi, güç eğrisi, en uzun karanlık, saha puanına enerji sütunu, zamanlı A* rotasında rover yönü seçimi.

## 2. İddia tablosu

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt (açılan adres + alıntı/sayı) | Not |
|---|---|---|---|---|---|---|
| 1 | Test sahası Mons Mouton (-84,78°, 29,13° D), efemeris çalışmasıyla aynı | Üst bilgi, §8 | Proje içi (ephemeris-rotation-ground-stations) | doğrulandı | Proje içi zip: `site_azel_spice.py` "LAT, LON, H = -84.78, 29.13, 0.0"; `lunarAzEl.mjs` aynı | Proje içi kodla aynı; koordinat için dış kaynak yok. NASA VIPER sayfası hedefi "Mons Mouton" diye veriyor, koordinat vermiyor. |
| 2 | Aralık 2026'da Güneş en fazla 6,47° yükseliyor (21 Aralık) | §1, §4, §8 | JPL Horizons API | doğrulandı | https://ssd.jpl.nasa.gov/api/horizons.api : max el 6,470271° @ 2026-Dec-21 12:00 | Yeniden hesaplandı. Ekibin `hz_sun_site.txt` dosyası da 6,470271 veriyor. |
| 3 | 1-31 Aralık saatlik 744 satır; ilk satır az 250,880680°, el -0,238375°, `data/hz_sun_site.txt` ile aynı | §8 | Horizons, proje içi veri | doğrulandı | Horizons: 744 satır; ilk satır "250.880679922, -0.238375426, 0.98633188206139"; hz_sun_site.txt "250.880680 -0.238375" | Yeniden hesaplandı. |
| 4 | Aylık ortalama tablosu (W/m²): iki eksenli 892,7/771,2/688,3; dönen 890,3/768,8/685,9; sabit 426,2/423,4/423,3; rover köşe 419,7/362,4/323,3; park 354,4/316,6/289,3; yatık 54,3/54,3/53,6 | §8 | Horizons + belgedeki formül | doğrulandı | Yeniden hesap, 744'e bölünce: 893,9/772,2/689,2; 891,5/769,8/686,8; 426,9/424,0/423,8; 420,3/362,9/323,8; 354,9/317,1/289,7; 54,4/54,4/53,7. Toplam 745'e bölününce tüm değerler birebir tutuyor. | Yeniden hesaplandı. Fark en fazla %0,15. Belge "744 satır" diyor ama ortalamalar 745'lik paydaya uyuyor (bkz. bölüm 4). |
| 5 | Güneş kısmen görünür %66,2/56,6/50,6; tam görünür %61,1/53,3/47,5 | §8 | Horizons + formül | doğrulandı | Kısmen görünür 493/422/377 saat, tam görünür 455/397/354 saat; /745 = 66,2/56,6/50,6 ve 61,1/53,3/47,5 | Yeniden hesaplandı. 744'e bölünce 66,3/56,7/50,7 ve 61,2/53,4/47,6 çıkıyor. |
| 6 | En uzun kesintisiz karanlık: ufuk -1°'de 232 saat, 0°'de 280 saat | §8, §11 | Horizons + formül | doğrulandı | Yeniden hesap: 232 h ve 280 h | Yeniden hesaplandı. +1° hücresi "—" bırakılmış; pencere içinde 303 h çıkıyor (1 Aralık 00:00'da zaten karanlık, gerçek süre daha uzun). |
| 7 | Günlük tablo (ufuk -1°): en yüksek el -0,24/0,02/4,21/6,47/5,76/2,22/-1,08°; dönen 1076/1331/1403/1392/1394/1403/55; rover 507/627/662/656/657/662/26; yatık 0/0/92/158/133/41/0; 2-10 Aralık dönen 0-3 | §8 | Horizons + formül | doğrulandı | Yeniden hesap birebir aynı (rover 16 Aralık 661 ↔ 662 yuvarlama); 2-10 Aralık dönen 0-2,6 W/m² | Yeniden hesaplandı. |
| 8 | Günlük tablo, sabit dik ("en iyi yönde"): 210/0/0/1114/1391/931/10 | §8 | Horizons + formül | doğrulandı | az0 = 325° ile birebir: 210/0/0/1114/1391/931/10 | Yeniden hesaplandı. Belge az0 değerini yazmıyor; 1° adımla en iyi yön 327°, aylık fark %0,2'den az. |
| 9 | Sabit dik panel yaklaşık 2-16 Aralık hiç üretmiyor | §8 | Horizons + formül | doğrulandı | az0 = 325°: 2-16 Aralık günlük ortalama 0; 17 Aralık 113 W/m² | Yeniden hesaplandı. |
| 10 | Dönen dik panel iki eksenliye çok yakın, fark %0,3 | §1, §8 | Ekip hesabı | doğrulandı | 890,3/892,7 → %0,27; ufuk 0°'da %0,31; +1°'de %0,35 | Yeniden hesaplandı. |
| 11 | Sabit dik panel dönen panelin yarısını, yere yatık panel yaklaşık %6'sını topluyor | §1 | Ekip hesabı | doğrulandı | -1°: 426,2/890,3 = %47,9; 54,3/890,3 = %6,1 | Yeniden hesaplandı. Yalnız -1° ufuk için; ufuk 0°'da oranlar %55 ve %7,1. |
| 12 | 1° ufuk farkı dönen panelde 686-890 W/m²; aşağı alınca +%16 (769→890), yukarı alınca -%11 (769→686); "1° = %11-16" | §1, §7, §8, §15 | Ekip hesabı | doğrulandı | 890,3/768,8 = 1,158; 685,9/768,8 = 0,892 | Yeniden hesaplandı. W/m² ortalama güçtür, §1'deki "aylık enerji" ifadesi birim olarak yanlış. |
| 13 | Rover yönünü Güneş'e göre ayarlayarak park haline göre %18 daha fazla enerji topluyor | §1, §8 | Ekip hesabı | kısmen doğru | -1°: 419,7/354,4 = 1,184; 0°: 362,4/316,6 = 1,145; +1°: 323,3/289,3 = 1,118 | Yeniden hesaplandı. %18 yalnızca -1° ufukta geçerli; §1'de koşulsuz yazılmış (0°'da %14,5, +1°'de %11,8). |
| 14 | Rover sütunu = dönen x 1,414 / 3 (üç panelin toplam alanına bölme) | §8 | Ekip hesabı | doğrulandı | 890,3 x 0,4714 = 419,7; 768,8 x 0,4714 = 362,4; 1403 x 0,4714 = 661 | Yeniden hesaplandı (belge içi tutarlılık). |
| 15 | `panel_summary.json` örneği: 258,2 W, 192,1 kWh, %66,2, 232 h (1 m², verim 0,29, ufuk -1°) | §11 | Ekip hesabı | doğrulandı | 890,3 x 0,29 = 258,2 W; 258,2 x 744 h = 192,1 kWh | Yeniden hesaplandı. |
| 16 | Panel tiplerinin iç çarpımları: yatık sin(el), dik sabit cos(el)·cos(az-az0), dönen cos(el), iki eksenli 1 | §4 | Kaynak yok (türetme) | doğrulandı | `gunes_vektoru` = (cos el sin az, cos el cos az, sin el) ile n = (sin az0, cos az0, 0) çarpımı cos el·cos(az-az0) veriyor | Yeniden hesaplandı. |
| 17 | cos(6,47°) = 0,994 | §4 | Hesap | doğrulandı | 0,99363 | Yeniden hesaplandı. |
| 18 | Eğrilikten ufuk alçalması √(2h/R): 2 m 0,087°, 10 m 0,194°, 20 m 0,275° | §5 | Hesap | doğrulandı | R = 1737,4 km ile 0,0869°, 0,1944°, 0,2749° | Yeniden hesaplandı. |
| 19 | Arka köşede iki panel cos 45° = 0,707 ile ışık alır; toplam 1,414, yani %41 fazla | §6 | Hesap | doğrulandı | 2 x 0,7071 = 1,4142 | Yeniden hesaplandı. |
| 20 | Yönü 5°'lik adımlarla taramak "36 veya 72 deneme" | §6 | Hesap | kısmen doğru | 360/5 = 72; 36 deneme ancak 10° adımla (ya da 5° ile 180°) | Yeniden hesaplandı. Küçük tutarsızlık. |
| 21 | `mast_horizon.npz`: 10 nokta x 4 yükseklik x 360 ≈ 60 KB | §10, §11 | Hesap | doğrulandı | 14 400 değer x 4 bayt (float32) = 57,6 KB | Yeniden hesaplandı. float64 olursa ≈115 KB; veri tipi yazılmalı. |
| 22 | Güneş diskinin açısal yarıçapı ≈ 0,267° | §3 (`R_GUNES`) | Yok | kaynağı yok | — | Not: arcsin(695 700 km / 1 AU) = 0,2665°; Aralık'ta (r ≈ 0,984 AU) ≈ 0,271°. DSNE: "angular diameter ≈ 0.5°". Sabit kabulü ihmal edilebilir. |
| 23 | Güneş sabiti 1 AU'da 1361 W/m² | §3 | Yok | kaynağı yok | — | Not: Belgenin kendi kaynağı DSNE ortalamayı 1367 ± 5 W/m² veriyor (%0,4 yüksek). arXiv 2509.13110 örneği 1361 kullanıyor. |
| 24 | Ay yüzeyinde Güneş akısı 1315-1421 W/m² | §16 | DSNE (NTRS 20230015518) | doğrulandı | NTRS DSNE PDF: "Maximum ... 1421 ± 5 ... Mean 1367 ± 5 ... Minimum 1315 ± 5" W/m² | — |
| 25 | `R_enu_body` ekibin `f1_check.py` dosyasıyla aynı; 2000 rastgele durumla doğrulanıyor | §6, §13 | Proje içi zip | doğrulandı | `f1_check.py` çalıştırıldı: "F1 checks passed; max \|theta_up - formula\| = 3.55e-14" (2000 döngü); fonksiyon gövdesi birebir aynı | Yeniden çalıştırıldı. |
| 26 | SLIM (2024) burnunun üstüne devrildi, paneller batıya baktı, Güneş batıya geçince uyandı | §2 | CSA notu (proje içi) | doğrulandı | Proje içi csa-moon-exploration.md (satır 254): "Motor sorunu yüzünden burnunun üstüne devrildi, paneller batıya baktı. Sabah güç yoktu, Güneş batıya geçince araç uyandı." | Proje içi kaynak; dış doğrulama v-csa'da. O notun dış kaynakları (Scientific American, The Register) bu görevde açılmadı. |
| 27 | Athena (IM-2, 2025) güney kutbu yakınında yan yattı, paneller yeterli Güneş alamadı | §2 | space.com | doğrulandı | https://www.space.com/...athena...toppled... : "fell onto its side shortly after touching down near the lunar south pole on March 6. Athena's solar panels couldn't harvest enough sunlight" | Makaleye göre iniş bölgesi kutba yaklaşık 160 km. |
| 28 | Athena bir kraterin içine yattı; görev 13 saatten kısa sürdü | §2 | space.com | kısmen doğru | Aynı sayfa: "the probe was declared dead the next day"; "13 saat" geçmiyor. "Crater" yalnızca ilgili haber başlığında: "falling on its side in crater" | 13 saat iddiası açılan kaynakta yok. |
| 29 | VIPER'ın üç dik paneli vardı (sol, sağ, arka) | §2, §6 | VIPER LSIC 2024, IAC 2024 | doğrulandı | LSIC PDF: "Solar Array (3-sides)"; IAC PDF: "optimum power occurring when the sun points on rear corners of the rover, lighting two panels at the same time" | Sol/sağ/arka ayrımı bu iki ifadeden çıkarılıyor. |
| 30 | VIPER benzeri rover'da en iyi güç Güneş arka köşedeyken (iki panel birden) | §1, §6 | IAC 2024 | doğrulandı | IAC PDF, yukarıdaki alıntı | — |
| 31 | VIPER ekibi Güneş'i arka köşeye alacak şekilde sürüş planlıyordu | §2 | IAC 2024; Shirley ve Balaban 2022 | kısmen doğru | IAC yalnızca optimumu belirtiyor. Shirley ve Balaban: "Traverses must be timed to avoid moving shadows"; arka köşe yönelimi planı geçmiyor | Optimum doğru, "sürüş planı" kısmı kaynakta yok. |
| 32 | VIPER (NASA) iptal edildi | §2 | Yok | kaynağı yok | — | Not, eskimiş bilgi: https://science.nasa.gov/mission/viper/ (son güncelleme 21 Eylül 2026): "On September 19, 2025, NASA announced that VIPER ... will be delivered to Mons Mouton by a Blue Origin Blue Moon MK-1 lander". Varış yeri ekibin test sahasıyla aynı. |
| 33 | VIPER her yöne sürülebiliyordu (yengeç yürüyüşü) → JSON'da `her_yone_surus: true` | §6, §11, §15 | VIPER LSIC 2024 (hareket donanımı) | kısmen doğru | LSIC PDF: "Steering: explicit with +/-50 deg range"; üç VIPER metninde "crab/sideways/omnidirectional" geçmiyor | Yengeç sürüşü yaklaşık ±50° ile sınırlı; "her yöne" desteklenmiyor. Profildeki `true` varsayılanı aynı abartıyı taşıyor. |
| 34 | VIPER'ın 50 saatlik güvenli karanlık sınırı | §8 | Shirley ve Balaban 2022; LSIC 2024 | doğrulandı | Shirley ve Balaban (2 Haziran 2022): "Locations with < 50 hrs of shadow ... We call those locations Safe Havens"; LSIC: "50 hours survival in low power mode" | — |
| 35 | NASA VSAT: dikey güneş dizisi direkleri, 20 m'ye kadar; yükleniciler Astrobotic, Honeybee Robotics, Lockheed Martin | §2 | VSAT 2023 (NTRS); Lockheed Martin 2025 | doğrulandı | VSAT PDF: "vertical array deployment on extension masts of up to 20m"; "Three contractors received Option Awards: Astrobotic, Honeybee Robotics, Lockheed Martin". LM (7 Nisan 2025): "heights of up to 65 feet" | VSAT KPP'de direk yüksekliği eşiği 5 m, hedefi 10 m. "10-20 m" alt ucu proje eşiği değil, BEACON'daki >10 m kuleye dayanıyor. |
| 36 | VSAT prototipleri 2024'te JSC'deki vakum odasında test edildi | §2 | VSAT 2023; LM 2025; Honeybee (Blue Origin) | kısmen doğru | VSAT PDF (Eylül 2023): "Final TVAC testing at JSC will occur May through August of 2024" (plan, gerçekleşme değil). LM sayfası testleri sayıyor ama JSC ya da vakum odası geçmiyor | Honeybee sayfası açılamadı (429). Testin yapıldığı açılan hiçbir kaynakta teyit edilmedi. |
| 37 | Dik, dönen panel = NASA VSAT tipi (tek eksenli izleme) | §4 | VSAT 2023 | doğrulandı | VSAT PDF KPP tablosu: "Sun Tracking Single Axis 360 ... Degree Rotation" | — |
| 38 | EPJ PV 2024: kutup için dikey eksenli izleyici iki eksenliye neredeyse eşit; sabit paneller %37-64 kaybediyor | §4 | EPJ Photovoltaics 2024 | doğrulanamadı | https://www.epj-pv.org/...pv20240003.html → HTTP 403 (captcha sayfası) | 2. deneme (web-fetch ajanı) rapor teslim etmedi. %37-64 aralığı bu görevde görülmedi. |
| 39 | Gläser vd. 2014: en iyi güney kutup noktaları 2 m'de zamanın %77-88'inde aydınlık | §5 | doi:10.1016/j.icarus.2014.08.013 | doğrulanamadı | DOI → Elsevier yönlendirme sayfası (ScienceDirect, ücretli) | 2. deneme (web-fetch ajanı) rapor teslim etmedi. Bağımsız not: LM 2025 "Certain locations receive sunlight 80% to 90% of the time" diyor (yükseklik belirtmeden). |
| 40 | Connecting Ridge çalışması: 2 m'de %92,27, 10 m'de %95,65 aydınlık | §5 | Yok (belge de "yazarı doğrulanmadı" diyor) | kaynağı yok | — | Bağımsız not: Barker vd. 2021, 5 m'de "nearly the entire connecting ridge has an average illumination >70%" (farklı metrik ve dönem). |
| 41 | Barker vd.: 5 m ve üzerindeki yüksekliklerde arazi modeli hatalarının etkisi azalıyor | §5 | NTRS 20205009660 | kısmen doğru | PGDA 78: "At 5 m above the surface, the effect of LDEM uncertainties on illumination conditions are significantly reduced"; makale yalnızca Δz = 1 m ve 5 m'yi karşılaştırıyor | "5 m'de azalıyor" doğru, "ve üzeri" kaynakta yok (çıkarım). NTRS sayfası curl ile açılmadı, NTRS API ve tam metin açıldı. |
| 42 | VSAT/BEACON hedefi: kutup kışında 100 saatten kısa gölge, 10-20 m direkler | §5 | BEACON (NTRS 20240015887); VSAT 2023 | doğrulandı | BEACON PDF (9 Ocak 2025): "~10 kWe class array ... on a >10 m tower with shadow periods <100 hours during lunar winter"; örnek "17 m tall"; VSAT "up to 20m" | — |
| 43 | Uzay tipi üç eklemli GaAs hücre verimi ≈ 0,28-0,30 (JSON'da 0,29) | §7, §11 | Spectrolab TNJ veri sayfası | kısmen doğru | Spectrolab PDF (29.04.2008, ITJ): "BOL: 26.8% min. average efficiency"; "EOL: 22.5%"; yapı "GaInP2/GaAs/Ge" | Hücre tipi doğru; 0,28-0,30 aralığı gösterilen sayfada yok (26,8% BOL). |
| 44 | Sıcaklık katsayısı ≈ -%0,2/K (k ≈ -0,002/K) | §7 | Spectrolab (dolaylı) | doğrulandı | Aynı PDF: Jmp +7,3 µA/cm²/°C (Jmp 16,00 mA/cm²), Vmp -6,2 mV/°C (Vmp 2,270 V), 10-80 °C → -0,23 %/°C | Yeniden hesaplandı. Sayfa güç katsayısını doğrudan vermiyor. Kutup soğuğunda geçerliliği belgenin de dediği gibi doğrulanmadı. |
| 45 | T_ref ≈ 301 K (28 °C) | §7, §11 | Spectrolab | doğrulandı | Aynı PDF: "(AM0 (135.3 mW/cm²) 28°C, Bare Cell)" | — |
| 46 | arXiv 2509.13110: Ay'da PV sıcaklığı için gri bant modeli; panel hem Güneş'ten hem zeminden ısınıyor | §7 | arXiv 2509.13110 | doğrulandı | https://arxiv.org/abs/2509.13110 (Koltsov, Jehl Li-Kao, 16 Eyl 2025): "practical gray-band (integrated) expression ... view factors to the regolith and to space" | — |
| 47 | arXiv örneği: 390 K zemin yanında Güneş'e dik panel 329 K | §7 | arXiv 2509.13110 | doğrulandı | arXiv PDF: "GPOA = G (cos θ = 1) ... Treg = 390 K ... Tc ≈ 329 K (≈56°C)" | Makale bu girdileri "representative values" olarak veriyor; kutup durumu ayrıca hesaplanmamış. |
| 48 | Sıcaklık düzeltmesi enerjiyi "birkaç yüzde" değiştirir | §7 | Yok | kaynağı yok | — | Kaba hesap: -0,23 %/K ile 329 K'de -%6,4; hücre 301 K'den soğuksa artı yönde. |
| 49 | NumPy lisansı BSD-3 | §13 | Yok | kaynağı yok | — | Bağımsız kontrol: github.com/numpy/numpy LICENSE.txt BSD 3 maddeli; pyproject "BSD-3-Clause AND 0BSD AND MIT AND CC0-1.0" (gömülü parçalar). Pratikte doğru. |
| 50 | astroquery (jplhorizons) lisansı BSD-3 | §13 | Yok | kaynağı yok | — | Bağımsız kontrol: GitHub API astropy/astroquery → BSD-3-Clause. Doğru. |
| 51 | heat1d lisansı MIT | §13 | Yok | kaynağı yok | — | Bağımsız kontrol: GitHub API phayne/heat1d ("Thermal model for planetary science applications") → MIT. Doğru; belge depo adresi vermiyor. |
| 52 | pvlib-python lisansı BSD-3 | §13 | Yok | kaynağı yok | — | Bağımsız kontrol: GitHub API pvlib/pvlib-python → BSD-3-Clause. Doğru. |
| 53 | PGDA ürün 78: güney kutup sahaları için 5 m LOLA DEM'leri (NASA verisi) | §9, §13 | https://pgda.gsfc.nasa.gov/products/78 | doğrulandı | "The new 5 m/pix LDEMs are substantially more realistic..." | Saha listesinde "Mons Mouton" adı yok; "Site20: Leibnitz beta plateau" var. Test sahasını kapsayıp kapsamadığı bu görevde doğrulanmadı. |
| 54 | PGDA ürün 69: kutup aydınlanma haritaları (Güneş % doğrulaması için) | §8, §13 | https://pgda.gsfc.nasa.gov/products/69 | doğrulandı | "Maps of the solar illumination, averaged over hourly timesteps spanning 18.6 years, for the south polar region" | Uzun dönem ortalaması; Aralık 2026'nın tek ayıyla doğrudan kıyaslanamaz. |

**Kanıt sütunundaki kısaltmaların açılan adresleri:**

- VSAT PDF: https://ntrs.nasa.gov/api/citations/20230012849/downloads/GCD%20Annual%20Review%20VSAT%20September%202023%20Final.pdf
- BEACON PDF: https://ntrs.nasa.gov/api/citations/20240015887/downloads/BEACON%20Exec%20Summary.pdf
- LM (Lockheed Martin, 7 Nisan 2025): https://www.lockheedmartin.com/en-us/news/features/2025/powering-the-moon--vertical-solar-arrays-charge-the-way-.html
- Shirley ve Balaban 2022: https://www.nasa.gov/wp-content/uploads/2022/05/overview_of_mission_planning_for_the_viper_rover.pdf
- IAC PDF: https://ntrs.nasa.gov/api/citations/20240010794/downloads/20240818%20VIPER%20Manuscript%20IAC%202024.pdf
- LSIC PDF: https://ntrs.nasa.gov/api/citations/20240013903/downloads/LSIC_2024-Tech%20Infusion_Panel-VIPER_Mob-HW.pdf
- NASA VIPER sayfası: https://science.nasa.gov/mission/viper/
- DSNE PDF: https://ntrs.nasa.gov/api/citations/20230015518/downloads/DSNE_LunarSurfaceEnvironment_Chambers_v2.pdf
- Spectrolab PDF: https://www.spectrolab.com/DataSheets/TNJCell/tnj.pdf
- arXiv: https://arxiv.org/abs/2509.13110 ve tam metin https://arxiv.org/pdf/2509.13110
- Athena: https://www.space.com/astronomy/moon/heres-why-the-private-athena-lunar-lander-toppled-over-on-the-moon
- Barker vd.: https://ntrs.nasa.gov/api/citations/20205009660 (meta veri) ve https://ntrs.nasa.gov/api/citations/20205009660/downloads/Mike%20Barker_%20Paper_%20Improved%20Lola.pdf.txt (tam metin)
- PGDA 78: https://pgda.gsfc.nasa.gov/products/78 ; PGDA 69: https://pgda.gsfc.nasa.gov/products/69
- Horizons: https://ssd.jpl.nasa.gov/api/horizons.api (parametreler dosya başında)
- Lisanslar: https://api.github.com/repos/{numpy/numpy, astropy/astroquery, pvlib/pvlib-python, phayne/heat1d, ChristianSteger/HORAYZON} ve https://raw.githubusercontent.com/numpy/numpy/main/LICENSE.txt
- Proje içi: `docs/research/ephemeris-rotation-ground-stations/lunar-navigator-hesaplar.zip` (scratch'e açıldı: `data/hz_sun_site.txt`, `scripts/f1_check.py`, `code/site_azel_spice.py`), `docs/research/csa-moon-exploration.md`

Lead'in örneği ("Güneş 1,5° yükseklikteyken dikey panel yatay panelden 38 kat fazla üretir") bu belgede geçmiyor. Kontrol için hesaplandı: cot(1,5°) = 38,2, yani örnek aritmetik olarak doğru.

## 3. Öneriler ve tasarım kararları (iddia sayılmadı)

- Güç modeli: `P = verim x alan x 1361/r² x max(0, s·n) x disk_kesri`; disk kesri, yüksekliğin ufka göre farkıyla doğrusal kırpma olarak hesaplanacak.
- Panel tipi, normal vektörünün seçimiyle tanımlanacak (yatık, dik sabit + az0, dik dönen, iki eksenli, rover kutusu).
- Önerilen iniş aracı ya da üs paneli: dik ve dikey eksende dönen panel; eğme mekanizması gerekmiyor.
- M2 ufuk maskesi gözlemci yüksekliğini parametre olarak alacak (zemin 0 m, rover paneli yaklaşık 1 m, direk 2/5/10/20 m). Direk yükseklikleri yalnızca seçilen saha noktaları için önceden hesaplanacak (P2, `mast_horizon.npz`).
- Rover yönü (`psi`) "bekle" hamlesinde 5° adımla taranarak seçilecek; sürüşte hareket yönü olacak. Her yöne sürülebilen rover için serbest olacak (`her_yone_surus`).
- İlk sürümde sıcaklık düzeltmesi kapalı başlayacak (`k = 0`), sonra sabit hücre sıcaklığıyla açılacak.
- Öncelik ufuk maskesinin doğruluğunda; sonuçlar PGDA aydınlanma haritasıyla karşılaştırılacak.
- Dosya biçimleri: `panel_profile.json` (girdi), `mast_horizon.npz`, `panel_power.csv`, `panel_summary.json`; `route.json`'a `psi` ve `P_panel` alanları eklenecek.
- Ürün kullanımı: saha seçiminde güç eğrisi ve en uzun karanlık, saha puanına enerji sütunu, zamanlı A* rotasında pil hesabı, eğitim için panel tipi karşılaştırma animasyonu.
- Zorunlu bağımlılık olarak yalnızca NumPy; pvlib kullanılmayacak (atmosfer varsayıyor); ufuk için HORAYZON ya da kendi döngü.
- Plan: önce P1+P4+P5 sabit ufukla, sonra arayüz, sonra M4 gölgesi, sonra rover ve M6/M7 entegrasyonu; direk yükseklikleri ve sıcaklık ekstra.
- Arayüzde VIPER panel alanı ve verimi varsayım olarak işaretlenecek.

## 4. Belge içi çelişkiler ve eskimiş bilgiler

1. **Eskimiş: "VIPER (NASA, iptal edildi)" (§2).** NASA'nın VIPER sayfasına göre 19 Eylül 2025'te VIPER'ın bir Blue Origin Blue Moon MK-1 iniş aracıyla Mons Mouton'a götürüleceği açıklandı (sayfanın son güncellemesi 21 Eylül 2026). Varış yeri, belgenin test sahasıyla aynı. §2 tablosu güncellenmeli. VIPER benzeri profil bu durumda doğrudan ilgili hale geliyor.
2. **744 / 745 paydası (§8).** Belge "744 satır" diyor ve Horizons gerçekten 744 satır döndürüyor. Ancak aylık ortalamalar ve yüzdeler, toplam 745'e bölünürse birebir tutuyor; 744'e bölünce değerler %0,13 yüksek çıkıyor. Etkisi ihmal edilebilir, ama betikte payda ya da zaman aralığı kontrol edilmeli.
3. **+1° ufukta en uzun karanlık "—" (§8).** Hücre boş bırakılmış. Ay içinde ölçülen süre 303 saat; karanlık 1 Aralık'tan önce başladığı için gerçek süre daha uzun. Açıklama eklenmeli.
4. **Birim karışıklığı.** §1 madde 3 ve §8 "aylık enerjisini 686 ile 890 W/m² arasında" diyor. W/m² ortalama güçtür; enerji için Wh/m² (x744 h) kullanılmalı.
5. **%18 koşulsuz yazılmış (§1).** §8'de yalnızca ufuk -1° için geçerli; 0° ufukta %14,5, +1° ufukta %11,8.
6. **"5° adım, 36 veya 72 deneme" (§6).** 5° adımla tam tur 72 denemedir; 36 için 10° adım gerekir.
7. **§8 "Ne öğrendik" madde 4.** "2-10 Aralık arasında Güneş ufkun altında" ifadesi 0° ufka uyuyor (11 Aralık'ta da en yüksek el -1,0°). Aynı cümledeki "232 saatlik karanlık" ise -1° ufka ait. Hangi ufkun kastedildiği belirtilmeli.
8. **VIPER "her yöne sürülebiliyordu".** Gösterilen LSIC kaynağı ±50° direksiyon açısı veriyor. `her_yone_surus: true` varsayılanı bu abartıyı ürüne taşıyor.
9. **Verim varsayımı.** JSON'daki 0,29 ve §7'deki 0,28-0,30, gösterilen Spectrolab sayfasıyla (2008 tarihli, BOL %26,8 / EOL %22,5) desteklenmiyor. Ya daha yeni bir veri sayfası gösterilmeli ya da değer 0,27 civarına çekilmeli.
10. **1361 ile 1367.** Model 1361 W/m² kullanıyor, gösterilen DSNE kaynağı ortalama 1367 W/m² diyor. Fark %0,4; hangi değerin neden seçildiği yazılmalı.
11. **Disk kesri doğrusal yaklaşım.** `disk_kesri` görünür disk alanının gerçek kesri değil, doğrusal bir rampa. Kenar saatlerinde küçük hata yaratır; belgede "yaklaşım" olarak belirtilmesi iyi olur. Güneş yarıçapı sabit 0,267° alınmış; Aralık'ta 0,271° (ihmal edilebilir).
12. **arXiv örnek sıcaklıkları.** Makale 390 K zemin ve dik Güneş girdilerini "representative values" olarak veriyor, kutup durumunu ayrıca hesaplamıyor. §7'deki 329 K, Mons Mouton koşulları için bir sonuç olarak okunmamalı.
13. **Barker "5 m ve üzeri".** Makale yalnızca 1 m ve 5 m'yi karşılaştırıyor; "ve üzeri" çıkarım.
14. **PGDA 5 m DEM kapsamı.** §9 ve §13, M1 için "PGDA 5 m saha DEM'leri"ne dayanıyor, ama ürün 78'in saha listesinde "Mons Mouton" adı geçmiyor ("Site20: Leibnitz beta plateau" var). Test sahasının kapsanıp kapsanmadığı kontrol edilmeli.
15. **HORAYZON lisansı (§13 "kontrol edilmeli").** GitHub API'ye göre ChristianSteger/HORAYZON MIT lisanslı.
16. **SLIM satırı** yalnızca proje içi CSA notuna dayanıyor; belgede dış kaynak gösterilmemiş.
17. **VSAT testi.** "2024'te JSC'de test edildi" ifadesi, gösterilen 2023 belgesinde yalnızca plan olarak geçiyor.

## 5. Etiket sayıları

| Etiket | Adet |
|---|---:|
| doğrulandı | 35 |
| kısmen doğru | 8 |
| yanlış | 0 |
| kaynağı yok | 9 |
| doğrulanamadı | 2 |
| **Toplam** | **54** |

## 6. Açılamayan kaynaklar

| Adres | Hata | Etkilenen iddia |
|---|---|---|
| https://www.epj-pv.org/articles/epjpv/abs/2024/01/pv20240003/pv20240003.html | HTTP 403, captcha sayfası ("Please enable JS and disable any ad blocker"). 2. deneme web-fetch ajanıyla yapıldı, rapor teslim edilmedi. | No 38 (%37-64 kayıp, dikey eksen ≈ iki eksen) |
| https://doi.org/10.1016/j.icarus.2014.08.013 | Elsevier yönlendirme sayfası; içerik ScienceDirect'te ücretli. 2. deneme web-fetch ajanıyla yapıldı, rapor teslim edilmedi. | No 39 (Gläser %77-88) |
| https://www.blueorigin.com/news/honeybee-robotics-deploys-lamps-at-nasa-johnson-space-center | HTTP 429 (Too Many Requests). 2. deneme web-fetch ajanıyla yapıldı, rapor teslim edilmedi. | No 36 (VSAT 2024 JSC testi), kısmen |
| https://ntrs.nasa.gov/citations/20205009660 | curl: bağlantı kodu 000 (zaman aşımı ya da boş yanıt). Aynı kayıt NTRS API'den açıldı (api/citations/20205009660 ve tam metin), doğrulama yapılabildi. | No 41 (etkilenmedi) |
