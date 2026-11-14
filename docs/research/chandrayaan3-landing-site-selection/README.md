# Chandrayaan-3 İniş Alanı Seçimi: 4 km × 2,4 km Pencere ve Puanlama

"ISRO, Chandrayaan-3'ün 4 km × 2,4 km'lik iniş penceresini neye göre belirledi ve adayları nasıl puanladı?" sorusunun cevabı. Kaynaklar ISRO'nun Space Applications Centre (SAC) ve Physical Research Laboratory (PRL) ekiplerinin yayınları; hepsinin tam metni okundu.

## Dosyalar

| Dosya | İçerik |
|---|---|
| [README.md](README.md) | Bu not |
| [sites.csv](sites.csv) | 8 aday sahanın ölçümleri ve OHRC sıralaması (kaynak [1], Şekil 5) |

## Özet

- 4 km × 2,4 km, inişin hedeflendiği alan değil, **aracın son havada asılı kaldığı noktadaki konum sapmasını kapsayan alandır.** Alanın her yerinde güvenli bir iniş noktası olmalıydı.
- Seçim üç aşamalı bir eleme: LOLA eğim ve gölge haritası üzerinde kayan 4 × 2,4 km pencere ile 20 aday, orta çözünürlüklü verilerle 8 aday, OHRC stereo DEM ile 3 aday, sonra ana (PLS) ve yedek (ALS) iniş yeri.
- Puanlamada ISRO ağırlık yayımlamadı. Elimizdeki 8 adaylık tabloda sıralamayı neredeyse tek başına **boş 24 m × 24 m güvenli kare sayısı** belirliyor (bölüm 4).
- Aynı OHRC tehlike haritası araca yüklendi; araç inişte 150 m'de bu haritadan güvenli kare seçti ve hedefe yaklaşık 353 m mesafede indi.

## 1. Alan neden 4 km × 2,4 km?

Chandrayaan-2'de hedef 500 m × 500 m idi. SAC ekibi Chandrayaan-3 için şöyle yazıyor [1]:

> "the landing area needs to be increased from 500m x 500m to 4km x 2.4km to cater all the dispersions in along and across track position of lander at hovering point."

İki gerekçe var:

1. **Navigasyon sapması.** Araç havada asılı kalma noktasına uzun eksende ve yan eksende sapmayla gelebilir. Alan bu sapmanın tamamını kapsamalı.
2. **Chandrayaan-2 enkazı.** Chandrayaan-2 sert iniş yaptı; enkaz eski hedef bölgedeki güvenli alanı küçülttü [1].

Yörünge geometrisi: iniş manevrası, iniş noktası tam yörünge izinin altında kalacak şekilde tasarlandı, bu yüzden yan yönde düzeltme gerekmedi [7]. Retargeting rehberliği simülasyonda hedefi 3,027 km kaydırabildi [6]. Uzun eksenin (4 km) yörünge yönünde olduğu bu bilgilerden çıkarılan bir sonuçtur; kaynaklarda açıkça yazmıyor.

Basında farklı ölçüler geçiyor: ISRO başkanı S. Somanath "4 km × 2,5 km" ve "4,5 km × 2,5 km" dedi [10][11]. Teknik yayınların hepsi 4 km × 2,4 km diyor [1][2][3][4].

## 2. Eleme aşamaları

| Aşama | Veri | İşlem | Kalan |
|---|---|---|---|
| 0 | Chandrayaan-2'nin 70–80° G'deki 3 adayı | 4 × 2,4 km'lik güvenli alan bulunamadı; arama 60–70° G'ye kaydırıldı | 0 |
| 1. Kaba tarama | LOLA DEM (30 m ızgara), SELENE görüntüleri | 60–70° G, ön yüz bandının (±1° pay) tehlike haritası çıkarıldı. 4 × 2,4 km kayan pencere haritanın tamamında gezdirildi; tehlikeli alanı en az olan pencereler seçildi | 20 |
| 2. Orta çözünürlük | LOLA DEM, SELENE DEM ve orto görüntü, LRO NAC | En yüksek güvenli alan yüzdesi, güneş alan alan ve doğu boylamı kısıtı | 8 |
| 3. OHRC | Chandrayaan-2 OHRC stereo (32 cm'den iyi piksel), DEM 0,32 m ızgara, 0,05 m yükseklik çözünürlüğü | Arazi, güneş ve enlem ölçütleriyle sıralama; ardından 24, 36 ve 48 m güvenli karelerin dağılımı | 3, sonra PLS ve ALS |

Kaynak: [1], [3]. OHRC DEM'leri ISRO'nun OPTIMUS yazılımıyla üretildi [3].

Seçilen yerler:

| | Enlem | Boylam | Not |
|---|---|---|---|
| PLS (ana, LS-2) | 69,367621° G | 32,348126° D | Manzinus U ve Boguslawsky M kraterleri arası [1][3] |
| ALS (yedek) | 69,497764° G | 17,330409° B | PLS'nin ~450 km batısı [4] |
| Gerçek iniş (Shiv Shakti) | 69,373560° G | 32,319750° D | [6] |

Gerçek iniş noktası ile PLS merkezi arasındaki büyük çember mesafesi (Ay yarıçapı 1737,4 km): **yaklaşık 353 m.** Somanath "300 m içinde" demişti [11].

## 3. Eşik değerleri

| Ölçüt | Kaba tarama [1] | OHRC final [1][3] | Araç üstü tehlike haritası [2] | Chandrayaan-2 final [5] |
|---|---|---|---|---|
| Yerel eğim | < 10° | < 10° | > 10° ise güvensiz | < 15° |
| Bölgesel eğim | ekvatora doğru | – | – | – |
| Kaya | ≤ 2 m | < 0,32 m | > 32 cm ise güvensiz | < 0,5 m |
| Krater | asgari krater ve kaya dağılımı | krater ve kaya dağılımı | > 1,2 m ise güvensiz | krater ve kaya dağılımı |
| Güneş alma | alanın > %90'ı 10–11 gün | ≥ 11–12 gün | iniş anında gölge varsa güvensiz | ≥ 14 gün |
| Dünya ile telsiz | ön yüz, güney kutup bölgesi | görüş var | 14 gün iletişim ve sürekli aydınlanma [2] | ön yüz |
| Uzun gölge | – | çevre arazi uzun süre gölge yapmamalı | – | aynı |
| Güvenli kare | – | 24 m × 24 m karelerin 4 × 2,4 km'ye dağılımı | en az 24 m × 24 m | – |

Eşikler aşamadan aşamaya sıkılaşır; aynı ölçüt için farklı sayılar görülmesinin nedeni budur. Chandrayaan-2'de iniş elipsi önce 16 km × 10 km, sonra 32 km × 11 km olarak alınmıştı [5].

PRL ekibi ek olarak bilimsel ölçütleri sayar: bileşim, yerel jeoloji ve ısıl ortam [3]. PLS'nin özellikleri: alanın yaklaşık %78'inde eğim < 4°, ortalama yükseklik farkı ~169 m, yayla tipi toprak, Diviner verisinde ~30 K mekânsal ve ~175 K günlük sıcaklık farkı [3]. ALS'de eğim < 7°, alanın yaklaşık %75'i tehlikesiz [4].

## 4. Puanlama

### 4.1 Sekiz adayın karşılaştırması

Kaynak [1], Şekil 5. Tablo PDF'te resim olarak duruyor; elle yazıldı ve [sites.csv](sites.csv) dosyasına aktarıldı.

| LS | Enlem | Boylam | Yükseklik (m) | Ortalama eğim (°) | Güvenli alan (%) | Krater > 1,2 m / km² | Boş 24 m kare | Sıra |
|---|---|---|---|---|---|---|---|---|
| **2** | −69,36 | 32,34 | 533 | **4,27** | **88,61** | **280** | **3901** | **1** |
| 6 | −70,82 | 22,81 | 866 | 5,57 | 83,27 | 362 | 3585 | 2 |
| 7 | −65,20 | 20,26 | −701 | 6,82 | 74,11 | 302 | 3455 | 3 |
| 8 | −64,08 | 39,62 | −1124 | 5,27 | 80,60 | 295 | 3447 | 4 |
| 3 | −68,89 | 41,32 | 225 | 6,10 | 82,88 | 306 | 1247 | 5 |
| 4 | −66,29 | 31,82 | 1210 | 5,25 | 81,38 | 415 | 1404 | 6 |
| 1 | −62,19 | 56,73 | −435 | 6,07 | 81,20 | 382 | 571 | 7 |
| 5 | −68,59 | 20,98 | 615 | 6,61 | 82,19 | 386 | 108 | 8 |

### 4.2 Tablodan çıkarım

Bu bölüm kaynaklarda yazmıyor; tablonun yorumudur.

- Sıralama, boş 24 m kare sayısına göre yapılan sıralamayla neredeyse aynı. Tek istisna LS-3 ile LS-4: LS-4'ün karesi biraz daha fazla ama krater yoğunluğu (415) ve eğimi daha kötü.
- Güvenli alan yüzdesi sıralamayı açıklamıyor. LS-7 %74,11 ile en düşük yüzdeye sahip ama 3. sırada; LS-5 %82,19 ile 8. sırada, çünkü sadece 108 boş karesi var.
- Yani ölçülen "ne kadar alan güvenli" değil, **"güvenli alan, aracın inebileceği büyüklükte ve alana yayılmış parçalar halinde mi"**.

### 4.3 100 m erişilebilirlik ızgarası

Son 3 aday arasında karar için ek ölçüt [1]: alan 100 m aralıklı noktalara bölünür (41 × 24 nokta) ve her nokta için "100 m içinde kaç boş 24 m kare var" sayılır (kaynak [1], Şekil 4). Değeri 0 olan nokta, aracın oraya gelirse kaçacak yer bulamayacağı noktadır. LS-2 bu ölçütte seçildi: alanın her yerinde, havada asılı kalma noktasından 100 m içinde inilebilecek bir kare var.

## 5. Uçuşta kullanım (HDA)

Kaynak [2]:

- OHRC DEM'inden **ikili tehlike haritası** üretildi (1 tehlikeli, 0 güvenli), 4 m ızgara aralığı. Referans görüntü 28 cm OHRC orto görüntüsü.
- PLS'de **3901** boş 24 m × 24 m kare vardı (bölüm 4.1 ile aynı sayı).
- **3B mod:** araç 150 m'de 22 saniyeye kadar havada asılı kalır. Kamera görüntüsü OHRC görüntüsüyle eşleştirilir (ölçek, dönme, kayma ve bulanıklığa dayanıklı özellik eşleştirme; 2,5 kata kadar ölçek farkı). Konum bulununca kayıtlı haritadan güvenli kare seçilir: aracın tam altında, kamera karesiyle araç arasındaki "kör bölge"de ya da kamera karesi içinde.
- **2B mod (yedek):** eşleştirme başarısız olursa araç anlık görüntüden kendi tehlike haritasını hesaplar.
- Kare seçilince araç 60 m irtifaya, güvenli noktanın üstüne kayar, sonra −1 m/s ile iner [6][7].

İniş sırası [6][7]: kaba frenleme 30 km'den 7,4 km'ye, 10 s duruş, ince frenleme 800 m'ye, 12 s havada asılı kalma, dikey iniş 150 m'ye, ≤ 22 s tehlike taraması, 60 m'ye retargeting, 10 m'ye kadar −1 m/s, temas.

## 6. Veri setleri

| Veri | Durum | Nerede |
|---|---|---|
| 8 aday tablosu | Açık | [sites.csv](sites.csv), kaynak [1] Şekil 5 |
| 8 adayın özellik tablosu | Makalenin ek materyali, erişilmedi | [3], ek Tablo 1 |
| OHRC ham görüntüleri, Chandrayaan-2 SPICE dosyaları | Açık, kayıt gerekli | [ISRO PRADAN](https://pradan.issdc.gov.in/ch2/) |
| ISRO'nun OHRC DEM'leri ve tehlike haritaları | **Yayımlanmamış** [8] | – |
| Açık 0,30 m OHRC DEM, iniş yeri çevresi 2,18 × 2,24 km | İş akışı belgesi açık; DEM makale kabulünde yayımlanacak | [8], Zenodo [10.5281/zenodo.18634148](https://doi.org/10.5281/zenodo.18634148) |
| LROC NAC DTM, iniş yeri, ~3 m | Açık | `NAC_DTM_VIKRAMSITE1` [8] |
| LOLA DEM, Diviner | Açık | [data-sources](../data-sources/README.md) |

## 7. Bizim projeye uyarlama

Yöntem açık verilerle kopyalanabilir. Çözünürlük farkı: OHRC 32 cm'lik kayayı görür; NAC DTM ve LOLA ile kaya tespiti yapılamaz, sadece eğim ve gölge ölçütleri kalır.

1. **Tehlike haritası.** DEM'den eğim: $s = \arctan\sqrt{(\partial z/\partial x)^2 + (\partial z/\partial y)^2}$. Hücre tehlikeli ise $H=1$: $s > 10°$ ya da iniş anında gölgede (ufuk maskesi, [zamanda-degisen-veri-hazirlama.md](../zamanda-degisen-veri-hazirlama.md)).
2. **Güvenli kare.** $k = 24\,\text{m} / \Delta$ hücrelik pencere içinde hiç tehlikeli hücre yoksa kare güvenlidir. İntegral görüntü $I$ ile her kare için $O(1)$: $\sum H = I(i{+}k,j{+}k) - I(i,j{+}k) - I(i{+}k,j) + I(i,j)$, güvenli ise $=0$.
3. **Aday bulma.** 4 × 2,4 km pencereyi kaydırıp her konum için güvenli alan yüzdesi, boş kare sayısı, ortalama eğim ve güneş alan gün sayısını hesapla.
4. **Erişilebilirlik.** 100 m aralıklı her nokta için 100 m yarıçapta boş kare sayısı $N(p)$. $\min_p N(p) > 0$ şartı ve $N$'nin dağılımı adayları ayırır.
5. **Sıralama.** ISRO ağırlık yayımlamadı. Bölüm 4.2'ye uygun bir başlangıç: önce $\min_p N(p) > 0$ şartı, sonra boş kare sayısı, eşitlikte eğim ve krater yoğunluğu. Ağırlıklar uygulamada kullanıcıya açık bırakılabilir.

## Kaynaklar

1. Amitabh, K. Suresh, A. K. Prashar, A. S. A. Z. (2023). *Terrain Characterisation of Potential Landing Sites for Chandrayaan-3 Lander using OHRC Images.* 54th LPSC, abstract #1037. <https://www.hou.usra.edu/meetings/lpsc2023/pdf/1037.pdf>
2. K. Suresh, Amitabh (2024). *An Approach for Chandrayaan-3 Lander Hazard Detection and Avoidance.* 55th LPSC, abstract #2250. <https://www.hou.usra.edu/meetings/lpsc2024/pdf/2250.pdf>
3. K. Durga Prasad vd. (2023). *Contextual characterization study of Chandrayaan-3 primary landing site.* MNRAS Letters 526, L116. doi:10.1093/mnrasl/slad106. <https://academic.oup.com/mnrasl/article/526/1/L116/7236874>
4. K. Durga Prasad vd. (2024). *Chandrayaan-3 alternate landing site: pre-landing characterization.* Current Science 126(7), 774. <https://www.currentscience.ac.in/Volumes/126/07/0774.pdf>
5. Amitabh, K. Suresh, T. P. Srinivasan (2018). *Potential Landing Sites for Chandrayaan-2 Lander in Southern Hemisphere of Moon.* 49th LPSC, abstract #1975. <https://www.hou.usra.edu/meetings/lpsc2018/pdf/1975.pdf>
6. S. Kumar vd. (2026). *Real-Time Retargeting Using Controllability Boundary for Chandrayaan-3 Lunar Landing.* arXiv:2605.29412. <https://arxiv.org/abs/2605.29412>
7. *Powered Descent Trajectory Optimization of Chandrayaan-3 using Radau Collocation and Controllable Sets.* arXiv:2511.03594. <https://arxiv.org/abs/2511.03594>
8. C. Tungathurthi (2026). *Geodetically Anchored 0.30 m DEM of the Chandrayaan-3 Vikram Landing Site from Chandrayaan-2 OHRC Stereo Imagery.* arXiv:2602.14993. <https://arxiv.org/abs/2602.14993>
9. K. Suresh, Amitabh, D. Dhar (2024). *Computer vision-based technique for Chandrayaan-3 lander hazard detection and avoidance (HDA).* Journal of Aerospace Sciences and Technologies 76, 318. doi:10.61653/joast.v76i3A.2024.1005 (okunmadı; [8]'de atıf olarak geçiyor)
10. Deccan Herald, Chandrayaan-3 iniş alanı haberi (500 m → 4 × 2,5 km). <https://www.deccanherald.com/amp/story/science%2Fwith-more-fuel-fail-safe-measures-for-smooth-touchdown-chandrayaan-3-to-leap-towards-moon-on-july-14-1235691.html>
11. Outlook India, Somanath açıklaması. <https://www.outlookindia.com/national/lander-vikram-touched-down-within-the-area-identified-on-lunar-surface-says-isro-chairman-news-313243>
