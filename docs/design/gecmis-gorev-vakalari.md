# Geçmiş görev vakaları

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Ekstra özellik
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [explainability-mission-differences](../research/explainability-mission-differences/README.md) (rapor, bölüm 3 ile 6)
- **Doğrulama:** [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md)

## 1. Ne yapıyoruz

Geçmiş Ay inişlerini, iniş anındaki gökyüzü durumuyla birlikte hazır senaryolar olarak sunuyoruz. Kullanıcı bir görevi seçer; ürün o tarihi ve yeri yükler ve Güneş ile Dünya'nın o anda nerede olduğunu gösterir.

## 2. Neden

Challenge hazır saha listesinde geçmiş görevlerin bulunmasını ve aracın eğitim amacıyla da kullanılabilmesini öneriyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)). Gerçek bir olay, soyut bir açıdan daha kolay anlaşılır. Bu vakalar aynı zamanda hazır test verisidir ([dogrulama-plani.md](dogrulama-plani.md)).

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| İniş koordinatları | [NASA NSSDC koordinat tablosu](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html) | HTML tablo | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 1 |
| İniş anı Güneş ve Dünya açıları | Horizons ile yeniden hesap | Aşama 1 doğrulama tablosu | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 1, 2, 3, 4, 5, 6 ve 7 |
| Görev olguları | NASA, JAXA, ISRO ve şirket açıklamaları | Metin | Aşağıdaki tablolarda |

## 4. Hesap nasıl yapılıyor

Yeni bir hesap yok. Her vaka bir saha, bir an ve doğrulanmış olgulardan oluşan bir kayıttır. Açılar ürünün kendi hesabıyla üretilir; aşağıdaki değerler beklenen sonuçtur.

### İlk altı vaka

| Görev | İniş anı (UTC) | Güneş yüksekliği | Dünya yüksekliği | Sonuç | Kaynak |
|---|---|---:|---:|---|---|
| IM-2 Athena | 2025-03-06 17:30 | 2,47 | 11,19 | Kraterin içinde yan yattı | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 1, 2 ve 20 |
| Blue Ghost 1 | 2025-03-02 08:34 | 3,43 | hesaplanmadı | Dik ve dengeli indi | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 3 ve 38 |
| Chandrayaan-3 | 2023-08-23 12:34 | 8,61 | hesaplanmadı | Kutba yakın ilk yumuşak iniş | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 4; [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 62 |
| IM-1 | 2024-02-22 23:23 | 10,47 | hesaplanmadı | İndi | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 5; [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 47 |
| SLIM | 2024-01-19 15:20 | 37,16 | hesaplanmadı | Ters durdu, panelleri batıya baktı | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 6 ve 44 |
| Chang'e 4 | 2019-01-03 02:26 | 31,51 | eksi 39,20 | Uzak yüze indi; röle ile iletişim | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 7 ve 59 |

Açılar derece cinsindendir; arazisiz ve sıfır yükseklik için hesaplanmıştır (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 8).

### Her vakada gösterilecek doğrulanmış olgular

- **Athena.** Hedefinden 400 m'den fazla uzağa indi; aynı NASA duyurusundaki bir fotoğraf altyazısı yaklaşık 250 m diyor. Yüzeyde 12 saat 45 dakika çalıştı (doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 35). Yan yatması panellerin yönünü bozdu ve güç kesildi (doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 41).
- **Blue Ghost 1.** Kamera tabanlı arazi tanıma kullandı ve iki engelden kaçınma manevrası yaptı (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 39). Sahasında Güneş sonradan 70 derecenin üstüne çıktı (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 12).
- **SLIM.** Yaklaşık 50 m yükseklikte iki ana motorundan birini kaybetti; hedefin yaklaşık 55 m doğusuna indi. Sabah güç üretemedi; gece için tasarlanmadığı halde üç Ay gecesini atlattı (Kaynak: [JAXA, 25 Ocak 2024](https://global.jaxa.jp/press/2024/01/file/jaxa_doc01_20240125_e.pdf); doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 42, 44 ve 47).
- **Chang'e 4.** Sahada Dünya 2019 boyunca hiç ufkun üstüne çıkmadı (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 14); [role-etiketi.md](role-etiketi.md) için örnek.
- **IM-1.** Uçuş öncesinde bir lazer mesafe ölçer güvenlik anahtarı açık kalmıştı ve ilgili test atlanmıştı; yedek sensörün verisi de kullanılamadı (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 32 ve 33).

### Kanıt düzeyi etiketi

Bir kazanın nedeni yazılacaksa yanında kanıt düzeyi durur. Üç düzey:

| Etiket | Anlamı | Örnek |
|---|---|---|
| Official report | Bağımsız ya da resmi inceleme raporu yayımlanmış | Peregrine inceleme kurulu raporu; kurul "en olası neden" diyor (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 72) |
| Preliminary | Kurumun ya da şirketin ön açıklaması | Athena, IM-1; SLIM'de motor parçasının kopması JAXA'nın varsayımı (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 26 ve 43) |
| Commentary | Üçüncü kişilerin yorumu | Nova-C aracının yüksek ağırlık merkezi (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 31) |

Kural: Kurumun kullandığı dil korunur. "En olası neden" denmişse "neden" diye yazılmaz. Resilience (2025) kazası için şirketin analizi nihai değildir; `Preliminary` etiketi alır (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 70, kısmen doğru).

## 5. Girdi ve çıktı

### Girdi

`GET /api/reference-missions` ([ADR-0004](../adr/0004-api-uc-noktalari.md)). Parametre yok.

### Çıktı

`data/reference_missions.json` içindeki kayıtların dizisi:

```json
{
  "id": "im2-athena", "mission": "IM-2 Athena", "site_id": "im2-athena",
  "landing_utc": "2025-03-06T17:30:00Z", "landing_utc_validity": "SYNTHETIC",
  "outcome": "landed_tipped",
  "expected": { "sun_elevation_deg": 2.47, "sun_azimuth_true_deg": 65.67, "earth_elevation_deg": 11.19 },
  "facts": [
    { "text": "Landed more than 400 m from its target and operated for 12 h 45 min.", "evidence": "official", "source": { "label": "NASA release 25-025", "url": null } }
  ]
}
```

`landing_utc_validity` alanı iniş anının ne kadar güvenilir olduğunu söyler: Athena'nın iniş saati birincil kaynaktan doğrulanamadı; hesap 17:30 için yapıldı (aynı doğrulama dosyasında No 22).

## 6. Arayüzde nerede görünür

- Saha seçim ekranında "Past missions" bölümü ([saha-katalogu.md](saha-katalogu.md), [gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Bir vaka seçildiğinde ufuk şeridi iniş anına gider; yanında olgu kartları kanıt düzeyi etiketiyle gösterilir ([karsilastirma-ve-aciklama.md](karsilastirma-ve-aciklama.md)).
- Referans arayüzde aynı adlı uç nokta var, ama içeriği farklı: geçmiş gezici görevlerin kat ettiği mesafeler (Kaynak: [net-types.ts](../../frontend-migrate/design-export/api-contract/types/net-types.ts), `ReferenceMissions`). Ad korunur, yapı değişir.

## 7. Bilinen sınırlar

- **Açılar arazisizdir.** Athena'nın bulunduğu kraterin kenarı hesaba katılmadı ([athena-demosu.md](athena-demosu.md)).
- **İki vakanın girdisi yaklaşıktır.** SLIM'in açısı yaklaşık koordinatla hesaplandı; resmi tablodaki daha hassas koordinat kullanılırsa değer biraz değişir (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 6; [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 4). Athena'nın iniş saati doğrulanamadı.
- **"Alçak Güneş başarısızlık demektir" çıkarımı yanlıştır.** Başarılı Blue Ghost inişinde Güneş 3,43 derece, devrilen Athena inişinde 2,47 derece yüksekteydi (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 1 ve 3). Vakalar bir neden kanıtı olarak değil, gökyüzü durumunun örneği olarak sunulur.
- **Liste kısa.** Yalnızca açıları yeniden hesaplanan altı iniş var.

## 8. Varsayımlar ve açık kararlar

- ADR-0003'e eklenmeli: geçmiş görev kaydının yapısı (`expected`, `facts`, `evidence`, `landing_utc_validity`).
- Karar (14 Kasım 2026): Chang'e 4 vakalarda kalır; yalnızca NASA tablosundaki koordinat ve resmi açıklamalar kullanılır ([saha-katalogu.md](saha-katalogu.md), 8. bölüm).
- Varsayım: Blue Ghost, Chandrayaan-3, IM-1 ve SLIM için Dünya açısı hesaplanmadı; ürün hesaplayacak.

## 9. Kaynaklar

- [JAXA, 25 Ocak 2024](https://global.jaxa.jp/press/2024/01/file/jaxa_doc01_20240125_e.pdf)
- [NASA NSSDC koordinat tablosu](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html)
- [explainability-mission-differences](../research/explainability-mission-differences/README.md)
