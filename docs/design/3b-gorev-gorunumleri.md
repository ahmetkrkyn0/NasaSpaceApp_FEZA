# 3B görev görünümleri: yüzeye yakınlaşma, gölge, iniş, bağlantı ve dönüşler

- **Durum:** Plan (15 Kasım 2026)
- **Sınıf:** Ekstra özellik; challenge hedefleri O3, O5, O6 ve O7'yi derinleştirir
- **Branch:** `feat/frontend-mission-views`
- **Sahip:** Oğuzhan
- **Bağlı kararlar:** [ADR-0002](../adr/0002-koordinat-sistemi-ve-zaman.md), [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Bağlı tasarım notları:** [gosterim-ve-arayuz.md](gosterim-ve-arayuz.md), [ufuk-hesabi.md](ufuk-hesabi.md), [yaklasma-profili-ve-golge-uyarisi.md](yaklasma-profili-ve-golge-uyarisi.md), [iletisim-penceresi.md](iletisim-penceresi.md), [role-etiketi.md](role-etiketi.md), [athena-demosu.md](athena-demosu.md)

## İçindekiler

1. [İstenenler ve nerede karşılandıkları](#1-i̇stenenler-ve-nerede-karşılandıkları)
2. [Bugünkü durum](#2-bugünkü-durum)
3. [Değişmeyen kurallar](#3-değişmeyen-kurallar)
4. [Hedef deneyim](#4-hedef-deneyim)
5. [Veri: hangi DEM, kim indirir](#5-veri-hangi-dem-kim-indirir)
6. [Gölge nasıl hesaplanır](#6-gölge-nasıl-hesaplanır)
7. [Dünya'nın ve Ay'ın dönüşü](#7-dünyanın-ve-ayın-dönüşü)
8. [İniş sekansı](#8-i̇niş-sekansı)
9. [İletişim ve röle](#9-i̇letişim-ve-röle)
10. [Aşamalar](#10-aşamalar)
11. [Testler ve doğrulama](#11-testler-ve-doğrulama)
12. [Riskler](#12-riskler)
13. [Kararlar](#13-kararlar)

## 1. İstenenler ve nerede karşılandıkları

Bu tablo, istenen her şeyin planda bir karşılığı olduğunu gösterir. Bir satır kapanmadan iş bitmiş sayılmaz.

| No | İstenen | Karşılandığı aşama |
|---|---|---|
| İ1 | Uydunun (aracın ve röle uydusunun) Dünya ile iletişimi görünsün | A7 |
| İ2 | Güneş görünsün | A4 (yüzeyden gökte), A5 (uzaydan cisim olarak) |
| İ3 | Dünya görünsün | A4 (yüzeyden gökte), A5 ve A8 (uzaydan, dönerek) |
| İ4 | Aracın inişi görünsün (animasyon) | A6 |
| İ5 | Olası iniş yerleri görünsün | A4 ve A5 (her ölçekte işaretler, aday bölge sınırları) |
| İ6 | Ay'a yakınlaşma olsun | A5 (kesintisiz yakınlaşma), A6 (iniş sekansının ilk evresi) |
| İ7 | Aracın indiği konum görünsün | A6 (iniş sonrası araç, bilgi kartı, sahadan bakış) |
| İ8 | QuickMap'teki gibi Ay yüzeyine yaklaşabilelim | A5 |
| İ9 | Gölge mantığı olsun | A3 (çekirdek), A4 (arazide), A5 (kürede), A6 (aracın gölgesi) |
| İ10 | Gereken DEM verileri kullanılsın (yükseklik, gölge) | A1; indirme listesi 5. bölümde |
| İ11 | Dünya'nın ve Ay'ın dönüşü hesaba katılsın | A2 (sunucu), A8 (arayüz) |
| İ12 | Yeni branch'te, elle, emek vererek yapılsın | `feat/frontend-mission-views`; kod elle yazılır |

Süre bu planda kısıt olarak ele alınmadı; aşamalar kesilmeden, sırayla yapılır.

## 2. Bugünkü durum

Plan kapısında haritanın üstünde dört görünüm düğmesi var: `2D map`, `3D Moon`, `3D terrain`, `Space`. Explore ve Classroom kapılarında aynı görünümler ayrı paneller olarak durur.

| Görünüm | Bugün var olan | Eksik olan |
|---|---|---|
| `3D Moon` ([GlobeView.tsx](../../frontend/src/features/globe/GlobeView.tsx)) | Dokulu küre, sahalar ve aday bölgeler, sunucunun Güneş altı noktasından aydınlatma, Dünya altı noktası halkası | Kamera 1,6 Ay yarıçapından yakına gelmiyor; kabartı yok; gün-gece çizgisinde gölge yok |
| `3D terrain` ([TerrainView.tsx](../../frontend/src/features/terrain3d/TerrainView.tsx)) | Mons Mouton çevresi 20 × 20 km, 40 m ızgaradan ağ, eğime göre gölgelendirme, kabartma, eğim ve kalıcı gölge renkleri | Düşen gölge yok ("cast shadows are not computed"); Güneş ve Dünya gökte çizilmiyor; araç yok; ağ kenarı 250 noktaya seyreltiliyor |
| `Space` ([SpaceView.tsx](../../frontend/src/features/space/SpaceView.tsx)) | Dünya ve Ay, üç DSN istasyonu, bağlantı çizgisi, sahada dik duran Athena modeli, Dünya'nın dönüşü | Güneş cisim olarak yok; röle uydusu sabit bir kutu; Ay'ın dönüşü görülmüyor; Dünya'nın dönüşü yeni ay ve dolunay yakınında verilemiyor |
| Görünümler arası geçiş | Düğmeyle | Yakınlaştıkça bir ölçekten ötekine kesintisiz geçiş yok |

Veri tarafı:

- `/api/layers/{name}`: yalnızca `mons-mouton` bölgesi; 20 × 20 km; depoda 40 m (500 × 500), tam çözünürlük 20 m isteğe bağlı.
- `/api/body-series`: Güneş altı ve Dünya altı noktaları (`MOON_ME`), Dünya üzerinde Ay altı ve Güneş altı noktaları (`IAU_EARTH`), Dünya uzaklığı. Dönüş açısı ya da dönüş matrisi yok.
- `/api/sky-series`: sahadan Güneş ve Dünya'nın yön açısı, yükseklik açısı, görünen yarıçapı, ufuk açısı ve görünen oranı.
- Araç modeli: [athena_lander.glb](../../frontend/public/media/models/athena_lander.glb).

## 3. Değişmeyen kurallar

[PLAN.md](../PLAN.md) 4. bölümdeki bilimsel doğruluk kuralları ve #97'nin 3. bölümü bu işte de geçerlidir. Bu plana özgü uygulaması:

1. **Gök mekaniği sunucuda kalır.** Güneş'in ve Dünya'nın yönü, uzaklığı, görünen yarıçapı, Dünya'nın ve Ay'ın dönüşü sunucudan gelir. Arayüz bunları saatten türetmez.
2. **Arayüzde yapılan iş çizim geometrisidir.** Sunucunun verdiği yönü yükseklik haritası üzerinde yürütüp hangi noktanın gölgede kaldığını bulmak bu sınıfa girer (6. bölüm). Bu sonuç ekranda "DEM'den türetilmiş çizim" notuyla gösterilir ve seçili sahalarda sunucunun kendi sonucuyla karşılaştırılır. Karar 13.1'e bakın.
3. **Hesaplanmayan şey illüstrasyondur.** İniş yolu, röle uydusunun yörüngesi, motor alevi ve yıldızlar hesaplanmaz; ekranda "Illustration" etiketi taşır.
4. **Ölçek gizlenmez.** Büyütülen her şey (araç, istasyonlar, sıkıştırılmış Dünya-Ay uzaklığı, dikey abartı) ekranda yazılır.
5. **Doğrulanmamış sayı girmez.** İniş sekansında hız, yükseklik ve süre gibi telemetri sayıları gösterilmez; gösterilen sayılar ya sunucudan ya yükseklik haritasından gelir.
6. **Geçmiş görevlerde kaza nedeni canlandırılmaz.** Araç her zaman dik iner; "it does not show how a mission here ended" notu kalır.
7. **Her doku ve model için kaynak yazılır.** Yeni dosyalar [CREDITS.md](../../frontend/public/media/CREDITS.md) içine eklenir; yazılamayan dosya kullanılmaz.

## 4. Hedef deneyim

### 4.1 Beş ölçek, tek sahne

QuickMap'in mantığı: tek bir görünümde yakınlaştıkça ayrıntı artar, imlecin altındaki yerin koordinatı ve yüksekliği okunur, katmanlar açılıp kapanır. Bunu beş ölçekle kuruyoruz:

| Ölçek | Kamera uzaklığı | Ne çizilir | Veri |
|---|---|---|---|
| Ö1 Uzay | 5 Ay yarıçapından uzak | Ay, Dünya (dönerek), Güneş, istasyonlar, bağlantı, röle | `/api/body-series`, `/api/earth-link` |
| Ö2 Küre | 1,05 ile 5 yarıçap arası | Dokulu ve kabartılı Ay, gün-gece çizgisi, bütün sahalar | Tüm Ay yükseklik haritası (K0) |
| Ö3 Kutup bölgesi | Yüzeyden 50 ile 500 km | Güney kutbu başlığının gerçek arazisi, düşen gölgeler, kalıcı gölgeli bölgeler | Kutup başlığı DEM'i (K1) |
| Ö4 Saha çevresi | Yüzeyden 2 ile 50 km | Mons Mouton arazisi, aday bölge sınırları, eğim ve gölge katmanları | Geniş bölge DEM'i (K2) ve yerel DEM (K3) |
| Ö5 Saha | Yüzeyden 2 km'den yakın | Araç, aracın gölgesi, gökte Güneş ve Dünya, sahadan ufka bakış | Yerel 20 m DEM (K3) |

Fare tekerleği ve dokunmatik kıstırma bu ölçekler arasında kesintisiz geçer. Bir sahaya çift tıklamak ya da listeden seçmek kamerayı o sahaya uçurur.

Gerçek arazi yalnızca DEM'i olan bölgede çizilir. Başka bir sahaya yaklaşıldığında yakınlaşma Ö2'de durur ve "bu saha için arazi verisi yüklü değil" notu çıkar (12. bölüm, risk 4).

### 4.2 QuickMap'ten alınan araçlar

| Araç | Davranış |
|---|---|
| İmleç okuması | İmlecin altındaki noktanın enlemi, boylamı, yüksekliği ve eğimi; değerler haritadan okunur |
| Ölçek çubuğu ve kuzey oku | Kamera uzaklığına göre güncellenir |
| Katman listesi | Görüntü, kabartma, eğim, kalıcı gölge, anlık gölge, "Dünya görünür" maskesi; her biri açılıp kapanır |
| Güneş yönü oku | Seçili andaki Güneş yön açısı arazide ok olarak |
| Saha arama ve uçuş | Listeden ya da haritadan seçilen yere kamera uçar |
| Kesit | İki nokta arasında yükseklik kesiti (yaklaşma profili notundaki çizim; A6 ile birlikte) |

### 4.3 Zaman

Alt bölmedeki zaman çubuğu bütün ölçekleri sürer. Zaman oynatılırken gölgeler arazide ilerler, Güneş ufukta kayar, Dünya döner, istasyonlar görüş alanına girip çıkar, bağlantı çizgisi açılıp kapanır.

### 4.4 Kapılar

| Kapı | Açılışta | Not |
|---|---|---|
| Plan | 2B harita; düğmeyle 3B sahne | İmleç okuması, katmanlar, kesit ve sayılar açık |
| Explore | 3B sahne, Ö2'den başlar | "Land here" düğmesi iniş sekansını başlatır |
| Classroom | 3B sahne | Rehberli görevler sahnedeki adımlara bağlanır |

## 5. Veri: hangi DEM, kim indirir

Bütün yükseklik verisi NASA kaynaklıdır. Dört katman kullanılır; her biri bir öncekinden daha dar ve daha ayrıntılıdır.

| Kod | Kapsam | Çözünürlük | Kaynak dosya | Boyut | Nasıl alınır |
|---|---|---|---|---|---|
| K0 | Tüm Ay | Derecede 16 piksel (ekvatorda yaklaşık 1,9 km) | NASA SVS 4720 CGI Moon Kit, `ldem_16_uint.tif` (5760 × 2880, 16 bit, yarım metre birimi, 1 727 400 m'ye göre) | 31,7 MB | Elle indirilir, `data/raw/globe/` altına konur |
| K1 | Güney kutbu başlığı, 80° G'den kutba (yaklaşık 600 km genişlik) | 80 m; depoya 640 m olarak girer | PGDA 90, `LDEM_80S_80MPP_ADJ.TIF` | 181 MB | Betik ağ üzerinden okur; dosyanın tamamı da indirilebilir |
| K2 | Mons Mouton çevresi, 80 × 80 km | 80 m | Aynı dosya | Pencere | Betik ağ üzerinden okur |
| K3 | Mons Mouton, 20 × 20 km | 20 m; depoda 40 m var | PGDA 90, `LDEM_80S_20MPP_ADJ.TIF` (2,6 GB) | Pencere | `python backend/scripts/make_layers.py` (bugün de çalışıyor) |

İsteğe bağlı, görüntü kalitesi için:

| Veri | Ne için | Dosya | Boyut |
|---|---|---|---|
| Daha keskin Ay görüntüsü | Ö2'de yakınlaşınca bulanıklığı azaltır | SVS 4720, `lroc_color_poles_8k.tif` (8192 × 4096) | 48,3 MB |
| Kutup bölgesi kabartma ve eğim haritaları | K1 ve K2 üzerinde renk katmanları | PGDA 90, `LDEM_80S_80MPP_ADJ_HILL.TIF` (85 MB), `LDSM_80S_80MPP_ADJ.TIF` (231 MB) | Betik pencere okur |
| Kalıcı gölge, geniş bölge | K2 üzerinde kalıcı gölge katmanı | PGDA 90, `LPSR_80S_20MPP_ADJ.TIF` (148 MB) | Betik pencere okur |

Adresler:

- SVS 4720: <https://svs.gsfc.nasa.gov/4720>; dosyalar `https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/` altında.
- PGDA 90: <https://pgda.gsfc.nasa.gov/products/90>; dosyalar `https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/` altında.

### İndirme adımları (Oğuzhan)

A1 aşamasındaki betikler yazıldıktan sonra sırayla:

1. `python backend/scripts/make_layers.py` (K3, 20 m; bugün çalışır).
2. `ldem_16_uint.tif` dosyasını tarayıcıdan indirip `data/raw/globe/` altına koymak (K0).
3. `python backend/scripts/make_layers.py --region south-pole-cap` (K1).
4. `python backend/scripts/make_layers.py --region mons-mouton-wide` (K2).
5. `python backend/scripts/make_globe_relief.py` (K0'dan küre için kabartı dosyaları).
6. İsteğe bağlı: `lroc_color_poles_8k.tif`.

`data/raw/` depoya girmez. Depoya girecek kopyalar karar 13.3'tedir.

### Bilinen veri sınırları

- K0'ın 1,9 km'lik hücresi küçük kraterleri göstermez; kürede yalnızca büyük yapılar kabarır.
- SVS görüntü haritası görünüm için işlenmiştir, hesapta kullanılmaz (sayfanın kendi notu).
- En ince harita 20 m'dir; kaya ve küçük krater yoktur. Athena'nın içine yattığı krater 20 m çapındaydı; bu, haritanın çözebildiği sınırdadır ([yaklasma-profili-ve-golge-uyarisi.md](yaklasma-profili-ve-golge-uyarisi.md), bölüm 7).
- SVS sayfası lisans metni vermiyor; "NASA's Scientific Visualization Studio" atfı istiyor. Atıf `CREDITS.md` içine yazılır.

## 6. Gölge nasıl hesaplanır

### 6.1 Girdi

| Girdi | Nereden |
|---|---|
| Güneş'in Ay'a göre yönü | `/api/body-series` içindeki Güneş altı noktası (`MOON_ME`). Güneş çok uzakta olduğu için Ay'ın merkezinden ve yüzeyinden bakıldığında yön farkı 0,001 dereceden küçüktür |
| Güneş'in görünen yarıçapı | `/api/sky-series` örneğindeki `sun.radius_deg` |
| Arazi | K3, K2 ve K1 ızgaraları, iç içe |

Bugünkü 3B arazi, seçili sahadaki yön ve yükseklik açısını bütün bölgeye uyguluyor. 20 km'lik bölgede yerel düşey 0,66 derece döner; Güneş 2 ile 6 derece yüksekteyken bu fark gölgeyi belirgin biçimde değiştirir. Yeni yöntemde Güneş'in yönü Ay'a bağlı tek bir vektördür ve her nokta kendi yerel düşeyine göre değerlendirilir.

### 6.2 Yöntem

Her ağ noktası için:

1. Noktanın yerel düşeyi ve Güneş vektöründen, o noktadaki Güneş yükseklik açısı ve yön açısı bulunur (yalnızca koordinat çevirme).
2. Noktadan Güneş yönüne doğru arazi üzerinde yürünür: yakında sık, uzakta seyrek adımlarla ([ufuk-hesabi.md](ufuk-hesabi.md), "Arazi ufku" ile aynı örnekleme mantığı).
3. Her adımda arazinin yüksekliği okunur ve Ay'ın eğriliği kadar düşürülür (uzaklığın karesi bölü iki yarıçap; 100 km'de yaklaşık 2,9 km).
4. Yol boyunca görülen en yüksek arazi açısı, o yöndeki ufuk açısıdır.
5. Güneş diski ile ufuk açısı karşılaştırılır: disk tamamen üstteyse nokta aydınlık (1), tamamen alttaysa gölgede (0), arada ise diskin görünen oranı kadar yarı gölgededir. Oran, sunucunun `visible_fraction` için kullandığı alan oranıyla aynı tanımdır.
6. Işın, veri kümesindeki en yüksek noktanın üstüne çıktığında yürüyüş erken biter.

Yürüyüş K3 ızgarasında başlar, sınırına gelince K2'ye, sonra K1'e geçer. Böylece 20 km'lik pencerenin dışındaki dağların attığı gölge de hesaba girer. Sunucunun ufuk hesabı 150 km'ye kadar bakıyor; K1 bu uzaklığı karşılar.

### 6.3 Dünya görünürlüğü maskesi

Aynı yürüyüş Dünya yönü için de yapılır ve arazide "Dünya buradan görünür mü" maskesi çizilir. Dünya yakın olduğu için yön her nokta için ayrı bulunur: Dünya'nın merkezi, sunucunun Dünya altı noktası ve `earth_distance_km` değerinden Ay'a bağlı koordinatta yerleştirilir; noktanın konumu çıkarılır. Bu maske, bir aday bölgenin neden doğrudan bağlantı kuramadığını arazide gösterir.

### 6.4 Engelleyen sırt

Yürüyüş, ufuk açısını veren noktayı da döndürür. Seçili saha gölgedeyse ya da Dünya'yı göremiyorsa, engelleyen sırt arazide işaretlenir ve sahadan o noktaya bir çizgi çizilir.

### 6.5 Çizim

Aydınlatma işlemcide hesaplanıp köşe renklerine yazılır: renk = katman rengi × (ortam ışığı + aydınlık oranı × yüzey eğiminin Güneş'e bakışı). Yüzey normali abartısız yükseklikten bulunur. Kalıcı gölge katmanı ile anlık gölge ayrı renklerle gösterilir; biri haritadan okunan bir üründür, öteki seçili an için türetilmiş çizimdir.

### 6.6 Hız

Hesap bir Web Worker içinde koşar. Zaman çubuğu sürüklenirken önce seyrek ağ için sonuç gelir, sonra tam ağ. Aynı Güneş yönü için sonuç saklanır. Hedef: 250 × 250 noktalık ağ için 200 ms'nin altı.

İlk ölçüm (çekirdek, depodaki 40 m Mons Mouton katmanı, tek ızgara, Node 22.20.0):

| Ağ | Çoğu gölgede | Çoğu aydınlık |
|---|---|---|
| 251 × 251 | 136 ile 155 ms | 370 ms |
| 500 × 500 | 521 ile 530 ms | 1586 ms |

Aydınlık noktalar ızgaranın sonuna kadar yürüdüğü için daha yavaştır. 251 × 251 ağ hedefi aydınlık durumda tutmuyor; A4'te iyileştirilir (aynı yön açısındaki noktalar için ufkun paylaşılması) ve seyrek-sonra-tam geçişle örtülür.

### 6.7 Sunucuyla karşılaştırma

Bölgedeki her katalog sahası ve aday bölge için sunucu zaten 150 km'lik arazi ufkuyla `sun.visible_fraction` veriyor. Arayüz, aynı noktalarda kendi bulduğu oranı bununla karşılaştırır ve sonucu ekranda yazar ("16 yerin 16'sında sunucuyla uyumlu" gibi). Fark 0,1'i aşarsa gölge katmanı "approximate" notuyla çizilir (karar 13.2).

## 7. Dünya'nın ve Ay'ın dönüşü

### 7.1 Bugün

- Sahne Ay'a bağlı koordinattadır (`MOON_ME`). Ay sabit durur; Güneş ve Dünya onun çevresinde hareket eder. Ay'ın kendi dönüşü ve salınımı bu yüzden görülmez, yalnızca Dünya altı noktasının gezinmesi olarak dolaylı görünür.
- Dünya'nın yönelimi iki nokta çiftinden kurulur ([frame.ts](../../frontend/src/features/space/frame.ts), TRIAD). Güneş, Dünya ve Ay aynı doğrultuya yaklaşınca (yeni ay, dolunay) dönüş verilemez ve Dünya düz bir küre olarak çizilir.
- Örnekler saatliktir; Dünya bir saatte 15 derece döndüğü için oynatmada sıçrar.

### 7.2 Sunucuya eklenecekler (A2)

`/api/body-series` örneklerine iki alan eklenir:

| Alan | Anlamı | SPICE |
|---|---|---|
| `earth_rotation` | Dünya'ya bağlı koordinattan `MOON_ME`'ye dönüş, dört sayılık kuaterniyon | `pxform(IAU_EARTH, MOON_ME)`, ışık süresi düzeltilmiş anlarda |
| `moon_rotation` | Yıldızlara göre sabit koordinattan (`J2000`) `MOON_ME`'ye dönüş, kuaterniyon | `pxform(J2000, MOON_ME)` |

`moon_rotation`, DE440 ile gelen `moon_pa_de440_200625.bpc` dosyasından okunur; Ay'ın eşzamanlı dönüşünü, eksen eğikliğini ve fiziksel salınımını içerir. Ek dosya indirmek gerekmez.

Sözleşme: alanlar isteğe bağlı olarak eklenir, eski alanlar kalır. ADR-0003 ve ADR-0004'e değişiklik notu yazılır, `data/examples/body-series.json` güncellenir, `CONTRACT` mesajı gönderilir.

Dünya'nın dönüşü `IAU_EARTH` modeliyle kalır (nutasyon ve UT1 düzeltmesi yok; boylamda 0,1 dereceye kadar fark, T10). Daha hassas model için karar 13.4.

### 7.3 Arayüzde (A8)

| Özellik | Davranış |
|---|---|
| Dünya'nın dönüşü | `earth_rotation` doğrudan uygulanır; yeni ay ve dolunaydaki boşluk kapanır. Sunucu alanı vermezse bugünkü yöntem yedek kalır |
| Akıcı oynatma | İki örnek arasında dönüş küresel doğrusal ara değerle çizilir. Bu bir çizim ara değeridir; sayılar yalnızca örnek anlarında gösterilir |
| Bakış çerçevesi | `Moon-fixed` (bugünkü) ve `Star-fixed` seçenekleri. İkincisinde yıldızlar sabit durur, Ay kendi ekseninde döner, Dünya döner, Güneş çok yavaş kayar |
| Salınım | Dünya altı noktasının izi küre üzerinde çizilir; enlem ve boylam değeri sunucudan yazılır |
| Mevsim | Güneş altı noktasının enlemi yazılır. Ay'ın ekseni az eğik olduğu için kutupta Güneş hep ufka yakındır; bu, ürünün ana mesajıdır |
| Dünya'nın uzaklığı | `earth_distance_km` ve gökte Dünya'nın görünen yarıçapı (`earth.radius_deg`) yazılır; yakın ve uzak konumda disk boyutu değişir |
| Evre | Yüzeyden bakışta Dünya'nın evresi, Güneş yönü ve Dünya yönünden çizilir |

### 7.4 Yüzeyde dönüşlerin etkisi

Ö5'te sahadan bakarken dönüşlerin sonucu doğrudan görülür: Güneş bir Ay gününde ufuk boyunca tam tur atar; Dünya gökte neredeyse sabit durur ve salınım yüzünden küçük bir çember çizer; Dünya'nın yüzü 24 saatte bir döner. Üçü de sunucu verisinden çizilir.

## 8. İniş sekansı

### 8.1 Evreler

| Evre | Ölçek | Ne görülür | Dayanağı |
|---|---|---|---|
| 1 Ay'a yaklaşma | Ö1'den Ö2'ye | Kamera Dünya yönünden Ay'a yaklaşır; Ay büyür, gün-gece çizgisi seçili an için doğrudur | Aydınlatma sunucudan; yol illüstrasyon |
| 2 Yörünge geçişi | Ö2 | Araç kutba doğru alçak bir yay üzerinde ilerler; altından geçen arazi K0 ve K1 | Yol illüstrasyon |
| 3 Alçalma | Ö3'ten Ö4'e | Kamera aracı izler; gölgeler, kalıcı gölgeli bölgeler ve aday bölge sınırları görünür; yaklaşma çizgisi arazide çizilir | Arazi ve gölge DEM'den; yol illüstrasyon |
| 4 Son yaklaşma | Ö5 | Araç dikleşir, düşey iner; aracın gölgesi arazide ona doğru yaklaşır ve konma anında birleşir | Gölgenin yönü ve uzunluğu Güneş açısından; alev illüstrasyon |
| 5 Konma | Ö5 | Araç sahanın enlem ve boylamında, DEM yüksekliğinde durur | Konum ve yükseklik veriden |
| 6 İniş sonrası | Ö5 | Bilgi kartı, bağlantı ışını, sahadan ufka bakış | Aşağıdaki tablo |

### 8.2 İniş anı ve yeri

- **Yer:** etkin senaryonun sahası, aday bölgesi ya da özel koordinatı.
- **An:** zaman çubuğunda seçili an. Aydınlatma ve Dünya'nın konumu o an içindir.
- **Geçmiş görevler:** `reference_missions.json` içindeki iniş anı ve sahasıyla oynatılır. `landing_utc_validity` değeri `SYNTHETIC` olan görevlerde iniş anının yaklaşık olduğu yazılır.
- **Yaklaşma yönü:** gerçek görevlerin yaklaşma yönleri elimizde yok ([yaklasma-profili-ve-golge-uyarisi.md](yaklasma-profili-ve-golge-uyarisi.md), bölüm 7). Kullanıcı seçer; varsayılan yön "Assumed" etiketi taşır.

### 8.3 İniş sonrası bilgi kartı

| Satır | Kaynak |
|---|---|
| Enlem, boylam | Senaryo |
| Yükseklik | Yükseklik katmanı |
| Eğim | Eğim katmanı; aday bölgede sunucunun `mean_slope_deg` ve `max_slope_deg` değerleri |
| Güneş yüksekliği ve yönü | `/api/sky-series` |
| Aydınlık mı, Güneş'in görünen oranı | `/api/sky-series` |
| 1 m'lik nesnenin gölge uzunluğu | Güneş yüksekliğinden birim çevirme; düz zemin notuyla |
| Dünya yüksekliği, bağlantı durumu | `/api/sky-series`, `/api/earth-link` |
| Gün batımına ve Dünya batışına kalan süre | `/api/now` |
| Kalıcı gölgeye uzaklık | Aday bölgede sunucudan |

### 8.4 Araç

- Model gerçek boyutunda görünmez; büyütme katsayısı ekranda yazılır. Ö5'te yakın çekimde gerçek boyuta yakınsar.
- Araç yerel eğime göre durur; eğim sayısı kartta yazılır. Devrilme canlandırılmaz.
- Aracın gölgesi, Güneş yönünde arazi üzerine izdüşümle çizilir.

### 8.5 Kumanda

Oynat, duraklat, baştan, evre atla, hız. Kamera: izleme, yerden bakış, serbest. "Hareketi azalt" ayarı açıksa sekans altı durağan adım olarak gösterilir. Sekans boyunca "Illustration: the descent path is not computed" notu görünür.

### 8.6 Sahadan bakış

İnişten sonra "Stand at the site" düğmesi kamerayı direk yüksekliğine koyar. Güneş ve Dünya, sunucunun verdiği yön açısı, yükseklik açısı ve görünen yarıçapla gökte durur; ufuk gerçek arazidir. Sky sekmesindeki ufuk şeridiyle aynı sayıları gösterir; ikisi yan yana tutarlı olmalıdır (11. bölüm).

## 9. İletişim ve röle

| Durum (`/api/earth-link`) | Ö1'de | Ö5'te |
|---|---|---|
| `direct` | Sahadan dinleyen her istasyona çizgi; çizgi üzerinde ilerleyen işaret | Araçtan gökteki Dünya'ya ışın |
| `no_station` | Çizgi yok; "Dünya ufkun üstünde ama üç istasyondan hiçbiri Ay'ı görmüyor" notu | Dünya gökte, ışın yok |
| `relay_needed` | Hareketli röle uydusu ve onun üzerinden kesikli yol | Dünya ufkun altında; engelleyen sırt işaretli (6.4) |

- **İşaretin süresi:** çizgi üzerindeki işaretin gidiş süresi `earth_distance_km` değerinden birim çevirmeyle yazılır (yaklaşık 1,3 saniye). Animasyon hızı gerçek zamanlı değildir ve bu yazılır.
- **İstasyonlar:** Dünya döndükçe istasyonlar Ay'ı gören yüze girer ve çıkar; hangi istasyonun dinlediği sunucudan gelir. Dinleyen istasyon büyür ve renk değiştirir.
- **Röle uydusu:** Ay çevresinde illüstrasyon bir yörüngede döner. Yörünge hesaplanmaz; uydu yalnızca çizimde hem sahayı hem Dünya'yı gördüğü yay üzerindeyken yol çizilir. "Illustration: a relay satellite is not modelled" notu kalır ([role-etiketi.md](role-etiketi.md)).
- **Dünya görünürlüğü maskesi** (6.3) Ö3 ve Ö4'te bağlantının arazi yüzünden nerede kesildiğini gösterir.

## 10. Aşamalar

Her aşama kendi commit'leriyle ilerler; her commit tek bir mantıksal değişikliktir. Her aşamanın sonunda `typecheck`, `test` ve `build` geçer.

### A0: Hazırlık

- Takip için bir issue açmak; `START` mesajı göndermek.
- Bu belgeyi `docs/design/` altına eklemek.
- Dosya sahipliği: `features/globe/`, `space/`, `terrain3d/`, `map/` ve `shell/` planda C hattının. Göktuğ'a haber verilir; çakışma olursa bu branch yeniden temellenir.

**Bitti sayılır:** issue numarası var, belge depoda.

### A1: Veri

1. `backend/app/terrain/layers.py`: `REGIONS` içine `south-pole-cap` (K1) ve `mons-mouton-wide` (K2); bölgeye göre kaynak dosya seçimi (`LDEM_80S_80MPP_ADJ`).
2. `backend/scripts/make_layers.py`: yeni bölgeler; `--bundle` ile küçültülmüş kopya.
3. `backend/scripts/make_globe_relief.py` (yeni): `ldem_16_uint.tif` dosyasından küre için küçük yükseklik ızgarası ve normal haritası üretir.
4. `frontend/src/api/types.ts`: `LAYER_REGIONS` içine yeni bölgeler.
5. `CREDITS.md`, README "Data Sources" tablosu, ADR-0004 değişiklik notu.

**Bitti sayılır:** `/api/layers/elevation?region=south-pole-cap` ve `mons-mouton-wide` 200 döner; üç ızgara aynı izdüşümdedir ve üst üste oturur (test: K3'ün köşe noktalarında K2 ve K1 yükseklikleri ızgara çözünürlüğü kadar yakın); temiz kopyada küçültülmüş dosyalarla çalışır.

### A2: Sunucuda dönüşler

1. `backend/app/core/ephemeris.py`: iki dönüşün hesabı.
2. `backend/app/models/bodies.py`, `api/bodies.py`: `earth_rotation`, `moon_rotation`.
3. `data/examples/body-series.json`, ADR-0003, ADR-0004, sözleşme testi.
4. `backend/scripts/run_validation.py`: tutarlılık denetimi (11. bölüm, D1 ve D2).

**Bitti sayılır:** `pytest backend` geçer; `earth_rotation` ile çevrilen Ay altı noktası sunucunun Dünya yönüyle 0,001 derece içinde örtüşür; yeni ay ve dolunay anlarında da alan doludur.

### A3: Gölge çekirdeği

1. `frontend/src/features/terrain3d/shadow.ts` (yeni): iç içe ızgara okuma, yerel Güneş açısı, ufuk yürüyüşü, eğrilik, disk oranı, engelleyen nokta.
2. `shadow.worker.ts` (yeni): hesabı arka planda koşturur; seyrek ve tam geçiş.
3. `shadow.test.ts`: yapay arazi testleri (11. bölüm, G1 ile G6).

**Bitti sayılır:** yapay arazi testleri geçer; 250 × 250 ağ için süre ölçülüp PR'a yazılır.

### A4: Arazi görünümü

1. `geometry.ts`: `SHADING_NOTE` değişir; aydınlatılmış köşe renkleri; ağ sınırı yükseltilir ve yakın çekimde saha çevresi tam çözünürlükle çizilir.
2. `TerrainView.tsx`: işlemcide aydınlatma; gökte Güneş ve Dünya diskleri (görünen yarıçap sunucudan, büyütme varsa yazılı); Güneş yönü oku; engelleyen sırt işareti.
3. `index.tsx`: katman listesine `Shadow now` ve `Earth in view`; imleç okuması; ölçek çubuğu; sunucuyla karşılaştırma satırı.
4. Aday bölge sınırları ve sıra numaraları arazide; kalıcı gölge ile anlık gölge ayrı renkte.
5. "Stand at the site" kamerası.

**Bitti sayılır:** zaman oynatıldığında gölgeler ilerler; seçili sahada ekrandaki Güneş yüksekliği `/api/sky-series` ile aynıdır; karşılaştırma satırı görünür; klavye ile yer seçimi çalışmaya devam eder.

### A5: Kesintisiz yakınlaşma

1. `features/mission3d/` (yeni): Ay küresi ile K1, K2 ve K3 yamalarını tek sahnede, Ay'a bağlı koordinatta çizer. Yamalar küre üzerine gerçek eğrilikle oturur.
2. Kürede kabartı: A1'in ürettiği normal haritası ve yer değiştirme; gün-gece çizgisinde büyük yapıların gölgesi.
3. Kamera: Ö1'den Ö5'e tekerlekle; yüzeye yaklaşınca hedef seçili sahaya, yukarı yön yerel düşeye döner. Yakın çekimde sahne kökeni hedefe taşınır (12. bölüm, risk 2).
4. Uzayda Güneş: yönünde parlak disk; "boyut ve uzaklık ölçekli değil" notu.
5. `map/index.tsx`: düğmeler `2D map` ve `3D` olarak sadeleşir; eski üç görünüm, yenisi aynı işi görene kadar kalır.
6. İmleç okuması, ölçek çubuğu, kuzey oku ve saha uçuşu her ölçekte.

**Bitti sayılır:** Ö1'den Ö5'e tek hareketle inilir, kamera sıçramaz; yama sınırlarında basamak görünmez; DEM'i olmayan sahada yakınlaşma Ö2'de notla durur; WebGL yoksa metin ve 2B harita kalır.

### A6: İniş sekansı

1. `mission3d/landing.ts` (yeni): evreler, yol eğrisi, kamera rayı; saf işlevler.
2. `mission3d/LandingControls.tsx`: kumanda ve notlar.
3. Araç: modelin yüklenmesi (bugünkü `loadLander`), eğime oturma, gölge izdüşümü, alev.
4. Bilgi kartı (8.3) ve yaklaşma kesiti.
5. Explore kapısında "Land here"; geçmiş görevler panelinden "Replay the landing".

**Bitti sayılır:** her katalog sahasında ve aday bölgede sekans baştan sona oynar; araç DEM yüksekliğinde durur (test: yol eğrisinin son noktası saha konumu ve yüzey yüksekliği); notlar görünür; "hareketi azalt" ayarında altı durağan adım gelir.

### A7: Bağlantı ve röle

1. `space/frame.ts`: röle için illüstrasyon yörünge ve görüş denetimi (yalnızca çizim için).
2. Sahne: hareketli işaret, dinleyen istasyon vurgusu, Ö5'te araçtan Dünya'ya ışın, engelleyen sırt.
3. Işık süresi satırı.

**Bitti sayılır:** üç bağlantı durumu üç ayrı çizim verir (test: `linkDrawingAt` çıktısına göre hangi nesnelerin göründüğü); röle çizimi her zaman etiketlidir.

### A8: Dönüşler

1. `space/frame.ts`: `earth_rotation` kullanımı, yedek olarak TRIAD; kuaterniyon ara değeri.
2. Bakış çerçevesi seçimi; Dünya altı noktası izi; mevsim, salınım, uzaklık satırları.
3. Yüzeyden bakışta Dünya'nın evresi ve dönüşü.

**Bitti sayılır:** yeni ay ve dolunayda Dünya dokulu çizilir; `Star-fixed` görünümde 27,3 günlük seride Ay bir tam tur atar (test: ilk ve son örnekteki yön farkı); oynatmada Dünya sıçramaz.

### A9: Bütünleştirme ve belgeler

1. Kapılar: açılış görünümleri (4.4), panel kaydı, rehberli görevlerin sahne adımları.
2. README ("Features", "Usage", "Known Limits", "Data Sources"), CHANGELOG, `CREDITS.md`.
3. Doğrulama raporuna yeni denetimler.
4. Demo: Athena akışı yeni sahneyle ([athena-demosu.md](athena-demosu.md)).

**Bitti sayılır:** 1. bölümdeki on iki satırın her biri canlı kipte gösterilebilir; örnek kipte sahne sunucu olmadan açılır.

### Sıra ve bağımlılık

| Aşama | Bağlı olduğu | Veri indirmesi gerekir mi |
|---|---|---|
| A0 | Yok | Hayır |
| A1 | A0 | Evet (5. bölüm) |
| A2 | A0 | Hayır |
| A3 | A0 | Hayır (yapay arazi ve depodaki 40 m) |
| A4 | A3 | Hayır; K2 ve K1 gelince uzak gölgeler eklenir |
| A5 | A1, A4 | Evet |
| A6 | A5 | Evet |
| A7 | A5 | Hayır |
| A8 | A2, A5 | Hayır |
| A9 | Hepsi | Hayır |

A1, A2 ve A3 birbirini beklemez.

## 11. Testler ve doğrulama

### Gölge

| Test | Koşul | Beklenen |
|---|---|---|
| G1 | Düz arazi, Güneş 5° yüksekte | Her nokta aydınlık |
| G2 | Bilinen yükseklikte duvar, bilinen uzaklık | Gölgenin ucu, duvar yüksekliği bölü Güneş açısının tanjantı kadar uzakta; bir hücre içinde |
| G3 | Güneş ufkun altında | Her nokta gölgede |
| G4 | Disk yarı yarıya ufukta | Aydınlık oranı 0,5; yüzde bir içinde |
| G5 | 100 km uzakta yüksek arazi | Eğrilik düşüşü yaklaşık 2,9 km alınır ([ufuk-hesabi.md](ufuk-hesabi.md), adım 4) |
| G6 | K3 sınırında başlayan ışın | K2 ve K1'de devam eder; sınırda süreksizlik yok |
| G7 | Bölgedeki katalog sahaları ve aday bölgeler, birkaç an | Arayüzün oranı ile sunucunun `sun.visible_fraction` değeri yan yana raporlanır (6.7) |
| G8 | Düzlemde yürüyüş ile küre üzerinde tam üç boyutlu yürüyüş | Örnek noktalarda ufuk açısı farkı ölçülür ve raporlanır |

### Dönüşler

| Test | Koşul | Beklenen |
|---|---|---|
| D1 | `earth_rotation` ile çevrilen Ay altı noktası | Sunucunun Dünya yönüyle örtüşür; 0,001° |
| D2 | `moon_rotation` ile çevrilen Dünya yönü | Sunucunun Dünya altı noktasıyla örtüşür; 0,001° |
| D3 | Dönüş matrislerinin JPL Horizons karşılığı | Dünya altı ve Güneş altı noktaları zaten T8 ve T10'da sınanıyor; yeni alanlar bu noktalarla tutarlılık üzerinden sınanır |
| D4 | TRIAD ile kurulan dönüş ve `earth_rotation` | Güneş, Dünya ve Ay aynı doğrultuda değilken fark raporlanır |

### Görünüm tutarlılığı

| Test | Beklenen |
|---|---|
| V1 | Sahadan bakışta Güneş ve Dünya'nın ekrandaki yön ve yükseklik açısı, `/api/sky-series` örneğiyle aynı |
| V2 | Arazi ağında seçili sahanın yüksekliği, yükseklik katmanındaki değerle aynı |
| V3 | İniş yolunun son noktası saha konumunda ve yüzeyde |
| V4 | Küre üzerindeki yamalar, 2B haritanın izdüşümüyle aynı enlem ve boylama oturur (`projection_vectors.json`) |
| V5 | Bağlantı durumuna göre doğru nesneler görünür; röle her zaman etiketli |

### Erişilebilirlik ve yedekler

- WebGL yoksa: metin, 2B harita ve bağlantı şeması.
- "Hareketi azalt": iniş sekansı durağan adımlar, kamera uçuşu anlık.
- Klavye: yer listesi, katman düğmeleri ve iniş kumandası klavyeyle kullanılır.
- Açık ve koyu tema: işaret ve etiket renkleri tema değişkenlerinden.

## 12. Riskler

| No | Risk | Önlem |
|---|---|---|
| 1 | Gölge hesabı zaman oynatılırken yavaş kalır | Worker, seyrek sonra tam geçiş, sonuç saklama, erken çıkış. Yetmezse karar 13.1'deki sunucu seçeneği |
| 2 | Yakın çekimde kayan nokta hassasiyeti: Ay yarıçapı ölçeğinde 20 m'lik ayrıntı titrer | Yakın çekimde sahne kökeni hedefe taşınır; yamalar kilometre biriminde yerel koordinatta tutulur |
| 3 | Yama sınırlarında basamak ve yırtık | Kenarlarda bir üst seviyenin yüksekliğine yumuşak geçiş; kenar etekleri |
| 4 | Gerçek arazi yalnızca Mons Mouton çevresinde ve kutup başlığında | Sınır ekranda yazılır; başka bölge eklemek `REGIONS` içine bir kayıt ve bir betik koşusudur |
| 5 | Depoya giren veri büyür | Kaynak GeoTIFF'ler depo dışında kalır; depodaki kopyalar karar 13.3'teki tabloya göre |
| 6 | Tarayıcı belleği ve ekran kartı yükü | Ağ sınırı, doku boyutu sınırı, görünmeyen seviyelerin serbest bırakılması |
| 7 | Arayüzdeki gölge ile sunucunun görünen oranı ayrışır | G7 karşılaştırması ekranda; ayrışma olursa neden bulunur, eşik gevşetilmez |
| 8 | Başka hatların dosyalarıyla çakışma | Yeni kod `mission3d/` klasöründe toplanır; eski görünümlere dokunuş en aza iner |
| 9 | İniş canlandırması gerçek bir yörünge sanılır | Sürekli görünen "Illustration" notu; telemetri sayısı gösterilmez |

## 13. Kararlar

### 13.1 Gölge nerede hesaplanır (ekip onayı bekliyor)

- **Uygulanan:** arayüzde, sunucunun verdiği Güneş yönüyle, iç içe DEM üzerinde (6. bölüm). Zaman çubuğu sürüklenirken anında tepki verir.
- **Öteki seçenek:** sunucuda yeni bir uç nokta (`/api/layers/shadow`). "Hesap yalnızca sunucuda" kuralına harfiyen uyar, ama her an için ağ isteği gerekir ve oynatma akıcı olmaz.
- PLAN.md 4.1 kural 2'ye bir not düşülmesi gerekir: yükseklik haritası üzerinde görüş hattı çizimi arayüzde yapılabilir, sonuç sunucuyla karşılaştırılarak gösterilir. Bu not ekip onayına sunulur; onay çıkmazsa aynı çekirdek sunucuya taşınır (yöntem değişmez).

### 13.2 Karşılaştırma eşiği (karar verildi)

G7'de arayüzün bulduğu görünen oran ile sunucunun `sun.visible_fraction` değeri arasındaki fark 0,1'i aşarsa o yer "uyumsuz" sayılır. Bölgedeki yerlerden biri bile uyumsuzsa gölge katmanı "approximate" notuyla çizilir ve uyumsuz yerler listelenir. Eşik gevşetilmez; ayrışmanın nedeni bulunur.

### 13.3 Depoya girecek veri (karar verildi)

Veri boyutu kısıt değildir; çözünürlük boyut yüzünden düşürülmez. Çalışma zamanında her zaman eldeki en ince veri kullanılır.

| Katman | Depodaki kopya (`data/layers/`) | Tam çözünürlük (`data/raw/layers/`, depo dışı) |
|---|---|---|
| K3 Mons Mouton 20 × 20 km | 40 m (bugünkü) | 20 m |
| K2 Mons Mouton çevresi 80 × 80 km | 80 m (küçültülmeden) | 80 m |
| K1 Güney kutbu başlığı | 320 m | 80 m |
| K0 küre kabartısı | 4096 × 2048 normal haritası, 2880 × 1440 yükseklik | 5760 × 2880 |

Depodaki kopyalar temiz bir kopyanın sunucusuz ve indirmesiz çalışması içindir. GitHub'ın dosya başına 100 MB sınırı ve [AGENTS.md](../../AGENTS.md) kural 6 (büyük veri kümesi commit edilmez) yüzünden kaynak GeoTIFF'ler depoya girmez; betikle üretilir.

### 13.4 Dünya'nın dönüş modeli (karar verildi)

`IAU_EARTH` ile kalınır. Sınırı README'de yazılı ve T10 ile ölçülü (boylamda 0,1 dereceye kadar); sahnede bu fark görülemez. Yüksek hassasiyetli model altıncı bir SPICE dosyası, ADR-0002 değişikliği ve doğrulanmış T10 değerlerinin yeniden üretilmesini gerektirir; bu işin kazancı bunu karşılamaz.

### 13.5 Eski görünümler (karar verildi)

`3D Moon`, `3D terrain` ve `Space` görünümleri, yeni sahne aynı işi görene kadar yerinde kalır. A9'da kaldırılır; testleri yeni sahneye taşınır. Saf yardımcı modüller (`globe/coords.ts`, `space/frame.ts`, `terrain3d/geometry.ts`, `terrain3d/shadow.ts`) kalır ve yeni sahne tarafından kullanılır.

### 13.6 Yıldızlar (karar verildi)

Yıldızlar süs olarak kalır ve "decorative" notunu taşır. Gerçek yıldız kataloğu bu işin kapsamında değildir: kaynak ve lisans doğrulaması gerektirir ve istenenlerin hiçbirini karşılamaz.

## 14. Durum ve şefe sorular (2026-11-15)

Bu branch'te yapılanlar (merge istenmiyor; plan netleşene kadar burada kalır):

- `3D terrain`: gölge çekirdeği (`terrain3d/shadow.ts`), Güneş ve Dünya diskleri, ayakta bakış, imleç okuması ve ölçek çubuğu. 3B arazi ileride Unreal'a taşınacağı için bu görünüme daha fazla emek verilmeyecek.
- Arka uç: `south-pole-cap` bölgesi (80° G'den kutba, PGDA 90 `LDEM_80S_80MPP_ADJ`, 320 m'ye blok ortalaması, yalnız `elevation`). Veri `make_layers.py --region south-pole-cap` ile `data/raw/layers/` altına üretilir, depoya girmez.
- `3D Moon`: kutup başlığı gerçek ölçekli kabartma olarak çizilir, sunucunun Güneş yönüyle aydınlatılır, arazi gölgeleri tarayıcıda (worker) hesaplanır; kamera yüzeye ~14 km'ye kadar iner; imleç altında enlem, boylam, yükseklik, eğim, Güneş payı; ölçek çubuğu.

Görülen eksikler:

- 320 m veri yakın bakışta ayrıntıyı kaybediyor; QuickMap'teki görünüm yükseklikten değil LROC fotoğraf mozaiğinden geliyor.
- Görünüm küçük bir panelde; tam ekran sahne gerekli.
- Artemis III aday bölgeleri (NASA, Ekim 2024, dokuz bölge) için koordinat yok. Sayısal kaynak: USGS, McClernan 2024, "Down Selected Artemis III Candidate Landing Site Navigational Grids", DOI 10.5066/P1MEQ6UK (CC0, şekil dosyaları; ScienceBase bot kontrolü yüzünden tarayıcıdan indirilmeli). Resimden ölçülmüş kutu kullanılmayacak.

Şefe sorular:

1. Ciddi bir DEM ve görüntü araştırması: kutup için hangi ürünler (PGDA 90'ın 20 m / 10 m / 5 m haritaları, LROC WAC kutup mozaiği, LROC NAC güney kutbu mozaiği, ShadowCam), çözünürlük, kapsam, boyut, lisans ve tarayıcıya nasıl parçalı (tile) sunulacağı.
2. Bu işin fazlara bölünmesi: önerimiz (a) tam ekran 3B Ay sahnesi, (b) yüksek çözünürlüklü veri ve tile sunumu, (c) Artemis III bölgeleri ve aday alanlar, (d) zamana göre gölge ve Dünya görünürlüğü.
3. 13.1'deki karar (gölge tarayıcıda) bu ölçekte de geçerli mi, yoksa gölge haritaları sunucuda mı üretilmeli?

## Kaynaklar

- NASA SVS 4720, CGI Moon Kit: <https://svs.gsfc.nasa.gov/4720>
- NASA GSFC PGDA 90, LOLA güney kutbu haritaları: <https://pgda.gsfc.nasa.gov/products/90>
- NASA NAIF SPICE çekirdekleri: <https://naif.jpl.nasa.gov/pub/naif/generic_kernels/>
- [challenge metni](../challenge/lunar-landing-site-navigator.md)
