# Unreal Engine entegrasyonu

Ekibin web arayüzü (`frontend/`) Unreal Engine 5.8 içinde, gömülü bir WebBrowser widget'ında çalışır. Arayüzde seçilen saha (`site=`), an (`t=`) ve direk yüksekliği (`mast=`) Unreal sahnesini sürer: Güneş, Dünya, ufuk ve kamera yüksekliği değişir. Ay ve Dünya sahneleri arasındaki gezinme de Unreal tarafında yapılır.

Karar kaydı: [ADR-0005](../docs/adr/0005-unreal-sahne-kapsami.md), [ADR-0006](../docs/adr/0006-unreal-veri-sozlesmesi.md). Boru hattı ve UE 5.8 tuzakları: [docs/pipeline-notes.md](docs/pipeline-notes.md).

## Bu klasörde olanlar ve olmayanlar

| Var | Yok (repoya girmez) |
|---|---|
| `tools/` Python betikleri (efemeris, arazi, UE kurulum, çalışma anı `feza_runtime.py`, gökyüzü servisi) | `Content/` (uasset/umap), `data/`, `Saved/`, `Binaries/` |
| `FezaMoon/FezaMoon.uproject` ve `Config/*.ini` | büyük dokular, DEM'ler, render edilmiş medya |
| `Start_WebUI.bat`, `Open_FezaMoon.bat` | Unreal Content paketi (ayrıca zip olarak paylaşılır) |

Web tarafında yalnızca iki statik dosya eklendi: `frontend/public/ue-labels.html` (Unreal'in ikinci, saydam tarayıcı katmanı: etiketler) ve `frontend/public/ue-maps/` (2D harita görselleri). Frontend kaynak kodu değişmedi.

## Çalıştırma

Gerekenler: Unreal Engine 5.8, Node 22, Python 3.11+ (`skyfield`, `numpy`), Content paketi (`unreal/FezaMoon/Content/`).

1. Bir kez: `powershell -File unreal\tools\set_paths.ps1` (betiklerdeki sabit yolu bu klasöre çevirir).
2. `unreal\Start_WebUI.bat` — web arayüzü (127.0.0.1:5199) ve gökyüzü servisi (127.0.0.1:5198).
3. `unreal\Open_FezaMoon.bat` — Unreal'i açar; `Orbit` haritasında Play.

Unreal kurulu yolu farklıysa `UE_EXE` ortam değişkenini ayarla. Servis çalışmazsa sahne sabit kalır, arayüz yine açılır.

## Bilinen sınırlar

- Yalnızca Unreal editöründe (PIE) çalışır; paketlenmiş exe için C++ gerekir.
- Köprü tek yönlü: web → Unreal.
- Arazi dokusu ve kayalar temsilidir (gerçek DEM yalnızca hesaplarda); arayüzde "temsili" olarak etiketlenir.
- Sabit yollar `set_paths.ps1` ile düzeltilir; Windows dışında denenmedi.
