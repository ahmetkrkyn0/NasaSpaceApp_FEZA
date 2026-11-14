# Güneş ve Dünya'nın konumu

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Zorunlu
- **Karar taslakları:** [ADR-0002](../adr/0002-koordinat-sistemi-ve-zaman.md), [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [zamanda-degisen-veri-hazirlama.md](../research/zamanda-degisen-veri-hazirlama.md) (bölüm 3 ve 4), [ephemeris-rotation-ground-stations](../research/ephemeris-rotation-ground-stations/README.md)
- **Doğrulama:** [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md)

## 1. Ne yapıyoruz

Ay yüzeyindeki bir nokta ve bir an için Güneş'in ve Dünya'nın gökyüzündeki yerini hesaplıyoruz: hangi yönde durduğunu (yön açısı) ve yerel yataydan ne kadar yukarıda ya da aşağıda olduğunu (yükseklik açısı). Ürünün diğer bütün hesapları bu iki açıdan başlar.

Bu doküman araziyi hesaba katmaz. Arazinin ufku nasıl yükselttiği [ufuk-hesabi.md](ufuk-hesabi.md) içinde.

## 2. Neden

Challenge'ın ana cümlesi bunu istiyor: Güneş ve Dünya'nın ufka göre konumunu göstermek (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)). Güç ve iletişim değerlendirmesi bu konumlara dayanır.

## 3. Hangi veriyi kullanıyoruz

Hesap NASA'nın SPICE kütüphanesiyle yapılır. SPICE, gök cisimlerinin konumunu ve yönelimini veri dosyalarından okuyan bir kütüphanedir; veri dosyalarına "kernel" denir.

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Artık saniye dosyası `naif0012.tls` | [NAIF veri dosyaları](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) | Metin, yaklaşık 5 KB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 13; [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 16 |
| Gezegen sabitleri `pck00011.tpc` | [NAIF veri dosyaları](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) | Metin, yaklaşık 130 KB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 13 |
| Gezegen ve Ay konumları `de440s.bsp` | [NAIF veri dosyaları](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) | İkili, 32 MB; 1849 ile 2150 yılları arası | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 13; [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 30 |
| Ay'ın yönelimi `moon_pa_de440_200625.bpc` | [NAIF veri dosyaları](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) | İkili, yaklaşık 13 MB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 13 |
| Ay koordinat sistemi tanımı `moon_de440_250416.tf` | [NAIF veri dosyaları](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) | Metin, yaklaşık 19 KB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 13; [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 25 |

Beş dosyanın toplamı yaklaşık 46 MB (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 29). Depoya konmaz; indirme yöntemi [veri-kaynaklari-ve-on-hesap.md](veri-kaynaklari-ve-on-hesap.md) içinde.

Karşılaştırma için NASA'nın Horizons servisi kullanılır. Horizons aynı açıları internet üzerinden veren bir hesap servisidir (Kaynak: [Horizons API belgesi](https://ssd-api.jpl.nasa.gov/doc/horizons.html); doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 22). Üründe canlı kaynak olarak kullanılmaz; nedeni 7. bölümde.

## 4. Hesap nasıl yapılıyor

1. **Saha konumu hazırlanır.** Enlem, boylam ve yükseklik, ME koordinat sisteminde ve 1737,4 km yarıçaplı küreye göre üç boyutlu bir konuma çevrilir (kural: [ADR-0002](../adr/0002-koordinat-sistemi-ve-zaman.md); doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-5).
2. **Zaman çevrilir.** Kullanıcının verdiği UTC anı, artık saniye dosyası kullanılarak SPICE'ın kendi zaman ölçeğine çevrilir. İki ölçek arasında 69,184 saniye fark var (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 18 ve 19).
3. **Güneş'in ve Dünya'nın sahaya göre konumu alınır.** Konum Ay'ın merkezinden değil sahadan ölçülür. Bu düzeltme Güneş için önemsiz, Dünya için önemlidir: atlanırsa Dünya'nın yüksekliği yaklaşık çeyrek derece yanlış çıkar (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 13 ve 14; [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 46).
4. **Işığın yolda geçirdiği süre ve gözlemcinin hareketi düzeltilir.** Güneş ışığı yaklaşık 499 saniyede, Dünya'dan gelen ışık 1,2 ile 1,4 saniyede ulaşır (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 42 ve 43).
5. **Yerel yön ve yükseklik hesaplanır.** Sahadaki yerel yatay düzleme göre yön açısı kuzeyden doğuya, yükseklik açısı yataydan yukarı ölçülür. SPICE bunu sabit konumlu bir gözlemci için tek çağrıyla verir (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 52).
6. **Görünen boyutlar eklenir.** Güneş diskinin yarıçapı yaklaşık 0,26 ile 0,27 derece, Dünya diskinin yarıçapı yaklaşık 0,90 ile 1,02 derece arasında değişir (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 4 ve 5). Bu değerler ufuk ve olay hesabında gerekir.
7. **Zaman serisi üretilir.** Adımlar istenen aralık boyunca tekrarlanır.

Ekibin bu yöntemle yazdığı kod, Horizons ile derecenin milyonda biri düzeyinde aynı sonucu veriyor (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 32; [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 14).

Dünya'nın gökyüzünde ayda bir küçük bir alanda gezinmesi (librasyon) ayrı bir hesap gerektirmez; bu yöntemden kendiliğinden çıkar. Aralık 2026'da Dünya'nın Ay üzerindeki tam tepe noktası enlemde yaklaşık artı eksi 6,6, boylamda yaklaşık artı eksi 7,9 derece kayıyor (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 41).

### Örnekleme adımı

Güneş gökyüzünde saatte yaklaşık yarım derece yol alır (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 37). Saatlik örnekler arasını doldurmak yeterlidir: gerçek veride ölçülen hata Güneş diskinin yarıçapının yanında çok küçüktür (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 40 ve 41).

Öneri: Sunucu seriyi isteğin `step_minutes` değerine göre doğrudan hesaplar; ara değer doldurmaya gerek kalmaz. Olay anları ayrıca aranarak bulunur ([olaylar-ve-sureler.md](olaylar-ve-sureler.md)).

## 5. Girdi ve çıktı

### Girdi

Uç nokta `GET /api/sky-series` ([ADR-0004](../adr/0004-api-uc-noktalari.md)). Parametreler: konum (`site_id` ya da `lat_deg` ile `lon_deg`), `mast_height_m`, `start_utc`, `hours`, `step_minutes`.

### Çıktı

`SkySeries` yapısı ([ADR-0003](../adr/0003-veri-sozlesmesi.md)). Örnek, tek örnekli kısaltılmış hali; değerler Athena iniş anı içindir (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 1 ve 2):

```json
{
  "lat_deg": -84.7906, "lon_deg": 29.1957, "mast_height_m": 0,
  "start_utc": "2025-03-06T17:30:00Z", "step_minutes": 60,
  "ephemeris": { "source": "SPICE DE440", "frame": "MOON_ME", "correction": "LT+S" },
  "horizon": { "method": "sphere", "validity": "SYNTHETIC" },
  "validity": "SYNTHETIC",
  "samples": [{
    "utc": "2025-03-06T17:30:00Z",
    "sun":   { "azimuth_true_deg": 65.67, "elevation_deg": 2.47, "horizon_deg": 0.0, "visible_fraction": 1.0, "range_au": null, "radius_deg": null },
    "earth": { "azimuth_true_deg": 335.85, "elevation_deg": 11.19, "horizon_deg": 0.0, "visible_fraction": 1.0, "range_km": null, "radius_deg": null }
  }]
}
```

Örnekteki `null` alanlar ve `visible_fraction` değerleri yer tutucudur; gerçek yanıtta hesaplanır.

## 6. Arayüzde nerede görünür

- Ufuk üzerindeki Güneş ve Dünya gösterimi ile zaman çizelgesi bu seriden beslenir ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Referans arayüz Güneş için aynı alan adlarını kullanıyor: `azimuth_true_deg` ve `elevation_deg` (Kaynak: [net-types.ts](../../frontend-migrate/design-export/api-contract/types/net-types.ts), `SunSample`). Zaman ekseni paneli alt bölmede duruyor (Kaynak: [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `time-axis`).

## 7. Bilinen sınırlar

- **Arazi yok.** Bu hesap Güneş'in ve Dünya'nın düz bir küreye göre açısını verir. Horizons da araziyi hesaba katmaz (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 35).
- **Tarih aralığı.** Kullanılan konum dosyası 1849 ile 2150 arasını kapsıyor (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 30).
- **Horizons canlı kaynak değil.** Resmi bir istek sınırı yayımlanmamış; bir başka JPL servisinde aşırı yük yaratan bir sunucunun engellendiği biliniyor (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 35, kısmen doğru). Horizons yalnızca sonuçlarımızı sınamak için kullanılır.
- **Hesap arşivindeki betik düzeltilmeli.** `site_azel_spice.py` içinde tarihin sonundaki `UTC` eki SPICE'ta hata veriyor; kaldırılınca betik Horizons ile tutuyor (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 51).
- **Üç yöntemin uyumu açıya göre değişiyor.** Ekibin üç ayrı hesabı yükseklik açısında bir yay dakikasının onda biri içinde, yön açısında ise onda iki ile onda dört arasında tutuyor (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 47 ve 48). Ürün için kullanılacak olan SPICE yolu bunların en doğrusudur.

## 8. Varsayımlar ve açık kararlar

- Varsayım: Tarayıcıda çalışan `astronomy-engine` kütüphanesiyle yaklaşık bir yay dakikası doğruluk elde edileceği ekibin öngörüsüdür; gerçek çağrılarla denenmedi (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 77; aynı dosyada No 78 doğrulanamadı). Sunucusuz bir yedek istenirse önce bu denenmeli.
- Öneri: İlk sürümde hesap yalnızca sunucuda yapılır ([ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md)).
- Açık karar: Tam kutba çok yakın sahalarda yön açısının hangi kuzeye göre verileceği ([ADR-0002](../adr/0002-koordinat-sistemi-ve-zaman.md), varsayım maddesi).

## 9. Kaynaklar

- [NAIF veri dosyaları](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/)
- [Horizons API belgesi](https://ssd-api.jpl.nasa.gov/doc/horizons.html) ve [Horizons kılavuzu](https://ssd.jpl.nasa.gov/horizons/manual.html)
- [hesap arşivi](../research/ephemeris-rotation-ground-stations/lunar-navigator-hesaplar.zip): `code/site_azel_spice.py`, `scripts/crosscheck.py`
- [zamanda-degisen-veri-hazirlama.md](../research/zamanda-degisen-veri-hazirlama.md), bölüm 3 ve 4
