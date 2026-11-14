# Araştırma Analiz Özeti

- **Tarih:** 14 Kasım 2026
- **Durum:** Aşama 1 çıktısı. 14 Kasım 2026'da onaylandı; kapsam kararları bölüm 7.5 ve 10'da
- **Kapsam:** `docs/research/` altındaki 21 dosya (11 not, 7 PDF, 2 sunum, 1 hesap arşivi)
- **Ekler:** Her iddianın etiketi ve kanıtı [dogrulama/](dogrulama/) klasöründe, konu başına bir dosyada

> **Teslim saati:** 15 Kasım 2026 Pazar 23:59 (yerel saat). Kaynak: `docs/challenge/project-submission-guide.pdf`. Bu özetteki risk değerlendirmeleri kalan süreye göre yapıldı.

## İçindekiler

1. [Kısa sonuç](#1-kısa-sonuç)
2. [Bu çalışma nasıl yapıldı](#2-bu-çalışma-nasıl-yapıldı)
3. [Okunan dosyalar](#3-okunan-dosyalar)
4. [Doğrulama sonuçları: genel tablo](#4-doğrulama-sonuçları-genel-tablo)
5. [Konu konu bulgular](#5-konu-konu-bulgular)
6. [Düzeltilmesi gerekenler](#6-düzeltilmesi-gerekenler)
7. [Konuların challenge'a göre sınıflandırılması](#7-konuların-challengea-göre-sınıflandırılması)
8. [Belgeler arası çelişkiler](#8-belgeler-arası-çelişkiler)
9. [Araştırmada eksik kalanlar](#9-araştırmada-eksik-kalanlar)
10. [Onaylanan kapsam ve Aşama 2](#10-onaylanan-kapsam-ve-aşama-2)

### Bu belgede geçen terimler

| Terim | Anlamı |
|---|---|
| Efemeris | Güneş'in, Dünya'nın ve Ay'ın belirli bir andaki konumunu veren hesap ya da tablo |
| Horizons ve SPICE | NASA'nın bu konumları hesaplayan iki aracı. Horizons bir internet servisi, SPICE bir kütüphane |
| Ufuk maskesi | Bir noktadan bakıldığında arazinin her yönde ufku ne kadar yükselttiğini gösteren liste |
| Yükseklik haritası | Arazinin her noktasının yüksekliğini veren harita. Notlarda DEM diye geçiyor |
| Doğrudan iletişim | Aracın röle uydusu olmadan Dünya ile konuşması. Notlarda DTE diye geçiyor |
| Mons Mouton | Ay'ın güney kutbu yakınında bir dağ. Ekibin test sahası |
| PGDA | NASA'nın gezegen verileri arşivi. Ürünler numarayla anılıyor (örneğin PGDA 90) |

## 1. Kısa sonuç

1. **844 iddia tek tek kontrol edildi.** 555 tanesi doğrulandı (yüzde 66), 101 tanesi kısmen doğru, 9 tanesi yanlış, 116 tanesinin kaynağı yok, 63 tanesi doğrulanamadı.
2. **Ürünün zorunlu kısmını taşıyan hesaplar sağlam.** Ekibin Güneş ve Dünya konum kodu, ufuk hesabı yöntemi ve güneş paneli ön hesabı NASA araçlarıyla baştan hesaplandı ve tuttu. Bu konularda yeni araştırma gerekmiyor; uygulamaya geçilebilir.
3. **Yanlış çıkan iddia çok az ve hiçbiri çekirdek hesabı bozmuyor.** 9 yanlışın bir kısmı lehimize (örneğin aradığımız saha koordinatları sanıldığının aksine resmi tabloda var).
4. **Asıl zayıflık anlatımda.** Sunum dosyalarına girmiş çarpıcı sayıların ve örneklerin bir kısmı kaynakta yok ya da yanlış örnekle anlatılmış. Jüri önüne çıkmadan düzeltilmeli (bölüm 6.2).
5. **Kaynak göstermeyen iddialar iki belgede toplanıyor:** rover modelleme notu (41 iddianın 24'ü) ve rover konumlama notu (83 iddianın 19'u). Bu iki belge ürünün zorunlu kısmına girmiyor.
6. **Araştırma, challenge'ın istediğinden çok daha geniş.** Rover simülasyonu, rover konumlama, sıcaklık modeli ve araç modelleri challenge'da yok. Değer katabilirler ama hepsi yüksek riskli ve kalan süre kısa. Rover konuları bu yüzden kapsamdan çıkarıldı.
7. **En büyük boşluk araştırmanın dışında.** Hesap tarafı hazır; ekran tasarımı, arayüz teknolojisi ve ortak veri biçimi için karar yok. Dört belge dört ayrı dosya biçimi öneriyor ve karar klasörü (`docs/adr/`) boş.
8. **Karar (14 Kasım 2026):** Rover ile ilgili bütün konular, batarya ve kapsam dışı konular projeden çıkarıldı. Arayüz web tabanlı olacak ve `frontend-migrate/DESIGN.md` belgesindeki tasarım esas alınacak. Kalan ekstra özelliklerin hepsi için proje dokümanı yazılacak. Araştırma notlarındaki hatalar düzeltildi. Ayrıntı bölüm 6, 7.5 ve 10'da.

## 2. Bu çalışma nasıl yapıldı

1. `docs/research/` altındaki 21 dosyanın tamamı okundu: 11 not, 7 PDF, 2 sunum ve 1 hesap arşivi.
2. Her nottaki kontrol edilebilir iddialar çıkarıldı: sayılar, tarihler, görev bilgileri, veri adresleri, dosya biçimleri, lisanslar.
3. Her iddia için notun gösterdiği kaynak internetten açıldı ve iddiayla karşılaştırıldı. Hafızadan doğrulama yapılmadı.
4. Ekibin kendi hesabı olan sayılar, ucuzsa yeniden hesaplandı (NASA'nın Horizons aracına aynı sorgu atıldı ya da basit hesap tekrar edildi). Ağır hesaplar tekrar edilmedi.
5. Her konu challenge metnine göre sınıflandırıldı.

Doğrulama, konu başına bir yapay zeka ajanıyla paralel yürütüldü. Ajanların verdiği etiketler ayrı bir betikle yeniden sayıldı. İki bulgu ayrıca bağımsız olarak kontrol edildi: 5 m'lik yükseklik haritasının kapsamı ve Space Apps kılavuzundaki Çin kuralı.

### Etiketlerin anlamı

| Etiket | Anlamı |
|---|---|
| doğrulandı | Gösterilen kaynak açıldı ve iddiayı söylüyor. |
| kısmen doğru | Kaynak iddianın bir kısmını destekliyor; kalan kısım kaynakta yok ya da farklı. |
| yanlış | Kaynak açıldı ve iddiayla çelişiyor. |
| kaynağı yok | Not bu iddia için kaynak göstermiyor. Bağımsız bir kaynağın ne dediği varsa ek dosyada not edildi. |
| doğrulanamadı | Kaynak gösterilmiş ama açılamadı (ücretli, engelli, silinmiş) ya da iddia orada bulunamadı. |

### Sınıfların anlamı

| Sınıf | Anlamı |
|---|---|
| Zorunlu | Challenge doğrudan istiyor. |
| Destekleyici | Zorunlu bir şeyi güçlendiriyor ya da doğruluğunu sağlıyor. |
| Ekstra özellik | Challenge istemiyor ama ürüne değer katıyor. |
| Kapsam dışı | Ürüne katkısı yok; en fazla arka plan bilgisi. |

### Bu çalışmanın sınırları

- Bazı makaleler ücretli olduğu için açılamadı. Bunlara dayanan iddialar "doğrulanamadı" kaldı.
- Bazı siteler otomatik erişimi engelliyor (USGS, Zenodo, bazı haber siteleri). Bunlar elle açılıp kontrol edilebilir.
- Arazi üzerinden ufuk hesabı ve sıcaklık modeli gibi ağır hesaplar tekrar edilmedi.
- "doğrulandı" etiketi, iddianın kaynakta yazdığını gösterir; kaynağın kendisinin hatasız olduğunu göstermez.
- Etiketleri yapay zeka ajanları verdi; bir insan tek tek kontrol etmedi. Ek dosyalarda her satırın yanında açılan adres ve kaynaktan alıntı var. Önemli bir karar tek bir satıra dayanacaksa o satırın kaynağı elle açılıp bakılmalı.

## 3. Okunan dosyalar

| Dosya | Konu | Not |
|---|---|---|
| `csa-moon-exploration.md` | Kanada Uzay Ajansı'nın Ay programı ve diğer ülkelerin görevlerinden dersler | Ana not |
| `Dünyadan Ay Dersleri.pdf` | Aynı notun 8. bölümünün sunumu | Ayrı araştırma değil |
| `zamanda-degisen-veri-hazirlama.md` | Güneş ve Dünya konumu, gölge, olaylar, güç, sıcaklık, veri hattı | Ana not, en kapsamlı belge |
| `Ay’da Zaman Işık, Gölge, Isı.pdf` | Aynı notun sunumu | Ayrı araştırma değil |
| `data-sources/README.md` | Kullanılacak veri kaynaklarının listesi | Ana not |
| `lunar-horizon/README.md` | Atmosfersiz Ay'da ufuk hesabı | Ana not |
| `light-heat-layer/README.md` | Gölge, sıcaklık ve rover rotası mimarisi | Ana not, öneri düzeyinde |
| `solar-panel-model/README.md` | Güneş paneli gücünün hesabı | Ana not |
| `rover-localization/README.md` | Rover konum bulma yöntemleri | Ana not |
| `rover-localization/rover-konumlama-arastirmasi.pdf` | Aynı notun PDF hali | Ayrı araştırma değil |
| `rover-modelleme-ve-unreal-gecis.md` | Unreal Engine ile rover simülasyonu | Ana not |
| `ay-rover-dijital-ikiz.pdf` | Aynı notun PDF hali | Ayrı araştırma değil |
| `ephemeris-rotation-ground-stations/` (PDF, sunum, hesap arşivi, README) | Güneş ve Dünya açıları, araç dönüş açıları, yer istasyonları | Rapor ve çalışan kod |
| `mission-vehicles-models-physics/` (PDF, sunum, README) | Görev araçları, 3B modeller, lisanslar, fiziksel ölçüler | Rapor |
| `explainability-mission-differences/` (PDF, README) | Görevler arasındaki farkların nedenleri ve açıklama yöntemleri | Rapor, 37 sayfa |

## 4. Doğrulama sonuçları: genel tablo

Sayılar, ek dosyalardaki tablolardan yeniden sayıldı. Her satırın ayrıntısı ilgili ek dosyada.

| Konu | Toplam | Doğrulandı | Kısmen doğru | Yanlış | Kaynağı yok | Doğrulanamadı | Ek dosya |
|---|---:|---:|---:|---:|---:|---:|---|
| Zamanla değişen verinin hazırlanması | 121 | 86 | 12 | 1 | 16 | 6 | [zamanda-degisen-veri](dogrulama/zamanda-degisen-veri.md) |
| Efemeris, dönüş açıları ve yer istasyonları | 94 | 66 | 16 | 0 | 6 | 6 | [efemeris-ve-yer-istasyonlari](dogrulama/efemeris-ve-yer-istasyonlari.md) |
| Ufuk hesabı ile ışık ve ısı katmanı | 97 | 73 | 9 | 2 | 11 | 2 | [ufuk-ve-isik-isi](dogrulama/ufuk-ve-isik-isi.md) |
| Güneş paneli modeli | 54 | 35 | 8 | 0 | 9 | 2 | [gunes-paneli](dogrulama/gunes-paneli.md) |
| Veri kaynakları kataloğu | 71 | 49 | 10 | 1 | 6 | 5 | [veri-kaynaklari](dogrulama/veri-kaynaklari.md) |
| Açıklanabilirlik ve görev farkları | 85 | 49 | 6 | 0 | 9 | 21 | [aciklanabilirlik](dogrulama/aciklanabilirlik.md) |
| Görev araçları, 3B modeller ve fiziksel özellikler | 113 | 86 | 8 | 4 | 7 | 8 | [gorev-araclari](dogrulama/gorev-araclari.md) |
| CSA Ay programı ve diğer ülkelerden dersler | 85 | 57 | 13 | 0 | 9 | 6 | [csa-ve-diger-ulkeler](dogrulama/csa-ve-diger-ulkeler.md) |
| Rover konumlama | 83 | 45 | 12 | 1 | 19 | 6 | [rover-konumlama](dogrulama/rover-konumlama.md) |
| Rover modelleme ve Unreal | 41 | 9 | 7 | 0 | 24 | 1 | [rover-modelleme](dogrulama/rover-modelleme.md) |
| **Toplam** | **844** | **555** | **101** | **9** | **116** | **63** | |

## 5. Konu konu bulgular

Her konu için önce etiket sayıları, sonra ürünü en çok ilgilendiren iddialar verildi. Tablolarda yalnızca seçilmiş iddialar var; tamamı ek dosyalarda.

### 5.1 Zamanla değişen verinin hazırlanması

- **Belgeler:** `zamanda-degisen-veri-hazirlama.md` ve sunumu `Ay’da Zaman Işık, Gölge, Isı.pdf`
- **Tam tablo:** [dogrulama/zamanda-degisen-veri.md](dogrulama/zamanda-degisen-veri.md)

| Toplam | Doğrulandı | Kısmen doğru | Yanlış | Kaynağı yok | Doğrulanamadı |
|---:|---:|---:|---:|---:|---:|
| 121 | 86 | 12 | 1 | 16 | 6 |

Araştırmanın en sağlam belgesi. Ürünün hesap temelini anlatıyor: Güneş ve Dünya'nın konumu, gölge, olay saatleri, güç ve sıcaklık. Belgedeki sayıların büyük kısmı ekibin kendi hesabı; doğrulama sırasında NASA'nın iki ayrı aracıyla (SPICE ve Horizons) baştan hesaplandı ve hemen hepsi aynı çıktı. Sorunlar hesap yöntemini bozmuyor; çoğu anlatım ve örnek seçimiyle ilgili.

| İddia | Etiket | Açıklama |
|---|---|---|
| Ekibin kodu ile NASA Horizons aynı açıları veriyor (fark derecenin milyonda biri) | doğrulandı | Yeniden hesaplandı, dört örnek satır birebir tuttu. |
| Belgede adı geçen NASA dosyaları ve koordinat sistemi bilgileri | doğrulandı | Dosyalar NASA sunucusunda var; açıklamaları belgedekiyle aynı. |
| İki Ay koordinat sistemi karıştırılırsa saha 663 ile 875 m arası kayar | doğrulandı | Yeniden hesaplandı: kutupta 663 m, Apollo 11 sahasında 832 m. |
| Yedi yıllık saatlik konum tablosu yaklaşık 1,7 MB tutar | doğrulandı | Basit hesap; tutuyor. |
| Saatlik tablonun arasını doldurmak yeterli | doğrulandı | Ölçülen hata Güneş'in görünen çapının binde birinden küçük. Belgedeki "hata 0,01 yay saniyesinden küçük" ifadesi ise iyimser; gerçek veride 0,06 ile 0,4 arası çıkıyor. Sonuç değişmiyor. |
| Arazisiz bir Ay'da kutbun yakınında Güneş ufkun 2 derece altı ile 2 derece üstü arasında gezer | doğrulandı | Horizons ile yeniden hesaplandı. |
| Sıcaklık modelinin denklemleri ve sabitleri (Hayne ve arkadaşları, 2017) | doğrulandı | Makaledeki tabloyla aynı. Koddaki sabitler de aynı. |
| Şubat 2027'de Apollo 11 sahasında Dünya, Güneş'in yüzde 34'ünü 2 saat 27 dakika örtüyor | doğrulandı | İki araçla da aynı sonuç. |
| "144 gün Güneş yok" (sunumda da geçiyor) | kısmen doğru | 144 gün Güneş'in merkezinin ufkun altında kaldığı süre. Güneş'in hiçbir parçasının görünmediği süre 138 gün. |
| "Gerçek sırtlarda aydınlanma yüzde 92'ye çıkar" | kısmen doğru | Kaynak bunu yalnızca belirli noktalar ve zeminden 2 m yükseklik için söylüyor. Belge bütün sırtlara genellemiş. |
| "Sahayı 100 m kaydırmak hep güneşli bir yönü hep gölgeye çevirebilir" örneği (sunumda da geçiyor) | kısmen doğru | Hesap yaklaşık doğru ama örnek yanlış seçilmiş: 2 km ötedeki 500 m'lik sırt zaten 14 derecelik bir duvar yapar; kutupta Güneş onu hiçbir zaman aşamaz. Fikir doğru, örnek değiştirilmeli. |
| Güneş'ten gelen enerji yıl içinde artı eksi yüzde 3,4 oynar | yanlış | Belgenin kendi verdiği mesafe aralığıyla hesaplanınca yaklaşık artı eksi yüzde 3,8 çıkıyor. |
| Sıcaklık modeli sonuçları (ekvatorda en yüksek 385, en düşük 92 kelvin ve kutup senaryoları) | doğrulanamadı | Ekibin hesabı; ağır olduğu için tekrar edilmedi. |
| Ufuk hesabı saha başına 0,03 saniye sürer | doğrulanamadı | Ekibin ölçümü; tekrar edilmedi. |

Belgenin önerdiği veri hattı (ağır hesabı bir kez yap, arayüze hazır dosya ver) ve uygulama sırası bir iddia değil, tasarım önerisi. Bunlar Aşama 2'de karara bağlanmalı.

### 5.2 Efemeris, dönüş açıları ve yer istasyonları

- **Belgeler:** `ephemeris-rotation-ground-stations/` klasöründeki rapor (PDF), ekip sunumu ve hesap arşivi (zip)
- **Tam tablo:** [dogrulama/efemeris-ve-yer-istasyonlari.md](dogrulama/efemeris-ve-yer-istasyonlari.md)

| Toplam | Doğrulandı | Kısmen doğru | Yanlış | Kaynağı yok | Doğrulanamadı |
|---:|---:|---:|---:|---:|---:|
| 94 | 66 | 16 | 0 | 6 | 6 |

Rapor ve yanındaki kod güvenilir. Rapor yazılırken ekibin çalıştıramadığını söylediği hesap (NASA'nın SPICE kütüphanesiyle karşılaştırma) bu doğrulamada gerçek NASA dosyalarıyla çalıştırıldı ve geçti. Arşivdeki örnek veriler gerçek Horizons çıktısı: 61 satırın hepsi yeniden sorgulandı, fark sıfır. Yanlış iddia yok; "kısmen doğru" sayısının yüksek olması raporun özet bölümündeki yuvarlamalardan geliyor.

| İddia | Etiket | Açıklama |
|---|---|---|
| Önerilen NASA dosya seti sunucuda mevcut | doğrulandı | Hepsi indirildi ve yüklendi. |
| Horizons sorgu ayarları (Ay yüzeyindeki bir noktadan bakış) | doğrulandı | NASA belgesinde tanımlı; canlı sorgu çalışıyor. |
| Mons Mouton'da Aralık 2026'da Dünya ufkun 2,1 derece altı ile 10,6 derece üstü arasında; Güneş en fazla 6,5 derece | doğrulandı | Yeniden hesaplandı; aynı. |
| Sahanın konumu hesaba katılmazsa Dünya'nın yüksekliği çeyrek derece yanlış çıkar; bu yaklaşık 5 saatlik zamanlama hatası demek | doğrulandı | Ekibin betiği yeniden çalıştırıldı. |
| Ekibin SPICE betiği Horizons ile aynı sonucu vermeli | kısmen doğru | Betik yazıldığı haliyle tarih satırında hata veriyor. Tek karakterlik düzeltmeyle çalışıyor ve fark yok denecek kadar küçük. |
| "Üç yöntem arasındaki fark bir yay dakikasının onda birinden küçük" | kısmen doğru | Yükseklik açısı için doğru. Yön açısında fark üç buçuk katına kadar çıkıyor; rapor bunu ayırmadan yazmış. Ürün için yine fazlasıyla yeterli. |
| "Aralık 2026'nın yüzde 27'sinde Dünya ufkun altında (3 ile 11 Aralık)" | kısmen doğru | Yüzde 27,7 doğru, ama bir kısmı ayın son iki gününden geliyor. Yalnızca 3 ile 11 Aralık yüzde 26. |
| İki Ay koordinat sistemi karıştırılırsa saha yaklaşık 875 m kayar | kısmen doğru | 875 m üst sınır. Test sahasında kayma 690 m. |
| NASA'nın yer istasyonları (DSN) Ay'ı her an göremiyor; Ay güneyde alçaktayken günde 26 dakikaya varan boşluk oluyor | doğrulandı | Ekibin betiği yeniden çalıştırıldı, tablo birebir aynı. 26 dakika en uç durum için; raporun kendi test ayında değer 16 dakika. |
| İki ESA istasyonu eklenince boşluk kapanıyor | doğrulandı | Yeniden hesaplandı. |
| Yer istasyonlarının konumları ve en düşük bakış açıları (alım için 6, gönderim için 10,1 derece) | doğrulandı | NASA ve ESA belgeleriyle aynı. |
| Araç gövdesinin eğim ve yön açılarından dönüş hesabı | doğrulandı | Betik yeniden çalıştırıldı; 2000 rastgele denemede hata yok. |
| Tarayıcı kütüphanesi (`astronomy-engine`): MIT lisanslı, Ay yüzeyinden bakışı hazır vermiyor, elle dönüşüm gerekiyor | doğrulandı | Kütüphane belgesinde aynen. |
| Bu kütüphaneyle doğruluk yaklaşık bir yay dakikası | doğrulanamadı | Kütüphane kurulu olmadığı için gerçek çağrılar denenmedi. Dönüşüm kodunun matematiği ise ayrı test edildi ve doğru. |
| Uzay ajanslarının harita koordinatları | doğrulanamadı ve kaynağı yok | Üç ajans için gösterilen sayfalar açılmadı. Diğerleri "yaklaşık 1 km içinde" diye verilmiş. Yalnızca haritada işaret için yeterli. |

Rapor iki kararı ekibe bırakıyor. Birincisi, "Dünya görünüyor" denmesi için Dünya'nın merkezi mi, kenarı mı, tamamı mı ufkun üstünde olmalı; seçim pencereyi 19 ile 38 saat arası oynatıyor (yeniden hesaplandı). İkincisi, yer istasyonu için alım sınırı mı gönderim sınırı mı kullanılacak.

### 5.3 Ufuk hesabı ile ışık ve ısı katmanı

- **Belgeler:** `lunar-horizon/README.md` (ufuk hesabı) ve `light-heat-layer/README.md` (ışık ve ısı mimarisi)
- **Tam tablo:** [dogrulama/ufuk-ve-isik-isi.md](dogrulama/ufuk-ve-isik-isi.md)

| Belge | Toplam | Doğrulandı | Kısmen doğru | Yanlış | Kaynağı yok | Doğrulanamadı |
|---|---:|---:|---:|---:|---:|---:|
| Ufuk hesabı | 55 | 42 | 5 | 1 | 6 | 1 |
| Işık ve ısı katmanı | 42 | 31 | 4 | 1 | 5 | 1 |
| **İkisi birlikte** | **97** | **73** | **9** | **2** | **11** | **2** |

**Ufuk hesabı notu** güvenilir. Yöntem, ESA için yapılmış bir çalışmaya ve NASA'nın kutup aydınlanma çalışmalarına dayanıyor; ikisi de açılıp karşılaştırıldı. Tablolardaki bütün sayılar yeniden hesaplandı ve tuttu. Ürünün ufuk hesabı bu nota dayandırılabilir.

**Işık ve ısı notu** bir mimari önerisi; kendi ifadesiyle "henüz kod yok". Dayandığı NASA rover (VIPER) sayıları kaynakla birebir aynı. Sıcaklık hesabı için önerdiği hazır araçta (Heat1d) ise üç pratik sorun çıktı; bunlar bilinmeden başlanırsa zaman kaybettirir.

| İddia | Etiket | Açıklama |
|---|---|---|
| Ay'da ufuk uzaklığı ve eğriliğin etkisi tabloları | doğrulandı | Hepsi yeniden hesaplandı. 2 m yükseklikten ufuk 2,64 km ötede. |
| Ufuk 720 yönde hesaplanır; yakında sık, uzakta seyrek örneklenir; en fazla 150 km'ye bakılır | doğrulandı | ESA çalışmasında aynen geçiyor. |
| "720 yön literatürdeki standart" | kısmen doğru | Yaygın ama tek değil: bir çalışma 1440, bir başkası 360 yön kullanıyor. |
| "1 saatlik adım literatür standardı" | kısmen doğru | İki çalışma 1 saat kullanıyor; bir başkası uzun hesaplarda 6 saat. |
| Güneş Ay'dan yaklaşık yarım derecelik bir disk olarak görünür; kısmi görünürlük hesaba katılmalı | doğrulandı | Yeniden hesaplandı. İki kaynak da diski hesaba katıyor. |
| Dünya Ay'dan yaklaşık 2 derecelik bir disk olarak görünür; güney kutbunda ayda bir yaklaşık 6,5 derece aşağı yukarı salınır | doğrulandı | ESA çalışmasında geçiyor. Dünya'nın görünme süreleri yaklaşık 14 günlük dönemler halinde. |
| Paneli yükseltmek aydınlanmayı belirgin artırır: bir sahada 1 m'de yüzde 67 ile 71, 5 m'de yüzde 83 ile 89 | doğrulandı | NASA çalışmasında aynen geçiyor. "Direk yüksekliği" girdisinin gerekçesi. |
| Yükseklik haritasındaki hata sonucu iyimser gösterir | doğrulandı | Kaynakta açıkça yazıyor. Sonuçlar küçük bir güvenlik payıyla sunulmalı. |
| Örnek koddaki küçük farkın nedeni "1,4 km'lik örnekleme adımı" | yanlış | Belgenin kendi kodunda o uzaklıkta adım 2 km. Açıklama hatalı; kodun sonucu değil. |
| VIPER sayıları: gölgede 9,5 saat, en düşük güçte 50 saat, ortalama hız saniyede 1 cm, eğim sınırı 15 derece | doğrulandı | NASA sunumundaki sayılarla birebir aynı. Varsayılan rover profili için kullanılabilir. |
| Heat1d'nin güncel sürümü 0.4.1 | kısmen doğru | Bu sürüm henüz yayımlanmamış. Standart kurulum 0.3.2 getiriyor ve notun kullandığı özellikler onda yok. Doğrudan GitHub'dan kurmak gerekiyor. |
| Heat1d dışarıdan verilen güneş verisini kabul eder | doğrulandı | Kaynak kodda var. Ancak model başlangıç ısınmasını gölgesiz yapıyor; gölgedeki kareler olduğundan sıcak başlıyor. |
| "Heat1d düz zemin varsayar" | kısmen doğru | Eskimiş. Güncel kod eğimli yüzeyi ve krater gölgesini destekliyor. |
| Dosya boyutu tahminleri (ufuk maskesi 29 MB, gölge filmi 28 MB) | doğrulandı | Yeniden hesaplandı. 720 yönle ufuk maskesi 58 MB olur. |
| "Efemeris tablosu birkaç yüz kilobayt" | yanlış | Yeniden hesaplandı: 40 ile 50 kilobayt. Lehimize bir hata. |
| Önerilen araçların lisansları | doğrulandı | Heat1d MIT, astroquery BSD. Bir araç deposunun (Schörghofer) lisansı GitHub'da belirtilmemiş; kullanılacaksa önce bakılmalı. |

### 5.4 Güneş paneli modeli

- **Belge:** `solar-panel-model/README.md`
- **Tam tablo:** [dogrulama/gunes-paneli.md](dogrulama/gunes-paneli.md)

| Toplam | Doğrulandı | Kısmen doğru | Yanlış | Kaynağı yok | Doğrulanamadı |
|---:|---:|---:|---:|---:|---:|
| 54 | 35 | 8 | 0 | 9 | 2 |

Belgenin çekirdeği olan Mons Mouton ön hesabı baştan hesaplandı ve bütün tablolar tuttu. Sorunlar gerçek araçlara dair yan bilgilerde ve önerilen varsayılan değerlerde.

| İddia | Etiket | Açıklama |
|---|---|---|
| Mons Mouton'da Aralık 2026'da Güneş en fazla 6,47 derece yükseliyor | doğrulandı | Horizons ile yeniden hesaplandı; aynı. |
| Aylık ve günlük güç tabloları, karanlık süreleri (232 ve 280 saat) | doğrulandı | Tek bir Horizons sorgusuyla baştan hesaplandı; birebir aynı. |
| Güneş'le birlikte dönen dik panel, iki eksende dönen panelle neredeyse aynı enerjiyi toplar | doğrulandı | Fark yüzde 0,3. Yeniden hesaplandı. |
| Ufku 1 derece değiştirmek enerjiyi yüzde 11 ile 16 arası oynatır | doğrulandı | Yeniden hesaplandı. Arazi ufkunun neden bu kadar önemli olduğunu gösteren ana sayı. |
| Rover yönünü Güneş'e göre ayarlayarak yüzde 18 fazla enerji toplar | kısmen doğru | Yalnızca ufkun 1 derece aşağıda olduğu varsayımda. Diğer durumlarda yüzde 12 ile 14,5. |
| VIPER her yöne sürülebiliyordu | kısmen doğru | Kaynak direksiyon aralığını artı eksi 50 derece veriyor. Önerilen rover profilindeki "her yöne sürüş" varsayılanı bu abartıyı ürüne taşır. |
| Uzay tipi güneş hücresi verimi 0,28 ile 0,30 arası | kısmen doğru | Gösterilen kaynak yüzde 26,8 diyor. Önerilen profildeki 0,29 değeri kaynakla uyuşmuyor. |
| Dikey panel direkleri 2024'te vakum odasında test edildi | kısmen doğru | Gösterilen 2023 belgesi bunu yalnızca plan olarak veriyor. |
| "VIPER iptal edildi" | kaynağı yok | Eskimiş bilgi. NASA sayfasına göre VIPER, Blue Moon MK-1 iniş aracıyla Mons Mouton'a gönderilecek. Bu, ekibin test sahasıyla aynı yer. |
| Sabit paneller dönen panele göre yüzde 37 ile 64 arası kaybeder (bir 2024 makalesi) | doğrulanamadı | Makale sayfası otomatik erişimi engelledi. |
| En iyi kutup noktaları zamanın yüzde 77 ile 88'inde aydınlık (Gläser 2014) | doğrulanamadı | Makale ücretli. |

Hesapta küçük bir tutarsızlık var: ortalamalar 744 saat yerine 745'e bölünmüş. Etkisi binde bir düzeyinde.

### 5.5 Veri kaynakları kataloğu

- **Belge:** `data-sources/README.md`
- **Tam tablo:** [dogrulama/veri-kaynaklari.md](dogrulama/veri-kaynaklari.md)

| Toplam | Doğrulandı | Kısmen doğru | Yanlış | Kaynağı yok | Doğrulanamadı |
|---:|---:|---:|---:|---:|---:|
| 71 | 49 | 10 | 1 | 6 | 5 |

Katalog güvenilir. Ürünün dayanacağı ana veri kaynaklarının adresi, dosya biçimi, boyutu ve kapsamı tek tek kontrol edildi ve tuttu. Sorunlar ikincil kaynaklarda (buz, kaya yoğunluğu) ve eskimiş birkaç ayrıntıda.

| İddia | Etiket | Açıklama |
|---|---|---|
| Güney kutbu yükseklik haritaları (PGDA 90): 60 ile 90 derece güney arası, 10 m'den 240 m'ye çözünürlük, internetten parça parça okunabilen biçim | doğrulandı | Ürün sayfası ve dosya başlıklarıyla aynı. 10 m'lik dosya yalnızca 83 derece güneyden kutba kadar olan bölgeyi kapsıyor; Mons Mouton bunun içinde. |
| Dosyalar 2 ile 5 GB ama indirmeden küçük bir pencere okunabiliyor | kısmen doğru | Yöntem yeniden denendi ve çalıştı (birkaç saniye). Belgedeki sayılar aynen tekrar edilemedi çünkü belge hangi pencereyi okuduğunu yazmamış. |
| Hazır aydınlanma ve Dünya görünürlüğü haritaları (PGDA 69), 18,6 yıllık ortalama | doğrulandı | Kendi sonucumuzu karşılaştırmak için kullanılabilir. |
| NASA'nın resmi iniş koordinatları tablosu: Apollo 11, Chang'e 4, SLIM, IM-1, Chang'e 6, Blue Ghost | doğrulandı | Altı satırın hepsi tabloyla birebir aynı. |
| "IM-2 Athena ve Resilience bu tabloda yok" | yanlış | Tabloda ikisi de var; görev adıyla yazılmışlar. Saha listesi tek resmi tablodan kurulabilir. |
| NASA'nın konum hesap dosyaları (SPICE) sunucuda mevcut | doğrulandı | Beş dosyanın hepsi yerinde. |
| Ekibin kodu Horizons ile derecenin milyonda biri düzeyinde tutuyor | doğrulandı | Yeniden hesaplandı. |
| Artemis III için 9 aday bölgenin sınır dosyaları (USGS) | doğrulanamadı | Site otomatik erişimi engelliyor. Bir ekip üyesinin tarayıcıdan indirmesi gerekir. |
| Diviner sıcaklık verisi: yıllık ortalama ve en yüksek yüzey sıcaklığı | kısmen doğru | Ortalama sıcaklık yüzeyde değil, 2 cm derinlikte tanımlı. |
| Hidrojen ve buz haritaları için gösterilen adresler | kısmen doğru | Adreslerde ham ölçüm verisi var; hazır harita yok. |
| Belirli sahalar için 5 m'lik yükseklik haritaları (PGDA 78): 4 saha | kısmen doğru | Eskimiş. Sayfada artık yaklaşık 19 saha ve indirme bağlantıları var. |
| Cesium'un Ay arazisi: kutuplarda 5 m, orta enlemlerde 60 m | kısmen doğru | 5 m yalnızca kutbun hemen çevresinde. Ürünün adı da değişmiş. |

Doğrulama sırasında bir kod kusuru da bulundu: hesap arşivindeki `site_azel_spice.py` betiğinde tarih yazımı SPICE'ın güncel sürümünde hata veriyor. Düzeltmesi tek satır (bkz. 6.3).

### 5.6 Açıklanabilirlik ve görev farkları

- **Belge:** `explainability-mission-differences/aciklanabilirlik-raporu-v2.pdf`
- **Tam tablo:** [dogrulama/aciklanabilirlik.md](dogrulama/aciklanabilirlik.md)

| Toplam | Doğrulandı | Kısmen doğru | Yanlış | Kaynağı yok | Doğrulanamadı |
|---:|---:|---:|---:|---:|---:|
| 85 | 49 | 6 | 0 | 9 | 21 |

Rapor dikkatli yazılmış: neyi doğrulayamadığını kendisi baştan söylüyor ve kesin olmayan nedenleri "ön bulgu" diye ayırıyor. Yanlış iddia çıkmadı. "Doğrulanamadı" sayısının yüksek olmasının nedeni içerik değil, kaynak gösterme biçimi: rapor birçok bilgiyi adres vermeden, yalnızca kaynağın adıyla anıyor; bir şirketin duyuru sayfası da erişimi engelliyor.

En değerli kısım, geçmiş inişler için hesaplanan Güneş ve Dünya açıları. Bunların hepsi Horizons ile yeniden hesaplandı ve tuttu. Yani ürün geçmiş bir inişin tarihini ve yerini alıp o andaki gökyüzünü doğru gösterebilir; bu, hazır bir doğrulama ve demo verisi.

| İddia | Etiket | Açıklama |
|---|---|---|
| Athena inişinde Güneş ufkun 2,47 derece, Dünya 11,19 derece üstündeydi | doğrulandı | Horizons ile yeniden hesaplandı; aynı. |
| Başarılı Blue Ghost inişinde Güneş 3,43 derece yüksekteydi | doğrulandı | Yeniden hesaplandı. "Alçak Güneş başarısızlık demektir" çıkarımının yanlış olduğunu gösteren sayı. |
| Chang'e-4 sahasında Dünya ufkun 39 derece altında ve hiç görünmüyor | doğrulandı | Yeniden hesaplandı; bütün yıl boyunca ufkun altında. |
| Chandrayaan-3, IM-1 ve SLIM iniş anı Güneş açıları | doğrulandı | Üçü de yeniden hesaplandı. IM-1 ve SLIM değerleri yaklaşık saat ve koordinata dayanıyor; rapor bunu belirtiyor. |
| SLIM hedefin yaklaşık 55 m doğusuna indi; motoru yukarı, panelleri batıya bakıyordu | doğrulandı | Japon uzay ajansının belgesinde aynen geçiyor. CSA notunda kaynaksız kalan ayrıntının asıl kaynağı bu. |
| Artemis III için dokuz aday bölge (Ekim 2024) ve adları | doğrulandı | NASA duyurusunda geçiyor. NASA başka alanların da incelendiğini ekliyor. |
| Şubat ve Kasım 2026 plan değişiklikleri: Artemis III iniş yapmayacak, ilk iniş Artemis IV ile 2028'de | doğrulandı | İki NASA duyurusu da açıldı. Dokuz bölgelik liste eski plana ait; haritada tarihiyle birlikte gösterilmeli. |
| 1 m'lik bir nesne Güneş 2,47 derecedeyken yaklaşık 23 m gölge yapar | doğrulandı | Yeniden hesaplandı. |
| Kutupta küçük bir ufuk hatası olay saatini 20 dakikadan fazla kaydırır; Dünya için 70 dakikayı bulur | doğrulandı | Yeniden hesaplandı. Sabit bir hata payı yerine her olay için ayrı aralık gösterme önerisinin dayanağı. |
| Mons Mouton'da Dünya ufkun 1,5 derece altı ile 11,9 derece üstü arasında gezer | kısmen doğru | Horizons 2025 için 2,9 derece altı ile 11,3 derece üstü veriyor. Alt sınır tutmuyor; iletişim penceresi hesabında hazır sayı yerine hesap kullanılmalı. |
| Resilience kazası "kesin nedeni yayımlanmış" vakalar arasında | kısmen doğru | Şirket bir analiz yayımladı ama nihai değil; bağımsız inceleme bekleniyor. "Ön bulgu" diye etiketlenmeli. |
| Athena'nın yüzey ömrü, hedeften sapması (250 m) ve görev sonu gerekçesi | doğrulanamadı | Şirketin duyuru sayfası erişimi engelliyor. Araç raporu aynı bilgiyi NASA duyurusundan veriyor (bkz. 5.7). |
| Blue Ghost'un çalışma süresi ve güç değerleri, IM-1 ayrıntıları | doğrulanamadı | Rapor kaynağın adresini vermemiş. |
| IM-1 hedeften yaklaşık 1,5 km saptı | kaynağı yok | Raporun IM-1 için gösterdiği başka bir kaynak 2,5 km diyor. |

Raporun önerdiği açıklama yöntemleri (aynı sahayı başka tarihle ya da başka sahayı aynı tarihle yan yana koymak, halk, eğitimci ve planlamacı için üç ayrı anlatım düzeyi, her "neden" kartına kanıt düzeyi etiketi) birer tasarım önerisi. Challenge'ın "küçük değişikliklerin neden büyük fark yarattığını anlat" isteğiyle doğrudan örtüşüyor.

### 5.7 Görev araçları, 3B modeller ve fiziksel özellikler

- **Belgeler:** `mission-vehicles-models-physics/` klasöründeki rapor (PDF) ve ekip sunumu
- **Tam tablo:** [dogrulama/gorev-araclari.md](dogrulama/gorev-araclari.md)

| Toplam | Doğrulandı | Kısmen doğru | Yanlış | Kaynağı yok | Doğrulanamadı |
|---:|---:|---:|---:|---:|---:|
| 113 | 86 | 8 | 4 | 7 | 8 |

Rapor büyük ölçüde doğru ve neyi doğrulayamadığını kendisi açıkça söylüyor. Dört yanlış çıktı; ikisi lehimize: rapor "yok" dediği iki şeyin aslında var olduğunu kaçırmış. Görev takvimi bilgileri güncel ve doğrulandı. Güncel araçların (Athena, VIPER, Blue Ghost) fiziksel ölçüleri ise raporda da büyük ölçüde boş.

| İddia | Etiket | Açıklama |
|---|---|---|
| Apollo iniş aracının ve Apollo arazi aracının ölçüleri ve kütleleri | doğrulandı | NASA belgeleriyle aynı. Birim çevrimleri yeniden hesaplandı. |
| NASA'nın Apollo iniş aracı 3B modeli mevcut ve kullanılabilir | doğrulandı | NASA'nın 3B kaynaklar sayfasında duruyor. |
| "Apollo arazi aracı için lisansı açık model yok" | yanlış | Raporun baktığı sayfada model serbest kullanım lisansıyla sunuluyor. Dosyanın içindeki lisans belgesi teyit edilirse kullanılabilir. |
| "Hiçbir aracın ağırlık merkezi yayımlanmamış" | yanlış | Raporun kendi kaynağında Apollo iniş aracı için değer var. Rapor ve sunum bunun yerine tahmin kullanmış. |
| Apollo iniş aracının 6 ve 12 derecelik eğim sınırları birbiriyle çelişiyor | yanlış | İkisi aynı şartnamenin parçası: ortalama eğim 6, pürüzler dahil 12 derece. |
| Unreal'ın sahneye doğrudan aktarma özelliği FBX biçimiyle de çalışır | yanlış | Güncel Unreal belgesi yalnızca iki başka biçimi sayıyor. |
| Athena hedefinden 400 m uzağa indi ve 12 saat 45 dakika çalıştı | doğrulandı | NASA duyurusunda geçiyor. Aynı duyurudaki bir fotoğraf altyazısı 250 m diyor; iki sayı da kaynaklı. |
| Artemis III 2027'de Dünya yörüngesinde bir test; ilk iniş Artemis IV ile 2028'de | doğrulandı | Diğer üç belgeyle de tutarlı. |
| VIPER, 2027 sonunda Mons Mouton'a inecek | doğrulandı | Bilgi Eylül 2025 tarihli. Taşıyacak aracın ilk uçuşu 2027 başına kaydığı için tarih iyimser olabilir. |
| "Mons Mouton'u hedefleyen iki görev var" | kısmen doğru | Raporun kendi kaynağına göre üçüncü bir görev (Griffin-1) de aynı bölgeye inecek ve ilk uçan o olacak. |
| NASA logosu kullanılamaz; NASA içeriği NASA onayı varmış gibi sunulamaz | doğrulandı | NASA'nın kullanım kurallarında yazıyor. Teslim kılavuzu da aynı yasağı içeriyor. |
| Space Apps kılavuzu Çin ile ilgili bir uygunluk incelemesi öngörüyor | doğrulandı | İnternet adresi açılamadı; depodaki kılavuzdan doğrulandı. Kural Çin'e ait kuruluşlarla ikili faaliyeti konu alıyor. Kamuya açık görev bilgisini kullanmanın bu kapsama girip girmediğine NASA karar veriyor. |
| Smithsonian'daki iniş aracı görselleri serbestçe kullanılabilir | doğrulanamadı | Site erişimi engelledi. Açılan sayfada görsellerin çoğunda "kullanım koşulları geçerli olabilir" yazıyor; tek tek bakılmalı. |
| Ticari sitelerdeki 3B modeller | doğrulanamadı | Rapor da lisanslarını okuyamadığını söylüyor ve kullanılmamasını öneriyor. |

Rapordaki devrilme ve kayma hesapları, verisi yalnızca Apollo araçları için bulunan değerlere dayanıyor. Güncel araçlar için hesap yapılamıyor.

### 5.8 CSA Ay programı ve diğer ülkelerden dersler

- **Belgeler:** `csa-moon-exploration.md` ve sunumu `Dünyadan Ay Dersleri.pdf`
- **Tam tablo:** [dogrulama/csa-ve-diger-ulkeler.md](dogrulama/csa-ve-diger-ulkeler.md)

| Toplam | Doğrulandı | Kısmen doğru | Yanlış | Kaynağı yok | Doğrulanamadı |
|---:|---:|---:|---:|---:|---:|
| 85 | 57 | 13 | 0 | 9 | 6 |

Kanada Uzay Ajansı'na (CSA) dair bölüm güvenilir; sayfaların kendisi açılıp karşılaştırıldı. Diğer ülkelerin görevlerinden çıkarılan derslerde ise ana fikirler doğru ama bazı çarpıcı ayrıntılar gösterilen kaynaklarda yok. Bu ayrıntılar sunuma da girmiş; jüri önünde kullanılmadan önce düzeltilmeli.

| İddia | Etiket | Açıklama |
|---|---|---|
| Artemis II 1 ile 10 Nisan 2026 arasında uçtu; Artemis III 2027'de Dünya yörüngesinde test, ilk insanlı iniş Artemis IV ile 2028'de | doğrulandı | CSA sayfası ve haber kaynağı aynı şeyi söylüyor. |
| Kanada'nın ilk Ay rover'ı görevi Mart 2026'da iptal edildi | doğrulandı | Şirketin açıklaması ve CSA sayfası. |
| CSA sitesindeki eskimiş bilgiler (dört örnek) | doğrulandı | Dördü de sayfalarda aynen duruyor. CSA'yı alıntılarken dikkat gerekli. |
| Güneş 2 derecedeyken 10 m'lik kaya yaklaşık 286 m gölge yapar | doğrulandı | Yeniden hesaplandı. |
| Hindistan'ın saha seçim yöntemi: 4 km'ye 2,4 km pencere, 8 aday, 32 cm'lik görüntüler | doğrulandı | Gösterilen haberde aynen geçiyor. |
| Hindistan'ın saha ölçütleri arasında "Dünya görünürlüğü" de var | kısmen doğru | Eğim, aydınlanma ve tehlike ölçütleri kaynakta var; Dünya görünürlüğü yok. Sunumda "Bizde zaten var" diye gösterilmiş. |
| SLIM ters durdu, "paneller batıya baktı, sabah güç yoktu" | kısmen doğru | Ters durduğu ve panellerin Güneş'e bakmadığı kaynakta var. "Batı" ve "sabah" ayrıntısı açılan kaynaklarda yok. |
| HAKUTO-R M1'de ölçülen yükseklik "yaklaşık 3 km sıçradı", yazılım sensörü arızalı saydı | kısmen doğru | Kaynak aracın 5 km'de askıda kaldığını söylüyor. "3 km" ve "arızalı saydı" kaynakta yok. |
| Chandrayaan-3 gece sıcaklığı eksi 150 dereceye indi | kısmen doğru | Uyandırma denemesinin tarihi doğru; sıcaklık değeri kaynakta yok. |
| Chang'e 7'nin fırlatma tarihi Shackleton krateri aydınlanmasına göre seçiliyor | kısmen doğru | Ertelemenin kendisi doğru. Kaynak neden olarak rüzgarı ve dar pencereyi veriyor; aydınlanmadan söz etmiyor. |
| NASA, Gateway istasyonunu 24 Mart 2026'da durdurdu | doğrulanamadı | Dayandığı haber sitesi erişimi engelledi. Başka bir kaynak durdurmayı doğruluyor ama tarih vermiyor. |
| Artemis III'ün 9 aday bölgesinin adları | doğrulanamadı | Gösterilen haberin metninde adlar yok. |
| Örnek saha koordinatları tablosu (beş saha) | kaynağı yok | Belge kaynak göstermemiş. Değerler NASA'nın resmi tablosuyla uyumlu (bkz. 5.5). |

Belgenin önerdiği altı özellikten üçü (gece sayacı, panel yönüne göre güç eğrisi, saha puanı) challenge ile örtüşüyor; sınıflandırmaları 7. bölümde.

### 5.9 Rover konumlama

- **Belgeler:** `rover-localization/README.md` ve PDF hali
- **Tam tablo:** [dogrulama/rover-konumlama.md](dogrulama/rover-konumlama.md)

| Toplam | Doğrulandı | Kısmen doğru | Yanlış | Kaynağı yok | Doğrulanamadı |
|---:|---:|---:|---:|---:|---:|
| 83 | 45 | 12 | 1 | 19 | 6 |

Belgenin ana dayanağı olan Mars konum bulma yöntemi (JPL'in Perseverance için geliştirdiği yöntem) makalesiyle birebir tutuyor. Tarihsel bilgiler ve "kaç metre doğruluk" türü sayılar daha zayıf: bir kısmı kaynaksız, bir kısmı hedef değeri ölçülmüş sonuç gibi sunuyor.

| İddia | Etiket | Açıklama |
|---|---|---|
| Mars yönteminin sayıları (ortalama hata 0,36 m, arama alanı artı eksi 30 m, çalışma süresi ve bellek) | doğrulandı | Makale ve JPL haberiyle birebir aynı. |
| JPL'in LunarNav projesi ufuk eşleştirme yapıyor | yanlış | Kaynak LunarNav'ı krater tabanlı yöntem olarak sınıflıyor. Belgenin PDF hali de krater tabanlı diyor; belge kendi içinde çelişiyor. |
| Yıldız izleyici ile konum yaklaşık 10 m doğrulukla bulunur | kısmen doğru | Kaynakta bu bir hedef. Gerçek denemede sonuç 421 m, Ay için ölçeklenmiş tahmin 125 m. |
| Bu yöntemde doğruluğu sınırlayan şey eğim ölçerdir | kısmen doğru | Gösterilen kaynak sınırlayıcı olarak yerçekimi haritasını veriyor. |
| Lunokhod'un ölçüm tekerleği ve Apollo aracının yön bulma yöntemi | kısmen doğru | Ana hatlar doğru; bazı ayrıntılar kaynakta yok. |
| Görsel yöntemin hatası yüzde 1 ile 2, yokuşta kayma yüzde 10 ile 20 gibi sayılar | kaynağı yok | 19 kaynaksız iddianın çoğu bu tür sayılar. |
| Lunokhod 2'nin kat ettiği mesafe (42 km ve 37 km) | doğrulanamadı | Gösterilen makale ücretli. Açık kaynaklar sayıyı doğruluyor. |

Önerilen demo (yükseklik haritasından üretilen gölge haritasıyla konum bulma) bir tasarım önerisi. Gerçek rover görüntüsü olmadığı için tamamen yapay veriyle çalışacağı belgede açıkça yazıyor.

### 5.10 Rover modelleme ve Unreal

- **Belgeler:** `rover-modelleme-ve-unreal-gecis.md` ve PDF hali `ay-rover-dijital-ikiz.pdf`
- **Tam tablo:** [dogrulama/rover-modelleme.md](dogrulama/rover-modelleme.md)

| Toplam | Doğrulandı | Kısmen doğru | Yanlış | Kaynağı yok | Doğrulanamadı |
|---:|---:|---:|---:|---:|---:|
| 41 | 9 | 7 | 0 | 24 | 1 |

Belge neredeyse hiç kaynak göstermiyor; 41 iddianın 24'ü kaynaksız. Buna karşın bağımsız kaynaklarla karşılaştırıldığında yanlış bir iddia çıkmadı. Zemin fiziği formülleri NASA'nın teknik belgesiyle aynı. Asıl sorun, belgenin dayandığı veri varsayımı ve eksik bıraktığı kurulum adımları.

| İddia | Etiket | Açıklama |
|---|---|---|
| Tekerleğin zemine batması, direnç ve çekiş formülleri | doğrulandı | NASA teknik belgesindeki formüllerle aynı. |
| Ay toprağı için kullanılan sayılar | doğrulandı ve kısmen doğru | Altı değerden üçü birebir tutuyor, üçünde küçük sapma var. Değerler belgenin andığı kitaptan değil, bir ders notu ve NASA belgesinden geliyor. |
| Arazi verisi "5 m çözünürlüklü LOLA yükseklik haritası" | kısmen doğru | 5 m'lik harita yalnızca 87,5 derece enlemden kutba kadar var. Bağımsız olarak da kontrol edildi. Mons Mouton için doğrulanan en ince harita 10 m (bkz. 5.5). |
| Cesium arazisi gizlenince iki zemin üst üste binmez | kaynağı yok | Cesium belgesine göre gizleme yalnızca görüntüyü etkiliyor; gizlenen arazi çarpışmaya devam ediyor. Rover iki zemin arasında sorun yaşayabilir. |
| Cesium ile Ay arazisi gösterilebilir | kaynağı yok | Doğru, ama gerekli üç ayar belgede yok (Ay'a özel küre ayarı, en az sürüm, gökyüzü ayarı). Ayar yapılmazsa arazi düzgün yüklenmiyor. |
| Unreal'ın araç fiziği eklentisine dair iddialar | kaynağı yok | Unreal belgeleri otomatik okunamadı; bağımsız olarak doğrulanamadı. Elle denenmesi gerekir. |
| Apollo aracında lastik bozulduğu için tel örgü tekerlek kullanıldı | kaynağı yok | Açılan kaynak başka bir neden veriyor. Sunumda kullanılmamalı. |
| Çin'in Yutu rover'ları da aynı süspansiyonu kullanıyor | kaynağı yok | Açılan kaynakta doğrulanamadı. |

Ek bir uyarı: bu zemin fiziği modelleri Dünya yerçekiminde geliştirilmiş. 2025 tarihli bir NASA belgesi, düşük yerçekiminde bu modellerin ne kadar geçerli olduğunun iyi bilinmediğini yazıyor. Belge bu sınırı anmıyor.

## 6. Düzeltilmesi gerekenler

Aşağıdaki maddeler, notlardan ürüne, sunuma ya da proje dokümanlarına bilgi taşınırken dikkat edilecek yerler.

**Düzeltme durumu (14 Kasım 2026):** Markdown notlarındaki hatalar notların kendisinde düzeltildi (8 dosyada 53 düzeltme). PDF, sunum ve hesap arşivi dosyaları değiştirilemedi. Üç PDF raporun düzeltmeleri kendi klasörlerindeki `README.md` dosyasına "Doğrulama notları" başlığıyla yazıldı. Üç sunum dosyasının düzeltmeleri yalnızca burada duruyor; sunumlar yeniden üretilirken bölüm 6.2 izlenmeli.

### 6.1 Yanlış çıkan iddialar

| Nerede | Ne yazıyor | Kaynak ne diyor | Etkisi |
|---|---|---|---|
| Veri kaynakları kataloğu (bölüm 2 ve 13) | IM-2 Athena ve Resilience NASA'nın koordinat tablosunda yok | İkisi de tabloda var; görev adıyla yazılmışlar | Lehimize. Saha listesi tek resmi tablodan kurulabilir. |
| Rover konumlama notu (bölüm 1 ve 2) | JPL'in LunarNav projesi ufuk eşleştirme yapıyor | Kaynak onu krater tabanlı yöntem sayıyor | Sunumda yanlış örnek vermeye yol açar. |
| Zamanla değişen veri notu (bölüm 7.1) | Güneş enerjisi yıl içinde artı eksi yüzde 3,4 oynar | Belgenin kendi mesafe aralığı Ay için yaklaşık artı eksi yüzde 3,8 veriyor | Önemsiz. Yüzde 3,4 Dünya için doğru değer; aynı sayı efemeris raporunda da geçiyor. |
| Ufuk hesabı notu (bölüm 11) | Örnek koddaki farkın nedeni 1,4 km'lik örnekleme adımı | Kodun kendisinde o uzaklıkta adım 2 km | Önemsiz. Açıklama cümlesi hatalı, kod değil. |
| Işık ve ısı notu (bölüm 4) | Efemeris tablosu birkaç yüz kilobayt | Yeniden hesaplandı: 40 ile 50 kilobayt | Lehimize. |
| Araç raporu (bölüm 3 ve 12) | Apollo arazi aracı için lisansı açık 3B model yok | Raporun baktığı sayfada model serbest kullanım lisansıyla sunuluyor | Lehimize. Dosyadaki lisans belgesi teyit edilirse model kullanılabilir. |
| Araç raporu (bölüm 0 ve 9) ve sunumu | Hiçbir aracın ağırlık merkezi yayımlanmamış | Raporun kendi kaynağında Apollo iniş aracı için değer var (3,62 m) | Küçük. Rapordaki tahmin (3,7 m) gerçek değere yakın. |
| Araç raporu (bölüm 7) | Apollo iniş aracının 6 ve 12 derecelik eğim sınırları ayrı şeyler | İkisi aynı şartnamenin parçası: ortalama eğim 6, pürüzler dahil 12 derece | Bilgi kartında yanlış anlatıma yol açar. |
| Araç raporu (bölüm 5) | Unreal'ın sahneye doğrudan aktarma özelliği FBX biçimiyle de çalışır | Güncel Unreal belgesi yalnızca glTF ve MaterialX biçimlerini sayıyor | Unreal kullanılacaksa model biçimi seçimini etkiler. |

### 6.2 Sunumda ve anlatımda düzeltilecekler

Bunlar "kısmen doğru" çıkan ve sunum dosyalarına da girmiş ifadeler. Jüri önünde kullanılmadan önce düzeltilmeli.

| Nerede | Ne yazıyor | Nasıl yazılmalı |
|---|---|---|
| "Ay'da Zaman" sunumu ve zamanla değişen veri notu | "144 gün Güneş yok" | Güneş'in merkezi 144 gün ufkun altında kalıyor. Güneş'in hiç görünmediği süre 138 gün. |
| Aynı sunum, "Neden önemli" sayfası | 2 km ötedeki 500 m'lik sırt örneği: sahayı 100 m kaydırınca hep güneşli yer hep gölge olur | Bu sırt zaten 14 derecelik bir duvar; kutupta Güneş onu hiç aşamaz. Fikir doğru, örnek değişmeli: ufka 1 ile 2 derece yükseklik katan uzak bir engel seçilmeli. |
| Aynı sunum | "artı 161 derece": eğimli yamaç düz zeminden bu kadar sıcak | 161 derecelik bir sıcaklık farkı. Mutlak sıcaklık gibi okunuyor. Model sonucu tekrar edilmedi. |
| Zamanla değişen veri notu, özet | "Gerçek sırtlarda aydınlanma yüzde 92'ye çıkar" | Belirli noktalarda, zeminden 2 m yükseklikte yüzde 92. |
| "Dünyadan Ay Dersleri" sunumu ve CSA notu | HAKUTO-R'da ölçülen yükseklik "3 km sıçradı", yazılım sensörü arızalı saydı | Açılan kaynağa göre araç yükseklik verisini yanlış yorumladı ve yaklaşık 5 km yükseklikte askıda kaldı. "3 km" ve "arızalı saydı" kaynakta yok. |
| Aynı sunum | Hindistan'ın saha ölçütleri arasında "Dünya görünürlüğü" ("Bizde zaten var" kutusu) | Kaynaklarda eğim, aydınlanma ve tehlike ölçütleri var; Dünya görünürlüğü yok. |
| CSA notu | SLIM'de "paneller batıya baktı, sabah güç yoktu" | Bilgi doğru; kaynağı Japon uzay ajansının 25 Ocak 2024 tarihli belgesi olarak gösterilmeli. Notun gösterdiği haberlerde bu ayrıntı yok. |
| CSA notu | Chang'e 7'nin fırlatma tarihi krater aydınlanmasına göre seçiliyor | Kaynakta yok. Erteleme nedeni rüzgar ve dar fırlatma penceresi. |
| Güneş paneli notu | "VIPER iptal edildi" | VIPER, Blue Moon MK-1 iniş aracıyla Mons Mouton'a gönderilecek. |
| Rover konumlama notu | Yıldız izleyici ile konum "yaklaşık 10 m" | 10 m bir hedef. Gerçek denemede 421 m; Ay için tahmin 125 m. |
| Açıklanabilirlik raporu | Resilience kazası "kesin nedeni yayımlanmış" vakalardan | "Ön bulgu" olarak etiketlenmeli. |
| Efemeris raporu, özet | Yer istasyonlarında "günde 26 dakika" boşluk | En uç durum için. Aralık 2026'da değer 16 dakika. |

### 6.3 Ürüne girecek değerler ve kod

| Nerede | Sorun | Ne yapılmalı |
|---|---|---|
| Hesap arşivindeki `site_azel_spice.py` | Tarih satırının yazımı SPICE'ın güncel sürümünde hata veriyor | Tarihin sonundaki "UTC" eki kaldırılmalı. Düzeltilince betik Horizons ile aynı sonucu veriyor. |
| Önerilen rover profili (`panel_profile.json`) | "Her yöne sürüş" varsayılanı açık | Kaynak direksiyon aralığını artı eksi 50 derece veriyor. Varsayılan buna göre değişmeli ya da "varsayım" diye işaretlenmeli. |
| Aynı profil | Hücre verimi 0,29 | Gösterilen kaynak 0,268 veriyor. |
| Güneş paneli notu | "Rover yönünü ayarlayarak yüzde 18 fazla enerji toplar" | Ufuk varsayımına göre yüzde 12 ile 18 arası. |
| Açıklanabilirlik raporu | Mons Mouton'da Dünya ufkun 1,5 derece altı ile 11,9 derece üstü arasında | Hazır sayı yerine hesap kullanılmalı. 2025 için 2,9 derece altı ile 11,3 derece üstü; Aralık 2026 için 2,1 derece altı ile 10,6 derece üstü. |
| Işık ve ısı notu | Heat1d sürüm 0.4.1 | Standart kurulum eski sürümü getiriyor. Kullanılacaksa doğrudan GitHub'dan kurulmalı; başlangıç ısınmasının gölgesiz yapıldığı bilinmeli. |
| Rover modelleme notu | "5 m çözünürlüklü LOLA haritası" | 5 m yalnızca kutbun hemen çevresinde var. Mons Mouton için doğrulanan en ince harita 10 m. |
| Rover modelleme notu | Cesium arazisi gizlenince iki zemin çakışmaz | Gizleme yalnızca görüntüyü etkiliyor. Cesium arazisinin çarpışma ayarı ayrıca kapatılmalı. |
| Veri kaynakları kataloğu | Belirli sahalar için 5 m haritalar: 4 saha | Sayfada artık yaklaşık 19 saha var; liste güncellenmeli. |

## 7. Konuların challenge'a göre sınıflandırılması

Challenge metni tek bir şeyi zorunlu tutuyor: Güneş ve Dünya'nın ufka göre konumunu göstererek sahaları ve tarihleri hızlı karşılaştırmak, bununla güç ve Dünya ile doğrudan iletişim durumunu değerlendirmek. Geri kalan hedefler "düşünebilirsiniz" diye yazılmış. Aşağıda "Zorunlu" sınıfına, bu ana cümlenin ve doğrudan onu açan hedeflerin karşılığı olan konular alındı.

Risk sütunu kalan süreye göre yazıldı (teslim 15 Kasım 23:59).

### 7.1 Zorunlu

| Konu | Projeye yararı | Riski | Anlatıldığı yer |
|---|---|---|---|
| Güneş ve Dünya'nın gökyüzündeki konumunun hesabı | Ürünün temeli. Her saha ve tarih için Güneş ve Dünya'nın yönünü ve ufuktan yüksekliğini verir. Ekibin kodu hazır ve NASA'nın aracıyla aynı sonucu veriyor. | Düşük. Kod çalışıyor; tek karakterlik bir düzeltme gerekiyor. Hesap kütüphanesi için ekip kararı yok. | Zamanla değişen veri notu, efemeris raporu, hesap arşivi |
| Ufuk hesabı (Ay'ın eğriliği ve arazi) | Challenge "ufka göre konum" istiyor. Düz arazide hesap basit. Kutupta ise Güneş'in görünüp görünmediğini arazi belirliyor; yöntem doğrulandı. | Orta. Arazi ufku büyük yükseklik haritalarından ön hesap ister ve süresi ölçülmedi. Ufuktaki 1 derecelik hata enerji sonucunu yüzde 11 ile 16 oynatıyor. | Ufuk hesabı notu, zamanla değişen veri notu |
| Güneş ve Dünya'nın ufka göre gösterimi | Challenge'ın "yapın" diye yazdığı tek hedef. Ufuk çizgisinin üzerinde Güneş'in ve Dünya'nın yolu. | Orta. Araştırmada yalnızca fikir olarak geçiyor; ekran tasarımı yok. | Ufuk hesabı notu (bölüm 10), açıklanabilirlik raporu (bölüm 7) |
| Olay saatleri ve süreler: gün doğumu, gün batımı, Dünya'nın doğuşu ve batışı, kalan süre, gece uzunluğu | Challenge "gün batımına ve Dünya batışına kalan süre"yi açıkça istiyor. Gece uzunluğu ve bir sonraki gün doğumu aynı hesaptan çıkar. | Düşük. Yalnız kutupta küçük bir açı hatası saati 20 dakikadan saatlere kadar kaydırıyor; tek saat yerine aralık göstermek gerekir. | Zamanla değişen veri notu (bölüm 6), CSA notu (bölüm 8) |
| Güç değerlendirmesi: Güneş'in yüksekliği ve güneşli süre | Challenge'ın adını verdiği iki ölçü. Konum hesabından doğrudan çıkar. | Düşük. | Zamanla değişen veri notu, güneş paneli notu |
| Dünya ile doğrudan iletişim penceresi | Challenge'ın ikinci ana sorusu. Kutupta Dünya ayda bir ufkun altına inip çıkıyor; hesap doğrulandı. | Düşük. "Dünya görünüyor" ölçütü seçilmedi; seçim pencereyi 19 ile 38 saat oynatıyor. | Efemeris raporu, ufuk hesabı notu |
| Hazır saha listesi ve özel koordinat girişi | Challenge'ın ilk hedefi. NASA'nın resmi tablosu Apollo, Chang'e, SLIM, IM-1, IM-2 ve Blue Ghost koordinatlarını veriyor; doğrulandı. | Düşük. Artemis aday bölgelerinin sınır dosyaları otomatik indirilemiyor. Liste eski plana ait; tarihiyle gösterilmeli. | Veri kaynakları kataloğu, açıklanabilirlik raporu |
| Sahaları ve tarihleri yan yana karşılaştırma | Challenge'ın özü: hızlı karşılaştırma. | Orta. Hesap tarafı hazır, ama karşılaştırma ekranının nasıl olacağı hiçbir belgede yok. | Açıklanabilirlik raporu (bölüm 7) |

### 7.2 Destekleyici

| Konu | Projeye yararı | Riski | Anlatıldığı yer |
|---|---|---|---|
| Koordinat sistemi ve saat kuralları | Bütün hesapların doğru yere ve doğru saate oturmasını sağlar. İki Ay koordinat sistemi karışırsa saha 660 ile 875 m kayıyor; doğrulandı. | Düşük. Yalnızca karar olarak yazılması gerekiyor. | Zamanla değişen veri notu, efemeris raporu |
| Güneş'i nokta değil disk saymak | Doğuş ve batış anını doğru verir. Ekibin hesabına göre kutupta nokta saymak saati 9 saate kadar kaydırıyor. | Düşük. Hesabı basit. | Ufuk hesabı notu, zamanla değişen veri notu |
| Dünya'nın gökyüzündeki salınımı | Challenge "hesaba katmayı düşünün" diyor. Konum hesabı bunu zaten içeriyor. | Yok. Ek iş gerektirmiyor. | Efemeris raporu |
| Güneş paneli modeli: panel tipi, yönü, direk yüksekliği | "Güç potansiyeli"ni Güneş açısından gerçek enerjiye çevirir. Ön hesap yeniden yapıldı ve tuttu. | Düşük ile orta arası. Önerilen iki varsayılan değer kaynakla uyuşmuyordu; notta düzeltildi. Arazi ufku olmadan sonuç kaba kalır. | Güneş paneli notu |
| Yer istasyonlarının Ay'ı görmesi | İletişim penceresini iki taraflı gösterir: yalnızca Dünya'nın görünmesi yetmez, bir istasyonun da Ay'ı görmesi gerekir. Hesap doğrulandı. | Düşük. Betik hazır. Etkisi günde dakikalar düzeyinde; ana sonucu değiştirmez. | Efemeris raporu |
| Veri kaynakları kataloğu | Hangi verinin nereden, hangi biçimde alınacağı belli. Ana kaynaklar tek tek kontrol edildi. | Düşük. Dosyalar birkaç gigabayt; parça parça okuma yöntemi çalışıyor ama indirme betiği yazılmadı. | Veri kaynakları kataloğu |
| Sonuçları hazır NASA haritalarıyla karşılaştırma | Jürinin "geçerlilik" ölçütüne doğrudan kanıt. Hazır aydınlanma ve Dünya görünürlüğü haritaları mevcut. | Düşük. Ek bir karşılaştırma adımı. | Veri kaynakları kataloğu, ufuk hesabı notu |
| Ağır hesabı önceden yapıp arayüze hazır dosya verme | Arayüzü hızlı tutar. Dört kişinin paralel çalışabilmesi için ortak sözleşme olur. | Orta. Dört belge dört ayrı dosya biçimi öneriyor. Karar verilmeden kimse güvenle başlayamaz. | Zamanla değişen veri notu, ışık ve ısı notu |
| Hata payı ve belirsizliği gösterme | "Geçerlilik" puanı. Kutupta sonuçların ne kadar oynak olduğunu dürüstçe gösterir. | Orta. Her olay için hesabı iki kez yapmayı gerektirir. | Açıklanabilirlik raporu, zamanla değişen veri notu |
| Üç düzeyde açıklama ve "neden" kartları | Challenge'ın "farklı beceri düzeyleri" ve "küçük değişiklik neden büyük fark yaratıyor" hedefleri. | Orta. İçerik yazımı zaman alır. Nedenler kanıt düzeyiyle etiketlenmezse yanlış bilgi verme riski var. | Açıklanabilirlik raporu |
| Kalıcı gölge katmanı | Challenge'ın "derin kraterler ve aşırı gölge" maddesi. Hazır NASA haritası var; doğrulandı. | Düşük. Harita üzerinde bir katman. | Veri kaynakları kataloğu, CSA notu |
| Lisans ve kullanım kuralları | Teslim kuralı: NASA logosu kullanılamaz; kullanılan her veri, kod ve yapay zeka aracı belirtilmeli. | Düşük efor, yüksek sonuç: uyulmazsa değerlendirme dışı kalınabilir. | Araç raporu, veri kaynakları kataloğu |

### 7.3 Ekstra özellik

Bunları challenge istemiyor ama ürüne değer katıyorlar. Sıra, kalan süre içinde yapılabilirliğe göre. Ekip kararıyla çıkarılan ekstra özellikler bölüm 7.5'te.

| Konu | Projeye yararı | Riski | Anlatıldığı yer |
|---|---|---|---|
| "Röle gerekli" etiketi | Dünya'nın hiç görünmediği sahalarda kullanıcıya açıklama verir. Chang'e-4 örneği doğrulandı. | Düşük. Yalnızca bir etiket. Röle uydusunun kendisini modellemek ise yüksek riskli; yörünge verisi yok. | CSA notu, açıklanabilirlik raporu |
| Geçmiş görev vakaları | Jüriye gerçek olaylarla anlatım. Altı inişin Güneş ve Dünya açıları yeniden hesaplandı ve tuttu; hazır doğrulama verisi. | Düşük ile orta arası. Kaza nedenlerinin çoğu ön bulgu; öyle etiketlenmeli. | Açıklanabilirlik raporu |
| CSA bilgi kartları | Partner ajans kaynağının kullanıldığını gösterir; "ilgililik" puanı. | Düşük. CSA sitesinde eskimiş bilgiler var; güncel olanla yazılmalı. | CSA notu |
| Tutulmalar | Güç kesintisini gösterir. Bir örnek olay iki araçla da doğrulandı. | Düşük. Nadir olay; demoda etkisi sınırlı. | Zamanla değişen veri notu |
| Çok ölçütlü saha puanı | Karşılaştırmayı tek sayıya indirir. Hindistan'ın yöntemi örnek alınmış. | Orta. Ağırlıklar keyfi kalabilir. Eğim ve pürüzlülük verisi ek iş. | CSA notu, veri kaynakları kataloğu |
| İniş yaklaşma profili ve gölge uyarısı | Alçak Güneş'te uzun gölge uyarısı verir. Gölge hesabı doğrulandı. | Orta. Yaklaşma yönü bilgisi gerekir. | CSA notu |
| Athena demosu | Tek bir gerçek olay üzerinden bütün ürünü anlatır. | Orta ile yüksek arası. Krater kenarı için çok ince yükseklik haritası gerekir; aracın gerçek duruş açıları bilinmiyor. | Açıklanabilirlik raporu (bölüm 8) |
| Zemin sıcaklığı modeli | "Cihazlar geceyi atlatır mı" sorusuna cevap. Denklemler makaleyle aynı. | Yüksek. Hazır araçta üç kurulum sorunu çıktı. Model sonuçları tekrar edilmedi. | Zamanla değişen veri notu, ışık ve ısı notu |
| Araç 3B modelleri ve fiziksel özellikler | Sahaya gerçek aracın modelini koymak görsel etki sağlar. | Orta. Lisansı doğrulanmış tek model NASA'nın Apollo iniş aracı; Apollo arazi aracı için serbest lisanslı bir model de bulundu. Güncel araçların (Athena, VIPER, Blue Ghost) ölçüleri büyük ölçüde eksik. Ticari sitelerdeki modellerin lisansı okunmadı. | Araç raporu |

### 7.4 Kapsam dışı

| Konu | Neden | Anlatıldığı yer |
|---|---|---|
| CSA program ayrıntıları (Canadarm3, Gateway, fon programı, astronotlar) | Ürün içeriğine girmez. Sunumda tek cümle olabilir. | CSA notu (bölüm 1 ile 4) |
| Konumlama tarihçesi ve Dünya'dan takip yöntemleri | Arka plan bilgisi. Üründe karşılığı yok. | Rover konumlama notu (bölüm 3, 5, 6) |
| Araçların devrilme ve kayma hesabı | Gereken veri yalnızca Apollo araçları için var; güncel araçlar için yok. Challenge'ın sorusuyla da bağı yok. | Araç raporu (bölüm 9) |
| Karmaşık katkı paylaştırma yöntemi (Shapley) | Raporun kendisi de ilk sürüme girmemesini öneriyor. | Açıklanabilirlik raporu (bölüm 7) |
| Ajans merkezlerinin haritası | Koordinatların bir kısmı doğrulanamadı; ürünün sorusuna katkısı yok. | Efemeris raporu |

### 7.5 Ekip kararıyla kapsamdan çıkarılanlar

14 Kasım 2026'da verilen kararla aşağıdaki konular projenin kapsamından çıkarıldı. Bunlar için proje dokümanı yazılmayacak ve plana girmeyecekler. Araştırma dosyaları depoda duruyor; doğrulama sonuçları bölüm 5'te ve eklerde kayıtlı.

| Konu | Önceki sınıfı | Çıkarılmadan önceki değerlendirme |
|---|---|---|
| Rover rota planlama ve rover enerji modeli | Ekstra özellik | Hiç kod yoktu; bütün bölge için ufuk hesabı gerektiriyordu. |
| Rover konumlama demosu | Ekstra özellik | Ana ürünün sorusuyla bağı zayıftı; yapay veriyle çalışacaktı. |
| Rover dijital ikizi (Unreal, Cesium, zemin fiziği) | Ekstra özellik | Ana üründen ayrı bir uygulamaydı; 41 iddianın 24'ü kaynaksızdı. |
| Batarya ve geceyi atlatma | Ekstra özellik | Araç değerleri varsayımdı. |
| Bölüm 7.4'teki bütün konular | Kapsam dışı | Sınıflandırma onaylandı. |

Bu karar başka konulardaki rover kısımlarını da kapsıyor: güneş paneli modelinde rover'ın yönüne göre hesap ve ışık ile ısı notundaki rover bölümleri de kapsam dışı. Gece uzunluğu ve "gün batımına kalan süre" kapsamda kalıyor; bunlar zorunlu olan olay saatleri konusunun parçası.

## 8. Belgeler arası çelişkiler

Aynı şey için farklı belgelerde farklı sayı ya da karar var. Aşama 2'de her biri için tek bir karar yazılmalı.

| Konu | Bir belge ne diyor | Diğer belge ne diyor | Öneri |
|---|---|---|---|
| Ufuk kaç yönde hesaplanacak | `zamanda-degisen-veri-hazirlama.md` ve `lunar-horizon`: 720 yön (yarım derece aralık) | `light-heat-layer` ve `solar-panel-model`: 360 yön | 720 yön. Literatürdeki standart bu ve saha başına dosya yalnızca birkaç kilobayt. |
| Ön hesap dosyalarının biçimi | `zamanda-degisen-veri-hazirlama.md`: ikili dosyalar (`ephem_*.bin`, `horizon.i16`) ve olaylar için JSON | `light-heat-layer`: CSV, NPZ ve ham ikili dosyalar. `lunar-horizon`: saha başına JSON. Efemeris raporu: statik JSON | Tek bir veri sözleşmesi yazılmalı (ADR). Dört belge dört ayrı biçim öneriyor. |
| Uygulamanın nerede çalışacağı | Rover notu: Unreal Engine, Cesium ve Blender | Araç raporu: Unity ya da Unreal. Diğer notlar: Python ile ön hesap ve tarayıcıda arayüz | Karar verildi (14 Kasım 2026): web arayüzü, `frontend-migrate/DESIGN.md` belgesindeki tasarım esas. Unity kullanılmayacak. 3B arazi görünümü ayrı olarak Unreal Engine ile geliştiriliyor ve sonra birleştirilecek. Karar belgesi: [ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md). |
| İki Ay koordinat sistemi arasındaki fark | Efemeris raporu: yaklaşık 875 m | `zamanda-degisen-veri-hazirlama.md`: sahaya göre 663 ile 875 m arası | İkisi de aynı şeyi söylüyor: sistemler karıştırılırsa yüzlerce metre hata olur. Tek sistem seçilmeli. |
| Hangi efemeris sürümü | Horizons DE441, ekibin SPICE dosyaları DE440 | Yükseklik haritaları DE421 ile hizalı; `data-sources` karar önerisinde "DE421 uyumlu" yazıyor | Çelişki değil ama karışıklığa açık. Karar belgesinde açıkça yazılmalı. |
| `astronomy-engine` kütüphanesinin lisansı | `data-sources`: MIT | `light-heat-layer`: "kontrol edilmeli" | Doğrulandı: MIT. "Kontrol edilmeli" notu kaldırılabilir. |
| VIPER rover'ının durumu | `solar-panel-model`: "iptal edildi" | Araç raporu: 2027 sonunda Mons Mouton'a gidecek | Araç raporu güncel ve doğrulandı. |
| HAKUTO-R M1 kazasında yükseklik | CSA notu ve sunumu: "yaklaşık 3 km sıçradı" | Açıklanabilirlik raporu: araç yaklaşık 5 km yukarıdaydı | Açılan kaynak 5 km diyor. |
| Test sahası koordinatı | Çoğu belge: 84,78 derece güney, 29,13 derece doğu (IM-2 hedef noktası) | Athena'nın gerçek indiği yer: 84,7906 derece güney, 29,1957 derece doğu | İkisi ayrı nokta. Saha listesinde iki ayrı kayıt olarak durmalı. |
| SLIM hedefe ne kadar yakın indi | CSA notu: 55 ile 100 m arası | Açıklanabilirlik raporu: hedefin yaklaşık 55 m doğusu | 55 m ölçülen değer, 100 m görevin hedefiydi. |
| Athena yüzeyde ne kadar çalıştı | `solar-panel-model`: 13 saatten kısa | Araç raporu: 12 saat 45 dakika | Aynı bilgi; kesin değer 12 saat 45 dakika. |
| Mons Mouton'da Güneş en çok ne kadar yükseliyor | `solar-panel-model`: 6,47 derece (Aralık 2026) | Açıklanabilirlik raporu: yaklaşık 6,8 derece. Efemeris raporu: 6,5 derece | Farklı dönemler için farklı değerler. Arayüzde değer her zaman tarihle birlikte gösterilmeli. |

## 9. Araştırmada eksik kalanlar

Aşağıdaki konularda hiç araştırma yok ya da karar verilmemiş. Plan yapılırken bunlar boşluk olarak karşımıza çıkacak.

| Eksik | Neden önemli |
|---|---|
| Arayüz ve teknoloji araştırması yok | Web mi, Unreal mi, ikisi birden mi kararı verilmemiş. Araştırma klasöründeki hiçbir belge arayüz kütüphanesi, harita gösterimi ya da barındırma konusunu ele almıyor. Karar (14 Kasım 2026): depodaki web arayüzü tasarım belgesi (`frontend-migrate/DESIGN.md`) esas alınacak. O belge araştırma klasörünün dışında olduğu için bu özette doğrulanmadı. |
| Ekran tasarımı yok | Challenge'ın özü "hızlı ve anlaşılır karşılaştırma". Hangi ekranların olacağı, karşılaştırmanın nasıl görüneceği hiçbir belgede çizilmemiş. |
| Tek veri sözleşmesi yok | Dört belge dört ayrı dosya biçimi öneriyor. `docs/adr/` klasörü boş. |
| Saha listesi derlenmemiş | Koordinatlar farklı belgelere dağılmış durumda. Tek bir liste yok. |
| Kullanıcı türlerine göre içerik planı yok | Challenge planlamacı, eğitimci ve halk için ayrı düzey öneriyor. Açıklanabilirlik raporu bunu kavram olarak anlatıyor ama hangi ekranda ne gösterileceği belli değil. |
| Sunum ve demo planı yok | Teslimde 7 slayt ya da 30 saniyelik video isteniyor. Sunum, jürinin beş ölçütünden biri. |

## 10. Onaylanan kapsam ve Aşama 2

Bu özet 14 Kasım 2026'da gözden geçirildi ve aşağıdaki kararlar verildi.

### 10.1 Kararlar

| Konu | Karar |
|---|---|
| Sınıflandırma | Onaylandı. Rover ile ilgili bütün konular, batarya ve kapsam dışı konular çıkarıldı (bölüm 7.5). |
| Arayüz | Web arayüzü. `frontend-migrate/DESIGN.md` belgesindeki tasarım esas alınacak. 3B arazi görünümü ayrı olarak Unreal Engine ile geliştiriliyor; web arayüzüyle birleştirme sonraya bırakıldı. Rover simülasyonu yine kapsam dışı. |
| Stack | Onaylandı: [ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md). |
| Çin görevlerinin sahaları | Listede kalacak. |
| Ekstra özellikler | Çıkarılanlar dışında kalan bütün ekstra özellikler için proje dokümanı yazılacak. |
| Araştırma notları | Düzeltildi (bölüm 6). |

### 10.2 Aşama 2'de yazılacak çekirdek dokümanlar

Dosyalar `docs/design/` altında, konu başına bir tane olacak. Veri biçimi ya da arayüz ile hesap arasındaki sözleşmeyi tanımlayanlar için `docs/adr/` altına karar taslağı da yazılacak.

| Dosya | İçerik | Dayandığı araştırma | Karar taslağı |
|---|---|---|---|
| `gunes-dunya-konumu.md` | Güneş ve Dünya'nın konum hesabı, koordinat sistemi, saat kuralları | Zamanla değişen veri notu, efemeris raporu, hesap arşivi | Koordinat sistemi ve saat ölçeği; hesap kütüphanesi |
| `ufuk-hesabi.md` | Düz ufuk, arazi ufku, Güneş'in disk olarak ele alınması | Ufuk hesabı notu, zamanla değişen veri notu | Ufuk dosyasının biçimi |
| `olaylar-ve-sureler.md` | Gün doğumu ve batımı, Dünya'nın doğuşu ve batışı, kalan süre, gece uzunluğu, hata payı | Zamanla değişen veri notu, açıklanabilirlik raporu | Olay listesinin biçimi |
| `guc-degerlendirmesi.md` | Güneş yüksekliği, güneşli süre, panel tipi ve direk yüksekliğine göre güç | Güneş paneli notu, zamanla değişen veri notu | Panel profili biçimi |
| `iletisim-penceresi.md` | Dünya'nın görünürlüğü, "Dünya görünüyor" ölçütü, yer istasyonları | Efemeris raporu, ufuk hesabı notu | Olay listesine dahil |
| `saha-katalogu.md` | Hazır saha listesi, koordinat kaynakları, özel koordinat girişi | Veri kaynakları kataloğu, açıklanabilirlik raporu | Saha kaydının biçimi |
| `veri-kaynaklari-ve-on-hesap.md` | Hangi veri nereden alınır, ön hesap nasıl yapılır, dosya düzeni | Veri kaynakları kataloğu, zamanla değişen veri notu | Ortak veri sözleşmesi |
| `gosterim-ve-arayuz.md` | Güneş ve Dünya'nın ufka göre gösterimi, zaman çizelgesi, arayüz tasarımıyla eşleme | Ufuk hesabı notu, açıklanabilirlik raporu, arayüz tasarım belgesi | Arayüz ile hesap arasındaki sözleşme |
| `karsilastirma-ve-aciklama.md` | Yan yana karşılaştırma, üç düzeyde anlatım, "neden" kartları | Açıklanabilirlik raporu | Yok |
| `dogrulama-plani.md` | Sonuçlarımızı Horizons ve hazır NASA haritalarıyla karşılaştırma | Veri kaynakları kataloğu, bu özetin ekleri | Yok |

### 10.3 Aşama 2'de yazılacak ekstra özellik dokümanları

| Dosya | İçerik | Dayandığı araştırma |
|---|---|---|
| `kalici-golge-katmani.md` | Hazır NASA haritasından kalıcı gölge gösterimi | Veri kaynakları kataloğu, CSA notu |
| `role-etiketi.md` | Dünya'nın görünmediği sahalarda "röle gerekli" etiketi | CSA notu, açıklanabilirlik raporu |
| `gecmis-gorev-vakalari.md` | Geçmiş inişlerin tarih, yer ve gökyüzü durumu; kanıt düzeyi etiketleri | Açıklanabilirlik raporu |
| `athena-demosu.md` | Tek bir gerçek iniş üzerinden ürünün anlatımı | Açıklanabilirlik raporu |
| `csa-bilgi-kartlari.md` | Kanada katkısı olan sahalar için bilgi kartları | CSA notu |
| `tutulmalar.md` | Dünya'nın Güneş'i örttüğü olayların bulunması ve gösterimi | Zamanla değişen veri notu |
| `saha-puani.md` | Birkaç ölçütü tek puanda toplama | CSA notu, veri kaynakları kataloğu |
| `yaklasma-profili-ve-golge-uyarisi.md` | İniş yönündeki arazi kesiti ve alçak Güneş uyarısı | CSA notu |
| `zemin-sicakligi.md` | Zemin sıcaklığı modeli | Zamanla değişen veri notu, ışık ve ısı notu |
| `arac-modelleri.md` | Lisansı doğrulanmış araç modelleri, ölçüler ve kullanım kuralları | Araç raporu |
