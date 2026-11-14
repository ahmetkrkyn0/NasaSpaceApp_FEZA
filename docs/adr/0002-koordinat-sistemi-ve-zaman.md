# ADR-0002: Koordinat sistemi, zaman ve açı kuralları

- **Status:** Proposed
- **Date:** 2026-11-14
- **Related:** [docs/design/gunes-dunya-konumu.md](../design/gunes-dunya-konumu.md), [docs/design/saha-katalogu.md](../design/saha-katalogu.md), [docs/research/ANALIZ-OZETI.md](../research/ANALIZ-OZETI.md) (bölüm 8)

## Context

Ay için iki koordinat sistemi yaygın: ortalama Dünya yönüne göre tanımlı olan (ME) ve Ay'ın asal eksenlerine göre tanımlı olan (PA). İkisi karıştırılırsa bir saha yüzeyde 660 ile 875 m arasında kayıyor ([dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 22, 23 ve 27; [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 4 ve 5).

Saat tarafında da iki ölçek var: gösterimde kullanılan UTC ve hesapta kullanılan TDB. Aralarındaki fark 69,184 saniye; karıştırılırsa olay saatleri bu kadar kayıyor ([dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 18).

Dört kişi paralel çalışacağı için bu kuralların tek yerde yazılı olması gerekiyor.

## Decision

### Koordinat sistemi

1. **Bütün saha koordinatları ME sisteminde tutulur.** SPICE'taki adı `MOON_ME`. Gerekçe: kullanacağımız yükseklik haritaları bu sistemde ([PGDA 90 ürün sayfası](https://pgda.gsfc.nasa.gov/products/90); doğrulama: [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 17) ve Horizons da Ay yüzeyindeki noktaları bu sistemde yorumluyor ([Horizons kılavuzu](https://ssd.jpl.nasa.gov/horizons/manual.html); doğrulama: [dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 24).
2. **Referans yüzey 1737,4 km yarıçaplı küredir.** Yükseklikler metre cinsinden ve bu küreye göredir ([dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 19 ve 30).
3. **Enlem ve boylam derece cinsindendir.** Enlem güneyde eksi, kuzeyde artı. Boylam doğuya doğru artı ve eksi 180 ile artı 180 arasında saklanır. Girişte 0 ile 360 arası da kabul edilir ve çevrilir. Gerekçe: NASA'nın koordinat tablosu bazı sahaları batı boylamıyla veriyor ([dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 6).
4. **PA sisteminde gelen her veri açıkça etiketlenir** ve kullanılmadan önce ME'ye çevrilir.

### Zaman

5. **Dosyalarda ve API'de zaman UTC'dir** ve ISO 8601 biçiminde, sonunda `Z` ile yazılır. Örnek: `2026-12-01T00:00:00Z`.
6. **Hesap içinde SPICE'ın kendi zaman ölçeği kullanılır.** Çevrim NASA'nın artık saniye dosyasıyla (`naif0012.tls`) yapılır ([dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 19).
7. **SPICE'a tarih verilirken sonuna `UTC` yazılmaz.** `2026-12-01T00:00:00 UTC` yazımı hata veriyor; `2026-12-01T00:00:00` çalışıyor ([dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 51).

### Açılar

8. **Yön açısı (azimut) gerçek kuzeyden doğuya doğru, 0 ile 360 derece arasında ölçülür.** Alan adı `azimuth_true_deg`. Referans arayüz de aynı adı kullanıyor ([frontend-migrate/design-export/api-contract/types/net-types.ts](../../frontend-migrate/design-export/api-contract/types/net-types.ts), `SunSample`).
9. **Yükseklik açısı, saha noktasındaki yerel yataya göre ölçülür.** Yerel yatay, referans kürenin o noktadaki teğet düzlemidir. Alan adı `elevation_deg`. Zemin eğimi bu açıyı değiştirmez; yalnızca panel hesabını etkiler.
10. **Açılar her zaman sahanın kendi konumundan hesaplanır**, Ay'ın merkezinden değil. Bu düzeltme atlanırsa Dünya'nın yüksekliği yaklaşık çeyrek derece yanlış çıkar ([dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 46).
11. **Işığın yolda geçirdiği süre ve gözlemcinin hareketi için düzeltme uygulanır** (SPICE'ta `LT+S`). Bu ayarla ekibin hesabı Horizons ile derecenin milyonda biri düzeyinde tutuyor ([dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 14).

### Veri dosyaları

12. **SPICE dosya seti:** `naif0012.tls`, `pck00011.tpc`, `de440s.bsp`, `moon_pa_de440_200625.bpc`, `moon_de440_250416.tf`. Hepsi [NAIF sunucusunda](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) mevcut ([dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 13).

Varsayım: Tam kutba çok yakın sahalarda "doğu" yönü tanımsızlaşır. Enlemi mutlak değerce 89,9 dereceyi aşan sahalarda azimut için harita ızgarasının kuzeyi kullanılacak (`azimuth_grid_deg`). 89,9 eşiği ekibin önerisidir; bir kaynağa dayanmıyor ([dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 84).

## Consequences

Kazanılanlar:

- Saha koordinatı, yükseklik haritası ve konum hesabı aynı sistemde; çevrim hatası riski kalkıyor.
- Arayüzde gösterilen her saat UTC; kullanıcı Horizons ile doğrudan karşılaştırabilir.

Bedeli:

- PA sisteminde yayımlanan ürünler kullanılacaksa ayrıca çevrilmeleri gerekir.
- Sunucu SPICE dosyalarını (yaklaşık 46 MB) indirmek zorunda ([dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 29).

Yapılacaklar:

- Hesap arşivindeki `site_azel_spice.py` betiği 7. maddeye göre düzeltilerek depoya alınmalı.
- Kutup eşiği (89,9 derece) uygulanmadan önce bir test sahasıyla denenmeli.
