# Güney kutbu için DEM ve görüntü verisi: ne var, ne işe yarar, tarayıcıya nasıl gelir

| Alan | Değer |
|------|-------|
| Konu | [3b-gorev-gorunumleri.md](../design/3b-gorev-gorunumleri.md) bölüm 14'teki 1. ve 3. soru: kutup için hangi yükseklik ve görüntü ürünleri var, hangisi kullanılmalı, tarayıcıya nasıl sunulmalı |
| Tarih | 15 Kasım 2026 |
| Kapsam | Yalnızca veri araştırması. Bu belge hiçbir kodu değiştirmez ve 15 Kasım teslimine girmez |
| Yöntem | Ürün sayfaları okundu; NASA dosyalarının başlıkları ve Mons Mouton çevresindeki küçük pencereler `rasterio` ile ağ üzerinden okundu (dosyalar indirilmedi) |

Her satırın yanında nasıl doğrulandığı yazılıdır: **sayfa** (ürün sayfasında yazıyor), **başlık** (dosyanın başlığından okundu), **ölçüm** (dosyadan pencere okunup hesaplandı), **doğrulanmadı** (bu çalışmada bakılmadı).

## İçindekiler

1. Özet ve öneri
2. Yükseklik ürünleri
3. Sahalarımız hangi ürünün içinde
4. Daha ince harita daha çok ayrıntı mı
5. Görüntü ürünleri
6. Tarayıcıya sunum
7. Gölge: tarayıcıda mı, sunucuda mı
8. Atıf ve kullanım koşulları
9. Açık kalanlar
10. Önerilen sıra ve iş yükü
11. Ölçümlerin yeniden üretilmesi

## 1. Özet ve öneri

1. **Yeni bir parça (tile) piramidi üretmeye gerek yok.** PGDA 90 dosyaları bulut için düzenlenmiş GeoTIFF'tir: 512 x 512 bloklu, sıkıştırılmış ve içinde hazır küçültülmüş katmanlar taşır. 20 m haritada 40, 80, 160, 320, 640 ve 1280 m katmanları dosyanın içindedir (başlık). Sunucu istenen pencereyi istenen katmandan doğrudan okuyabilir.
2. **QuickMap hissi için gereken şey daha ince veri değil, eldeki 20 m verinin kademeli sunumu.** Mons Mouton çevresinde 20 m haritanın etkin çözünürlüğünün ortancası 19,7 m; 10 m haritada 18,2 m (ölçüm, bölüm 4). 10 m ürün dört kat veri getirir, gerçek ayrıntıyı yaklaşık yüzde 8 artırır.
3. **5 m saha haritaları iniş hedefimizi kapsamıyor.** "Site20 Leibnitz beta plateau" haritasının genişletilmiş sürümü kutup izdüşümünde y = 131 km'de bitiyor; IM-2 hedef noktası y = 138,4 km'de (başlık ve hesap, bölüm 3). Mons Mouton için kullanılabilecek en ince ürün 10 m'dir.
4. **Fotoğraf mozaiği ikinci planda kalmalı.** 1 m'lik NAC güney kutbu mozaiği 85,5° G'den kutba kadardır; Mons Mouton hedefi (84,78° G) dışında kalır. Mozaik denetimsizdir (yükseklik haritasına bağlanmamıştır) ve tek bir aydınlatmayı taşır; ürünün seçili an için hesapladığı aydınlatmayla çelişir.
5. **Önerilen yol:** sunucuya NASA dosyasının kendi katmanlarından pencere okuyan bir parça uç noktası; tarayıcıda kamera uzaklığına göre parça seçen dörtlü ağaç; görüntü olarak yükseklikten seçili an için hesaplanan aydınlatma. Gölge için bölüm 7'deki yön açısına göre ufuk haritası.

## 2. Yükseklik ürünleri

### 2.1 PGDA 90: "A New View of the Lunar South Pole from LOLA"

Kaynak: <https://pgda.gsfc.nasa.gov/products/90>. Bütün dosyalar güney kutbu stereografik izdüşümünde, metre biriminde, `MOON_ME` çerçevesinde ve DE421 ile üretilmiştir (sayfa). Dosya adresi: `https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/<dosya>`.

| Kapsam | Hücre | Yükseklik dosyası (`LDEM_…_ADJ.TIF`) | Boyut | Izgara | İçindeki hazır katmanlar |
|---|---|---|---|---|---|
| 83° G'den kutba | 10 m | `LDEM_83S_10MPP_ADJ` | 4,8 GB (sayfa) | 43 280 x 43 280 (başlık) | 2, 4, …, 128 kat (başlık) |
| 80° G'den kutba | 20 m | `LDEM_80S_20MPP_ADJ` | 2,6 GB (sayfa) | 30 400 x 30 400 (başlık) | 2, 4, …, 64 kat (başlık) |
| 80° G'den kutba | 40 m | `LDEM_80S_40MPP_ADJ` | 685 MB (sayfa) | doğrulanmadı | doğrulanmadı |
| 80° G'den kutba | 80 m | `LDEM_80S_80MPP_ADJ` | 181 MB (sayfa) | 7 600 x 7 600 (başlık) | 2, 4, 8, 16 kat (başlık) |
| 75° G'den kutba | 30 m | `LDEM_75S_30MPP_ADJ` | 2,7 GB (sayfa) | doğrulanmadı | doğrulanmadı |
| 60° G'den kutba | 60 m | `LDEM_60S_60MPP_ADJ` | 2,9 GB (sayfa) | doğrulanmadı | doğrulanmadı |
| 60° G'den kutba | 120 m | `LDEM_60S_120MPP_ADJ` | 785 MB (sayfa) | doğrulanmadı | doğrulanmadı |
| 60° G'den kutba | 240 m | `LDEM_60S_240MPP_ADJ` | 210 MB (sayfa) | doğrulanmadı | doğrulanmadı |

Başlığı okunan dört dosyanın ortak yapısı: `float32`, boş değer `NaN`, 512 x 512 blok, deflate sıkıştırma, izdüşüm `+proj=stere +lat_0=-90 +lon_0=0 +R=1737400`. 80° G dosyalarının sınırı her yönde 304 km, 83° G dosyasının 216,4 km (başlık).

Aynı ızgarada gelen yardımcı dosyalar (sayfa; boyutlar 20 m ürünü için):

| Dosya | İçerik | Boyut | Bizim için |
|---|---|---|---|
| `LDSM_…` | eğim | 3,6 GB | eğim katmanı (bugün de kullanılıyor) |
| `LDEM_…_HILL` | kabartma gölgelendirmesi | 1,3 GB | sabit ışıklı kabartma katmanı |
| `LDEC_…` | hücredeki LOLA ölçüm sayısı | 1,3 GB | hücrenin ölçüm mü ara değer mi olduğunu söyler |
| `LDEM_…_EFFRES` | etkin çözünürlük | 3,8 GB | ekrandaki ayrıntının gerçek olup olmadığını söyler (bölüm 4) |
| `LDEM_…_ERR` | yükseklik belirsizliği | 3,7 GB | geçerlilik etiketi için |
| `LPSR_80S_20MPP_ADJ` | kalıcı gölgeli bölgeler | 148 MB | bugün de kullanılıyor |

### 2.2 PGDA 78: 5 m saha haritaları

Kaynak: <https://pgda.gsfc.nasa.gov/products/78>, "High-Resolution LOLA Topography for Lunar South Pole Sites"; açıklama dosyası `https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README`. Aday iniş sahaları için ayrı ayrı 5 m haritalar: yükseklik (`*_surf.tif`), ölçüm sayısı, eğim ve belirsizlikleri (sayfa).

| Saha | Dosya | Izgara | Sınırlar (kutup izdüşümü, km) | Boyut |
|---|---|---|---|---|
| Site20, Leibnitz beta plateau | `Site20/Site20_final_adj_5mpp_surf.tif` | 3 200 x 3 200 (başlık) | x 65 ile 81, y 110 ile 126 (başlık) | 41 MB (başlık) |
| Site20v2, genişletilmiş | `Site20v2/Site20v2_final_adj_5mpp_surf.tif` | 5 200 x 5 200 (başlık) | x 60 ile 86, y 105 ile 131 (başlık) | 108 MB (başlık) |

Bu dosyalar bulut için düzenlenmemiştir: sıkıştırma yok, satır satır yazılmış, içinde küçültülmüş katman yok (başlık). Kullanılacaksa tamamı indirilir. Sayfadaki öteki sahalar (Connecting ridge, Shackleton rim, Nobile rim, Malapert massif, Haworth, Shoemaker ve diğerleri) bu çalışmada tek tek incelenmedi.

### 2.3 Tüm Ay: NASA SVS 4720 "CGI Moon Kit"

Kaynak: <https://svs.gsfc.nasa.gov/4720> (sayfa). Eş dikdörtgen izdüşümde yükseklik haritaları:

| Dosya | Izgara | Hücre (ekvatorda) | Boyut |
|---|---|---|---|
| `ldem_4_uint.tif` | 1 440 x 720 | yaklaşık 7,6 km | 2,0 MB |
| `ldem_16_uint.tif` | 5 760 x 2 880 | yaklaşık 1,9 km | 31,7 MB |
| `ldem_64_uint.tif` | 23 040 x 11 520 | yaklaşık 474 m | 506,3 MB |

`uint` dosyaları yarım metre birimindedir; kayan noktalı sürümler 1737,4 km'ye göre kilometredir. Sayfa bu haritaların görünüm için hazırlandığını söyler: "optimized for aesthetics, not science. Scientific applications should use the source data". Kürede kabartı çizimi için uygundur; hesapta kullanılmaz.

### 2.4 PGDA 69: kutup aydınlanma ürünleri

Kaynak: <https://pgda.gsfc.nasa.gov/products/69> (sayfa). Ortalama güneş aydınlanması, kalıcı gölge, Dünya görünürlüğü ve gök görünürlüğü haritaları; 240, 120 ve 60 m. Güney kutbunda 240 m ürünü 65° G'den, 120 m ürünü 75° G'den, 60 m ürünü 85° G'den kutba kadardır. Ürün bugün yalnızca T6 karşılaştırmasında kullanılıyor. Dünya görünürlüğü haritası, arazide "Dünya buradan görünür mü" katmanının (tasarım belgesi 6.3) bağımsız karşılaştırması olabilir; Mons Mouton için kullanılabilecek en ince sürüm 120 m'dir (hedef 85° G'nin kuzeyinde).

## 3. Sahalarımız hangi ürünün içinde

Kutup izdüşümünde konum: `r = 2 R tan((90° + enlem) / 2)`, `x = r sin(boylam)`, `y = r cos(boylam)`, `R = 1737,4 km`.

| Saha | Enlem, boylam | x, y (km) | 10 m (83° G) | 20 m (80° G) | 5 m saha haritası |
|---|---|---|---|---|---|
| Mons Mouton, IM-2 hedef noktası | 84,78° G, 29,13° D | 77,1; 138,4 | içinde | içinde | dışında: Site20v2 y = 131 km'de bitiyor, nokta 7,4 km dışarıda |
| IM-2 Athena iniş noktası | 84,7906° G, 29,1957° D | 77,1; 138,0 | içinde | içinde | dışında (7,0 km) |
| IM-1 Odysseus | 80,13° G, 1,44° D | 7,5; 299,9 | dışında | içinde, sınıra 4 km | yok |
| Chandrayaan-3 | 69,37° G, 32,32° D | hesaplanmadı | dışında | dışında | yok; yalnızca 60° G ürünleri |

Sonuçlar:

- Bugünkü `mons-mouton` bölgesi (hedef çevresinde 20 x 20 km) 10 m haritanın tamamen içindedir.
- "Leibnitz beta plateau" 5 m haritası aynı masifin kutba daha yakın kısmını kapsar; bugünkü bölgemizle yalnızca y = 128,4 ile 131 km arasındaki yaklaşık 2,6 km'lik şeritte örtüşür. Hedef noktada 5 m veri yoktur.
- IM-1 Odysseus 80° G ürününün kenarındadır: sahanın kuzeyindeki arazi bu dosyada yoktur. Ürün ufuk hesabında 60 m ürününü de kullanıyor (README, "NASA Data"); bu saha için hangi dosyanın okunduğu bu çalışmada denetlenmedi. 3B çizimde aynı sınır geçerli olur.

## 4. Daha ince harita daha çok ayrıntı mı

LOLA bir lazer altimetresidir; yüzeyi görüntü gibi kesintisiz değil, yörünge izleri boyunca ölçer. İzlerin arası ara değerle doldurulur. PGDA 90 bu yüzden iki yardımcı harita verir: hücredeki ölçüm sayısı (`LDEC`) ve etkin çözünürlük (`EFFRES`).

IM-2 hedef noktası çevresindeki 20 x 20 km pencerede (ölçüm, 15 Kasım 2026):

| Ölçü | 20 m harita | 10 m harita |
|---|---|---|
| Etkin çözünürlük, ortanca | 19,7 | 18,2 |
| Etkin çözünürlük, yüzde 25 ile 75 arası | 15,3 ile 25,7 | 13,7 ile 26,8 |
| Etkin çözünürlük, yüzde 95 | 41,8 | 46,5 |
| En az bir LOLA ölçümü olan hücrelerin payı | yüzde 50 ile 75 arası (ölçüm sayısının yüzde 25'liği 0, ortancası 1) | yüzde 24 |

Etkin çözünürlük dosyasının birimi başlıkta yazmıyor; değerler metre olarak yorumlandı ve makaleden doğrulanmalı (bölüm 9).

Okuma:

- 10 m haritada hücrelerin dörtte üçünde ölçüm yoktur; değerleri komşu izlerden türetilmiştir.
- Bu bölgede iki haritanın etkin çözünürlüğü neredeyse aynıdır. 10 m ürüne geçmek veri boyutunu dört katına çıkarır (4,8 GB), gerçek ayrıntıyı yaklaşık yüzde 8 artırır.
- Ekranda 10 m ya da 5 m ızgara çizmek, verinin taşımadığı bir kesinlik izlenimi verir. Bu ürünün kuralına göre ([PLAN.md](../PLAN.md) bölüm 4) ya çizilmemeli ya da etkin çözünürlük ekranda yazılmalıdır.

Öneri: çalışma zamanında 20 m ürün kalır. İmleç okumasına "effective resolution here" satırı eklemek, QuickMap'te olmayan ve Validity ölçütüne doğrudan hizmet eden bir ayrıntıdır; bunun için `EFFRES` dosyasından aynı pencere okunur.

## 5. Görüntü ürünleri

| Ürün | Hücre | Kapsam | Yapı | Bizim için |
|---|---|---|---|---|
| LROC WAC küresel mozaik, güney kutbu parçası `WAC_GLOBAL_P900S0000` | 100 m | 60° G'den kutba | tek kutup stereografik parça (sayfa) | uzak ve orta ölçekte yüzey görüntüsü olabilir; boyutu sayfada yok |
| LROC NAC güney kutbu mozaiği `NAC_POLE_SOUTH` | 1 m | 85,5° G'den kutba | 40 kutup stereografik parça, "uncontrolled" (sayfa) | Mons Mouton hedefini kapsamaz; boyutu sayfada yok |
| NASA SVS 4720 renk haritası `lroc_color_poles_8k.tif` | 8 192 x 4 096 | tüm Ay | eş dikdörtgen, 48,3 MB (sayfa) | küre için; bugün 4k sürümü kullanılıyor |
| ShadowCam (Danuri) | doğrulanmadı | kalıcı gölgeli bölgeler | doğrulanmadı | bu çalışmada bakılmadı |

Kaynaklar: <https://data.lroc.im-ldi.com/lroc/view_rdr/WAC_GLOBAL>, <https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_POLE_SOUTH>.

Değerlendirme:

- **Kapsam:** 1 m mozaik 85,5° G'de başlar. Hedefimiz 84,78° G'dedir; mozaik bugünkü bölgemize yetişmez.
- **Konum doğruluğu:** "uncontrolled" mozaik yükseklik haritasına bağlanmamıştır. Yükseklik ağına giydirildiğinde kraterlerin görüntüsü ile kabartısı üst üste oturmayabilir; kayma miktarı bu çalışmada ölçülmedi.
- **Aydınlatma:** kutupta her fotoğraf tek bir Güneş yönünü taşır ve büyük bölümü gölgedir. Ürün seçili an için gölgeyi kendisi hesaplıyor; fotoğraftaki gölge ile hesaplanan gölge aynı ekranda çelişir.
- **QuickMap'in 3B görünümünün hangi arazi kaynağını kullandığı** sayfadan okunamadı (uygulama metin sunmuyor); doğrulanmadı.

Öneri: yakın ölçekte "görüntü" olarak yükseklik haritasından seçili an için hesaplanan aydınlatma kullanılır (dalda bugün yapılan budur). WAC 100 m parçası, uzak ve orta ölçekte yüzey tonu için isteğe bağlı bir katman olarak sonraya bırakılır ve "single lighting, not the selected moment" notuyla gösterilir. NAC mozaiği kapsam dışı kalır.

## 6. Tarayıcıya sunum

### 6.1 Seçenekler

| Seçenek | Nasıl | Artısı | Eksisi |
|---|---|---|---|
| A. Sabit iç içe ızgaralar (dalda bugün) | Bölge başına tek dosya: kutup başlığı 320 m, Mons Mouton 40 m | Basit; temiz kopyada çalışır | Ayrıntı yakınlaştıkça artmaz; 80 m kutup haritası tek ağ olarak çizilemez (7 600 x 7 600) |
| B. İstek üzerine parça, NASA dosyasının kendi katmanlarından | Sunucu, istenen katmandan 256 x 256'lık pencereyi `rasterio` ile okur | Ön üretim yok; değerler NASA'nın kendi küçültmesidir, yeniden örnekleme bize ait değil; sunucu zaten `rasterio` kullanıyor | Tam çözünürlük için 2,6 GB dosyanın yerelde olması gerekir |
| C. Önceden üretilmiş parça piramidi | Betik bütün parçaları üretip diske yazar | Sunucusuz barındırılabilir | Yaklaşık 19 000 parça (bölüm 6.2); depoya giremez; her veri değişiminde yeniden üretim |

Öneri **B**, temiz kopya için A'nın küçültülmüş dosyalarıyla birlikte: tam dosya yoksa sunucu depodaki kaba katmanları verir ve yanıtta en ince katmanın hangisi olduğunu söyler.

Sunucunun parçayı çalışma zamanında NASA adresinden okuması teknik olarak mümkündür (bu çalışmadaki bütün okumalar öyle yapıldı), ama önerilmez: ürünün çalışırken dış hizmete bağlanmama kuralını bozar ve her parça birkaç ağ isteğine dönüşür. İndirme bugünkü gibi betikle, bir kez yapılır.

### 6.2 Parça düzeni (B seçeneği)

20 m dosyanın hazır katmanları ve her katmanın 256 x 256'lık parça sayısı:

| Katman | Hücre | Izgara | Parça (kenar başına) |
|---|---|---|---|
| 0 | 20 m | 30 400 | 119 |
| 1 | 40 m | 15 200 | 60 |
| 2 | 80 m | 7 600 | 30 |
| 3 | 160 m | 3 800 | 15 |
| 4 | 320 m | 1 900 | 8 |
| 5 | 640 m | 950 | 4 |
| 6 | 1 280 m | 475 | 2 |

- Parça adresi: `/api/terrain-tiles/{product}/{level}/{row}/{col}`; `level` dosyanın kendi katmanıdır, parça o katmanın hizalı 256 x 256'lık bloğudur. Böylece hiçbir değer bizim tarafımızdan yeniden örneklenmez.
- Bütün katmanların toplamı yaklaşık 19 000 parçadır (119² + 60² + 30² + 15² + 8² + 4² + 2²); C seçeneğinin maliyeti budur. B'de hiçbiri önceden üretilmez.
- Ham parça 256 x 256 `float32`, 262 kB. Yarım metre adımlı 16 bit tam sayıya çevrilirse 131 kB; yükseklik aralığı buna sığar. Sıkıştırılmış boyut ölçülmedi.
- Komşu parçaların birleşmesi için her parça bir satır ve bir sütun fazlasıyla (257 x 257) okunur.
- Sözleşme değişikliğidir: `docs/adr/` altına yazılır ve `CONTRACT` mesajıyla duyurulur.

### 6.3 Tarayıcı tarafı

- Dörtlü ağaç: kamera uzaklığına ve ekrandaki hataya göre katman seçilir; kaba parça ekrandayken ince parça gelir, gelince yerini alır.
- Parçanın köşe noktaları kutup izdüşümünden küreye dalda zaten var olan `unprojectUnit` ile taşınır; yeni bir izdüşüm kodu gerekmez.
- Komşu katmanlar arasındaki yırtık için kenar etekleri (tasarım belgesi, risk 3).
- Yakın çekimde sayı hassasiyeti için sahne kökeninin hedefe taşınması (tasarım belgesi, risk 2).
- Görünmeyen parçaların bellekten atılması; aynı anda ekranda birkaç on parça olur.
- three.js'te hazır bir arazi parça yöneticisi yoktur. Hazır kütüphane kullanımı yeni bir bağımlılıktır ve ekip kararı gerektirir ([AGENTS.md](../../AGENTS.md)); bu çalışmada kütüphane değerlendirilmedi.

## 7. Gölge: tarayıcıda mı, sunucuda mı

Tasarım belgesindeki karar 13.1 açık duruyor. Parçalı sunum bu soruyu değiştirir: bir parçadaki noktanın gölgesi, 150 km'ye kadar uzaktaki arazi tarafından belirlenir. Tarayıcıda yürüyüş için o uzaklıktaki parçaların da yüklenmiş olması gerekir; ölçek büyüdükçe bu ağırlaşır. Dalın kendi ölçümü 251 x 251 ağ için 136 ile 370 ms'dir.

| Seçenek | Nasıl | Zaman çubuğunda | Kurala uyum |
|---|---|---|---|
| Tarayıcıda yürüyüş (dalda bugün) | Her nokta için Güneş yönüne arazi yürüyüşü | her adımda yeniden hesap | [PLAN.md](../PLAN.md) 4.1 kural 2'ye istisna gerekir |
| Sunucuda anlık gölge maskesi | Her an için sunucu maske üretir | her adımda ağ isteği | uyar |
| Yön açısına göre ufuk haritası | Sunucu bir kez, her hücre ve her yön açısı için ufuk açısını hesaplayıp saklar. Tarayıcı yalnızca "Güneş'in yüksekliği bu yöndeki ufuk açısından büyük mü" karşılaştırmasını yapar | anında; ağ isteği yalnızca yön açısı dilimi değişince | uyar: hesap sunucuda, tarayıcıda karşılaştırma |

Üçüncü seçenek, sunucunun saha ufukları için zaten kullandığı yöntemin ızgaraya yayılmış halidir ([ufuk-hesabi.md](../design/ufuk-hesabi.md)); aynı kod kullanılır ve T6'daki yaklaşık karşılaştırma ızgara için de yapılabilir. Kaba boyut hesabı: 20 x 20 km bölge, 40 m hücre (500 x 500), 1° adımla 360 yön açısı, hücre başına 2 bayt: 180 MB; tarayıcıya bir an için gereken iki dilim 1 MB. Hesap süresi ölçülmedi.

Öneri: küçük ölçekte (bugünkü 20 x 20 km) dalın tarayıcı yürüyüşü, sunucuyla karşılaştırma (tasarım belgesi G7) ekranda olduğu sürece kalabilir. Parçalı ölçeğe geçilirken ufuk haritasına geçilir. İkisi için de karar ekibindir; bu belge yalnızca seçenekleri ve maliyeti verir.

## 8. Atıf ve kullanım koşulları

| Ürün | Sayfanın istediği |
|---|---|
| PGDA 90 | "Please cite this paper when using these products": Barker ve diğerleri 2023, Planetary Science Journal 4, 183, DOI 10.3847/PSJ/acf3e1; veri DOI 10.60903/gsfcpgda-lola-spole. Sayfa lisans metni vermez; NASA'nın genel kullanım yönergesine bağlanır |
| PGDA 78 | Barker ve diğerleri 2021, Planetary and Space Science 203, 105119, DOI 10.1016/j.pss.2020.105119; saha numaraları Mazarico ve diğerleri 2011 |
| PGDA 69 | Mazarico ve diğerleri 2011, Icarus 211, 1066 |
| LROC WAC küresel mozaik | Speyerer ve diğerleri 2011, LPSC özeti 2387; 2014 güncellemesi için Wagner ve diğerleri 2015. Sayfada lisans metni yok |
| LROC NAC güney kutbu mozaiği | Wagner ve diğerleri 2015, LPSC özeti 1473. Sayfada lisans metni yok |
| NASA SVS 4720 | "NASA's Scientific Visualization Studio" atfı |

Yeni kullanılan her dosya, kullanılmadan önce `frontend/public/media/CREDITS.md` ya da README "Data Sources" tablosuna bu atıfla yazılır.

## 9. Açık kalanlar

| Konu | Neden önemli | Nasıl kapanır |
|---|---|---|
| `EFFRES` dosyasının birimi ve tanımı | bölüm 4'teki sayıların yorumu buna bağlı | Barker ve diğerleri 2023'ten okunur |
| Haritalar DE421 `MOON_ME` çerçevesinde; ürün konumları DE440 ile hesaplıyor | iki çerçeve arasındaki fark arazi ile hesaplanan yönler arasında kaymaya dönüşür; büyüklüğü bu çalışmada ölçülmedi ve depoda bir not bulunamadı | iki çerçevede aynı noktanın konumu SPICE ile karşılaştırılır; sonuç ADR-0002'ye yazılır |
| NAC mozaiğinin yükseklik haritasına göre kayması | görüntü giydirme kararı | bilinen bir kraterde iki üründe konum karşılaştırılır |
| WAC ve NAC dosya boyutları, 40 m ve 60° G dosyalarının başlıkları | indirme ve disk planı | başlık okunur (bölüm 11) |
| ShadowCam ürünleri | kalıcı gölgeli bölgelerin içi; KASA bu yılın ortak ajanslarından | ayrı araştırma |
| Sunucunun yerel dosyadan parça okuma süresi, parçaların sıkıştırılmış boyutu | B seçeneğinin gerçek maliyeti | 2,6 GB dosya indirilip ölçülür |
| Artemis III aday bölgelerinin koordinatları | tasarım belgesi bölüm 14 | USGS veri yayını (DOI 10.5066/P1MEQ6UK); bu belgenin kapsamı dışında |

## 10. Önerilen sıra ve iş yükü

Süreler kaba tahmindir; review turları dahil, tek kişinin iş günü olarak.

| Adım | İş | Tahmin | Bağlı olduğu |
|---|---|---|---|
| D1 | Açık kalan iki bilimsel soru: `EFFRES` tanımı, DE421 ile DE440 farkı | yarım gün | yok |
| D2 | Sunucuda parça uç noktası (B), kaba katman yedeği, sözleşme ve ADR, testler | 1 gün | D1 |
| D3 | Tarayıcıda dörtlü ağaç, kenar etekleri, köken taşıma, bellek yönetimi | 2 ile 3 gün | D2 |
| D4 | İmleç okumasına etkin çözünürlük ve ölçüm sayısı | yarım gün | D2 |
| D5 | Ufuk haritası ve gölge katmanı (karar 13.1'e göre) | 1 ile 1,5 gün | D2 |
| D6 | Doğrulama raporuna yeni denetimler, README ve atıflar | yarım gün | D3, D5 |

Toplam 5,5 ile 7 iş günü. Tam ekran sahne, iniş canlandırması, dönüşler ve Artemis bölgeleri (tasarım belgesi A2, A6, A7, A8 ve bölüm 14 madde c) bu toplamın dışındadır.

10 m ürününe, 5 m saha haritalarına ve NAC mozaiğine geçiş bu sıraya alınmadı: bölüm 3, 4 ve 5'teki bulgulara göre Mons Mouton için ya kapsam dışındalar ya da gerçek ayrıntı eklemiyorlar.

## 11. Ölçümlerin yeniden üretilmesi

Başlık okuma (dosya indirilmez; yalnızca başlık için ağ isteği yapılır):

```python
import rasterio

url = "https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ.TIF"
with rasterio.open(url) as ds:
    print(ds.width, ds.height, ds.dtypes[0], ds.nodata)
    print(ds.res, ds.bounds, ds.block_shapes[0], ds.compression, ds.overviews(1))
```

Etkin çözünürlük penceresi (IM-2 hedef noktası çevresinde 20 x 20 km):

```python
import numpy as np
import rasterio
from rasterio.windows import from_bounds

x, y, half = 77_100.0, 138_400.0, 10_000.0
url = "https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ_EFFRES.TIF"
with rasterio.open(url) as ds:
    a = ds.read(1, window=from_bounds(x - half, y - half, x + half, y + half, ds.transform))
print(np.percentile(a[np.isfinite(a)], [5, 25, 50, 75, 95]))
```

Aynı pencere `LDEM_83S_10MPP_ADJ_EFFRES.TIF`, `LDEC_80S_20MPP_ADJ.TIF` ve `LDEC_83S_10MPP_ADJ.TIF` için de okundu. Ürün sayfaları 15 Kasım 2026 tarihinde okundu.

## Kaynaklar

- NASA GSFC PGDA 90, LOLA güney kutbu haritaları: <https://pgda.gsfc.nasa.gov/products/90>
- NASA GSFC PGDA 78, 5 m saha haritaları: <https://pgda.gsfc.nasa.gov/products/78>
- NASA GSFC PGDA 69, kutup aydınlanması: <https://pgda.gsfc.nasa.gov/products/69>
- NASA SVS 4720, CGI Moon Kit: <https://svs.gsfc.nasa.gov/4720>
- LROC WAC küresel mozaik: <https://data.lroc.im-ldi.com/lroc/view_rdr/WAC_GLOBAL>
- LROC NAC güney kutbu mozaiği: <https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_POLE_SOUTH>
- [3b-gorev-gorunumleri.md](../design/3b-gorev-gorunumleri.md), [ufuk-hesabi.md](../design/ufuk-hesabi.md), [PLAN.md](../PLAN.md)
