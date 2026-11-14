# İletişim penceresi

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Zorunlu (yer istasyonları bölümü Destekleyici)
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [ephemeris-rotation-ground-stations](../research/ephemeris-rotation-ground-stations/README.md), [lunar-horizon](../research/lunar-horizon/README.md) (bölüm 6), [zamanda-degisen-veri-hazirlama.md](../research/zamanda-degisen-veri-hazirlama.md) (bölüm 9)
- **Doğrulama:** [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md)

## 1. Ne yapıyoruz

Bir sahadan Dünya'nın ne zaman görünür olduğunu buluyoruz. Dünya görünüyorsa araç röle uydusu olmadan Dünya ile konuşabilir; buna doğrudan iletişim deniyor.

İki katman var:

1. **Dünya sahadan görünüyor mu.** Zorunlu kısım.
2. **O anda bir yer istasyonu Ay'ı görüyor mu.** Destekleyici kısım; günde dakikalar düzeyinde etki eder.

## 2. Neden

Challenge'ın iki ana sorusundan biri doğrudan iletişim pencereleridir (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)). Güney kutbunda Dünya ufka yakın durur ve ayda bir ufkun altına inip çıkar; pencereler bu yüzden açılıp kapanır.

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Dünya'nın zaman içindeki konumu ve görünen boyutu | [gunes-dunya-konumu.md](gunes-dunya-konumu.md) | `SkySeries` | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |
| Ufuk profili | [ufuk-hesabi.md](ufuk-hesabi.md) | `HorizonProfile` | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |
| Hazır Dünya görünürlüğü haritaları, karşılaştırma için | [PGDA 69](https://pgda.gsfc.nasa.gov/products/69) | Güney kutbu için 60, 120 ve 240 m çözünürlükte; 18,6 yıllık ortalama | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 34 |
| Yer istasyonlarının konumları (yalnızca ikinci katman) | NASA ve ESA belgeleri | Enlem ve boylam | [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 60 ve 62 |

## 4. Hesap nasıl yapılıyor

### Birinci katman: Dünya'nın görünürlüğü

1. Dünya'nın yükseklik açısından, bulunduğu yöndeki ufuk açısı çıkarılır ([olaylar-ve-sureler.md](olaylar-ve-sureler.md) ile aynı yöntem).
2. Dünya Ay'dan yaklaşık 2 derece çapında bir disk olarak görünür (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-27; [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 5). Diskin ne kadarının ufkun üstünde olduğu hesaplanır.
3. Seçilen ölçüte göre "görünür" ya da "görünmez" kararı verilir.
4. Doğuş ve batış anları aranarak bulunur; pencereler ve kalan süreler çıkarılır.

### "Dünya görünüyor" ölçütü

Üç seçenek var: Dünya'nın merkezi ufkun üstünde (`center`), herhangi bir kenarı üstünde (`first_limb`), tamamı üstünde (`full_disk`).

Seçim sonucu çok değiştirir. Test sahasında Dünya ufka yakınken çok yavaş hareket ettiği için merkez ile kenar ölçütü arasında yaklaşık 19 saat, ilk kenar ile tam disk arasında yaklaşık 38 saat fark oluşuyor (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 53).

Başkaları ne kullanıyor:

- NASA'nın hazır Dünya görünürlüğü haritaları, diskin herhangi bir parçası engellenmemişse Dünya'yı görünür sayıyor ve bunun gerçek bağlantı için biraz iyimser olduğunu not ediyor (Kaynak: [PGDA 69](https://pgda.gsfc.nasa.gov/products/69); doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 34).
- Horizons, Dünya için üst kenarın ufkun üstünde olmasını işaretliyor (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 31 ve 32).

Öneri: Varsayılan ölçüt `center`. Gerekçe: iyimser ile kötümser seçeneğin ortasıdır ve doğrulanmış test değerlerimiz bu ölçütle hesaplanmıştır (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 42). Arayüzde ölçüt değiştirilebilir ve sonucun ne kadar oynadığı gösterilir.

### Kutupta beklenen davranış

- Güney kutbunda Dünya'nın merkezi her ay yükseklikte yaklaşık artı eksi 6,5 derece, yönde yaklaşık artı eksi 8 derece salınır; görünürlük pencereleri yaklaşık 14 gün sürer (Kaynak: [De Rosa ve arkadaşları, 2012](https://arxiv.org/abs/1208.5587); doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-28 ve A-29).
- Test sahasında (Mons Mouton, Aralık 2026, düz ufuk) Dünya'nın yüksekliği eksi 2,1 ile artı 10,65 derece arasında (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 40).
- Aynı ay içinde Dünya'nın merkezi sürenin yüzde 27,7'sinde ufkun altında (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 43, kısmen doğru: 3 ile 11 Aralık arası tek başına yüzde 25,9).
- Arazi bu oranı çok değiştirir. Ufuk her yönde 1 derece yüksek olsaydı oran yüzde 36'ya çıkar, 2 derece alçak olsaydı yüzde 6'ya inerdi (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 44).

### İkinci katman: yer istasyonları

Dünya'nın sahadan görünmesi yetmez; o anda Dünya'daki bir antenin de Ay'ı görmesi gerekir.

1. Her istasyon için Ay'ın o istasyondan görünen yükseklik açısı hesaplanır.
2. Açı istasyonun en düşük bakış açısından büyükse istasyon Ay'ı görüyor sayılır. NASA'nın derin uzay ağında alım için bu sınır yaklaşık 6 derece, gönderim için en az 10,1 derecedir (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 61).
3. En az bir istasyon görüyorsa ikinci katman açıktır.

NASA'nın üç istasyonu (Goldstone, Canberra, Madrid) Ay'ı her an göremiyor. Ay güneyde en alçak konumundayken 6 derecelik sınırla günde 26 dakikaya varan boşluk oluşuyor; Aralık 2026 için değer yaklaşık 16 dakika. ESA'nın iki istasyonu (Malargüe ve New Norcia) eklenince boşluk kapanıyor (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 60, 62 ve 68). Bu boşluk 2028'den sonra kayboluyor (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 55).

Öneri: İkinci katman ilk sürümde yalnızca bilgi satırı olarak gösterilir; pencere hesabına katılmaz.

## 5. Girdi ve çıktı

### Girdi

`GET /api/comm-window`: konum, `mast_height_m`, `utc`, `earth_criterion` ([ADR-0004](../adr/0004-api-uc-noktalari.md)).

### Çıktı

`CommWindow` ([ADR-0003](../adr/0003-veri-sozlesmesi.md)). Referans arayüzün aynı adlı yanıtındaki alanlar korunur; ızgara satır ve sütunu yerine enlem ve boylam gelir (Kaynak: [örnek yanıtlar](../../frontend-migrate/design-export/api-contract/fixtures/), `comm-window.available.json`).

```json
{
  "utc": "2026-12-05T00:00:00Z", "lat_deg": -84.78, "lon_deg": 29.13,
  "visible_now": false,
  "minutes_remaining": null, "minutes_until_visible": 8921,
  "next_change_utc": "2026-12-11T04:41:00Z",
  "search_limited": false, "searched_hours": 336.0,
  "earth_elevation_deg": null, "earth_azimuth_true_deg": null, "horizon_deg": -0.09,
  "criterion": "center", "relay_required": false, "validity": "SYNTHETIC"
}
```

`minutes_until_visible` iki andan hesaplandı (hesap). `relay_required` alanı [role-etiketi.md](role-etiketi.md) içinde tanımlı.

## 6. Arayüzde nerede görünür

- Referans arayüzde Dünya görünürlüğü ayrı bir panel olarak var (Kaynak: [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `earth-visibility`). Bu projede ana ekrana taşınır ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Zaman çizelgesinde "Earth visible" bandı ve "Time to Earthset" göstergesi.
- Tek yönde sinyal gecikmesi 1,2 ile 1,4 saniye arasındadır; bilgi satırı olarak gösterilebilir (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 43).

## 7. Bilinen sınırlar

- **Yalnızca görüş hattı.** Anten gücü, veri hızı ve aracın anten yönü hesaba katılmaz.
- **Yer istasyonu modeli basit.** Her istasyon için tek bir sabit bakış açısı sınırı kullanılır; istasyonun çevresindeki gerçek arazi hesaba katılmaz (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 68, Not sütunu).
- **Hata payı büyük.** Athena iniş anında ufuktaki bir yay dakikalık hata Dünya için yaklaşık 72 dakika kayma demek ([olaylar-ve-sureler.md](olaylar-ve-sureler.md)).
- **Hazır haritayla karşılaştırma yaklaşıktır.** NASA haritası 18,6 yıllık ortalamadır ve "herhangi bir parça" ölçütünü kullanır (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 34); bir aylık sonucumuzla birebir tutması beklenmez.

## 8. Varsayımlar ve açık kararlar

- Açık karar: Varsayılan `earth_criterion` değeri. Öneri yukarıda (`center`).
- Açık karar: Yer istasyonu katmanında alım sınırı mı gönderim sınırı mı kullanılacak. Öneri: alım (6 derece), çünkü daha yaygın durum veri indirmedir.
- Varsayım: ESA istasyonlarının en düşük bakış açısı için sayı içeren kaynak açılamadı (aynı doğrulama dosyasında No 64 doğrulanamadı). ESA istasyonları için 10 derece kullanılması ekibin tercihidir; bir ESA planlama makalesi 10 dereceyi olay eşiği olarak kullanıyor (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 65).

## 9. Kaynaklar

- [PGDA 69](https://pgda.gsfc.nasa.gov/products/69)
- [De Rosa ve arkadaşları, 2012](https://arxiv.org/abs/1208.5587)
- [hesap arşivi](../research/ephemeris-rotation-ground-stations/lunar-navigator-hesaplar.zip): `scripts/dsn_coverage.py`, `scripts/dsn_handover.py`
- [ephemeris-rotation-ground-stations](../research/ephemeris-rotation-ground-stations/README.md)
