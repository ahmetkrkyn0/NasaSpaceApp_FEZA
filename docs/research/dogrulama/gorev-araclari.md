# Doğrulama: Görev araçları, 3B modeller ve fiziksel özellikler

Bu dosya [ANALIZ-OZETI.md](../ANALIZ-OZETI.md) belgesinin ekidir. Araştırma notundaki her kontrol edilebilir iddia, notun gösterdiği kaynak açılarak karşılaştırıldı.

- **Doğrulama tarihi:** 14 Kasım 2026
- **İncelenen dosyalar:** [arac-3b-model-lisans-fizik-veri-seti-arastirma.pdf](../mission-vehicles-models-physics/arac-3b-model-lisans-fizik-veri-seti-arastirma.pdf), [arac-model-lisans-fizik-veri-seti-sunumu.pptx](../mission-vehicles-models-physics/arac-model-lisans-fizik-veri-seti-sunumu.pptx)
- **Not:** Kanıt sütunundaki alıntılar kaynaktaki haliyle bırakıldı. Sayılar ve birimler kaynakla aynı yazıldı.

| Etiket | Adet |
|---|---:|
| doğrulandı | 86 |
| kısmen doğru | 8 |
| yanlış | 4 |
| kaynağı yok | 7 |
| doğrulanamadı | 8 |
| **Toplam** | **113** |

Doğrulanan dosyalar:
- `docs/research/mission-vehicles-models-physics/arac-3b-model-lisans-fizik-veri-seti-arastirma.pdf` (metin: `docs/research/mission-vehicles-models-physics/arac-3b-model-lisans-fizik-veri-seti-arastirma.pdf`)
- `docs/research/mission-vehicles-models-physics/arac-model-lisans-fizik-veri-seti-sunumu.pptx` (ekip sunumu)

Yöntem: PDF'teki gömülü bağlantılar (174 adet, 82 tekil adres) çıkarıldı ve her biri bu oturumda (14 Kasım 2026) indirildi. İndirilenler: yerel kopya (`urlmap.tsv` numara-adres eşlemesi, `fNN.txt` metinler). Aritmetik, birim dönüşümü ve trigonometri iddiaları Python ile yeniden hesaplandı.

## 1. Belge özeti

- Belge, Lunar Landing Site Navigator için Ay araçlarının envanterini (Apollo LM, LRV, IM-1/IM-2, Blue Ghost, VIPER, HLS, Blue Moon, Griffin-1, Chang'e 7, LUPEX, Argonaut vb.) ve Kasım 2026 takvim durumlarını veriyor.
- Fiziksel ölçü ve kütleleri yalnızca Apollo LM ve LRV için birincil kaynaklarla (NSSDCA, Grumman LM News Reference, TN D-6850, NTRS) "tam doğrulanmış" sayıyor; diğer araçları büyük ölçüde boş (/) bırakıyor.
- IM-2 Athena devrilmesini test sahası (Mons Mouton) için gerçek örnek olarak işliyor: iniş noktası, sapma, yüzey süresi, CEO'nun kök neden açıklaması.
- 3B model ve lisans: NASA 3D Resources LM GLB ve Smithsonian CC0 içerikleri "güvenli", ticari platform modelleri "lisans okunana kadar kullanılamaz"; yedek plan resmi boyutlardan primitif model.
- Format/motor hattı: Unity + glTFast ya da Unreal + Interchange; koordinat dönüşümleri, fizik ayarları, ölçek doğrulama prosedürü ve betikleri (motor içinde çalıştırılmamış).
- Modüllere uygulama: LM ve LRV için statik devrilme ve tekerlek yükü hesapları, panel geliş kosinüsü, Dünya elevasyonu tahmini; EN/TR bilgi kartları ve JSON kayıt şeması.
- Sunum (7 slayt) raporun sayılarını tutarlı biçimde özetliyor; ayrı bir sayı veya kaynak eklemiyor.

## 2. İddia tablosu

Kısaltmalar: NSSDCA-LM11 = nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C; NSSDCA-LM15 = ...?id=1971-063C; NSSDCA-LRV = nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html; Grumman = apollojournals.org/alsj/LM04_Lunar_Module_ppLV1-17.pdf; TND6850 = apollojournals.org/alsj//tnD6850LMLandingGearSubsytem.pdf; AAS-26-167 = ntrs.nasa.gov/api/citations/20260001760/downloads/Apollo%2011%20LM%20Touchdown%20Dynamics%20VnV%20HLS.pdf; NTRS-Mob = ntrs.nasa.gov/api/citations/20250003470/downloads/Mobility%20Test%20Best%20Practices...pdf; N25-025 = nasa.gov/news-release/nasa-receives-some-data-before-intuitive-machines-ends-lunar-mission/; NASA-VIPER = nasa.gov/news-release/nasa-selects-blue-origin-to-deliver-viper-rover-to-moons-south-pole/; SFN-LTV = spaceflightnow.com/2026/06/26/next-gen-astronaut-moon-rovers-aim-for-deployment-ahead-of-artemis-4-crew-arrival/; NASA-MG = nasa.gov/nasa-brand-center/images-and-media.

### 2.1 Takvim ve görev durumu

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt | Not |
|---|---|---|---|---|---|---|
| 1 | VIPER, Blue Origin CLPS görev emriyle 2027 sonunda ikinci bir Blue Moon MK1 ile inecek | TL;DR, §1.4, §2.1 | NASA bülteni 19 Eyl 2025 | doğrulandı | NASA-VIPER (RELEASE 25-064, Sep 19, 2025): "Blue Origin will deliver VIPER to the lunar surface in late 2027, using a second Blue Moon MK1 lander" | Bilgi Eylül 2025 tarihli. Seçenek MK1'in ilk uçuşuna bağlı, o uçuş 2027 başına kaydı (No 12); "Kasım 2026 durumu " demek iyimser. |
| 2 | Seçenek "after the execution and review of the base task and of Blue Origin's first flight"; bilim penceresi "requires a landing by late 2027"; 100 günlük görev | §2.1, §2.2 | NASA bülteni 19 Eyl 2025 | doğrulandı | NASA-VIPER: "decision to exercise that option after the execution and review of the base task and of Blue Origin's first flight"; "100-day mission that requires a landing by late 2027" | |
| 3 | CS-7 görev emri, "total potential value of $190 million" (GeekWire aktarımı) | §2.1, VIPER kartı | GeekWire (bağlantı yok) | doğrulandı | NASA-VIPER: "The CLPS task order has a total potential value of $190 million"; "The task order, called CS-7" | GeekWire açılmadı; değer doğrudan NASA bülteninde var. |
| 4 | VIPER hedef bölgesi Mons Mouton | §2.1 | Wikipedia VIPER | doğrulandı | en.wikipedia.org/wiki/VIPER_(rover): "Landing site Mons Mouton" | Aynı bilgi kutusu "Dry mass 430 kg (950 lb)" veriyor; belge VIPER kütlesini  bırakmış. |
| 5 | VIPER 2024'te tamamen üretilmişken iptal edildi, 2025'te canlandırıldı | VIPER kartı | yahoo | doğrulandı | currently.att.yahoo.com/att/viper-lives-...: "in July 2024, NASA announced it was canceling the over-budget mission, even though the car-sized rover was already fully assembled" | |
| 6 | VIPER güneş enerjili, 100 günlük görev | §2.2, §6.4 | spaceupclose | doğrulandı | spaceupclose.com/2025/10/...: "The solar powered rover is planned for a 100-day mission" | "Batarya" kaynakta geçmiyor. |
| 7 | LTV: 26 May 2026'da Astrolab CLV-1 ("FLEX rover architecture" temelli) ve Lunar Outpost Pegasus seçildi; hedef "reach the Moon by 2028" | TL;DR, §1.4, §2.1 | Astrolab ve Lunar Outpost bültenleri; SFN-LTV | doğrulandı | astrolab.space (May 26, 2026): "Astrolab adapted its FLEX rover architecture... CLV-1"; "will reach the Moon by 2028"; SFN-LTV: "Astrolab's Crewed Lunar Vehicle... Lunar Outpost's Pegasus" | GlobeNewswire (Lunar Outpost) 403. |
| 8 | Seçim "High Achievability Mission" görev emirleri için | §2.1 | Astrolab / Lunar Outpost bültenleri | doğrulanamadı | Astrolab bülteni ve SFN-LTV metninde bu ifade yok | GlobeNewswire 403 (2 deneme). |
| 9 | Moon RACER seçilmedi; fırlatma ve iniş Blue Origin ile | §2.1 | SFN-LTV | doğrulandı | SFN-LTV: yarışan üç şirket "(Astrolab, Intuitive Machines, and Lunar Outpost)"; NASA "selected Blue Origin to do both... Blue Moon Mark 1" | "Moon Racer" adı SFN 14 May 2025 makalesinde geçiyor. |
| 10 | Blue Moon MK1: Moon Base-1, hedef Shackleton Connecting Ridge, JSC Chamber A'da termal vakum testini tamamladı | §2.1 | NASASpaceflight (Haz 2026); heymato | doğrulandı | nasaspaceflight.com/2026/06/blue-moon-mto-update/: "Endurance... recently completed environmental testing in Thermal Vacuum Chamber A"; "to the Shackleton Connecting Ridge" | Belge "termal 'Endurance' vakum testi" yazıyor; Endurance landerın adı, test adı değil. |
| 11 | Mayıs 2026'da bir New Glenn statik ateşleme sırasında kaybedildi | §2.1 | NSF; heymato | doğrulandı | NSF: "loss of New Glenn during hotfire testing at Launch Complex 36 in late May"; heymato: "May 28 New Glenn explosion during a hotfire test" | |
| 12 | Blue Moon MK1 fırlatması en erken 2027 başı | TL;DR, §2.1 | NSF; CRS; Wikipedia; heymato | doğrulandı | heymato: "launch is now reported as no earlier than early 2027"; SFN-LTV: Limp, MK1 "would instead fly in early 2027" | Kaynak gösterilen NSF makalesi daha eski bir ifadeyle "potential launch before the end of 2026" diyor. |
| 13 | MK1 fırlatma kütlesi 21,350 kg | §2.1 | NSF | doğrulandı | NSF: "Its launch mass is 21,350 kg" | NSF ayrıca "stands 8.05 m tall, can carry 3,000 kg" diyor; belge MK1 geometrisini  bırakmış. |
| 14 | Artemis III 2027'de LEO'da HLS kenetlenme testine dönüştü (Şubat 2026); ilk iniş Artemis IV ile 2028 başı | TL;DR, §1.4, HLS kartı | CRS IF11643; teslarati; spacepolicyonline | doğrulandı | spacepolicyonline (Feb 27, 2026): "makes Artemis III an earth-orbiting mission... Launching next year"; "Artemis IV and Artemis V, would be in early 2028"; teslarati: "remain in low Earth orbit... docking test" | CRS sayfası açılamadı; iki ikincil kaynak iddiayı taşıyor. |
| 15 | CRS alıntısı: Artemis III "2027 ortasında" "will demonstrate one or both HLSs in low Earth orbit"; iniş "by 2028" | §2.1 | CRS IF11643 (25 Haz 2026) | doğrulanamadı | congress.gov/crs-product/IF11643: HTTP 403 (2 deneme) | Öz spacepolicyonline ile uyumlu ("rendezvous with one or both of the HLS systems"); "ortası" ifadesi açılan kaynaklarda yok. |
| 16 | NASA OIG IG-26-004 (Mart 2026): iki HLS sağlayıcısında gecikme ve teknik zorluk | §2.1 | NASA OIG (adres yok) | doğrulanamadı | Belgede adres yok; denenen OIG denetim sayfası 404 | |
| 17 | NTRS 20260008717 (IAC 2026) HLS bildirisi Artemis takvimini destekliyor | §2.1 | NTRS 20260008717 | kısmen doğru | ntrs.nasa.gov/api/citations/20260008717: başlık "...Demonstrating the Capability to Land Artemis Astronauts on the Moon by 2028"; toplantı "IAC 2026" | Özet yalnızca 2028 inişini destekliyor; Artemis III'ün LEO testi özette yok. |
| 18 | HLS Starship Ay'a gitmeden yörüngede yakıt ikmali gerektiriyor | HLS kartı | spacepolicyonline; teslarati | doğrulandı | spacepolicyonline: "In-space cryogenic refueling is needed for Starship HLS to go to the Moon" | |
| 19 | IM-3 en erken 2027 başı; Reiner Gamma; Lunar Vertex ve MAPP taşıyacak | §2.1 | Wikipedia IM-3 (Moon Base yöneticisi, Eyl 2026) | doğrulandı | en.wikipedia.org/wiki/IM-3: "Launch date NET Q1 2027"; "In September 2026, NASA announced that the mission had slipped to the 'first part' of 2027"; Lunar Vertex "on a Lunar Outpost rover" | MAPP adı SFN-LTV'de: MAPP "will so again on the upcoming IM-3 mission". |
| 20 | NASA CLPS sayfası IM-3 için hâlâ "2024" diyor | §2.1 | nasa.gov CLPS IM sayfası | doğrulandı | nasa.gov/missions/artemis/clps/intuitive-machines/: "scheduled to land at the Moon's Reiner Gamma swirl in 2024"; "Expected Launch Date: 2024" | |
| 21 | IM-4: 2027, iniş yeri Mons Mouton | TL;DR, §1.5, §2.1 | NASA "CLPS Flight: Intuitive Machines IM-4" | doğrulandı | nasa.gov/event/clps-flight-intuitive-machines-im-4-2/: "Moon Base: Intuitive Machines IM-4 When 2027"; "will deliver science and technology to Mons Mouton" | |
| 22 | IM-4: 6 NASA yükü, toplam 79 kg, 116.9 M$ | §2.1 | SpaceNews 29 Ağu 2024 | kısmen doğru | spacenews.com/nasa-selects-intuitive-machines-for-south-pole-lunar-lander-mission/: "$116.9 million"; "six payloads, with a combined mass of 79 kilograms" | Altı yükün dördü NASA merkezlerinden, biri ESA, biri LASP; "6 NASA yükü" değil, "NASA görev emriyle 6 yük". |
| 23 | Griffin-1 = Moon Base II; Astrobotic "scheduled to launch in late 2026" (15 Haz 2026); Falcon Heavy | §2.1 | Astrobotic; KeepTrack (3 Kas 2026) | doğrulandı | astrobotic.com (June 15, 2026): "recently designated by NASA as Moon Base II... scheduled to launch in late 2026"; azmth: "Falcon Heavy launch targeted for late 2026 (as of Nov 2, 2026)" | KeepTrack bağlantısı görünmüyor, açılmadı. |
| 24 | Griffin-1, Wikipedia ve RocketLaunch.Live'a göre Ocak 2027 | §2.1 | Wikipedia; RocketLaunch.Live (gizli "+3" bağlantılar) | doğrulandı | en.wikipedia.org/wiki/Griffin_Mission_One: "Launch date January 2027 (planned)" | RocketLaunch.Live açılmadı. Belge tarih çelişkisini doğru işaretlemiş. |
| 25 | FLIP rover ~500 kg | §2.2 | azmth | doğrulandı | azmth.space/moon/missions/griffin-mission-one: "headlined by Astrolab's 500 kg FLIP rover" | |
| 26 | Mons Mouton'u hedefleyen iki misyon var: IM-4 (2027) ve VIPER (2027 sonu) | §1.5, sunum s.6 | Wikipedia; NASA | kısmen doğru | IM-4 ve VIPER doğru; ama belgenin FLIP için kullandığı azmth sayfası: Griffin-1 "descend autonomously to the Mons Mouton area near Nobile crater" | Takvimde en yakın Mons Mouton misyonu (Griffin-1, geç 2026 / Ocak 2027) listede yok. |
| 27 | Blue Ghost M2: uzak yüz, "Set to launch no earlier than 2027", Rashid Rover 2 | §2.1 | Firefly misyon sayfası | doğrulandı | fireflyspace.com/missions/blue-ghost-mission-2/: "Set to launch no earlier than 2027"; "a rover from the UAE Mohammed Bin Rashid Space Centre" | |
| 28 | Chang'e 7: 23 Ağu 2026 penceresi iptal ("does not meet launch conditions"), 2027'ye kaldı; hedef Shackleton kenarı | TL;DR, §2.1 | CNN (23 Ağu 2026); Scientific American (24 Ağu 2026) | doğrulandı | cnn.com/2026/08/23/...: "lunar probe does not meet launch conditions"; SciAm editör notu (8/24/26): "delayed... until 2027"; hedef "Shackleton Crater... rim" | |
| 29 | LUPEX/Chandrayaan-5: en erken 2028 (Japon mali yılı 2028), H3-24L; ISRO lander, JAXA ~350 kg rover | §2.1 | azmth (Eyl 2026); ANI (19 Kas 2025) | doğrulandı | azmth.space/moon/missions/lupex: "Japan supplies the roughly 350 kg rover and the H3-24L launch, while India builds the lander"; "Japanese fiscal year 2028" | azmth "as of Oct 2026" diyor; ANI açılmadı. |
| 30 | ESA Argonaut: ilk misyon 2030, Ariane 64; ~1500 kg yük; 6 m × Ø4.5 m; ~10,000 kg; 250 m iniş doğruluğu; PR 76-2025, 20 Kas 2025 | §2.1, §6.4 | ESA PR No. 76-2025 | doğrulandı | esa.int: "height of six metres, a diameter of 4.5 metres, and a launch mass of nearly 10 000 kg... roughly 1500 kg"; "accuracy of at least 250 metres"; "launch in 2030 onboard an Ariane 64" | Yayın tarihi "20 NOV. 2025". |
| 31 | Chandrayaan-4: 2028, örnek getirme, ikili fırlatma | §2.1 | Wikipedia | doğrulandı | en.wikipedia.org/wiki/Chandrayaan-4: "Launch date 2028 (planned)"; "optimised for a dual-launch strategy" | |

### 2.2 Envanter ve IM-2 olguları

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt | Not |
|---|---|---|---|---|---|---|
| 32 | IM-2 fırlatma 27 Şub 2025 00:16:30 UTC; iniş 6 Mar 2025 17:28:50 UTC; görev 7 Mar 06:15 UTC'de bitti | §2.2 | Wikipedia IM-2 | doğrulandı | en.wikipedia.org/wiki/IM-2: "27 February 2025, 00:16:30 UTC"; "6 March 2025, 17:28:50 UTC"; "Last contact 7 March 2025, 06:15 UTC" | NASA'nın "6:16 p.m., Feb. 26" ve "11:30 a.m." saatleri CST olarak tutarlı. |
| 33 | İniş noktası 84.7906°S 29.1957°E; "hit the surface faster than intended and ended up on its side within a 20-meter diameter crater"; Mark Robinson, 10 Mar 2025 | TL;DR, §1.2, §2.2, JSON | LROC featured image 1408 | doğrulandı | lroc.im-ldi.com/images/1408: alıntı birebir; "(84.7906° S, 29.1957° E)"; "Published by Mark Robinson on 10 March 2025" | |
| 34 | IM-2 hedef noktası −84.78°, 29.13°E | §2.2 | LROC 1401 | doğrulandı | lroc.im-ldi.com/images/1401: "intended landing site (-84.78°, 29.13°E)" | Yeniden hesaplandı: iki nokta arası ~370 m; hedef 2 ondalıkla verildiği için ±~300 m belirsiz. |
| 35 | NASA 25-025: sapma "more than 1,300 feet (400 meters)"; foto altyazısı "about 820 feet"; iniş ~11:30 CST, görev sonu 00:15 CST; 12 sa 45 dk | TL;DR, §1.2, A3, JSON | NASA Release 25-025 | doğrulandı | N25-025 (Mar 07, 2025): "more than 1,300 feet (400 meters)"; "about 820 feet"; "approximately 11:30 a.m. March 6"; "end of mission at 12:15 a.m. CST Friday" | Yeniden hesaplandı: 12 sa 45 dk; 1,300 ft = 396 m; 820 ft = 250 m. |
| 36 | IM'in kendi tahmini 250 m sapma | A3, §7 | SpaceNews (mission ends) | doğrulandı | spacenews.com/im-2-lunar-lander-mission-ends/: "estimated that the lander touched down 250 meters from its intended landing site" | |
| 37 | IM-2 yüzey süresi ~13 sa (spacepolicyonline) | §7 | spacepolicyonline | doğrulandı | spacepolicyonline.com/news/im-2-mission-ends-one-day-after-lunar-landing/: "mission was over in about 13 hours"; "12 hours and 45 minutes after landing" | |
| 38 | CEO Altemus, 13 May 2025 kazanç çağrısı: "In the final phase of descent, we saw signal noise and distortion..."; "long shadow and dim lighting"; krater tanıma ayarı | §0, §1.2, JSON | Spaceflight Now (14 May 2025); Space.com | doğrulandı | SFN (May 14, 2025): "We saw signal noise and distortion that did not allow for accurate altitude readings"; "Crater recognition tuning"; Space.com: "In the final phase of descent, we saw..." (May 13) | "In the final phase of descent" ön eki Space.com'da, SFN'de değil; kaynaklar "long shadows" (çoğul) diyor. |
| 39 | IM-2'de HDA vardı ancak altimetre verisi gürültülüydü | A3, JSON | SpaceNews (touchdown) | kısmen doğru | spacenews.com/im-2-lunar-lander-touches-down-status-unclear/: laser altimeters "noisy"; "It just remained noisy all the way until touchdown" | Makalede tehlike tespit/kaçınma (HDA) sisteminden söz yok. |
| 40 | Gövdeye sabit güneş panelleri; yan yatınca yeterli güneş alamadı | §6.4, IM-2 kartı | Space.com | kısmen doğru | space.com/astronomy/moon/heres-why-the-private-athena-lunar-lander-toppled-over-on-the-moon: "Athena's solar panels couldn't harvest enough sunlight in this orientation" | "Gövdeye sabit" bilgisi kaynakta yok. |
| 41 | Yan yatma panel yönelimini bozdu, güç kesildi | H3 | SpaceNews (mission ends) | doğrulandı | spacenews.com/im-2-lunar-lander-mission-ends/: "With the direction of the sun, the orientation of the solar panels... does not expect Athena to recharge" | |
| 42 | IM-2 fırlatma kütlesi 2,120 kg | §6.4, IM-2 kartı | Wikipedia | doğrulandı | en.wikipedia.org/wiki/IM-2: "Launch mass 2,120 kg (4,670 lb)" | |
| 43 | IM-2 verisi: NASA'ya göre 250 MB (7 Mar 2025); LROC'a göre "over 400 MBytes" | §6.4, §7 | N25-025; LROC 1408 | doğrulandı | N25-025: "collect 250 megabytes of data for NASA"; LROC: "sent back over 400 MBytes of data" | |
| 44 | NASA Nisan 2025 açıklamasına göre misyon boyunca "approximately 6.6 gigabytes" | §6.4, §7 | "im-ldi + 2" (gizli bağlantı) | doğrulanamadı | Açılan hiçbir kaynakta 6.6 GB yok; Nisan 2025 açıklamasının adresi belgede görünmüyor | |
| 45 | IM-2 "mission duration" 8 gün 5 sa (fırlatmadan son temasa) | §7 | Wikipedia | doğrulandı | en.wikipedia.org/wiki/IM-2: "Mission duration 8 days, 5 hours, 59 minutes" | |
| 46 | MAPP, Grace (µNova), Yaoki konuşlandırılamadı | §2.2 | astronomy.com | kısmen doğru | astronomy.com/space-exploration/intuitive-machines-im-2-...: MAPP "was ready to drive... but it could not be deployed" | Grace ve Yaoki bu makalede yok; Wikipedia IM-2: "the rovers and Micro-Nova were not able to be deployed". |
| 47 | IM-1: fırlatma 15 Şub 2024; iniş 22 Şub 2024 23:23:53 UTC; 80.13°S 1.44°E; ~7 gün | §2.2 | Wikipedia IM-1 | doğrulandı | en.wikipedia.org/wiki/IM-1: "February 15, 2024"; "February 22, 2024, 23:23:53 UTC"; "80.13°S 1.44°E"; son temas 29 Şub 2024 | |
| 48 | Apollo 11 LM: iniş 20 Tem 1969 20:17:40 UTC; 0.674°N 23.473°E; yüzeyde ~21.6 sa (belgede ndv) | §2.2, JSON | (NSSDCA; belge açamadığını söylüyor) | doğrulandı | NSSDCA-LM11: "landed at 20:17:40 UT... 0.67416 degrees N latitude, 23.47314 degrees E"; "after 21 hours, 36 minutes on the lunar surface" | NSSDCA bugün açıldı; ndv kaldırılabilir. Çerçeve: "DE 421 mean Earth/polar rotation axis". |
| 49 | Apollo 15 LM: iniş 30 Tem 1971, 26.13°N 3.63°E; Apollo 15–17 yüzey süresi ~67–75 sa | §2.2 | (NSSDCA; ndv); fandom | doğrulandı | NSSDCA-LM15: "30 July 1971... 26.13239 N latitude, 3.63330 E"; "after 66 hours, 55 minutes"; nasa.fandom.com: "stay times of up to 75 hours" | |
| 50 | LRV misyon başına 3 EVA | §2.2 | NSSDCA-LRV | doğrulandı | NSSDCA-LRV: "Each rover was used on three traverses, one per day" | |
| 51 | Blue Ghost M1: 2 Mar 2025 iniş, 14 gün yüzey operasyonu, 16 Mar'da tamamlandı; ilk tam başarılı ticari iniş | §2.2, BG kartı | Satnews (Firefly aktarımı) | doğrulandı | news.satnews.com/2025/05/27/...: "first fully successful commercial Moon landing on March 2 and completed 14 days of surface operations on March 16" | |
| 52 | Blue Ghost M1 fırlatma 15 Oca 2025; "ten NASA experiments to Mare Crisium" | §2.2, BG kartı | yok | kaynağı yok | — | Satnews'te Mare Crisium ve deney sayısı yok. |
| 53 | Chandrayaan-3: fırlatma 14 Tem 2023, iniş 23 Ağu 2023, ~69.37°S 32.32°E | §2.2 | yok (ndv) | kaynağı yok | — | ISRO Details sayfasında bu tarih/koordinat yok. |
| 54 | SLIM 19 Oca 2024 ters döndü; Hakuto-R M1/M2 düştü (sonuç sütunları) | §2.2 | yok | kaynağı yok | — | |
| 55 | Apollo LM'de otomatik HDA yoktu, kaçınma manevrası pilot tarafından yapıldı | A3, JSON | yok | kaynağı yok | — | |
| 56 | Blue Moon MK1 için 100 m hassas iniş bir gereksinim, gerçekleşmiş sonuç değil | A3 | heymato | doğrulandı | heymato.com/shows/landing-the-moon/...: "with a 100 m precision landing requirement (a requirement, not a result)" | |

### 2.3 3B model kaynakları ve lisanslar

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt | Not |
|---|---|---|---|---|---|---|
| 57 | NASA 3D Resources Apollo LM: GLB, 700.04 KB, 20 Mar 2025, NASA/Michael D. Carbajal | §1.6, §3, JSON, sunum s.5 | science.nasa.gov/3d-resources/apollo-lunar-module/ | doğrulandı | "Source NASA/Michael D. Carbajal"; "Apollo Lunar Module.glb Mar 20, 2025 (700.04 KB)" | Sayfa son güncelleme 9 Haz 2025. |
| 58 | data.gov NASA-307: 3DS, 25 Haz 2018; 100,628 poligon / 60,845 vertex | §3, JSON | catalog.data.gov/dataset/nasa-3d-models-apollo-lunar-module | doğrulandı | "Polygons: 100628 Vertices: 60845"; "identifier NASA-307"; "issued 2018-06-25" | Sayı 3DS dosyasına ait; JSON'da GLB modeline "poligon":100628 yazılmış, GLB için sayı yayımlanmamış. |
| 59 | Smithsonian LM-2 (A19711598000): Apollo 11 "Eagle" gibi görünecek şekilde değiştirilmiş yer test aracı | §3 | airandspace.si.edu (nasm_A19711598000) | doğrulandı | airandspace.si.edu/collection-objects/lunar-module-2-apollo/nasm_A19711598000: "used for ground testing... modified to appear like the Apollo 11 Lunar Module 'Eagle'" | |
| 60 | Smithsonian LM-2 görselleri CC0, "Kullanılabilir"; atıf "...CC0" | §1.6, §3, sunum s.5 | si.edu; airandspace.si.edu | doğrulanamadı | si.edu/object/...: 403 (2 deneme); airandspace sayfasında CC0 etiketi yok, 18 görselin 11'inde "Usage conditions may apply" | Toplu "CC0" atfı riskli; görsel bazında Open Access etiketi kontrol edilmeli. |
| 61 | Smithsonian'da yalnızca "Open Access (CC0)" etiketliler serbest; "Usage conditions may apply" etiketliler serbest değil | C3 | si | kısmen doğru | airandspace sayfası: "Usage conditions may apply" etiketi var | "Open Access (CC0)" etiketi ve kural metni açılan sayfada görülmedi. |
| 62 | 3dmodels.org "Apollo 15 Lunar Roving Vehicle": GLB/glTF/c4d/dae; 2,144,000 / 3,097,000 poligon; "Royalty Free License" (ücretli) | §3, D7 | 3dmodels.org | doğrulanamadı | 3dmodels.org/3d-models/apollo-15-lunar-roving-vehicle/: 403, bot doğrulama sayfası (2 deneme) | |
| 63 | blenderartists LRV (OldSchool3D, Eyl 2025): .blend, 4K doku; NASA görüntüleri ve LRV Handbook'tan modellenmiş (yapımcı beyanı) | §3 | blenderartists.org/t/nasa-lunar-rover-scene-file/1610886 | doğrulandı | "September 12, 2025"; "All included textures are 4K"; "references from NASA archive footage... clues from the Lunar Rover Operations Handbook" | Yapımcı: "not truly accurate in a scientific sense". |
| 64 | blenderartists LRV modelinin lisansı , "Kullanılamaz"; LRV için lisansı doğrulanmış açık model yok | §3, §12.2, JSON, sunum s.2 | blenderartists | yanlış | Aynı sayfa: "Please see included PDF document for details on the CC0 1.0 Universal (Creative Commons Zero) license" | Yapımcı CC0 beyan ediyor (dokular AmbientCG/PolyHaven). PDF ve Google Drive dosyası teyit edilirse LRV için açık model vardır. |
| 65 | NASA kılavuzu: 3B model içeriği "generally are not subject to copyright in the United States"; "computer graphical simulations and Internet Web pages"; "NASA should be acknowledged as the source" | §1.6, C1 | NASA-MG | doğrulandı | NASA-MG: üç ifade de birebir var | |
| 66 | İçerik "must not explicitly or implicitly convey NASA's endorsement" | C1 | NASA-MG | kısmen doğru | NASA-MG: "If the NASA material is to be used for commercial purposes... it must not explicitly or implicitly convey NASA's endorsement" | Cümle ticari kullanım bağlamında; genel kural: "used in a factual manner that does not imply endorsement". |
| 67 | NASA Insignia/Logotype "not in the public domain… protected by law" (14 CFR Part 1221) | §1.6, C1 | NASA-MG; eCFR | doğrulandı | NASA-MG: "The NASA Insignia, Logotype, identifiers, and imagery are not in the public domain... protected by law"; eCFR: "14 CFR Part 1221 -- The NASA Seal and Other Devices" | |
| 68 | Üçüncü taraf kredili içerik: "NASA's use does not convey any rights to others... must contact the copyright holder directly" | C1 | NASA-MG | doğrulandı | NASA-MG: aynı cümleler | |
| 69 | Kılavuz LLM çıktılarının NASA'ya atfedilmesine izin vermiyor | C1 | NASA-MG | doğrulandı | NASA-MG: "incorporated into a large language model. Therefore, attribution of the information directly to NASA is not permitted" | Sayfa bölümde "super intelligence (SI)" terimini kullanıyor. |
| 70 | Creative Commons tablosu (CC0, BY, BY-SA, BY-NC, BY-ND kullanım ve türev kuralları) | C2, G4 | yok (belge CC metinlerini getirmediğini söylüyor) | kaynağı yok | — | |
| 71 | Space Apps Judging & Awards Guide: "teams will undergo review for prohibited bilateral activity with China..." | C3, §12.4 | spaceappschallenge.org/resources/judging-awards-guide/ | doğrulandı | Depodaki kopya `docs/challenge/judging-and-awards-guide.pdf`: "In accordance with NASA's China funding restriction policy, teams will undergo review for prohibited bilateral activity with China, or a Chinese-owned entity" | İnternet adresi açılamadı (2 deneme); alıntı depodaki kılavuzdan doğrulandı. Kural Çin ya da Çin'e ait kuruluşlarla ikili faaliyeti konu alıyor; uygunluk kararı NASA'nın takdirinde. |
| 72 | Princeton, Cornell ve NASA ROSES SSS: kısıt "bilateral" faaliyetleri kapsar, "general scientific discussions" izinli | C3 | princeton + 2 | doğrulanamadı | orpa.princeton.edu/...: 403 (2 deneme); diğer iki bağlantı belgede görünmüyor | |

### 2.4 Format ve motor hattı

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt | Not |
|---|---|---|---|---|---|---|
| 73 | glTFast 6.19.0 (19 May 2026): "Increased minimum required Unity version to 6.0 LTS"; GitHub'daki son sürüm 6.20.0 | §1.7, D1 | Unity changelog 6.19; GitHub releases | doğrulandı | docs.unity3d.com/Packages/com.unity.cloud.gltfast@6.19/changelog: "[6.19.0] - 2026-05-19"; "Increased minimum required Unity version to 6.0 LTS."; github.com/atteneder/glTFast/releases: en üstte "glTFast 6.20.0" | |
| 74 | glTFast: "100% glTF 2.0 specification compliance"; editör ve runtime import; Draco/KTX; URP/HDRP/Built-in | D1 | Unity glTFast kılavuzu 6.2 ve 6.20 | doğrulandı | 6.2 kılavuzu: "100% glTF 2.0 specification compliance"; 6.20: "Runtime Import/Loading", "Editor Import", "KTX™/Basis Universal, Draco™", "Universal, High Definition and Built-In Render Pipelines" | "100%" ifadesi yalnızca eski 6.2 kılavuzunda; 6.20 kılavuzunda yok. |
| 75 | Shader graph'ler build'e dahil edilmezse "materials are fine in the Unity Editor but not in builds" | D1 | github.com/atteneder/glTFast | doğrulandı | README: "If materials are fine in the Unity Editor but not in builds, chances are some shaders (or variants) are missing." | |
| 76 | Epic: "Import Into Level works with… FBX, glTF, GLB, MaterialX" | §1.7, D2 | dev.epicgames.com/.../importing-assets-using-interchange-in-unreal-engine | yanlış | Aynı sayfa (UE 5.9 dokümanı): "Import Into Level currently only works with glTF and MaterialX file formats." | Belge başka bir doküman sürümünü görmüş olabilir; güncel sayfa FBX'i saymıyor. |
| 77 | "Ayrı bir doküman sayfası" Interchange FBX desteğini "currently Experimental" diyor (Interchange.FeatureFlags.Import.FBX) | §1.7, D2 | Epic (iki sayfa) | doğrulandı | importing-assets-using-interchange: "Support for the FBX file format is currently Experimental"; "Interchange.FeatureFlags.Import.FBX" | İfade "ayrı" sayfada değil, aynı importing sayfasında; import reference sayfasında yok. |
| 78 | 5.7'de Epic eski akış için Interchange.FeatureFlags.Import.FBX False öneriyor; FBX artık varsayılan olarak Interchange'den geçiyor | D2 | Unreal forum 5.7 Preview | doğrulandı | forums.unrealengine.com/t/.../2664714: UE_FlavienP (Dec 8, 2025): "If you want the legacy workflow just deactivate interchange, Interchange.FeatureFlags.Import.FBX False." | Güncel 5.9 dokümanı FBX'i hâlâ "Experimental" sayıyor; bkz. Bölüm 4. |
| 79 | Motor konvansiyonları (Unity +Y yukarı, sol el; Unreal +Z yukarı, 1 uu = 1 cm, sol el; glTF +Y yukarı, +Z ileri, sağ el); Unity FBX ayarları (Scale Factor, Convert Units, Bake Axis Conversion); WheelCollider ve Chaos Vehicle'ın ampirik lastik modeli kullanıp Bekker-Wong modellememesi | D1–D5 | yok | kaynağı yok | — | Belge Unity FBX dokümanını getiremediğini kendisi söylüyor. |
| 80 | FLU→Unity matrisi M_U (x_U = −y, y_U = z, z_U = x), det = −1; FLU→Unreal 100·diag(1, −1, 1) | D4 | ekip hesabı | doğrulandı | Yeniden hesaplandı: det(M_U) = −1; matris satırları belirtilen eşlemeyle aynı | Eksen konvansiyonları kaynaksız (No 79). |

### 2.5 Fiziksel özellikler

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt | Not |
|---|---|---|---|---|---|---|
| 81 | LM yüksekliği 22 ft 11 in (6.985 m), diyagonal açıklık 31 ft (9.449 m) | §1.1, §6.1, JSON | Grumman LM News Reference | doğrulandı | Grumman Quick Reference: "22 ft. 11 in. (legs extended)"; "31 ft. (diagonally across extended landing gear)" | Yeniden hesaplandı: 275 in = 6.985 m; 31 ft = 9.4488 m. |
| 82 | Footpad uçları arası 9.4 m; gövde altı zeminden 1.5 m | §1.1, §6.1, JSON | NSSDCA-LM11 | doğrulandı | NSSDCA-LM11: "distance between the ends of the footpads on opposite landing legs was 9.4 m"; "bottom of the stage 1.5 m above the surface" | |
| 83 | Footpad çapı 37 in (0.94 m); TN D-6850 "approximately 3 feet" | §1.1, §6.1, LM kartı | Grumman; TND6850 | doğrulandı | Grumman: "its diameter is 37 inches"; TND6850: "The footpad, which is approximately 3 feet in diameter" | 37 in = 0.9398 m. |
| 84 | Footpad merkezlerinin yarıçapı 167 in "tread radius" = 4.242 m | §6.1, H1 | NTRS AAS-26-167; TND6850 | doğrulandı | TND6850: "tread radius defined as the distance from the vehicle longitudinal axis to the center of the landing-gear footpad"; "167-inch-tread-radius"; AAS-26-167 Tablo 2: footprint radius 4.242 m | 167 in = 4.2418 m; 2r = 8.48 m (§7'deki pad merkezleri açıklığı). |
| 85 | Ascent stage 12 ft 4 in / 14 ft 1 in (3.759 / 4.293 m); descent stage 10 ft 7 in / 13 ft 10 in (3.226 / 4.216 m) | §6.1, JSON | Grumman | doğrulandı | Grumman Quick Reference: Ascent Height/Diameter "12 ft.4 in.", "14ft. 1 in."; Descent "10 ft. 7 in.", "13 ft. 10 in." | Dönüşümler doğru. NSSDCA ascent için "approximately 2.8 m high and 4.0 by 4.3 meters" diyor; belge "çelişkili" notunu doğru koymuş. |
| 86 | Apollo 11 LM: toplam 15,103 kg; ascent kuru/yakıt 2,445/2,376 kg; descent kuru/yakıt 2,034/8,248 kg; kuru toplam 4,479 kg | §6.1, §7, JSON, LM kartı | NSSDCA-LM11 | doğrulandı | NSSDCA-LM11: "spacecraft mass of 15103 kg"; "ascent stage was 2445 kg and it held 2376 kg"; "descent stage dry mass... 2034 kg and 8248 kg" | 2445 + 2034 = 4479 yeniden hesaplandı. |
| 87 | LM iniş kütlesi ~7,200 kg (tahmin) | §6.1, JSON | ekip hesabı | doğrulanamadı | Ekip hesabı, tekrar edilmedi (harcanan yakıt bilinmiyor) | Belgenin başka satırda kullandığı AAS-26-167 Tablo 1 nominal toplam kütleyi 7,063.5 kg veriyor. |
| 88 | Maks. dikey iniş hızı 10 ft/s (Vh = 0); 7 ft/s (Vh ≤ 4 ft/s) | §6.1, JSON | Grumman; TND6850 | doğrulandı | Grumman: "10-foot/second vertical velocity... when the horizontal velocity is zero"; "7-foot/second vertical velocity with a horizontal velocity not exceeding 4 feet/second" | 3.048 / 2.134 / 1.219 m/s doğru. |
| 89 | Maks. iniş eğimi 12° (TN D-6850, SP-2013-605) ve 6° + 0.61 m pürüz (Grumman) | §6.1, JSON | TND6850; SP-2013-605; Grumman | doğrulandı | Grumman: "6° general slope having 24-inch depressions or protuberances"; SP-2013-605: "up to an equivalent slope of 12 degrees" | 24 in = 0.6096 m. |
| 90 | §7: 6° "operasyonel hedef", 12° "tasarım zarfı"; ikisi farklı şeyler | §7, JSON ("celiskili") | TND6850 vs Grumman | yanlış | TND6850: "mean surface slope of 6° or less and an effective slope of 12° or less, including the effects of depressions or protuberances" | Aynı şartnamenin iki parçası: ortalama eğim ≤ 6°, pürüz dahil efektif eğim ≤ 12°. Çelişki yok. |
| 91 | Yatay hız şartnamesi 5 ft/s'den simülasyonla 4 ft/s'ye düşürüldü | §7 | TND6850 | doğrulandı | TND6850: "Initially... 5-ft/sec maximum horizontal velocity... subsequently reduced to a 4-ft/sec... based on updated simulation data" | |
| 92 | Sönümleme ezilebilir honeycomb; güç batarya; S-band yönlendirilebilir anten; LM ve LRV'de güneş paneli yok | §6.1, H3, JSON | Grumman; (ndv) | doğrulandı | Grumman: "crushable aluminum-honeycomb cartridge"; NSSDCA-LM11: "Power was provided by 6 silver-zinc batteries"; "steerable parabolic S-band antenna"; NSSDCA-LRV: "two 36-volt silver-zinc... batteries" | |
| 93 | LM kuru ~10,800 lb = 4,899 kg (Grumman, "approx.") ile 4,479 kg (NSSDCA) farkı | §7 | Grumman; NSSDCA | doğrulandı | Grumman: LM (dry) "10, 800 lb.(approx.)" | 10,800 lb = 4,898.8 kg. |
| 94 | LM touchdown kütlesi 4,932 kg (NTRS tablosu) ve 10,873 lb (Wikipedia); "ikisi de komuta modülüyle karışmış görünüyor" | §7 | AAS-26-167; Wikipedia Apollo 11 | doğrulandı | AAS-26-167 Tablo 1: "Total Vehicle Mass 7,063.5 / 4,932 kg" (Nominal / Apollo 11); Wikipedia: "Landing mass 10,873 lb (4,932 kg)" | İki değer birebir aynı (10,873 lb = 4,931.9 kg); çıkarım makul. Belge aynı tablodaki nominal 7,063.5 kg'ı atlamış. |
| 95 | "CG ve atalet hiçbir araç için yayımlanmış değil"; LM için CG , z_CG ≈ 3.7 ± 0.5 m tahmin | §0, §6.1, H1, JSON, sunum s.2 ve s.4 | (belge AAS-26-167'yi başka satırlarda kaynak gösteriyor) | yanlış | AAS-26-167 Tablo 1: "CG Height Above Footpad Bottom (+X) 3.62 m"; atalet (nominal) 16,492 / 17,409 / 20,800 kg·m² | LM için CG ve atalet belgenin kendi kaynağında var. 3.62 m ile θ_kenar = 39.6°, θ_diyagonal = 49.5° (yeniden hesaplandı). |
| 96 | Apollo 15 Extended LM: 16,430 kg (PDS 16,434); ascent 2,385/2,375; descent kuru 2,797 (LRV ve yüzey ekipmanı dahil) / yakıt 8,873 kg | §6.2, Extended LM kartı | NSSDCA-LM15; PDS | doğrulandı | NSSDCA-LM15: "spacecraft mass of 16430 kg"; "2385 kg and it held 2375 kg"; "descent stage dry mass (including stowed surface equipment) was 2797 kg and 8873 kg"; PDS: "16,434 kg" | NSSDCA "LRV dahil" demiyor, "stowed surface equipment" diyor. |
| 97 | Wikipedia Apollo 15 "landing mass" 5,321 kg (muhtemelen komuta modülü) | §6.2 | Wikipedia Apollo 15 | doğrulandı | en.wikipedia.org/wiki/Apollo_15: "Landing mass 5,321 kg (11,731 lb)" | |
| 98 | LRV: boş 210 kg, yük 490 kg, toplam 700 kg; uzunluk 3.1 m, dingil 2.3 m, yükseklik 1.14 m; yerden yükseklik 0.36 m (tam yüklü) | §1.1, §6.3, JSON, LRV kartı | NSSDCA-LRV | doğrulandı | NSSDCA-LRV: "mass of 210 kg... payload of an additional 490 kg"; "3.1 meters long with a wheelbase of 2.3 meters... maximum height was 1.14 meters"; "ground clearance of 36 cm" | 700 kg türetilmiş. NTRS-Mob Tablo 8: "Vehicle Mass 209 kg", "Fully Loaded Mass 725 kg". |
| 99 | LRV tekerleği Ø81.8 × 23 cm, çinko kaplı örgü çelik tel (Ø0.083 cm), temasın %50'si titanyum chevron, 64.8 cm bump stop; 0.25 hp DC motor + 80:1 harmonic drive; dönüş yarıçapı 3.1 m; çift salıncak + burulma çubuğu; 2 × 36 V Ag-Zn | §6.3, JSON | NSSDCA-LRV; daviddarling | doğrulandı | NSSDCA-LRV metninde tüm değerler var ("81.8 cm diameter, 23 cm wide"; "0.083 cm"; "50%"; "64.8 cm"; "0.25 hp"; "80:1"; "3.1 meters") | NTRS-Mob ve astronautix tekerleği 81.3 × 22.9 cm, dönüş yarıçapını 3.05 m veriyor. |
| 100 | LRV teker izi ~1.83 m (~6 ft); yalnızca ikincil kaynakta, birincilde doğrulanmadı | §0, §6.3, JSON | apollomaniacs | doğrulandı | apollomaniacs.com/apollo/lrve.htm: "width:6ft (183cm)" | Belgenin kendi kaynağı NTRS-Mob Tablo 8: "Track Width 183 cm"; "birincilde doğrulanmadı" ifadesi gereksiz. |
| 101 | LRV maks. hız 14 km/h (tasarım) / ~16 km/h (mission report aktarımı); maks. eğim 25°, menzil 92 km | §6.3, JSON | NTRS-Mob; forallmoonkind | doğrulandı | NTRS-Mob Tablo 8: "Maximum Range 92 km; Maximum Speed 14 km/h; Traversable Slope 25 deg"; forallmoonkind: "maximum velocity of about 16 kilomenters per hour" | NTRS-Mob metni ayrıca "speeds of up to 18 km/h" diyor. |
| 102 | LRV kütlesi için 455 lb = 206.4 kg ve 462 lb = 209.6 kg değerleri de var | §7 | Wikipedia + 3 | doğrulandı | en.wikipedia.org/wiki/Lunar_Roving_Vehicle: "462 pounds (210 kg)"; forallmoonkind: "455 pounds was the weight of the vehicle itself" | Dönüşümler yeniden hesaplandı. |
| 103 | LRV Operations Handbook: Boeing LS006-002-2H, 19 Nisan 1971 | §0 | (NSSDCA referans listesi) | doğrulandı | NSSDCA-LRV: "Lunar Rover Operations Handbook, Doc. LS006-002-2H, Huntsville, Alabama, 19 April 1971" | |
| 104 | Chandrayaan-3: lander 1752 kg (26 kg rover dahil), toplam 3900 kg; 738 W / 50 W; bir Ay günü (~14 gün); dikey ≤ 2 m/s, yatay ≤ 0.5 m/s, eğim ≤ 12° | §2.2, §6.4 | ISRO Chandrayaan-3 Details | doğrulandı | isro.gov.in/Chandrayaan3_Details.html: "Lander Module: 1752 kg including Rover of 26 kg"; "Total: 3900 kg"; "738W"; "Rover: 50W"; "≤ 2 m / sec"; "≤ 0.5 m / sec"; "≤ 12 deg" | |
| 105 | Blue Ghost (BGM2 bilgi kutusu): kuru 469 kg, 2 m yükseklik, 3.5 m genişlik, 400 W | §6.4 | Wikipedia Blue Ghost Mission 2 | doğrulandı | "Dry mass 469 kg"; "Height: 2 m"; "Width: 3.5 m"; "Power 400 watts" | M2 değerleri; M1 için geçerliliği varsayım (belge  koymuş). |
| 106 | Blue Moon MK2: yükseklik 16 m, kuru kütle 16,000 kg | §6.4 | Wikipedia Blue Moon | doğrulandı | en.wikipedia.org/wiki/Blue_Moon_(spacecraft): "Dry mass 16,000 kg"; "Height 16 m" | |

### 2.6 Ekip hesapları (yeniden hesaplandı)

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt | Not |
|---|---|---|---|---|---|---|
| 107 | LM statik devrilme: d = r·cos45° = 3.0 m; kenar yönünde θ = 39.0° (35.5–43.2°), diyagonalde 48.9° | H1, JSON, sunum s.4 | ekip hesabı (CG tahmini) | doğrulandı | Yeniden hesaplandı: atan(2.9995/3.7) = 39.03°; atan(3.0/4.2) = 35.53°; atan(3.0/3.2) = 43.15°; atan(4.242/3.7) = 48.90° | Aritmetik doğru; CG için No 95'e bakın. |
| 108 | LRV devrilme: yanal 56.7° / 50.7°, boyuna 62.4° / 56.9° (yarım iz 0.915 m, z_CG 0.6/0.75 m tahmin); pratik sınır 25° | H1 | ekip hesabı; astronautix | doğrulandı | Yeniden hesaplandı: 56.75°, 50.66°, 62.45°, 56.89°; astronautix: "climb and descend slopes as steep as 25 degrees" | astronautix: "Pitch and roll stability angles were at least +-45 degrees"; NTRS-Mob: "Static Stability 45 deg". |
| 109 | LRV tekerlek başına yük 85.1 N (boş) / 283.5 N (yüklü); r = 0.409 m; b = 0.23 m | H2, JSON, sunum s.4 | ekip hesabı | doğrulandı | Yeniden hesaplandı: 210 × 1.62 / 4 = 85.05 N; 700 × 1.62 / 4 = 283.5 N; 81.8 / 2 = 40.9 cm | |
| 110 | e = 0–6.5°: yatay panelde cos i = sin e = 0–0.113; Güneş'i izleyen dikey panelde cos e = 0.994–1.000 | §1.3, H3 | ekip hesabı | doğrulandı | Yeniden hesaplandı: sin 6.5° = 0.1132; cos 6.5° = 0.9936 | |
| 111 | Mons Mouton'da Güneş yüksekliği 0–6.5° | §1.3, H3 | yok | kaynağı yok | — | Basit küresel geometriyle tepe değer ≈ 90 − 84.79 + 1.54 ≈ 6.7° (Ay ekseni eğikliği 1.54° varsayımıyla, arazi hariç). |
| 112 | Mons Mouton'dan Dünya elevasyonu yaklaşık −2° ile +11° (libration ±6.7° enlem, ±7.9° boylam) | H4 | ekip hesabı (libration değerlerine kaynak yok) | doğrulandı | Yeniden hesaplandı (84.7906°S, 29.1957°E; verilen libration sınırları): −2.5° ile +11.5° | Libration genlikleri kaynaksız; arazi ufku dahil değil. |
| 113 | Birim dönüşümleri: 14 km/h = 3.89 m/s; 12 sa 45 dk = 12.75 h; 1.62 m/s² = 162 cm/s²; ft/in/lb katsayıları | §6, JSON, D5 | ekip hesabı | doğrulandı | Yeniden hesaplandı: 3.889 m/s; 12.75 h; 162 cm/s²; 1 ft = 0.3048 m, 1 in = 0.0254 m, 1 lb = 0.45359237 kg | 1.62 m/s² değerine kaynak gösterilmemiş. |

### 2.7 Sunum (pptx) tutarlılığı

Sunumdaki sayılar raporla aynı: −84,7906° / 29,1957° D, >400 m, 12 sa 45 dk, 39° (35,5–43,2°), CG 3,7 ± 0,5 m, 284 N / 85 N, atıf metni. Sunum ayrı bir iddia eklemiyor; raporun hatalarını taşıyor: s.2 ve s.4 LM CG'sini "Tahmin" sayıyor (No 95), s.2 LRV için "açık lisanslı 3B model yok" diyor (No 64), s.6 Mons Mouton demo kapsamında Griffin-1'i atlıyor (No 26), s.5 Smithsonian'ı toplu "CC0" sayıyor (No 60). s.7 kaynak listesi rapordaki bağlantılarla uyumlu.

## 3. Öneriler ve tasarım kararları (belgenin önerdikleri)

- Demo kapsamını Apollo (LM, LRV) ve Mons Mouton (IM-2, IM-4, VIPER) ile sınırlamak.
- 3B model için NASA 3D Resources LM GLB, Smithsonian CC0 görseller ve resmi boyutlardan primitif "boyut kafesi" kullanmak; ticari platform modellerini lisans okunana kadar kullanmamak; LRV için primitif model.
- Her primitif modele "Schematic representation, dimensions from [source]" notu; NASA atıf metni ve "Not endorsed by NASA" ibaresi.
- Uygulamada NASA meatball, worm ve mühür kullanmamak; üçüncü taraf kredili NASA görsellerini serbest saymamak.
- Çin misyonlarını yalnızca kamuya açık bilgiyle, varsayılan olarak kapalı opsiyonel bir katmanda tutmak; CNSA veya Çinli kuruluşlarla temas kurmamak.
- Motor seçimi: web erişimi önceliğinde Unity + glTFast, görsel sadakat önceliğinde Unreal + Nanite; GLB'yi doğrudan glTFast ile almak, FBX'e dönüştürmemek.
- Fizik: görsel mesh'i collider yapmamak; lander için footpad silindirleri + gövde convex hull; terramekaniği (Bekker-Wong) ayrı modülde hesaplayıp kuvvet olarak uygulamak; fixed timestep 0.01–0.02 s, solver ≥ 10.
- Rig hiyerarşisi: kök → gövde → tekerlek/hub, panel menteşesi → panel, anten azimut → elevasyon → çanak; LRV tekerlek pivotu hub'da.
- Bütçe: seçili araç ≤ 150k üçgen, diğerleri ≤ 50k, sahne ≤ 500k; 2K PBR (seçili araçta 4K); 60 fps.
- Ölçek doğrulama: 1 m referans küp, AABB betikleri (Unity C#, Unreal Python), ana boyutlarda ±%3, küçük parçalarda ±%5 kabul.
- Açıklanabilirlik modülünde "panel normali ile Güneş vektörü arası açı > 90° ise P = 0" kuralı; IM-2 devrilmesini eğitsel karşılaştırma olarak kullanmak.
- İletişim gimbali: azimutta 360°, elevasyonda −5° ile +20° artı gövde eğimi.
- Takvim alanlarında tarihli kaynak göstermek ve gönderimden önce yeniden doğrulamak; JSON'da her sayısal alanı değer/birim/kaynak/güven nesnesi olarak tutmak.

## 4. Belge içi çelişkiler ve eskimiş bilgiler

1. CG ve atalet: Belge "CG ve atalet hiçbir araç için yayımlanmış değil" diyor ve LM için z_CG'yi tahmin ediyor. Kendi kaynak gösterdiği AAS-26-167 (NTRS 20260001760) Tablo 1, LM için CG yüksekliğini 3.62 m ve atalet momentlerini veriyor. Belge aynı tablodan 4,932 kg'ı alıntılarken CG satırını atlamış.
2. Eğim sınırı: §7, 6° ile 12°'yi "operasyonel hedef / tasarım zarfı" diye ayırıyor. TN D-6850'de ikisi aynı şartnamenin parçaları (ortalama eğim ≤ 6°, pürüz dahil efektif eğim ≤ 12°). JSON'daki "celiskili" etiketi de gereksiz.
3. LRV teker izi: Belge değeri "yalnızca ikincil kaynakta" sayıyor, ama kaynak gösterdiği NTRS 20250003470 Tablo 8 "Track Width 183 cm" veriyor. Aynı tablo yüklü kütleyi 725 kg (belge 700 kg) ve tekerleği 81.3 × 22.9 cm (NSSDCA 81.8 × 23 cm) veriyor.
4. LRV modeli lisansı: Belge blenderartists modelini "lisans , kullanılamaz" sayıyor ve "LRV için açık model yok" kararına varıyor. Kaynak sayfa CC0 1.0 beyan ediyor. Bu, §12.2'deki "ticari mi primitif mi" kararını değiştirebilir.
5. Smithsonian CC0: LM-2 görselleri toplu olarak "CC0" diye atfediliyor. airandspace sayfasında 18 görselin 11'i "Usage conditions may apply" etiketli; CC0 etiketi görülmedi.
6. Mons Mouton misyonları: §1.5 "iki misyon" diyor. Belgenin kendi kaynağı azmth, Griffin-1'in de Mons Mouton bölgesine ineceğini söylüyor; Griffin-1 hepsinden önce (geç 2026 / Ocak 2027) uçacak.
7. Unreal Interchange: Belge FBX'in hem "Experimental" olduğunu hem de 5.7'de varsayılan olarak Interchange'den geçtiğini söylüyor. Güncel (5.9) doküman FBX'i hâlâ Experimental sayıyor ve "Import Into Level"ın yalnızca glTF ve MaterialX ile çalıştığını yazıyor; belgedeki "FBX, glTF, GLB, MaterialX" listesi bu sayfayla çelişiyor.
8. VIPER durumu: "Kasım 2026 durumu " olarak verilen "2027 sonu" Eylül 2025 bültenine dayanıyor. NASA seçeneği MK1'in ilk uçuşuna bağlı; o uçuş 28 Mayıs 2026'daki New Glenn kaybından sonra en erken 2027 başına kaydı. Tarih bugün için doğrulanmış değil, risk altında.
9. Blue Moon MK1 takvimi: Kaynak gösterilen NSF makalesi "potential launch before the end of 2026" derken heymato ve SFN "early 2027" diyor. Belge geç tarihi seçmiş (doğru), ama NSF'yi bu iddianın kaynağı olarak göstermek yanıltıcı.
10. ndv işaretleri: Belge NSSDCA'yı açamadığını söylüyor; bugün açıldı. Apollo 11 iniş saati/koordinatı ve Apollo 15 koordinatı NSSDCA ile doğrulanabiliyor; ndv kaldırılabilir.
11. Ascent stage boyutu: Grumman 12 ft 4 in yükseklik / 14 ft 1 in çap verirken NSSDCA "approximately 2.8 m high and 4.0 by 4.3 meters" diyor; belge bunu "çelişkili" diye doğru işaretlemiş. Ölçek doğrulamasında ascent boyutu kullanılmamalı.
12. JSON tutarsızlıkları: LM "poligon": 100628 GLB modeline yazılmış, oysa sayı data.gov'daki 3DS dosyasına ait. "ayak_acikligi" alanında 9.4 m (NSSDCA) ile 31 ft (Grumman, 9.449 m) karışmış.
13. IM-4: "6 NASA yükü" ifadesi eksik; altı yükün dördü NASA merkezlerinden, biri ESA, biri LASP.
14. glTFast: "100% glTF 2.0 specification compliance" ifadesi yalnızca eski 6.2 kılavuzunda var; belgenin önerdiği 6.19/6.20 sürümünün kılavuzunda yok.
15. CS-7 değeri (190 M$) GeekWire'a atfediliyor; değer NASA bülteninin kendisinde var, birincil kaynak gösterilebilir.
16. IM-2 alıntısı: "In the final phase of descent" ön eki Spaceflight Now'da değil Space.com'da; "long shadow" kaynaklarda "long shadows".
17. Bilgi kartlarında kaynaksız olgu: Blue Ghost M1 kartındaki "ten NASA experiments to Mare Crisium" için kaynak yok.

## 5. Etiket sayıları

| Etiket | Adet |
|---|---|
| doğrulandı | 85 |
| kısmen doğru | 8 |
| yanlış | 4 |
| kaynağı yok | 7 |
| doğrulanamadı | 9 |
| Toplam | 113 |

Not: "doğrulandı" sayısının 7'si (No 80, 107–110, 112, 113) yalnızca ekip hesabının bu oturumda yeniden hesaplanmasına dayanıyor; geri kalanı açılan kaynaklara dayanıyor.

## 6. Açılamayan kaynaklar

| Adres | Hata |
|---|---|
| https://www.congress.gov/crs-product/IF11643 | HTTP 403 (2 deneme) |
| https://www.globenewswire.com/news-release/2026/05/26/3301400/0/en/nasa-selects-lunar-outpost-to-deliver-next-gen-crewed-lunar-terrain-vehicle-for-artemis-astronauts-and-moon-base.html | HTTP 403 (2 deneme) |
| https://www.spaceappschallenge.org/resources/judging-awards-guide/ | Bağlantı kurulamadı, curl kodu 000 (2 deneme) |
| https://orpa.princeton.edu/resources/inappropriate-foreign-influence/nasa-guidance | HTTP 403 (2 deneme) |
| https://3dmodels.org/3d-models/apollo-15-lunar-roving-vehicle/ | HTTP 403, bot doğrulama sayfası (2 deneme) |
| https://www.si.edu/object/lunar-module-2-apollo:nasm_A19711598000 | HTTP 403 (2 deneme); collections.si.edu kaydı da 403 |
| https://apollo11space.com/nasas-apollo-11-lunar-module-basic-facts/ | Bağlantı kurulamadı, curl kodu 000 (2 deneme); yalnızca bilgi kartında kullanılmış |
| NASA OIG IG-26-004 | Belgede adres yok; denenen oig.nasa.gov denetim sayfası 404 |
| GeekWire (CS-7), KeepTrack, RocketLaunch.Live, ANI, NASA Nisan 2025 açıklaması (6.6 GB), Cornell, NASA ROSES SSS | Belgede bağlantı görünmüyor (PDF'teki "+N" etiketlerinin gizli bağlantıları); açılmadı |

Belgenin kendi "erişilemeyenler" beyanı (§0): arama bütçesi (18 sorgu) doldu; NSSDCA sayfaları açılamadı (bu oturumda açıldı); LRV ve LM Operations Handbook tam metni okunamadı; IM-2 için yazılı resmi kök neden raporu yok; Unity/Unreal içinde ölçüm yapılmadı; Sketchfab/TurboSquid/CGTrader lisansları incelenemedi; SPICE hesapları yapılmadı; CG ve atalet verilmedi (No 95'e göre LM için yayımlanmış). Bu maddeler ayrıca yeniden denenmedi; NSSDCA, belgenin bağlantılarının toplu indirilmesi sırasında açıldı.
