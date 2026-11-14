# Kitle Stratejisi: Tek Motor, Üç Kapı

Challenge metni aracın üç kitleye birden hizmet etmesini istiyor: *"mission planners, educators, and the public"* ([challenge metni](../challenge/lunar-landing-site-navigator.md), "Accessibility across skill levels"). Bu doküman bu üç kitleye aracı nasıl sunacağımızı tarif eder.

> **Not (14 Kasım 2026):** Bu belge kapsam kararlarından önce yazıldı. Güncel kullanıcı planı [use-cases-and-scenarios.md](use-cases-and-scenarios.md) belgesinde. Batarya oyunu kapsam dışı kaldı ve demo sınırı 7 slayt ya da 30 saniyelik video; farkların tamamı o belgenin 11. bölümünde.

## Ana fikir

Üç ayrı uygulama yazmıyoruz. **Tek bir hesap motoru** (saha + tarih → Güneş ve Dünya konumu, yerel ufuk, güç ve iletişim metrikleri) üstüne **üç giriş kapısı** koyuyoruz. Kapılar aynı veriyi kullanır; değişen tek şey ne kadar detay gösterildiği ve kullanıcının hangi soruyla karşılandığıdır.

| Kapı | Kullanıcının sorusu | Aracın tonu |
| --- | --- | --- |
| Halk (Keşfet) | "Ay'da durmak nasıl bir şey?" | Şaşırt, merak uyandır |
| Eğitim (Sınıf) | "Bunu derste nasıl anlatırım?" | Yönlendir, sorgulat |
| Mühendis (Planla) | "Fırlatma kaydı, şimdi ne olacak?" | Hızlı, sayısal, güvenilir |

Üç kapı da aynı URL durumunu (saha, tarih, zaman) paylaşır. Böylece bir kullanıcı halk görünümünden mühendis görünümüne geçtiğinde aynı senaryoya daha ayrıntılı bakar.

Mevcut LunaPath tasarımı ([frontend-migrate/DESIGN.md](../../frontend-migrate/DESIGN.md): cockpit, fleet hangar, katmanlar) ağırlıkla mühendis kapısına hizmet ediyor. Halk ve eğitim kapıları henüz yok.

## 1. Halk: "Ay'da dur, gökyüzüne bak"

Amaç bilgi yüklemek değil, şaşırtmak. Challenge metni: *"make the extreme differences between lunar and terrestrial conditions apparent."*

- **Ana ekran: gökyüzü görünümü.** Kullanıcı seçilen noktada duruyormuş gibi çevresine bakar (balıkgözü veya panorama), zaman çubuğunu kaydırır. Güney kutbunda Güneş doğup batmaz, ufkun hemen üstünde sürünerek tur atar. Dünya gökte neredeyse sabit durur, librasyonla hafifçe sallanır. Bu sahne tek başına etkileyici.
- **Tek cümlelik kanca bilgiler.** Örnekler:
  - "Ay'da bir gün yaklaşık 29,5 Dünya günü sürer."
  - "Hava olmadığı için alacakaranlık yok: ışık ya var ya yok."
  - "Krater kenarından birkaç yüz metre kaysan günlerce karanlıkta kalabilirsin." (Rakamı kendi hesabımızdan alıp somutlaştıralım.)
- **Mini oyun: "Lander'ın hayatta kalır mı?"** Saha ve tarih seç; gün ilerledikçe batarya dolar ve boşalır, uzun gece gelince sistem kapanır. Sonuç: "Lander'ın N gün yaşadı." Oyunun mekaniği gerçek mühendislik sorusudur: güç penceresi.
- **Paylaşılabilir iniş kartı.** Saha, tarih, güneşli saat sayısı, Dünya görünür mü. Tek bir PNG olarak indirilir.
- **Tanıdık bağlam.** Apollo 11 ile Artemis güney kutbu adaylarını karşılaştır: "Neden artık ekvatora değil kutba gidiyoruz?" Yerel kanca: "Türkiye'nin Ay görevi nereye inmeli?"

## 2. Mühendis: hız ve güven

Mühendis etkilenmek değil, sonuca güvenip hızlı karar vermek ister. Challenge metnindeki ana senaryo: donanım gecikmesi veya fırlatma kayması yüzünden saha ya da tarih yeniden değerlendirilir.

- **Senaryo karşılaştırma tablosu.** Satırlar saha × tarih kombinasyonları; sütunlar:
  - Güneş yükseklik açısı
  - Görev süresince aydınlık yüzdesi
  - En uzun karanlık süresi
  - Dünya görünürlük yüzdesi
  - Gün batımına ve Dünya batımına kalan süre

  Yan yana veya bir referans senaryoya göre fark (delta) olarak gösterilir.
- **"Fırlatma +N gün kayarsa" kaydırıcısı.** Tarih kaydıkça tablodaki değerler canlı değişir. Demonun en güçlü anı bu olmalı.
- **Tarih × saha ısı haritası.** Hangi pencerelerin uygun olduğu bir bakışta görünür.
- **Doğrudan Dünya'ya (DTE) iletişim pencereleri.** DSN istasyonlarına (Goldstone, Madrid, Canberra) göre. Araştırması: [ephemeris-rotation-ground-stations](../research/ephemeris-rotation-ground-stations/).
- **Güven unsurları.** Her değerin yanında kaynağı: SPICE kernel'ı, LOLA DEM çözünürlüğü, varsayımlar. Sonuçlarımızı yayınlanmış aydınlanma değerleriyle (ör. Shackleton kenarı) karşılaştıran bir doğrulama bölümü.
- **Dışa aktarma ve permalink.** CSV/JSON indirme; senaryo URL'e gömülü, ekip arkadaşına link olarak gönderilebilir.

## 3. Eğitimci: derse hazır

Öğretmenin hazırlık vakti yok; araç doğrudan derste kullanılabilmeli.

- **Hazır yönlendirmeli görevler.** Her görev = motorda önceden ayarlanmış bir durum + bir soru + bir açıklama. İlk set:
  1. **Neden kutup?** Ay'ın dönme ekseni eğikliği yaklaşık 1,5°; bu yüzden kutupta Güneş hep ufka yakın.
  2. **Hiç güneş görmeyen kraterler.** Kalıcı gölgeli bölgeler (PSR) ve su buzu.
  3. **Dünya neden Ay'ın gökyüzünde yer değiştirmiyor?** Kütleçekimsel kilitlenme ve librasyon.
  4. **Atmosfer olmayınca ne değişir?** Kırılma yok, alacakaranlık yok, ufuk tamamen araziyle belirlenir.
- **Tahmin et → gözle → açıkla döngüsü.** Öğrenci önce tahmin eder ("Sence burası kaç gün aydınlık?"), sonra zaman çubuğunu oynatıp kontrol eder.
- **Sınıf yarışması.** Gruplara kısıt verilir (ör. "en az 10 gün güç ve Dünya bağlantısı"); her grup bir saha seçip savunur. Bu mühendis kapısının sadeleştirilmiş hali, ek kod gerektirmez.
- **Pratik ihtiyaçlar.** Projeksiyonda okunur büyük yazı, Türkçe ve İngilizce, zayıf internette çalışan önceden hesaplanmış veri. MEB Fen Bilimleri "Güneş, Dünya ve Ay" ünitesiyle ilişkilendirilebilir.

## Öncelik sırası (hackathon süresi için)

| Sıra | İş | Gerekçe |
| --- | --- | --- |
| 1 | Ortak motor + gökyüzü görünümü + zaman çubuğu | Üç kapı da bunu kullanır |
| 2 | Karşılaştırma tablosu + "fırlatma kayarsa" kaydırıcısı | Challenge'ın ana senaryosu |
| 3 | Eğitim görevleri | Ucuz: metin + hazır durumlar, yeni ekran yok |
| 4 | Halk kanca bilgileri + iniş kartı | Demoda etkiyi artırır |
| 5 | "Hayatta kalır mı?" mini oyunu | Zaman kalırsa |

## Demo hikâyesi (yaklaşık 3 dakika)

Aynı saha (ör. bir Artemis güney kutbu adayı), üç farklı gözle:

1. **Halk (1. dk):** Gökyüzü görünümünde Güneş ufukta sürünüyor, Dünya gökte asılı duruyor.
2. **Eğitim (2. dk):** "Neden kutup?" görevi: tahmin, oynat, açıkla.
3. **Mühendis (3. dk):** "Fırlatma 4 gün kaydı." Tablo değişir, araç aynı bölgede alternatif saha veya tarih gösterir.

Jüriye verilecek mesaj: **tek araç, üç kitle, aynı veri.**

## Açık sorular

- Kapılar ayrı sayfalar mı, yoksa tek sayfada bir mod anahtarı mı?
- Halk ve eğitim kapıları için hangi sahalar ve tarihler önceden hesaplanıp statik veri olarak gömülecek?
- Kanca bilgilerdeki rakamlar kendi hesabımızdan mı, literatürden mi gelecek? (Doğrulanmamış rakam kullanmayalım.)
