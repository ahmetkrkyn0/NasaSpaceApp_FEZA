# Kullanıcı Planı: Akış, Use Case'ler ve Senaryolar

- **Tarih:** 14 Kasım 2026
- **Durum:** Taslak. Ekip gözden geçirecek; değişiklikler PR ile yapılır.
- **Kapsam:** Ürünü kimin, hangi soruyla, hangi adımlarla kullanacağı. Hesap yöntemi ve ekran tasarımı bu belgenin konusu değil; onlar [docs/design/](../design/) altındaki tasarım belgelerinde ve [docs/adr/](../adr/README.md) altındaki karar kayıtlarında.

Bu belge, [araştırma analiz özetinin](../research/ANALIZ-OZETI.md) 9. bölümünde eksik diye yazılan "kullanıcı türlerine göre içerik planı yok" maddesini karşılar. Tasarım belgeleri her özelliği tek tek anlatır; bu belge onları kullanıcının gözünden birbirine bağlar. Bir çelişki olursa tasarım belgeleri ve karar kayıtları geçerlidir. Kimlikler (`K`, `UC`, `S`) sabittir; düzenlerken numara değiştirmeyin, yeni madde için sıradaki numarayı kullanın.

## İçindekiler

1. [Dayandığı belgeler](#1-dayandığı-belgeler)
2. [Kapsam sınırı](#2-kapsam-sınırı)
3. [Kullanıcılar](#3-kullanıcılar)
4. [Genel akış](#4-genel-akış)
5. [Use case'ler](#5-use-caseler)
6. [Kullanıcıya göre akışlar](#6-kullanıcıya-göre-akışlar)
7. [Senaryolar](#7-senaryolar)
8. [Hedeflere izlenebilirlik](#8-hedeflere-izlenebilirlik)
9. [Demo için notlar](#9-demo-için-notlar)
10. [Açık kararlar](#10-açık-kararlar)
11. [Kitle stratejisi belgesiyle farklar](#11-kitle-stratejisi-belgesiyle-farklar)

## 1. Dayandığı belgeler

| Belge | Bu plana ne verdi |
| --- | --- |
| [Challenge metni](../challenge/lunar-landing-site-navigator.md) | Üç kullanıcı türü ve yedi hedef (bölüm 8'de `O1`–`O7`) |
| [Araştırma analiz özeti](../research/ANALIZ-OZETI.md) | Onaylı kapsam (bölüm 7 ve 10), doğrulanmış sayılar (bölüm 5), belgeler arası çelişkiler (bölüm 8) |
| [Açıklanabilirlik raporu](../research/explainability-mission-differences/) | Üç düzeyde anlatım, karşılaştırma yöntemi, "neden" kartları, vaka senaryoları |
| [Arayüz tasarım belgesi](../../frontend-migrate/DESIGN.md) | Referans ekranlar ve panel yerleşimi (PLAN ve ANALYZE kipleri) |
| [Tasarım belgeleri](../design/) | Her use case'in hesabı, girdisi, çıktısı ve arayüzdeki yeri. Özellikle [gösterim ve arayüz](../design/gosterim-ve-arayuz.md) ile [karşılaştırma ve açıklama](../design/karsilastirma-ve-aciklama.md) |
| [Karar kayıtları](../adr/README.md) | Mimari (ADR-0001), koordinat ve zaman kuralları (ADR-0002), veri sözleşmesi (ADR-0003), sunucu uç noktaları (ADR-0004) |
| [Zamanla değişen veri notu](../research/zamanda-degisen-veri-hazirlama.md), [ufuk hesabı notu](../research/lunar-horizon/README.md) | Olaylar, pencereler, ufuk ve gösterim önerisi |
| [Güneş paneli notu](../research/solar-panel-model/README.md), [efemeris ve yer istasyonları](../research/ephemeris-rotation-ground-stations/README.md) | Güç ve iletişim use case'lerinin girdileri |
| [Veri kaynakları kataloğu](../research/data-sources/README.md), [CSA notu](../research/csa-moon-exploration.md) | Saha listesi, katmanlar, ekstra özelliklerin kaynağı |
| Jüri ve teslim kılavuzları (`docs/challenge/*.pdf`) | Demo sınırları ve beş puanlama ölçütü |

Senaryolardaki sayıların hepsi analiz özetinde "doğrulandı" etiketi taşıyanlardan seçildi. Öyle olmayan yerde yanında not var.

## 2. Kapsam sınırı

Sınıflar analiz özetinin 7. bölümünden aynen alındı.

| Sınıf | Bu plandaki karşılığı |
| --- | --- |
| **Zorunlu** | Güneş ve Dünya konumu, ufuk, ufka göre gösterim, olay saatleri ve süreler, güç değerlendirmesi, iletişim penceresi, saha listesi ve özel koordinat, yan yana karşılaştırma (`UC-01`–`UC-08`) |
| **Destekleyici** | Üç düzeyde açıklama ve "neden" kartları, hata payı ve kaynak gösterimi, panel tipi ve direk yüksekliği, yer istasyonları, kalıcı gölge katmanı (`UC-09`–`UC-12` ve zorunlu use case'lerin içindeki seçenekler) |
| **Ekstra** | Geçmiş görev vakaları, Athena demosu, "röle gerekli" etiketi, tutulmalar, CSA bilgi kartları, saha puanı, yaklaşma profili ve gölge uyarısı, zemin sıcaklığı, araç modelleri, bataryasız mini oyun (`UC-13`–`UC-17` ve ilgili seçenekler) |
| **Kapsam dışı** | Rover ile ilgili her şey (rota, enerji, konumlama, dijital ikiz), batarya ve geceyi atlatma modeli, karmaşık katkı paylaştırma (Shapley), ajans merkezleri haritası, araçların devrilme hesabı |

Kapsam dışı maddeler için bu planda use case ya da senaryo yok. Gece uzunluğu ve "gün batımına kalan süre" kapsamda; bunlar olay saatlerinin parçası.

3B arazi görünümü web arayüzünün ilk sürümünde yok. Unreal Engine ile ayrı geliştiriliyor ve sonra birleştirilecek ([ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md)). Bu plandaki use case'ler web arayüzünü anlatır.

## 3. Kullanıcılar

Challenge üç kullanıcı türü sayıyor. Açıklanabilirlik raporu (bölüm 7, "kademeli açıklama") her birine ayrı bir anlatım düzeyi öneriyor. Üçü de aynı hesabı görür; değişen yalnızca ayrıntı düzeyidir.

| Kimlik | Kullanıcı | Kim | Asıl sorusu | Ne görür | İşini bitirdiğini nasıl anlar |
| --- | --- | --- | --- | --- | --- |
| `K1` | Görev planlamacı | Bilim ve mühendislik ekiplerinde saha ve tarih seçen kişi | "Tarih ya da saha değişirse güç ve iletişim nasıl etkilenir?" | Sayılar, saat aralıkları (hata payıyla), fark tablosu, dışa aktarma | İki ya da daha çok senaryoyu aynı ölçülerle kıyaslayıp birini seçebildi |
| `K2` | Eğitimci | Öğretmen, atölye yürütücüsü, bilim iletişimcisi | "Kutupta iniş neden bu kadar zor, bunu nasıl gösteririm?" | Gökyüzü görünümü, fiziksel neden ve basit formül | Bir kavramı tek bir girdiyi değiştirerek gösterebildi |
| `K3` | Halk | Meraklı ziyaretçi, öğrenci | "Ay'da bu noktada durmak nasıl bir şey?" | Tek cümlelik sonuç ve simge | Bir sahada Güneş'in ve Dünya'nın ne yaptığını kendi cümlesiyle anlatabildi |

Tasarım belgelerinde bu üç düzey üç giriş kapısı olarak geçer: halk için Keşfet, eğitimci için Sınıf, planlamacı için Planla ([gösterim ve arayüz](../design/gosterim-ve-arayuz.md), "Üç giriş kapısı"). Üç kapı aynı saha, tarih ve zaman durumunu paylaşır; kullanıcı kapı değiştirdiğinde aynı senaryoya başka ayrıntıyla bakar.

Jüri bir kullanıcı türü değildir ama demoyu izler; ona dair notlar bölüm 9'da.

## 4. Genel akış

Her kullanıcı aynı omurgadan geçer: bir saha ve bir tarih seçer, gökyüzünü görür, özet ölçüleri okur, sonra ya zamanı oynatır ya nedenini sorar ya da ikinci bir senaryo ekleyip kıyaslar.

```mermaid
flowchart TD
  A["Giriş ekranı"] --> B{"Nereden başlıyor?"}
  B -- "Hazır senaryo" --> C["Hazır senaryoyu aç<br/>UC-13"]
  B -- "Kendi senaryosu" --> D["Saha seç:<br/>hazır liste ya da özel koordinat<br/>UC-01, UC-02"]
  D --> E["Tarih ve saat seç<br/>UC-03"]
  C --> F
  E --> F["Gökyüzü görünümü:<br/>Güneş ve Dünya ufka göre<br/>UC-04"]
  F --> G["Özet: olay saatleri, güç, iletişim<br/>UC-05, UC-06, UC-07"]
  G --> H{"Sonra ne yapıyor?"}
  H -- "Zamanı oynatır" --> F
  H -- "Nedenini sorar" --> I["Neden kartı ve güvenilirlik<br/>UC-09, UC-10"]
  H -- "Başka saha ya da tarih dener" --> J["Senaryo ekle,<br/>yan yana karşılaştır<br/>UC-08"]
  H -- "Haritaya bakar" --> L["Harita ve katmanlar<br/>UC-12"]
  I --> H
  J --> H
  L --> H
  H -- "Bitirir" --> K["Dışa aktar,<br/>bağlantıyı paylaş<br/>UC-11"]
```

Anlatım düzeyi (`K1`, `K2`, `K3`) bu akışın bir adımı değil, her adımda geçerli bir ayardır. Düzey, kapı (Keşfet, Sınıf, Planla) seçilerek belirlenir; kapıların ayrı sayfalar mı yoksa tek sayfada bir anahtar mı olacağı açık karar (bölüm 10, madde 1).

### Akışın arayüzdeki karşılığı

Ekranların kesin tarifi [gösterim ve arayüz](../design/gosterim-ve-arayuz.md) belgesinde (bölüm 4, "Ekran iskeleti"). Aşağıdaki tablo o belgenin akış adımlarına göre özetidir.

| Akış adımı | Arayüzde nerede | Not |
| --- | --- | --- |
| Giriş | Açılış ve karşılama ekranı | Referans tasarımdaki ekran korunur; ürün adı ve metinler değişir |
| Hazır senaryo ya da saha seçimi | Saha ve tarih seçim ekranı | Referans tasarımdaki rover seçim ekranı ("hangar") buna dönüşür |
| Saha, tarih ve panel kurulumu | Çalışma ekranı, PLAN kipi, sol bölme | Senaryo: saha, tarih aralığı, direk yüksekliği, panel tipi |
| Gökyüzü görünümü | ANALYZE kipi, sağ bölmede Sky sekmesi: ufuk şeridi | Referans tasarımda yok; yeni bileşen |
| Zamanı oynatma | Alt bölmedeki zaman çizelgesi ve durum şeridindeki oynatma denetimi | Korunur |
| Kalan süre | Haritanın üstündeki bilgi alanı | Dört değer: gün batımı ya da doğumu, Dünya'nın batışı ya da doğuşu |
| Güç ve iletişim | Sağ bölmede Power ve Comms sekmeleri | Dünya görünürlüğü paneli Comms sekmesine taşınır |
| Karşılaştırma ve dışa aktarma | Sağ bölmede Compare sekmesi | En fazla dört senaryo; tablo CSV ya da JSON olarak iner |
| Harita ve katmanlar | Orta alanda 2B harita, katman seçici | 3B arazi web arayüzünde yok (ADR-0001) |
| Kaynak ve güvenilirlik | Veri kaynağı paneli ve her sonucun yanındaki güvenilirlik etiketi | Etiketler: Measured, Model, Derived, Assumed |

Referans tasarımdaki asistan ve görev raporu ilk sürümde yok. Rover, rota ve ROS ile ilgili paneller kaldırılıyor.

## 5. Use case'ler

### 5.1 Özet tablo

"Kim" sütununda ilk yazılan asıl kullanıcıdır. "Tasarım belgesi" sütunu use case'in hesabını ve arayüzdeki yerini anlatan belgeye bağlanır; parantez içindekiler o use case'in seçeneklerine aittir.

| Kimlik | Use case | Kim | Sınıf | Challenge hedefi | Tasarım belgesi |
| --- | --- | --- | --- | --- | --- |
| `UC-01` | Hazır listeden saha seçmek | Hepsi | Zorunlu | O1 | [saha-katalogu](../design/saha-katalogu.md) ([csa-bilgi-kartlari](../design/csa-bilgi-kartlari.md)) |
| `UC-02` | Özel koordinat girmek | K1 | Zorunlu | O1 | [saha-katalogu](../design/saha-katalogu.md), [ufuk-hesabi](../design/ufuk-hesabi.md) |
| `UC-03` | Tarih ve saat seçmek, zamanı oynatmak | Hepsi | Zorunlu | O2, O6 | [gosterim-ve-arayuz](../design/gosterim-ve-arayuz.md) |
| `UC-04` | Güneş ve Dünya'yı ufka göre görmek | Hepsi | Zorunlu | O3, O5 | [gunes-dunya-konumu](../design/gunes-dunya-konumu.md), [ufuk-hesabi](../design/ufuk-hesabi.md), [gosterim-ve-arayuz](../design/gosterim-ve-arayuz.md) |
| `UC-05` | Olay saatlerini ve kalan süreyi görmek | K1, K3 | Zorunlu | O3, O6 | [olaylar-ve-sureler](../design/olaylar-ve-sureler.md) ([tutulmalar](../design/tutulmalar.md)) |
| `UC-06` | Güç durumunu değerlendirmek | K1, K2 | Zorunlu | O4 | [guc-degerlendirmesi](../design/guc-degerlendirmesi.md) |
| `UC-07` | İletişim penceresini değerlendirmek | K1, K2 | Zorunlu | O4 | [iletisim-penceresi](../design/iletisim-penceresi.md) ([role-etiketi](../design/role-etiketi.md)) |
| `UC-08` | Senaryoları yan yana karşılaştırmak | K1, K2 | Zorunlu | O1, O2 | [karsilastirma-ve-aciklama](../design/karsilastirma-ve-aciklama.md) |
| `UC-09` | "Neden" açıklamasını okumak | K3, K2, K1 | Destekleyici | O7 | [karsilastirma-ve-aciklama](../design/karsilastirma-ve-aciklama.md) |
| `UC-10` | Sonucun güvenilirliğini görmek | K1 | Destekleyici | – | [olaylar-ve-sureler](../design/olaylar-ve-sureler.md), [dogrulama-plani](../design/dogrulama-plani.md) |
| `UC-11` | Karşılaştırmayı dışa aktarmak ve paylaşmak | K1 | Destekleyici | – | [karsilastirma-ve-aciklama](../design/karsilastirma-ve-aciklama.md) |
| `UC-12` | Haritada sahayı ve katmanları görmek | Hepsi | Destekleyici | O5 | [kalici-golge-katmani](../design/kalici-golge-katmani.md), [gosterim-ve-arayuz](../design/gosterim-ve-arayuz.md) ([arac-modelleri](../design/arac-modelleri.md)) |
| `UC-13` | Hazır senaryoyu (geçmiş görev vakası) açmak | K2, K3 | Ekstra | O7 | [gecmis-gorev-vakalari](../design/gecmis-gorev-vakalari.md), [athena-demosu](../design/athena-demosu.md) |
| `UC-14` | Sahaları puanla sıralamak | K1 | Ekstra | O1 | [saha-puani](../design/saha-puani.md) |
| `UC-15` | Yaklaşma profilini ve gölge uyarısını görmek | K1 | Ekstra | – | [yaklasma-profili-ve-golge-uyarisi](../design/yaklasma-profili-ve-golge-uyarisi.md) |
| `UC-16` | Zemin sıcaklığını görmek | K1, K2 | Ekstra | – | [zemin-sicakligi](../design/zemin-sicakligi.md) |
| `UC-17` | İniş tarihini oyunla denemek | K3, K2 | Ekstra | O2, O7 | [mini-oyun](../design/mini-oyun.md) |

`UC-11` analiz özetinde ayrı bir konu olarak sınıflandırılmadı; [karşılaştırma ve açıklama](../design/karsilastirma-ve-aciklama.md) belgesinde planlamacı kapısının ek gösterimi olarak geçiyor.

### 5.2 Kim hangisini kullanır

● asıl kullanıcı, ○ ara sıra kullanır, boş: beklenmez.

| Use case | K1 Planlamacı | K2 Eğitimci | K3 Halk |
| --- | :---: | :---: | :---: |
| `UC-01` Hazır saha | ● | ● | ● |
| `UC-02` Özel koordinat | ● | ○ | |
| `UC-03` Tarih ve zaman | ● | ● | ● |
| `UC-04` Gökyüzü görünümü | ● | ● | ● |
| `UC-05` Olay saatleri | ● | ○ | ● |
| `UC-06` Güç | ● | ● | ○ |
| `UC-07` İletişim | ● | ● | ○ |
| `UC-08` Karşılaştırma | ● | ● | ○ |
| `UC-09` Neden kartı | ○ | ● | ● |
| `UC-10` Güvenilirlik | ● | ○ | |
| `UC-11` Dışa aktarma | ● | ○ | |
| `UC-12` Harita ve katmanlar | ● | ● | ● |
| `UC-13` Hazır senaryo | ○ | ● | ● |
| `UC-14` Saha puanı | ● | | |
| `UC-15` Yaklaşma profili | ● | | |
| `UC-16` Zemin sıcaklığı | ● | ○ | |
| `UC-17` Mini oyun | | ○ | ● |

### 5.3 Zorunlu use case'ler

Her use case'in tasarım belgesi 5.1'deki tabloda. Aşağıdaki "Dayanak" satırları araştırma kaynaklarını gösterir.

#### UC-01 Hazır listeden saha seçmek

- **Amaç:** Koordinat bilmeden tanınmış bir sahayla başlamak.
- **Akış:**
  1. Kullanıcı saha listesini açar. Liste kategorilere ayrılmıştır: Apollo, CLPS, ticari, uluslararası, Artemis aday bölgeleri, test sahası.
  2. Bir saha seçer. Saha haritada işaretlenir ve kısa bir bilgi kartı açılır (görev, tarih, koordinat, kaynak).
  3. Seçilen saha etkin senaryonun sahası olur.
- **Seçenekler:**
  - Geçmiş bir iniş seçildiğinde tarih de o inişin anına ayarlanabilir (`UC-13`'e geçiş).
  - Kanada katkısı olan sahalarda CSA bilgi kartı görünür (ekstra).
- **Dikkat:**
  - Artemis aday bölgeleri eski plana ait; "2024 Artemis III candidate study" etiketiyle gösterilir. Temsili noktaları henüz elimizde olmadığı için sınır dosyası indirilene kadar listeye girmezler.
  - IM-2 hedef noktası ile Athena'nın gerçekten indiği yer iki ayrı kayıt.
- **Dayanak:** Veri kaynakları kataloğu (bölüm 2), analiz özeti (7.1 ve 8), CSA notu (6.1).

#### UC-02 Özel koordinat girmek

- **Amaç:** Listede olmayan bir noktayı değerlendirmek.
- **Akış:**
  1. Kullanıcı enlem ve boylam yazar ya da haritada bir noktaya tıklar.
  2. Sistem girdiyi doğrular ve noktayı haritada gösterir. Boylam 0 ile 360 arası yazılırsa çevrilir.
  3. Nokta etkin senaryonun sahası olur.
- **Seçenekler:**
  - Geçersiz girdi (aralık dışı, eksik) alan yanında açıklanır; senaryo değişmez.
  - O nokta için yükseklik haritası yoksa hesap düz (arazisiz) ufukla yapılır; sonuç "arazi hesaba katılmadı" diye gösterilir ve güvenilirlik etiketi Assumed olur (bölüm 10, madde 5).
- **Dikkat:** Koordinatlar tek sistemde tutulur ([ADR-0002](../adr/0002-koordinat-sistemi-ve-zaman.md)). İki Ay koordinat sistemi karışırsa saha 660 ile 875 m arası kayar.
- **Dayanak:** Ufuk hesabı notu (bölüm 10, madde 3), analiz özeti (7.2).

#### UC-03 Tarih ve saat seçmek, zamanı oynatmak

- **Amaç:** Koşulların zaman içinde nasıl değiştiğini görmek.
- **Akış:**
  1. Kullanıcı bir başlangıç tarihi ve süre seçer; seçili an bu aralıkta gezer. Saatler UTC olarak gösterilir.
  2. Zaman çubuğunu sürükler ya da oynatır; gökyüzü görünümü ve özet ölçüler birlikte güncellenir.
  3. İsterse bir Ay günü ya da birkaç ay ileri geri atlar.
- **Seçenekler:** Hazır veri aralığının dışındaki bir tarih seçilirse sistem aralığı söyler ve en yakın geçerli tarihi önerir.
- **Dikkat:** Sayılar döneme göre değişir (örneğin Mons Mouton'da Güneş'in en yüksek açısı dönemine göre 6,5 ile 6,8 derece arası). Her değer tarihiyle birlikte gösterilmeli.
- **Dayanak:** Challenge metni ("Date and time flexibility", "Temporal dynamics"), analiz özeti (bölüm 8).

#### UC-04 Güneş ve Dünya'yı ufka göre görmek

- **Amaç:** Challenge'ın "yapın" diye yazdığı tek hedef: seçilen saha ve anda Güneş ile Dünya ufka göre nerede.
- **Akış:**
  1. Sistem, sahanın ufuk çizgisini bir siluet olarak çizer (ufuk şeridi).
  2. Güneş'in ve Dünya'nın seçili dönemdeki yolu siluetin üzerine çizilir. Seçili andaki Güneş ve Dünya görünen boyutlarıyla birer disk olarak gösterilir; ufkun altındaysa soluk çizilir.
  3. Kullanıcı Güneş'in ya da Dünya'nın üzerine geldiğinde yön ve yükseklik açısını okur.
- **Seçenekler:** Güneş ufukla kısmen örtülüyse görünen oranı gösterilir (Güneş nokta değil, yaklaşık yarım derecelik bir disk).
- **Dikkat:** Atmosfer yok; kırılma düzeltmesi ve alacakaranlık yok. Ufku arazi ve Ay'ın eğriliği belirler.
- **Dayanak:** Ufuk hesabı notu (bölüm 5 ve 10), açıklanabilirlik raporu (bölüm 7, "sky plot" ve ufuk profili).

#### UC-05 Olay saatlerini ve kalan süreyi görmek

- **Amaç:** "Ne zaman kararır, ne zaman Dünya batar?" sorusuna tek bakışta cevap.
- **Akış:**
  1. Sistem seçili an için şunları gösterir: gün batımına kalan süre, Dünya'nın batışına kalan süre, bir sonraki gün doğumu, gecenin uzunluğu.
  2. Zaman çizelgesinde güneşli ve karanlık dönemler, Dünya'nın görünür ve görünmez olduğu dönemler ve seçili an görünür.
  3. Kullanıcı bir olaya tıklayınca zaman o ana gider.
- **Seçenekler:**
  - Güneş ya da Dünya o dönemde hiç batmıyorsa ya da hiç doğmuyorsa geri sayım yerine bu durum yazılır.
  - Dünya'nın Güneş'i örttüğü olaylar (tutulma) listede ayrı bir işaretle görünür (ekstra).
- **Dikkat:**
  - Kutupta küçük bir ufuk hatası olay saatini 20 dakikadan fazla kaydırır. Tek saat yerine saat aralığı gösterilmeli (`UC-10`).
  - "Gün doğumu"nun Güneş'in ilk kenarıyla mı merkeziyle mi sayılacağı açık karar (bölüm 10, madde 11).
- **Dayanak:** Zamanla değişen veri notu (bölüm 6), analiz özeti (7.1).

#### UC-06 Güç durumunu değerlendirmek

- **Amaç:** Bu saha ve tarihte Güneş'ten ne kadar yararlanılabilir.
- **Akış:**
  1. Sistem Güneş'in yükseklik açısını, seçili dönemdeki güneşli süreyi ve en uzun karanlık süreyi gösterir.
  2. Kullanıcı isterse panel tipini (yere yatık, dik sabit, dik dönen, iki eksenli) ve direk yüksekliğini (2, 5, 10 ya da 20 m) seçer.
  3. Sistem dönem boyunca güç eğrisini ve ortalama gücü gösterir.
- **Seçenekler:** Dik sabit panelde kullanıcı panelin baktığı yönü de girer.
- **Dikkat:**
  - Ufuktaki 1 derecelik fark enerji sonucunu yüzde 11 ile 16 arası oynatır; arazi ufku yoksa sonuç kabadır ve öyle etiketlenmeli.
  - Uygulama bataryayı ve gece dayanımını modellemez; yalnızca gün batımına kalan süreyi ve gece uzunluğunu gösterir.
  - Hazır panel profilleri varsayımdır; güç sonuçları Assumed etiketi taşır.
- **Dayanak:** Güneş paneli notu (bölüm 4 ve 12, "Kullanım 1"), analiz özeti (7.1, 7.2, 7.5).

#### UC-07 İletişim penceresini değerlendirmek

- **Amaç:** Araç bu saha ve tarihte Dünya ile röle olmadan konuşabilir mi.
- **Akış:**
  1. Sistem Dünya'nın yükseklik açısını ve seçili dönemde Dünya'nın görünür olduğu pencereleri gösterir.
  2. Kullanıcı isterse yer istasyonu katmanını açar: yalnızca Dünya'nın görünmesi yetmez, bir istasyonun da Ay'ı görmesi gerekir.
- **Seçenekler:** Dünya dönem boyunca hiç görünmüyorsa "röle gerekli" etiketi çıkar (ekstra). Röle uydusunun kendisi modellenmez.
- **Dikkat:**
  - "Dünya görünüyor" ölçütü (merkezi mi, kenarı mı, tamamı mı) pencereyi 19 ile 38 saat arası oynatıyor. Öneri merkez; ölçüt arayüzde değiştirilebilir (bölüm 10, madde 3).
  - Yer istasyonu katmanı için öneri alım sınırı, yani 6 derece (bölüm 10, madde 4).
- **Dayanak:** Efemeris raporu, zamanla değişen veri notu (bölüm 9), analiz özeti (5.2, 7.1, 7.3).

#### UC-08 Senaryoları yan yana karşılaştırmak

- **Amaç:** Challenge'ın özü: saha ve tarih seçeneklerini hızlı kıyaslamak.
- **Akış:**
  1. Kullanıcı etkin senaryoyu (saha ve tarih) karşılaştırmaya ekler.
  2. Tek bir girdiyi değiştirerek ikinci senaryoyu oluşturur. İki hazır kalıp vardır: "aynı saha, başka tarih" ve "aynı tarih, başka saha".
  3. Sistem senaryoları aynı ölçülerle yan yana gösterir: güneşli zaman oranı, en uzun karanlık, Güneş'in en yüksek açısı, Dünya'nın görünür olduğu zaman oranı, en uzun "Dünya görünmez" süresi, ortalama panel gücü.
  4. Sistem her ölçüde en iyi senaryoyu işaretler ve farkı gösterir.
- **Seçenekler:**
  - Bir seferde en fazla dört senaryo karşılaştırılır.
  - Planlamacı kapısında "fırlatma N gün kayarsa" kaydırıcısı aynı sahanın başlangıç tarihini kaydırır ve karşılaştırmayı yineler.
  - Farkın nedeni sorulursa `UC-09` açılır.
- **Dikkat:** Senaryolardan biri arazi ufkuyla, diğeri düz ufukla hesaplandıysa fark gerçek olmayabilir; arayüz bunu belirtir.
- **Dayanak:** Açıklanabilirlik raporu (bölüm 7, karşı-olgusal karşılaştırma; bölüm 8.3), analiz özeti (7.1).

### 5.4 Destekleyici use case'ler

#### UC-09 "Neden" açıklamasını okumak

- **Amaç:** Küçük bir değişikliğin neden büyük fark yarattığını anlamak.
- **Akış:**
  1. Kullanıcı bir sonucun ya da bir farkın yanındaki "neden" bağlantısına basar.
  2. Sistem bir kart açar. Kartın düzeyi kullanıcıya göre değişir:
     - Halk: tek cümle ve simge ("Burada Güneş ufkun hemen üstünde gezinir").
     - Eğitimci: gökyüzü görünümü, fiziksel neden ve basit formül.
     - Planlamacı: sayılar, hangi girdinin farkı yarattığı, saat aralıkları.
  3. Kullanıcı kartı açarak bir alt düzeydeki ayrıntıya inebilir.
- **Dikkat:**
  - Her kartta kanıt düzeyi etiketi olmalı. Geçmiş kazaların nedenlerinin çoğu "ön bulgu".
  - Araç kaynaklı neden, ortam kaynaklı neden gibi sunulmamalı.
- **Dayanak:** Açıklanabilirlik raporu (bölüm 7 ve 9; hazır İngilizce ve Türkçe metinler bölüm 9'da), analiz özeti (7.2).

#### UC-10 Sonucun güvenilirliğini görmek

- **Amaç:** Bir sayının ne kadar güvenilir olduğunu ve nereden geldiğini bilmek.
- **Akış:**
  1. Olay saatleri tek saat yerine aralık olarak gösterilir ("14:05–14:52 UTC" gibi).
  2. Her sonucun yanında bir güvenilirlik etiketi görünür: Measured, Model, Derived ya da Assumed ([ADR-0003](../adr/0003-veri-sozlesmesi.md)).
  3. Kullanıcı bir değerin kaynağını açar: hangi veri, hangi çözünürlük, hangi varsayım.
  4. Doğrulama bölümünde sonuçlarımızın NASA araçlarıyla ve hazır NASA haritalarıyla karşılaştırması görünür.
- **Seçenekler:** Kutup sahalarında aralık genişse "yüksek belirsizlik" uyarısı çıkar.
- **Dikkat:** Yükseklik haritasındaki hata sonucu iyimser gösterir; sonuçlar küçük bir güvenlik payıyla sunulmalı.
- **Dayanak:** Açıklanabilirlik raporu (bölüm 7, belirsizlik), ufuk hesabı notu, analiz özeti (5.3, 7.2).

#### UC-11 Karşılaştırmayı dışa aktarmak ve paylaşmak

- **Amaç:** Karşılaştırmayı ekip arkadaşına ya da ders notuna taşımak.
- **Akış:**
  1. Kullanıcı karşılaştırma tablosunu CSV ya da JSON olarak indirir.
  2. Senaryo adres çubuğuna yazılır; kullanıcı bağlantıyı kopyalayıp paylaşır.
  3. Bağlantıyı açan kişi aynı senaryoyu görür.
- **Dikkat:** Referans tasarımdaki görev raporu ekranı ilk sürümde yok; dışa aktarma karşılaştırma tablosundan yapılır.
- **Dayanak:** Açıklanabilirlik raporu (bölüm 7, planlamacı düzeyi), [karşılaştırma ve açıklama](../design/karsilastirma-ve-aciklama.md) (bölüm 4, "Dışa aktarma ve bağlantı").

#### UC-12 Haritada sahayı ve katmanları görmek

- **Amaç:** Sahanın çevresini görmek ve mekânsal ilişkiyi kurmak.
- **Akış:**
  1. Kullanıcı sahayı 2B haritada görür.
  2. Katman seçiciden bir katman açar: yükseklik, eğim, kalıcı gölge.
  3. Haritada başka bir noktaya tıklayarak onu yeni senaryo sahası yapabilir (`UC-02`).
- **Seçenekler:** Seçilen sahanın yanında o sahaya inen aracın kısa bilgi kartı görünür (ekstra).
- **Dikkat:**
  - 3B arazi görünümü web arayüzünde yok. Unreal Engine ile ayrı geliştiriliyor; birleştirilene kadar araç modeli yalnızca orada görünür (bölüm 10, madde 12).
  - Kalıcı gölge katmanı buzun varlığını göstermez; buz için "belirsiz" etiketi kullanılmalı.
- **Dayanak:** Veri kaynakları kataloğu (bölüm 4 ve 5), arayüz tasarım belgesi (bölüm 3), [ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md), analiz özeti (7.2, 7.3).

### 5.5 Ekstra use case'ler

Bunlar analiz özetinin 7.3 bölümündeki sırayla, yani yapılabilirliğe göre dizildi. Zorunlu use case'ler bitmeden başlanmamalı. `UC-17` analiz özetinde yok; ekip kararıyla 14 Kasım 2026'da eklendi.

#### UC-13 Hazır senaryoyu (geçmiş görev vakası) açmak

- **Amaç:** Gerçek bir iniş üzerinden ürünü ve bir kavramı tek adımda göstermek.
- **Akış:**
  1. Kullanıcı "Past missions" listesinden bir vaka seçer. İlk altı vaka: Athena, Blue Ghost 1, Chandrayaan-3, IM-1, SLIM, Chang'e 4.
  2. Sistem o inişin sahasını ve anını yükler, gökyüzünü gösterir ve vakaya özgü mesajı açar.
  3. Kullanıcı tek bir girdiyi değiştirerek "öyle olmasaydı" sorusunu dener (`UC-08`).
- **Seçenekler:** Sınıf kapısında hazır senaryo bir soru ve bir açıklamayla birlikte gelir (hazır görev). Yeni ekran gerektirmez; aynı gösterimleri kullanır.
- **Dikkat:**
  - Uygulama bir görevin neden başarısız olduğunu hesaplamaz. Ortamı ölçer; araç kaynaklı nedeni yalnızca resmi kaynağa atıfla ve kanıt etiketiyle (Official report, Preliminary ya da Commentary) gösterir.
  - Çin görevlerinin sahaları için yalnızca NASA'nın kendi tablosundaki koordinat ve resmi açıklamalar kullanılır.
- **Dayanak:** Açıklanabilirlik raporu (bölüm 8.1), analiz özeti (5.6, 7.3). Altı inişin Güneş açıları yeniden hesaplandı ve tuttu.

#### UC-14 Sahaları puanla sıralamak

- **Amaç:** Birkaç ölçütü tek sayıda toplayıp adayları sıralamak.
- **Akış:** Kullanıcı ölçütlerin ağırlığını seçer (güneşli süre, Dünya görünürlüğü, eğim); sistem sahaları puanlar ve sıralar.
- **Dikkat:** Ağırlıklar keyfi kalabilir; puanın yanında her ölçütün kendi değeri de görünmeli.
- **Dayanak:** CSA notu (bölüm 8.2), [Chandrayaan-3 saha seçimi notu](../research/chandrayaan3-landing-site-selection/README.md) (bölüm 7).

#### UC-15 Yaklaşma profilini ve gölge uyarısını görmek

- **Amaç:** İniş yönündeki araziyi ve alçak Güneş'in yarattığı uzun gölgeyi fark etmek.
- **Akış:** Kullanıcı bir yaklaşma yönü seçer; sistem o yöndeki arazi kesitini çizer ve Güneş alçaksa gölge uzunluğu uyarısı verir.
- **Dayanak:** CSA notu (bölüm 8.2), analiz özeti (7.3).

#### UC-16 Zemin sıcaklığını görmek

- **Amaç:** Seçilen sahada zemin sıcaklığının zaman içindeki seyrini görmek.
- **Akış:** Sistem seçili dönem için sıcaklık eğrisini gösterir.
- **Dikkat:** Yüksek riskli. Hazır araçta üç kurulum sorunu çıktı ve model sonuçları yeniden hesaplanmadı.
- **Dayanak:** Zamanla değişen veri notu (bölüm 8), analiz özeti (5.3, 7.3).

#### UC-17 İniş tarihini oyunla denemek

- **Amaç:** Halk kullanıcısının "tarih kayınca ne değişir" sorusunu deneyerek görmesi.
- **Akış:**
  1. Kullanıcı Keşfet kapısında bir seviye seçer. Seviye bir saha, seçilebilecek tarih aralığı ve üç hedef içerir.
  2. 14 günlük bir görev için iniş tarihini seçer ve "Land" düğmesine basar.
  3. Sistem o saha ve tarih için özet ölçüleri hesaplar ve üç hedeften kaçının tuttuğunu gösterir: güneşli zaman oranı, en uzun karanlık, Dünya'nın görünür olduğu zaman oranı.
  4. Kullanıcı başka bir tarihle yeniden dener; önceki denemeler listede kalır.
- **Seçenekler:**
  - Sonuç ekranından aynı senaryo Planla kapısında açılabilir (`UC-08`).
  - Dünya'nın hiç görünmediği sahada iletişim hedefi tutmaz; sonuç "röle gerekli" etiketini gösterir.
- **Dikkat:**
  - Oyun bataryayı, ısıyı ve aracın dayanımını modellemez; yalnızca olay saatlerinin özet ölçülerini kullanır (`UC-05`).
  - Hedef değerler bir görev gereksinimi değildir; oyunu dengeli kılmak için seçilir.
- **Dayanak:** [Kitle stratejisi](audience-strategy.md) (bölüm 1), [mini oyun](../design/mini-oyun.md).

## 6. Kullanıcıya göre akışlar

### 6.1 Planlamacı: "Plan değişti, hâlâ uygun mu?"

```mermaid
flowchart LR
  P1["Senaryo A:<br/>saha ve planlanan tarih"] --> P2["Özet ölçüler"]
  P2 --> P3["Senaryo B:<br/>aynı saha, yeni tarih"]
  P3 --> P4{"Güç ve iletişim<br/>yeterli mi?"}
  P4 -- "Evet" --> P7["Dışa aktar"]
  P4 -- "Hayır" --> P5["Senaryo C:<br/>aynı tarih, yakın başka saha"]
  P5 --> P6["Üçünü yan yana oku,<br/>farkın nedenine bak"]
  P6 --> P7
```

Kullandığı use case'ler: `UC-01` ya da `UC-02`, `UC-03`, `UC-05`, `UC-06`, `UC-07`, `UC-08`, `UC-09`, `UC-10`, `UC-11`.

### 6.2 Eğitimci: "Bunu derste nasıl gösteririm?"

```mermaid
flowchart LR
  E1["Hazır senaryoyu aç"] --> E2["Gökyüzü görünümünde<br/>zamanı oynat"]
  E2 --> E3["Neden kartını<br/>eğitimci düzeyinde aç"]
  E3 --> E4["Tek girdiyi değiştir:<br/>saha, tarih ya da panel yönü"]
  E4 --> E5["İki durumu yan yana<br/>göster ve tartış"]
```

Kullandığı use case'ler: `UC-13`, `UC-03`, `UC-04`, `UC-06`, `UC-09`, `UC-08`.

### 6.3 Halk: "Ay'da bu noktada durmak nasıl bir şey?"

```mermaid
flowchart LR
  H1["Tanıdık bir saha seç"] --> H2["Gökyüzüne bak,<br/>zamanı oynat"]
  H2 --> H3["Tek cümlelik sonucu oku"]
  H3 --> H4{"Merak etti mi?"}
  H4 -- "Evet" --> H5["Neden kartını aç"]
  H4 -- "Başka yer" --> H1
  H5 --> H1
```

Kullandığı use case'ler: `UC-01`, `UC-03`, `UC-04`, `UC-05`, `UC-09`, `UC-12`. Zaman kalırsa mini oyun da bu kapıdadır (`UC-17`).

## 7. Senaryolar

Senaryo, bir kullanıcının belirli bir saha ve tarihle baştan sona yaptığı iştir. Demo, test ve içerik yazımı için ortak örneklerdir.

**Sayılar hakkında:** Aşağıdaki açılar NASA'nın Horizons aracıyla hesaplanıp doğrulanmış değerlerdir ve araziyi hesaba katmaz. Arazi ufku eklendiğinde ürünün göstereceği saatler ve süreler değişir. Koordinatlar [saha kataloğundan](../design/saha-katalogu.md) alınır.

### 7.1 Özet tablo

| Kimlik | Senaryo | Kim | Saha | Sınıf | Asıl use case'ler |
| --- | --- | --- | --- | --- | --- |
| `S-01` | Plan değişti: aynı saha, başka tarih | K1 | Mons Mouton test sahası | Zorunlu | `UC-03`, `UC-07`, `UC-08` |
| `S-02` | Aynı tarih, başka saha | K1 | Mons Mouton ve IM-1 sahası | Zorunlu | `UC-01`, `UC-06`, `UC-08` |
| `S-03` | Güneş ufukta sürünüyor | K3 | Mons Mouton | Zorunlu | `UC-04`, `UC-05`, `UC-09` |
| `S-04` | Küçük hata, büyük fark | K1 | Mons Mouton | Destekleyici | `UC-05`, `UC-10` |
| `S-05` | Paneli yükseltmek | K1 | Mons Mouton | Destekleyici | `UC-06`, `UC-08` |
| `S-06` | Alçak Güneş tek başına başarısızlık değildir | K2 | Blue Ghost ve Athena sahaları | Ekstra | `UC-13`, `UC-08`, `UC-09` |
| `S-07` | Panelin baktığı yön | K2 | SLIM sahası | Ekstra | `UC-13`, `UC-06` |
| `S-08` | Dünya hiç görünmüyor | K2, K1 | Chang'e-4 sahası | Ekstra | `UC-13`, `UC-07` |
| `S-09` | Ay'dan Güneş tutulması | K3, K2 | Apollo 11 sahası | Ekstra | `UC-05` |
| `S-10` | Athena demosu | Hepsi | Athena'nın indiği yer | Ekstra | `UC-13`, `UC-04`, `UC-08`, `UC-15` |

### 7.2 Zorunlu ve destekleyici senaryolar

#### S-01 Plan değişti: aynı saha, başka tarih

- **Durum:** Planlamacı Mons Mouton test sahasında (84,78° G, 29,13° D) 1 Aralık 2026 için bir iniş planlıyor. Donanım gecikmesi tarihi 5 gün kaydırıyor.
- **Adımlar:**
  1. Sahayı ve 1 Aralık 2026 tarihini seçer, özet ölçüleri okur.
  2. Senaryoyu karşılaştırmaya ekler; "aynı saha, başka tarih" ile tarihi 6 Aralık 2026'ya kaydırır.
  3. Üçüncü senaryo olarak 12 Aralık 2026'yı ekler.
  4. Üç senaryoyu yan yana okur.
- **Beklenen sonuç:**
  - 1 Aralık: Dünya ufkun üstünde ama birkaç gün içinde batıyor.
  - 6 Aralık: Dünya ufkun altında; doğrudan iletişim yok. Sistem bir sonraki Dünya doğuşunu gösteriyor.
  - 12 Aralık: Dünya yeniden görünür; pencere ay sonuna, Dünya'nın yeniden battığı 30–31 Aralık'a kadar sürer. Kısa gecikme durumu kötüleştiriyor, biraz daha uzun gecikme iyileştiriyor.
- **Kanıt:** Aralık 2026'da bu sahada Dünya ufkun 2,1 derece altı ile 10,6 derece üstü arasında geziyor ve 3–11 Aralık arasında ufkun altında (ayın yaklaşık yüzde 26'sı); ayın son iki gününde yeniden ufkun altına iniyor. Güneş en fazla 6,5 derece yükseliyor. Doğrulandı (analiz özeti 5.2).
- **Dikkat:** Üç tarih arazisiz hesaba göre seçildi. Arazi ufku eklenince Dünya'nın batış ve doğuş anları kayar; senaryo ürünün kendi hesabıyla yeniden sınanmalı.

#### S-02 Aynı tarih, başka saha

- **Durum:** `S-01`'in devamı. Tarih değiştirilemiyorsa planlamacı aynı bölgede başka bir sahaya bakıyor.
- **Adımlar:**
  1. "Aynı tarih, başka saha" ile listeden daha kuzeydeki IM-1 sahasını (yaklaşık 80,1° G) ekler.
  2. Güneş'in en yüksek açısını, güneşli süreyi ve Dünya'nın görünür olduğu süreyi kıyaslar.
  3. Farkın nedenini açar.
- **Beklenen sonuç:** Kuzeydeki sahada Güneş daha yükseğe çıkıyor. Neden kartı farkı enleme bağlıyor.
- **Kanıt:** Güneş'in yıllık üst sınırı yaklaşık 90° − enlem + 1,54° ile bulunur: Mons Mouton'da yaklaşık 6,8, IM-1 sahasında yaklaşık 11,4 derece (açıklanabilirlik raporu, bölüm 5.3 ve 8.3). IM-1 koordinatı ve saati yaklaşık.

#### S-03 Güneş ufukta sürünüyor

- **Durum:** Bir ziyaretçi Ay'ın güney kutbunun neden farklı olduğunu merak ediyor.
- **Adımlar:**
  1. Listeden Mons Mouton'u seçer.
  2. Gökyüzü görünümünde zamanı bir Ay günü boyunca oynatır.
  3. Tek cümlelik sonucu okur; isterse neden kartını açar.
- **Beklenen sonuç:** Güneş yükselip batmak yerine ufkun hemen üstünde dolanıyor. Kart metni: "Burada Güneş ufkun hemen üstünde gezinir. Küçük bir krater kenarı bile aracı gölgede bırakabilir."
- **Kanıt:** Aralık 2026'da Güneş en fazla 6,47 derece yükseliyor. Güneş 2,47 derecedeyken 1 m'lik bir nesne yaklaşık 23 m gölge yapar. İkisi de doğrulandı (analiz özeti 5.4, 5.6). Kart metni açıklanabilirlik raporunun 9. bölümünden.

#### S-04 Küçük hata, büyük fark

- **Durum:** Planlamacı kutup sahasındaki bir gün doğumu saatine ne kadar güvenebileceğini bilmek istiyor.
- **Adımlar:**
  1. Mons Mouton'da bir gün doğumu olayını seçer.
  2. Olayın saat aralığını ve "yüksek belirsizlik" uyarısını görür.
  3. Kaynağı açar: hangi yükseklik haritası, hangi çözünürlük.
- **Beklenen sonuç:** Tek saat yerine bir aralık. Aynı olay ekvatora yakın bir sahada çok daha dar bir aralıkla görünür.
- **Kanıt:** Kutupta küçük bir ufuk hatası olay saatini 20 dakikadan fazla, Dünya için 70 dakika kadar kaydırıyor. Doğrulandı (analiz özeti 5.6).

#### S-05 Paneli yükseltmek

- **Durum:** Planlamacı aynı sahada paneli bir direğe koymanın ne kazandırdığını soruyor.
- **Adımlar:**
  1. Mons Mouton'da panel tipini "dik, dönen" seçer.
  2. Direk yüksekliğini değiştirerek ikinci bir senaryo oluşturur.
  3. Güneşli süreyi ve en uzun karanlığı kıyaslar.
- **Beklenen sonuç:** Yüksek direkte güneşli süre artıyor, en uzun karanlık kısalıyor. Sayıları ürünün kendi hesabı verir.
- **Kanıt:** NASA çalışmasındaki bir sahada aydınlanma 1 m'de yüzde 67–71, 5 m'de yüzde 83–89. Doğrulandı (analiz özeti 5.3). Bu sayı Mons Mouton için değil, gerekçe olarak verildi.

### 7.3 Ekstra senaryolar

`S-09` dışındakiler `UC-13`'e, yani geçmiş görev vakalarına dayanır. Bu vakalarda kaza nedenleri kanıt düzeyi etiketiyle gösterilmeli; çoğu ön bulgudur ("Preliminary").

#### S-06 Alçak Güneş tek başına başarısızlık değildir

- **Durum:** Eğitimci "Güneş alçaksa iniş başarısız olur" yanılgısını düzeltmek istiyor.
- **Adımlar:** Blue Ghost ve Athena inişlerini açar, iki inişi yan yana koyar, sonra zamanı ileri oynatır.
- **Beklenen sonuç:** İniş anında iki sahada da Güneş alçak. Fark sonrasında: Blue Ghost'un sahasında Güneş gün içinde çok yükseliyor, Mons Mouton'da hep alçak kalıyor.
- **Kanıt:** İniş anında Güneş Blue Ghost'ta 3,43, Athena'da 2,47 derece yüksekteydi. Doğrulandı (analiz özeti 5.6).

#### S-07 Panelin baktığı yön

- **Durum:** Eğitimci panel yönünün Güneş'in yüksekliği kadar önemli olduğunu göstermek istiyor.
- **Adımlar:** SLIM vakasını açar, panel tipini "dik, sabit" ve yönünü batı seçer, zamanı oynatır; sonra yönü doğuya çevirip kıyaslar.
- **Beklenen sonuç:** Batıya bakan panel, Güneş doğudayken güç üretmiyor; Güneş batıya geçince üretmeye başlıyor.
- **Kanıt:** İniş anında Güneş doğudaydı (yön 81,7, yükseklik 37,2 derece). SLIM'in panellerinin batıya baktığı Japon uzay ajansının 25 Ocak 2024 tarihli belgesinde geçiyor. Saat ve koordinat yaklaşık.

#### S-08 Dünya hiç görünmüyor

- **Durum:** Kullanıcı Ay'ın uzak yüzünde iletişimin neden farklı olduğunu görmek istiyor.
- **Adımlar:** Chang'e-4 vakasını açar, gökyüzü görünümünde Dünya'nın yoluna bakar, zamanı bir yıl boyunca oynatır.
- **Beklenen sonuç:** Dünya'nın yolu hep ufkun altında. Sistem "röle gerekli" etiketini gösteriyor.
- **Kanıt:** İniş anında Dünya ufkun 39 derece altındaydı ve bütün yıl ufkun altında. Doğrulandı (analiz özeti 5.6).
- **Dikkat:** Ekip kararı (14 Kasım 2026): Çin görevlerinin sahaları listede ve vakalarda kalır. Space Apps kılavuzundaki uygunluk incelemesi nedeniyle bu sahalar için yalnızca NASA'nın kendi tablosundaki koordinat ve resmi açıklamalar kullanılır; Çin kaynaklı veri ya da görsel kullanılmaz ([saha kataloğu](../design/saha-katalogu.md), bölüm 8).

#### S-09 Ay'dan Güneş tutulması

- **Durum:** Kullanıcı Ay'dan bakıldığında Dünya'nın Güneş'i örttüğü bir anı görmek istiyor.
- **Adımlar:** Apollo 11 sahasını seçer, olay listesinden 20–21 Şubat 2027 tutulmasına gider, zamanı oynatır.
- **Beklenen sonuç:** Dünya, Güneş diskinin bir kısmını örtüyor; güç eğrisinde kısa bir düşüş görünüyor.
- **Kanıt:** 22:09–00:36 UTC arasında, 2 saat 27 dakika boyunca, en fazla yüzde 34 örtülme. İki araçla doğrulandı (analiz özeti 5.1).

#### S-10 Athena demosu

- **Durum:** Tek bir gerçek iniş üzerinden bütün ürünü anlatmak. Adımların tamamı [Athena demosu](../design/athena-demosu.md) belgesinde.
- **Adımlar:** Athena'nın indiği yeri ve anını açar; gölge uzunluğu uyarısını görür; zamanı ileri oynatır; Blue Ghost 1 inişini ikinci senaryo olarak ekler; sonra aynı sahada tarihi bir ay kaydırır.
- **Beklenen sonuç:** Güneş ufuk boyunca dolanıyor ama hiç yükselmiyor. Blue Ghost'un sahasında Güneş sonradan çok yükseliyor; fark iniş anında değil, sonrasında ortaya çıkıyor.
- **Kanıt:** İniş anında Güneş 2,47, Dünya 11,19 derece yüksekteydi. Doğrulandı.
- **Dikkat:**
  - Krater kenarının Güneş'i kesip kesmediği hesaplanmıyor ve gösterilmiyor; bunun için çok ince bir yükseklik haritası gerekir.
  - Aracın duruşu bir girdi değil, çünkü gerçek duruş açıları bilinmiyor. Yan yatışın panel gücüne etkisi gösterilirse "Illustrative" etiketi taşır.
  - Kazanın nedeni "Preliminary" etiketiyle yazılır.

## 8. Hedeflere izlenebilirlik

### 8.1 Challenge hedeflerinden use case'lere

Hedefler challenge metnindeki "Objectives" listesinin sırasıyla numaralandı.

| Kimlik | Challenge hedefi | Use case'ler | Senaryolar |
| --- | --- | --- | --- |
| O1 | Saha seçimi ve karşılaştırma | `UC-01`, `UC-02`, `UC-08`, `UC-14` | `S-01`, `S-02` |
| O2 | Tarih ve saat esnekliği | `UC-03`, `UC-08`, `UC-17` | `S-01` |
| O3 | Güneş ve Dünya konumunun gösterimi, batışa kalan süre | `UC-04`, `UC-05` | `S-03`, `S-04`, `S-08` |
| O4 | Güç ve iletişim değerlendirmesi | `UC-06`, `UC-07` | `S-01`, `S-05`, `S-07` |
| O5 | Birden çok gösterim (2B, 3B, başka) | `UC-04`, `UC-12` | `S-03` |
| O6 | Zaman içindeki değişim | `UC-03`, `UC-05` | `S-03`, `S-09` |
| O7 | Farklı beceri düzeyleri | `UC-09`, `UC-13`, `UC-17` | `S-03`, `S-06`, `S-07`, `S-10` |

### 8.2 Jüri ölçütlerine katkı

| Ölçüt | En çok katkı veren | Neden |
| --- | --- | --- |
| Impact | `K1`, `K2`, `K3` için ayrı düzey | Aynı araç üç kitleye ulaşıyor |
| Creativity | `UC-08`, `UC-09` | Tek girdi değiştirerek karşılaştırma ve nedeni gösterme |
| Validity | `UC-10`, `S-04` | Hata payı ve NASA araçlarıyla doğrulama |
| Relevance | `UC-04`–`UC-07` | Challenge'ın ana cümlesinin doğrudan karşılığı; NASA verisi hesabın temeli |
| Presentation | `S-01`, `S-03` | Challenge'ın kendi hikâyesi (plan değişikliği) ve tek bakışta anlaşılan görüntü |

## 9. Demo için notlar

Bu bölüm tam bir sunum planı değildir; yalnızca senaryoların demoya nasıl bağlanacağını söyler.

- **Sınır:** Teslimde 7 slayt (başlık ve giriş dahil) ya da en fazla 30 saniyelik video istenir. Sınırı aşan proje küresel değerlendirmeye giremez.
- **Dil:** Teslim sayfası, bağlantılı malzemeler ve slaytlar İngilizce olmalı. Videoda başka dil konuşulursa İngilizce altyazı şart.
- **Önerilen ana senaryo:** `S-01`. Challenge metnindeki plan değişikliği hikâyesinin birebir karşılığı ve sayıları doğrulanmış.
- **Önerilen açılış görüntüsü:** `S-03`. Güneş'in ufukta dolandığı gökyüzü görünümü.
- **Canlı sunum olursa:** Açıklanabilirlik raporunun yönetici özetindeki 3–4 dakikalık akış kullanılabilir (Athena, SLIM, Chang'e-4; yani `S-10`, `S-07`, `S-08`).
- **Demo akışı:** Adımlar [Athena demosu](../design/athena-demosu.md) belgesinde. 30 saniyelik videoya ancak üç adım sığıyor; demonun slayt mı video mu olacağı açık karar (bölüm 10, madde 13).
- **İki parça:** 3B görünüm ayrı bir uygulama olduğu için, birleştirilene kadar demo iki parçalı olur.
- **Kurallar:** NASA logosu kullanılamaz. Kullanılan her veri, kod ve yapay zekâ aracı teslimde belirtilmeli; yapay zekâ ile üretilen görsel ve videoda görünür filigran olmalı.

## 10. Açık kararlar

Bu planı yazarken çıkan sorular. Bir kısmı tasarım belgeleri ve karar kayıtlarıyla kapandı; açık kalanların yanında tasarım belgelerindeki öneri var. Numaralar sabittir.

| No | Karar | Durum | Etkilediği yer | Not |
| --- | --- | --- | --- | --- |
| 1 | Üç kapı ayrı sayfalar mı, tek sayfada bir anahtar mı? | Açık | Bütün akış, `UC-09` | Öneri: üst çubukta üç seçenekli bir anahtar ([karşılaştırma ve açıklama](../design/karsilastirma-ve-aciklama.md), bölüm 8) |
| 2 | Hangar ekranının (rover seçimi) yerine ne gelecek? | Kapandı | Genel akış, `UC-01`, `UC-13` | Saha ve tarih seçim ekranına dönüşüyor ([gösterim ve arayüz](../design/gosterim-ve-arayuz.md), bölüm 4) |
| 3 | "Dünya görünüyor" ölçütü: merkezi mi, kenarı mı, tamamı mı ufkun üstünde? | Açık | `UC-07`, `S-01` | Öneri: merkez; ölçüt arayüzde değiştirilebilir ([iletişim penceresi](../design/iletisim-penceresi.md), bölüm 8). Seçim pencereyi 19 ile 38 saat arası oynatıyor |
| 4 | Yer istasyonu için alım sınırı mı (6 derece), gönderim sınırı mı (10,1 derece)? | Açık | `UC-07` | Öneri: alım sınırı ([iletişim penceresi](../design/iletisim-penceresi.md), bölüm 8) |
| 5 | Özel koordinatta arazi ufku sunucuda anında mı hesaplanacak, ilk sürümde yalnızca düz ufuk mu verilecek? | Kapandı | `UC-02` | İlk sürümde düz ufuk ([ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md), madde 5; [ADR-0004](../adr/0004-api-uc-noktalari.md), "Veri yoksa davranış"). Anında hesap, süre ölçümünden sonra eklenebilir ([ufuk hesabı](../design/ufuk-hesabi.md), bölüm 8) |
| 6 | Ortak veri sözleşmesi (dosya biçimi) | Taslak | Bütün use case'ler | [ADR-0003](../adr/0003-veri-sozlesmesi.md) ve [ADR-0004](../adr/0004-api-uc-noktalari.md) yazıldı; durumları "Proposed" |
| 7 | Hazır saha ve hazır senaryo listesi | Kapandı | `UC-01`, `UC-13` | İlk on saha [saha kataloğunda](../design/saha-katalogu.md), ilk altı vaka [geçmiş görev vakalarında](../design/gecmis-gorev-vakalari.md). Chang'e 4 için resmi tablodaki koordinat kullanılıyor |
| 8 | Senaryonun bağlantı olarak paylaşılması | Kapandı | `UC-11` | Senaryo adres çubuğuna yazılıyor ([karşılaştırma ve açıklama](../design/karsilastirma-ve-aciklama.md), bölüm 4) |
| 9 | Referans tasarımdaki asistan (sohbet) kapsamda mı? | Kapandı | `UC-09` | Asistan ve görev raporu ilk sürümde yok ([gösterim ve arayüz](../design/gosterim-ve-arayuz.md), bölüm 4) |
| 10 | Arayüz dili: yalnızca İngilizce mi, Türkçe de mi? | Açık | Bütün metinler | Öneri: ilk sürüm İngilizce; Türkçe metinler eğitim görevleriyle eklenir ([gösterim ve arayüz](../design/gosterim-ve-arayuz.md), bölüm 8) |
| 11 | "Gün doğumu" Güneş'in ilk kenarıyla mı, merkeziyle mi sayılacak? | Açık | `UC-05` | Öneri: ilk kenar ([olaylar ve süreler](../design/olaylar-ve-sureler.md), bölüm 8) |
| 12 | 3B görünüm web arayüzüyle nasıl birleştirilecek? | Açık | `UC-12`, bölüm 9 | Öneri: 3B görünüm de aynı sunucudan beslenir ([gösterim ve arayüz](../design/gosterim-ve-arayuz.md), bölüm 8) |
| 13 | Demo slayt mı, video mu olacak? | Açık | Bölüm 9 | [Athena demosu](../design/athena-demosu.md), bölüm 8 |

## 11. Kitle stratejisi belgesiyle farklar

[Kitle stratejisi](audience-strategy.md) belgesinin ana fikri (tek motor, üç kapı) geçerli ve tasarım belgelerinde kullanılıyor. Kapsam kararlarından önce yazıldığı için dört yerde fark var; bu yerlerde bu plan ve tasarım belgeleri geçerli:

| Kitle stratejisinde | Bu planda | Neden |
| --- | --- | --- |
| "Lander'ın hayatta kalır mı?" batarya oyunu | Bataryasız "iniş penceresi" oyunu (`UC-17`, ekstra) | Batarya ve geceyi atlatma kapsamdan çıkarıldı (analiz özeti 7.5). Oyun 14 Kasım 2026'da bataryasız olarak yeniden tasarlandı: sonucu olay saatlerinin özet ölçüleri belirler ([mini oyun](../design/mini-oyun.md)) |
| Yaklaşık 3 dakikalık demo hikâyesi | 7 slayt ya da 30 saniyelik video | Teslim kılavuzunun sınırı |
| Tarih × saha ısı haritası, paylaşılabilir iniş kartı | İlk sürümde yok | Onaylı kapsam listesinde yoklar; ısı haritası çok sayıda hesap gerektiriyor ([karşılaştırma ve açıklama](../design/karsilastirma-ve-aciklama.md), bölüm 8). Ekip isterse sonradan eklenir |
| Eğitim görevleri | Hazır senaryoların Sınıf kapısındaki hali (`UC-13`) | Yeni ekran gerektirmiyor: önceden ayarlanmış bir durum, bir soru ve bir açıklama ([gösterim ve arayüz](../design/gosterim-ve-arayuz.md), "Üç giriş kapısı") |
