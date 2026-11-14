# Misyon Araçları, 3B Modeller ve Fiziksel Özellikler

"Her bir farklı misyon için kullanılan araçlar ve olası .fbx veya modelleri + bunların fiziksel özelliklerinin manuel doğrulanması" araştırma başlığı kapsamında hazırlanan çıktılar: misyonlarda kullanılan araçlar, bu araçların 3B modelleri ve lisansları, fiziksel özelliklerinin doğrulandığı veri seti.

## Dosyalar

| Dosya | İçerik | Orijinal ad |
|---|---|---|
| [arac-3b-model-lisans-fizik-veri-seti-arastirma.pdf](arac-3b-model-lisans-fizik-veri-seti-arastirma.pdf) | Araştırma raporu (Kasım 2026) | `Lunar Landing Site Navigator_ Araç, 3B Model, Lisans ve Fizik Veri Seti (Kasım 2026).pdf` |
| [arac-model-lisans-fizik-veri-seti-sunumu.pptx](arac-model-lisans-fizik-veri-seti-sunumu.pptx) | Ekip sunumu | `Arac-Model-Lisans-Fizik-Veri-Seti-Sunumu.pptx` |

Dosyalar içerikleri değiştirilmeden kopyalandı; yalnızca adları repo kuralına (ASCII, kebab-case) uyarlandı.

## Doğrulama notları (14 Kasım 2026)

Rapor ve sunum değiştirilmedi. Kaynak doğrulamasında bulunan düzeltmeler aşağıda; tam tablo [dogrulama/gorev-araclari.md](../dogrulama/gorev-araclari.md) dosyasında.

| Yer | Raporda yazan | Doğrusu |
|---|---|---|
| Bölüm 0, bölüm 9, sunum (slayt 2 ve 4) | Hiçbir aracın ağırlık merkezi ve atalet değeri yayımlanmamış; Apollo LM için z_CG ≈ 3,7 ± 0,5 m tahmin | Raporun kendi kaynağı (AAS-26-167, NTRS 20260001760, Tablo 1) LM için ağırlık merkezi yüksekliğini 3,62 m veriyor; atalet momentleri de var. |
| Bölüm 3, bölüm 12 | Apollo LRV için lisansı doğrulanmış açık model yok | Raporun baktığı blenderartists sayfası modeli "CC0 1.0 Universal" olarak sunuyor. Dosyadaki lisans belgesi teyit edilmeli. |
| Bölüm 7 | LM eğim sınırındaki 6° "operasyonel hedef", 12° "tasarım zarfı"; ikisi farklı | NASA TN D-6850'ye göre ikisi aynı şartnamenin parçası: ortalama eğim en fazla 6°, pürüzler dahil etkin eğim en fazla 12°. |
| Bölüm 5 | Unreal "Import Into Level" FBX, glTF, GLB ve MaterialX ile çalışır | Güncel Unreal belgesi yalnızca glTF ve MaterialX diyor. |
| Özet 5 | Mons Mouton'u hedefleyen iki görev var: IM-4 ve VIPER | Raporun kendi kaynağına göre Griffin-1 de Mons Mouton bölgesine inecek ve ilk uçan o olacak. |
| Bölüm 4 | Smithsonian LM-2 görselleri CC0 | Toplu olarak doğrulanamadı. Açılan sayfada 18 görselin 11'inde "Usage conditions may apply" yazıyor; görsel bazında bakılmalı. |
| Özet 4 | VIPER 2027 sonunda inecek (doğrulandı) | Bilgi Eylül 2025 tarihli. Taşıyacak aracın ilk uçuşu en erken 2027 başına kaydı; tarih iyimser olabilir. |

Doğrulanan başlıca sonuçlar: Apollo LM ve LRV ölçüleri ve kütleleri; NASA'nın Apollo LM modeli; Athena'nın iniş bilgileri (NASA 25-025); Artemis takvimi; NASA logosu ve kullanım kuralları; Space Apps kılavuzundaki Çin kuralı (depodaki `docs/challenge/judging-and-awards-guide.pdf` dosyasından).
