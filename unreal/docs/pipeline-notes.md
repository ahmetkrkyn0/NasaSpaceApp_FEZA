# FEZA_Unreal (yerel çalışma alanı)

Ekip reposundan bağımsız. `data/` git dışıdır; aşağıdaki adımlarla yeniden üretilir.

## Ay dokuları (NASA SVS 4720, CGI Moon Kit)
Kaynak: https://svs.gsfc.nasa.gov/4720 (data/raw/moon/ altına indirilir)

| Dosya (data/unreal/textures) | Kaynak | Not |
|---|---|---|
| moon_color_8k.png | lroc_color_16bit_srgb_8k.tif | 8192x4096, 8-bit sRGB, eşdikdörtgen |
| moon_color_poles_8k.png | lroc_color_poles_8k.tif | kutup bölgeleri için daha iyi renk |
| moon_height_16ppd.png | ldem_16_uint.tif | 5760x2880, 16-bit. **yükseklik_m = değer/2 - 10000**, referans yarıçap 1737,4 km |

NASA notu: bu görseller estetik için optimize edilmiştir; bilimsel hesapta kaynak veri kullanılır.

## Efemeris
`tools/.venv/Scripts/python.exe tools/ephemeris.py --site-id ... --lat ... --lon ...`
`tools/check_horizons.py` ile JPL Horizons karşılaştırması (fark < 0,0001°).

## Dünya dokuları
| Dosya | Kaynak | Not |
|---|---|---|
| earth_day_16k.png / earth_day_8k.png | NASA Blue Marble Next Generation, Nisan 2004, topografya+batimetri gölgeli, 21600x10800 JPG | Yeniden boyutlandırıldı. Atıf: "NASA Earth Observatory" |
| earth_night_8k.png | NASA Black Marble 2016 (SVS 30876), BlackMarble_2016_global_7km.png | Alttaki 360 piksellik başlık bandı kırpıldı (5760x2880), 8192x4096'ya büyütüldü; kaynak 7 km çözünürlüklü |

Henüz yok: bulut katmanı, okyanus yansıma (specular) maskesi.

## Unreal projesi (UE 5.8, unreal/FezaMoon)
Olcek: 1 km = 10 cm. Koordinat: MOON_ME (x,y,z) -> UE (x,-y,z) (gercek el-yordami korunur; Dunya'dan bakinca dogu sagda).

Sifirdan kurulum (sirayla):
1. `tools/.venv/Scripts/python.exe tools/ephemeris.py` -> data/unreal/bodies.json, ephemeris/<saha>.json
2. `tools/.venv/Scripts/python.exe tools/make_moon_normal.py` -> moon_normal_8k.png
3. `tools/.venv/Scripts/python.exe tools/make_sphere.py` -> data/unreal/meshes/uvsphere.glb (65k kose; OBJ iceri aktarimi meshi bozuyor, GLB kullan)
4. UnrealEditor-Cmd.exe unreal/FezaMoon/FezaMoon.uproject -ExecutePythonScript=tools/ue_build_scene.py -unattended -nosplash (tam yollarla)
5. Ekran goruntusu: UnrealEditor.exe ... -ExecCmds="py tools/ue_shot.py" (ortam: SHOT_CAM, SHOT_BIAS, SHOT_EARTHVIEW). `-ExecutePythonScript` ile editor betik bitince kapanir; goruntu icin -ExecCmds gerekir.

Notlar:
- Unreal glTF ice aktarimi: UE = (gx, gz, gy), birim m -> cm. Eksen takasi sarimi ters cevirir; make_sphere.py bunu duzeltir.
- Pozlama: cine kamera fiziksel pozlama kullanir; PostProcessVolume EV sapmasi -6 iyi sonuc verdi (gunes 120000 lux).
- Dogrulandi: Dunya yonunden bakista Copernicus/Kepler/Oceanus Procellarum dogru konumda, aydinlik yari efemerisle uyumlu.

## Zaman cubugu (Level Sequence)
`unreal/FezaMoon/Content/Sequences/LS_Timeline` (tools/ue_build_sequence.py uretir, ue_build_scene.py'den SONRA calistirilir).
- Kare 0 = start_utc (2026-12-01 00:00 UTC), 1 kare = 1 saat (efemeris adimi), 721 kare = 30 gun. 24 kare/sn gosterim.
- Anahtarlananlar: Sun (rotasyon), Earth (konum + rotasyon, ITRF->MOON_ME kuaterniyonu y-aynali), MPC_Sun.SunDir (Dunya gece isiklari maskesi).
- Editorde: Content Browser > Sequences > LS_Timeline cift tikla, oynatma kafasini surukle.
- API notlari: kanallar icin `section.get_all_channels()`, varsayilan icin `channel.set_default()`, `add_color_parameter_key` None doner (sayma `get_parameter_names()` ile).
- Ekran goruntusu: ue_shot.py ortam degiskenleri SHOT_FRAME, SHOT_EARTHCLOSE (Dunya yaricapi carpani). 16k Dunya dokusu stream yuzunden bulanik cikmasin diye ue_shot.py `r.Streaming.FullyLoadUsedTextures 1` kullanir.
- Gece isiklari emisyon katsayisi 2500 (gunes 120000 lux, EV -6'ya gore).

## Inis sahasi: Leibnitz Beta Plateau (Artemis III aday bolgesi #10)
Kaynak: PGDA/Zenodo `A3CLR22_10_Leibnitz_Beta_Plateau.zip` (CC-BY-4.0, ~1 GB), doi:10.5281/zenodo.17954508.
Atif: Bertone S. et al. (2026), Enhanced Topography Models for selected Lunar South Pole regions with Shape-from-Shading, PSJ.
- DEM: 3200x3200, 5 m/px, 16x16 km, merkez -85.427 deg, 31.743 deg D; yukseklik 2796..6464 m (R=1737.4 km); belirsizlik ort. 0.07 m.
- NOT: eski notlardaki -84.78 / 29.13 (IM-2/IM-4 hedefi) bu DEM'in ~70 km kuzeyinde, DEM disinda.
- `tools/ephemeris.py --site-id leibnitz-beta-plateau --lat -85.427 --lon 31.743` (Horizons farki < 0.0001 deg)
- `tools/make_site_terrain.py` -> data/unreal/terrain/leibnitz-beta-plateau/ (height_full/focus, albedo, rocks.csv, terrain.json, preview/)
  - full: gercek DEM, 4033x4033 (~3.97 m/px). focus: ~4 km, 4033x4033 (~1 m/px), gercek DEM buyutulmus + SENTETIK fraktal puruz/krater/kaya (sadece gorsel).
  - Ilk deneme krater yogunlugu (n10=400/km2) yapay gorundu; n10=80, b=2.0, yaslanmis kraterler + fraktal puruzle duzeltildi.
  - Hesaplar (ufuk, aydinlanma) gercek DEM'den; sentetik detay arayuzde "temsili" etiketlenmeli.
- Puruz kalibrasyonu (data/scratch/band_check.py, ayni pencerede DoG bantlari): 80 m ustu gercek DEM ile birebir (oran 1.00); 10-40 m oran 1.12; 4-8 m beklenenin ~1.25 kati. Fraktal puruz rms 0.15 m, dalga boyu 2-40 m. Gercek DEM'in yapi fonksiyonu H~0.99 (egim ~10 deg her olcekte): tek basina "puruz" olcmez, egimi olcer; bantlara ayirmak gerekir.

## Inis sahasi seviyesi (Site_LBP) ve cozulen sorunlar
Hat: ephemeris.py -> horizon_mask.py -> sunny_spots.py -> make_site_terrain.py -> make_site_tiles.py -> make_regolith_textures.py -> prep_site_level.py -> ue_build_site.py (-> ue_fix_mesh_precision.py) -> ue_shot.py
- Arazi: 4x4 karo (1009^2 kose, ~1 m) + dis alan (16 km, ~16 m, odak altinda 2 m). Cerceve: UE X = grid y, Y = grid x, Z yukari (cm). UV metre cinsinden; makro albedo dunya konumundan orneklenir.
- Regolit materyali: 2 m ve 0.3 m periyotlu sarmal detay normali + ikinci ornek (desen kirma), mesafeye gore solar; normal harmani yalniz XY toplayip Z=1 ile normallestirir.
- UE 5.8 tuzaklari (hepsi bu projede yasandi):
  1. `-ExecutePythonScript` betik bitince editoru kapatir; ekran goruntusu icin `-ExecCmds="py ..."` kullan.
  2. glTF ice aktarim: UE=(gx,gz,gy), m->cm; eksen takasi sarimi ters cevirir (CCW disari-bakan kural).
  3. OBJ ice aktarimi buyuk meshi bozar (145 kose); GLB kullan.
  4. 1M koseli karolarda Nanite yuksek ayrinti sayfalari yuklenmedi (kaba ucgenler); Nanite KAPALI static mesh kullanildi.
  5. Nanitesiz mesh + alcak Gunes: 8 bit normal/teget serit yapar -> `use_high_precision_tangent_basis` + `use_full_precision_u_vs` ZORUNLU.
  6. `r.Nanite.Streaming.StreamingPoolSize` donanimin en buyuk tahsisinden (2048 MB) kucuk olmali; runtime'da degistirmek renderer'i cokertti.
  7. 16k/8k doku stream'i bulaniklastirir: ekran goruntusunde `r.Streaming.FullyLoadUsedTextures 1`.
  8. Cine kamera odak derinligi yakin cekimi bulaniklastirir: focus_method=DISABLE.
  9. Python ile olusturulan materyalde ChannelMask/TextureSample baglantilari "" adlandirilmis giris kullanir; `add_*_parameter_key` None doner.
- Fizik bulgusu: ufuk maskesi (DEM, Ay egriligi dahil) ile Gunes 30 gunde 721 karenin yalnizca 169'unda gorunur (duz ufuk modeli: 415). Odak penceresinde noktaya gore %9..%66 degisir (sunny_spots.py).
- Acik isler: odak/dis alan sert kenari, taslar (rocks.csv) gercek mesh olarak, yakin cekim kamerasi golgede, site seviyesinde tarih cubugu (Gunes sabit: kare 601).

## Tikla-in gecisi (Ay -> saha), editorde Play ile
Calisma ani mantigi `tools/feza_runtime.py` (Python). Proje ayari `DefaultEngine.ini` `[/Script/PythonScriptPlugin.PythonScriptPluginSettings] +StartupScripts=` ile editor acilisinda yuklenir; PIE sirasinda slate tick ile calisir.
- Kurulum (editor kapaliyken): `UnrealEditor-Cmd.exe <proje> -ExecutePythonScript=tools/ue_add_site_markers.py` -> Main'e `Marker_/MarkerHead_/Label_<id>` + `Cam_Orbit` ekler (tools/sites.json'dan).
- Ay: sol tus surukle = dondur, tekerlek = zoom, isaretciye gel = etiket, tikla = `open_level`. Saha: sol tus = bakis, 1/2/3 = kamera, M = Ay'a don.
- Test: `ue_test_pie.py` (betikle hover/gecis/donus + HighResShot). Gercek fare yolunu (get_mouse_position, was_input_key_just_*) insan elle dogrulamali.
- Sinirlar: yalnizca editorde calisir (paketlenmis exe icin C++ gerekir; Windows SDK kurulu degil, VS 18 + MSVC 14.51 var). `unreal.WidgetBlueprintLibrary` Python'da yok (input modu ayarlanamadi). `unreal.Key()` argumansiz olusturulur, `key_name` sonradan atanir. `unreal.Color(...)` siralamasi (b,g,r,a): isimli arguman kullan. `-log` ile acilan konsola tiklamak editoru dondurur ("Sec" kipi): testte `-log` kullanma.
- Yeni saha eklemek: sites.json'a satir + o sahanin seviyesi; ue_add_site_markers.py'yi tekrar calistir.

## Gorsel kalite yonu: Poly Haven Moon (CC0) + prosedurel araziler
Karar: DEM'den bagimsiz, gorsel kalite oncelikli. Zemin dokulari ve kayalar Poly Haven "Moon" koleksiyonundan (CC0; Antoine Richard/OmniLRS ile is birligi; Rostock regolit simulanti fotogrametrisi).
- `tools/fetch_polyhaven_moon.py` -> data/raw/polyhaven/moon (20 doku x 5 harita 4k jpg, 7 kaya glTF 2k; ~1 GB; manifest.json). Gercek olcekler: moon_01..04/meteor ~3.1-3.2 m, dusted/macro 37-56 cm, kayalar 5-25 cm.
- Dokularda renk neredeyse duz gri-kahve, detay normal/yukseklikte: alcak Gunes (kutup) icin ideal.
- `tools/make_procedural_landscape.py` -> 3 arazi (site-craters, site-plains, site-ridges; 6 km, 2 m aralik, Ay egriligi dahil -> ufuk ~2.4 km). `make_site_tiles.py <saha-kimligi>` karolari uretir.
- `tools/ue_build_landscapes.py` (UE, editor kapali): materyal M_MoonGround (moon_01 + moon_03 karisimi, 2 olcek, moon_dusted ince detay, mesafeyle solan), 7 kaya HISM, Gunes/kamera, /Game/Maps/Site_Craters|Plains|Ridges.
- Hazir Fab paketleri (kullanici hesabiyla eklenmeli; fiyat/UE 5.8 uyumu dogrulanmadi): Moon Environment (6 seviye/16 km2), Brushify Moon Pack, 20 Craters Nanite + 20 Heightmap 4K, Moon Surface Building Kit (Vault, UE 5.0-5.1), Epic Lunar Horizons (ucretsiz, UEFN odakli).
- Sonuc (ilk tur): Site_Plains / Site_Craters / Site_Ridges kuruldu (6 km arazi, M_MoonGround, 2500 kaya her saha). Goz hizasinda zemin gercek regolit gibi; mare sakin, kraterli saha en iyi.
- Bilinen sorunlar: (1) `les.new_level` acilistaki haritanin (Main) KOPYASINI uretir -> yeni seviyede once tum aktorler silinmeli (ue_build_landscapes.py'de yapildi; Site_LBP hala Main kopyasi aktorleri + ikinci Gunes tasiyor, ue_build_site.py'ye ayni temizlik eklenip yeniden kurulmali). (2) Python'da HISM bileseni eklenemiyor (`add_component_by_class` yok): kayalar tek tek StaticMeshActor (en yakin 2500). (3) Alcak Gunes + engebeli arazide varsayilan Cam_Ground golgede kalabilir (Site_Ridges). (4) Buyuk kraterlerde yuvarlak "tabla" kenar artefakti (ridges). (5) Poly Haven diffuse haritalari dikey bantli: albedo sabit ton, doku yalniz normal/roughness icin kullanildi.

## Inis sahalari v2 (ayrintili cekirdek, Athena, gokyuzu)
- `make_ground_textures.py` -> 3 olcekli prosedurel regolit normal/albedo dokulari; `make_site_sky.py <saha>` -> gercek Gunes/Dunya yonu (DE421), Dunya yonelimi, Athena noktasi (terrain.json: sun/sky/lander);
  `make_site_detail.py <saha>` -> 1 km'lik 0.5 m cekirdek, Athena altinda duzlestirme, acisal kaya mesh'leri (convex hull, birlestirilmis hucreler, COLOR_0 ton).
- `ue_build_landscapes.py`: M_MoonGround/M_MoonRock/M_EarthSite/M_SunDisc, Athena (/Game/Athena, ekip deposundan kopyalanan GLB), Dunya + Gunes diski, kameralar (Cam_Ground/Close/Overview/Lander/Earth/Sun).
- Tuzaklar: `unreal.Rotator(roll, pitch, yaw)` sirasi (adlandirilmis arguman kullan); `new_level` var olan harita icin hata verir -> `load_level`; headless importta BATCH kucuk tut (bellek); aci boyutlu gok cisimleri icin 2e8 cm mesafe.
- Editor arka plandayken yavaslamasin: Config/DefaultEditorSettings.ini (bThrottleCPUWhenNotForeground=False).

## Dunya sahneleri (DSN istasyonlari, kure, TDRS)
- Veri: `make_dsn_data.py` (tools/.venv; istasyon konumlari, gercek Ay/Gunes yonu + Ay yonelimi, 8 km arazi, globe.json) -> `make_site_tiles.py <id>`; zemin dokulari `fetch_polyhaven_ground.py` (CC0).
- UE: `ue_build_stations.py` (Station_Goldstone/Madrid/Canberra: SkyAtmosphere, Ay, 70 m canak Ay'a bakar), `ue_build_earth.py` (Earth_Globe: Dunya gunduz/gece, Ay, TDRS GEO), `MARKER_TARGET=earth ue_add_site_markers.py` (DSN isaretcileri).
- Modeller: DSN 70 m = Masaustu GLB (data/raw/dsn70, canak eklemleri: azimut/elevasyon pivotlari), TDRS (A) = NASA 3D Resources (https://science.nasa.gov/3d-resources/), boyutu Unreal'de ~90 cm cikar -> TDRS_SCALE 80.
- Akis (editor Play): Ay (Main) E -> Dunya; Dunya'da isaretciye tikla -> istasyon; istasyonda 1/2/3 kamera, 4/5 Ay, E Dunya, M Ay. Henuz PIE'de denenmedi.
- Tuzaklar: Interchange GLB klasoru dosya adindan gelir (tdrs_a); gunduz SkyAtmosphere'de Ay'i 6 km'ye koy (2000 km'de sis yer); build betikleri bellek icin BATCH kucuk.

## Birlesik yorunge sahnesi (Orbit) ve yeni akis
- `make_stars_clouds.py` (yildiz alani + bulut maskesi), `ue_build_orbit.py` (Dunya+Ay+yildiz+TDRS, Nanite kapali kure, bulut/atmosfer katmanlari), `ue_add_site_markers.py` (etiketsiz isaretciler, gezegenin donusune gore).
- Acilis haritasi `Orbit` (DefaultEngine.ini). Eski `Main` ve `Earth_Globe` kullanilmiyor (zaman cubugu dizisi LS_Timeline Main'de kaldi).
- Akis (feza_runtime.py, ekranda metin yok): Ay/Dunya'ya tikla -> yaklasir; isaretci vurgulanir, tikla -> sahne; Backspace/sag tus geri; Tab Ay<->Dunya; sahnede Backspace/M/E.
- Test: `ue_test_pie.py` (betikli PIE; gunluk data/scratch/test_pie.txt). Tuzaklar: yayici degerleri Gunes isikli yuzey parlakligi (~1e4) olcusunde olmali (pozlama -5.5); sinema kamerasi film boyutu 24.89 mm (odak 26 ~ 51 derece); `Transform.transform_vector` yok -> `MathLibrary.transform_direction`; 8k Ay dokusu never_stream.

## Web arayuzu Unreal'in icinde (WebBrowser koprusu)
- Python widget agacini kuramaz/widget olusturamaz: elle bir kerelik Blueprint adimi gerekli: `Content/UI/WBP_Shell` (CanvasPanel > `Browser` WebBrowser, sag kenar, Is Variable) ve `BP_UIHost` (BeginPlay: Create WBP_Shell -> Set `Shell` -> Add to Viewport). `ue_place_ui_host.py` BP_UIHost'u 7 haritaya koyar (aktor etiketi `UIHost`).
- `feza_runtime.py`: `UIHost.Shell.Browser` ile web uygulamasini (`FEZA_UI_URL`, vars. http://127.0.0.1:5199/) yukler; adres cubugundaki `site=` parametresini her 15 karede okur; `export/web3d/scenes.json` katalog eslemesiyle sahneyi degistirir (Orbit'te Ay'a yaklasir -> sahaya gecer). Seviye degisince sayfa yeniden yuklenir, durum URL'den geri gelir.
- Baslatma: `Start_WebUI.bat` (vite, 5199) -> `Open_FezaMoon.bat` -> Orbit -> Play. Test: `ue_test_web.py` (gunluk data/scratch/test_web.txt). Ekran goruntusu: HighResShot arayuz katmanini cekmez; pencere yakalama (PrintWindow) gerekir.
- Bilinen sinirlar: tek yonlu (web -> Unreal); gercek fareyle gomulu sayfada tiklama henuz denenmedi; editor penceresi icinde calisir (bagimsiz `-game` denenmedi).

## Gokyuzu senkronu (saha sahneleri)
Web arayuzunde secilen saha ve zaman (adres cubugundaki `site=` ve `t=`) saha sahnesindeki Gunes, Dunya (evre, yonelim), Gunes diski ve isik acisini degistirir. Dunya ufkun ustundeyse lander'dan Dunya'ya iletisim hatti cizilir; durumu "TIPPED OVER" olan gorevlerde (SLIM, IM-2 Athena) lander yan yatar.
Veri: `tools/sky_service.py` (yerel, DE421/skyfield, 127.0.0.1:5198; `Start_WebUI.bat` baslatir). Servis yoksa sahne sabit kalir. Aktorlar: `tools/ue_add_sky_actors.py`. Test: `tools/ue_test_sky.py` + `tools/win_capture.ps1`.

## 2D harita gorunumu ve DSN senkronu
Orbit'te Ay/Dunya'ya tiklayinca 2D harita acilir (Dunya: DSN istasyonlari + TDRS uydulari alt-uydu noktalariyla, Ay: katalogdaki 10 saha); kartlar tiklanabilir, tiklayinca ilgili sahne/uydu acilir. `T` tusu veya sol ustteki dugme 2D harita <-> 3D kure arasinda gecer.
Harita gorselleri: `export/web3d/ue-maps/{earth,moon}.jpg` (vite `public/ue-maps/`). Yerlesim sayfada hesaplanir; sayfa `LAY|` konsol mesajiyla kart dikdortgenlerini bildirir, tiklama bunlarla yapilir.
DSN istasyon sahnelerinde (adres cubugundaki `t=`) Gunes, Ay (konum, evre, yonelim) ve canak (yumusak donus, azami ~12 derece/sn) secilen ana gore ayarlanir; veri `sky_service.py /station`. Test: `tools/ue_test_station.py`.

## Direk yuksekligi ve ufuk profili
Adres cubugundaki `mast=` degeri saha sahnelerinde kamera yuksekligini belirler (zemin + 30 cm + direk). Ekibin ufuk profili (`data/horizons/*.json`, salt okunur kopya: `data/unreal/horizons_team/`; yalniz Chandrayaan-3, IM-1 Odysseus, IM-2 Athena, Mons Mouton, 2 m ve 10 m) varsa Gunes/Dunya o yondeki ufuk acisina gore gorunur ya da gizlenir, isik ufukta yumusakca soner; profil yoksa duz ufuk (arayuzdeki "Assumed" ile ayni). Test: `tools/ue_test_mast.py`.

## Zengin istasyon arazisi
`make_station_terrain.py` (tools/.venv): kuru dereler, tepeler, dagli cevre + dogal ortam yerlesimi (`props.json`); `stations.json` zemin yuksekligi yeni araziyle esitlenir (yoksa kamera/canak zemine gomulur). Sonra `make_site_tiles.py <id>`, `fetch_polyhaven_nature.py` + `ue_import_nature.py` (bir kez), `SITE_ONLY=<id> ue_build_stations.py` (Poly Haven bitki/kaya aktorleri), `ue_place_ui_host.py`, `ue_add_sky_actors.py`. Istasyon kamerasi zemin platosu (r<280 m) uzerinde.

## Tanitim videosu ve medya paketi
- `tools/demo_rig.py`: Unreal'i tam ekran acar, ekrani ffmpeg ile kaydeder ve akisi GERCEK fare/klavye girdisiyle yurutur (runtime durum/komut dosyalari: `demo_state.json`, `demo_cmd.txt`); `tools/build_flow_video.py` ham kaydi ~30 sn'ye keser -> `export/web3d/flow/feza-flow-30s.mp4`.
- Lander sahnelerinde fare: sag tus surukle = lander etrafinda tur, tekerlek = yakinlas (kamera 6). Lander her gorevde dik (`TIP_ON = False`).
- Ayri gorseller/videolar: `ue_capture.py` (agir sahnelerde `CAP_START=900`) + `build_web3d_package.py`.
