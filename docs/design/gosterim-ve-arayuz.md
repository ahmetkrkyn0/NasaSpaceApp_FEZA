# Gösterim ve arayüz

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Zorunlu
- **Karar taslakları:** [ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md), [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [frontend-migrate/DESIGN.md](../../frontend-migrate/DESIGN.md), [kitle stratejisi](../product/audience-strategy.md), [lunar-horizon](../research/lunar-horizon/README.md) (bölüm 10), [explainability-mission-differences](../research/explainability-mission-differences/README.md)
- **Doğrulama:** Arayüz tasarım belgesi Aşama 1'de doğrulanmadı ([ANALIZ-OZETI.md, bölüm 9](../research/ANALIZ-OZETI.md)). Bu dokümandaki arayüz bilgileri doğrudan o belgeden alınmıştır.

## 1. Ne yapıyoruz

Güneş'in ve Dünya'nın ufka göre konumunu gösteren ekranı ve bu ekranın depodaki arayüz tasarımına nasıl oturacağını tanımlıyoruz. Depodaki tasarım, Ay'ın güney kutbu için bir rover rota planlama konsoluna aittir (Kaynak: [DESIGN.md, 0.1](../../frontend-migrate/DESIGN.md)). Görsel dili ve ekran iskeleti korunur; rover ile ilgili içerik çıkarılır, yerine saha ve tarih karşılaştırması gelir.

## 2. Neden

Challenge'ın "yapın" diye yazdığı tek hedef bu: seçilen saha ve tarihte Güneş'in ve Dünya'nın ufka göre konumunu göstermek. Ayrıca gün batımına kalan sürenin açıkça iletilmesini, zaman içindeki değişimin gösterilmesini ve farklı beceri düzeylerine hitap edilmesini istiyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)).

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Ekran iskeleti, bileşenler, metinler | `frontend-migrate/DESIGN.md` | Yaklaşık 3500 satırlık tarif | [DESIGN.md, 0.6](../../frontend-migrate/DESIGN.md) |
| Renk, yazı tipi, hareket değerleri | `frontend-migrate/design-export/` | CSS ve JSON dosyaları | [DESIGN.md, 0.2](../../frontend-migrate/DESIGN.md) |
| Panel yerleşimi | [registry.json](../../frontend-migrate/design-export/registry.json) | 33 panel kaydı | [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md) |
| Hesap sonuçları | Sunucu, `/api` | [ADR-0003](../adr/0003-veri-sozlesmesi.md) yapıları | [ADR-0004](../adr/0004-api-uc-noktalari.md) |

## 4. Hesap nasıl yapılıyor

Bu dokümanda hesap yok; gösterim kuralları var.

### Ekran iskeleti: ne kalır, ne değişir

| Referans arayüzde | Bu projede | Kaynak |
|---|---|---|
| Açılış ve karşılama ekranı | Korunur; ürün adı ve metinler değişir | [DESIGN.md, 2.1](../../frontend-migrate/DESIGN.md) |
| Rover seçim ekranı ("hangar") | Saha ve tarih seçim ekranına dönüşür | [DESIGN.md, 2.1](../../frontend-migrate/DESIGN.md) |
| Üst çubuk, 52 piksel; PLAN ve ANALYZE düğmeleri | Korunur. PLAN senaryo kurma, ANALYZE sonuçları inceleme olur | [DESIGN.md, 3.1](../../frontend-migrate/DESIGN.md), [DESIGN.md, 3.2](../../frontend-migrate/DESIGN.md) |
| Sol bölme, PLAN kipinde görev kurulumu | Senaryo kurulumu: saha, tarih aralığı, direk yüksekliği, panel tipi | [DESIGN.md, 3.2](../../frontend-migrate/DESIGN.md) |
| Orta alan: 2B harita | Korunur. Haritada sahalar ve katmanlar | [DESIGN.md, 3.1](../../frontend-migrate/DESIGN.md) |
| Orta alan: 3B arazi görünümü | Web arayüzünde yapılmaz. 3B görünüm ayrı olarak Unreal Engine ile geliştiriliyor ve sonra birleştirilecek ([ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md)) | [DESIGN.md, 4](../../frontend-migrate/DESIGN.md) |
| Sağ bölme, ANALYZE kipinde dört sekme | Sekmeler yeniden adlandırılır: Sky, Power, Comms, Compare | [DESIGN.md, 5.1](../../frontend-migrate/DESIGN.md) |
| Alt bölme, zaman ekseni | Korunur; zaman çizelgesi bantları buraya gelir | [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `time-axis` |
| Durum şeridi, oynatma denetimi | Korunur; zamanı ileri geri oynatır | [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `playback` |
| Katman seçici ve harita açıklaması | Korunur | [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `layer-picker`, `map-legend` |
| Dünya görünürlüğü paneli (yan çekmecede) | Ana ekrana, Comms sekmesine taşınır | [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `earth-visibility` |
| Kalıcı gölge karşılaştırma paneli | Korunur ([kalici-golge-katmani.md](kalici-golge-katmani.md)) | [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `psr-validation` |
| Veri kaynağı paneli | Korunur; güvenilirlik etiketlerini listeler | [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `layer-provenance` |
| Karşılaştırma panelleri | Senaryo karşılaştırmasına dönüşür ([karsilastirma-ve-aciklama.md](karsilastirma-ve-aciklama.md)) | [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `profile-compare` |
| Rota, güvenlik payı, yeniden planlama, koridor, konum döngüsü, ROS, rover ve LiDAR ile ilgili bütün paneller | Kaldırılır | [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md); [ANALIZ-OZETI.md, bölüm 7.5](../research/ANALIZ-OZETI.md) |
| Isı zarfı paneli | Kaldırılır; yerine isteğe bağlı zemin sıcaklığı ([zemin-sicakligi.md](zemin-sicakligi.md)) | [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `thermal-envelope` |
| Asistan ve görev raporu | İlk sürümde kaldırılır | [DESIGN.md, 5.3](../../frontend-migrate/DESIGN.md), [DESIGN.md, 5.4](../../frontend-migrate/DESIGN.md) |

### Üç giriş kapısı

Ekibin kitle stratejisine göre ürün tek bir hesap motoru üzerine üç giriş kapısı kurar: halk için Keşfet, eğitimciler için Sınıf, mühendisler için Planla. Üçü aynı saha, tarih ve zaman durumunu paylaşır (Kaynak: [kitle stratejisi](../product/audience-strategy.md)).

- Referans tasarım ağırlıkla mühendis kapısına karşılık geliyor; halk ve eğitim kapıları onda yok (Kaynak: [kitle stratejisi](../product/audience-strategy.md), "Ana fikir").
- Halk kapısının ana ekranı gökyüzü görünümüdür: aşağıdaki ufuk şeridi ve zaman çubuğu.
- Eğitim kapısı yeni ekran gerektirmez: önceden ayarlanmış bir durum, bir soru ve bir açıklamadan oluşan hazır görevler aynı gösterimleri kullanır.
- Kitle stratejisinin öncelik sırası: önce ortak motor, gökyüzü görünümü ve zaman çubuğu; sonra karşılaştırma tablosu ve tarih kaydırıcısı; sonra eğitim görevleri.

### Zorunlu gösterimler

**1. Ufuk şeridi (Sky sekmesi).** Yatay eksende yön (kuzeyden doğuya 0 ile 360 derece), dikey eksende yükseklik açısı.

1. Ufuk profili, altı dolu bir siluet çizgisi olarak çizilir (`/api/horizon`).
2. Güneş'in ve Dünya'nın seçilen aralıktaki yolu bu siluetin üzerine çizgi olarak eklenir (`/api/sky-series`).
3. Seçili andaki Güneş ve Dünya, görünen boyutlarıyla birer disk olarak gösterilir.
4. Disk ufkun altındaysa soluk çizilir.

**2. Zaman çizelgesi (alt bölme).** Üç yatay bant: güneşli ya da karanlık, Dünya görünür ya da görünmez, seçili an imleci. Bantlar `/api/events` yanıtındaki pencerelerden çizilir.

**3. Kalan süre göstergesi (haritanın üstündeki bilgi alanı).** Dört değer: "Time to sunset" ya da "Time to sunrise", "Time to Earthset" ya da "Time to Earthrise". Değerler `/api/now` yanıtından okunur. Hata payı varsa saat aralığı olarak yazılır ([olaylar-ve-sureler.md](olaylar-ve-sureler.md)).

**4. Saha ve tarih seçimi (sol bölme, PLAN kipi).** Hazır saha listesi (`/api/sites`), haritaya tıklayarak ya da elle koordinat girişi, başlangıç tarihi ve süre.

### Tasarım ilkeleri

Referans tasarımın kendi kuralları korunur (Kaynak: [DESIGN.md, 1.1](../../frontend-migrate/DESIGN.md)):

- Yüzeyler düz ve opak; bulanıklık ve gölgeyle derinlik verilmez.
- Köşe yuvarlaklığı 2 piksel.
- Eş aralıklı yazı tipi yalnızca ölçülen veri içindir: koordinat, saat, açı.
- Renk hiçbir zaman tek bilgi taşıyıcı değildir. Bu projede karşılığı: güneşli ve karanlık bantlar renge ek olarak desenle, görünür ve görünmez diskler dolu ve boş çizimle ayrılır.
- En küçük yazı boyutu 12 piksel.

### Güvenilirlik etiketi

Her sonuç bir `validity` değeri taşır ([ADR-0003](../adr/0003-veri-sozlesmesi.md)). Arayüzde sonucun yanında küçük bir etiket olarak gösterilir:

| `validity` | Etiket metni | Ne zaman |
|---|---|---|
| `MEASURED` | Measured | Resmi koordinat, yükseklik haritası |
| `MODEL` | Model | Güneş ve Dünya konumu |
| `DERIVED` | Derived | Arazi ufkuyla bulunan olaylar, güç |
| `SYNTHETIC` | Assumed | Düz ufuk, varsayılan panel değeri |

Referans arayüz aynı dört değeri ve aynı sıralamayı kullanıyor (Kaynak: [net-types.ts](../../frontend-migrate/design-export/api-contract/types/net-types.ts), `Validity`).

## 5. Girdi ve çıktı

### Girdi

Kullanıcının seçtikleri bir `Scenario` oluşturur ([ADR-0003](../adr/0003-veri-sozlesmesi.md)): saha, tarih aralığı, direk yüksekliği, panel profili.

### Çıktı

Arayüzün çağırdığı uç noktalar ([ADR-0004](../adr/0004-api-uc-noktalari.md)):

| Gösterim | Uç nokta | Yapı |
|---|---|---|
| Saha listesi | `/api/sites` | `Site` dizisi |
| Ufuk şeridi | `/api/horizon`, `/api/sky-series` | `HorizonProfile`, `SkySeries` |
| Zaman çizelgesi | `/api/events` | `EventList` |
| Kalan süre | `/api/now` | `NowStatus` |
| Güç eğrisi | `/api/power` | `PowerSeries` |
| Karşılaştırma | `/api/compare` | `CompareResponse` |
| Harita katmanları | `/api/layers/{name}` | İkili dizi |

Açılış sırası referans arayüzle aynıdır: önce `/api/health`, sonra saha listesi, sonra harita katmanları (Kaynak: [DESIGN.md, 6.4](../../frontend-migrate/DESIGN.md)).

## 6. Arayüzde nerede görünür

Bu dokümanın tamamı arayüzle ilgilidir; yerleşim 4. bölümdeki tabloda.

## 7. Bilinen sınırlar

- **Referans arayüz başka bir ürün için tasarlandı.** Panellerin çoğu rota planlamaya ait; kaldırılanlar çıkınca sağ bölmenin içeriği yeniden yazılmalı.
- **3B görünüm ayrı bir uygulama.** Birleştirme yapılana kadar web arayüzünde 3B arazi yok; demo iki parçalı olur.
- **Ufuk şeridi referans tasarımda yok.** Yeni bir bileşen; görsel değerleri tasarım belgesindeki renk ve yazı kurallarından türetilmeli.
- **Tasarım belgesinin kaynağı olan özgün tasarım dosyası depoda yok** (Kaynak: [DESIGN.md, 2.1](../../frontend-migrate/DESIGN.md)). Belirsiz kalan yerlerde belgedeki ekran görüntüleri esas alınır.
- **Dar ekran düzeni** referansta 980 pikselin altında tek sütuna iniyor (Kaynak: [DESIGN.md, 3.1](../../frontend-migrate/DESIGN.md)); bu projede sınanmadı.

## 8. Varsayımlar ve açık kararlar

- Öneri: Arayüz dili İngilizce. Teslim kılavuzu slaytların İngilizce olmasını, videonun da İngilizce altyazı taşımasını şart koşuyor (Kaynak: [teslim kılavuzu](../challenge/project-submission-guide.pdf)); referans arayüzün kokpiti de İngilizce (Kaynak: [DESIGN.md, 5.5](../../frontend-migrate/DESIGN.md)).
- Öneri: NASA logosu ve işaretleri arayüzde kullanılmaz. NASA'nın amblemi ve logosu kamu malı değildir ve yasayla korunur (doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 67). Teslim kılavuzu da yapay zeka ile üretilen içerikte NASA markasının kullanılmasını yasaklıyor (Kaynak: [teslim kılavuzu](../challenge/project-submission-guide.pdf)).
- Karar (14 Kasım 2026): 3B arazi görünümü web arayüzünde yapılmaz. Bir ekip üyesi Unreal Engine ile ayrı olarak geliştiriyor; web arayüzüyle birleştirme sonraya bırakıldı ([ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md)).
- Açık karar: Birleştirme yöntemi. Öneri: 3B görünüm de aynı sunucudan beslenir (`/api/sites`, `/api/horizon`, `/api/sky-series`); böylece Güneş ve Dünya iki görünümde aynı yerde durur.
- Unreal tarafı için not: Cesium ile Ay arazisi kurulumu ve çarpışma ayarı hakkında bağımsız kaynak notları [dogrulama/rover-modelleme.md](../research/dogrulama/rover-modelleme.md), No 3, 37 ve 38 satırlarında; bu satırların etiketi "kısmen doğru" ya da "kaynağı yok" olduğu için not sütunundaki Cesium belgeleri esas alınmalı.
- Açık karar: Üç kapı ayrı sayfalar mı, tek sayfada bir anahtar mı olacak ([karsilastirma-ve-aciklama.md](karsilastirma-ve-aciklama.md); kitle stratejisinde de açık soru).
- Dil: Kitle stratejisi eğitim kapısı için Türkçe ve İngilizce istiyor. Öneri: ilk sürüm İngilizce; Türkçe metinler eğitim görevleriyle birlikte eklenir.
- Varsayım: Sekme adları (Sky, Power, Comms, Compare) ekibin önerisidir.

## 9. Kaynaklar

- [frontend-migrate/DESIGN.md](../../frontend-migrate/DESIGN.md), bölüm 0, 1.1, 1.10, 2, 3, 5 ve 6
- [registry.json](../../frontend-migrate/design-export/registry.json)
- [net-types.ts](../../frontend-migrate/design-export/api-contract/types/net-types.ts)
- [teslim kılavuzu](../challenge/project-submission-guide.pdf)
