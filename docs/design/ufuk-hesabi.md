# Ufuk hesabı

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Zorunlu
- **Karar taslakları:** [ADR-0002](../adr/0002-koordinat-sistemi-ve-zaman.md), [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [lunar-horizon](../research/lunar-horizon/README.md), [zamanda-degisen-veri-hazirlama.md](../research/zamanda-degisen-veri-hazirlama.md) (bölüm 5)
- **Doğrulama:** [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md)

## 1. Ne yapıyoruz

Bir noktadan bakıldığında ufkun her yönde ne kadar yüksekte olduğunu hesaplıyoruz. Sonuç 720 sayılık bir listedir: her yarım derecelik yön için arazinin o yöndeki ufuk açısı. Güneş ya da Dünya bu açının üstündeyse görünür.

İki durum var:

- **Düz ufuk:** Arazi yoksa ufku yalnızca Ay'ın eğriliği belirler.
- **Arazi ufku:** Dağlar ve krater kenarları ufku yükseltir. Güney kutbunda belirleyici olan budur.

## 2. Neden

Challenge "ufka göre konum" istiyor ve Ay'da hava olmadığı için ufku yerel arazinin ve Ay küresinin kenarının belirlediğini açıkça yazıyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md); doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-1). Kutupta Güneş hep ufka yakın olduğu için küçük bir ufuk farkı sonucu çok değiştirir: ufku 1 derece oynatmak panel enerjisini yüzde 11 ile 16 arası değiştiriyor (doğrulama: [dogrulama/gunes-paneli.md](../research/dogrulama/gunes-paneli.md), No 12).

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Güney kutbu yükseklik haritaları (PGDA 90) | [PGDA 90](https://pgda.gsfc.nasa.gov/products/90) | İnternetten parça parça okunabilen GeoTIFF; dosya başına 2,7 ile 5,1 GB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 17, 18 ve 21 |
| Standart LOLA kutup haritaları | [LOLA kutup yükseklik haritaları](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/) | İkili görüntü; dosya başına yaklaşık 1,8 GB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 30 |
| Belirli sahalar için 5 m haritalar (PGDA 78) | [PGDA 78](https://pgda.gsfc.nasa.gov/products/78) | GeoTIFF | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 29, kısmen doğru: saha listesi güncel sayfadan alınmalı |

PGDA 90 kapsamı: 10 m çözünürlüklü dosya yalnızca 83 derece güneyden kutba kadar, 20 m çözünürlüklü dosya 80 derece güneyden kutba kadar olan bölgeyi içerir (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 18). Haritalar ME koordinat sistemindedir ve yükseklikler 1737,4 km küreye göredir (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 17 ve 19).

Dosyaları indirmeden küçük bir pencere okunabiliyor; deneme birkaç saniye sürdü (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 27, kısmen doğru: yöntem çalışıyor, belgedeki sayılar aynen tekrar edilemedi).

## 4. Hesap nasıl yapılıyor

### Düz ufuk

Gözlem noktası yerden ne kadar yüksekse ufuk o kadar uzaktadır ve yataydan o kadar aşağıdadır. Ay küçük olduğu için ufuk Dünya'dakinin yaklaşık yarısı kadar yakındır (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-9).

| Gözlem yüksekliği | Ufuk uzaklığı | Ufkun yataydan alçalması |
|---|---|---|
| 1 m | 1,86 km | 0,061 derece |
| 2 m | 2,64 km | 0,087 derece |
| 5 m | 4,17 km | 0,137 derece |
| 10 m | 5,89 km | 0,194 derece |

(doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-6 ve A-7; [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 47)

Düz ufukta 720 değerin hepsi aynıdır: alçalma açısının eksi işaretlisi.

### Arazi ufku

1. **Gözlem noktası belirlenir.** Sahanın zemin yüksekliği haritadan okunur, üzerine `mast_height_m` eklenir.
2. **720 yöne ışın gönderilir.** Yarım derece aralık, iki ana çalışmanın kullandığı değerdir; gerekçesi Güneş'in kendi çapı kadar yolu yaklaşık bir saatte almasıdır (Kaynak: [De Rosa ve arkadaşları, 2012](https://arxiv.org/abs/1208.5587); doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-15 ve A-36).
3. **Her ışın boyunca arazi örneklenir.** Yakında sık, uzakta seyrek: ilk 3 km'de 20 m'de bir, 75 km'den sonra 2 km'de bir, arada adım düzgün büyür (Kaynak: [De Rosa ve arkadaşları, 2012](https://arxiv.org/abs/1208.5587); doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-16).
4. **Her örnek için görüş açısı hesaplanır.** Arazi noktasının gözlem noktasına göre yüksekliği alınır, ondan Ay'ın eğriliği yüzünden o mesafede oluşan düşüş çıkarılır, kalan değer mesafeye oranlanır. Eğrilik düşüşü 100 km'de yaklaşık 2,9 km'dir; hesaba katılmazsa uzak dağlar olduğundan yüksek görünür (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-10 ve A-12; [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 46).
5. **O yöndeki en büyük açı ufuk açısı olur.**
6. **En fazla 150 km'ye bakılır.** Bu mesafeden sonra en yüksek arazi bile en alçak Güneş'in altında kalır (Kaynak: [De Rosa ve arkadaşları, 2012](https://arxiv.org/abs/1208.5587); doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-16 ve A-20).
7. **Profil bir kez hesaplanır ve saklanır.** En pahalı adım haritadan veri okumaktır (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-18).

Güneş'in ya da Dünya'nın bulunduğu yön iki örnek yön arasına düşerse ufuk açısı iki komşu değerin arasından doğrusal olarak alınır (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-19). 359,5 derece ile 0 derece komşudur.

Öneri: Yakın mesafede en ince haritadan, uzak mesafede kaba haritadan okunur. Bir NASA çalışması 5 km'ye kadar 5 m, 100 km'ye kadar 80 m, ötesinde 240 m çözünürlük kullanıyor (Kaynak: [Barker ve arkadaşları, 2021](https://ntrs.nasa.gov/citations/20205009660); doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-17). Bizde 5 m harita Mons Mouton için doğrulanmadı; ilk sürümde yakın alan için 10 ya da 20 m, uzak alan için 240 m kullanılır.

### Güneş'i disk olarak ele almak

Güneş Ay'dan yaklaşık yarım derece çapında bir disk olarak görünür (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-21). Ufuk diskin ortasından geçiyorsa Güneş'in yarısı görünür.

1. Güneş'in merkezinin ufuktan yüksekliği bulunur: yükseklik açısından o yöndeki ufuk açısı çıkarılır.
2. Bu fark diskin yarıçapına oranlanır.
3. Oran eksi birden küçükse disk tamamen ufkun altındadır, artı birden büyükse tamamı görünür, arada ise görünen kısım diskin ufuk çizgisiyle kesilen parçasıdır (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-22; [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 55).

ESA için yapılan çalışma diskin yalnızca dikey oranını alıyor ve gerçek orandan farkının önemsiz olduğunu söylüyor (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-24). Güneş'i nokta saymak, diskin yüzde 50 eşiğini kullanmakla aynı sonucu verir (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-25).

## 5. Girdi ve çıktı

### Girdi

Uç nokta `GET /api/horizon` ([ADR-0004](../adr/0004-api-uc-noktalari.md)). Parametreler: konum ve `mast_height_m`.

### Çıktı

`HorizonProfile` yapısı ([ADR-0003](../adr/0003-veri-sozlesmesi.md)). Kısaltılmış örnek:

```json
{
  "site_id": "mons-mouton-im2-target", "lat_deg": -84.78, "lon_deg": 29.13,
  "mast_height_m": 2.0, "azimuth_step_deg": 0.5,
  "horizon_deg": [-0.09, -0.09, "... toplam 720 değer"],
  "method": "sphere", "max_range_km": null, "dem": null, "validity": "SYNTHETIC"
}
```

Arazi ufku hesaplandığında `method` değeri `terrain`, `validity` değeri `DERIVED` olur ve `dem` alanı kullanılan haritayı gösterir.

## 6. Arayüzde nerede görünür

- Ufuk profili, panorama şeridindeki siluet çizgisidir; Güneş'in ve Dünya'nın yolu onun üzerine çizilir ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Düz ufukla hesaplanan sonuçlar arayüzde "arazi hesaba katılmadı" etiketiyle gösterilir ([ADR-0004](../adr/0004-api-uc-noktalari.md), "Veri yoksa davranış").

## 7. Bilinen sınırlar

- **Harita hatası sonucu iyimser gösterir.** Haritadaki tek bir yukarı yönlü hata ufku yükseltmeye yeter; aşağı yönlü hataların etkisi ise sınırlıdır. Kaynak, gerçek aydınlanmanın hesaplanandan biraz kötü olabileceğini söylüyor (Kaynak: [Barker ve arkadaşları, 2021](https://ntrs.nasa.gov/citations/20205009660); doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-44).
- **Kapsam güney kutbuyla sınırlı.** PGDA 90 yalnızca 60 derece güneyden kutba kadar olan bölgeyi içerir (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 18). Apollo sahaları gibi orta enlemlerde arazi ufku için başka bir harita gerekir; ilk sürümde o sahalarda düz ufuk kullanılır.
- **Gözlem yüksekliği sonucu çok değiştirir.** Bir sahada ortalama aydınlanmanın en kötü yüzde biri, 1 m'de yüzde 67 ile 71, 5 m'de yüzde 83 ile 89 (Kaynak: [Barker ve arkadaşları, 2021](https://ntrs.nasa.gov/citations/20205009660); doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-39). Başka bir sırtta güneşli zaman oranı 2 m'de yüzde 92,3, 10 m'de yüzde 95,7 (Kaynak: [Gläser ve arkadaşları, 2014](https://elib.dlr.de/94240/); doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-40). Bu yüzden `mast_height_m` her zaman girdidir.
- **Yansıyan ışık yok.** Yöntem yalnızca doğrudan görüşü hesaplar.
- **Yükseklik bir platoda ise ufuk eksi olabilir.** Mons Mouton için yaklaşık 50 km ötedeki plato kenarının ufku tahminen 1 derece alçalttığı hesaplandı (doğrulama: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 86).

## 8. Varsayımlar ve açık kararlar

- Varsayım: Bir saha için arazi ufku hesabının ne kadar süreceği ölçülmedi. Ekibin "saha başına 0,03 saniye" değeri yalnızca hazır profille karşılaştırma adımı içindir ve tekrar edilmedi (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 51, doğrulanamadı). İlk iş küçük bir bölgede süre ölçmektir.
- Varsayım: Bir saha için yaklaşık 440 adım ve 320 bin harita okuması gerekeceği bir hesap tahminidir (doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 50); gerçek sayı kullanılan haritaya bağlıdır.
- Öneri: Hazır sahalar için profiller 2 m ve 10 m yükseklik için önceden hesaplanır ve `data/horizons/` altına konur ([ADR-0003](../adr/0003-veri-sozlesmesi.md)).
- Karar (14 Kasım 2026): Özel koordinatlarda ilk sürüm yalnızca düz ufuk verir ve "arazi hesaba katılmadı" etiketi gösterir ([ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md), madde 5). Arazi ufkunun o anda hesaplanması süre ölçümünden sonra eklenebilir.

## 9. Kaynaklar

- [De Rosa ve arkadaşları, 2012](https://arxiv.org/abs/1208.5587): ESA için yapılan aydınlanma çalışması
- [Barker ve arkadaşları, 2021](https://ntrs.nasa.gov/citations/20205009660): NASA'nın güney kutbu aydınlanma çalışması
- [Gläser ve arkadaşları, 2014](https://elib.dlr.de/94240/)
- [PGDA 90](https://pgda.gsfc.nasa.gov/products/90), [PGDA 78](https://pgda.gsfc.nasa.gov/products/78), [LOLA kutup yükseklik haritaları](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/)
- [lunar-horizon](../research/lunar-horizon/README.md)
