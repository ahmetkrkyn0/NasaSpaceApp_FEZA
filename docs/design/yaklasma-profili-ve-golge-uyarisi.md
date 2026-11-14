# Yaklaşma profili ve gölge uyarısı

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Ekstra özellik
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [csa-moon-exploration.md](../research/csa-moon-exploration.md) (bölüm 8), [explainability-mission-differences](../research/explainability-mission-differences/README.md)
- **Doğrulama:** [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md)

## 1. Ne yapıyoruz

İki şey gösteriyoruz:

1. **Yaklaşma profili:** İniş noktasına belirli bir yönden yaklaşırken altından geçilen arazinin yükseklik kesiti.
2. **Gölge uyarısı:** Seçilen anda Güneş alçaksa gölgelerin ne kadar uzun olacağı ve bir uyarı.

## 2. Neden

Challenge, küçük konum ve tarih değişikliklerinin neden büyük fark yarattığını anlatan özellikler öneriyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)). Yakın tarihli iki iniş, arazi ve ışığın inişi nasıl zorlaştırdığını gösteriyor:

- **Athena (IM-2, 2025).** Şirketin açıklamasına göre güney kutbunun arazisi ve alçak açılı Güneş ışığı uzun gölgeler ve loş ışık yarattı; yükseklik ölçer verisi gürültülüydü (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 69; [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 38). Şirket sonraki araçlarına ışıktan bağımsız bir sensör ekliyor (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 70).
- **HAKUTO-R M1 (2023).** Araç yükseklik verisini yanlış yorumladı; kaynaklar yükseklik sensörünün bir krater kenarı yüzünden yanıldığını söylüyor (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 63, kısmen doğru: araştırma notundaki "3 km sıçrama" kaynakta yok).

Bu açıklamalar şirketlerin kendi ön bulgularıdır; bağımsız bir inceleme raporu değildir ([gecmis-gorev-vakalari.md](gecmis-gorev-vakalari.md)).

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Yükseklik haritası, `LDEM` | [PGDA 90](https://pgda.gsfc.nasa.gov/products/90) | GeoTIFF; 10 ile 240 m arası çözünürlük | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 18 ve 21 |
| Gölgeli kabartma, `LDEM` eki `_HILL` | [PGDA 90](https://pgda.gsfc.nasa.gov/products/90) | Yükseklik haritasıyla aynı ızgara | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 20 |
| Güneş'in yüksekliği ve yönü | [gunes-dunya-konumu.md](gunes-dunya-konumu.md) | `SkySeries` | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |

## 4. Hesap nasıl yapılıyor

### Yaklaşma profili

1. Kullanıcı yaklaşma yönünü seçer: aracın hangi yönden geldiği.
2. İniş noktasından o yöne doğru, seçilen uzunlukta bir çizgi çizilir.
3. Çizgi boyunca eşit aralıklarla yükseklik haritasından değer okunur.
4. Sonuç uzaklığa karşı yükseklik olarak çizilir; iniş noktası çizginin sonundadır.

### Gölge uzunluğu

1. Seçilen an için Güneş'in yükseklik açısı alınır.
2. Bir nesnenin gölgesi, nesnenin yüksekliğinin Güneş açısına bağlı bir katıdır. Güneş alçaldıkça kat hızla büyür.
3. Arayüz "1 m'lik bir nesnenin gölgesi" değerini gösterir.

Doğrulanmış örnekler:

| Güneş yüksekliği | 1 m'lik nesnenin gölgesi | Kaynak |
|---|---|---|
| 2 derece | Yaklaşık 29 m (10 m'lik kaya için 286 m) | [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 84 |
| 2,47 derece (Athena iniş anı) | Yaklaşık 23 m | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 16 |
| 3,43 derece (Blue Ghost iniş anı) | Yaklaşık 17 m | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 16 |

İlk satırdaki 29 m, 286 m'nin onda biridir (hesap).

### Uyarı

Öneri: Güneş yüksekliği 5 derecenin altındaysa "Long shadows" uyarısı, Güneş ufkun altındaysa "No direct sunlight" uyarısı gösterilir.

## 5. Girdi ve çıktı

### Girdi

`GET /api/approach-profile`: konum, `approach_azimuth_deg` (aracın geldiği yön, kuzeyden doğuya), `length_km`, `utc`.

### Çıktı

```json
{
  "approach_azimuth_deg": 180.0, "length_km": 5.0, "step_m": 20,
  "distance_m": [5000, 4980, "..."], "elevation_m": [null, null, "..."],
  "sun_elevation_deg": 2.47, "shadow_length_per_meter": 23.2,
  "warning": "long_shadows", "validity": "DERIVED"
}
```

`warning` değerleri: `none`, `long_shadows`, `no_direct_sunlight`.

## 6. Arayüzde nerede görünür

- Sky sekmesinin altında ya da ayrı bir panelde: kesit çizimi ve gölge değeri ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Haritada gölgeli kabartma katmanı; yaklaşma çizgisi üzerine çizilir.

## 7. Bilinen sınırlar

- **Yaklaşma yönü bilinmiyor.** Gerçek görevlerin yaklaşma yönleri elimizde yok; kullanıcı girer.
- **Gölge değeri düz zemin içindir.** Eğimli zeminde gölge daha uzun ya da kısa olur.
- **Harita çözünürlüğü küçük engelleri göstermez.** En ince harita 10 m; kayalar ve küçük kraterler görünmez. Athena'nın içine yattığı krater 20 m çapındaydı (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 20); bu, haritanın çözebildiği sınırdadır.
- **Uyarı bir risk hesabı değildir.** Başarılı Blue Ghost inişinde de Güneş alçaktı: 3,43 derece (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 3).

## 8. Varsayımlar ve açık kararlar

- Varsayım: 5 derecelik uyarı eşiği ekibin önerisidir.
- Varsayım: Apollo için "inişte Güneş arkadan 7 ile 20 derece yüksekte" ölçütü araştırmada kaynaksız kaldı (açıklanabilirlik doğrulama dosyasında No 76); kullanılmıyor.
- ADR-0004'e eklenmeli: `/api/approach-profile` uç noktası ve yanıt yapısı.

## 9. Kaynaklar

- [PGDA 90](https://pgda.gsfc.nasa.gov/products/90)
- [csa-moon-exploration.md](../research/csa-moon-exploration.md), bölüm 8.2
