# Doğrulama: Açıklanabilirlik ve görev farkları

Bu dosya [ANALIZ-OZETI.md](../ANALIZ-OZETI.md) belgesinin ekidir. Araştırma notundaki her kontrol edilebilir iddia, notun gösterdiği kaynak açılarak karşılaştırıldı.

- **Doğrulama tarihi:** 14 Kasım 2026
- **İncelenen dosyalar:** [aciklanabilirlik-raporu-v2.pdf](../explainability-mission-differences/aciklanabilirlik-raporu-v2.pdf)
- **Not:** Kanıt sütunundaki alıntılar kaynaktaki haliyle bırakıldı. Sayılar ve birimler kaynakla aynı yazıldı.

| Etiket | Adet |
|---|---:|
| doğrulandı | 49 |
| kısmen doğru | 6 |
| yanlış | 0 |
| kaynağı yok | 9 |
| doğrulanamadı | 21 |
| **Toplam** | **85** |

Belge: `docs/research/explainability-mission-differences/aciklanabilirlik-raporu-v2.pdf` (37 sayfa; metin: `docs/research/explainability-mission-differences/aciklanabilirlik-raporu-v2.pdf`)

**Etiketleme kuralı (tutarlılık için):**
- PDF'de bağlantılar yalnızca 1-3. sayfalarda (düzeltme tablosu) ve 36. sayfada (Kaynakça, 28 benzersiz adres) var. Gövde metnindeki "( )" işaretleri bağlantı değil; rozet ya da emoji ve metne çıkarılırken düşmüş. Bu yüzden bir iddianın kaynağı, Kaynakça'daki adla eşleştirildi.
- **kaynağı yok:** İddianın yanında hiç kaynak yok ya da yalnızca " ( )", "(v1)" veya "ISRO yetkilisi" gibi yayın adı belirtmeyen bir işaret var.
- **doğrulanamadı:** Belirli bir yayın adlandırılmış ya da bağlantılanmış ama açılamadı (403, hata sayfası) veya hiç adres verilmemiş ("Deccan Herald, 2023-07-10", "Firefly 2025-03-17 (v1)" gibi). İddia açılan sayfada bulunamadıysa da bu etiket kullanıldı.
- **Ekip hesapları** (Horizons değerleri, aritmetik) bu oturumda yeniden yapıldı; Not sütununda "yeniden hesaplandı" yazar.

## 1. Belge özeti

Rapor, Ay iniş görevlerinin farklı sonuçlarını üç grupta açıklıyor: saha, aydınlanma ve araç. Ayrıca bu farkların uygulamada nasıl gösterileceğini tarif ediyor. v1'den v2'ye 14 düzeltmeyi bir tabloda topluyor. Ortam ve saha/tarih nedenlerinin ölçülebilir, navigasyon/yazılım/itki nedenlerinin yalnızca resmî kaynakla gösterilebilir olduğunu söyleyen bir nedensellik taksonomisi kuruyor. 13 vakalık bir katalog içeriyor: Chandrayaan-2/-3, IM-1, IM-2 Athena, Blue Ghost M1, SLIM, Chang'e-4, Beresheet, Hakuto-R M1, Resilience, Luna-25, Peregrine ve Apollo 11/12. Bunların yanında çift karşılaştırmalar, Apollo ile Artemis saha seçimi, Artemis III'ün 2026'daki plan değişiklikleri ve kutup aydınlanma literatürü yer alıyor. Altı inişin Güneş açıları ile Athena ve Chang'e-4'ün Dünya açıları JPL Horizons ile hesaplanmış. Projeye önerdikleri:
- Ana açıklama aracı olarak karşı-olgusal karşılaştırma, delta şelale ve ufuk profili üzerinde Güneş/Dünya izi
- Her nedensel kartta kanıt rozeti
- Sabit "±21 dk" yerine her geçiş için hesaplanan belirsizlik aralığı
- Mons Mouton/Athena demosu
- EN/TR kullanıcı metinleri
- Vaka başına JSON şeması

Raporun Horizons sonuçlarını bu oturumda birebir tekrar ettik. Resmî basın bültenleri ve LPSC özeti de büyük ölçüde destekliyor. Zayıf noktalar şunlar: bazı vaka sayılarının kaynağı yok, IM ve ispace birincil kaynakları açılamadı, ve birkaç ifade kaynağından biraz kuvvetli.

### 1a. Belgenin kendi "Sınırlamalar ve açık beyan" bölümü (satır 143-200) özeti
- Resmî kök neden raporu olmayan vakalarda neden "kesin" diye sunulmuyor. Horizons değerleri 0 km referans yüzeyine göre; arazi ve araç duruşu eklenmedi.
- Resmî ya da nihai analizi olduğu söylenen vakalar: Peregrine (Astrobotic kurulu, Ağu 2024), Hakuto-R M1 ve Resilience (ispace), Luna-25 (Roscosmos, "en olası neden" dili korunacak).
- Resmî raporu olmayanlar:
  - Chandrayaan-2: FAC raporu yayımlanmadı; yalnızca 2019 Lok Sabha yanıtı ve Somanath 2023 açıklamaları var.
  - IM-1 ve IM-2: bağımsız rapor yok; IM bülteni iniş anomalisinin nedenini söylemiyor.
  - SLIM: JAXA belgesi ön bulgu; nozul kopması varsayım.
  - Beresheet: yalnızca ön bulgu.
- Hesaplanmayanlar: krater gölgesi, watt cinsinden güç, istasyon bazlı DTE süresi, Athena'nın gerçek duruş açıları.
- Uyarılar:
  - SLIM yaklaşık koordinatla sorgulandı; ~0,1° hata Güneş açısını ~0,1° etkiler.
  - IM-1 iniş saati (23:23 UTC) birincil kaynaktan doğrulanmadı.
- Erişilemeyen ya da doğrulanmayanlar:
  - ispace M2 teknik sunum PDF'i açılamadı.
  - P2 vakaları (Surveyor, Luna, Lunokhod) doğrulanmadı.
  - Kutup aydınlanma tablosu (5.2) v1'den aktarıldı, makaleler yeniden açılmadı.
  - v1'deki 2026 durum notları (Chang'e-7, Blue Moon MK1, IM-3, Blue Ghost M2) yeniden doğrulanmadı.

## 2. İddia tablosu

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt (açılan adres + alıntı/sayı) | Not |
|---|---|---|---|---|---|---|
| 1 | Athena inişi (2025-03-06 17:30 UT, −84,7906/29,1957, 0 km): Güneş az 65,67°, el +2,47° | §4.2, §5.3, §8.1-8.2, JSON | JPL Horizons API (DE441) | doğrulandı | ssd.jpl.nasa.gov/api/horizons.api, COMMAND=10: "2025-Mar-06 17:30 65.670467 2.465431" | Yeniden hesaplandı. Belgedeki sorgu şablonu birebir kullanıldı. |
| 2 | Athena anı Dünya az 335,85°, el +11,19° | §5.3, §8.2, JSON | JPL Horizons | doğrulandı | COMMAND=399: "17:30 335.846736 11.193443" | Yeniden hesaplandı. |
| 3 | Blue Ghost inişi (2025-03-02 08:34, 18,562/61,810): Güneş az 91,62°, el +3,43° | §0 tablo 7, §5.3, JSON | JPL Horizons | doğrulandı | "2025-Mar-02 08:34 91.619265 3.425058" | Yeniden hesaplandı. 3,425 sınırda; 3,43'e yuvarlanır. |
| 4 | Chandrayaan-3 (2023-08-23 12:34, −69,373/32,319): Güneş az 62,04°, el +8,61° | §5.3, JSON | JPL Horizons | doğrulandı | "2023-Aug-23 12:34 62.043651 8.614841" | Yeniden hesaplandı. |
| 5 | IM-1 (2024-02-22 23:23, −80,13/1,44): Güneş az 18,61°, el +10,47° | §4.2, §5.3, JSON | JPL Horizons | doğrulandı | "2024-Feb-22 23:23 18.611384 10.472418" | Yeniden hesaplandı. Değer, doğrulanmamış iniş saatine bağlı (bkz. 35). Elevasyon dakikada ~0,0005° değiştiği için birkaç dakikalık saat hatası sonucu etkilemez. |
| 6 | SLIM (2024-01-19 15:20, −13,3/25,2 yaklaşık): Güneş az 81,66°, el +37,16° | §5.3, §8.1, §9, JSON | JPL Horizons | doğrulandı | "2024-Jan-19 15:20 81.663749 37.163963" | Yeniden hesaplandı. Koordinat yaklaşık (bkz. 48). |
| 7 | Chang'e-4 (2019-01-03 02:26, −45,4446/177,5991): Güneş az 50,70°, el +31,51°; Dünya el −39,20° | §0 tablo 10, §1, §5.3, §6, JSON | JPL Horizons | doğrulandı | Güneş "50.702137 31.509483"; Dünya "190.324960 −39.202165" | Yeniden hesaplandı. |
| 8 | Sorgu yöntemi: DE441, "airless apparent", referans yüzeyi 0 km, coord@301 GEODETIC, SITE_COORD 'boylam,enlem,0', QUANTITIES '4,20' | §0, §5.3, §8.1 | JPL Horizons | doğrulandı | Çıktı başlığı: "Target body name: Sun (10) {source: DE441}"; "Atmos refraction: NO (AIRLESS)"; "Center radii: 1737.4" | 0 km referansı 1737,4 km yarıçaplı küredir, yerel topoğrafya değil. Belge bunu doğru beyan ediyor. |
| 9 | Athena 17:20-17:40: Güneş Δel +0,013585°, ≈2,45′/sa, ±1′ ≈ ±24 dk; Dünya +0,004623°, ≈0,83′/sa, ≈ ±72 dk | §0 tablo 12, §7 D5, §11 | Horizons verisi + ekip hesabı | doğrulandı | Güneş 2,472221 − 2,458636 = 0,013585°; Dünya 11,195745 − 11,191122 = 0,004623° | Yeniden hesaplandı: 2,445′/sa → 24,5 dk; 0,832′/sa → 72,1 dk. |
| 10 | Güneş elevasyonunun en yüksek değişim hızı ≈ 0,508°/sa × cos(enlem); Mons Mouton'da 2,77′/sa, ±1′ → ±21,7 dk; ekvatorda ~2 dk | §0 tablo 12, §7 D5 | Ekip hesabı | doğrulandı | 360°/(29,53 g × 24) = 0,508°/sa; cos(84,79°) = 0,0908 → 2,77′/sa → 21,7 dk; ekvator 1,97 dk | Yeniden hesaplandı. |
| 11 | Güneş'in yıllık üst sınırı ≈ 90° − mutlak enlem + 1,54°: 6,8 / 73,0 / 22,2 / 11,4 / 78,2 / 46,1°; Mons Mouton'da en fazla ~6,8° | §1, §4.2, §5.3, §7 D3 | Ekip hesabı | doğrulandı | Aritmetik tutuyor. Horizons, Athena sahası, 2025 (1 sa adım): en yüksek +6,731° (2025-12-02) | Yeniden hesaplandı. |
| 12 | Mare Crisium'da (Blue Ghost) Güneş sonradan 70°'nin üzerine çıkar | §1, §5.3, JSON | Horizons (ekip) | doğrulandı | Horizons, BG sahası, 2-17 Mar 2025: en yüksek +71,20° (2025-03-09 10:30) | Yeniden hesaplandı. |
| 13 | Mons Mouton'da Dünya elevasyonu kabaca (90° − mutlak enlem) ± 6,7°, yani yaklaşık −1,5° ile +11,9° arası | §6 C3 | Ekip hesabı ("yaklaşık") | kısmen doğru | Horizons, Athena sahası, 2025 (2 sa adım): en düşük −2,88° (22 Mar), en yüksek +11,34° (3 Nis) | Yeniden hesaplandı. İddianın iki sınırı var: üst sınır tutuyor, alt sınır 2025'te bile ~1,4° aşılıyor. Sınırlardan yalnızca biri tuttuğu için etiket "doğrulandı" ya da "yanlış" değil, "kısmen doğru". DTE pencerelerinde bu basit formül yerine Horizons kullanılmalı. |
| 14 | Chang'e-4 sahasında Dünya elevasyonu tüm dönem boyunca 0°'nin altında | §9, JSON | Horizons (ekip) | doğrulandı | Horizons, CE4 sahası, 2019 (6 sa adım): en yüksek −37,22°, en düşük −51,51°; sıfır geçişi yok | Yeniden hesaplandı (2019 için). |
| 15 | Blue Ghost: 346 saat gündüz operasyonu (model doğrulama vakası) | §4.2, §6, §8.1, JSON | "Firefly 2025-03-17 (v1)"; adres yok | doğrulanamadı | Adres verilmemiş | Horizons ile tutarlı: 0 km referansta gün batımı ≈ 2025-03-16 20:20 UTC, yani inişten ≈ 347,8 sa sonra. |
| 16 | Gölge: 1 m nesne +2,47°'de ~23 m, +3,43°'de ~17 m. 10 m'deki 0,5 m kenar ≈ 2,9° (Güneş'i örter). ~2 m kenar Dünya'yı (+11,19°) örter. Güneş diskinin yarıçapı ~0,27° | §8.2, §9 | Ekip hesabı | doğrulandı | 1/tan 2,47° = 23,2 m; 1/tan 3,43° = 16,7 m; atan(0,05) = 2,86°; atan(0,2) = 11,3°; Güneş açısal yarıçapı ≈ 0,269° (0,992 AU) | Yeniden hesaplandı. |
| 17 | Test sahası (−84,78°, 29,13°D), iniş noktasına ~0,37 km uzakta | §8.2, JSON | Ekip hesabı | doğrulandı | Küresel yaklaşımla R = 1737,4 km: Δenlem 0,321 km, Δboylam 0,181 km → 0,369 km | Yeniden hesaplandı. |
| 18 | SLIM'de batıya bakan dikey panel için inişte n̂·ŝ ≈ −0,79 | §8.1, §9, JSON | Ekip hesabı | doğrulandı | cos(37,16°)·cos(81,66° − 270°) = 0,797 × (−0,989) = −0,789 | Yeniden hesaplandı. Panelin az ≈ 270° olduğu belgede varsayım. |
| 19 | Yatay panelde geliş kosinüsü ≈ sin(el), el = 6° için ≈ 0,10. Shapley 2^N, N = 5 için 32 simülasyon | §6 C2, §7 | Ekip hesabı | doğrulandı | sin 6° = 0,105; 2^5 = 32 | Yeniden hesaplandı. |
| 20 | Athena planlanandan hızlı temas etti ve 20 m çaplı bir kraterin içinde yan yattı (84,7906°G, 29,1957°D). "Çap, ufuk yüksekliği değildir" | §0 tablo 1, §3, §4.2, JSON | LROC, 10 Mar 2025 | doğrulandı | lroc.im-ldi.com/images/1408: "hit the surface faster than intended and ended up on its side within a 20-meter diameter crater (84.7906° S, 29.1957° E)" | |
| 21 | LROC NAC eğik görüntüsü 7 Mart 16:54'te, inişten ~23,5 saat sonra | JSON | LROC, 10 Mar 2025 | doğrulandı | "acquired at 16:54:21 March 7, about 23.5 hours after touchdown" | |
| 22 | Athena iniş anı 6 Mar 2025 17:28 UTC | §3, JSON | LROC / IM 7 Mar 2025 | doğrulanamadı | LROC yalnızca "06 March 2025" diyor, saat yok. IM bülteni 403 | Horizons sorgusu 17:30'da yapılmış; 2 dakikanın etkisi ≈ 0,0014°, ihmal edilebilir. |
| 23 | IM-2 hedefe 250 m uzağa indi (IM resmî bülteni); 400 m ikincil kaynak | §0 tablo 14, §3, §4.2, JSON | IM, 7 Mar 2025 | doğrulanamadı | investors.intuitivemachines.com: 403 Access Denied | Açılan diğer kaynakların hiçbirinde "250 m" geçmiyor. |
| 24 | IM bülteni: Güneş yönü, panel yönü ve krater içi aşırı soğuk nedeniyle yeniden şarj beklenmiyor; görev sona erdi | §0 tablo 2, §6, §6 C4, JSON | IM, 7 Mar 2025 | doğrulanamadı | IM: 403 | Belgede başka bir iddia için gösterilen behindtheblack.com, IM'den birebir alıntı yapıyor: "With the direction of the sun, the orientation of the solar panels, and extreme cold temperatures in the crater..." |
| 25 | Athena'nın yüzey ömrü ~13 saat | §4.2, §6, JSON | IM, 7 Mar 2025 | doğrulanamadı | IM: 403 | |
| 26 | IM-2 ön bulguları: altimetrede "signal noise and distortion", uzun gölgeler ve loş ışık, LRO görüntüleri alçak irtifada krater tanımaya yetmedi | §3, §4.2, JSON | The Register, 14 May 2025 (IM kazanç çağrısı) | doğrulandı | theregister.com: "'signal noise and distortion,' which reduced the accuracy of the altimeter"; "'long shadows and dim lighting conditions'"; "imagery from LRO at a hundred kilometers" | |
| 27 | IM, IM-3 için "dissimilar and redundant altimeters" ve ışıktan bağımsız hız sensörü eklediğini açıkladı (13 May 2025) | §4.2 | IM kazanç çağrısı (The Register üzerinden) | kısmen doğru | The Register: "additional altimeters, a lighting-independent sensor to measure surface velocity" | Anlam aynı, ama tırnak içindeki "dissimilar and redundant" ifadesi kaynakta yok. Tarih kaynakta "this week" (makale 14 May). |
| 28 | Athena yan yatıkken güç düşüktü (~100 W) ve anten yönelimi bozuldu | §6, JSON |  ( ) | kaynağı yok | | |
| 29 | IM-2'nin başlangıç hedefi Shackleton connecting ridge idi, sonra Mons Mouton seçildi. NASA'nın ifadesi: "Goldilocks zone for sunlight", ~10 gün güç | §5.4, §8.2, JSON |  ( ) | kaynağı yok | | Belge resmî gerekçenin bulunamadığını kendisi yazıyor. |
| 30 | IM-2 fırlatma tarihi 2025-02-27 | JSON | "v1 (Astronomy)", adres yok | doğrulanamadı | Adres verilmemiş | |
| 31 | Nova-C'nin yüksek ağırlık merkezi bir yorumdur | §2, §4.2, JSON | behindtheblack.com (Mar 2025) | doğrulandı | "It creates a center of gravity high enough that the lander will tip over too easily"; "The company denies this" | Kaynak bir yorum yazısı; belge de "yorum" diye etiketlemiş, doğru. |
| 32 | IM-1: LRF güvenlik anahtarı açık kalmıştı ve ilgili uçuş öncesi test atlanmıştı (ön bulgu) | §2, §3, JSON | Ad Astra, Şub 2024 | doğrulandı | adastraspace.com: "a safety enabled switch... was not disabled"; "they opted to skip a pre-flight check that would have test-fired the laser range finder" | |
| 33 | IM-1: NDL için yazılım yaması yüklendi, ama NDL verisi navigasyonda kullanılamadı | §3, §4.2, JSON | NASA NTRS 20240009717 (FOP webinar) | doğrulandı | ntrs.nasa.gov ...FOP Webinar.pdf: "IM realized that the NDL data was not used"; "Neither range nor velocity data were used" | |
| 34 | IM-1 hedeften ~1,5 km saptı | §4.2 |  ( ) | kaynağı yok | | **Belgenin IM-1 için gösterdiği NTRS kaynağı başka bir sayı veriyor:** "short of their original target by ~ 2.5 km". |
| 35 | IM-1 iniş saati 22 Şub 2024 23:23 UTC | §0, §5.3, JSON |  (belge "doğrulanmadı" diyor) | kaynağı yok | | Açılan NTRS belgesinde iniş saati yok. |
| 36 | IM-1 yanal hızla ve hızlı temas etti, iniş ayağı kırıldı, ~30° eğik durdu; yüzey ömrü ~1 hafta | §3, §4.2, JSON | "IM (v1)"; ~1 hafta için  ( ) | doğrulanamadı | Adres verilmemiş | Kısmi bağımsız destek, The Register (14 May 2025): "descended too quickly and broke a leg. Odysseus tipped over". |
| 37 | IM-1 iniş koordinatı 80,13°G 1,44°D (Malapert A yakını) | §4.2, §5.3, JSON | "LROC (v1)", adres yok | doğrulanamadı | Adres verilmemiş | |
| 38 | Blue Ghost 2 Mar 2025 08:34 UTC'de (3:34 a.m. EST) Mare Crisium'da, Mons Latreille yakınına dik ve stabil indi; 10 NASA yükü taşıdı; ~1 Ay günü (~14 Dünya günü) çalışması planlandı | §0 tablo 6, §3, JSON | NASA, 2 Mar 2025 | doğrulandı | nasa.gov: "successfully landed at 3:34 a.m. EST on Sunday near a volcanic feature called Mons Latreille within Mare Crisium"; "upright and stable" | |
| 39 | Blue Ghost kamera tabanlı TRN kullandı ve iki hazard avoidance manevrası yaptı | §0 tablo 7, §1, §3, §4.2, JSON | Firefly, Spacecraft Autonomy | doğrulandı | fireflyspace.com/spacecraft-autonomy: "executed two hazard avoidance maneuvers during Blue Ghost's descent" | |
| 40 | Blue Ghost iniş koordinatı 18,562°K 61,810°D; fırlatma 2025-01-15 | §4.2, §5.3, JSON | NASA NSSDCA (id=BLUEGHOST) | doğrulanamadı | nssdc.gsfc.nasa.gov: hata sayfası "ORA-01403: no data found" | NASA bülteni sahayı yalnızca nitel olarak doğruluyor (Mare Crisium, Mons Latreille). |
| 41 | Blue Ghost: gün batımından sonra 5 saatin biraz üzerinde gece operasyonu; 2 yan + 1 üst panel, en çok 400 W; 119 GB'ın üzerinde veri | §4.2, §6, JSON | "Firefly 2025-03-17 (v1)", adres yok | doğrulanamadı | Adres verilmemiş | |
| 42 | SLIM: ~50 m irtifada (00:19:18 JST) iki ana motordan biri kaybedildi, toplam itki ~%55'e düştü | §0 tablo 3, §3, JSON | JAXA, 25 Oca 2024 (jaxa_doc01) | doğrulandı | global.jaxa.jp ...jaxa_doc01_20240125_e.pdf: "at around 00:19:18, the total thrust generated by the two main engines suddenly decreased to about 55%" | |
| 43 | Nozulun kırılıp düşmesi JAXA'nın varsayımıdır; belge ön bulgudur | §0, §3, JSON | JAXA, 25 Oca 2024 | doğrulandı | "Since one of these has a nozzle-like shape, it is assumed..."; "The cause is still being investigated" | |
| 44 | SLIM ~00:19:52 JST'de (15:19:52 UTC) yanal hızla indi; motor yukarı, paneller batıya bakıyordu; hedefin ~55 m doğusunda durdu; inişten sonra güç üretmedi | §1, §3, JSON | JAXA, 25 Oca 2024 | doğrulandı | "main engine facing upwards and the solar panels facing west"; "(about 55m to the east)"; "power was not being generated from the solar cells" | JAXA 55 m'yi "nominal alçalma konumunun doğusu" olarak veriyor. "Hedefin doğusu" ifadesi küçük bir sadeleştirme. |
| 45 | SLIM inişten sonra batarya ile ~2,5 saat çalıştı | §6 | JAXA (SLIM satırı) | doğrulandı | İniş 00:19:52 JST, "2:57 Battery disconnected from power system by command"; SOC ~%12 | Gerçek süre ≈ 2 sa 37 dk. |
| 46 | SLIM'in gücü 28 Ocak 2024'te, Güneş batıdan panelleri aydınlatınca geri geldi | §6, JSON | "SpacePolicyOnline (ikincil)", adres yok | doğrulanamadı | Adres verilmemiş | |
| 47 | SLIM üç Ay gecesini atlattı; son temas 28 Nis 2024; Mayıs-Temmuz arası temas kurulamadı; operasyon 23 Ağu 2024 22:40 JST'de sonlandırıldı | §0 tablo 4-5, §1, §6, JSON | JAXA, 26 Ağu 2024 | doğrulandı | global.jaxa.jp/press/2024/08/20240826-1_e.html: "concluded operations... at 22:40 (JST), on August 23... last contact on April 28, 2024"; "survive three lunar nights" | JAXA "not part of the original mission plan" diyor. Belgedeki "gece için tasarlanmadı" bu cümlenin yorumu. |
| 48 | SLIM sahası yaklaşık −13,3°, 25,2°D | §5.3, §8.1, JSON | "yaklaşık (v1)" | kaynağı yok | | Belge bunu kendisi beyan ediyor. |
| 49 | Gece sıcaklıkları: SLIM −133 °C (AFP), Chandrayaan-3 sahası −120 ile −200 °C (ISRO yetkilisi), Chang'e-4 ~−190 °C | §6, §6 C4, JSON |  ( ), yayın adresi yok | kaynağı yok | | |
| 50 | Chandrayaan-2 (Lok Sabha, Kas 2019): ilk alçalma fazı 30 → 7,4 km ve 1683 → 146 m/s ile nominal; kaba frenleme başarılı; ikinci fazda hız azalması tasarım değerini aştı; ince frenleme tasarım dışı koşullarda başladı; araç hedefin 500 m yakınına sert indi | §0 tablo 9, §1, §3, §4.1, §9, JSON | The Wire, 21 Kas 2019 | doğrulandı | science.thewire.in: "During the second phase of descent, the reduction in velocity was more than the designed value... Vikram hard-landed within 500 metres" | |
| 51 | Somanath (2023): motor itkisi beklenenden yüksekti, hatalar birikti, yazılımda dönüş hızı sınırı vardı, hedef alan 500 × 500 m idi. CH-3 farkları: failure-based tasarım, merkez motor kaldırıldı, ek yakıt, daha fazla panel. CH-2'de 5 motor vardı | §3, §4.1, JSON | Deccan Herald / ETV Bharat, Tem 2023; adres yok | doğrulanamadı | Adres verilmemiş | Belge tam adresin bulunması gerektiğini kendisi yazıyor. |
| 52 | Chandrayaan-2 hedefi ~70,9°G, 22,78°D | JSON | "ikincil", yayın adı yok | kaynağı yok | | |
| 53 | Chandrayaan-3 ana iniş alanı 4 km × 2,4 km (ISRO spesifikasyonu); ISRO ana hedefi 69,367621°G 32,348126°D | §0 tablo 8, §1, §4.1, JSON | ISRO, Chandrayaan-3 Details | doğrulandı | isro.gov.in ...Chandrayaan3_Details.html: "Landing Site (Prime) 4 km x 2.4 km 69.367621 S, 32.348126 E" | "4 × 2,5 km" sözlü değer bu sayfada geçmiyor. |
| 54 | CH-3'te LDV, LHVC ve LHDAC sensörleri, 4 × 800 N kısılabilir motor vardı; iniş ayağı lunar simulant test yatağında test edildi; görev süresi 1 Ay günü (~14 Dünya günü) | §4.1, §6, JSON | ISRO, Chandrayaan-3 Details | doğrulandı | "4 nos. of 800 N Throttleable engines"; "Lander Leg mechanism performance test on a lunar simulant test bed"; "One lunar day (~14 Earth days)" | |
| 55 | JSON'da ISRO adresiyle verilen bilgi: "4 × 800 N kısılabilir motor; merkez motor kaldırıldı; ek yakıt" | JSON CH3-2023 | ISRO, Chandrayaan-3 Details | kısmen doğru | ISRO sayfasında 4 × 800 N var | Sayfada "merkez motor kaldırıldı" ve "ek yakıt" ifadeleri yok. Bunlar Somanath'a ait (bkz. 51). |
| 56 | Chandrayaan-3 iniş anı 23 Ağu 2023 12:34 UTC | §3, §5.3, JSON | ISRO | doğrulanamadı | ISRO Details sayfasında iniş saati yok | Belge §11'de 12:32/12:34 çelişkisini kabul ediyor. Horizons sonucu bu iki dakikadan etkilenmez. |
| 57 | Statio Shiv Shakti koordinatı 69,373°G 32,319°D | §4.1, JSON | "IAU 2024-03-19 (v1)", adres yok | doğrulanamadı | Adres verilmemiş | ISRO ana hedefinden ~0,35 km uzakta (yeniden hesaplandı); 4 × 2,4 km'lik alanın içinde, tutarlı. |
| 58 | CH-3: 2-4 Eyl 2023'te uykuya alındı, 22 Eyl'den sonra uyandırılamadı | §6, JSON | "ISRO/AIR (v1)", adres yok | doğrulanamadı | Adres verilmemiş | Horizons ile tutarlı: 0 km referansta gün batımı ≈ 2023-09-04 16:10 UTC. |
| 59 | Chang'e-4 3 Oca 2019 02:26 UTC'de Von Kármán kraterine (177,6°D, 45,5°G) indi | §0 tablo 10, §3, JSON | CNSA, 3 Oca 2019 | doğrulandı | cnsa.gov.cn: "177.6 degrees east longitude and 45.5 degrees south latitude... 10:26 a.m. Beijing Time (0226 GMT)" | Belgedeki daha hassas koordinat (Nature Comms, v1) CNSA'nın yuvarlanmış değeriyle tutarlı. |
| 60 | Queqiao, Dünya-Ay L2 çevresinde halo yörüngede, Ay'dan ~65.000 km uzakta; hem Dünya'yı hem uzak yüzü görüyor | §1, §6 C3 | CNSA, 3 Oca 2019 | doğrulandı | "halo orbit around the second Lagrangian (L2) point... about 65,000 km from the moon, where it can see both Earth and the moon's far side" | |
| 61 | Queqiao bağlantı hızları: lander'a 125 bit/s, lander'dan 555 kbit/s'e kadar, Dünya'ya 1-10 Mbit/s. Queqiao 2018-06-14'te halo yörüngeye girdi | §6 C3, JSON | Space: Science & Technology 2021 (spj.science.org) | doğrulanamadı | spj.science.org: 403 | Hız değerleri v1'den aktarılmış. |
| 62 | Yutu-2 Mart 2024'ten beri hareketsiz olabilir; durumu belirsiz | §6 | SpaceNews, "Yutu-2 likely immobile" | doğrulandı | spacenews.com: "very little motion in the last year and apparently none at all since March 2024" | Makale Ocak 2025 tarihli; Kasım 2026 için eskimiş olabilir. |
| 63 | Yutu-2 2023'te 51. Ay gününe ulaştı; lander'da RTG + RHU, Yutu-2'de RHU var | §6, JSON |  ( ) (belge "kaynaklar çelişiyor" diyor) | kaynağı yok | SpaceNews makalesinde ikisi de yok | |
| 64 | Hakuto-R M1 (25 Nis 2023, Atlas krateri 47,581°K 44,094°D): araç irtifayı 0 sanırken ~5 km yukarıdaydı ve yakıtı bitti. Krater kenarında gelen doğru ölçüm yazılımca aykırı değer sayıldı. CDR (Şub 2021) sonrası saha değişikliği yüzünden yeni rota arazisi simülasyona girmedi | §3, §4.3, §5.4, JSON | ispace, 26 May 2023 (PDF) | doğrulanamadı | ispace-inc.com PDF: 403 | SPO ve Payload, M1'in yazılım kaynaklı irtifa tahmini hatası olduğunu doğruluyor; ayrıntıları doğrulamıyor. |
| 65 | Resilience: LRF donanım arızası; LRF geçerli ölçümü geç üretti, araç yeterince yavaşlayamadı; M1 sonrası yazılım düzeltmeleri M2'de çalıştı | §3, §4.3, JSON | ispace, 24 Haz 2025; SpacePolicyOnline; Payload | doğrulandı | spacepolicyonline.com: "hardware failure in the Laser Rangefinder"; "The software fixes they made after Mission 1 were successful". Payload: "the LRF was delayed in giving accurate measurements" | ispace adresi (?p=7671) açıldı ama yalnızca genel haber listesi geldi. Doğrulama ikincil kaynaklarla yapıldı. |
| 66 | Resilience'ın olası nedenleri: montaj yönü hatası ya da anormal duruş, veya uçuşta LRF performans düşüşü | §3, §4.3, JSON P1 | ispace, 24 Haz 2025 | kısmen doğru | Payload: "due to lower reflectivity of the surface itself, reduced performance due to degradation in-flight, or the high speeds of descent". SPO: "four possible factors" | Uçuşta performans düşüşü destekleniyor. Montaj/duruş, açılan kaynaklarda yok. Belge yüzey yansıtıcılığı ve yüksek iniş hızı faktörlerini atlamış. Birincil ispace metni okunamadı. |
| 67 | Resilience'ın telemetrisi ~192-193 m'de, 42 m/s hızla kesildi (ikincil) | §3, §11 | Payload Space (ikincil) | doğrulandı | payloadspace.com: "lost telemetry 193 m above the lunar surface while traveling at 42 m/s" | 192 m değeri açılan kaynaklarda yok. |
| 68 | Önceki tedarikçi üretimi durdurduğu için LRF Resilience'ta ilk kez uçtu (ikincil) | §4.3 | Payload Space | doğrulandı | "The LRF used on Mission 1 came from a supplier that stopped manufacturing... flying for the first time" | |
| 69 | Resilience çarpma yeri 60,44°K 4,6°B (LRO), tarih 5 Haz 2025 | §3, §4.3, JSON | SpacePolicyOnline, Haz 2025 | doğrulandı | "LRO located the Mission 2 crash site at 60.44N, 4.6W"; "June 5 EDT (June 6 in Japan)" | |
| 70 | §0: Resilience "resmî kök neden veya nihai analiz yayımlanmış vakalar" arasında | §0, §3 | ispace, 24 Haz 2025 | kısmen doğru | SPO: "They're still not sure exactly what the hardware failure was... will soon establish a third-party review team" | ispace bir teknik neden analizi yayımladı, ama analiz nihai değil; dört olası faktörde kalıyor. Kanıt rozeti "ön bulgu" olmalı. |
| 71 | Luna-25 (19 Ağu 2023): düzeltme manevrasında motor 84 s yerine 127 s çalıştı. "En olası neden": BIUS-L'deki ivmeölçer biriminin devreye alınmaması. Roscosmos açıklaması Ekim 2023 | §0, §3, JSON | SpacePolicyOnline, Eki 2023 | doğrulandı | "operated for 127 seconds instead of the planned 84 seconds"; "the most likely cause... failure to turn on the accelerometer unit in the BIUS-L device" | |
| 72 | Peregrine (Oca 2024) inişe ulaşamadı: PCV2 valfi sızdırmazlığını kaybetti, oksitleyici tankı yırtıldı. İnceleme kurulu raporu Ağu 2024 | §0, §3, JSON | SpaceNews, Ağu 2024 | doğrulandı | spacenews.com: "most likely caused when a pressure control valve (PCV) malfunctioned... into the spacecraft's oxidizer tank, rupturing it. The valve, designated PCV2" | Kurul "most likely" diyor; belge "kök neden" olarak veriyor. Kurum dili korunmalı. |
| 73 | Beresheet: IMU arızasından sonra gönderilen manuel komutun zincirleme etkisiyle ana motor kapandı | §2, §3, JSON P1 | "SpaceIL, 2019-04", adres yok | doğrulanamadı | Adres verilmemiş | |
| 74 | Apollo 11 1202 alarmı: rendezvous radar anahtarlarının konumu bilgisayarı aşırı yükledi | §3, JSON P1 | ALSJ, Apollo 11 Program Alarms | doğrulandı | nasa.gov ...a11.1201-pa.html: "repeated jobs to process rendezvous radar data... were scheduled because a misconfiguration of the radar switches" | |
| 75 | Apollo 11 hedefin ~4 mil ötesine indi. Apollo 12 Surveyor 3'e ~163 m mesafede (LROC'a göre ~155 m) | §3, §11, JSON P1 | ALSJ (aynı sayfa) | doğrulanamadı | ALSJ 1201 sayfasında bu sayılar yok | |
| 76 | Apollo saha kriterleri: yakın yüz, ±5° enlem, 45°D-45°B, eğim < 2°, inişte arkadan 7-20° Güneş, serbest dönüş. 1968-02-08'de 5 aday saha. Apollo 11 yüzey süresi ~21,5 saat | §5.1, JSON | "1968 Site Selection Board", "NASA (v1)",  | kaynağı yok | | |
| 77 | Artemis III için dokuz bölge (28 Eki 2024, öncelik sırası yok): Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1 ve 2, de Gerlache Rim 2, Slater Plain. Kriterler: bilim potansiyeli, fırlatma penceresi, arazi uygunluğu, Dünya iletişimi, aydınlanma | §0 tablo 11, §1, §5.1, JSON | NASA, 28 Eki 2024 | doğrulandı | nasa.gov: "in no priority order: Peak near Cabeus B, Haworth, Malapert Massif..."; "science potential, launch window availability, terrain suitability, communication capabilities with Earth, and lighting conditions" | NASA aynı metinde dokuz bölge dışındaki alanların da incelenmeye devam edeceğini yazıyor. |
| 78 | 27 Şub 2026: NASA, Artemis III'ü 2027'de alçak Dünya yörüngesinde bir sistem/operasyon testine çevirdi; ilk iniş Artemis IV'e (2028) kaydı | §5.1, §5.4, JSON | NASA, "Adds Mission to Artemis..." (27 Şub 2026) | doğrulandı | nasa.gov: "the Artemis III mission, now in 2027, will be designed to test out systems and operational capabilities in low Earth orbit to prepare for an Artemis IV landing in 2028" | |
| 79 | 4 Kas 2026: Artemis III, Orion ile SpaceX ve Blue Origin iniş aracı test versiyonları arasında 14 günlük bir Dünya yörüngesi görevi (2027); Artemis IV 2028'de | §0 tablo 11, §1, §5.1, JSON | NASA, "Shares Plans to Accelerate Artemis" (4 Kas 2026) | doğrulandı | nasa.gov (yayım 2026-11-04): "lunar lander test vehicles from SpaceX and Blue Origin in Earth orbit... planned 14-day mission in Earth orbit"; "Artemis IV Moon landing mission in 2028" | |
| 80 | LPSC 2026 #1901 (George vd.) şunları söylüyor: <br>- 13 bölgeden 9'a daraltma Artemis III'e özgü, Artemis IV ve sonrasının saha seçimini etkilemiyor <br>- yüzey kalışı ~5,75-6,25 gün <br>- kutup aydınlanması yılda ~2-3 hafta kayıyor <br>- DTE kullanılırsa Dünya görünürlüğü yüksek bölgeler tercih ediliyor <br>- birden çok bölge zorunlu; "mission availability" analizi yapılıyor <br>- iniş elipsi içindeki eğim değişkenliği önemli | §5.1, §5.4, JSON | LPSC 2026 #1901 PDF | doğrulandı | hou.usra.edu ...1901.pdf: "does not affect site selection for Artemis IV and later missions"; "approximately 5.75 to 6.25 days"; "shifting approximately 2-3 weeks per year" | |
| 81 | Mazarico vd. 2011 (Icarus 211): 240 m LOLA DTM ile 18,6 yıllık döngü boyunca aydınlanma, PSR ve Dünya görünürlüğü haritaları | §5.2 | Mazarico vd. 2011 (bu turda açılmadı) | kısmen doğru | ntrs.nasa.gov/api/citations/20120010094 (özet): "240 m-resolution polar digital elevation models"; "several 18.6-years lunar precession cycles"; PSR alanları | Özette Dünya görünürlüğü yok. Tam metin 404 verdi. |
| 82 | Speyerer & Robinson 2013 (Icarus 222): kalıcı aydınlanan bölge adayı noktalar | §5.2 | Makale (adres yok) | doğrulanamadı | Makale açılmadı | Gläser 2018, S&R 2013'ü WAC görüntüleriyle aydınlanma bölgesi tespit eden çalışma olarak anıyor. |
| 83 | Gläser vd. 2014 (Icarus 243): connecting ridge'de 2 m yükseklikte %92,27, 10 m'de %95,65 aydınlanma; en uzun karanlık 3-5 gün; 20 m DTM | §5.2, §8.3 | Gläser vd. 2014 (açık erişim özet) | doğrulandı | elib.dlr.de/94240: "92.27% of the time at 2 m above ground and 95.65% of the time at 10 m"; "typically only 3-5 days" | §5.2'de "20 m DTM" Gläser 2018 satırında yazıyor. Gläser 2014 da 20 m/piksel DTM kullanıyor. |
| 84 | Gläser vd. 2018 (NTRS): 20 m DTM kullanıyor; 240 m DTM kutupta aydınlanmayı fazla tahmin ediyor | §5.2, §11 risk 6 | Gläser vd. 2018 (NTRS 20170007365) | doğrulandı | NTRS tam metin: "Mazarico et al. (2011) overestimates illumination compared to this study due to smoothing of the close-range topography"; "20 m/pixel" | |
| 85 | NASA IAASS 2023: Artemis bölgelerinde Güneş 7°'yi aşmıyor | §5.2 | "NASA IAASS 2023 (NTRS)", adres yok | doğrulanamadı | Adres verilmemiş | Geometriyle tutarlı: 84-90°G'de yıllık üst sınır en fazla ~7,5° (bkz. 11). |

## 3. Öneriler ve tasarım kararları (belgenin önerdikleri)
- **Açıklama araçları:** Ana araç karşı-olgusal karşılaştırma ("tek girdi değişsin, sonuç yan yana"). Buna delta şelale ve ufuk profili üzerinde Güneş/Dünya izi eşlik ediyor. Shapley yalnızca uzman modunda (N ≤ 5, önbellekli).
- **Kanıt rozeti:** Her nedensel kartta zorunlu. Araç kaynaklı nedenler "uygulama bunu modellemez" ibaresiyle ayrı kartta gösteriliyor.
- **Belirsizlik:** Sabit "±21 dk" kullanılmıyor. Her geçiş iki ufuk profiliyle (DEM alt ve üst zarf) yeniden hesaplanıyor ve saat aralığı olarak gösteriliyor. Kutup sahalarında otomatik "yüksek belirsizlik" uyarısı çıkıyor.
- **Athena demosu:** Aynı konum ve saatte iki duruş yan yana (gözlenen yan yatış ile varsayımsal dik duruş). Gerçek duruş verisi gelene kadar "senaryo" etiketi taşıyor. Krater kenar açısı ≤ 5 m DEM'den hesaplanıyor; 20 m çap ufuk yüksekliği olarak girilmiyor.
- **Görselleştirme:**
  - Sky plot: ufuk gri, Güneş sarı, Dünya mavi, karşı-olgusal iz kesikli
  - Zaman çizelgesi bantları: Güneş, Dünya, DTE
  - Konum × tarih ısı haritası
  - Kademeli açıklama: halk, eğitimci, planlamacı
- **Saha listeleri:** Görev adı ve yayım tarihi etiketi taşıyor. Dokuz bölge katmanının adı "2024 Artemis III aday çalışması".
- **Chang'e-4 tipi sahalar:** "Aktarma gerekli" bayrağı gösteriliyor. "Uzak yüz = Dünya %0" genellemesi yapılmıyor; her saha ayrı hesaplanıyor.
- **Yeni metrik önerileri:** yaklaşma rotası yükseklik profili (Hakuto-R M1 için), panel geliş açısı n̂·ŝ(t), gün batımına kalan süre, statik devrilme eşiği (araç verisi gerekiyor).
- **Kapsam dışı:** gece dayanımı ve termal model (yalnızca gün batımına kalan süre gösteriliyor).
- **Ekibin karar vermesi gereken açık sorular:**
  - Shapley MVP'ye girecek mi? (öneri: hayır)
  - Aktarma uydusu modellenecek mi, yoksa yalnızca bayrak mı gösterilecek?
  - Athena demosu için hangi DEM kullanılacak (LOLA ≤ 5 m ya da LROC NAC DTM)?
  - Belirsizlik bandının iki ufuk profili nasıl tanımlanacak?
  - P2 vakaları için ek doğrulama turu yapılacak mı?

## 4. Belge içi çelişkiler ve eskimiş bilgiler
- **IM-1 hedef sapması:** §4.2 "~1,5 km" diyor ve kaynak göstermiyor. Belgenin IM-1 için kullandığı NASA NTRS 20240009717 ise "short of their original target by ~2.5 km" diyor. İkisi çelişiyor.
- **§0'ın ilk cümlesi kataloğu yanlış anlatıyor.** Cümle "Resmî kök neden raporu olmayan hiçbir vaka bu sürümde gösterilmez" diyor, ama katalog resmî raporu olmayan Athena, SLIM, Chandrayaan-2 ve IM-1'i de gösteriyor. Kastedilen büyük olasılıkla "kesin neden olarak gösterilmez".
- **Resilience'ın sınıfı:** §0 ve §3 Resilience'ı "resmî/nihai neden analizi" grubuna koyuyor. SPO'ya göre ispace arızanın tam olarak ne olduğunu bilmiyor ve üçüncü taraf inceleme bekleniyor (satır 70).
- **Peregrine'in dili:** İnceleme kurulu "most likely" diyor. Belge "kök neden" diyerek kesinleştiriyor; Luna-25 için gösterdiği dil hassasiyetini burada göstermiyor.
- **SLIM "hedefin ~55 m doğusu":** JAXA 55 m'yi nominal alçalma konumuna göre veriyor. Küçük bir sadeleştirme.
- **Mons Mouton Dünya elevasyonu:** §6 C3'teki "−1,5° ile +11,9°" aralığı Horizons'un 2025 sonucuyla (−2,88° ile +11,34°) uyuşmuyor. Formül kaba.
- **Kaynakça atfı:** JSON'da ISRO adresiyle verilen "merkez motor kaldırıldı; ek yakıt" ISRO sayfasında yok (satır 55).
- **Belgenin kendisinin kabul ettiği çelişkili sayılar:** Chandrayaan-3 iniş saati 12:32/12:34; Apollo 12 mesafesi 163/155 m; Resilience 192/193 m (Payload 193 m diyor); Yutu-2 için RHU/RTG.
- **Ufak tutarsızlıklar:**
  - Athena Horizons sorgusu 17:30'da yapılmış, katalog iniş saati 17:28. Fark ihmal edilebilir.
  - §5.2'de "20 m DTM" yalnızca Gläser 2018 satırında, ama Gläser 2014 da 20 m DTM kullanıyor.
- **Kırık ya da eskimiş kaynaklar:**
  - NSSDCA "id=BLUEGHOST" adresi hata sayfası veriyor (geçersiz kimlik).
  - ispace "?p=7671" adresi genel haber listesine düşüyor.
  - Yutu-2 durumu Ocak 2025 tarihli bir SpaceNews makalesine dayanıyor; Kasım 2026 için eskimiş olabilir.
  - v1'deki 2026 durum notları yeniden doğrulanmamış (belge kendisi söylüyor).
- **Doğrulanan güncel bilgiler:** Artemis bilgileri güncel. 27 Şub 2026 ve 4 Kas 2026 NASA bültenleri belgedeki ifadeleri birebir destekliyor.

## 5. Etiket sayıları
| Etiket | Adet |
|---|---|
| doğrulandı | 49 |
| kısmen doğru | 6 |
| yanlış | 0 |
| kaynağı yok | 9 |
| doğrulanamadı | 21 |
| **Toplam** | **85** |

## 6. Açılamayan kaynaklar
| Adres | Hata |
|---|---|
| https://investors.intuitivemachines.com/news-releases/news-release-details/intuitive-machines-executes-southernmost-lunar-landing-and | HTTP 403 (Akamai "Access Denied"). İkinci deneme oturumun izin sistemi tarafından engellendi. |
| https://ispace-inc.com/wp-content/uploads/2023/05/EN_ispace_release_20230506_Final-Results.pdf | HTTP 403. İkinci deneme izin sistemi tarafından engellendi. |
| https://spj.science.org/doi/10.34133/2021/3471608 | HTTP 403. İkinci deneme izin sistemi tarafından engellendi. |
| https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=BLUEGHOST | HTTP 200, ama içerik hata sayfası: "SQL Exception: ORA-01403: no data found". |
| https://ispace-inc.com/news/?p=7671 | HTTP 200, ama yalnızca genel haber listesi geldi; M2 teknik neden metni bulunamadı. |
| https://ntrs.nasa.gov/api/citations/20120010094/downloads/20120010094.txt (Mazarico 2011 tam metin) | HTTP 404. Yalnızca NTRS özeti kullanıldı. |
| https://ui.adsabs.harvard.edu/abs/2014Icar..243...78G/abstract (Gläser 2014) | HTTP 405. Yerine DLR elib özeti (elib.dlr.de/94240) açıldı. |
| Adres verilmeyen kaynaklar: Deccan Herald / ETV Bharat (Somanath, Tem 2023), SpaceIL 2019-04, AFP (SLIM sıcaklığı), IAU 2024-03-19, Astronomy (IM-2 fırlatma), Nature Communications 2019 (CE4 koordinatı), Firefly 2025-03-17, SpacePolicyOnline (SLIM 28 Oca), NASA IAASS 2023, Speyerer & Robinson 2013 | Adres yok; açılmadı. |
