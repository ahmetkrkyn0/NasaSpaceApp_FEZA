# Olaylar ve süreler

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Zorunlu
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [zamanda-degisen-veri-hazirlama.md](../research/zamanda-degisen-veri-hazirlama.md) (bölüm 6 ve 10), [explainability-mission-differences](../research/explainability-mission-differences/README.md)
- **Doğrulama:** [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md)

## 1. Ne yapıyoruz

Bir saha ve tarih aralığı için şunları buluyoruz:

- Gün doğumu ve gün batımı anları.
- Dünya'nın doğuş ve batış anları.
- Bunlardan çıkan pencereler: güneşli, karanlık, Dünya görünür, Dünya görünmez.
- Özet ölçüler: güneşli zaman oranı, en uzun karanlık, Dünya'nın görünür olduğu zaman oranı.
- Seçilen an için kalan süreler: gün batımına, bir sonraki gün doğumuna, Dünya batışına, Dünya doğuşuna.

Her olay anı tek bir saat olarak değil, hata payıyla birlikte verilir.

## 2. Neden

Challenge gün batımına ve Dünya batışına kalan sürenin gösterilmesini ve güneşli sürenin öne çıkarılmasını istiyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)). Bir Ay günü yaklaşık 29,5 Dünya günü sürer; ekvatorda kesintisiz gece yaklaşık 14,8 gündür (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No S1). Kutupta bu düzen araziye göre değişir, bu yüzden hesaplanması gerekir.

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Güneş ve Dünya'nın zaman içindeki konumu | [gunes-dunya-konumu.md](gunes-dunya-konumu.md) | `SkySeries` | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |
| Ufuk profili | [ufuk-hesabi.md](ufuk-hesabi.md) | `HorizonProfile`, 720 değer | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |

Yeni bir dış veri gerekmez.

## 4. Hesap nasıl yapılıyor

1. **Her örnek için "ufkun ne kadar üstünde" değeri bulunur.** Cismin yükseklik açısından, bulunduğu yöndeki ufuk açısı çıkarılır.
2. **Görünen oran hesaplanır.** Güneş bir disk olduğu için doğuş ve batış anlık değildir ([ufuk-hesabi.md](ufuk-hesabi.md), "Güneş'i disk olarak ele almak").
3. **İşaret değiştiren ardışık örnekler bulunur.** Değer eksiden artıya geçiyorsa doğuş, artıdan eksiye geçiyorsa batış vardır.
4. **Olay anı o iki örnek arasında aranır.** Aralık ikiye bölünerek daraltılır; her adımda konum ara an için yeniden hesaplanır. Bir dakikadan dar aralıkta durulur.
5. **Pencereler çıkarılır.** Ardışık doğuş ve batış arasındaki süre bir penceredir.
6. **Özet ölçüler hesaplanır.** Pencerelerin toplam süresi aralığın süresine oranlanır; en uzun karanlık ve en uzun "Dünya görünmez" penceresi ayrıca verilir.
7. **Seçilen an için kalan süreler bulunur.** O andan sonraki ilk olay aranır.

Neden yalnızca örneklere bakmak yetmez: iki saatlik örneklerle bakıldığında 2 saat 27 dakika süren bir olay tek bir örnekte yakalanabildi (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 70). Kısa olaylar örnekler arasında kaybolabilir.

### Hata payı

Kutupta Güneş ve Dünya ufka çok sığ bir açıyla yaklaşır. Bu yüzden ufuktaki küçük bir hata olay anını çok kaydırır.

| Durum | Ufukta bir yay dakikalık hatanın karşılığı | Kaynak |
|---|---|---|
| Ekvator, Güneş | Yaklaşık 2 dakika | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 10 |
| Mons Mouton, Güneş, en iyi durum | Yaklaşık 22 dakika | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 10 |
| Athena iniş anı, Güneş | Yaklaşık 24 dakika | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 9 |
| Athena iniş anı, Dünya | Yaklaşık 72 dakika | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 9 |

Bir yay dakikası, derecenin altmışta biridir. Değişim hızı kutupta ekvatordakinin yaklaşık yüzde biri düzeyine iner (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 66). Cisim günün en yüksek noktasına yakınken ufku kesiyorsa hız sıfıra yaklaşır ve kayma daha da büyür.

Bu yüzden her olaya sabit bir hata payı eklenmez. Öneri: Her olay iki kez daha hesaplanır; bir kez ufuk biraz alçaltılarak, bir kez biraz yükseltilerek. Çıkan iki an `utc_earliest` ve `utc_latest` alanlarına yazılır. Ufkun ne kadar oynatılacağı açık karardır (8. bölüm).

Bilinen diğer hata kaynakları ve büyüklükleri (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 100 ve S12):

| Hata kaynağı | Ekvatorda kayma | Kutupta kayma |
|---|---|---|
| Haritada 1 km ötede 1 m yükseklik hatası | Yaklaşık 7 dakika | 2 ile 10 saat arası |
| Güneş'i disk yerine nokta saymak | Yaklaşık yarım saat | Yaklaşık 9 saat |

## 5. Girdi ve çıktı

### Girdi

- `GET /api/events`: konum, `mast_height_m`, `start_utc`, `end_utc`, `earth_criterion`.
- `GET /api/now`: konum, `mast_height_m`, `utc`, `earth_criterion`.

### Çıktı

`EventList` ve `NowStatus` ([ADR-0003](../adr/0003-veri-sozlesmesi.md)). Örnek değerler Mons Mouton test sahasının Aralık 2026 için düz ufukla hesaplanan Dünya olaylarıdır (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 42):

```json
{
  "events": [
    { "type": "earthset",  "utc": "2026-12-03T10:03:00Z", "utc_earliest": null, "utc_latest": null, "criterion": "center" },
    { "type": "earthrise", "utc": "2026-12-11T04:41:00Z", "utc_earliest": null, "utc_latest": null, "criterion": "center" }
  ],
  "windows": [
    { "kind": "earth_hidden", "start_utc": "2026-12-03T10:03:00Z", "end_utc": "2026-12-11T04:41:00Z", "duration_hours": 186.6 }
  ],
  "metrics": { "sunlit_fraction": null, "longest_dark_hours": null, "max_sun_elevation_deg": 6.47, "earth_visible_fraction": null, "longest_earth_hidden_hours": 186.6 },
  "validity": "SYNTHETIC"
}
```

`duration_hours` değeri iki olay anından hesaplandı (hesap). `max_sun_elevation_deg` değeri aynı saha ve ay içindir (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 2). `null` alanlar bu örnekte doldurulmadı.

## 6. Arayüzde nerede görünür

- Zaman çizelgesindeki bantlar pencerelerden çizilir; "gün batımına kalan süre" göstergesi `NowStatus` yapısından okunur ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Referans arayüzün iletişim penceresi yanıtı aynı deseni kullanıyor: kalan dakika, bir sonraki değişim anı ve aramanın sınırlı kaldığını söyleyen bir alan (Kaynak: [örnek yanıtlar](../../frontend-migrate/design-export/api-contract/fixtures/), `comm-window.available.json`).
- Hata payı, olay anının yanında saat aralığı olarak yazılır ([karsilastirma-ve-aciklama.md](karsilastirma-ve-aciklama.md)).

## 7. Bilinen sınırlar

- **Sonuç ufuk profilinin kalitesine bağlıdır.** Düz ufukla bulunan olaylar `SYNTHETIC` etiketini taşır.
- **Arazisiz hesap kutupta yanıltıcıdır.** Arazisiz bir Ay'da 89,5 derece güneyde Güneş'in merkezi yaklaşık 144 gün ufkun altında kalır; diskin hiçbir parçasının görünmediği süre 138 gündür (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 67 ve S5). Gerçek sırtlardaki belirli noktalarda ise zeminden 2 m yükseklikte zamanın yüzde 92'si güneşlidir (Kaynak: [Gläser ve arkadaşları, 2014](https://elib.dlr.de/94240/); doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 57).
- **Uzun aramalar sınırlanır.** Aranan süre içinde olay bulunamazsa değer `null` döner ve `search_limited` alanı `true` olur ([ADR-0003](../adr/0003-veri-sozlesmesi.md)).
- **Tutulmalar bu dokümanda yok.** Dünya'nın Güneş'i örttüğü olaylar [tutulmalar.md](tutulmalar.md) içinde.

## 8. Varsayımlar ve açık kararlar

- Açık karar: "Gün doğumu" Güneş'in ilk kenarı göründüğünde mi, merkezi göründüğünde mi sayılacak. Öneri: Güneş için ilk kenar (`first_limb`), çünkü güç üretimi diskin bir kısmı görününce başlar. Horizons da Güneş için üst kenarı ölçüt alıyor (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 31).
- Açık karar: Dünya için ölçüt [iletisim-penceresi.md](iletisim-penceresi.md) içinde.
- Açık karar: Hata payı hesabında ufkun ne kadar oynatılacağı. Öneri: Arazi ufku için haritanın çözünürlüğüne ve mesafeye göre; düz ufukta hata payı verilmez.
- Varsayım: Bir dakikalık arama duyarlılığı ekibin tercihidir; bir kaynağa dayanmıyor.

## 9. Kaynaklar

- [zamanda-degisen-veri-hazirlama.md](../research/zamanda-degisen-veri-hazirlama.md), bölüm 6 ve 10
- Açıklanabilirlik raporu, bölüm 7 (hata payı): [explainability-mission-differences](../research/explainability-mission-differences/README.md)
- [Gläser ve arkadaşları, 2014](https://elib.dlr.de/94240/)
