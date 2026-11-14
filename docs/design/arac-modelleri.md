# Araç modelleri

- **Durum:** Taslak (Aşama 2, 14 Kasım 2026)
- **Sınıf:** Ekstra özellik
- **Karar taslakları:** [ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md), [ADR-0003](../adr/0003-veri-sozlesmesi.md)
- **Dayandığı araştırma:** [mission-vehicles-models-physics](../research/mission-vehicles-models-physics/README.md)
- **Doğrulama:** [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md)

## 1. Ne yapıyoruz

3B arazi görünümünde sahaya bir iniş aracı modeli koyuyoruz ve web arayüzünde seçilen sahanın yanında aracın kısa bir bilgi kartını gösteriyoruz. 3B görünüm ayrı olarak Unreal Engine ile geliştiriliyor ([ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md)). Yalnızca lisansı doğrulanmış modeller ve kaynağı doğrulanmış ölçüler kullanılır.

## 2. Neden

Challenge 3B yüzey görselleştirmesini ve eğitim amaçlı kullanımı öneriyor (Kaynak: [challenge metni](../challenge/lunar-landing-site-navigator.md)). Sahada tanıdık bir araç görmek ölçeği anlamayı kolaylaştırır. Bu, hesabı etkilemeyen bir görsel ektir.

## 3. Hangi veriyi kullanıyoruz

### Kullanılabilecek model

| Veri | Nereden | Biçim ve boyut | Kaynak |
|---|---|---|---|
| Apollo iniş aracı (Lunar Module) modeli | NASA 3D Resources | GLB, yaklaşık 700 KB; 20 Mart 2025 tarihli | [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 57; [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 61 |

NASA'nın kullanım kılavuzuna göre 3B model içeriği genel olarak telif hakkına tabi değildir (doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 65; [dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 62).

### Kullanılmayacaklar

- **Smithsonian'daki iniş aracı görselleri.** Toplu olarak serbest oldukları doğrulanamadı; açılan sayfada görsellerin çoğunda kullanım koşulu uyarısı var (doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 61, kısmen doğru; aynı dosyada No 60 doğrulanamadı).
- **Ticari sitelerdeki modeller.** Lisans metinleri okunamadı; kaynak rapor da kullanılmamasını öneriyor.
- **Üçüncü kişilere ait olduğu belirtilen NASA sayfası içerikleri.** NASA'nın kullanması başkasına hak vermez (doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 68).
- **Apollo arazi aracı modeli.** Rover ile ilgili her şey kapsam dışı ([ANALIZ-OZETI.md, bölüm 7.5](../research/ANALIZ-OZETI.md)).

### Bilgi kartı için doğrulanmış ölçüler

| Araç | Bilgi | Kaynak |
|---|---|---|
| Apollo iniş aracı | Yükseklik 6,985 m; iniş ayakları arasında çapraz açıklık 9,449 m | [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 81 |
| Apollo iniş aracı | Ayak tabanı çapı 0,94 m | [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 83 |
| Apollo 11 iniş aracı | Toplam kütle 15.103 kg | [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 86 |
| Apollo iniş aracı | En büyük iniş eğimi 12 derece | [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 89 |
| IM-2 Athena | Fırlatma kütlesi 2.120 kg | [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 42 |
| Blue Ghost | Kuru kütle 469 kg; yükseklik 2 m; genişlik 3,5 m (ikinci görevin bilgi kutusundan) | [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 105 |

## 4. Hesap nasıl yapılıyor

Hesap yok; yerleştirme kuralı var.

1. Model dosyası bir kez indirilir ve depoya konur (boyutu küçük).
2. 3B görünüm modeli sahnede sahanın koordinatına, zemine oturacak şekilde yerleştirir.
3. Modelin ölçeği doğrulanmış yükseklikle karşılaştırılır: sahnedeki modelin yüksekliği 6,985 m olmalı. Tutmuyorsa ölçek düzeltilir.
4. Model yalnızca kendi görevinin sahasında gösterilir: Apollo modeli Apollo sahalarında.

## 5. Girdi ve çıktı

### Girdi

Araç kaydı, `data/vehicles.json` içinde. Öneri:

```json
{
  "id": "apollo-lm", "name": "Apollo Lunar Module",
  "model": { "path": "assets/models/apollo-lm.glb", "format": "glb", "credit": "NASA", "source_label": "NASA 3D Resources" },
  "height_m": 6.985, "span_m": 9.449, "mass_kg": 15103,
  "sites": ["apollo-11"], "validity": "MEASURED"
}
```

### Çıktı

3B görünümde model, web arayüzünde bilgi kartı. Sunucudan ek veri gerekmez.

## 6. Arayüzde nerede görünür

- 3B arazi görünümü (Unreal Engine). Güncel Unreal belgesine göre sahneye doğrudan aktarma glTF ve MaterialX biçimleriyle çalışıyor; araştırma raporundaki "FBX ile de çalışır" ifadesi yanlış çıktı (doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 76). NASA modeli GLB biçiminde, yani glTF'nin tek dosyalı hali.
- Saha özetinin altında araç bilgi kartı ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md)).
- Model üzerinde ya da kartta NASA logosu gösterilmez; yalnızca yazıyla atıf yapılır: "Model: NASA".

## 7. Bilinen sınırlar

- **Tek model var.** Güncel araçlar (Athena, Blue Ghost, VIPER) için lisansı doğrulanmış model bulunamadı; bu sahalarda model gösterilmez ya da basit bir işaret kullanılır.
- **Athena için ekibin kendi modeli var.** [shipmodel/](../../shipmodel/README.md) altında Blender betiğiyle sıfırdan üretilen bir Athena (IM-2, Nova-C) modeli bulunuyor (`export/athena_lander.glb` ve `.blend`). Üçüncü taraf geometri ya da doku içermez, logo taşımaz. Ölçülerden yalnızca 4,3 m yükseklik ve 1,6 m gövde yayımlanmış Nova-C değerleridir; diğer oranlar fotoğraflardan tahmindir.
- **Güncel araçların ölçüleri büyük ölçüde eksik.** Kaynak rapor da bunu belirtiyor.
- **NASA içeriği NASA'nın onayı varmış gibi sunulamaz.** NASA amblemi ve logosu kamu malı değildir ve yasayla korunur (doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 67). Onay ima etmeme kuralı kılavuzda ticari kullanım bağlamında geçiyor (doğrulama: [dogrulama/gorev-araclari.md](../research/dogrulama/gorev-araclari.md), No 66, kısmen doğru).
- **3B görünüm web arayüzünden ayrı geliştiriliyor** ([gosterim-ve-arayuz.md](gosterim-ve-arayuz.md), 8. bölüm). Birleştirilene kadar web arayüzünde yalnızca bilgi kartı var.

## 8. Varsayımlar ve açık kararlar

- Varsayım: GLB dosyasının Unreal Engine'e sorunsuz aktarılacağı bu çalışmada denenmedi.
- Varsayım: Modelin ölçeğinin doğru olduğu sınanmadı; kaynak rapor da motor içinde ölçüm yapamadığını belirtiyor. 4. bölümdeki ölçek adımı bu yüzden zorunlu.
- ADR-0003'e eklenmeli: araç kaydının yapısı.
- Açık karar: Güncel araçlar için basit geometrik bir temsil yapılacak mı.

## 9. Kaynaklar

- [mission-vehicles-models-physics](../research/mission-vehicles-models-physics/README.md)
- [ADR-0001](../adr/0001-uygulama-mimarisi-ve-stack.md)
