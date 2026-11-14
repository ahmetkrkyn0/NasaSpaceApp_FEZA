# Athena demosu

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Ekstra özellik
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [explainability-mission-differences](../research/explainability-mission-differences/README.md) (rapor, bölüm 8)
- **Doğrulama:** [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md)

## 1. Ne yapıyoruz

Ürünü tek bir gerçek iniş üzerinden anlatan hazır bir gösterim akışı tanımlıyoruz: Intuitive Machines şirketinin IM-2 Athena aracının 6 Mart 2025'te Mons Mouton'a inişi. Akış sunumda ve demo videosunda kullanılır.

## 2. Neden

Teslimde bir demo zorunlu: en fazla 7 slayt ya da en fazla 30 saniyelik video (Kaynak: [teslim kılavuzu](../challenge/project-submission-guide.pdf)). Jüri ölçütlerinden biri sunumdur (Kaynak: [jüri kılavuzu](../challenge/judging-and-awards-guide.pdf)). Bu kadar kısa sürede ürünü anlatmanın en hızlı yolu tek bir somut olaydır. Athena uygun bir örnek, çünkü iniş noktası ekibin test sahasına yaklaşık 370 m uzakta (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 17).

## 3. Hangi veriyi kullanıyoruz

Hepsi doğrulanmış sayılardır.

| Veri | Değer | Kaynak |
|---|---|---|
| İniş noktası | Enlem -84,7906; boylam 29,1957 | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 1 ve 20 |
| Hesap anı | 6 Mart 2025, 17:30 UTC | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 1 |
| Güneş | Yön 65,67 derece; yükseklik 2,47 derece | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 1 |
| Dünya | Yön 335,85 derece; yükseklik 11,19 derece | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 2 |
| 1 m'lik nesnenin gölgesi | Yaklaşık 23 m | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 16 |
| Aracın durumu | Planlanandan hızlı temas etti; 20 m çaplı bir kraterin içinde yan yattı | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 20 |
| Hedeften uzaklık | 400 m'den fazla (aynı duyuruda bir fotoğraf altyazısı yaklaşık 250 m diyor) | [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 35 |
| Yüzeyde çalışma süresi | 12 saat 45 dakika | [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 35 |
| Karşılaştırma: Blue Ghost 1 inişinde Güneş | 3,43 derece | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 3 |
| Mons Mouton'da Güneş'in yıllık en yüksek açısı | Yaklaşık 6,8 derece | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 11 |
| Blue Ghost sahasında Güneş'in sonradan ulaştığı açı | 70 derecenin üstü | [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 12 |

## 4. Hesap nasıl yapılıyor

Yeni hesap yok. Akış, ürünün mevcut hesaplarını sırayla kullanır.

### Gösterim adımları

1. **Saha ve an yüklenir.** "Past missions" listesinden Athena seçilir ([gecmis-gorev-vakalari.md](gecmis-gorev-vakalari.md)). Ufuk şeridinde Güneş ufkun hemen üstünde, Dünya biraz daha yukarıda görünür.
2. **Gölge gösterilir.** "1 m'lik nesnenin gölgesi 23 m" değeri ve uzun gölge uyarısı ([yaklasma-profili-ve-golge-uyarisi.md](yaklasma-profili-ve-golge-uyarisi.md)).
3. **Zaman ileri alınır.** Zaman çizelgesi oynatılır: Güneş ufuk boyunca dolanır ama hiç yükselmez.
4. **Başka bir sahayla karşılaştırılır.** Blue Ghost 1 inişi ikinci senaryo olarak eklenir. İniş anında Güneş orada da alçaktı; fark sonrasında ortaya çıkar: orada Güneş 70 derecenin üstüne çıkar, Mons Mouton'da yaklaşık 7 derecede kalır ([karsilastirma-ve-aciklama.md](karsilastirma-ve-aciklama.md)).
5. **Tarih kaydırılır.** Aynı saha bir ay sonrası için yeniden hesaplanır; pencerelerin nasıl değiştiği gösterilir. Bu, challenge'ın "takvim kayarsa ne olur" sorusudur.
6. **Kapanış cümlesi.** "We do not claim to explain why a mission failed. We show how the sky differs between sites and dates."

### Neyi gösteriyoruz, neyi göstermiyoruz

| Konu | Durum | Etiket |
|---|---|---|
| Güneş ve Dünya açıları | Hesaplandı ve doğrulandı | Model |
| Gölge uzunluğu | Hesaplandı | Model |
| Krater kenarının Güneş'i kesip kesmediği | Hesaplanmadı | Gösterilmez |
| Aracın yan yatışının panel gücüne etkisi | Aracın duruş açıları bilinmiyor | Gösterilirse "Illustrative" |
| Kazanın nedeni | Şirketin ön açıklaması | "Preliminary" |

"Çap, ufuk yüksekliği değildir": kraterin 20 m çapı, ufku 20 m yükselttiği anlamına gelmez. Kenarın ufka etkisi yalnızca ince bir yükseklik haritasından hesaplanabilir (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 20).

## 5. Girdi ve çıktı

### Girdi

Hazır iki senaryo, `data/examples/demo_athena.json` içinde:

```json
{
  "scenarios": [
    { "scenario_id": "athena", "label": "IM-2 Athena, 6 Mar 2025", "site_id": "im2-athena", "start_utc": "2025-03-06T17:30:00Z", "end_utc": "2025-04-05T17:30:00Z", "mast_height_m": 0, "panel_profile_id": "vertical_tracking" },
    { "scenario_id": "blue-ghost", "label": "Blue Ghost 1, 2 Mar 2025", "site_id": "blue-ghost-1", "start_utc": "2025-03-02T08:34:00Z", "end_utc": "2025-04-01T08:34:00Z", "mast_height_m": 0, "panel_profile_id": "vertical_tracking" }
  ]
}
```

### Çıktı

`CompareResponse` ([ADR-0003](../adr/0003-veri-sozlesmesi.md)) ve arayüzün normal görünümleri. Yeni bir yapı gerekmez.

## 6. Arayüzde nerede görünür

- Saha seçim ekranında "Load demo" düğmesi ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Demo sırasında internet gerekmesin diye iki senaryonun bütün yanıtları örnek dosya olarak saklanır ([veri-kaynaklari-ve-on-hesap.md](veri-kaynaklari-ve-on-hesap.md), 8. bölüm).

## 7. Bilinen sınırlar

- **İniş saati yaklaşık.** Hesap 17:30 UTC için yapıldı; gerçek iniş anı birincil kaynaktan doğrulanamadı (aynı doğrulama dosyasında No 22). İki dakikalık fark açıları fark edilir biçimde değiştirmez, çünkü Güneş 20 dakikada yalnızca derecenin yüzde biri kadar yükseliyor (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 9).
- **Açılar arazisizdir.** Krater içindeki gerçek ufuk hesaba katılmadı.
- **Krater kenarı için gereken ince harita elimizde yok.** Mons Mouton için doğrulanan en ince harita 10 m çözünürlükte ([ufuk-hesabi.md](ufuk-hesabi.md)); 20 m çaplı bir krateri çözmeye yetmez.
- **Athena'nın panelleri ve duruş açıları için doğrulanmış veri yok.**

## 8. Varsayımlar ve açık kararlar

- Öneri: Demo iki senaryoyla sınırlı kalır; 30 saniyelik videoya ancak 1, 3 ve 4. adımlar sığar.
- Açık karar: Demo slayt mı video mu olacak.
- Varsayım: Kapanış cümlesi ve adım sırası ekibin taslağıdır; kaynak raporun önerdiği akıştan uyarlanmıştır.

## 9. Kaynaklar

- [explainability-mission-differences](../research/explainability-mission-differences/README.md), rapor bölüm 8
- [teslim kılavuzu](../challenge/project-submission-guide.pdf), [jüri kılavuzu](../challenge/judging-and-awards-guide.pdf)
