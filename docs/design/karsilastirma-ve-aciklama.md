# Karşılaştırma ve açıklama

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Zorunlu (açıklama bölümü Destekleyici)
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [explainability-mission-differences](../research/explainability-mission-differences/README.md) (rapor, bölüm 7 ve 11), [kitle stratejisi](../product/audience-strategy.md)
- **Doğrulama:** [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md)

## 1. Ne yapıyoruz

İki ya da daha çok senaryoyu yan yana koyuyoruz ve aradaki farkı hem sayıyla hem de sözle gösteriyoruz. Bir senaryo; bir saha, bir tarih aralığı, bir direk yüksekliği ve bir panel tipinden oluşur.

İki temel karşılaştırma:

- **Aynı saha, başka tarih.** Takvim kayarsa ne değişir.
- **Aynı tarih, başka saha.** Yakındaki başka bir nokta daha mı iyi.

## 2. Neden

Challenge'ın özü hızlı karşılaştırmadır: birden çok saha ve tarih birleşimini yan yana değerlendirmek. Ayrıca küçük konum ya da tarih değişikliklerinin neden büyük fark yarattığını anlamaya yardım eden özellikler ve farklı beceri düzeylerine hitap etmek isteniyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)).

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Her senaryonun olayları ve özet ölçüleri | [olaylar-ve-sureler.md](olaylar-ve-sureler.md) | `EventList` | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |
| Her senaryonun güç özeti | [guc-degerlendirmesi.md](guc-degerlendirmesi.md) | `PowerSeries` özeti | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |
| Her senaryonun o andaki durumu | [olaylar-ve-sureler.md](olaylar-ve-sureler.md) | `NowStatus` | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |

Yeni bir dış veri gerekmez.

## 4. Hesap nasıl yapılıyor

### Karşılaştırma

1. Her senaryo için aynı hesap ayrı ayrı çalıştırılır.
2. Her ölçü için senaryoların değerleri yan yana dizilir.
3. Her ölçüde en iyi senaryo işaretlenir. "İyi"nin yönü ölçüye göre değişir: güneşli zaman oranı için büyük, en uzun karanlık için küçük olan iyidir.
4. Sonuçların güvenilirlik etiketi, senaryolar arasında en düşük olandır. Biri arazi ufkuyla diğeri düz ufukla hesaplandıysa karşılaştırma `SYNTHETIC` sayılır ve arayüz bunu belirtir.

Karşılaştırılan ölçüler:

| Ölçü | Alan | İyi olan |
|---|---|---|
| Güneşli zaman oranı | `sunlit_fraction` | Büyük |
| En uzun karanlık | `longest_dark_hours` | Küçük |
| Güneş'in en yüksek açısı | `max_sun_elevation_deg` | Büyük |
| Dünya'nın görünür olduğu zaman oranı | `earth_visible_fraction` | Büyük |
| En uzun "Dünya görünmez" süresi | `longest_earth_hidden_hours` | Küçük |
| Ortalama panel gücü | `mean_power_w` | Büyük |

### Mühendis kapısının ek gösterimleri

Ekibin kitle stratejisi mühendis kapısı için üç ek gösterim istiyor (Kaynak: [kitle stratejisi](../product/audience-strategy.md), bölüm 2):

1. **"Fırlatma N gün kayarsa" kaydırıcısı.** Aynı saha için başlangıç tarihi kaydırılır ve karşılaştırma yinelenir. Yeni bir hesap türü gerekmez; `start_utc` ve `end_utc` değişir.
2. **Tarih çarpı saha ısı haritası.** Çok sayıda senaryonun tek bir ölçüsünü (örneğin güneşli zaman oranı) renkli bir ızgarada gösterir. İlk sürüme girmez; ekip isterse sonradan eklenir (8. bölüm).
3. **Dışa aktarma ve bağlantı.** Karşılaştırma tablosu CSV ya da JSON olarak indirilir; senaryo adres çubuğuna yazılır ki bağlantı olarak paylaşılabilsin.

### Üç düzeyde anlatım

Ekip üç kitleye "tek motor, üç kapı" ile hizmet etmeye karar verdi: aynı hesap, üç ayrı giriş (Kaynak: [kitle stratejisi](../product/audience-strategy.md)). Açıklanabilirlik raporu da aynı sonucun üç ayrıntı düzeyinde sunulmasını öneriyor (rapor, bölüm 7). Karşılaştırma her kapıda şöyle görünür:

| Kapı | Kime | Ne gösterilir |
|---|---|---|
| Keşfet | Halk | Tek cümlelik sonuç ve bir simge. Örnek: "Site B gets 40 more hours of sunlight this month." |
| Sınıf | Eğitimci | Ufuk şeridi ve farkın fiziksel nedeni. Örnek: "The Sun never climbs above 7 degrees here, so a ridge to the north blocks it for days." |
| Planla | Mühendis | Fark tablosu, her olay anının hata aralığı, kaydırıcı, dışa aktarma |

Üç kapı aynı saha, tarih ve zaman durumunu paylaşır; kullanıcı kapı değiştirdiğinde aynı senaryoya başka ayrıntıyla bakar (Kaynak: [kitle stratejisi](../product/audience-strategy.md)).

### "Neden" kartları

Bir fark gösterildiğinde yanında nedenini söyleyen kısa bir kart olur. Kurallar:

1. **Kart yalnızca hesaplanan şeyi söyler.** Örnek: "Dünya bu yönde ufkun 1,2 derece altında." Hesaplanmayan bir nedeni ima etmez.
2. **Kart, farkı tek bir girdiye bağlar.** Bunun için karşı-olgusal yöntem kullanılır: senaryonun yalnızca bir girdisi (tarih, konum ya da direk yüksekliği) değiştirilip hesap yeniden yapılır ve sonuçlar yan yana konur. Bu, bir ek hesap gerektirir.
3. **Geçmiş bir görevin başarısızlık nedeni hesaptan çıkarılmaz.** Yalnızca resmi kaynağa atıfla ve kanıt düzeyi etiketiyle yazılır ([gecmis-gorev-vakalari.md](gecmis-gorev-vakalari.md)).

Üçüncü kuralın gerekçesi: iniş anındaki Güneş yüksekliği tek başına başarıyı açıklamıyor. Başarılı Blue Ghost inişinde Güneş 3,43 derece, devrilen Athena inişinde 2,47 derece yüksekteydi (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 1 ve 3). Fark sonrasında ortaya çıkıyor: Blue Ghost'un sahasında Güneş daha sonra 70 derecenin üstüne çıkıyor, Mons Mouton'da yıl boyunca en fazla yaklaşık 6,8 dereceye ulaşıyor (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 11 ve 12).

### Hata payının gösterimi

Olay anları tek saat olarak değil, saat aralığı olarak gösterilir. Aralık her olay için ayrı hesaplanır, çünkü kutupta kayma olaydan olaya çok değişir: Athena iniş anında ufuktaki aynı hata Güneş için yaklaşık 24, Dünya için yaklaşık 72 dakika kayma demek (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 9). Yöntem [olaylar-ve-sureler.md](olaylar-ve-sureler.md) içinde.

## 5. Girdi ve çıktı

### Girdi

`POST /api/compare` ([ADR-0004](../adr/0004-api-uc-noktalari.md)). Gövde:

```json
{
  "scenarios": [
    { "scenario_id": "a", "label": "Mons Mouton, Dec 2026", "site_id": "mons-mouton-im2-target", "start_utc": "2026-12-01T00:00:00Z", "end_utc": "2026-12-31T00:00:00Z", "mast_height_m": 2, "panel_profile_id": "vertical_tracking" },
    { "scenario_id": "b", "label": "Mons Mouton, Jan 2027", "site_id": "mons-mouton-im2-target", "start_utc": "2027-01-01T00:00:00Z", "end_utc": "2027-01-31T00:00:00Z", "mast_height_m": 2, "panel_profile_id": "vertical_tracking" }
  ]
}
```

### Çıktı

`CompareResponse` ([ADR-0003](../adr/0003-veri-sozlesmesi.md)): her senaryonun ölçüleri ve her ölçü için fark satırı.

```json
{
  "scenarios": [ { "scenario": { "scenario_id": "a" }, "metrics": { "sunlit_fraction": null }, "now": null, "validity": "SYNTHETIC" } ],
  "deltas": [ { "metric": "sunlit_fraction", "values": { "a": null, "b": null }, "unit": "fraction", "best_scenario_id": null } ]
}
```

Örnekteki `null` değerler yer tutucudur; bu iki senaryo için doğrulanmış sonuç elimizde yok.

## 6. Arayüzde nerede görünür

- Sağ bölmedeki Compare sekmesi. Referans arayüzde bu sekmede iki karşılaştırma paneli var (Kaynak: [DESIGN.md, 5.1](../../frontend-migrate/DESIGN.md); [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `benchmark` ve `profile-compare`) ve `POST /api/compare` çağrısı zaten kullanılıyor (Kaynak: [DESIGN.md, 6.1](../../frontend-migrate/DESIGN.md)).
- Ufuk şeridinde ikinci senaryonun yolu kesikli çizgiyle üst üste çizilir ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Zaman çizelgesinde senaryolar alt alta bantlar olarak gösterilir.

## 7. Bilinen sınırlar

- **Karşılaştırma yalnızca hesaplanan ölçüleri kapsar.** Eğim, kaya ve iniş güvenliği karşılaştırmaya girmez ([saha-puani.md](saha-puani.md) yapılırsa girer).
- **Farklı güvenilirlikteki senaryolar yanıltabilir.** Biri arazi ufkuyla diğeri düz ufukla hesaplandıysa fark gerçek olmayabilir.
- **Uzaya özgü hazır bir açıklama arayüzü örneği bulunamadı;** kaynak rapor bunu kendisi belirtiyor. Tasarım ekibin önerisidir.

## 8. Varsayımlar ve açık kararlar

- Öneri: Bir seferde en fazla 4 senaryo ([ADR-0004](../adr/0004-api-uc-noktalari.md)).
- Öneri: Karmaşık katkı paylaştırma yöntemi (Shapley) kullanılmaz. Beş girdi için 32 ayrı hesap gerektirir (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 19) ve kaynak rapor da ilk sürüme girmemesini öneriyor.
- Açık karar: Üç kapı ayrı sayfalar mı, tek sayfada bir anahtar mı olacak. Kitle stratejisi de bunu açık soru olarak bırakıyor. Öneri: üst çubukta üç seçenekli bir anahtar.
- Karar (14 Kasım 2026): Isı haritası ilk sürüme girmez. Kullanıcı planı da (PR #28, `docs/product/use-cases-and-scenarios.md`, bölüm 11) onu onaylı kapsamda saymıyor. Çok sayıda senaryo gerektirir; `/api/compare` en fazla 4 senaryo alıyor ([ADR-0004](../adr/0004-api-uc-noktalari.md)). Sonradan eklenirse toplu hesap için ayrı bir uç nokta tanımlanır.
- Çelişki: Kitle stratejisindeki "Lander'ın hayatta kalır mı" mini oyunu bir batarya modeline dayanıyor. Batarya 14 Kasım 2026 kararıyla kapsamdan çıkarıldı ([ANALIZ-OZETI.md, bölüm 7.5](../research/ANALIZ-OZETI.md)). Oyun yapılacaksa bu karar yeniden ele alınmalı; yapılmayacaksa kitle stratejisinden çıkarılmalı.
- Varsayım: Örnek cümleler ve kart metinleri ekibin taslağıdır; sayıları gerçek hesaptan gelmelidir.

## 9. Kaynaklar

- Açıklanabilirlik raporu, bölüm 7 ve 11: [explainability-mission-differences](../research/explainability-mission-differences/README.md)
- [frontend-migrate/DESIGN.md](../../frontend-migrate/DESIGN.md), bölüm 5.1 ve 6.1
