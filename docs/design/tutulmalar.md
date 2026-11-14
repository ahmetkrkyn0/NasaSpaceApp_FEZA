# Tutulmalar

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Ekstra özellik
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [zamanda-degisen-veri-hazirlama.md](../research/zamanda-degisen-veri-hazirlama.md) (bölüm 6.4)
- **Doğrulama:** [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md)

## 1. Ne yapıyoruz

Ay yüzeyinden bakıldığında Dünya'nın Güneş'in önüne geçtiği anları buluyoruz. Bu sırada saha Güneş'i ufkun üstünde görse bile ışık azalır ya da tamamen kesilir. Dünya'dan bakınca aynı olay Ay tutulması olarak görünür.

## 2. Neden

Tutulma, güneşli sayılan bir pencerenin ortasında saatlerce süren bir güç kesintisidir. Güç değerlendirmesi ([guc-degerlendirmesi.md](guc-degerlendirmesi.md)) bunu hesaba katmazsa enerjiyi fazla gösterir. Challenge güç potansiyelinin değerlendirilmesini istiyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)).

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Güneş'in ve Dünya'nın yönü ve görünen yarıçapı | [gunes-dunya-konumu.md](gunes-dunya-konumu.md) | `SkySeries` | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |

Dünya'nın diski Güneş'inkinden çok büyüktür: Güneş'in yarıçapı yaklaşık 0,26 ile 0,27 derece, Dünya'nın yarıçapı yaklaşık 0,90 ile 1,02 derece (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 4 ve 5). Bu yüzden Dünya Güneş'i tamamen örtebilir.

## 4. Hesap nasıl yapılıyor

1. **İki diskin merkezleri arasındaki açı bulunur.** Güneş'in ve Dünya'nın sahadan görünen yönleri arasındaki açıdır.
2. **Açı iki yarıçapın toplamıyla karşılaştırılır.** Toplamdan büyükse diskler ayrıdır; örtülme yoktur.
3. **Açı küçükse örtülen kısım hesaplanır.** İki dairenin kesişen alanı Güneş diskinin alanına oranlanır. Açı, Dünya'nın yarıçapından Güneş'in yarıçapı çıkarılınca kalan değerden küçükse Güneş tamamen örtülmüştür (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 69).
4. **Başlangıç ve bitiş anı aranarak bulunur.** Örtülen oranın sıfırdan büyük olduğu ilk ve son an, örnekler arasında aralık daraltılarak bulunur ([olaylar-ve-sureler.md](olaylar-ve-sureler.md) ile aynı yöntem).
5. **Güce etkisi uygulanır.** O andaki güç, örtülmeyen oranla çarpılır.

Neden arama gerekir: iki saatlik örneklerle bakıldığında 2 saat 27 dakika süren olay yalnızca tek bir örnekte görünüyor (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 70).

### Test olayları

| Saha | Tarih | Beklenen | Kaynak |
|---|---|---|---|
| Apollo 11 | 20 ve 21 Şubat 2027 | 22:09 ile 00:36 UTC arası; en fazla yüzde 34,3 örtülme | [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 70 |
| Apollo 11 | 18 Temmuz 2027 | Örtülme yok; iki disk arasındaki en küçük açı 1,408 derece | [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 71 |
| Apollo 11 | 17 Ağustos 2027 | Örtülme yok; olay derecenin binde beşi kadar farkla gerçekleşmiyor | [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 72 |

Üçüncü satır iyi bir sınır testidir: hesap bu olayı "var" derse hata vardır.

## 5. Girdi ve çıktı

### Girdi

`GET /api/eclipses`: konum, `start_utc`, `end_utc`. Tutulmalar ayrıca `/api/events` yanıtına da eklenir ([ADR-0004](../adr/0004-api-uc-noktalari.md)).

### Çıktı

`EventList` içinde iki olay tipi: `eclipse_start` ve `eclipse_end` ([ADR-0003](../adr/0003-veri-sozlesmesi.md)). Ek bir alan gerekir: en büyük örtülme oranı.

```json
{
  "events": [
    { "type": "eclipse_start", "utc": "2027-02-20T22:09:00Z", "utc_earliest": null, "utc_latest": null, "criterion": "first_limb", "max_obscured_fraction": 0.343 },
    { "type": "eclipse_end",   "utc": "2027-02-21T00:36:00Z", "utc_earliest": null, "utc_latest": null, "criterion": "first_limb", "max_obscured_fraction": 0.343 }
  ]
}
```

## 6. Arayüzde nerede görünür

- Zaman çizelgesinde güneşli bandın üzerinde ayrı bir işaret ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Güç eğrisinde tutulma sırasındaki düşüş.
- İşaretin açıklaması: "Earth passes in front of the Sun. Seen from Earth, this is a lunar eclipse."

## 7. Bilinen sınırlar

- **Dünya'nın atmosferi hesaba katılmaz.** Dünya keskin kenarlı bir disk sayılır; atmosferin ışığı kırması yok sayılır.
- **Güneş diskinin kenara doğru sönükleşmesi hesaba katılmaz.** Örtülen oran alan oranıdır, parlaklık oranı değil.
- **Olay nadirdir.** Demo için seçilen aralıkta tutulma olmayabilir.

## 8. Varsayımlar ve açık kararlar

- Varsayım: Olayın yılda sıfır ile üç kez gerçekleştiği bilgisi araştırma notunda kaynaksız (aynı doğrulama dosyasında No 11). Sıklık arayüzde belirtilmez.
- ADR-0003'e eklenmeli: tutulma olaylarında `max_obscured_fraction` alanı.
- Öneri: İlk sürümde tutulma yalnızca hazır sahalar için ve yalnızca istenirse hesaplanır.

## 9. Kaynaklar

- [zamanda-degisen-veri-hazirlama.md](../research/zamanda-degisen-veri-hazirlama.md), bölüm 6.4
- [gunes-dunya-konumu.md](gunes-dunya-konumu.md)
