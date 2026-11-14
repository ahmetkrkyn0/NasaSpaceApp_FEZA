# Röle etiketi

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Ekstra özellik
- **Karar taslakları:** [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md)
- **Dayandığı araştırma:** [csa-moon-exploration.md](../research/csa-moon-exploration.md) (bölüm 8), [explainability-mission-differences](../research/explainability-mission-differences/README.md)
- **Doğrulama:** [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md)

## 1. Ne yapıyoruz

Dünya'nın hiç görünmediği sahalarda kullanıcıya açık bir etiket gösteriyoruz: "Relay required". Röle, sinyali araç ile Dünya arasında taşıyan bir uydudur. Röle uydusunun kendisini modellemiyoruz; yalnızca gerektiğini söylüyoruz.

## 2. Neden

Challenge doğrudan iletişim pencerelerini soruyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)). Pencerenin hiç açılmadığı bir sahada boş bir çizelge göstermek yerine nedenini ve sonucunu söylemek daha anlaşılırdır.

Gerçek örnek: Chang'e 4, 3 Ocak 2019'da Ay'ın uzak yüzüne indi; iletişimi yalnızca bir röle uydusu üzerinden kuruldu (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 59; [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 61). O sahada Dünya inişte ufkun 39 derece altındaydı ve 2019 boyunca hiç ufkun üstüne çıkmadı (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 7 ve 14).

## 3. Hangi veriyi kullanıyoruz

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Dünya'nın görünürlük pencereleri | [iletisim-penceresi.md](iletisim-penceresi.md) | `EventList` | [ADR-0003](../adr/0003-veri-sozlesmesi.md) |

Yeni veri gerekmez.

## 4. Hesap nasıl yapılıyor

1. Seçilen aralık için Dünya'nın görünür olduğu zaman oranı hesaplanır ([olaylar-ve-sureler.md](olaylar-ve-sureler.md)).
2. Oran sıfırsa ve aralık en az bir ay ise etiket `required` olur.
3. Oran sıfırdan büyük ama birden küçükse etiket `intermittent` olur; pencereler gösterilir.
4. Oran bir ise etiket `not_required` olur.

Bir aylık alt sınırın nedeni: Dünya'nın gökyüzündeki salınımı yaklaşık bir ay sürer; kutupta görünürlük pencereleri yaklaşık 14 günlük dönemlerle açılıp kapanır (doğrulama: [dogrulama/ufuk-ve-isik-isi.md](../research/dogrulama/ufuk-ve-isik-isi.md), No A-28 ve A-29). Daha kısa bir aralıkta Dünya'nın görünmemesi kalıcı olduğunu göstermez.

## 5. Girdi ve çıktı

### Girdi

Ek girdi yok. Etiket `/api/events` ve `/api/comm-window` yanıtlarına eklenir ([ADR-0004](../adr/0004-api-uc-noktalari.md)).

### Çıktı

İki yeni alan:

| Alan | Tip | Değerler |
|---|---|---|
| `relay_status` | metin | `not_required`, `intermittent`, `required` ya da `unknown` |
| `relay_required` | mantıksal | `relay_status` değeri `required` ise `true` |

```json
{ "earth_visible_fraction": 0.0, "relay_status": "required", "relay_required": true }
```

Aralık bir aydan kısaysa ve Dünya hiç görünmediyse `relay_status` değeri `unknown` olur.

## 6. Arayüzde nerede görünür

- Comms sekmesinde ve saha özetinde etiket ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Etiketin açıklaması: "Earth never rises above the horizon at this site in the selected period. Direct-to-Earth communication is not possible; a relay satellite is needed."
- Örnek kart: Chang'e 4'ün röle uydusu Queqiao, Dünya ile Ay'ın ötesindeki bir denge noktası çevresinde, Ay'dan yaklaşık 65.000 km uzakta dolanıyor ve hem Dünya'yı hem uzak yüzü görüyor (doğrulama: [dogrulama/aciklanabilirlik.md](../research/dogrulama/aciklanabilirlik.md), No 60).

## 7. Bilinen sınırlar

- **Röle uydusu modellenmiyor.** Bir röle uydusunun sahadan ne zaman görüneceği hesaplanmaz.
- **Etiket seçilen aralığa bağlıdır.** Uzak yüzün kenarına yakın sahalarda Dünya yılın bir bölümünde görünebilir; kısa aralık yanıltabilir.
- **Etiket yalnızca görüş hattını söyler.** Röle hizmetinin o tarihte var olup olmadığını söylemez. ESA'nın Ay iletişim ağı için ilk hizmet 2028 sonu, tam ağ 2030 olarak hedefleniyor (doğrulama: [dogrulama/csa-ve-diger-ulkeler.md](../research/dogrulama/csa-ve-diger-ulkeler.md), No 77).

## 8. Varsayımlar ve açık kararlar

- Varsayım: Röle uydularının yörüngesi için hazır bir veri seti olmadığı doğrulanamadı; yalnızca aranmadı (veri kaynakları doğrulama dosyasında No 48). Modelleme bu yüzden değil, kapsam ve süre nedeniyle dışarıda bırakıldı.
- Varsayım: Bir aylık alt sınır ekibin tercihidir.
- ADR-0003'e eklenmeli: `relay_status` ve `relay_required` alanları.

## 9. Kaynaklar

- [explainability-mission-differences](../research/explainability-mission-differences/README.md)
- [De Rosa ve arkadaşları, 2012](https://arxiv.org/abs/1208.5587)
