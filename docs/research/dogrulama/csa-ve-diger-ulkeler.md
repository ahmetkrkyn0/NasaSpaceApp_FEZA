# Doğrulama: CSA Ay programı ve diğer ülkelerden dersler

Bu dosya [ANALIZ-OZETI.md](../ANALIZ-OZETI.md) belgesinin ekidir. Araştırma notundaki her kontrol edilebilir iddia, notun gösterdiği kaynak açılarak karşılaştırıldı.

- **Doğrulama tarihi:** 14 Kasım 2026
- **İncelenen dosyalar:** [csa-moon-exploration.md](../csa-moon-exploration.md), [Dünyadan Ay Dersleri.pdf](../Dünyadan%20Ay%20Dersleri.pdf)
- **Not:** Kanıt sütunundaki alıntılar kaynaktaki haliyle bırakıldı. Sayılar ve birimler kaynakla aynı yazıldı.

| Etiket | Adet |
|---|---:|
| doğrulandı | 57 |
| kısmen doğru | 13 |
| yanlış | 0 |
| kaynağı yok | 9 |
| doğrulanamadı | 6 |
| **Toplam** | **85** |

## 1. Belge özeti

- csa-moon-exploration.md, CSA Ay keşfi portalını ve alt sayfalarını Kasım 2026 durumuyla özetliyor (Canadarm3, Gateway, LEAP, iptal edilen Kanada rover'ı, Lunar Utility Vehicle, Artemis takvimi, Apollo-Artemis tabloları).
- 2026 değişikliklerini işliyor: Gateway'in durdurulması, Canadarm3'ün yüzeye yönlendirilmesi, rover görevinin iptali, Artemis III'ün LEO testine dönüşmesi.
- CSA sitesinde eskimiş kalan 4 noktayı listeliyor (bölüm 5); hepsi kaynakla doğrulandı.
- Kanada donanımı taşıyan 5 sahaya bilgi kartı, gece hayatta kalma senaryosu, direk yüksekliği kaydırıcısı ve DTE/röle uyarısı öneriyor.
- Bölüm 8, sekiz görevden 6 özellik türetiyor; 3'ünü MVP öneriyor: çok kriterli saha puanı, panel yönüne göre güç eğrisi, gece sayacı ve uyanma zamanı.
- Ek PDF sunumu (Dünyadan Ay'a dersler, 10 sayfa) bölüm 8'in özetidir; CSA içeriği yoktur.

## 2. İddia tablosu

| No | İddia (kısa) | Belgedeki yer | Belgenin gösterdiği kaynak | Etiket | Kanıt | Not |
|---|---|---|---|---|---|---|
| 1 | Portal 8 alt sayfaya yönlendiriyor (rol, Canadarm3, Gateway, utility rover, Artemis, Apollo-Artemis, ISS sonrası, LEAP) | Özet 1, §1 | CSA hub | doğrulandı | asc-csa.gc.ca/eng/astronomy/moon-exploration/: bu sekiz başlık 'To know more' altında listeli | Hub ayrıca haber, multimedya, bilgi/konuşmacı kiti listeliyor |
| 2 | Hub 'Haber akışı Kasım 2026' | §1 tablo | CSA hub | kısmen doğru | Açılan hub'da 'What's new' en yeni kayıt 2026-07-06 | Belgenin okuma tarihi 14 Kas 2026; indirilen sürümde Kasım haberi yok |
| 3 | Sayfa 'son güncelleme' tarihleri (role 2025-06-05, Canadarm3 2026-08-06, veri sayfası 2026-07-28, Gateway 2026-07-28, LUV 2026-09-03, ilk rover 2026-04-21, Artemis 2026-10-15, Apollo 2026-01-30, ISS sonrası 2025-10-28, LEAP 2024-11-05) | §1 tablo | CSA sayfaları | doğrulandı | Her sayfada 'Date modified' alanı bu tarihlerle aynı | 10 tarihin 10'u eşleşti |
| 4 | Gateway: ISS'in ~1/6'sı, 4 kişilik ekip, 3 aya kadar kalış, 4 rol (bilim lab., test alanı, buluşma noktası, kontrol merkezi) | §2.1 | CSA Gateway | doğrulandı | 'About one-sixth of the size of the ISS'; 'crews of four astronauts... up to three months' |  |
| 5 | NASA Gateway'i 24 Mart 2026'da durdurdu | Özet 2, §2.1 | Payload | doğrulanamadı | payloadspace.com HTTP 403 (Cloudflare), 2 deneme | SpaceQ (10 Kas 2026) 'paused, as NASA put it' diyor ama tarih vermiyor. CSA Artemis sayfası 'updates announced by NASA in March 2026' diyor; 24 Mart tarihi doğrulanmadı |
| 6 | SpaceQ: durdurma 'şu an ilerlemiyor' anlamına geliyor | §2.1 | SpaceQ clps-2 | doğrulandı | 'which at the moment means it's not going forward' |  |
| 7 | Canadarm3: 8,5 m, 7 serbestlik derecesi (omuz 3, dirsek 1, bilek 3), karbon fiber, 1076 kg (tahmini), MDA Space Brampton | §2.1 | CSA veri sayfası | doğrulandı | '8.5 m'; 'Seven degrees of freedom'; '1076 kg (estimation)'; 'Brampton, Ontario' | Sayfa kütleyi yalnızca büyük kol için veriyor; belge bunu doğru belirtmiş |
| 8 | Bileşenler (büyük kol, küçük kol, takım/değiştirilebilir parça taşıyıcısı), teslim en erken 2029 | §2.1 | CSA Canadarm3 about | doğrulandı | 'Delivery date: No earlier than 2029'; 'a tool and on-orbit replaceable unit caddy' |  |
| 9 | CSA, Canadarm3 yatırımını Ay keşfinin sonraki aşamasına yönlendirecek | §2.1 | CSA Canadarm3 about | doğrulandı | 'announced its intention to repurpose Canadarm3 investments to support the next phase of lunar exploration' | SpaceQ de 'repurposing it for the lunar surface' diyor. 'Yüzey lojistiği' hedefi CSA sayfasında geçmiyor (Payload'a dayanıyor) |
| 10 | Yönlendirme Payload'da 10 Ağu 2026 tarihli; MDA'nın ~1 milyar CAD'lik sözleşmesinin kapsamı değişmedi | §2.1 | Payload | doğrulanamadı | payloadspace.com HTTP 403, 2 deneme | SpaceQ'da 1 milyar CAD'lik MDA sözleşmesi geçmiyor; SpaceQ Gateway/Canadarm3'e toplam 1,68 milyar taahhüt edildiğini yazıyor (para birimi belirtilmemiş) |
| 11 | Canadarm3 karşılığında Kanada iki astronot uçuşu kazandı; biri Artemis II | §2.1 | CSA Canadarm3 about | doğrulandı | 'two astronaut flights to the Moon. CSA astronaut Jeremy Hansen will be part of Artemis II' |  |
| 12 | LEAP: 5 yılda 159 milyon CAD; odak yapay zekâ, robotik, bilim, sağlık | §2.2 | CSA LEAP | doğrulandı | 'total budget of $159 million over five years... artificial intelligence, robotics, science and health' | Sayfa para birimini yazmıyor; CAD makul okuma |
| 13 | LEAP hedefleri ve portföy (ortak ajans katkıları, prototip uçuş modeli, görev kavramları, mikro-rover/bilim yükü, tedarik zinciri, akademik destek) | §2.2 | CSA LEAP | doğrulandı | Portföy tablosundaki 6 başlık belgedeki listeyle eşleşiyor |  |
| 14 | İlk Kanada rover'ı: güney kutbuna, su buzu arayacaktı, 50 bilim insanı | §2.3 | CSA first rover | doğrulandı | 'land on the south pole... help find water ice'; 'science team composed of 50 scientists' |  |
| 15 | LRM 2022'de onaylandı, Canadensys üretiyordu, 2029'da Firefly ile | §2.3 | SpaceQ spaceq1 | doğrulandı | 'approved in 2022 and manifested to launch with Firefly in 2029' |  |
| 16 | LRM, 2026-27 Departmental Plan'da harcama kesintisi kapsamında iptal; Canadensys açıklaması 19 Mar 2026; CSA sayfasında 'Project ended' | §2.3 | Canadensys, CSA | doğrulandı | Canadensys: 'Comprehensive Expenditure Review... terminating work on the Lunar Rover Mission... 2026-27 Departmental Plan', 19 Mar 2026; CSA: 'Status: Project ended' |  |
| 17 | Belirli iniş noktası kamuya açıklanmadığı için koordinatlı 'Kanada rover sahası' eklenemez | §2.3 | yok | kaynağı yok | - | Ekip çıkarımı; açılan kaynaklarda iniş noktası yok |
| 18 | LUV: fırlatma 2030'larda, durum 'Concept development' | §2.4 | CSA LUV | doğrulandı | 'Launch: In the 2030s'; 'Mission status: Concept development' |  |
| 19 | SpaceQ: LUV için 13 yılda 1,2 milyar CAD, teslim en erken 2033 | §2.4 | SpaceQ clps-2 | doğrulandı | '$1.2 billion over 13 years for the Lunar Utility Vehicle... due no earlier than 2033' | SpaceQ ABD tutarlarını 'US' ile işaretliyor, bunu işaretlemiyor; CAD okuması makul. Canadensys 'mid 2030s' diyor |
| 20 | LUV şartları: ~2 haftalık Ay gecesi ve -200 °C'ye dayanmak; Kanada'daki merkezden ve astronotlarca işletilmek | Özet 5, §2.4 | CSA LUV | doğrulandı | 'survive the roughly two-week-long lunar night, with temperatures as low as -200 °C'; 'operated from a Canadian operations centre on Earth and by astronauts' |  |
| 21 | LUV sözleşmeleri: Tem 2025 14,6 M (Canadensys, MDA, Mission Control, 18 ay); Ara 2025 3,2 M (ABB, BTI, Mission Control, Western, 9 ay) | §2.4 | CSA LUV | doğrulandı | '$14.6 million... Over 18 months'; '$3.2 million... Over nine months' | Para birimi sayfada yazılı değil |
| 22 | Hansen Artemis II görev uzmanı; Gibbons yedek astronot ve capcom | §2.5 | CSA Apollo-Artemis tablosu | doğrulandı | 'Jeremy Hansen, mission specialist for Artemis II, and Jenni Gibbons, official Canadian backup'; 'Role of capcom' |  |
| 23 | Jeoloji saha eğitimi Mistastin (Kamestastin) krateri ve İzlanda | §2.5 | CSA Apollo-Artemis | doğrulandı | 'Mistastin (Kamestastin) crater, Newfoundland and Labrador, as well as Iceland' |  |
| 24 | Osinski NASA Artemis Geology Team'e seçildi; Mart 2024, 300.000 CAD hibe | §2.5 | CSA Artemis | doğrulandı | 'In March 2024, the CSA awarded a grant of $300,000 to Western University... Osinski... Artemis Geology Team' |  |
| 25 | Haz 2026: 4 sözleşme, toplam 2 M CAD, 10 ay; yüzey enerjisi/regolit; +120/-200 °C, radyasyon, toz, gecikme | §2.6 | CSA 9 Haz haber | doğrulandı | '4 contracts totalling $2M... Over the next 10 months'; 'from 120 °C to -200 °C during the roughly two-week long lunar night' | Haber '120 °C' yazıyor; '+' belgenin eklemesi |
| 26 | Nis 2026: Aqualunar kazananı LunaPure, Ay suyu arıtma | §2.6 | CSA 15 Nis haber | doğrulandı | 'Canadian Strategic Missions Corporation... grand prize winner... LunaPure' |  |
| 27 | Eyl 2026: CSA uzay tarımı uluslararası girişimine katıldı | §2.6 | CSA 29 Eyl haber | doğrulandı | 'CSA, DLR and NASA have signed a joint statement of intent' |  |
| 28 | Apollo 11 Eagle iniş takımı Kanada katkısı | §2.7, §4 | CSA Apollo-Artemis | doğrulandı | 'Eagle lunar module's landing gear for Apollo 11' |  |
| 29 | IM-1 Odysseus: Canadensys 360° görüntüleme (kısmen LEAP fonlu), ILO-X, operasyonel kameralar; MDA iniş sensörleri; Apollo'dan beri Ay'da çalışan ilk Kanada teknolojisi | §2.7 | CSA/canada.ca 15 Şub 2024 | doğrulanamadı | canada.ca sayfası 2 denemede bağlantı sıfırlaması (curl 000 / exit 56) | SpaceQ yalnızca 'Canadensys Aerospace technology aboard Odysseus' diyor. Arama özeti kaynak sayılmadı |
| 30 | Blue Ghost M1 (Mar 2025): Integrity Testing Laboratory (Markham) kaplamaları, NASA toz deneyi | §2.7 | SpaceQ clps-2 | doğrulandı | 'coatings from Markham's Integrity Testing Laboratory on a NASA dust experiment aboard Firefly's Blue Ghost in March 2025' | 'Mare Crisium' SpaceQ'da yok |
| 31 | Artemis I: 16 Kas - 11 Ara 2022, mürettebatsız, Orion Ay'ın binlerce km ötesine | §3 | CSA Artemis | doğrulandı | 'launched... November 16, 2022'; 'Returning to Earth on December 11, 2022'; 'thousands of kilometres beyond the Moon' |  |
| 32 | Artemis II: 1 Nisan fırlatma; 'hybrid free return', Dünya çevresinde 2 tur, Ay'ın uzak yüzünde sapan; Earthrise | §3 | CSA Artemis | doğrulandı | 'launched on April 1, 2026'; 'hybrid free return, circling our planet twice'; 'Earthrise' |  |
| 33 | Artemis II 10 Nisan'da indi (1-10 Nis) | §3 | Space.com | doğrulandı | 'splashed down off the coast of San Diego this evening (April 10)' |  |
| 34 | 6 Nisan geçişinde 406.771 km ile insan mesafe rekoru | §3 | Space.com | doğrulandı | 'Artemis 2 broke that record during its own flyby on Monday (April 6)... 252,756 miles (406,771 km)' |  |
| 35 | Kanada, Ay çevresinde astronot uçuran ikinci ülke | Özet 4 | CSA Artemis | doğrulandı | 'made Canada the second country to have an astronaut fly around the Moon' |  |
| 36 | Artemis III 2027 hedef, alçak Dünya yörüngesi testi; Artemis IV 2028 hedef, insanlı iniş | Özet 4, §3 | CSA Artemis | doğrulandı | 'Artemis III, currently targeted for 2027, will test out systems and capabilities in low Earth orbit'; 'Artemis IV, currently targeted for 2028... land humans' |  |
| 37 | NASA Moon Base (7 Kas 2026); CLPS 2: 8 firma, 10 yıl, 10 milyar USD tavan | §3 | SpaceQ clps-2 | doğrulandı | 'Source: NASA, Nov. 7, 2026'; 'eight companies'; 'decade... combined ceiling of $US 10 billion' | Makale 10 Kas 2026 tarihli |
| 38 | PROMISE rover RTG ile, 2028 sonunda güney kutbuna gidecek; 'aydınlanmadan bağımsız' alıntısı | §3 | SpaceQ clps-2 | kısmen doğru | 'ordered a nuclear-powered rover to explore the lunar South Pole from late 2028'; 'NASA is targeting a late 2028 launch and an 18-month mission' | Kaynak 'late 2028 launch' diyor; belge 'gidecek' diyerek varışı ima ediyor. Alıntı Garcia-Galan'a ait, Haziran'da söylenmiş |
| 39 | miniCAST: yüzeyde güç ve iletişim sağlayan küçük güneş kulesi | §3 | SpaceQ clps-2 | doğrulandı | 'miniCAST, a small solar tower to power and link equipment on the surface' |  |
| 40 | İletişim uyduları 2028'de Ay çevresine | §3 | SpaceQ clps-2 | doğrulandı | 'SpaceX... will launch communications satellites on a Starship to cislunar space in 2028' |  |
| 41 | Kanada payı: Lunar Outpost Pegasus ekibinde MDA Space | §3 | SpaceQ clps-2 | doğrulandı | 'Lunar Outpost... Pegasus rover, built by a team that includes MDA Space' |  |
| 42 | NASA, Moon Base sahaları için gereken veriye ayrı çağrı yapacak | §3, §6.1 | SpaceQ clps-2 | doğrulandı | 'A separate call will seek the data it still needs about Moon Base sites' | Çağrı tarihi kaynakta yok; 'Kasım 2026'da açıkladı' ifadesi duyuru tarihi olarak doğru |
| 43 | Saturn V 110,6 m/33,8 MN/2,9 milyon kg; SLS 98 m/39,1 MN/2,6 milyon kg | §4 | CSA Apollo-Artemis | doğrulandı | '33.8 million newtons... 110.6 m... 2.9 million kg'; '39.1 million newtons... 98 m... 2.6 million kg' |  |
| 44 | Apollo CM: 3 kişi, 5,95 m³, 14 gün, yakıt hücresi; Orion: 4 kişi, 9 m³, 21 gün, ~15.000 hücreli 4 panel, 18,6 m | §4 | CSA Apollo-Artemis | doğrulandı | '5.95 m3', 'Up to 14 days'; '9 m3', 'Up to 21 days', 'nearly 15,000 solar cells... 18.6 metres' |  |
| 45 | Apollo 382 kg örnek; Ay'a giden 24 astronotun tümü Amerikalı erkek; Artemis güney kutbu, su buzu | §4 | CSA Apollo-Artemis | doğrulandı | '382 kg total'; 'All 24 astronauts who travelled to the Moon were American men'; 'South Pole, a region never visited by humans' |  |
| 46 | Apollo dönemi Kanada katkıları (izleme istasyonları, ısı kalkanı, iniş takımı, Apollo 13 basınç hesabı, Sudbury eğitimi Apollo 16-17) | §4 | CSA Apollo-Artemis | doğrulandı | Katkı tablosundaki 5 madde belgeyle aynı |  |
| 47 | CSA sayfaları 'updating its website to align with the latest Artemis program updates' notunu taşıyor | Özet 3 | CSA Gateway/Artemis/Canadarm3 veri | doğrulandı | Gateway, Artemis ve Canadarm3 veri sayfasında aynı cümle | Belge cümleyi kırpmış ('announced by NASA' kısmı yok), anlam değişmiyor |
| 48 | Eski bilgi: Gateway sayfası 'PPE ve HALO 2027'de birlikte fırlatılacak, 2028'de bilim desteği' | §5 | CSA Gateway | doğrulandı | 'PPE and HALO... will launch together in 2027'; 'support science and technology demonstrations by 2028' |  |
| 49 | Eski bilgi: Canada's role sayfası Canadensys rover'ı birkaç yıl içinde kutbu keşfedecek diyor | §5 | CSA role | doğrulandı | 'The rover will explore a polar region of the Moon in a few years only' |  |
| 50 | Eski bilgi: Apollo-Artemis sayfası 'SLS (Artemis I-III)' ve 'Artemis III Geology Team' | §5 | CSA Apollo-Artemis | doğrulandı | 'Space Launch System (Artemis I-III)'; 'NASA's Artemis III Geology Team' |  |
| 51 | Eski bilgi: Canadarm3 sayfaları Gateway görevlerini listeliyor, yönlendirme yalnızca üst nota eklenmiş | §5 | CSA Canadarm3 | doğrulandı | Veri sayfası 'inspect, maintain and repair Gateway'; about sayfasında üstte 'intention to repurpose' notu |  |
| 52 | Koordinatlar: Apollo 11 0,674 K 23,473 D; Apollo 16 8,973 G 15,500 D; Apollo 17 20,191 K 30,772 D; IM-1 ~80,13 G ~1,44 D; Blue Ghost M1 ~18,56 K ~61,81 D | §6.2 | gösterilmiyor (Quickmap'e yönlendirme) | kaynağı yok | Bağımsız (Wikipedia API koordinat alanı): A11 0.67416, 23.47314; A16 -8.97301, 15.50019; A17 20.1908, 30.7717; IM-1 -80.13, 1.44; Blue Ghost 18.56, 61.81 | Hepsi yuvarlama payı içinde eşleşiyor. IM-1 'Malapert-A' Wikipedia IM-1 sayfasında geçiyor. Etiket kuralı gereği 'kaynağı yok' |
| 53 | NASA Ekim 2024'te 9 güney kutbu bölgesi açıkladı ve liste Artemis III için hazırlandı; öncelik sırası yok | §6.2 | Space.com 9 sites | kısmen doğru | 'The nine shortlisted sites, which were released by NASA on Monday (Oct. 28)'; Artemis 3 için | Sayfa metninde 'öncelik sırası yok' ifadesi bulunamadı |
| 54 | 9 bölgenin adları: Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2, Slater Plain | §6.2 | Space.com 9 sites | doğrulanamadı | Sayfa metninde bu adlar yok (görselde olabilir) | NASA'nın Ağu 2022 duyurusu 13 bölge listeliyor (Haworth, Malapert Massif, Nobile Rim 1/2, de Gerlache Rim 2 ortak); 2024 listesi bağımsız doğrulanmadı |
| 55 | Ay ekseni ekliptiğe ~1,54° eğik; kutupta Güneş geometrik ufkun ~±1,5° çevresinde; Güneş disk yarıçapı ~0,27° | §6.3 | yok (genel bilgi) | kaynağı yok | Bağımsız: Wikipedia 'Moon': 'axial tilt with respect to the ecliptic is 1.5427°' | Disk yarıçapı için açılan kaynak yok |
| 56 | Libration ~±6,7° enlem, ~±7,9° boylam; enlem librasyonu periyodu ~27,2 gün | §6.3 | yok (genel bilgi) | kaynağı yok | Wikipedia Libration çıkarımında bu sayılar bulunamadı | Belge kendisi 'Horizons ve LOLA ile doğrulayın' diyor |
| 57 | Ay günü ~29,5 Dünya günü (sinodik ay); atmosfer yok, kırılma düzeltmesi gerekmez; uzak yüzden Dünya hiç görünmez | §6.3 | yok (genel bilgi) | kaynağı yok | Bağımsız: Wikipedia 'Moon': 'synodically every 29.5 days' | Diğer iki iddia kaynaksız. Uzak yüz iddiası CSA dışı Space.com Yutu makalesinde ('never faces the Earth') destekleniyor |
| 58 | miniCAST ve CSA enerji çalışmalarının 'panel yüksekliğinin aydınlanmayı belirgin değiştirdiğini gösterdiği' | §6.1/3 | SpaceQ, CSA haber | kısmen doğru | Kaynaklar miniCAST'ı 'small solar tower' olarak tanımlıyor; aydınlanma etkisi hakkında ölçüm/iddia yok | Ürün gerekçesi makul ama kaynağın söylediği değil, ekip çıkarımı |
| 59 | Lisans: challenge/resources.md ABD dışı sitelerin veri kullanım kurallarına uymayı istiyor | §7 | challenge/resources.md | doğrulandı | 'participants must comply with any data use parameters of that specific website' |  |
| 60 | CSA görselleri için terms sayfası; 'Credit: Canadian Space Agency' ibaresi en güvenli yol | §7 | CSA terms.asp | doğrulandı | 'permission to reproduce... non-commercial use... acknowledge the CSA as the source ('Credit: Canadian Space Agency')' | Ticari yeniden yayın için yazılı izin gerekiyor |
| 61 | Chang'e 4 (2019) uzak yüze indi, iletişim yalnızca Queqiao rölesiyle (Dünya-Ay L2 halo) | §8.1, §8.2/4 | Space.com Yutu | doğrulandı | 'relay satellite stationed in a halo orbit around the second Earth-moon Lagrange point'; 'far side... never faces the Earth' | '2018'de yerleştirme yılı kaynakta yok |
| 62 | Chandrayaan-3: kutba yakın ilk yumuşak iniş (~69° G) | §8.1 | arXiv, Live Science | doğrulandı | arXiv: PLS 69.367621 S 32.348126 E; Live Science: 'the first two human-made objects to land in the moon's south polar region' |  |
| 63 | HAKUTO-R M1: krater kenarında irtifa ~3 km sıçradı; yazılım sensörü arızalı sayıp yok saydı; kaza | §8.1, §8.2/6 | Universe Today, Space.com | kısmen doğru | Space.com: 'altitude sensor got confused by the rim of a lunar crater'; Universe Today: 'misinterpreting radar altimeter data, keeping the lander in a 5 kilometer hover' | '~3 km' kaynaklarda yok, Universe Today 5 km diyor; 'arızalı sayıp yok saydı' geçmiyor |
| 64 | SLIM Ocak 2024'te hedefin ~100 m içine indi; doğruluk 55-100 m; 100 m görev hedefi | §8.2/2 | SciAm, Register, JAXA | kısmen doğru | SciAm: 'roughly 55 metres away from its original target'; 'landing inside 100 metres of its target site' | JAXA kaynakları açılmadı; '100 m hedefti' kaynakta açık yazılı değil |
| 65 | SLIM motor sorunu yüzünden ters devrildi; paneller batıya baktı, sabah güç yoktu, Güneş batıya geçince uyandı | §8.2/2, sunum s.4 | SciAm, Register | kısmen doğru | SciAm: 'one of the probe's two engines probably losing thrust at just 50 metres'; 'upside down... solar cells pointing away from the Sun' | 'Batıya', 'sabah/öğleden sonra' ayrıntısı açılan kaynaklarda yok (sunum 'JAXA basın brifingleri' gösteriyor, açılmadı) |
| 66 | SLIM gece için tasarlanmadı, 3 Ay gecesi atlattı; Nisan 2024'ten sonra sinyal yok; JAXA 23 Ağu 2024'te kapattı | §8.2/2 | The Register | doğrulandı | 'surviving three lunar nights'; 'unable to contact the craft since April 28'; makale 26 Ağu, 'last Friday's decision' | Makale iç tutarsız: bir yerde 'surviving two of them'. 23 Ağu, 'geçen cuma'dan türetildi |
| 67 | SLIM 'görüntü eşleştirmeli hassas iniş' | §8.1 | yok | kaynağı yok | SciAm yalnızca 'pinpoint Moon landing' diyor | Yöntem adı açılan kaynaklarda yok |
| 68 | Chang'e 6: uzak yüzden ilk örnek dönüşü, Queqiao-2 rölesiyle; Queqiao 2018'de halo yörüngeye | §8.1, §8.2/4 | yok | kaynağı yok | - | Space.com Yutu makalesi yalnızca Queqiao (L2 halo) için |
| 69 | Athena (IM-2, 2025): güney kutbunda uzun gölgeler, loş ışık, altimetre gürültüsü, krater tanıma sorunu; yan yattı | §8.1, §8.2/6 | Space.com, The Register | doğrulandı | 'long shadows and dim lighting conditions'; 'signal noise and distortion'; 'compromised ability to recognize craters' |  |
| 70 | Intuitive Machines sonraki araçlara ışıktan bağımsız sensör, ek altimetre, daha geniş krater veritabanı ekliyor | §8.2/6 | Space.com, The Register | doğrulandı | 'lighting-independent sensor for surface velocity'; 'expanded onboard terrain crater database' |  |
| 71 | Resilience (ispace M2, 2025): lazer mesafe ölçer sorunu, sert iniş | §8.1, §8.2/6 | Universe Today, Space.com | doğrulandı | 'laser rangefinder experienced some sort of delays'; 'likely performed a hard landing' | Space.com: 5 Haz 2025 |
| 72 | Danuri/ShadowCam: Science Advances 18 Mar 2026; kalıcı gölgelerde yaygın yüzey buzu yok, küçük birikintiler | §8.1, §8.2/5 | EarthSky | doğrulandı | 'published in Science Advances on March 18, 2026'; 'no evidence of widespread water ice in the permanently shadowed regions' | Birikintiler 20-50 m boyutunda |
| 73 | 'Yazarlar sonucun kesin olmadığını söylüyor' | §8.2/5 | EarthSky | kısmen doğru | 'The search for more water ice on the moon will continue' | Doğrudan 'kesin değil' ifadesi yok |
| 74 | Danuri Aralık 2022'den beri Ay yörüngesinde | §8.2/5 | EarthSky | doğrulanamadı | EarthSky'de Danuri varış/fırlatma tarihi bulunamadı |  |
| 75 | Chang'e 7: Shackleton hedefi; Ağu 2026 penceresi kaçtı, 2027'ye ertelendi; fırlatma tarihi Shackleton aydınlanmasına göre seçiliyor | §8.1 | CNN | kısmen doğru | 'cannot take place during the planned window this year'; 'expected to take place next year'; 'rim of a crater at the south pole' | CNN Shackleton'ı adıyla anmıyor, gecikme nedeni olarak yüksek irtifa rüzgârları ve dar pencere diyor. Aydınlanma temelli tarih seçimi kaynakta yok |
| 76 | LUPEX / Chandrayaan-5: ISRO iniş aracı, Japon rover, H3, en erken 2028 | §8.1 | yok | kaynağı yok | - | Sunum da 'LUPEX 2028' diyor, kaynak yok |
| 77 | ESA Moonlight: ilk hizmet 2028 sonu, tam ağ 2030 | §8.1 | ESA | doğrulandı | 'initial operations by the end of 2028 and full operations by 2030' |  |
| 78 | Lunar Pathfinder 2026 sonu ile 2027 arası | §8.1 | ESA, BSGN | kısmen doğru | ESA: 'set to begin operations in 2026'; BSGN sayfasında tarih yok | '2026 sonu ile 2027 arası' aralığı kaynakta yok |
| 79 | ISRO: 60-70° G bandında 4 km x 2,4 km kayan pencere; 8 aday; Chandrayaan-2 OHRC 32 cm'den iyi stereo; DEM | §8.2/1, sunum s.3 | Swarajya, arXiv | doğrulandı | Swarajya: 'moving window technique... 4 km x 2.4 km... 60 to 70 degress south'; 'Eight out of the 20 sites'; 'pixel resolution better than 32 cm' | arXiv 2308.10712 yedek sahayı anlatıyor (4x2,4 km, OHRC 25 cm); yöntem özeti Swarajya'da |
| 80 | ISRO kriterleri: eğim, kaya boyutu, krater/kaya dağılımı, güneşli süre, Dünya görünürlüğü, gölgelenme | §8.2/1, sunum s.3 | Swarajya, arXiv | kısmen doğru | Swarajya: 'topography, slope, illumination, and hazard avoidance'; arXiv: slope ve aydınlanmaya dayalı tehlike haritası, kaya yoğunluğu | 'Dünya görünürlüğü' iki kaynakta da geçmiyor |
| 81 | Ana saha LS-2, Manzius U ile Boguslawsky M kraterleri arasında | §8.2/1 | arXiv, Swarajya | doğrulanamadı | 'LS-2', 'Manzius', 'Boguslawsky' iki kaynakta aranıp bulunamadı | arXiv makalesi yedek sahayı (Moretus yakını) anlatır |
| 82 | Chandrayaan-3 tek Ay günü (~14 gün) için tasarlandı; Eylül 2023'te uykuya alındı; 22 Eyl'de uyandırma denemesi; gece -150 °C | §8.2/3, sunum s.5 | Live Science | kısmen doğru | 'put to sleep on Sept. 2... lander followed two days later'; 'On Friday (Sept. 22), ISRO... attempts' | 'Tek Ay günü için tasarlandı' ve '-150 °C' kaynakta yok |
| 83 | Yutu-2: radyoizotop ısıtıcı, geceleri paneli kapatıp uyur, 3 aylık tasarım ömrünü kat kat aştı | §8.2/3, sunum s.5 | Space.com Yutu | kısmen doğru | 'Both spacecraft close solar arrays and are protected by radioisotope heater units'; 'design lifetime of three months' | Makale ömrün doldurulduğu anı (2019) anlatıyor; 'kat kat aştı' kaynakta yok. Belge 2026 durumunu doğrulayamadığını yazıyor |
| 84 | Gölge uzunluğu = yükseklik/tan(Güneş açısı); 2°'de 10 m kaya ~286 m gölge | §8.2/6, sunum s.8 | FEZA hesabı | doğrulandı | 10/tan(2°) = 286,36 m | Yeniden hesaplandı. Düz zemin ve Güneş merkezi için geçerli |
| 85 | Güç ∝ max(0, Güneş birim vektörü · panel normali) | §8.2/2 | FEZA tasarımı | kaynağı yok | - | Model varsayımı (öneri); yansıma ve gölgelenmeyi içermiyor |

### 2.1 PDF sunumu ile ana belge karşılaştırması

Sunum metni okunabilen yerlerde ana belgeyle tutarlı. Fark ve eksikler:

| No | Konu | Sunum | Ana belge | Durum |
|---|---|---|---|---|
| P1 | SLIM doğruluğu | s.4 '100 m hassas iniş' | 55-100 m aralığı, 100 m hedef | Sunum daha kesin; SciAm 55 m diyor. Sadeleştirme |
| P2 | Yutu-2 | s.5 '... yıllarca' | '3 aylık ömrü kat kat aştı; 2026 durumunu doğrulayamadım' | Sunum belirsizliği taşımıyor; açılan kaynakta 'yıllarca' desteği yok. İşaretlenmeli |
| P3 | Chandrayaan-3 | s.5 'tek Ay günü (~14 gün), -150 °C' | aynı | Tutarlı; Live Science'ta bu iki ayrıntı yok |
| P4 | ISRO yöntemi | s.3 4 x 2,4 km, 8 aday, 32 cm | aynı | Tutarlı, Swarajya ile doğrulandı |
| P5 | Gölge hesabı | s.8 '2 derecede ~286 m' | aynı | Tutarlı, yeniden hesaplandı (286,36 m) |
| P6 | Efor bilgisi | s.9 'Efor' sütunu yok | Efor sütunu var | Sunumda efor eksik |
| P7 | 'Hepsi açık veriyle yapılabilir: LOLA, LROC, Horizons challenge kaynaklarında' | s.9 | Ana belgede aynı cümle yok | Challenge metni LOLA ve Horizons'u anıyor; resources.md'de LROC Quickmap var. Doğru, ana belgede yok |
| P8 | Kaynaklar | s.4-8: JAXA basın brifingleri, Irish Times, SpacePolicyOnline, Wikipedia | Ana belge kaynak listesinde yok | Sunum ana belgede olmayan kaynaklara atıf yapıyor; açılamadı |
| P9 | CSA/Kanada içeriği | yok | belgenin yarısı | Sunum yalnızca bölüm 8'i taşıyor |
| P10 | Resilience | s.8 'lazer mesafe ölçer geç veri verdi' | aynı | Tutarlı, doğrulandı |
| P11 | HAKUTO-R M1 | s.8 'irtifa 3 km sıçradı' | aynı | Tutarlı, ama kaynaklar 5 km hover diyor (kısmen doğru) |
| P12 | Sonraki görevler | s.2 Chang'e 7 2027, LUPEX 2028, Moonlight 2028-30 | aynı | Tutarlı; LUPEX kaynaksız |

## 3. Öneriler ve tasarım kararları

- Kürasyon listesinde 'Kanada katkısı' etiketi: Apollo 11, 16, 17, IM-1 (Malapert A), Blue Ghost M1.
- 'Gece hayatta kalma' senaryosu: gün batımına kalan süre, sonraki gecenin uzunluğu, en uzun kesintisiz karanlık; 'rover planlayıcı' profili.
- Panel/direk yüksekliği kaydırıcısı (isteğe bağlı); gözlemci yüksekliği parametresi.
- 'DTE yok, röle gerekli' uyarısı.
- Eğitim modu kartları (Apollo-Artemis sayıları, 400.000 km, -200 °C, ~2 hafta gece).
- Sunum anlatısı: Moon Base veri çağrısı, LUV ve Canadarm3'ün yüzeye yönelmesi.
- MVP: çok kriterli saha puanı, panel yönüne göre güç eğrisi, gece sayacı ve uyanma zamanı. Sonra: röle modu, kalıcı gölge katmanı (buz için 'belirsiz' etiketi), yaklaşma profili ve gölge uyarısı. Belge 'karar ekibin' diyor.
- CSA görsellerinde atıf ibaresi.

## 4. Belge içi çelişkiler ve eskimiş bilgiler

- Belgenin CSA 'eskimiş sayfa' listesi (bölüm 5) kaynakla doğrulandı. Ek: Artemis sayfası da 'updating its website' notunu taşıyor (bölüm 5 listesinde ayrıca anılmıyor).
- Bölüm 5 'Canadarm3 yönlendirmesi sayfanın başına not' diyor; yönlendirme notu yalnızca about sayfasında, veri sayfasında genel 'updating its website' notu var.
- Hub 'Haber akışı Kasım 2026' ile indirilen hub'ın en yeni haberi (6 Tem 2026) uyuşmuyor.
- Space.com 9 bölge makalesi (Ekim 2024) Artemis III'ü iniş görevi olarak anlatıyor; belge bunu zaten uyarıyor. NASA'nın 2022 duyurusu 13 bölge listeliyor; belge yalnızca 9'luk listeden söz ediyor.
- Yutu-2: belge kendi 2026 durumunu doğrulayamadığını yazıyor, sunum 'yıllarca' diyor; kaynak (2019) bunu desteklemiyor.
- SLIM: The Register makalesi kendi içinde iki gece / üç gece diyor; belge 3 yazıyor (makalenin özet cümlesiyle uyumlu).
- arXiv 2308.10712 yedek sahayı anlatıyor; belge ana sahayı (LS-2) anlatırken bu makaleyi gösteriyor.
- Chang'e 7 gecikmesi: belge aydınlanma temelli seçim ima ediyor; CNN rüzgâr ve dar pencere diyor.
- HAKUTO-R M1: belge ~3 km, Universe Today 5 km hover diyor.
- Belge hem 'Doğrulayamadım' (Yutu-2, Science Advances makalesi) hem 'bilinen' ifadeleri açıkça ayırıyor; bu iki öz-beyan olduğu gibi doğru.

## 5. Etiket sayıları

- doğrulandı: 57
- kısmen doğru: 13
- yanlış: 0
- kaynağı yok: 9
- doğrulanamadı: 6
- Toplam: 85 iddia satırı (sunum karşılaştırma satırları hariç)

## 6. Açılamayan kaynaklar

- https://payloadspace.com/mda-space-will-repurpose-canadarm3-for-lunar-surface/ : HTTP 403 (Cloudflare), 2 deneme. Etkilenen: Gateway durdurma tarihi, MDA 1 milyar CAD / 10 Ağu iddiası.
- https://www.canada.ca/en/space-agency/news/2024/02/canadian-technologies-heading-to-the-moon.html : bağlantı sıfırlandı (curl 000, sonra exit 56), 2 deneme. Etkilenen: IM-1 Kanada katkıları satırı.
- JAXA basın brifingleri, Irish Times, SpacePolicyOnline (yalnızca sunumda anılıyor, adres yok): açılmadı.
- Space.com 9 bölge sayfası açıldı ama bölge adları metinde yok; erişim hatası değil içerik eksikliği.
