# Mini oyun: iniş penceresi

- **Durum:** Taslak (Aşama 3, 14 Kasım 2026)
- **Sınıf:** Ekstra özellik
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [kitle stratejisi](../product/audience-strategy.md), [kullanıcı planı](../product/use-cases-and-scenarios.md)
- **Doğrulama:** [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md)
- **Kullanım senaryosu:** `UC-17` ([kullanıcı planı](../product/use-cases-and-scenarios.md), bölüm 5.5)

## 1. Ne yapıyoruz

Halk kapısı (Keşfet) için küçük bir oyun. Oyuncuya bir görev verilir: belirli bir sahaya 14 günlük bir görev için en iyi iniş tarihini bul. Oyuncu bir tarih seçer, "Land" düğmesine basar; ürün o saha ve tarih için gerçek hesabı yapar ve üç hedeften kaçının tuttuğunu gösterir.

Oyun batarya modeli kullanmaz. Sonucu belirleyen yalnızca üründe zaten hesaplanan üç ölçüdür: güneşli zaman oranı, en uzun karanlık ve Dünya'nın görünür olduğu zaman oranı.

## 2. Neden

Kitle stratejisi halk kapısı için bir mini oyun öngörüyordu; o oyun bataryanın dolup boşalmasına dayanıyordu (Kaynak: [kitle stratejisi](../product/audience-strategy.md), bölüm 1). Batarya modeli 14 Kasım 2026'da kapsamdan çıkarıldı ([ANALIZ-OZETI.md, bölüm 7.5](../research/ANALIZ-OZETI.md)); oyun aynı gün bataryasız olarak yeniden tasarlandı.

Yeni mekanik challenge'ın ana sorusunun kendisidir: küçük bir tarih değişikliği güç ve iletişim pencerelerini nasıl değiştirir (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)). Oyuncu bunu deneyerek görür.

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Seçilen saha ve 14 günlük aralık için özet ölçüler | [olaylar-ve-sureler.md](olaylar-ve-sureler.md) | `EventList` içindeki `metrics` | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |
| Oyun seviyeleri | Arayüzle birlikte gelen içerik dosyası | JSON, birkaç kayıt | Bu doküman |

Yeni bir sunucu hesabı ya da dış veri gerekmez.

## 4. Hesap nasıl yapılıyor

1. **Seviye yüklenir.** Her seviye bir saha, seçilebilecek tarih aralığı ve üç hedef içerir.
2. **Oyuncu iniş tarihini seçer.** Tarih bir kaydırıcıyla, seviyenin izin verdiği aralıkta seçilir.
3. **Ürün 14 günlük görev aralığını hesaplar.** Başlangıç seçilen tarih, bitiş 14 gün sonrasıdır. `GET /api/events` çağrılır.
4. **Üç hedef denetlenir:**
   - Güneş: `sunlit_fraction` hedef değerden büyük ya da eşit mi.
   - Karanlık: `longest_dark_hours` hedef değerden küçük ya da eşit mi.
   - İletişim: `earth_visible_fraction` hedef değerden büyük ya da eşit mi.
5. **Sonuç gösterilir.** Tutan her hedef bir yıldızdır; en çok üç yıldız. Altında tek cümle: görev boyunca Güneş kaç gün göründü, en uzun karanlık kaç saat sürdü, Dünya ile kaç gün konuşulabildi.
6. **Oyuncu yeniden dener.** "Try another date" ile kaydırıcıya döner. Önceki denemeler küçük bir listede kalır; böylece tarih kaydıkça sonucun nasıl değiştiği görülür.

Gün sayıları, oranların 14 ile çarpılmasıyla bulunur (hesap).

### İlk üç seviye

| Seviye | Saha | Tarih aralığı | Ne öğretir | Dayanak |
|---|---|---|---|---|
| 1 | Apollo 11 | Herhangi bir ay | Ekvatora yakın bir sahada iki haftalık gündüz ve gece düzeni | Ürünün kendi hesabı |
| 2 | Mons Mouton test sahası | 1 ile 20 Aralık 2026 arası | Kutupta Dünya ayda bir ufkun altına iner; yanlış tarihte iletişim kesilir | Aralık 2026'da Dünya'nın merkezi 3 Aralık'ta batıyor, 11 Aralık'ta doğuyor ([dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 42) |
| 3 | Chang'e 4 sahası | Herhangi bir ay | Uzak yüzde Dünya hiç görünmez; iletişim hedefi hiçbir tarihte tutmaz | Sahada Dünya 2019 boyunca ufkun altında ([dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 14) |

Üçüncü seviyede oyuncu iletişim yıldızını alamaz; sonuç ekranı nedenini söyler ve "röle gerekli" etiketini gösterir ([role-etiketi.md](role-etiketi.md)).

Öneri: Hedef değerler seviye dosyasında tutulur ve ürünün kendi hesabı bittikten sonra ayarlanır. Başlangıç değerleri: güneşli zaman oranı en az 0,5; en uzun karanlık en fazla 72 saat; Dünya'nın görünür olduğu zaman oranı en az 0,7.

## 5. Girdi ve çıktı

### Girdi

Seviye kaydı, arayüz içeriğinde (`frontend/src/content/game-levels.json`):

```json
{
  "id": "polar-december", "title": "Polar landing, December 2026",
  "site_id": "mons-mouton-im2-target",
  "date_min_utc": "2026-12-01T00:00:00Z", "date_max_utc": "2026-12-20T00:00:00Z",
  "mission_days": 14,
  "goals": { "sunlit_fraction_min": 0.5, "longest_dark_hours_max": 72, "earth_visible_fraction_min": 0.7 }
}
```

Sunucuya giden istek: `GET /api/events` (konum, `start_utc`, `end_utc`) ([ADR-0004](../adr/0004-api-uc-noktalari.md)).

### Çıktı

Sunucudan `EventList` gelir; arayüz `metrics` alanını hedeflerle karşılaştırır. Yeni bir yanıt yapısı yoktur.

Arayüzün gösterdiği sonuç, örnek metin: "Your lander saw the Sun on 9 of 14 days. The longest darkness lasted 110 hours. It could talk to Earth on 5 of 14 days." Örnekteki sayılar yer tutucudur.

## 6. Arayüzde nerede görünür

- Keşfet kapısında "Can you pick the landing date?" başlıklı bir kart ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md), "Üç giriş kapısı").
- Sonuç ekranından aynı senaryo Planla kapısında açılabilir; üç kapı aynı saha ve tarih durumunu paylaşır.
- Sonucun yanında güvenilirlik etiketi görünür. Düz ufukla hesaplanan sahalarda etiket "Assumed" olur.

## 7. Bilinen sınırlar

- **Oyun bir hayatta kalma benzetimi değildir.** Aracın gücünü, ısısını ve bataryasını modellemez; yalnızca gökyüzünün ne sunduğunu gösterir.
- **Sonuç ufuk profiline bağlıdır.** Arazi ufku olmayan sahalarda sayılar kaba kalır ([ufuk-hesabi.md](ufuk-hesabi.md)).
- **Hedef değerler keyfidir.** Bir görev gereksinimini temsil etmez; oyunu dengeli kılmak için seçilir.
- **Her deneme bir sunucu çağrısıdır.** Demo sırasında sunucu yoksa seviyelerin yanıtları önceden kaydedilmiş olmalı.

## 8. Varsayımlar ve açık kararlar

- Varsayım: Görev süresi 14 gün, yaklaşık yarım Ay günüdür; ekibin tercihidir.
- Varsayım: Başlangıç hedef değerleri ürünün kendi hesabıyla sınanmadı; ilk seviye çalıştıktan sonra ayarlanmalı.
- Açık karar: Oyun ilk sürüme girecek mi. Kitle stratejisinin öncelik sırasında en sonda ("zaman kalırsa").
- Kapsam dışı: Batarya, ısı ve araç dayanımı ([ANALIZ-OZETI.md, bölüm 7.5](../research/ANALIZ-OZETI.md)).

## 9. Kaynaklar

- [Kitle stratejisi](../product/audience-strategy.md)
- [Kullanıcı planı](../product/use-cases-and-scenarios.md)
- [olaylar-ve-sureler.md](olaylar-ve-sureler.md)
