# ADR-0006: Python ön hesap → Unreal veri sözleşmesi

- **Status:** Proposed
- **Date:** 2026-11-14
- **Related:** [ADR-0005](0005-unreal-sahne-kapsami.md), [light-heat-layer](../research/light-heat-layer/README.md) bölüm 5, [ephemeris-rotation-ground-stations](../research/ephemeris-rotation-ground-stations/README.md)

## Context

[ADR-0005](0005-unreal-sahne-kapsami.md)'e göre Unreal hesap yapmaz; efemeris, ufuk ve görünürlük Python ön hesabından hazır dosya olarak gelir. İki taraf ayrı kişilerce paralel geliştirileceği için dosya adları, alanlar, birimler ve çerçeveler önceden sabitlenmeli.

## Decision

### Ortak kurallar

| Konu | Kural |
|---|---|
| Konum | Üretilen dosyalar repo dışında, yerel `data/unreal/` altında. Repoya yalnızca küçük örnek dosyalar (`docs/` altında) girebilir. |
| Format | Meta ve zaman serileri JSON (UTF-8). Yükseklik haritası 16-bit gri PNG. Kaya listesi CSV. |
| Şema | Her JSON'un kökünde `"schema": "feza.unreal.<ad>/<sürüm>"`. Uyumsuz değişiklik = sürüm artışı + yeni ADR + `CONTRACT` mesajı. |
| Zaman | UTC, ISO 8601 (`2026-12-01T00:00:00Z`). Seriler sabit adımlı: `start_utc`, `step_s`, `n`; i. örnek = `start_utc + i·step_s`. |
| Açılar | Derece. Azimut kuzeyden saat yönünde, yükseklik (el) yerel ufka göre. Ay'da atmosfer yok, kırılma düzeltmesi yapılmaz. |
| Uzunluk | Konum vektörleri km, yükseklikler m. Santimetreye çevirmeyi Unreal yapar. |
| Ay koordinatları | Planetosentrik enlem/boylam, doğu pozitif. Gövde-sabit çerçeve `MOON_ME` (DE421 uyumlu). |
| Dünya koordinatları | İstasyonlar WGS84 enlem/boylam/yükseklik. Dönüş için `ITRF93`. |
| Dizi düzeni | Zaman serileri "dizi sütunları" biçiminde: her alan uzunluğu `n` olan bir dizi. |

### Dosyalar

| Dosya | İçerik | Üreten |
|---|---|---|
| `sites.json` | Saha listesi ve meta | Saha hazırlama betiği |
| `ephemeris/<site_id>.json` | Sahadan Güneş ve Dünya az/el, mesafe, görünürlük | M3 efemeris + M4 ışık takvimi |
| `bodies.json` | Küresel görünüm için Ay merkezli Güneş/Dünya konumu ve Dünya'nın dönüşü | Efemeris betiği |
| `satellites.json` | Uydu yörüngeleri | Efemeris betiği (Horizons/SPICE) |
| `stations.json` | Yer istasyonları, Ay'ın istasyondan az/el'i, görünürlük | `dsn_coverage.py` türevi |
| `comm_windows.json` | Saha başına iletişim pencereleri | M4 + istasyon görünürlüğü |
| `terrain/<site_id>/` | `height.png`, `terrain.json`, `albedo.png`, `rocks.csv` | Arazi betiği (gerçek DEM + sentetik detay) |

#### `sites.json`

```json
{
  "schema": "feza.unreal.sites/1",
  "sites": [
    {
      "id": "mons-mouton",
      "name": "Mons Mouton",
      "lat_deg": -84.78,
      "lon_deg": 29.13,
      "terrain_dir": "terrain/mons-mouton",
      "cesium_height_offset_m": 0.0,
      "sources": ["PGDA 104", "LROC NAC ROI"],
      "synthetic_detail": true
    }
  ]
}
```

`cesium_height_offset_m`: yerel DEM'i Cesium Moon arazisine oturtmak için ölçülen düzeltme (LOLA − Cesium). `synthetic_detail`: arayüzde "temsili detay" etiketini açar.

#### `ephemeris/<site_id>.json`

```json
{
  "schema": "feza.unreal.ephemeris/1",
  "site_id": "mons-mouton",
  "start_utc": "2026-12-01T00:00:00Z",
  "step_s": 3600,
  "n": 709,
  "sun_az_deg": [], "sun_el_deg": [], "sun_dist_km": [],
  "sun_vis": [],
  "earth_az_deg": [], "earth_el_deg": [], "earth_dist_km": [],
  "earth_phase": [],
  "earth_vis": []
}
```

- `sun_vis`: Güneş diskinin yerel ufuk maskesinin üstünde kalan kesri, 0–1. Unreal bunu Güneş ışığına çarpan olarak uygular; uzak ufkun gölgesini motor çizemez.
- `earth_phase`: sahadan görülen Dünya diskinin aydınlık kesri, 0–1.
- `earth_vis`: Dünya'nın ufuk maskesinin üstünde olup olmadığı, 0/1.

#### `bodies.json`

```json
{
  "schema": "feza.unreal.bodies/1",
  "frame": "MOON_ME",
  "start_utc": "2026-12-01T00:00:00Z",
  "step_s": 3600,
  "n": 709,
  "sun_pos_km": [[0, 0, 0]],
  "earth_pos_km": [[0, 0, 0]],
  "earth_rot_q": [[1, 0, 0, 0]]
}
```

`earth_rot_q`: `ITRF93`'ten `MOON_ME`'ye dönüş, birim kuaterniyon `[w, x, y, z]`. İstasyonlar Dünya küresine bu dönüşle yerleşir.

#### `satellites.json`

```json
{
  "schema": "feza.unreal.satellites/1",
  "frame": "MOON_ME",
  "start_utc": "2026-12-01T00:00:00Z",
  "step_s": 60,
  "n": 0,
  "satellites": [
    {
      "id": "lro",
      "name": "Lunar Reconnaissance Orbiter",
      "horizons_id": "-85",
      "model": "LRO.glb",
      "pos_km": [[0, 0, 0]]
    }
  ]
}
```

Unreal adımlar arasında doğrusal interpolasyon yapar. Gerekirse adım kısaltılır; Hermite interpolasyon için `vel_km_s` alanı sürüm 2'de eklenebilir.

#### `stations.json`

```json
{
  "schema": "feza.unreal.stations/1",
  "start_utc": "2026-12-01T00:00:00Z",
  "step_s": 600,
  "n": 0,
  "stations": [
    {
      "id": "dss-14",
      "name": "Goldstone DSS-14",
      "network": "DSN",
      "lat_deg": 0.0,
      "lon_deg": 0.0,
      "height_m": 0.0,
      "antenna_diameter_m": 70,
      "model": "DSN-70m.glb",
      "moon_az_deg": [],
      "moon_el_deg": [],
      "sees_moon": []
    }
  ]
}
```

Koordinatlar örnektir; gerçek değerler yayımlanmış istasyon listesinden alınır. `moon_az_deg` ve `moon_el_deg` çanağı Ay'a çevirmek için kullanılır.

#### `comm_windows.json`

```json
{
  "schema": "feza.unreal.comm-windows/1",
  "sites": {
    "mons-mouton": [
      { "start_utc": "2026-12-01T00:00:00Z", "end_utc": "2026-12-01T06:00:00Z", "via": "direct", "stations": ["dss-14"] }
    ]
  }
}
```

`via`: `direct` (sahadan Dünya'ya) ya da bir uydu `id`'si.

#### `terrain/<site_id>/`

| Dosya | İçerik |
|---|---|
| `height.png` | 16-bit gri. `h_m = z_min_m + (v / 65535) · (z_max_m − z_min_m)` |
| `terrain.json` | `width`, `height`, `pixel_m`, `z_min_m`, `z_max_m`, `crs` (PROJ dizgisi, güney kutbu için kutup stereografik), `origin_xy_m` (sol üst köşe), `origin_lat_deg`, `origin_lon_deg`, `real_pixel_m` (sentetik büyütmeden önceki gerçek çözünürlük), `sources` |
| `albedo.png` | NAC mozaiğinden renk dokusu, aynı ızgarada |
| `rocks.csv` | `x_m,y_m,diameter_m,seed`. Sentetik; Unreal PCG okur. |

Sentetik krater detayı `height.png` içine işlenir. Gerçek DEM ayrıca saklanır, hesaplarda yalnızca o kullanılır.

## Consequences

- Python ve Unreal tarafı birbirini beklemeden çalışabilir. Unreal tarafı başlangıçta elle yazılmış örnek dosyalarla ilerler.
- Bütün hesaplar tek yerde (Python) kalır; Unreal, web ve rapor aynı sayıları gösterir.
- Dosya boyutları küçük kalır (saatlik adım, 709 örnek). Uydu serileri dakikalık adımla büyüyebilir; gerekirse görüntülenen zaman aralığıyla sınırlanır.
- Şema değişikliği her iki tarafı da etkiler; bu yüzden sürüm alanı zorunludur.
- Yapılacaklar:
  1. `docs/` altına her dosya için küçük bir örnek eklemek.
  2. Python tarafında üretim betikleri.
  3. Unreal tarafında JSON okuyucu (Blueprint ya da C++).
