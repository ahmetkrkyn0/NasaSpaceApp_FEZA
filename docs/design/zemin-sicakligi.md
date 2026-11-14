# Zemin sıcaklığı

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Ekstra özellik (yüksek riskli)
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [zamanda-degisen-veri-hazirlama.md](../research/zamanda-degisen-veri-hazirlama.md) (bölüm 8), [light-heat-layer](../research/light-heat-layer/README.md) (M5)
- **Doğrulama:** [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md)

## 1. Ne yapıyoruz

Bir saha için zemin yüzeyinin sıcaklığını zaman içinde hesaplıyoruz. Sıcaklık yalnızca o andaki Güneş'e değil, geçmişte ne kadar ısındığına da bağlıdır; bu yüzden tablodan okunmaz, bir modelle hesaplanır.

## 2. Neden

Challenge'ın arka plan bölümü Güneş'in konumunun ekipman için ısı koşullarını da belirlediğini söylüyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)). Hedefler arasında sıcaklık yok; bu yüzden ekstra özelliktir.

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Model ve sabitleri | [Hayne ve arkadaşları, 2017](https://arxiv.org/abs/1711.00977) | Makale, ek A | [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 80 ve 81 |
| Hazır model kodu, `heat1d` | [heat1d deposu](https://github.com/phayne/heat1d) | Python; MIT lisansı | [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No B-7 ve B-8 |
| Güneş'in zaman içindeki konumu ve görünen oranı | [gunes-dunya-konumu.md](gunes-dunya-konumu.md), [ufuk-hesabi.md](ufuk-hesabi.md) | `SkySeries` | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |
| Karşılaştırma için ölçülmüş sıcaklıklar | NASA Diviner ürünleri | Tablo ve ızgara dosyaları; güney kutbu tablosu 605 MB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 38, 39 ve 40 |

## 4. Hesap nasıl yapılıyor

Model zemini yüzeyden aşağı doğru ince katmanlara böler ve her katmanın sıcaklığını zaman adımlarıyla günceller.

1. **Zemine giren enerji bulunur.** Her an için: Güneş'ten gelen enerji, Güneş'in yüksekliğine ve diskin görünen oranına göre hesaplanır. Arazi Güneş'i kesiyorsa giren enerji sıfırdır.
2. **Yüzey sıcaklığı güncellenir.** Yüzey, giren enerji ile uzaya yaydığı ısı ve alt katmandan gelen ısı dengede olacak şekilde ısınır ya da soğur.
3. **Isı aşağı katmanlara iletilir.** Zeminin üst kısmı gevşek ve yalıtkan, alt kısmı daha sıkıdır; model bunu derinlikle değişen bir yoğunlukla temsil eder.
4. **Model önce ısıtılır.** Sıcaklıklar dengeye gelene kadar aynı döngü tekrarlanır; makale bunun için 5 yıl kullanıyor (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 87).
5. **Sonra istenen aralık için sıcaklık serisi alınır.**

Doğrulanmış model ayrıntıları:

- Denklemler ve bütün sabitler makaledeki tabloyla aynı (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 80 ve 81).
- Yaklaşık 15 ile 20 katman yeterli; ekibin kurduğu ızgara 18 katmanlı ve zaman adımı 900 saniye (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 83 ve 84).
- Günlük ısı dalgasının zemine işleme derinliği yaklaşık 4 ile 7 cm (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 78, kısmen doğru: araştırma notundaki "4 ile 10 cm" makalede yok).

### Hazır kodu kullanırken bilinen üç sorun

1. **Sürüm.** Dışarıdan güneş verisi kabul eden sürüm henüz yayımlanmadı. Standart kurulum eski sürümü getirir ve gereken özellikler onda yok; kod doğrudan deposundan kurulmalı (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No B-3, kısmen doğru; [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No B-4 ve B-5).
2. **Isıtma aşaması gölgeyi bilmiyor.** Kod, dışarıdan verilen güneş verisini yalnızca çıktı aşamasında kullanıyor; ısıtma aşamasını gölgesiz yapıyor. Gölgedeki sahalar olduğundan sıcak başlar (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No B-6, kısmen doğru).
3. **Öğlen hizalaması.** Kod, verilen serinin yerel öğlene göre nerede başladığını bilmek zorunda. Verilmezse kendisi tahmin eder ve gölgeli seride yanlış tahmin eder (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No B-6, kısmen doğru).

## 5. Girdi ve çıktı

### Girdi

`GET /api/surface-temperature`: konum, `start_utc`, `end_utc`, `step_minutes`.

### Çıktı

```json
{
  "samples": [ { "utc": "2026-12-01T00:00:00Z", "surface_temp_k": null } ],
  "summary": { "min_k": null, "max_k": null, "mean_k": null },
  "model": { "name": "heat1d", "layers": 18, "spin_up": "5 years, unshadowed" },
  "validity": "MODEL"
}
```

Sıcaklık kelvin cinsindendir. Arazi ufku yoksa `validity` değeri `SYNTHETIC` olur.

## 6. Arayüzde nerede görünür

- Referans arayüzde sıcaklıkla ilgili bir panel ve harita katmanı var (Kaynak: [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `thermal-envelope`; [net-types.ts](../../frontend-migrate/design-export/api-contract/types/net-types.ts), `SeriesManifest` içinde `surface_temp_c`). Bu projede yalnızca saha için sıcaklık eğrisi gösterilir ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Eğrinin yanında güvenilirlik etiketi ve "Model result, not validated" notu.

## 7. Bilinen sınırlar

- **Ekibin model sonuçları tekrar edilmedi.** Araştırma notundaki sıcaklık değerleri doğrulanamadı (aynı doğrulama dosyasında No 88 ve 89). Üründe gösterilmeden önce modelin kendi çıktısı ölçümle karşılaştırılmalı.
- **Karşılaştırma verisi tam aynı şeyi ölçmüyor.** NASA'nın kutup sıcaklık tablosunda yıllık ortalama, yüzeyde değil 2 cm derinlikte tanımlı; yalnızca en yüksek sıcaklık yüzey içindir (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 38, kısmen doğru).
- **Yansıyan ışık ve çevreden gelen ısı yok.** Model yalnızca doğrudan Güneş'i hesaba katar.
- **Hesap ağır.** Her saha için ayrı çalıştırılması gerekir; süresi ölçülmedi.

## 8. Varsayımlar ve açık kararlar

- Öneri: Bu özellik en son yapılır ve yalnızca hazır sahalar için önceden hesaplanır.
- Öneri: İkinci sorun için ısıtma aşaması da gölgeli veriyle çalıştırılır; bunun için kodun kendi döngüsü yerine ekibin yeniden yazdığı model kullanılabilir. Ekibin yeniden yazdığı modelin sabitleri makaleyle aynı (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 81), ama sonuçları doğrulanmadı.
- ADR-0004'e eklenmeli: `/api/surface-temperature` uç noktası ve yanıt yapısı.
- Kapsam dışı: Araç ısıtıcısı, pil ve rota ile ilgili her şey ([ANALIZ-OZETI.md, bölüm 7.5](../research/ANALIZ-OZETI.md)).

## 9. Kaynaklar

- [Hayne ve arkadaşları, 2017](https://arxiv.org/abs/1711.00977)
- [heat1d deposu](https://github.com/phayne/heat1d)
- [light-heat-layer](../research/light-heat-layer/README.md), M5 bölümü
