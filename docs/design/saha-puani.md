# Saha puanı

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Ekstra özellik
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [csa-moon-exploration.md](../research/csa-moon-exploration.md) (bölüm 8), [data-sources](../research/data-sources/README.md) (bölüm 7), [chandrayaan3-landing-site-selection](../research/chandrayaan3-landing-site-selection/README.md) (doğrulanmadı)
- **Doğrulama:** [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md)

## 1. Ne yapıyoruz

Bir saha ve tarih aralığı için birkaç ölçüyü tek bir puanda topluyoruz. Kullanıcı her ölçünün ağırlığını kendisi seçer. Puan her zaman bileşenleriyle birlikte gösterilir.

## 2. Neden

Challenge sahalar arasındaki ödünleşimleri hızlı değerlendirmeyi istiyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)). Tek bir puan, çok sayıda sahayı sıralamayı kolaylaştırır.

Esin kaynağı Hindistan'ın Chandrayaan-3 için kullandığı saha seçim yöntemi: 60 ile 70 derece güney arasında 4 km'ye 2,4 km'lik kayan bir pencereyle güvenli alanlar tarandı, sonra 8 aday çok keskin görüntülerle incelendi (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 79; [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 53). Doğrulanan kaynaklarda geçen ölçütler arazi, eğim, aydınlanma ve tehlikeden kaçınmadır (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 80, kısmen doğru: Dünya görünürlüğü o kaynaklarda ölçüt olarak geçmiyor).

Ekip sonradan bu yöntemi ayrıntılı anlatan ayrı bir not ekledi: [chandrayaan3-landing-site-selection](../research/chandrayaan3-landing-site-selection/README.md). Not, eleme aşamalarını, eşik değerlerini, sekiz adayın ölçümlerini ve yöntemin bu projeye nasıl uyarlanacağını içeriyor; Dünya ile telsiz görüşünü de ölçütler arasında sayıyor. Bu not Aşama 1 doğrulamasından sonra eklendi; iddiaları kaynaklarıyla karşılaştırılmadı. Aşağıdaki tasarım yalnızca doğrulanmış bilgiye dayanır; o nottan alınacak her sayı önce kaynağından kontrol edilmeli.

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Güneşli zaman oranı, en uzun karanlık, Dünya görünürlük oranı | [olaylar-ve-sureler.md](olaylar-ve-sureler.md) | `EventList` ölçüleri | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |
| Eğim haritası, `LDSM` | [PGDA 90](https://pgda.gsfc.nasa.gov/products/90) | GeoTIFF; 20 m dosya 3,8 GB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 22 |
| Pürüzlülük haritaları, `LDRM` | [PGDA 90](https://pgda.gsfc.nasa.gov/products/90) | GeoTIFF; 100 ile 1600 m arası ölçeklerde | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 24 |
| Kalıcı gölge maskesi, `LPSR` | [PGDA 90](https://pgda.gsfc.nasa.gov/products/90) | GeoTIFF; 20 m dosya 154 MB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 23 |

## 4. Hesap nasıl yapılıyor

1. **Her ölçü hesaplanır ya da haritadan okunur.** Eğim ve pürüzlülük için sahanın çevresindeki küçük bir pencerenin ortalaması alınır.
2. **Her ölçü 0 ile 1 arasına çevrilir.** 1 en iyi, 0 en kötüdür. Büyüğü iyi olan ölçülerde (güneşli zaman oranı gibi) değer doğrudan kullanılır. Küçüğü iyi olan ölçülerde (eğim, en uzun karanlık gibi) bir üst sınır seçilir; değer üst sınıra oranlanır ve birden çıkarılır.
3. **Her ölçü kullanıcının seçtiği ağırlıkla çarpılır.**
4. **Çarpımlar toplanır ve ağırlıkların toplamına bölünür.** Sonuç 0 ile 100 arasında gösterilir.
5. **Eleme kuralı uygulanır.** Bir ölçü kabul edilemez sınırı aşıyorsa saha puan almaz, "elendi" olarak işaretlenir.

Ölçüler ve önerilen üst sınırlar:

| Ölçü | İyi olan | Önerilen üst sınır ya da eleme |
|---|---|---|
| Güneşli zaman oranı | Büyük | Yok |
| En uzun karanlık | Küçük | Öneri: üst sınır 336 saat (14 gün) |
| Dünya görünürlük oranı | Büyük | Yok |
| Ortalama eğim | Küçük | Öneri: eleme sınırı 12 derece |
| Pürüzlülük | Küçük | Öneri: bölgedeki en büyük değer |
| Kalıcı gölgeye uzaklık | Kullanıcı seçer | Bilim için yakın, güç için uzak iyi |

Eğim için 12 derece, Apollo iniş aracının en büyük iniş eğimi şartıdır (doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 89). Başka araçlar için farklı olabilir.

## 5. Girdi ve çıktı

### Girdi

`GET /api/site-score`: konum, `start_utc`, `end_utc`, `mast_height_m` ve ağırlıklar: `w_sunlit`, `w_dark`, `w_earth`, `w_slope`, `w_roughness`, `w_psr`. Her ağırlık 0 ile 1 arası.

### Çıktı

```json
{
  "score": 71, "eliminated": false,
  "components": [
    { "metric": "sunlit_fraction", "value": 0.57, "normalized": 0.57, "weight": 1.0, "validity": "DERIVED" },
    { "metric": "mean_slope_deg", "value": 4.2, "normalized": 0.65, "weight": 0.5, "validity": "MEASURED" }
  ],
  "validity": "DERIVED"
}
```

Örnekteki sayılar yer tutucudur.

## 6. Arayüzde nerede görünür

- Compare sekmesinde her senaryonun yanında puan ve bileşen çubukları ([karsilastirma-ve-aciklama.md](karsilastirma-ve-aciklama.md)).
- Ağırlık kaydırıcıları. Referans arayüzün harita katmanı çağrısında benzer ağırlık parametreleri zaten var: `w_energy`, `w_shadow`, `w_slope`, `w_thermal` (Kaynak: [DESIGN.md, 6.1](../../frontend-migrate/DESIGN.md)).

## 7. Bilinen sınırlar

- **Ağırlıklar keyfidir.** Puan bir karar değil, bir sıralama aracıdır; bu yüzden bileşenler her zaman görünür.
- **Eğim ve pürüzlülük haritaları yalnızca güney kutbu için var** ([veri-kaynaklari-ve-on-hesap.md](veri-kaynaklari-ve-on-hesap.md)).
- **Kaya ve küçük krater verisi yok.** Eldeki krater veritabanı yaklaşık 1 ile 2 km'den büyük kraterleri içeriyor (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 44, kısmen doğru); iniş güvenliği için yeterli değil.
- **Puan iniş güvenliğini garanti etmez.**

## 8. Varsayımlar ve açık kararlar

- Varsayım: Üst sınırlar ve eleme sınırları ekibin önerisidir; yalnızca eğim sınırının bir dayanağı var.
- ADR-0004'e eklenmeli: `/api/site-score` uç noktası ve yanıt yapısı.
- Açık karar: Puan, ağırlıklı toplam olarak mı (bu doküman) yoksa Chandrayaan-3 notunun önerdiği gibi "inilebilir güvenli kare sayısı" üzerinden mi kurulacak. İkincisi iniş güvenliğine daha yakın bir ölçü, ama bütün alan için eğim ve gölge hesabı ister ve notun kendisi doğrulanmadı.
- Açık karar: Puan ilk sürüme girecek mi. Çekirdek ölçüler hazır olduktan sonra yalnızca aydınlanma ve iletişim bileşenleriyle başlatılabilir; eğim ve pürüzlülük sonra eklenir.

## 9. Kaynaklar

- [PGDA 90](https://pgda.gsfc.nasa.gov/products/90)
- [csa-moon-exploration.md](../research/csa-moon-exploration.md), bölüm 8.2
