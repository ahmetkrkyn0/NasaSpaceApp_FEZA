# CSA bilgi kartları

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Ekstra özellik
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md)
- **Dayandığı araştırma:** [csa-moon-exploration.md](../research/csa-moon-exploration.md)
- **Doğrulama:** [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md)

## 1. Ne yapıyoruz

Kanada Uzay Ajansı'nın (CSA) katkısı olan sahalarda, saha seçildiğinde küçük bir bilgi kartı gösteriyoruz. Kart katkıyı bir cümleyle söyler ve kaynağına bağlantı verir.

## 2. Neden

CSA Ay keşfi sayfası, challenge'ın kaynak listesinde yer alan partner ajans kaynağıdır (Kaynak: [resources.md](../challenge/resources.md)). Teslim kılavuzu partner ajansların veri ve kaynaklarının kullanılmasını özellikle teşvik ediyor (Kaynak: [teslim kılavuzu](../challenge/project-submission-guide.pdf)). Bilgi kartı, bu kaynağın üründe gerçekten kullanıldığını gösterir.

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Kanada'nın Ay görevlerine katkıları | [CSA, Apollo'dan Artemis'e](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/from-apollo-to-artemis-the-evolution-of-crewed-lunar-missions.asp) | İnternet sayfası | [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 28 ve 46 |
| Güncel Artemis takvimi | [CSA, Artemis](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/artemis-missions.asp) | İnternet sayfası | [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 32 ve 36 |

## 4. Hesap nasıl yapılıyor

Hesap yok; içerik derleme kuralı var.

### Kartlara girecek doğrulanmış katkılar

| Saha | Kart metni (İngilizce) | Kaynak |
|---|---|---|
| Apollo 11 | "The landing gear of the Eagle lunar module was built in Canada." | [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 28 |
| Apollo 16 ve Apollo 17 | "Apollo 16 and 17 astronauts trained in geology at Sudbury, Canada." | [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 46 |
| Blue Ghost 1 | "Coatings from a Canadian testing laboratory flew on a NASA dust experiment aboard this lander." | [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 30 |

Apollo 16 ve Apollo 17 sahaları hazır listede henüz yok ([saha-katalogu.md](saha-katalogu.md)); eklenirlerse kartları da eklenir.

### Karta konmayacaklar

- IM-1 Odysseus üzerindeki Kanada kameraları ve iniş sensörleri. Dayandığı sayfa açılamadı; doğrulanamadı (aynı doğrulama dosyasında No 29).
- İptal edilen Kanada rover görevi. Görev Mart 2026'da iptal edildi (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 16); koordinatlı bir sahası yok.

### Genel bilgi kartı (saha bağımsız)

Eğitim amaçlı tek bir kart: "Canadian astronaut Jeremy Hansen flew around the Moon on Artemis II in April 2026." Görev 1 Nisan 2026'da fırlatıldı, 10 Nisan'da döndü; Hansen görev uzmanıydı (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 22, 32 ve 33).

### CSA'yı alıntılarken dikkat

CSA sitesinin bazı sayfaları eskimiş durumda ve site bunu kendisi not ediyor (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 47). Kartlarda şu bilgiler kullanılmaz:

- Gateway istasyonunun 2027'de fırlatılacağı (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 48).
- Kanada rover'ının kutbu keşfedeceği (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 49).
- Artemis III'ün bir iniş görevi olduğu (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 50). Güncel plan: Artemis III 2027'de Dünya yörüngesinde bir test, ilk insanlı iniş 2028'de Artemis IV ile (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 36).

## 5. Girdi ve çıktı

### Girdi

Kartlar saha kaydına bağlı olarak `data/sites.json` içinde tutulur.

### Çıktı

Öneri: `Site` kaydına isteğe bağlı bir `cards` alanı eklenir.

```json
{
  "id": "apollo-11",
  "cards": [
    { "agency": "CSA", "text": "The landing gear of the Eagle lunar module was built in Canada.",
      "source": { "label": "Canadian Space Agency", "url": "https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/from-apollo-to-artemis-the-evolution-of-crewed-lunar-missions.asp" } }
  ]
}
```

## 6. Arayüzde nerede görünür

- Saha seçildiğinde saha özetinin altında küçük bir kart ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Kartın altında atıf satırı: "Credit: Canadian Space Agency".

## 7. Bilinen sınırlar

- **Yalnızca üç katkı doğrulandı.** Liste kısa.
- **CSA görselleri kullanılmayacak.** CSA'nın kullanım koşulları sayfası ticari yeniden yayın için yazılı izin istiyor; en güvenli yol atıf satırı koymak ya da kaynağa bağlantı vermektir (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 60). Kartlar yalnızca metin ve bağlantı içerir.
- **Kart metinleri kaynağın özetidir,** birebir alıntı değildir.

## 8. Varsayımlar ve açık kararlar

- ADR-0003'e eklenmeli: `Site` kaydında `cards` alanı.
- Açık karar: Kart metinleri son haline getirilmeden önce CSA sayfasındaki ifadeyle bir kez daha karşılaştırılmalı.
- Varsayım: Atıf satırının biçimi araştırma notunun önerisidir; CSA koşulları sayfasındaki tam ifade bu çalışmada alıntılanmadı.

## 9. Kaynaklar

- [CSA Moon exploration](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/)
- [resources.md](../challenge/resources.md)
- [teslim kılavuzu](../challenge/project-submission-guide.pdf)
