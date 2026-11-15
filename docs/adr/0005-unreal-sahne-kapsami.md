# ADR-0005: Unreal 3D sahnesi: kapsam ve stack

- **Status:** Proposed
- **Date:** 2026-11-14
- **Related:** [ADR-0006](0006-unreal-veri-sozlesmesi.md), [rover-modelleme-ve-unreal-gecis.md](../research/rover-modelleme-ve-unreal-gecis.md), [light-heat-layer](../research/light-heat-layer/README.md), [data-sources](../research/data-sources/README.md) bölüm 11

## Context

Ekip yeni kapsamda rover ile ilgili her şeyi plandan çıkardı. 3D sahnenin görevi artık şunları doğru ve gerçekçi göstermek:

- Ay, Dünya ve Güneş (öncelik Ay ve Dünya)
- Ay çevresindeki uydular
- Dünya üzerindeki haberleşme istasyonları
- Birden fazla iniş bölgesi; her biri ayrı bir odak olarak

Doku ve mesh kalitesi yüksek olmalı. Elimizdeki 5 m/px LOLA DEM, iniş bölgesine yakın kamerada kaba kalıyor. Daha önce bireysel denemede detaylı saha modeli bu yüzden çıkarılamadı.

Repoda henüz bir motor ya da stack kararı yok.

## Decision

### 1. Stack

| Bileşen | Seçim |
|---|---|
| Motor | Unreal Engine 5 |
| Gezegen ölçeği arazi | Cesium for Unreal **2.7.0 veya üstü** (Ay elipsoidi desteği bu sürümle geldi) |
| Model düzenleme | Blender (yalnızca ölçek, eksen ve materyal düzeltmesi) |
| Model formatı | glTF/GLB (Unreal Interchange ile doğrudan; FBX Interchange desteği deneysel) |
| Ön hesap | Python ön hesap katmanı (efemeris, ufuk, görünürlük). Unreal hesap yapmaz, hazır dosya okur ([ADR-0006](0006-unreal-veri-sozlesmesi.md)). |

### 2. Kapsam

**Kapsamda:**

1. Ay küresi, uzaktan yakına üç katman (aşağıda).
2. Dünya küresi, atmosfer, gece ışıkları; Ay'dan bakınca doğru yön, açısal boyut (~1,9°) ve evre.
3. Güneş: efemeristen gelen yönlü ışık, ~0,53° disk.
4. Uydular: modelleri ve önceden hesaplanmış yörüngeleri.
5. Yer istasyonları: DSN (Goldstone, Madrid, Canberra) öncelikli, sonra diğer ağlar. Çanaklar Ay'a döner.
6. Birden fazla iniş bölgesi; her biri ayrı odak, Ay görünümünden kamera geçişiyle açılır.

**Kapsam dışı:** rover, Chaos Vehicles, Bekker-Wong, rocker-bogie, tekerlek ve batarya modeli. [rover-modelleme-ve-unreal-gecis.md](../research/rover-modelleme-ve-unreal-gecis.md) belgesinin 1–6. bölümleri artık uygulanmaz; 7. bölüm (Cesium ve Landscape iş bölümü) geçerli kalır.

### 3. Ay: üç ölçek katmanı

| Kamera mesafesi | Kaynak |
|---|---|
| Uzak (Ay'ın tamamı) | NASA SVS CGI Moon Kit: LROC renk + LOLA displacement (64/16/4 ppd) |
| Orta (yörüngeden inişe) | Cesium Moon Terrain (Cesium ion) |
| Yakın (iniş sahası) | Saha başına yerel yüksek çözünürlüklü arazi (madde 4). Altındaki Cesium arazisi Cartographic Polygon ile kesilir. |

Cesium Moon Terrain ile LOLA arasında ~2,5 km yükseklik farkı bildirildi (doğrulanmadı). Her sahada fark ölçülür ve [ADR-0006](0006-unreal-veri-sozlesmesi.md) `sites.json` içindeki `cesium_height_offset_m` alanına yazılır.

### 4. İniş sahası arazi detayı

Sıra şöyle:

1. **Önce en iyi gerçek veri:**
   - PGDA 104: 13 Artemis III bölgesi için NAC ile iyileştirilmiş 5 m SfS DEM'leri
   - PGDA 78: yüksek çözünürlüklü LOLA saha DEM'leri
   - LROC NAC ROI mozaikleri (~1 m/px): renk (albedo) dokusu
2. **Kalan açık, DLES/DUST (NASA, UE5) ve OmniLRS'in yayımlanmış yöntemiyle kapatılır:**
   - DEM 0,5–1 m/px'e bikübik büyütülür.
   - Krater boyut-frekans dağılımına göre küçük kraterler çevrimdışı olarak DEM'e işlenir (taze basit krater derinlik/çap ≈ 0,2).
   - Kaya konumları ayrı dosyaya yazılır; Unreal'da PCG ile Nanite kaya mesh'i olarak serpilir.
   - Yöntem makalelerden yeniden uygulanır; kod kopyalanmaz. OmniLRS'ten kod alınacaksa önce lisansı okunmalı.
3. **Sentetik detay yalnızca görseldir.**
   - Ufuk, aydınlanma ve iletişim hesapları gerçek DEM'den yapılır.
   - Arayüzde sentetik detay "temsili" olarak etiketlenir.

### 5. Ölçek

Dünya–Ay mesafesi tek sahnede gerçek ölçekte ve tam hassasiyetle tutulmaz.

- Sahne her zaman odaktaki cisme (Ay sahası, Ay küresi ya da Dünya istasyonu) göre kurulur.
- Uzak cisimler kameradan doğru **yön** ve doğru **açısal boyutta** ölçeklenmiş vekil (proxy) olarak çizilir.
- Saha başına `CesiumGeoreference` kökeni sahanın koordinatıdır.

### 6. Işık

- Ay sahnesinde atmosfer kapalı, gökyüzü siyah, pozlama sabit (manuel).
- Yakın gölgeleri motor çizer (Virtual Shadow Maps).
- Uzak ufkun gölgesi motorun gölge mesafesinin dışında kalır. Bu yüzden Güneş görünürlüğü Python'un ufuk maskesinden gelir ve ışığa çarpan olarak uygulanır ([ADR-0006](0006-unreal-veri-sozlesmesi.md) `sun_vis`).

### 7. Repo ve dosyalar

- Unreal projesi `unreal/` altında durur. `.uasset` ve `.umap` için Git LFS kullanılır.
- `.gitignore`'a `Binaries/`, `Intermediate/`, `Saved/`, `DerivedData/` eklenir.
- Ham veri (DEM, büyük dokular, Cesium önbelleği) repoya girmez. Bir indirme ya da üretim betiğiyle yerel `data/` klasörüne yazılır.

## Consequences

**Kazanılan:**

- Rover fiziği çıktığı için iş yükü sahne kalitesine ve challenge'ın asıl sorusuna (Güneş ve Dünya ufka göre nerede, iletişim ne zaman var) kayar.
- Hesap Python'da tek yerde kalır; Unreal ile web ya da rapor çıktıları aynı sayıları gösterir.

**Maliyet ve koşullar:**

- **Cesium ion:** hesabı gerekir.
- **Google Photorealistic 3D Tiles:**
  - İstasyon çevresi için kullanılırsa ekranda Google Maps logosu zorunludur.
  - Önbelleğe alma ve çevrimdışı kullanım yasaktır; demo internet ister.
  - Bing verisiyle aynı sahnede kullanılamaz.
- **NASA 3D Resources ve medya:** NASA logosu ve amblemi kullanılmaz; NASA onayı ima edilmez.
- **İndirme boyutu:** CGI Moon Kit 64 ppd yaklaşık 1 GB; Blue Marble ve NAC mozaikleri de büyüktür.

**Yapılacaklar (öncelik sırasıyla):**

| Öncelik | İş |
|---|---|
| P0 | Ay küresi (CGI Moon Kit); Dünya küresi ve SkyAtmosphere; efemerisle Güneş ve Dünya konumu; bir sahanın gerçek DEM'i ve NAC dokusu |
| P1 | Cesium Moon ile saha geçişleri; 2–3 saha; sentetik krater ve kaya detayı; DSN istasyonları (NASA DSN 70 m GLB) |
| P2 | Uydu yörüngeleri ve görüş hatları; Google 3D Tiles ile istasyon çevresi; Ames Stereo Pipeline ile kendi SfS DEM'imiz |

**Açık sorular:**

1. Teslim biçimi: paketlenmiş uygulama, Pixel Streaming ya da demo videosu.
2. Unreal projesi bu repoda mı (LFS ile), yoksa ayrı bir repoda mı?
3. Saha listesi. Öneri: Mons Mouton, Shackleton bağlantı sırtı, PGDA 104'te verisi olan bir Artemis bölgesi ve kutup dışından bir Apollo sahası.
4. MADNet 1 m NAC DTM'leri indirilebilir mi? Değilse yazarlara sorulabilir.
