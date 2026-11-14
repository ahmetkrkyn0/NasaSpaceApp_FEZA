# Kalıcı gölge katmanı

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Destekleyici
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [data-sources](../research/data-sources/README.md) (bölüm 5 ve 9), [csa-moon-exploration.md](../research/csa-moon-exploration.md) (bölüm 8)
- **Doğrulama:** [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md)

## 1. Ne yapıyoruz

Hiç doğrudan Güneş ışığı almayan bölgeleri haritada bir katman olarak gösteriyoruz. Bu bölgelere kalıcı gölge bölgesi deniyor. Katmanı kendimiz hesaplamıyoruz; NASA'nın hazır haritasını kullanıyoruz.

## 2. Neden

Challenge, güney kutbundaki dik yamaçların ve derin kraterlerin yarattığı aşırı gölge koşullarının nasıl gösterileceğinin düşünülmesini öneriyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)). Kalıcı gölge, bir sahanın neden güç üretemeyeceğini tek bakışta anlatır.

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Kalıcı gölge maskesi, `LPSR` | [PGDA 90](https://pgda.gsfc.nasa.gov/products/90) | GeoTIFF, 20 m çözünürlük, 154 MB | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 23 ve 36 |
| Kalıcı gölge maskesi, kaba | [PGDA 69](https://pgda.gsfc.nasa.gov/products/69) | 60 ile 240 m çözünürlük | [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 34 |

Maske her piksel için tek bir bilgi taşır: kalıcı gölgede ya da değil.

## 4. Hesap nasıl yapılıyor

1. Sunucu, haritada görünen bölge için maskenin ilgili penceresini okur ([veri-kaynaklari-ve-on-hesap.md](veri-kaynaklari-ve-on-hesap.md), pencere okuma).
2. Pencere arayüzün istediği çözünürlüğe küçültülür.
3. Sonuç ikili bir sayı dizisi olarak gönderilir.
4. Arayüz diziyi haritanın üzerine yarı saydam bir katman olarak çizer.

Buz için ayrı bir hesap yapılmaz. Katman yalnızca gölgeyi gösterir.

## 5. Girdi ve çıktı

### Girdi

`GET /api/layers/psr?format=f32&region=<bölge>` ([ADR-0004](../adr/0004-api-uc-noktalari.md)).

### Çıktı

Başlıksız, küçük uçlu 32 bit kayan noktalı dizi. Satır ve sütun sayısı, çözünürlük ve güvenilirlik etiketi yanıt başlıklarında taşınır: `X-Layer-Rows`, `X-Layer-Cols`, `X-Layer-Resolution-M`, `X-Layer-Validity` (Kaynak: [DESIGN.md, 6.3](../../frontend-migrate/DESIGN.md)). Değerler: 1 kalıcı gölge, 0 değil, sayı olmayan değer veri yok.

Güvenilirlik etiketi `MEASURED` olur; referans arayüzün aynı katman için kullandığı değer de budur (Kaynak: [örnek yanıtlar](../../frontend-migrate/design-export/api-contract/fixtures/), `psr-validation.available.json`).

## 6. Arayüzde nerede görünür

- Harita üzerindeki katman seçicide "Permanent shadow" seçeneği (Kaynak: [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `layer-picker`). Referans arayüzde bu katman zaten var (Kaynak: [örnek yanıtlar](../../frontend-migrate/design-export/api-contract/fixtures/), `layers-psr.available.json`).
- Referans arayüzdeki kalıcı gölge karşılaştırma paneli korunur: kendi hesabımızla karanlık çıkan bölgelerin NASA maskesiyle ne kadar örtüştüğünü gösterir (Kaynak: [DESIGN.md, 1.10](../../frontend-migrate/DESIGN.md), `psr-validation`). Bu, [dogrulama-plani.md](dogrulama-plani.md) için hazır bir gösterimdir.
- Katmanın açıklamasında buz için şu not durur: "Shadow only. Ice presence is uncertain."

## 7. Bilinen sınırlar

- **Kapsam.** 20 m maske 80 derece güneyden kutba kadar olan bölgeyi içerir (doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 18 ve 23).
- **Maske uzun dönem içindir.** Belirli bir tarihte geçici olarak gölgede kalan yerleri göstermez; onlar ufuk hesabından çıkar ([ufuk-hesabi.md](ufuk-hesabi.md)).
- **Gölge buz demek değildir.** Mart 2026'da yayımlanan bir çalışma kalıcı gölgelerde yaygın yüzey buzu kanıtı bulmadı; yalnızca küçük birikintiler (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 72). Bu sonuç ikincil bir kaynaktan okunmuştur ve çalışmanın yazarları araştırmanın süreceğini söylüyor (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 73, kısmen doğru).

## 8. Varsayımlar ve açık kararlar

- Öneri: İlk sürümde yalnızca Mons Mouton çevresi için tek bir pencere önceden hazırlanır.
- Açık karar: Kendi hesabımızla karşılaştırma paneli ilk sürüme girecek mi. Bütün bölge için ufuk hesabı gerektirir; süresi ölçülmedi ([ufuk-hesabi.md](ufuk-hesabi.md), 8. bölüm).
- Varsayım: Hidrojen ve buz haritaları kullanılmayacak. Gösterilen adreslerde hazır harita değil ham ölçüm verisi var (aynı doğrulama dosyasında No 49 ve 51 kısmen doğru).

## 9. Kaynaklar

- [PGDA 90](https://pgda.gsfc.nasa.gov/products/90), [PGDA 69](https://pgda.gsfc.nasa.gov/products/69)
- [frontend-migrate/DESIGN.md](../../frontend-migrate/DESIGN.md), bölüm 6.3
