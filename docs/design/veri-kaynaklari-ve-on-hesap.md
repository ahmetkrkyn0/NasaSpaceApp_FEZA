# Veri kaynakları ve ön hesap

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Destekleyici
- **Karar taslakları:** [ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md), [ADR-0003](../adr/0003-veri-sozlesmesi.md)
- **Dayandığı araştırma:** [data-sources](../research/data-sources/README.md), [zamanda-degisen-veri-hazirlama.md](../research/zamanda-degisen-veri-hazirlama.md) (bölüm 11)
- **Doğrulama:** [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md)

## 1. Ne yapıyoruz

Ürünün kullandığı dış verinin nereden alındığını, hangisinin depoya girdiğini ve hangi hesabın önceden yapıldığını tanımlıyoruz.

## 2. Neden

Yükseklik haritaları birkaç gigabayt tutuyor ve depoya konamaz (`AGENTS.md`, kural 6). Arazi ufku hesabı pahalı; her kullanıcı isteğinde yeniden yapmak arayüzü yavaşlatır. Challenge da efemeris için önceden hesaplanmış veri kullanılabileceğini söylüyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)).

## 3. Hangi veriyi kullanıyoruz

### Zorunlu kısım için

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| SPICE dosyaları (5 dosya) | [NAIF veri dosyaları](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) | Toplam yaklaşık 46 MB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 13; [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 29 |
| Güney kutbu yükseklik haritaları, `LDEM` | [PGDA 90](https://pgda.gsfc.nasa.gov/products/90) | Parça parça okunabilen GeoTIFF. 10 m: 5,1 GB; 20 m: 2,7 GB; 30 m: 2,8 GB; 60 m: 3,1 GB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 17 ve 21 |
| Orta enlem yükseklik haritası | USGS, LOLA ve Kaguya birleşimi | 60 derece kuzey ile 60 derece güney arası, yaklaşık 59 m | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 32 |
| Resmi iniş koordinatları | [NASA NSSDC koordinat tablosu](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html) | HTML tablo | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 1 |

### Karşılaştırma ve ek katmanlar için

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Ortalama Güneş ve Dünya görünürlüğü haritaları | [PGDA 69](https://pgda.gsfc.nasa.gov/products/69) | 60, 120 ve 240 m; 60 m dosya 51 MB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 34 ve 35 |
| Kalıcı gölge haritası, `LPSR` | [PGDA 90](https://pgda.gsfc.nasa.gov/products/90) | 20 m dosya 154 MB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 23 |
| Eğim haritası, `LDSM` | [PGDA 90](https://pgda.gsfc.nasa.gov/products/90) | 20 m dosya 3,8 GB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 22 |
| Pürüzlülük haritaları, `LDRM` | [PGDA 90](https://pgda.gsfc.nasa.gov/products/90) | 37 dosya | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 24 |
| Gölgeli kabartma, `LDEM` eki `_HILL` | [PGDA 90](https://pgda.gsfc.nasa.gov/products/90) | Yükseklik haritasıyla aynı ızgara | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 20 |

PGDA 90 haritalarının kapsamı çözünürlüğe göre değişir: 10 m dosya 83 derece güneyden, 20 m dosya 80 derece güneyden, 60 m dosya 60 derece güneyden kutba kadar (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 18). Hepsi ME koordinat sisteminde, güney kutbu merkezli düz bir izdüşümde ve metre birimindedir (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 17).

## 4. Hesap nasıl yapılıyor

### Verinin alınması

1. **SPICE dosyaları** sunucu ilk kurulurken bir betikle indirilir ve `data/raw/kernels/` altına konur.
2. **Yükseklik haritaları indirilmez.** Yalnızca gereken pencere internetten okunur. Bu yöntem denendi: 500'e 500 piksellik bir pencere birkaç saniyede okundu (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 27, kısmen doğru: yöntem ve süre doğrulandı, belgedeki sayılar aynen tekrar edilemedi; [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 28).
3. **Koordinat tablosu** elle `data/sites.json` dosyasına aktarılır ([saha-katalogu.md](saha-katalogu.md)).

### Ön hesap

1. Hazır saha listesindeki her saha için ufuk profili hesaplanır ([ufuk-hesabi.md](ufuk-hesabi.md)).
2. Profil `data/horizons/<site_id>_<yükseklik>m.json` olarak kaydedilir. 720 değerlik bir profil birkaç kilobayt tutar (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-47; [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 104).
3. Bu dosyalar depoya konur. Sunucu hazır sahalar için ufku dosyadan okur.

Güneş ve Dünya konumu önceden hesaplanmaz; sunucu her istekte SPICE ile hesaplar ([gunes-dunya-konumu.md](gunes-dunya-konumu.md)).

### Klasör düzeni

| Yol | İçerik | Depoda mı |
|---|---|---|
| `data/sites.json` | Hazır saha listesi | Evet |
| `data/horizons/` | Önceden hesaplanmış ufuk profilleri | Evet |
| `data/panel_profiles.json` | Panel profilleri | Evet |
| `data/reference_missions.json` | Geçmiş görev kayıtları | Evet |
| `data/examples/` | Her veri yapısı için örnek dosya | Evet |
| `data/raw/` | SPICE dosyaları ve indirilen her şey | Hayır (`.gitignore`) |

## 5. Girdi ve çıktı

### Girdi

Ön hesap betiği: `data/sites.json` ve yükseklik (metre) listesi.

### Çıktı

Saha ve yükseklik başına bir `HorizonProfile` dosyası ([ADR-0003](../adr/0003-veri-sozlesmesi.md)).

Sunucunun veri durumu `GET /api/health` ile sorulur ([ADR-0004](../adr/0004-api-uc-noktalari.md)):

```json
{ "ok": true, "kernels_loaded": true, "dem_available": true }
```

## 6. Arayüzde nerede görünür

- Referans arayüz açılışta önce `health` uç noktasını çağırıyor ve veri hazır değilse açılış ekranında kalıyor (Kaynak: [DESIGN.md, 6.4](../../frontend-migrate/DESIGN.md)). Aynı sıra korunur.
- Her sonucun yanında verinin güvenilirlik etiketi gösterilir ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).

## 7. Bilinen sınırlar

- **İnternet gerekir.** Pencere okuma NASA sunucusuna bağlıdır; demo sırasında sunucu yavaşsa arazi ufku hesaplanamaz. Hazır sahaların profilleri bu yüzden önceden hesaplanıp depoya konur.
- **Güney kutbu dışı sahalarda ince harita yok.** Orta enlem haritası yaklaşık 59 m çözünürlüktedir (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 32); Apollo sahalarında arazi ufku kaba kalır ya da düz ufuk kullanılır.
- **Artemis III aday bölge sınırları otomatik indirilemiyor.** Site otomatik istekleri engelliyor (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 69).
- **Bazı adresler yönleniyor.** PGDA 69'un asıl dosya sunucusu şifresiz bağlantı kullanıyor (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 35).

## 8. Varsayımlar ve açık kararlar

- Varsayım: `rasterio` kütüphanesinin lisansı bu çalışmada doğrulanmadı; depo sayfası lisansı otomatik göstermiyor (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 67). Eklenmeden önce lisans dosyası okunmalı.
- Doğrulanan lisanslar: SpiceyPy, astronomy-engine ve heat1d MIT lisanslı (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 65).
- Öneri: Ön hesap betiği depoda `scripts/` altında durur; çıktıları `data/horizons/` altına yazar.
- Açık karar: Hazır sahalar için hangi yüksekliklerin önceden hesaplanacağı. Öneri: 2 m ve 10 m.
- Açık karar: Demo sırasında internet kesilirse kullanılacak yedek. Öneri: demo sahalarının bütün yanıtları örnek dosya olarak saklanır.

## 9. Kaynaklar

- [NAIF veri dosyaları](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/)
- [PGDA 90](https://pgda.gsfc.nasa.gov/products/90), [PGDA 69](https://pgda.gsfc.nasa.gov/products/69), [PGDA 78](https://pgda.gsfc.nasa.gov/products/78)
- [NASA NSSDC koordinat tablosu](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html)
- [data-sources](../research/data-sources/README.md)
