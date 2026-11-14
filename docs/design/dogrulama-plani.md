# Doğrulama planı

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Destekleyici
- **Karar taslakları:** [ADR-0002](../adr/0002-koordinat-sistemi-ve-zaman.md), [ADR-0003](../adr/0003-veri-sozlesmesi.md)
- **Dayandığı araştırma:** [data-sources](../research/data-sources/README.md) (bölüm 14), [ANALIZ-OZETI.md](../research/ANALIZ-OZETI.md)
- **Doğrulama:** [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md)

## 1. Ne yapıyoruz

Kendi kodumuzun ürettiği sonuçları, doğru olduğu bilinen değerlerle karşılaştırmanın yolunu tanımlıyoruz. Elimizde hazır test verisi var: Aşama 1'de NASA araçlarıyla yeniden hesaplanıp tutan sayılar.

## 2. Neden

Jüri ölçütlerinden biri geçerliliktir: çözümün bilimsel olarak sağlam olması (Kaynak: [jüri kılavuzu](../challenge/judging-and-awards-guide.pdf)). Sonuçlarımızın NASA'nın kendi aracıyla tuttuğunu göstermek bu ölçüte doğrudan kanıttır. Ayrıca dört kişi paralel kod yazarken ortak test verisi, parçaların birbiriyle uyumunu güvenceye alır.

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Horizons servisi | [Horizons API belgesi](https://ssd-api.jpl.nasa.gov/doc/horizons.html) | İstek başına metin tablo | [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 22 ve 33 |
| Hesap arşivindeki Horizons çıktıları | [hesap arşivi](../research/ephemeris-rotation-ground-stations/lunar-navigator-hesaplar.zip), `data/hz_*.txt` | Metin; 61 satır | [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 39 |
| Ortalama aydınlanma ve Dünya görünürlüğü haritaları | [PGDA 69](https://pgda.gsfc.nasa.gov/products/69) | 60 ile 240 m arası çözünürlük | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 34 |
| Aşama 1 doğrulama tabloları | `docs/research/dogrulama/` | Markdown | [ANALIZ-OZETI.md, bölüm 4](../research/ANALIZ-OZETI.md) |

## 4. Hesap nasıl yapılıyor

Her test bir beklenen değer, bir kaynak ve bir kabul eşiğinden oluşur. Kod çalıştırılır, çıkan değer beklenenle karşılaştırılır.

### Test 1: İniş anı açıları

Altı geçmiş iniş için Güneş'in yön ve yükseklik açısı. Hepsi Horizons ile yeniden hesaplandı.

| Görev | An (UTC) | Enlem, boylam | Güneş yönü | Güneş yüksekliği | Kaynak |
|---|---|---|---:|---:|---|
| IM-2 Athena | 2025-03-06 17:30 | -84,7906; 29,1957 | 65,67 | 2,47 | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 1 |
| Blue Ghost 1 | 2025-03-02 08:34 | 18,562; 61,810 | 91,62 | 3,43 | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 3 |
| Chandrayaan-3 | 2023-08-23 12:34 | -69,373; 32,319 | 62,04 | 8,61 | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 4 |
| IM-1 | 2024-02-22 23:23 | -80,13; 1,44 | 18,61 | 10,47 | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 5 |
| SLIM | 2024-01-19 15:20 | -13,3; 25,2 | 81,66 | 37,16 | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 6 |
| Chang'e 4 | 2019-01-03 02:26 | -45,4446; 177,5991 | 50,70 | 31,51 | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 7 |

Dünya için: Athena anında yön 335,85 ve yükseklik 11,19 derece (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 2); Chang'e 4 anında yükseklik eksi 39,20 derece (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 7).

Hepsi yüksekliği sıfır kabul edilen referans küre için ve arazisiz hesaplanmıştır (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 8). Testte `mast_height_m` sıfır ve ufuk yöntemi `sphere` olmalı.

### Test 2: Test sahasında bir ay

Mons Mouton test sahası (enlem -84,78; boylam 29,13), Aralık 2026, düz ufuk:

| Ölçü | Beklenen | Kaynak |
|---|---|---|
| Güneş'in en yüksek açısı | 6,47 derece, 21 Aralık | [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 2 |
| Dünya'nın yükseklik aralığı | Eksi 2,10 ile artı 10,65 derece | [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 40 |
| Dünya'nın merkezi batıyor | 3 Aralık 10:03 | [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 42 |
| Dünya'nın merkezi doğuyor | 11 Aralık 04:41 | [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 42 |
| Dünya'nın ufkun altında kaldığı oran | Yüzde 27,7 | [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 43 |
| En uzun karanlık, düz ufuk | 280 saat | [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 6 |

### Test 3: Panel gücü

[guc-degerlendirmesi.md](guc-degerlendirmesi.md) içindeki "Test verisi" tablosu: dört panel tipi için üç ufuk varsayımında ortalama güç (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 4).

### Test 4: Ufuk uzaklığı

Düz ufukta gözlem yüksekliğine göre ufuk uzaklığı ve alçalması: [ufuk-hesabi.md](ufuk-hesabi.md) içindeki tablo (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-6 ve A-7).

### Test 5: Bir tutulma

Apollo 11 sahasında 20 ve 21 Şubat 2027: Dünya, Güneş'i 22:09 ile 00:36 UTC arasında örtüyor; en fazla yüzde 34,3 (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 70). Bu test yalnızca [tutulmalar.md](tutulmalar.md) yapılırsa geçerlidir.

### Test 7: Olay anının ufuk hatasına duyarlılığı

Ufuk bir yay dakikası oynatıldığında bir gün doğumunun ne kadar kaydığı. Ekvatora yakın bir sahada yaklaşık 2 dakika, Mons Mouton'da en iyi durumda yaklaşık 22 dakika beklenir (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 10). Test, [olaylar-ve-sureler.md](olaylar-ve-sureler.md) içindeki aralık hesabını sınar.

Testlerin koşulları, eşikleri ve hangi işte sınandıkları [PLAN.md](../PLAN.md) bölüm 4.2'de tek tabloda toplanmıştır. Test 2 için aralık 1 Aralık 00:00 ile 31 Aralık 00:00 arasıdır (30 gün; yükseklik sıfır, ölçüt merkez). Test 3 için aralık 1 Aralık 00:00 ile 1 Ocak 00:00 arasıdır (saatlik 745 örnek) ve referans tablo Güneş diskinin dikey oranıyla hesaplanmıştır (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 4).

### Test 6: Hazır NASA haritasıyla karşılaştırma

1. Arazi ufku hesaplanan bir saha için uzun bir aralıkta güneşli zaman oranı bulunur.
2. Aynı noktanın değeri NASA'nın ortalama aydınlanma haritasından okunur.
3. İkisi yan yana raporlanır.

Bu karşılaştırma yaklaşıktır; birebir tutması beklenmez. Nedenleri 7. bölümde.

## 5. Girdi ve çıktı

### Girdi

Test verisi depoda `data/examples/test_vectors.json` altında tutulur. Bir kayıt:

```json
{
  "id": "athena-landing-sun", "endpoint": "/api/sky-series",
  "params": { "lat_deg": -84.7906, "lon_deg": 29.1957, "mast_height_m": 0, "start_utc": "2025-03-06T17:30:00Z", "hours": 0, "step_minutes": 60 },
  "expect": { "samples[0].sun.azimuth_true_deg": 65.67, "samples[0].sun.elevation_deg": 2.47 },
  "tolerance_deg": 0.01,
  "source": "docs/research/dogrulama/aciklanabilirlik.md, No 1"
}
```

### Çıktı

Her test için geçti ya da kaldı bilgisi ve ölçülen fark. Sonuç tablosu sunumda kullanılabilir.

## 6. Arayüzde nerede görünür

- Referans arayüzde hesap sonuçlarını resmi bir NASA ürünüyle karşılaştıran bir panel var (Kaynak: [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `psr-validation`). Aynı fikir bu projede "Validation" paneline dönüşebilir: test tablosunun özeti.
- Her sonucun yanındaki güvenilirlik etiketi ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).

## 7. Bilinen sınırlar

- **NASA haritası uzun dönem ortalamasıdır.** Saatlik adımlarla 18,6 yıl üzerinden hesaplanmıştır (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 34; [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 12). Bir aylık ya da bir yıllık sonucumuz bu ortalamadan sapabilir.
- **Harita çözünürlüğü sonucu değiştirir.** Kaba haritayla yapılan hesap kutupta aydınlanmayı olduğundan fazla gösterir (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 84).
- **Dünya görünürlüğü haritası iyimser bir ölçüt kullanır** ([iletisim-penceresi.md](iletisim-penceresi.md)).
- **İki test yaklaşık girdiye dayanıyor.** SLIM'in açısı yaklaşık koordinatla hesaplandı (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 6) ve Athena'nın iniş saati birincil kaynaktan doğrulanamadı (aynı doğrulama dosyasında No 22). Bu iki satır hesabın tutarlılığını sınar, gerçek iniş anını değil. IM-1'in iniş saati ise ayrı bir kaynakla doğrulandı (doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 47).
- **Sıcaklık modeli için test verisi yok.** Ekibin model sonuçları tekrar edilmedi ([zemin-sicakligi.md](zemin-sicakligi.md)).

## 8. Varsayımlar ve açık kararlar

- Öneri: Açılar için kabul eşiği derecenin yüzde biri. Ekibin kodu Horizons ile bundan çok daha iyi tutuyor (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 14), ama beklenen değerler iki ondalıkla yazılı.
- Öneri: Olay anları için kabul eşiği iki dakika (düz ufukta).
- Öneri: Testler her kod değişikliğinde otomatik çalışır.
- Açık karar: Test 6 için hangi saha ve hangi aralık. Öneri: Mons Mouton test sahası, bir yıl.

## 9. Kaynaklar

- [Horizons API belgesi](https://ssd-api.jpl.nasa.gov/doc/horizons.html)
- [PGDA 69](https://pgda.gsfc.nasa.gov/products/69)
- [hesap arşivi](../research/ephemeris-rotation-ground-stations/lunar-navigator-hesaplar.zip)
- [jüri kılavuzu](../challenge/judging-and-awards-guide.pdf)
