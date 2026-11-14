# Güç değerlendirmesi

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Zorunlu (panel modeli bölümü Destekleyici)
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [solar-panel-model](../research/solar-panel-model/README.md), [zamanda-degisen-veri-hazirlama.md](../research/zamanda-degisen-veri-hazirlama.md) (bölüm 7)
- **Doğrulama:** [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md)

## 1. Ne yapıyoruz

Bir saha ve tarih aralığı için güneş enerjisi potansiyelini iki düzeyde veriyoruz:

1. **Temel ölçüler:** Güneş'in yükseklik açısı ve güneşli süre.
2. **Panel gücü:** Seçilen panel tipine ve direk yüksekliğine göre saat saat güç, ortalama güç, toplam enerji ve en uzun karanlık.

## 2. Neden

Challenge güç potansiyelinin değerlendirilmesini istiyor ve iki ölçünün adını veriyor: Güneş yükseklik açısı ve güneşli süre (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)). Kutupta Güneş hep ufka yakın olduğu için panelin nasıl durduğu, panelin kendisinden daha belirleyici: Güneş 1,5 derece yüksekteyken dik ve Güneş'e dönük bir panel, yere yatık panelin yaklaşık 38 katı güç alır (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 76 ve S8).

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Güneş'in konumu, uzaklığı ve görünen oranı | [gunes-dunya-konumu.md](gunes-dunya-konumu.md), [ufuk-hesabi.md](ufuk-hesabi.md) | `SkySeries` | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |
| Güneş'ten gelen enerji, Dünya uzaklığında | [Kopp ve Lean, 2011](https://doi.org/10.1029/2010GL045777) | Metrekareye 1361 watt | [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 3 |
| Panel profilleri | Depoda `data/panel_profiles.json` | `PanelProfile` dizisi | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |

Ay yüzeyinde Güneş'ten gelen enerji yıl içinde metrekareye 1315 ile 1421 watt arasında değişir (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 24).

## 4. Hesap nasıl yapılıyor

### Temel ölçüler

1. Güneş'in yükseklik açısı seriden doğrudan okunur; aralıktaki en yüksek değer ayrıca verilir.
2. Güneşli süre, Güneş diskinin en az bir kısmının göründüğü örneklerin toplam süresidir ([olaylar-ve-sureler.md](olaylar-ve-sureler.md)).

### Panel gücü

Her örnek için:

1. **Güneş'ten gelen enerji bulunur.** 1361 watt değeri, Güneş'in o andaki uzaklığına göre düzeltilir: Güneş yaklaştıkça artar, uzaklaştıkça azalır.
2. **Panelin Güneş'e ne kadar dönük olduğu bulunur.** Bu, Güneş yönü ile panel yüzeyinin baktığı yön arasındaki açıya bağlı bir orandır: panel Güneş'e tam dönükse 1, Güneş panelin kenarından ya da arkasından geliyorsa 0 (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 16).
3. **Görünen oranla çarpılır.** Güneş diskinin yarısı ufkun altındaysa enerji de yarıya iner ([ufuk-hesabi.md](ufuk-hesabi.md)).
4. **Alan ve verimle çarpılır.** Sonuç o andaki elektrik gücüdür.

Dört panel tipi ve "Güneş'e dönüklük" oranının nasıl bulunduğu:

| Tip (`type`) | Nasıl durur | Oran nasıl bulunur |
|---|---|---|
| `horizontal` | Yere yatık | Yalnızca Güneş'in yüksekliğine bağlı. Kutupta çok küçük |
| `vertical_fixed` | Dik, sabit bir yöne bakar | Güneş'in yüksekliğine ve Güneş'in yönü ile panelin yönü arasındaki farka bağlı. Güneş arkadayken 0 |
| `vertical_tracking` | Dik, Güneş'le birlikte döner | Yalnızca Güneş'in yüksekliğine bağlı. Kutupta 1'e çok yakın |
| `two_axis` | Her zaman Güneş'e tam dönük | Her zaman 1 |

(doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 16 ve 17)

5. **Özet çıkarılır.** Ortalama güç, toplam enerji, güneşli zaman oranı ve en uzun karanlık.

### Direk yüksekliği

Panel yükseldikçe yakındaki engellerin üstünden bakar. Bu etki ufuk profili üzerinden gelir: profil `mast_height_m` değeriyle yeniden hesaplanır ([ufuk-hesabi.md](ufuk-hesabi.md)). NASA kutup için 20 m'ye kadar dikey güneş paneli direkleri geliştiriyor; dik ve dönen panel bu tasarıma karşılık gelir (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 35 ve 37).

## 5. Girdi ve çıktı

### Girdi

`GET /api/power`: konum, `start_utc`, `end_utc`, `panel_profile_id` ([ADR-0004](../adr/0004-api-uc-noktalari.md)). `mast_height_m` panel profilinden gelir.

### Çıktı

`PowerSeries` ([ADR-0003](../adr/0003-veri-sozlesmesi.md)). Örnek özet; Mons Mouton, Aralık 2026, dik ve dönen panel, 1 metrekare, ufuk her yönde 1 derece aşağıda varsayılarak (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 15):

```json
{
  "panel_profile_id": "vertical_tracking",
  "summary": { "mean_power_w": 258.2, "energy_kwh": 192.1, "sunlit_fraction": 0.662, "longest_dark_hours": 232 },
  "validity": "SYNTHETIC"
}
```

Bu örnekte verim 0,29 alınmıştır; varsayılan değer için 8. bölüme bakın.

### Test verisi

Aynı saha ve ay için verim uygulanmadan, panelin metrekaresine düşen ortalama güç (watt). Hepsi yeniden hesaplanıp doğrulandı (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 4 ve 6):

| Panel tipi | Ufuk 1 derece aşağıda | Ufuk düz | Ufuk 1 derece yukarıda |
|---|---:|---:|---:|
| `two_axis` | 892,7 | 771,2 | 688,3 |
| `vertical_tracking` | 890,3 | 768,8 | 685,9 |
| `vertical_fixed`, en iyi yönde | 426,2 | 423,4 | 423,3 |
| `horizontal` | 54,3 | 54,3 | 53,6 |
| En uzun karanlık (saat) | 232 | 280 | hesaplanmadı |

## 6. Arayüzde nerede görünür

- Saha özetinde "Max Sun elevation" ve "Sunlit time" değerleri.
- Panel tipi ve direk yüksekliği seçimi; altında güç eğrisi ve özet ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Karşılaştırma tablosunda ortalama güç ve en uzun karanlık sütunları ([karsilastirma-ve-aciklama.md](karsilastirma-ve-aciklama.md)).

## 7. Bilinen sınırlar

- **Sonuç ufuk profiline çok duyarlı.** Ufku 1 derece aşağı almak dönen panelin enerjisini yüzde 16 artırıyor, 1 derece yukarı almak yüzde 11 azaltıyor (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 12). Arazi ufku olmadan verilen güç değerleri kaba kalır.
- **Dönen dik panel ile iki eksenli panel arasında fark yok denecek kadar az:** yüzde 0,3 (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 10). Sabit dik panel dönen panelin yaklaşık yarısını, yere yatık panel yaklaşık yüzde 6'sını toplar (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 11).
- **Sıcaklık etkisi yok.** Hücre verimi sıcaklıkla derece başına yaklaşık binde 2 değişir (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 44); ilk sürümde hesaba katılmaz.
- **Yansıyan ışık ve panelin kendi gölgesi yok.**
- **Test verisi tek bir ay için.** Aralık 2026 dışındaki aylar farklı sonuç verir.

## 8. Varsayımlar ve açık kararlar

- Varsayım: Varsayılan verim 0,27. Gösterilen üretici veri sayfası ömür başı için yüzde 26,8 veriyor; araştırma notundaki 0,29 değeri bu kaynakla uyuşmuyor (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 43, kısmen doğru). Hazır profillerin hepsi `SYNTHETIC` etiketi taşır.
- Öneri: Hazır profiller dört tip için birer tane, alan 1 metrekare, direk yüksekliği 2 m. Kullanıcı yüksekliği 2, 5, 10 ve 20 m arasından seçer.
- Açık karar: `vertical_fixed` için varsayılan yön. Öneri: aralıktaki en iyi yön sunucuda bulunur ve yanıtta bildirilir.
- Kapsam dışı: Rover üzerindeki paneller ve rover'ın yönüne göre hesap ([ANALIZ-OZETI.md, bölüm 7.5](../research/ANALIZ-OZETI.md)).

## 9. Kaynaklar

- [Kopp ve Lean, 2011](https://doi.org/10.1029/2010GL045777)
- [solar-panel-model](../research/solar-panel-model/README.md), bölüm 3, 4 ve 8
- [PGDA 69](https://pgda.gsfc.nasa.gov/products/69) (güneşli süre karşılaştırması için; [dogrulama-plani.md](dogrulama-plani.md))
