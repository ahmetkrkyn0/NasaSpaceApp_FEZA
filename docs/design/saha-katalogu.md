# Saha kataloğu

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Zorunlu
- **Karar taslakları:** [ADR-0002](../adr/0002-koordinat-sistemi-ve-zaman.md), [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [data-sources](../research/data-sources/README.md) (bölüm 2), [explainability-mission-differences](../research/explainability-mission-differences/README.md)
- **Doğrulama:** [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md)

## 1. Ne yapıyoruz

Kullanıcının seçebileceği hazır saha listesini ve kendi koordinatını girme yolunu tanımlıyoruz. Her saha kaydı koordinatını, durumunu ve koordinatın nereden alındığını taşır.

## 2. Neden

Challenge'ın ilk hedefi bu: Apollo sahaları, CLPS hedefleri, diğer ticari görevler ve başka ülkelerin sahalarından oluşan bir listeden seçim ve özel koordinat girişi (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)).

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Resmi iniş ve çarpma koordinatları | [NASA NSSDC koordinat tablosu](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html) | HTML tablo; son güncelleme 13 Ağustos 2025 | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 1 |
| Chandrayaan-3 sahası | [LROC, Chandrayaan-3 sahası](https://www.lroc.asu.edu/images/1314) | Görüntü sayfası | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 9 |
| Artemis III aday bölgeleri (adlar) | NASA duyurusu, 28 Ekim 2024 | Metin | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 77 |
| Artemis III aday bölge sınırları | [USGS, Artemis III aday bölgeleri](https://www.usgs.gov/data/down-selected-artemis-iii-candidate-landing-site-navigational-grids) | Sınır dosyaları; otomatik indirilemiyor | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 69 |

## 4. Hesap nasıl yapılıyor

Burada hesap yok; derleme ve doğrulama kuralları var.

### İlk liste

Koordinatların hepsi kaynağıyla karşılaştırıldı. Boylamlar doğuya artı yazılmıştır.

| `id` | Ad | Enlem | Boylam | `category` | `status` | Kaynak |
|---|---|---:|---:|---|---|---|
| `apollo-11` | Apollo 11 | 0,67416 | 23,47314 | `apollo` | `landed` | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 2 |
| `change-4` | Chang'e 4 | -45,4561 | 177,5885 | `international` | `landed` | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 3 |
| `chandrayaan-3` | Chandrayaan-3 | -69,3741 | 32,32 | `international` | `landed` | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 9 |
| `slim` | SLIM | -13,3160 | 25,2510 | `international` | `landed_tipped` | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 4; [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 44 |
| `im1-odysseus` | IM-1 Odysseus | -80,13 | 1,44 | `clps` | `landed` | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 5 |
| `change-6` | Chang'e 6 | -41,6385 | -153,9852 | `international` | `landed` | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 6 |
| `blue-ghost-1` | Blue Ghost 1 | 18,562 | 61,810 | `clps` | `landed` | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 7; [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 38 |
| `im2-athena` | IM-2 Athena, iniş noktası | -84,7906 | 29,1957 | `clps` | `landed_tipped` | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 1 ve 20 |
| `mons-mouton-im2-target` | Mons Mouton, IM-2 hedef noktası | -84,78 | 29,13 | `test` | `reference` | [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 1; [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 34 |
| `hakuto-r-m2` | Hakuto-R M2 (Resilience), çarpma noktası | 60,44 | -4,6 | `commercial` | `crashed` | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 69 |

Notlar:

- **İki ayrı Mons Mouton kaydı var.** Ekibin test sahası IM-2'nin hedef noktasıdır; Athena'nın gerçekten indiği nokta ondan yaklaşık 370 m uzaktadır (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 17; [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 34). İkisi karıştırılmamalı.
- **Chang'e 6'nın boylamı kaynakta iki biçimde veriliyor:** 153,9852 derece batı ve 206,0148 derece doğu. İkisi aynı noktadır; kayıtta eksi 180 ile artı 180 arasına çevrilmiş hali tutulur ([ADR-0002](../adr/0002-koordinat-sistemi-ve-zaman.md); doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 6).
- **IM-1'in eğik durduğu bilgisi doğrulanamadı** (açıklanabilirlik doğrulama dosyasında No 36). Bu yüzden durumu `landed` olarak tutulur; teyit edilirse `landed_tipped` yapılır.
- **Diğer Apollo sahaları ve listede olmayan görevler** aynı NASA tablosundan okunarak eklenebilir. Bu çalışmada yalnızca yukarıdaki satırlar tek tek karşılaştırıldı.

### Artemis III aday bölgeleri

NASA'nın 28 Ekim 2024'te açıkladığı dokuz bölge: Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2, Slater Plain (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 77).

Bu liste eski plana aittir. Artemis III artık iniş yapmayacak; ilk iniş 2028'de Artemis IV ile hedefleniyor (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 78 ve 79). Dokuz bölgeye daraltma Artemis III'e özgüdür ve sonraki görevlerin saha seçimini bağlamaz (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 80).

Kural: Bu bölgeler listede `artemis_candidate` kategorisiyle ve "2024 Artemis III candidate study" etiketiyle gösterilir. Bölge bir nokta değil alan olduğu için koordinat olarak alanın temsili bir noktası gerekir; bu noktalar henüz elimizde yok (8. bölüm).

### Özel koordinat

1. Kullanıcı enlem ve boylam girer ya da haritada bir noktaya tıklar.
2. Enlem eksi 90 ile artı 90 arasında değilse reddedilir.
3. Boylam 180'den büyükse 360 çıkarılarak çevrilir ([ADR-0002](../adr/0002-koordinat-sistemi-ve-zaman.md)).
4. Kayıt `category` değeri `custom`, `validity` değeri `SYNTHETIC` olan geçici bir saha olarak işlenir.
5. O nokta için yükseklik haritası yoksa hesap düz ufukla yapılır ve arayüz bunu belirtir ([ADR-0004](../adr/0004-api-uc-noktalari.md)).

## 5. Girdi ve çıktı

### Girdi

`GET /api/sites`, isteğe bağlı `category` ([ADR-0004](../adr/0004-api-uc-noktalari.md)).

### Çıktı

`Site` dizisi ([ADR-0003](../adr/0003-veri-sozlesmesi.md)). `data/sites.json` içinden bir kayıt:

```json
{
  "id": "im2-athena", "name": "IM-2 Athena (landing point)", "category": "clps",
  "lat_deg": -84.7906, "lon_deg": 29.1957, "elevation_m": null,
  "landing_utc": null, "status": "landed_tipped",
  "coordinate_source": { "label": "NASA NSSDC lunar artifact table", "url": "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html" },
  "validity": "MEASURED", "notes": "About 370 m from the planned target point."
}
```

`landing_utc` bu örnekte boş bırakıldı: Athena'nın iniş saati birincil kaynaktan doğrulanamadı (aynı doğrulama dosyasında No 22 doğrulanamadı).

## 6. Arayüzde nerede görünür

- Referans arayüzün giriş akışında bir seçim ekranı var (Kaynak: [DESIGN.md, 2](../../frontend-migrate/DESIGN.md)). Bu projede o ekran saha seçimine dönüşür ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Haritada sahalar kategoriye göre işaretlenir; işaretin yanında koordinat kaynağı gösterilir.

## 7. Bilinen sınırlar

- **Liste kısa.** Yalnızca koordinatı tek tek karşılaştırılan sahalar var.
- **Kutup dışı sahalarda arazi ufku kaba.** Apollo 11 gibi sahalarda ince yükseklik haritası kullanılmıyor ([veri-kaynaklari-ve-on-hesap.md](veri-kaynaklari-ve-on-hesap.md)).
- **Planlanan görevlerin tarihleri oynak.** VIPER, IM-4 ve Griffin-1 Mons Mouton bölgesini hedefliyor, ama tarihleri sık değişiyor (doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 21 ve 26). Planlanan görevler eklenirse tarih yerine kaynak tarihi gösterilmeli.

## 8. Varsayımlar ve açık kararlar

- Açık iş: Artemis III bölgeleri için temsili noktalar. Sınır dosyaları otomatik indirilemiyor (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 69): site ziyaretçinin bot olmadığını doğrulayan bir ekran gösteriyor (14 Kasım 2026'da yeniden denendi). Dosyayı bir ekip üyesinin kendi tarayıcısından indirmesi gerekir. İndirilene kadar bu bölgeler listeye girmez.
- Karar (14 Kasım 2026): Çin görevlerinin sahaları (Chang'e 4 ve 6) listede kalır. Dikkat edilecek nokta: Space Apps kılavuzu, Çin ya da Çin'e ait kuruluşlarla ikili faaliyet için bir uygunluk incelemesi öngörüyor ve uygunluğa NASA karar veriyor (Kaynak: [jüri kılavuzu](../challenge/judging-and-awards-guide.pdf); doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 71). Bu yüzden bu sahalar için yalnızca NASA'nın kendi tablosundaki koordinat kullanılır; Çin kaynaklı veri ya da görsel kullanılmaz.
- Varsayım: `status` değerleri (`landed_tipped` gibi) ekibin tanımıdır.

## 9. Kaynaklar

- [NASA NSSDC koordinat tablosu](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html)
- [LROC, Chandrayaan-3 sahası](https://www.lroc.asu.edu/images/1314)
- [USGS, Artemis III aday bölgeleri](https://www.usgs.gov/data/down-selected-artemis-iii-candidate-landing-site-navigational-grids)
- [jüri kılavuzu](../challenge/judging-and-awards-guide.pdf)
