# Rover Modelleme ve Unreal'a Geçiş

Blender'da modellenen bir rover'ın Unreal Engine 5'e aktarılıp Ay koşullarında çalışan bir dijital ikize dönüştürülmesi üzerine araştırma notları. Cesium for Unreal ile LOLA DEM tabanlı arazi entegrasyonunu da kapsar.

> Not: Bu belgedeki literatür değerleri ve rover özellikleri kullanılmadan önce birincil kaynaklardan teyit edilmelidir. Görseller Grok ile üretilmiştir ve temsilidir.

## İçindekiler

1. [Temel karar](#1-temel-karar)
2. [FBX doğrudan çalışan bir rover vermez](#2-fbx-doğrudan-çalışan-bir-rover-vermez)
3. [Kavramlar: Static Mesh, Skeletal Mesh, Bone](#3-kavramlar-static-mesh-skeletal-mesh-bone)
4. [Fizik motoru: Ay ile Dünya farkı ve tekerlek malzemesi](#4-fizik-motoru-ay-ile-dünya-farkı-ve-tekerlek-malzemesi)
5. [Zemin etkileri ve Bekker-Wong modeli](#5-zemin-etkileri-ve-bekker-wong-modeli)
6. [Rocker-bogie süspansiyon](#6-rocker-bogie-süspansiyon)
7. [Cesium ve Landscape iş bölümü](#7-cesium-ve-landscape-iş-bölümü)

---

## 1. Temel karar

| Bileşen | Rolü |
|---|---|
| Blender | Rover modelleme ve rigging (bone kurma). NASA 3D Resources'taki hazır rover modelleri başlangıç olarak kullanılabilir; lisans koşulları kontrol edilmeli. |
| Unreal Engine 5 | Simülasyon, fizik (Chaos) ve görselleştirme. |
| Cesium for Unreal | Ay arazisinin büyük ölçekli, enlem/boylamlı gösterimi. Ayrı bir platform değil, Unreal'a kurulan bir plugin; her şey tek projede çalışır. |
| Veri | LOLA DEM (Lunar Orbiter Laser Altimeter yükseklik modeli). 5 m/px yalnızca 87,5° enlemden kutba kadar var; 85°'den 10 m, 80°'den 20 m. |

### Kapsam

Projenin ana konusu **iniş bölgesi seçimi**. Rover simülasyonu bu analizi destekleyen bir özellik; iniş noktasının çevresinde bir rover'ın gerçekten gezip gezemeyeceğini gösterir. Zamanın büyük kısmını yememesi için kademeli geliştirilir:

1. **Aşama 1:** Tek rover, düz zeminde sürülebilir halde.
2. **Aşama 2:** Gerçek Ay arazisi (LOLA DEM'den üretilmiş Landscape) üzerinde sürüş.
3. **Aşama 3:** Birden fazla rover profili ve karşılaştırma.

> Stack kararı (Unreal + Cesium + Blender) `docs/adr/` altına bir ADR olarak yazılmalı.

---

## 2. FBX doğrudan çalışan bir rover vermez

FBX bir **taşıma formatıdır**: modelin görünüşünü ve parça yapısını taşır, davranışını taşımaz.

| FBX ile gelir | FBX ile gelmez, Unreal'da kurulur |
|---|---|
| Mesh (geometri) | Fizik: kütle, sürtünme, çarpışma |
| Materyal ve UV | Sürüş mantığı: motor torku, direksiyon |
| İskelet (bone) ve hiyerarşi | Süspansiyon davranışı |
| Animasyonlar (varsa) | Ay yerçekimi, regolit zemin, rover'a özel parametreler |

### Blender'da export'tan önce

- Rover'ı **Skeletal Mesh** olarak hazırla.
- Bone hiyerarşisi: `root → chassis → rocker → bogie → wheel_XX`.
- Ön yön +X olsun; **Apply Transforms** yap.
- Birim farkı: Blender metre, Unreal santimetre kullanır. Export ölçeğini ayarla.
- Basit çarpışma mesh'leri ekle (`UCX_` önekiyle).

### Unreal'da

- **Chaos Vehicles** plugin'ini aç, `WheeledVehiclePawn` tabanlı bir Blueprint oluştur.
- Skeletal mesh için **Physics Asset** hazırla.
- Her tekerlek için bir **Wheel** sınıfı tanımla: yarıçap, süspansiyon, sürtünme.
- Vehicle Movement Component'te kütle, tork eğrisi ve vites ayarlarını yap.
- Ay yerçekimi: World Settings'te **-162 cm/s²** (Dünya'da -980).

---

## 3. Kavramlar: Static Mesh, Skeletal Mesh, Bone

**Mesh**, bir 3D modelin üçgenlerden oluşan geometrisidir. Unreal'da iki türü vardır.

### Static Mesh

Tek parça, katı bir model. Kendi içinde hiçbir kısmı hareket etmez; ancak bütün olarak taşınıp döndürülebilir. Kaya, iniş modülü gövdesi, bina gibi nesneler için kullanılır.

_(Image removed: an AI-generated concept image of a Static mesh rover, made with Grok during research; removed from the repository because it carried no AI watermark.)_

### Skeletal Mesh

İçinde görünmez bir **iskelet** taşıyan model. İskelet, **bone** (kemik) denen eklemlerden oluşur. Mesh'in her parçası bir bone'a bağlıdır; bone dönünce ona bağlı geometri de döner. Rover'da tekerlek bone'u dönünce tekerlek döner, rocker bone'u eğilince kol eğilir. **Rover bu türde olmalı.**

_(Image removed: an AI-generated concept image of a Skeletal mesh rover, made with Grok during research; removed from the repository because it carried no AI watermark.)_

*Yarı saydam gövdenin içinde mavi bone iskeleti. Eklemlerdeki oklar, bu noktaların bağımsız dönebildiğini gösterir.*

### Root bone ve hiyerarşi

Root, iskeletin en tepesindeki ana bone'dur; diğer bütün bone'lar ona bağlıdır. Rover'ın dünyadaki konumu ve yönü bu bone'dan okunur.

```
root
 └── chassis (gövde)
      ├── rocker_L
      │    ├── wheel_FL  (ön sol)
      │    └── bogie_L
      │         ├── wheel_ML  (orta sol)
      │         └── wheel_RL  (arka sol)
      └── rocker_R   (sağ taraf, aynısı)
```

Chaos Vehicles tekerlekleri **bone adıyla** bulur. Tekerleklere bone verilmezse Unreal hangi parçanın tekerlek olduğunu bilemez.

---

## 4. Fizik motoru: Ay ile Dünya farkı ve tekerlek malzemesi

### Fizik motorunu dışarıdan import etmiyoruz

**Chaos**, Unreal'ın kendi içinde gelen fizik motorudur. Chaos Vehicles da onun üstüne kurulu, Unreal ile birlikte gelen bir plugin; sadece açmak yeterli.

### Aynı rover Ay'da ve Dünya'da farklı mı davranır?

Fizik yasaları aynıdır, değişen **parametrelerdir**.

| Chaos'un yerçekimini değiştirince kendiliğinden hesapladıkları | Chaos'un bilmediği, ayrıca ayarlanması gerekenler |
|---|---|
| Ağırlık ve zemine basma kuvveti (normal kuvvet) 1/6'ya düşer. | **Atmosfer yok:** Vehicle Movement'taki hava direnci (Drag Coefficient) **0** olmalı. |
| Sürtünme kuvveti `F = μ × N` olduğu için tutuş da 1/6'ya düşer; rover daha kolay kayar, frenleme mesafesi uzar. | **Süspansiyon yayları Dünya'ya göre ayarlı:** Ay'da gereğinden sert kalır, rover zıplar. Yay sertliğini yaklaşık 1/6 ölçeğinde yeniden ayarla. |
| Süspansiyon daha az sıkışır; tümseklerde rover daha uzun süre havada kalır. | **Zemin deforme olur:** Chaos zemini sert yüzey sayar; regolit gevşek ve tanelidir. Bunu Bölüm 5'teki Bekker-Wong modeli karşılar. |
| | **Sıcaklık:** Ay'da yaklaşık -170°C ile +120°C arası değişir; malzeme ve batarya davranışını etkiler. Chaos'ta karşılığı yok. |

### Plastik ve kauçuk tekerleği ayırt edebilir mi?

Evet, ama değerleri biz vermeliyiz. Unreal "kauçuk, regolit üstünde nasıl davranır" bilgisini kendiliğinden bilmez.

**Unreal'daki karşılıkları:**

- **Physical Material:** Tekerleğe ve zemine ayrı malzemeler atanır. Unreal ikisinin sürtünmesini bir birleştirme kuralıyla (ortalama, minimum, çarpım veya maksimum) birleştirir.
- **Tire Config (Chaos):** Lastik başına sürtünme çarpanı, zemin tipine göre ayrı çarpanlar, viraj sertliği ve kayma eşikleri tanımlanır. Plastik ve kauçuk için iki ayrı Tire Config oluşturulur.

**Önemli fark: asfalt değil, regolit.** Asfaltta tekerlek malzemesi çok önemlidir. Gevşek regolitte ise tutuşu çoğunlukla **zeminin kayma direnci** belirler. Malzemenin etkisi esas olarak iki yoldan gelir:

1. **Tekerlek-zemin arayüz sürtünmesi (δ):** Pürüzlü yüzey ve tırnaklar (grouser) tutuşu artırır.
2. **Esneklik:** Kauçuk tekerlek yük altında yassılır, temas alanı büyür, daha az batar. Sert plastik tekerlek daha çok batar.

| Özellik | Sert plastik tekerlek | Kauçuk tekerlek | Tel örgü (Apollo LRV) |
|---|---|---|---|
| Temas alanı | Küçük | Büyük (yassılır) | Büyük (esner) |
| Batma | Fazla | Az | Az |
| Arayüz sürtünmesi | Düşük, tırnak gerekir | Yüksek | Titanyum tırnaklarla yüksek |
| Ay koşullarına dayanım | Sıcaklıkla kırılganlaşabilir | Vakum, UV ve aşırı sıcaklıkta bozulur | Dayanıklı; bu yüzden seçildi |

> Apollo'nun Ay aracı (LRV), kauçuğun Ay koşullarında bozulması nedeniyle titanyum tırnaklı **tel örgü** tekerlek kullandı.

---

## 5. Zemin etkileri ve Bekker-Wong modeli

### Unreal'da hazır gelenler

**Physical Material**: sürtünme, statik sürtünme, esneklik (restitution), yoğunluk. Landscape katmanlarına (ince regolit, kaya, krater kenarı) ayrı ayrı atanır; tekerlek hangi katmana basıyorsa o katmanın değerleri kullanılır.

### Terramechanics nedir?

Tekerlek ya da paletin **gevşek zeminle** (kum, toprak, kar, regolit) etkileşimini inceleyen mühendislik dalı. **M. G. Bekker** (1950-60'lar) ve **J. Y. Wong** (*Theory of Ground Vehicles*) bunun temel yarı-ampirik modellerini kurdu. Apollo LRV'nin tasarımında da bu modeller kullanıldı. Model dört soruyu cevaplar:

1. Tekerlek ne kadar batar?
2. Batmanın yarattığı direnç ne kadar?
3. Zemin en fazla ne kadar itiş verebilir?
4. Kayma (slip) ile itiş nasıl değişir?

### a) Tekerlek ne kadar batar?

```
p = (k_c / b + k_φ) × z^n
```

| Sembol | Anlamı |
|---|---|
| p | Zemine uygulanan basınç |
| z | Batma derinliği |
| b | Tekerlek genişliği |
| k_c | Kohezif modül (zeminin yapışkanlığı) |
| k_φ | Sürtünmesel modül (taneli direnç) |
| n | Zemin üssü |

Tekerleğe binen yük `W` bu basınçla dengelenince batma bulunur. Rijit tekerlek için yaklaşık formül (`D`: tekerlek çapı):

```
z ≈ [ 3W / ((3 − n) × (k_c + b × k_φ) × √D) ]^(2 / (2n + 1))
```

Geniş ve büyük çaplı tekerlek daha az batar.

### b) Batmanın yarattığı direnç

Batan tekerlek, önündeki zemini sürekli sıkıştırmak zorundadır. Buna **sıkıştırma direnci** denir:

```
R_c = b × (k_c / b + k_φ) × z^(n+1) / (n + 1)
```

Bu kuvvet rover'ı geriye çeker. Düz zeminde bile motor bu direnci yenmek için enerji harcar.

### c) Zeminin verebileceği en büyük itiş

Tekerlek zemini arkaya doğru keserek ilerler. Zeminin kayma dayanımı (Mohr-Coulomb):

```
H_max = A × c + W × tan(φ)
```

`A`: temas alanı · `c`: kohezyon · `φ`: iç sürtünme açısı

### d) Kayma (slip) ile itiş

```
s = 1 − v / (ω × r)
```

`v` rover'ın gerçek hızı, `ω × r` tekerleğin dönme hızı. `s = 0` kaymasız, `s = 1` tekerlek yerinde dönüyor demek. İtiş kayma ile artar ve `H_max`'a yaklaşır (Janosi-Hanamoto):

```
H(s) = H_max × [1 − (K / (s × L)) × (1 − e^(−s × L / K))]
```

`L`: temas uzunluğu · `K`: kayma deformasyon modülü

### Sonuç: net çekiş (drawbar pull)

```
DP = H(s) − R_c
```

- `DP > 0` ise rover ilerler.
- Eğimde tırmanma koşulu: `DP > W × sin(θ)`. Sağlanmazsa rover kayar ya da gömülür.

> **Ay'a özel sonuç:** `W × tan(φ)` terimi ağırlıkla orantılı olduğu için Ay'da 1/6'ya düşer; `A × c` (kohezyon) terimi ise yerçekiminden bağımsızdır. Bu yüzden Ay'da itişte **kohezyonun ve temas alanının payı Dünya'ya göre çok daha büyüktür**: geniş tekerlek ve tırnak daha da önemli hale gelir. `W` küçüldüğü için batma da azalır.

### Regolit için literatür değerleri

| Parametre | Değer |
|---|---|
| n | 1 |
| k_c | 1.4 kN/m^(n+1) |
| k_φ | 820 kN/m^(n+2) |
| c (kohezyon) | ≈ 0.17 kPa (0.1–1 kPa aralığı) |
| φ (iç sürtünme açısı) | ≈ 35° (30–50° aralığı) |
| K | ≈ 1.8 cm |

Wong'un kitabı ve Apollo verilerinde sık geçen değerler; kullanmadan önce kaynakla teyit edilmeli.

### Unreal'a nasıl uygulanır?

Her tekerlek için her karede (tick):

1. Chaos'tan tekerlek yükünü (süspansiyon kuvveti), tekerlek ve rover hızlarını al.
2. `z`, `R_c`, `s` ve `H(s)` değerlerini hesapla.
3. Sonucu uygula:
   - **Basit yol (önerilen):** Bekker değerlerini tekerleğin sürtünme çarpanına ve ek yuvarlanma direncine çevir; Chaos gerisini yönetir.
   - **Doğru yol:** Chaos lastik sürtünmesini nötre çek, Bekker kuvvetlerini `AddForceAtLocation` ile temas noktasına uygula.
4. Görsel olarak tekerlek mesh'ini `z` kadar aşağı kaydır; istenirse Landscape'e iz (decal) bırak.

### Kendi yazılacak diğer etkiler

| Etki | Basit model |
|---|---|
| Tekerlek aşınması | `aşınma += kayma × yük × aşındırıcılık × dt` |
| Batarya | `tüketim = tork × ω + sabit_yük` |

### Veri odaklı yapı: iki Data Table

- **Zemin tablosu:** zemin tipi → k_c, k_φ, n, c, φ, K, sürtünme, aşındırıcılık
- **Rover tablosu:** rover → kütle, tekerlek çapı/genişliği/malzemesi, tırnak, tork, batarya, aşınma direnci

Dijital ikizin özü bu iki tablonun kesişimidir. Yeni rover eklemek için bir FBX ve tabloya bir satır yeterli olur.

**Öncelik:** eğim + Bekker kayması/batması + batarya. Sıcaklık, toz ve güneş açısı sonra eklenebilir.

---

## 6. Rocker-bogie süspansiyon

_(Image removed: an AI-generated concept image of a Rocker-bogie rover, made with Grok during research; removed from the repository because it carried no AI watermark.)_

*Ön tekerlek kayanın üstüne çıkmışken diğer tekerlekler yerde kalıyor ve gövde dengede duruyor.*

### Nedir, nereden çıktı?

1980'lerin sonunda NASA JPL'de geliştirilen, **yaysız**, 6 tekerlekli bir süspansiyon sistemi. Sojourner, Spirit, Opportunity, Curiosity ve Perseverance'ta kullanıldı. Ay'da doğrulanan örnek Hindistan'ın Pragyan rover'ıdır (Chandrayaan-3); Yutu ve Yutu-2 için bu bilgi doğrulanamadı.

### Parçaları

```
                 ┌──────── GÖVDE ────────┐
                 │   diferansiyel (üstte) │
                 └───────────┬───────────┘
                             │ (gövdeye mafsallı)
        ┌──────── ROCKER (büyük kol) ────────┐
        │                                     │
     ÖN TEKER                       ┌── BOGIE (küçük kol) ──┐
                                    │                        │
                                ORTA TEKER               ARKA TEKER
```

- **Rocker (büyük kol):** Her yanda bir tane, gövdeye mafsalla bağlı. Bir ucunda ön tekerlek, diğer ucunda bogie var.
- **Bogie (küçük kol):** Rocker'ın arka ucuna mafsalla bağlı. Orta ve arka tekerleği taşır.
- **Diferansiyel:** Sol ve sağ rocker'ı birbirine bağlar (Curiosity'de gövdenin üstündeki çubuk). Bir taraf yükselirse diğeri alçalır; gövde iki rocker açısının **ortalaması** kadar eğilir, yani engelin yarısı kadar.

### Neden bu kadar iyi?

- **6 tekerlek hep yerde:** Kollar serbest döndüğü için tekerlekler engelin şeklini takip eder; yük eşite yakın dağılır, tutuş korunur.
- **Büyük engel aşar:** Tekerlek çapı kadar ya da biraz daha yüksek kayaları geçebilir (Curiosity: ~50 cm tekerlek, ~65 cm engel).
- **Devrilmeye dayanıklı:** Curiosity ~45° yan yatmaya dayanacak şekilde tasarlandı; yazılım güvenlik için ~30° ile sınırlıyor.
- **Basit ve güvenilir:** Yay ve amortisör yok, bozulacak parça az.

### Zayıf yanı: yavaş hareket

Yay ve sönümleme olmadığı için **yavaş** hareket için tasarlanmıştır; Mars rover'ları saniyede birkaç santimetre gider. Hızlı gidildiğinde sarsıntıyı emecek bir şey yoktur, rover zıplar. Ay'da düşük yerçekimi bu zıplamayı artırır. Bu yüzden rover profillerine **maksimum güvenli hız** parametresi konmalı.

### Unreal'da görsel yaklaşım (önerilen)

Chaos'ta 6 tekerlek bağımsız ve uzun süspansiyonlu olur. Her karede tekerlek yüksekliklerinden kol açıları hesaplanıp Animation Blueprint'te bone'lara uygulanır:

```
bogie_açısı  = atan2(z_orta − z_arka, L_bogie)
bogie_pivot  = (z_orta + z_arka) / 2
rocker_açısı = atan2(z_ön − bogie_pivot, L_rocker)
gövde_pitch  = (rocker_sol + rocker_sağ) / 2   ← diferansiyel
gövde_roll   = sol − sağ teker ortalaması
```

Sonuç rocker-bogie gibi görünür ve fiziksel olarak yeterince yakın davranır.

### Mekanik yaklaşım (önerilmez)

Gövde, rocker ve bogie ayrı rigid body olur, menteşe Physics Constraint'leriyle bağlanır. Chaos Vehicles ile uyumlu değil; tekerlek fiziğini sıfırdan yazmak gerekir ve günler sürer.

---

## 7. Cesium ve Landscape iş bölümü

Cesium for Unreal ayrı bir platform değildir. Aynı Unreal level'ında yan yana duran actor'lar olarak düşünülmeli:

```
Unreal Level (tek sahne)
 ├── CesiumGeoreference    → sahnenin Ay üzerindeki konumu (enlem/boylam ↔ Unreal koordinatı)
 ├── Cesium3DTileset       → Ay arazisi; yaklaştıkça detay akar
 ├── Landscape             → seçilen bölgenin 5 m DEM'inden sürüş alanı
 ├── Rover (Skeletal Mesh) → Chaos Vehicles ile sürülen rover
 └── Işık, kamera, UI ...
```

İkisi de aynı fizik motorunu, aynı ışığı ve aynı kamerayı kullanır.

| | Cesium 3D Tileset | Unreal Landscape |
|---|---|---|
| Görev | Tüm Ay görünümü, iniş bölgesi seçimi | Seçilen bölgede rover sürüşü |
| Güçlü yanı | Enlem/boylam, büyük alan, akış | Physical Material boyama, kararlı fizik |
| Zayıf yanı | LOD değiştikçe çarpışma mesh'i değişir; zemine göre malzeme atamak zor | Yaklaşık 40 km ile sınırlı (5 m'de ~8k×8k vertex) |

### Geçiş akışı

1. Kullanıcı Cesium ile tüm Ay'ı görür ve iniş bölgelerini inceler.
2. Bir bölge seçince kamera oraya iner; **Cesium Sub-Level** ile o bölgenin Landscape, kaya ve rover içeriği yüklenir.
3. Landscape'in altında kalan Cesium arazisi **Cartographic Polygon** ile kesilip gizlenir; iki zemin görüntüde üst üste binip titreşmez. Dikkat: gizleme fiziği etkilemez, gizlenen arazi çarpışmaya devam eder; Cesium tileset'inde "Create Physics Meshes" ayrıca kapatılmalı.

### Koordinat uyumu

`CesiumGeoreference` ile sağlanır. DEM kesitini Landscape'e çevirirken köşe koordinatları not edilmeli.

### 5 m/px uyarısı

Rover 2-3 metre boyunda olduğu için DEM rover ölçeğinde kaba kalır. Sürüş alanında DEM upsample edilmeli ve üstüne prosedürel kaya ve küçük kraterler (PCG) eklenmeli. Aksi halde rover pürüzsüz bir tepenin üstünde gidiyormuş gibi görünür.

> Ekip tek bir Unreal projesinde çalışır; Cesium sadece `Plugins` altında bir bağımlılık olur.
