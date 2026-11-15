# Uygulama Planı

- **Tarih:** 14 Kasım 2026
- **Durum:** Uygulanıyor. Issue'lar 14 Kasım 2026'da açıldı: iş issue'ları #33 ile #47 arası, takip issue'su #48 (1. bölümdeki tablo).
- **Teslim:** 15 Kasım 2026, 23:59 yerel saat ([teslim kılavuzu](challenge/project-submission-guide.pdf))
- **Dayandığı belgeler:** [ADR-0001](adr/0001-uygulama-mimarisi-ve-stack.md), [ADR-0002](adr/0002-koordinat-sistemi-ve-zaman.md), [ADR-0003](adr/0003-veri-sozlesmesi.md), [ADR-0004](adr/0004-api-uc-noktalari.md), [tasarım belgeleri](design/), [kullanıcı planı](product/use-cases-and-scenarios.md), [kitle stratejisi](product/audience-strategy.md), [analiz özeti](research/ANALIZ-OZETI.md)

## İçindekiler

1. [Özet](#1-özet)
2. [Hatlar ve kişiler](#2-hatlar-ve-kişiler)
3. [Paralel çalışma kuralları](#3-paralel-çalışma-kuralları)
4. [Bilimsel doğruluk kuralları](#4-bilimsel-doğruluk-kuralları)
5. [Kullanım senaryolarıyla eşleştirme](#5-kullanım-senaryolarıyla-eşleştirme)
6. [Faz 1: Temel](#6-faz-1-temel)
7. [Faz 2: Zorunlu ürün](#7-faz-2-zorunlu-ürün)
8. [Faz 3: Ekstralar ve teslim](#8-faz-3-ekstralar-ve-teslim)
9. [Zaman planı](#9-zaman-planı)
10. [Ekip dışı iş: 3B görünüm](#10-ekip-dışı-iş-3b-görünüm)
11. [Riskler ve yedek planlar](#11-riskler-ve-yedek-planlar)
12. [Kararlar](#12-kararlar)
13. [Bu planda olmayanlar](#13-bu-planda-olmayanlar)
14. [Bir issue ne zaman bitmiş sayılır](#14-bir-issue-ne-zaman-bitmiş-sayılır)

## 1. Özet

İş üç faza ve dört hatta bölündü. Her hat bir kişinindir ve kendi klasörlerinde çalışır. Her fazda her hatta bir issue vardır; son fazda bazı hatlarda iki tane.

| Faz | Amaç | Bittiğinde elimizde ne olur |
|---|---|---|
| Faz 1: Temel | Dört kişinin birbirini beklemeden çalışabileceği zemin | Çalışan sunucu iskeleti ve doğrulanmış Güneş ile Dünya hesabı, saha verisi ve ufuk modülü, arayüz iskeleti, arayüzün örnek veriyle çalışan veri katmanı |
| Faz 2: Zorunlu ürün | Challenge'ın istediği her şey (`UC-01` ile `UC-08` arası ve `UC-10`, `UC-11`, `UC-12`) | Saha ve tarih seçilir; Güneş ve Dünya ufka göre görünür; olay saatleri, güç ve iletişim değerlendirilir; senaryolar karşılaştırılır; doğrulama testleri koşar |
| Faz 3: Ekstralar ve teslim | Üç kapı, "neden" kartları, geçmiş görevler, mini oyun, doğrulama raporu, sunum | Teslim edilecek ürün, 7 slaytlık demo ve proje sayfası metni |

Issue kimlikleri faz ve hat harfinden oluşur: `F1-A`, Faz 1'in A hattındaki issue'dur. GitHub'daki karşılıkları:

| Hat | Faz 1 | Faz 2 | Faz 3 |
|---|---|---|---|
| A (Oğuzhan) | `F1-A` #33 | `F2-A` #37 | `F3-A1` #41, `F3-A2` #42 |
| B (Tuna) | `F1-B` #34 | `F2-B` #38 | `F3-B` #43 |
| C (Göktuğ) | `F1-C` #35 | `F2-C` #39 | `F3-C1` #44, `F3-C2` #45 |
| D (Ahmet) | `F1-D` #36 | `F2-D` #40 | `F3-D1` #46, `F3-D2` #47 |

Faz kapılarının sonuçları ve kesme kararları takip issue'suna (#48) yazılır. Şef oturumunun bu planı nasıl dağıtacağı ve yöneteceği [sef-plan-yonetimi.md](team-setup/sef-plan-yonetimi.md) belgesindedir.

Planın iki sabit kuralı var:

- **Aynı fazdaki issue'lar birbirini beklemez ve aynı dosyaya dokunmaz** (3. bölüm).
- **Zaman daralırsa ekstralar kesilir; hesabın doğruluğu ve doğrulama kesilmez** (4. bölüm).

## 2. Hatlar ve kişiler

| Hat | Konu | Kişi (öneri) | Neden bu kişi |
|---|---|---|---|
| A | Sunucu çekirdeği: Güneş ve Dünya konumu, olaylar, güç, iletişim, karşılaştırma | Oğuzhan | Güneş paneli modeli notunu yazdı |
| B | Veri ve arazi: saha verisi, ufuk profilleri, harita katmanları, doğrulama koşusu | Tuna | Ufuk hesabı notunu yazdı |
| C | Arayüz iskeleti ve gösterimler: ekran düzeni, ufuk şeridi, zaman çizelgesi, harita | Göktuğ | Referans tasarımı dışa aktardı |
| D | Arayüz verisi, paneller ve içerik: veri katmanı, senaryo durumu, kurulum, güç, iletişim ve karşılaştırma panelleri, metinler | Ahmet | Kullanıcı planını ve kitle stratejisini yazdı |

- Kişi ataması öneridir. Ekip hatları bütün olarak takas edebilir; bir hat iki kişiye bölünmez.
- Sabit rol yok kuralı sürer ([CLAUDE.md](../CLAUDE.md)): bir hat erken biterse sahibi başka bir hattın sıradaki issue'sunu değil, 8. bölümdeki "zaman kalırsa" listesinden kendi klasörlerine düşen bir işi alır. Böylece dosya çakışması olmaz.
- 3B görünümü yapan kişi ekibin dışındadır ve bu dört hattan hiçbirinde yer almaz (10. bölüm).

## 3. Paralel çalışma kuralları

### 3.1 Altı kural

1. **Her dosyanın tek sahibi vardır.** Sahiplik aşağıdaki tablodadır. Bir issue yalnızca kendi "Dokunduğu dosyalar" listesindeki dosyaları değiştirir.
2. **Sözleşme koddan önce gelir.** Hatlar birbirinin koduna değil, [ADR-0003](adr/0003-veri-sozlesmesi.md) ve [ADR-0004](adr/0004-api-uc-noktalari.md) içindeki yapılara ve `data/examples/` altındaki örnek dosyalara göre yazar. Sözleşmede değişiklik gerekiyorsa önce ADR'ye değişiklik notu yazılır, sonra `CONTRACT` mesajı gönderilir ([CLAUDE.md](../CLAUDE.md), görev döngüsü madde 6).
3. **Ortak dosyalara yalnızca sahibi dokunur.** Örnek: `backend/pyproject.toml` (A), `frontend/package.json` (C). Yeni bir bağımlılık gerekiyorsa sahibinden istenir; sahibi ekler.
4. **Yeni parça eklemek ortak dosya gerektirmez.** Sunucuda `backend/app/api/` altına konan ve `router` adlı bir nesne sunan her dosya kendiliğinden yüklenir. Arayüzde bütün panellerin yeri Faz 1'de ayrılır; bir paneli dolduran kişi yalnızca o panelin klasörünü değiştirir.
5. **Arayüz sunucuyu beklemez.** Arayüzün veri katmanı, bir ayarla `data/examples/` altındaki örnek dosyaları döndürür. Canlı sunucuya geçiş faz kapılarında denenir.
6. **Her issue kendi branch'inde yürür ve küçük PR'larla kapanır.** Branch adları issue kartlarında yazılıdır. `main` branch'ine doğrudan commit atılmaz; PR'ları Tuna merge eder ([AGENTS.md](../AGENTS.md), [CLAUDE.md](../CLAUDE.md)). Commit, PR ve issue metinlerine yapay zekâ atfı yazılmaz ([AGENTS.md](../AGENTS.md), kural 5).

### 3.2 Dosya sahipliği

| Yol | Sahip hat | İlk yazıldığı issue |
|---|---|---|
| `backend/pyproject.toml`, `backend/README.md` | A | `F1-A` |
| `backend/app/main.py`, `backend/app/errors.py`, `backend/app/settings.py` | A | `F1-A` |
| `backend/app/core/` | A | `F1-A` |
| `backend/app/models/` | A | `F1-A` |
| `backend/app/api/health.py`, `sky.py`, `sites.py`, `profiles.py`, `missions.py` | A | `F1-A` |
| `backend/app/api/events.py`, `now.py`, `comm.py`, `power.py`, `compare.py` | A | `F2-A` |
| `backend/app/api/eclipses.py` | A | `F3-A1` |
| `backend/app/terrain/` | B | `F1-B` |
| `backend/app/api/horizon.py`, `layers.py` | B | `F2-B` |
| `backend/app/api/validation.py` | B | `F3-B` |
| `backend/scripts/download_kernels.py` | A | `F1-A` |
| `backend/scripts/precompute_horizons.py` | B | `F1-B` |
| `backend/scripts/make_layers.py`, `run_validation.py` | B | `F2-B` |
| `backend/tests/core/`, `backend/tests/api/`, `backend/tests/contract.py`, `backend/tests/fixtures/` | A | `F1-A` |
| `backend/tests/terrain/`, `backend/tests/data/` | B | `F1-B` |
| `data/sites.json`, `data/panel_profiles.json`, `data/horizons/` | B | `F1-B` |
| `data/reference_missions.json`, `data/validation_report.json` | B | `F2-B` |
| `data/examples/test_vectors.json`, `data/examples/projection_vectors.json` | B | `F1-B`, `F2-B` |
| `data/examples/` altındaki diğer dosyalar | D | `F1-D` |
| `frontend/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx` | C | `F1-C` |
| `frontend/src/styles/`, `src/shell/`, `src/ui/`, `src/lib/`, `src/features/registry.ts` | C | `F1-C` |
| `frontend/src/features/sky/`, `timeline/`, `hud/`, `map/` | C | `F1-C` (yer tutucu), `F2-C` |
| `frontend/src/api/`, `src/state/`, `src/content/` | D | `F1-D` |
| `frontend/src/features/setup/`, `power/`, `comms/`, `compare/` | D | `F1-C` (yer tutucu), `F2-D` |
| `frontend/src/features/why/`, `missions/`, `tasks/`, `validation/`, `game/` | D | `F1-C` (yer tutucu), `F3-D1`, `F3-D2` |
| `.gitignore`, `AGENTS.md`, `README.md`, `CHANGELOG.md` | A | `F1-A`, `F3-A2` |
| `docs/submission/project-description.md` | A | `F3-A2` |
| `docs/validation-report.md` | B | `F3-B` |
| `docs/submission/demo/` | C | `F3-C2` |

Yer tutucu dosyaları `F1-C` oluşturur; sonraki fazda sahibi doldurur. Aynı fazda iki kişi aynı dosyaya dokunmaz.

### 3.3 Hatlar arası ortak arayüzler

Bu adlar plan boyunca sabittir. Değiştirmek sözleşme değişikliğidir.

| Arayüz | Sahibi | Kullanan | Tanım |
|---|---|---|---|
| Ufuk sağlayıcısı | B | A | `app.terrain.horizon.get_horizon_profile(lat_deg, lon_deg, mast_height_m, site_id=None)`; `HorizonProfile` döndürür ve "Direk yüksekliği kuralı"nı uygular ([ADR-0003](adr/0003-veri-sozlesmesi.md)) |
| Ufuk açısı okuma | B | A | `app.terrain.horizon.horizon_at(profile, azimuth_deg)`; iki komşu değer arasından doğrusal okur |
| Konum çözme | A | B | `app.core.location.resolve(site_id, lat_deg, lon_deg)`; girdiyi doğrular, saha kaydını ya da özel koordinatı döndürür |
| Veri dosyaları | B | A | `data/sites.json`, `data/panel_profiles.json`, `data/reference_missions.json`; biçim [ADR-0003](adr/0003-veri-sozlesmesi.md). A'nın yükleyicileri alanları olduğu gibi geçirir, bilinmeyen alanı atmaz |
| Örnek yanıtlar | D | A, B, C | `data/examples/<ad>.json`; her uç nokta için bir dosya. Sunucu testleri yanıtın alan adlarını bu dosyalarla karşılaştırır |
| Veri katmanı | D | C | `frontend/src/api/client.ts`: her uç nokta için tipli bir işlev (`getSites`, `getHorizon`, `getSkySeries`, `getEvents`, `getNow`, `getCommWindow`, `getPower`, `postCompare`, `getReferenceMissions`, `getPanelProfiles`, `getLayer`, `getHealth`) |
| Senaryo durumu | D | C | `frontend/src/state/scenario-store.ts`: `getState`, `subscribe`, `setScenario`, `setSelectedUtc`, `addToCompare`, `removeFromCompare`. Durum: etkin senaryo, seçili an, karşılaştırma listesi |
| Genel kancalar | C | D | `frontend/src/lib/hooks.ts`: `useStore(store, selector)` ve `useAsync(fn, deps)` |
| Kapı ve kip durumu | C | D | `frontend/src/shell/ui-state.ts`: etkin kapı (`explore`, `classroom`, `plan`), kip (`plan`, `analyze`), etkin sekme |
| Güvenilirlik etiketi | C | D | `frontend/src/ui/ValidityBadge.tsx` ve `SourcePopover.tsx` |

### 3.4 Ortak komutlar

`F1-A` bu komutları `AGENTS.md` içindeki "Commands" tablosuna yazar. İskeletler bu komutlarla çalışacak biçimde kurulur.

| İş | Komut |
|---|---|
| Sunucu kurulumu | `python -m pip install -e "backend[dev]"` |
| SPICE dosyalarını indirme | `python backend/scripts/download_kernels.py` |
| Sunucuyu çalıştırma | `python -m uvicorn app.main:app --app-dir backend --port 8000 --reload` |
| Sunucu testleri | `python -m pytest backend` |
| Arayüz kurulumu | `npm ci --prefix frontend` |
| Arayüzü çalıştırma | `npm --prefix frontend run dev` |
| Arayüz denetimi | `npm --prefix frontend run typecheck` ve `npm --prefix frontend run test` |
| Arayüz derlemesi | `npm --prefix frontend run build` |
| Doğrulama koşusu | `python backend/scripts/run_validation.py` |

Arayüz geliştirme sunucusu `/api` isteklerini `127.0.0.1:8000` adresine yönlendirir; referans arayüz de aynısını yapıyor ([vite-proxy.txt](../frontend-migrate/design-export/api-contract/vite-proxy.txt)).

## 4. Bilimsel doğruluk kuralları

Bu kurallar her fazda ve her hatta geçerlidir. Zaman baskısı bu kuralları gevşetmez; yetişmeyen iş 8. bölümdeki kesme sırasına göre çıkarılır.

### 4.1 Kurallar

1. **Koordinat ve zaman kuralları değişmez.** Bütün hesap [ADR-0002](adr/0002-koordinat-sistemi-ve-zaman.md) kurallarıyla yapılır: ME koordinat sistemi, 1737,4 km yarıçaplı küre, UTC, beş dosyalık SPICE seti, ışık süresi ve gözlemci hareketi düzeltmesi, açıların Ay'ın merkezinden değil sahadan hesaplanması.
2. **Hesap yalnızca sunucuda yapılır.** Arayüz gök mekaniği hesabı yapmaz; sunucudan gelen sayıyı gösterir. Arayüzdeki tek hesap birim çevirmedir (örnek: oranı gün sayısına çevirmek).
3. **Güneş ve Dünya disk olarak ele alınır.** Doğuş ve batış anları yalnızca örneklere bakılarak değil, aranarak bulunur; bir dakikadan dar aralıkta durulur ([olaylar-ve-sureler.md](design/olaylar-ve-sureler.md)).
4. **Her sonuç güvenilirlik etiketi taşır.** Sunucu her yapıda `validity` döndürür; bir sonuç birden çok girdiye dayanıyorsa en düşük etiketi alır ([ADR-0003](adr/0003-veri-sozlesmesi.md)). Arayüz etiketi sayının yanında gösterir.
5. **Basitleştirme gizlenmez.** Düz ufukla yapılan her hesap `SYNTHETIC` etiketi alır ve arayüzde "Assumed" ile "terrain not included" notuyla görünür. Panel profilleri varsayımdır ve öyle etiketlenir.
6. **Olay saatleri aralıkla gösterilir.** Aralık, ufuk bir yay dakikası (derecenin altmışta biri) aşağı ve yukarı kaydırıldığında olayın ne kadar oynadığını söyler. Bu bir güven aralığı değil, duyarlılık göstergesidir ve arayüzde öyle adlandırılır (12. bölüm, karar 4).
7. **Arayüze, slayda ve teslim metnine doğrulanmamış sayı girmez.** Bir sayı ya ürünün kendi hesabından gelir ya da [dogrulama/](research/dogrulama/) tablolarında "doğrulandı" etiketli bir satırdan. "Kısmen doğru" satırlar not sütunundaki düzeltilmiş haliyle kullanılır. "Kaynağı yok" ve "doğrulanamadı" satırları kullanılmaz.
8. **Geçmiş görevlerde kaza nedeni hesaplanmaz.** Ürün ortamı ölçer. Neden yalnızca resmi kaynağa atıfla ve kanıt düzeyi etiketiyle yazılır ([gecmis-gorev-vakalari.md](design/gecmis-gorev-vakalari.md)).
9. **Horizons çalışma zamanında çağrılmaz.** Yalnızca sonuçları sınamak için kullanılır ([gunes-dunya-konumu.md](design/gunes-dunya-konumu.md), bölüm 7).
10. **Referans değerler testtir.** Aşağıdaki tablodaki her satır otomatik bir teste dönüşür. Bir test tutmuyorsa issue bitmiş sayılmaz; eşik gevşetilmez, neden bulunur.
11. **Testi olmayan hesap "doğrulandı" diye sunulmaz.** Arazi ufku, NASA haritasıyla yalnızca yaklaşık karşılaştırılabildiği için (Test 6) raporda "yaklaşık karşılaştırma" olarak geçer.

### 4.2 Referans testler

Beklenen değerlerin hepsi doğrulama tablolarında "doğrulandı" etiketlidir. Koşullar kaynak satırdaki koşullardır; test aynı koşulu kurmalıdır.

| Test | Koşul | Beklenen | Eşik | Kaynak | Sınandığı issue |
|---|---|---|---|---|---|
| T1 | Altı geçmiş inişin anı; yükseklik sıfır, düz ufuk | Güneş'in yön ve yükseklik açıları ([dogrulama-plani.md](design/dogrulama-plani.md), Test 1 tablosu); Athena anında Dünya yönü 335,85 ve yüksekliği 11,19; Chang'e 4 anında Dünya yüksekliği eksi 39,20 | 0,01 derece | [dogrulama/aciklanabilirlik.md](research/dogrulama/aciklanabilirlik.md), No 1 ile 8 arası | `F1-A`; rapor `F2-B` |
| T2a | Mons Mouton test sahası, 1 ile 31 Aralık 2026, 12 saatlik adım, yükseklik sıfır | Güneş en fazla 6,47 derece (21 Aralık 12:00); Dünya yüksekliği eksi 2,10 ile artı 10,65 arası | 0,01 derece | [dogrulama/gunes-paneli.md](research/dogrulama/gunes-paneli.md), No 2; [dogrulama/efemeris-ve-yer-istasyonlari.md](research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 40 | `F1-A` |
| T2b | Aynı saha, 1 Aralık 00:00 ile 31 Aralık 00:00 arası, ölçüt `center`, ufuk sıfır derece | Dünya batıyor 3 Aralık 10:03, doğuyor 11 Aralık 04:41, yeniden batıyor 30 Aralık 11:02; Dünya sürenin yüzde 27,7'sinde ufkun altında | 2 dakika; oran için yarım puan | Aynı dosya, No 42 ve 43 | `F2-A` |
| T3 | Aynı saha, 1 Aralık 00:00 ile 1 Ocak 00:00 arası, saatlik 745 örnek, 1 metrekare, verim uygulanmadan; ufuk her yönde eksi 1, sıfır ve artı 1 derece | Dört panel tipinin ortalama gücü ([guc-degerlendirmesi.md](design/guc-degerlendirmesi.md), "Test verisi" tablosu); en uzun karanlık 232 ve 280 saat | Yüzde yarım; 1 saat | [dogrulama/gunes-paneli.md](research/dogrulama/gunes-paneli.md), No 4 ve 6 | `F2-A` |
| T4 | Düz ufuk; gözlem yüksekliği 1, 2, 5 ve 10 m | Ufuk alçalması 0,061; 0,087; 0,137; 0,194 derece. Ufuk uzaklığı 1,86; 2,64; 4,17; 5,89 km | 0,001 derece; 0,01 km | [dogrulama/ufuk-ve-isik-isi.md](research/dogrulama/ufuk-ve-isik-isi.md), No A-6 ve A-7 | `F1-B` |
| T5 | Apollo 11 sahası, 20 ve 21 Şubat 2027 | Dünya, Güneş'i 22:09 ile 00:36 arasında örtüyor; en fazla yüzde 34,3 | 2 dakika; yarım puan | [dogrulama/zamanda-degisen-veri.md](research/dogrulama/zamanda-degisen-veri.md), No 70 | `F3-A1` |
| T6 | Mons Mouton test sahası, bir yıl, arazi ufku | Güneşli zaman oranı, NASA'nın ortalama aydınlanma haritasındaki değerle yan yana raporlanır | Eşik yok; yaklaşık karşılaştırma | [dogrulama/veri-kaynaklari.md](research/dogrulama/veri-kaynaklari.md), No 34 | `F3-B` |
| T7 | Apollo 11 ve Mons Mouton sahalarında birer gün doğumu; ufuk bir yay dakikası oynatılır | Ekvatora yakın sahada yaklaşık 2 dakika, Mons Mouton'da en az 21 dakika kayma | Ekvatorda 1,5 ile 3 dakika arası; kutupta 21 dakikadan az olamaz | [dogrulama/aciklanabilirlik.md](research/dogrulama/aciklanabilirlik.md), No 10 | `F2-A` |

Notlar:

- **T2b için:** Referans satır kendi payını yaklaşık 20 dakika olarak veriyor. Öneri: fark 2 ile 20 dakika arasında kalırsa test "uyarı" olarak raporlanır ve nedeni PR'da yazılır; 20 dakikayı aşarsa kalır.
- **T3 için:** Referans tablo, Güneş diskinin dikey oranıyla ve 0,267 derecelik sabit yarıçapla hesaplandı ([solar-panel-model](research/solar-panel-model/README.md), bölüm 4). Test bu koşulla kurulur. Ürün diskin alan oranını kullanır ([ufuk-hesabi.md](design/ufuk-hesabi.md)); iki yöntemin ortalama güçteki farkı ayrıca ölçülür ve PR'da raporlanır. Uç noktalar sabit bir ufuk açısı almadığı için T3 uç noktalarla kurulamaz; A hattının birim testinde sınanır ve doğrulama raporuna o testin sonucu olarak yazılır.
- **T1 için:** İki satır yaklaşık girdiye dayanıyor (SLIM koordinatı, Athena iniş saati). Bu satırlar hesabın tutarlılığını sınar, gerçek iniş anını değil ([dogrulama-plani.md](design/dogrulama-plani.md), bölüm 7).

## 5. Kullanım senaryolarıyla eşleştirme

Bu bölüm, [kullanıcı planındaki](product/use-cases-and-scenarios.md) her kullanım senaryosunu tasarım belgesine, sözleşmeye ve issue'ya bağlar. Eşleştirme sırasında sözleşmede bulunan eksikler [ADR-0003](adr/0003-veri-sozlesmesi.md) ve [ADR-0004](adr/0004-api-uc-noktalari.md) değişiklik notlarında kapatıldı.

### 5.1 Use case'lerden issue'lara

| Kimlik | Use case | Tasarım belgesi | Uç nokta ve yapı | Sunucu ve veri | Arayüz |
|---|---|---|---|---|---|
| `UC-01` | Hazır saha seçmek | [saha-katalogu](design/saha-katalogu.md) | `/api/sites`, `Site` | `F1-A`, `F1-B` | `F2-D` (liste ve bilgi kartı), `F2-C` (haritada işaret) |
| `UC-02` | Özel koordinat girmek | [saha-katalogu](design/saha-katalogu.md), [ufuk-hesabi](design/ufuk-hesabi.md) | Bütün konum parametreleri; düz ufuk, `SYNTHETIC` | `F1-A`, `F1-B` | `F2-D` (elle giriş), `F2-C` (haritaya tıklama) |
| `UC-03` | Tarih seçmek, zamanı oynatmak | [gosterim-ve-arayuz](design/gosterim-ve-arayuz.md) | `/api/health` içindeki `ephemeris_range`; hata kodu `date_out_of_range` | `F1-A` | `F2-D` (tarih ve süre), `F2-C` (zaman çubuğu ve oynatma) |
| `UC-04` | Güneş ve Dünya'yı ufka göre görmek | [gunes-dunya-konumu](design/gunes-dunya-konumu.md), [ufuk-hesabi](design/ufuk-hesabi.md) | `/api/horizon`, `/api/sky-series`; `HorizonProfile`, `SkySeries` | `F1-A`, `F1-B`, `F2-B` | `F2-C` (ufuk şeridi) |
| `UC-05` | Olay saatlerini ve kalan süreyi görmek | [olaylar-ve-sureler](design/olaylar-ve-sureler.md) | `/api/events`, `/api/now`; `EventList`, `NowStatus` (`night_hours` dahil) | `F2-A` | `F2-C` (zaman çizelgesi, kalan süre göstergesi) |
| `UC-06` | Güç durumunu değerlendirmek | [guc-degerlendirmesi](design/guc-degerlendirmesi.md) | `/api/power`, `/api/panel-profiles`; `PowerSeries`, `fixed_azimuth_deg` | `F1-B` (profil verisi), `F2-A` | `F2-D` (Power sekmesi) |
| `UC-07` | İletişim penceresini değerlendirmek | [iletisim-penceresi](design/iletisim-penceresi.md), [role-etiketi](design/role-etiketi.md) | `/api/comm-window`, `earth_criterion`; `CommWindow` | `F2-A`; röle etiketi `F3-A1` | `F2-D` (Comms sekmesi); röle etiketi `F3-D1` |
| `UC-08` | Senaryoları karşılaştırmak | [karsilastirma-ve-aciklama](design/karsilastirma-ve-aciklama.md) | `/api/compare`; `Scenario`, `CompareResponse` | `F2-A` | `F2-D` (Compare sekmesi, iki kalıp, tarih kaydırıcısı) |
| `UC-09` | "Neden" açıklamasını okumak | [karsilastirma-ve-aciklama](design/karsilastirma-ve-aciklama.md) | Yeni uç nokta yok; tek girdisi değişen ikinci bir `/api/compare` çağrısı | `F2-A` | `F3-D1` |
| `UC-10` | Sonucun güvenilirliğini görmek | [olaylar-ve-sureler](design/olaylar-ve-sureler.md), [dogrulama-plani](design/dogrulama-plani.md) | `validity`, `utc_earliest`, `utc_latest`; `/api/validation` | `F2-A` (aralıklar), `F2-B` (doğrulama koşusu), `F3-B` (rapor ve uç nokta) | `F1-C` (etiket), `F2-C` (kaynak penceresi, aralık gösterimi), `F3-D1` (Validation paneli) |
| `UC-11` | Dışa aktarmak ve paylaşmak | [karsilastirma-ve-aciklama](design/karsilastirma-ve-aciklama.md) | Yeni uç nokta yok | – | `F2-D` (CSV, JSON, adres çubuğunda senaryo) |
| `UC-12` | Haritada sahayı ve katmanları görmek | [gosterim-ve-arayuz](design/gosterim-ve-arayuz.md), [kalici-golge-katmani](design/kalici-golge-katmani.md) | `/api/layers/{name}`: `hillshade`, `elevation`, `slope`, `psr` | `F2-B`; kalıcı gölge `F3-B` | `F2-C`; kalıcı gölge `F3-C1` |
| `UC-13` | Hazır senaryoyu açmak | [gecmis-gorev-vakalari](design/gecmis-gorev-vakalari.md), [athena-demosu](design/athena-demosu.md) | `/api/reference-missions` | `F1-A` (uç nokta), `F2-B` (veri) | `F3-D1` (vakalar ve Sınıf kapısının hazır görevleri) |
| `UC-14` | Sahaları puanla sıralamak | [saha-puani](design/saha-puani.md) | `/api/site-score` | Kesme çizgisinin altında | Kesme çizgisinin altında |
| `UC-15` | Yaklaşma profili ve gölge uyarısı | [yaklasma-profili-ve-golge-uyarisi](design/yaklasma-profili-ve-golge-uyarisi.md) | `/api/approach-profile` | Kesme çizgisinin altında | Kesme çizgisinin altında |
| `UC-16` | Zemin sıcaklığını görmek | [zemin-sicakligi](design/zemin-sicakligi.md) | `/api/surface-temperature` | Kesme çizgisinin altında | Kesme çizgisinin altında |
| `UC-17` | İniş tarihini oyunla denemek | [mini-oyun](design/mini-oyun.md) | `/api/events` içindeki `metrics` | `F2-A` | `F3-D2` |

### 5.2 Senaryolar hangi fazın sonunda gösterilebilir

| Senaryo | Faz | Neye bağlı |
|---|---|---|
| `S-01` Plan değişti: aynı saha, başka tarih | Faz 2 | `F2-A`, `F2-D`. Demonun ana senaryosu |
| `S-02` Aynı tarih, başka saha | Faz 2 | `F2-A`, `F2-D`; "neden" kartı Faz 3'te eklenir |
| `S-03` Güneş ufukta sürünüyor | Faz 2 | `F2-C`. Demonun açılış görüntüsü |
| `S-04` Küçük hata, büyük fark | Faz 2 | `F2-A` (aralıklar), `F2-C` (aralık ve kaynak gösterimi) |
| `S-05` Paneli yükseltmek | Faz 2 | `F1-B` (2 m ve 10 m arazi ufku), `F2-A`, `F2-D`. Arazi ufku hesaplanamazsa bu senaryo gösterilmez (11. bölüm, risk 1) |
| `S-06` Alçak Güneş tek başına başarısızlık değildir | Faz 3 | `F3-D1` |
| `S-07` Panelin baktığı yön | Faz 3 | `F2-A` (`fixed_azimuth_deg`), `F3-D1` |
| `S-08` Dünya hiç görünmüyor | Faz 3 | `F3-A1` (röle etiketi), `F3-D1` |
| `S-09` Ay'dan Güneş tutulması | Faz 3 | `F3-A1`, `F3-C1` |
| `S-10` Athena demosu | Faz 3 | `F3-D1`. Gölge uyarısı adımı kesme çizgisinin altındadır; o adım yapılmazsa atlanır |

### 5.3 Challenge hedefleri

Kimlikler kullanıcı planının 8.1 bölümündeki sırayladır.

| Hedef | Karşılandığı faz | Not |
|---|---|---|
| O1 Saha seçimi ve karşılaştırma | Faz 2 | |
| O2 Tarih ve saat esnekliği | Faz 2 | |
| O3 Güneş ve Dünya gösterimi, batışa kalan süre | Faz 2 | Challenge metninin zorunlu tuttuğu tek hedef |
| O4 Güç ve iletişim değerlendirmesi | Faz 2 | |
| O5 Birden çok gösterim | Faz 2 | Ufuk şeridi, zaman çizelgesi ve 2B harita. 3B görünüm ekip dışında (10. bölüm) |
| O6 Zaman içindeki değişim | Faz 2 | |
| O7 Farklı beceri düzeyleri | Faz 3 | Üç kapı ve "neden" kartları. Bu yüzden `F3-C1` ve `F3-D1` kesme sırasında en sona kalır |

## 6. Faz 1: Temel

Amaç: dört hattın birbirini beklemeden ilerleyebileceği zemini kurmak. Bu fazdaki dört issue'nun hiçbir bağımlılığı yoktur.

### F1-A: `feat(backend): add api skeleton and sun-earth position series`

- **Hat ve kişi:** A, Oğuzhan (öneri)
- **Branch:** `feat/backend-skeleton-sky-series`
- **Karşıladığı use case'ler:** `UC-02`, `UC-03`, `UC-04` (hesap tarafı); `UC-01` ve `UC-13` için uç noktalar
- **Dayandığı belgeler:** [gunes-dunya-konumu.md](design/gunes-dunya-konumu.md), [ADR-0002](adr/0002-koordinat-sistemi-ve-zaman.md), [ADR-0004](adr/0004-api-uc-noktalari.md), [veri-kaynaklari-ve-on-hesap.md](design/veri-kaynaklari-ve-on-hesap.md)

**Kapsam**

1. Python paketini kurmak. Bağımlılıklar: FastAPI, Uvicorn, SpiceyPy, NumPy, rasterio; geliştirme için pytest ve httpx. rasterio B hattı içindir; B bu dosyaya dokunmasın diye baştan eklenir.
2. SPICE dosyalarını indiren betik: beş dosya `data/raw/kernels/` altına iner ([ADR-0002](adr/0002-koordinat-sistemi-ve-zaman.md), madde 12). `data/raw/` depoya girmez.
3. Sunucu iskeleti: `/api` kökü, `backend/app/api/` altındaki yönlendiricilerin kendiliğinden yüklenmesi, [ADR-0004](adr/0004-api-uc-noktalari.md) içindeki hata gövdesi ve hata kodları.
4. Güneş ve Dünya konumu. Hesap arşivindeki `site_azel_spice.py` betiği, tarih yazımı düzeltilerek alınır ([ADR-0002](adr/0002-koordinat-sistemi-ve-zaman.md), madde 7). Çıktı: yön açısı, yükseklik açısı, uzaklık ve görünen yarıçap.
5. Görünen oran: Güneş ve Dünya diskinin ufkun üstünde kalan kısmı ([ufuk-hesabi.md](design/ufuk-hesabi.md), "Güneş'i disk olarak ele almak").
6. Konum çözme: `site_id` ya da enlem ve boylam; aralık denetimi; 180'den büyük boylamın çevrilmesi.
7. Geçici düz ufuk sağlayıcısı. B'nin ufuk modülü bu fazda yazıldığı için A, `SkySeries` içindeki ufuk alanlarını kendi küçük düz ufuk işleviyle doldurur. Bu işlev `F2-A` içinde kaldırılır.
8. Uç noktalar: `/api/health` (`ephemeris_range` dahil), `/api/sky-series`, `/api/sites`, `/api/panel-profiles`, `/api/reference-missions`. Son üçü `data/` altındaki dosyaları olduğu gibi sunar.
9. Sözleşme testi yardımcısı: bir yanıtın alan adlarını `data/examples/` altındaki örnek dosyayla karşılaştırır.
10. `.gitignore` içine `data/raw/` eklemek; `AGENTS.md` içindeki "Commands" tablosunu ve proje durumu cümlesini, `README.md` içindeki "Tech Stack" tablosunu doldurmak ([ADR-0001](adr/0001-uygulama-mimarisi-ve-stack.md), "Yapılacaklar").

**Dokunduğu dosyalar**

- `backend/pyproject.toml`, `backend/README.md`
- `backend/app/__init__.py`, `main.py`, `errors.py`, `settings.py`
- `backend/app/core/ephemeris.py`, `visibility.py`, `location.py`, `catalog.py`, `sphere_horizon.py`
- `backend/app/models/common.py`, `sky.py`
- `backend/app/api/health.py`, `sky.py`, `sites.py`, `profiles.py`, `missions.py`
- `backend/scripts/download_kernels.py`
- `backend/tests/core/`, `backend/tests/api/`, `backend/tests/contract.py`, `backend/tests/fixtures/`
- `.gitignore`, `AGENTS.md`, `README.md`

**Kabul ölçütleri**

1. `python backend/scripts/download_kernels.py` beş dosyayı indirir; ikinci çalıştırmada yeniden indirmez.
2. `python -m pytest backend/tests/core backend/tests/api` geçer.
3. T1 tutar: altı iniş anında Güneş'in yön ve yükseklik açısı, Athena ve Chang'e 4 anında Dünya'nın açıları 0,01 derece içinde.
4. T2a tutar: Mons Mouton test sahasında Aralık 2026 için Güneş'in en yüksek açısı ve Dünya'nın yükseklik aralığı 0,01 derece içinde.
5. `/api/sky-series`, `hours` 24 ve `step_minutes` 60 ile 25 örnek döndürür; `hours` 0 ile tek örnek döndürür ([ADR-0004](adr/0004-api-uc-noktalari.md), "Sınırlar").
6. Yanıtta `ephemeris` nesnesi `source`, `frame` (`MOON_ME`) ve `correction` (`LT+S`) alanlarını taşır; düz ufukla hesaplandığı için `validity` değeri `SYNTHETIC`, `horizon.method` değeri `sphere` olur.
7. Hatalar: bilinmeyen `site_id` için 404 ve `site_not_found`; enlem 95 için 422 ve `invalid_parameter`; aralık dışı tarih için 422 ve `date_out_of_range`, mesajda geçerli aralık; SPICE dosyaları yokken 503 ve `data_unavailable`.
8. Boylam 206,0148 girildiğinde eksi 153,9852 olarak işlenir.
9. `/api/health` yanıtındaki `ephemeris_range`, yüklenen konum dosyasının kapsadığı aralıktan okunur; elle yazılmaz.
10. `data/sites.json` henüz yokken `/api/sites` 503 döndürür; testler `backend/tests/fixtures/` altındaki kendi küçük dosyalarını kullanır.
11. 30 günlük, saatlik bir seri için ölçülen süre PR açıklamasına yazılır ([ADR-0004](adr/0004-api-uc-noktalari.md), "Sınırlar" bölümündeki varsayım için).

**Bağımlılıklar:** Yok.

### F1-B: `feat(data): add site catalog, panel profiles and horizon module`

- **Hat ve kişi:** B, Tuna (öneri)
- **Branch:** `feat/site-data-horizon-module`
- **Karşıladığı use case'ler:** `UC-01`, `UC-02`, `UC-04`, `UC-06` (veri ve ufuk tarafı)
- **Dayandığı belgeler:** [saha-katalogu.md](design/saha-katalogu.md), [ufuk-hesabi.md](design/ufuk-hesabi.md), [guc-degerlendirmesi.md](design/guc-degerlendirmesi.md), [veri-kaynaklari-ve-on-hesap.md](design/veri-kaynaklari-ve-on-hesap.md), [ADR-0003](adr/0003-veri-sozlesmesi.md)

**Kapsam**

1. `data/sites.json`: saha kataloğundaki on saha; koordinat, kategori, durum, kaynak ve güvenilirlik etiketi tablodakiyle aynı. İniş saati yalnızca doğrulanmış olanlarda yazılır.
2. `data/panel_profiles.json`: dört panel tipi için birer profil; alan 1 metrekare, verim 0,27, direk yüksekliği 2 m, etiket `SYNTHETIC` ([guc-degerlendirmesi.md](design/guc-degerlendirmesi.md), bölüm 8).
3. Düz ufuk: gözlem yüksekliğinden ufuk alçalması; 720 eşit değerli profil.
4. Ufuk açısı okuma: iki komşu yön arasından doğrusal; 359,5 ile 0 derece komşu.
5. Ufuk sağlayıcısı: hazır sahada ve 2 ya da 10 m yükseklikte dosyadan okur; başka her durumda düz ufuk döndürür ([ADR-0003](adr/0003-veri-sozlesmesi.md), "Direk yüksekliği kuralı").
6. İzdüşüm: güney kutbu merkezli düz izdüşümde enlem ve boylamdan metreye ve geri çevirme ([ADR-0004](adr/0004-api-uc-noktalari.md), harita katmanları).
7. Yükseklik haritasından pencere okuma: dosya indirilmez, gereken pencere internetten okunur ([veri-kaynaklari-ve-on-hesap.md](design/veri-kaynaklari-ve-on-hesap.md), "Verinin alınması").
8. Arazi ufku hesabı: 720 yön, yakında sık ve uzakta seyrek örnekleme, Ay'ın eğriliği düzeltmesi, en fazla 150 km ([ufuk-hesabi.md](design/ufuk-hesabi.md), "Arazi ufku").
9. Ön hesap betiği ve ilk koşu: Mons Mouton test sahası için 2 m ve 10 m profilleri `data/horizons/` altına yazılır.
10. `data/examples/projection_vectors.json`: izdüşüm için birkaç nokta ve karşılıkları; arayüzün ters izdüşümü bunlarla sınanır.

**Dokunduğu dosyalar**

- `data/sites.json`, `data/panel_profiles.json`
- `data/horizons/mons-mouton-im2-target_2m.json`, `data/horizons/mons-mouton-im2-target_10m.json`
- `data/examples/projection_vectors.json`
- `backend/app/terrain/__init__.py`, `horizon.py`, `projection.py`, `dem.py`, `raycast.py`
- `backend/scripts/precompute_horizons.py`
- `backend/tests/terrain/`, `backend/tests/data/`

**Kabul ölçütleri**

1. `python -m pytest backend/tests/terrain backend/tests/data` geçer. `F1-A` birleşmeden önce de çalışabilsin diye bu klasörlerdeki `conftest.py`, `backend` klasörünü Python yoluna ekler.
2. T4 tutar: 1, 2, 5 ve 10 m için ufuk alçalması ve ufuk uzaklığı eşik içinde.
3. `data/sites.json` içindeki on kaydın kimliği, enlemi ve boylamı saha kataloğu tablosuyla aynıdır; boylamlar eksi 180 ile artı 180 arasındadır; iki Mons Mouton kaydı ayrıdır.
4. İzdüşüm gidiş dönüşü derecenin milyarda biri içinde aynı noktayı verir; güney kutbu sıfır noktasına düşer.
5. Arazi hesabı yapay arazide sınanır: düz bir arazide sonuç düz ufukla aynıdır; bilinen uzaklıkta bilinen yükseklikte bir duvar beklenen açıyı verir; 100 km uzaklıkta eğrilik düşüşü yaklaşık 2,9 km alınır ([ufuk-hesabi.md](design/ufuk-hesabi.md), adım 4).
6. İki profil dosyası 720 değer taşır; `method` değeri `terrain`, `validity` değeri `DERIVED`; `dem` alanında kullanılan haritanın adı, çözünürlüğü ve adresi yazılıdır.
7. 10 m profilindeki her değer, aynı yöndeki 2 m değerinden büyük değildir.
8. Bir profilin hesap süresi ve okunan veri miktarı PR açıklamasına yazılır ([ufuk-hesabi.md](design/ufuk-hesabi.md), bölüm 8'deki varsayım için).
9. Panel profillerinin dördü de `SYNTHETIC` etiketi taşır.

**Bağımlılıklar:** Yok.

### F1-C: `feat(frontend): scaffold app shell from design export`

- **Hat ve kişi:** C, Göktuğ (öneri)
- **Branch:** `feat/frontend-shell`
- **Karşıladığı use case'ler:** Bütün arayüz use case'lerinin zemini; `UC-10` için güvenilirlik etiketi
- **Dayandığı belgeler:** [gosterim-ve-arayuz.md](design/gosterim-ve-arayuz.md), [DESIGN.md](../frontend-migrate/DESIGN.md), [design-export](../frontend-migrate/design-export/README.md), [ADR-0001](adr/0001-uygulama-mimarisi-ve-stack.md)

**Kapsam**

1. React, TypeScript ve Vite ile proje iskeleti. Yönlendirici, CSS çatısı ve bileşen kitaplığı eklenmez; referans arayüzde de yok ([ADR-0001](adr/0001-uygulama-mimarisi-ve-stack.md)). Test için Vitest geliştirme bağımlılığı olarak eklenir (12. bölüm, karar 6).
2. Komutlar: `dev`, `build`, `typecheck`, `test`. Geliştirme sunucusu `/api` isteklerini `127.0.0.1:8000` adresine yönlendirir ve depo kökündeki `data/examples/` klasörünü okuyabilir.
3. Görsel değerler `frontend-migrate/design-export/` altından alınır: renk, yazı tipi, hareket, simgeler.
4. Ekran iskeleti: 52 piksellik üst çubuk, PLAN ve ANALYZE düğmeleri, sol bölme, orta alan, sağ bölmede dört sekme (Sky, Power, Comms, Compare), alt bölme, durum şeridi ([gosterim-ve-arayuz.md](design/gosterim-ve-arayuz.md), "Ekran iskeleti").
5. Üst çubukta üç seçenekli kapı anahtarı: Explore, Classroom, Plan. İskelet, her kapıda yalnızca o kapıya kayıtlı panelleri gösterir. Explore ve Classroom kapılarının kendi yerleşimi `F3-C1` içinde gelir.
6. Panel kaydı: bütün panellerin yeri, kipi ve kapısı tek dosyada tanımlanır. Mini oyun paneli Explore kapısına, hazır görev paneli Classroom kapısına baştan kaydedilir. Her panel klasörüne bir yer tutucu dosya konur; C ve D sonraki fazlarda yalnızca kendi klasörlerini doldurur.
7. Güvenilirlik etiketi bileşeni: dört değer için dört metin; renge ek olarak metinle ayrışır.
8. Genel kancalar: `useStore` ve `useAsync`.
9. Açılış ekranı ve ürün adı. NASA logosu ve işaretleri kullanılmaz ([gosterim-ve-arayuz.md](design/gosterim-ve-arayuz.md), bölüm 8).

**Dokunduğu dosyalar**

- `frontend/package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- `frontend/src/main.tsx`, `src/App.tsx`
- `frontend/src/styles/`, `src/shell/`, `src/ui/`, `src/lib/hooks.ts`
- `frontend/src/features/registry.ts` ve her panel klasöründe yer tutucu `index.tsx`

**Kabul ölçütleri**

1. `npm ci --prefix frontend`, `run typecheck`, `run test` ve `run build` hatasız biter.
2. `npm --prefix frontend run dev` ile açılan sayfada üst çubuk, iki kip düğmesi, dört sekme, alt bölme ve durum şeridi görünür; kip ve sekme değişimi çalışır.
3. Kapı anahtarı üç değer arasında geçer ve seçim adres çubuğunda `door` parametresi olarak saklanır; sayfa yenilenince korunur.
4. Panel kaydında 3.2 tablosundaki on üç panelin hepsi vardır; her biri yer tutucu metniyle açılır. Explore kapısında yalnızca Explore'a kayıtlı paneller, Classroom kapısında yalnızca Classroom'a kayıtlı paneller görünür.
5. Renk ve yazı tipi değerleri kodda elle yazılmaz; `design-export` içindeki değişkenlerden gelir.
6. En küçük yazı boyutu 12 pikseldir; köşe yuvarlaklığı 2 pikseldir ([gosterim-ve-arayuz.md](design/gosterim-ve-arayuz.md), "Tasarım ilkeleri").
7. Güvenilirlik etiketi dört değerin dördünü de gösterir: Measured, Model, Derived, Assumed.
8. Arayüz metinleri İngilizcedir.

**Bağımlılıklar:** Yok.

### F1-D: `feat(frontend): add api types, example payloads, client and store`

- **Hat ve kişi:** D, Ahmet (öneri)
- **Branch:** `feat/frontend-data-layer`
- **Karşıladığı use case'ler:** Bütün arayüz use case'lerinin veri tarafı; `UC-11` için senaryonun adres çubuğunda tutulması
- **Dayandığı belgeler:** [ADR-0003](adr/0003-veri-sozlesmesi.md), [ADR-0004](adr/0004-api-uc-noktalari.md), [net-types.ts](../frontend-migrate/design-export/api-contract/types/net-types.ts)

**Kapsam**

1. Tipler: [ADR-0003](adr/0003-veri-sozlesmesi.md) içindeki her yapı için bir TypeScript tipi. Ekstra alanlar (röle, tutulma, bilgi kartı) isteğe bağlı alan olarak yer alır.
2. Örnek yanıtlar: her uç nokta için bir dosya, `data/examples/` altında. Ayrıca iki ek örnek: tutulma olayları içeren bir `EventList` ve röle alanları içeren bir `CommWindow`. Hata gövdesi için bir örnek.
3. Örnek dosyalardaki sayılar doğrulanmış değerlerden alınır (T2b: Dünya'nın batış ve doğuş anları; T5: tutulma). Doğrulanmış değeri olmayan alanlar `data/examples/README.md` içinde "yer tutucu" diye listelenir.
4. Veri katmanı: her uç nokta için tipli bir işlev. Bir ayar açıkken örnek dosyaları, kapalıyken canlı sunucuyu kullanır. Hata gövdesi tek bir hata tipine çevrilir.
5. Harita katmanı okuma: ikili diziyi ve başlıkları çözer ([DESIGN.md](../frontend-migrate/DESIGN.md), 6.3). Örnek kipinde küçük bir yapay dizi döndürür.
6. Senaryo durumu: etkin senaryo, seçili an ve karşılaştırma listesi (en fazla dört). Durum adres çubuğuna yazılır ve oradan okunur; tanımadığı parametreleri korur.
7. Bu dosyalar React'e bağlı değildir; arayüz iskeleti olmadan da derlenir.

**Dokunduğu dosyalar**

- `frontend/src/api/types.ts`, `client.ts`, `config.ts`, `errors.ts`, `layers.ts`, `examples.ts`
- `frontend/src/state/scenario-store.ts`, `url-sync.ts`
- `data/examples/health.json`, `sites.json`, `horizon.json`, `sky-series.json`, `events.json`, `events-eclipse.json`, `now.json`, `comm-window.json`, `comm-window-relay.json`, `power.json`, `compare.json`, `reference-missions.json`, `panel-profiles.json`, `error.json`, `README.md`

**Kabul ölçütleri**

1. Her örnek dosya kendi tipine uyar: `examples.ts` her dosyayı tipli bir sabite atar ve derleme hatasız biter. İskelet (`F1-C`) birleşmişse `npm --prefix frontend run typecheck`; birleşmemişse aynı denetim yalnızca bu issue'nun dosyaları verilerek `npx tsc` ile yapılır.
2. Alan adları [ADR-0003](adr/0003-veri-sozlesmesi.md) ile birebir aynıdır: küçük harf, alt çizgi, açı alanlarında `_deg`, zaman alanlarında sonu `Z` ile biten UTC.
3. Bilinmeyen değer `null` yazılır; alan atlanmaz.
4. `events.json` içindeki Dünya batışı ve doğuşu T2b değerleridir; `events-eclipse.json` içindeki tutulma T5 değerleridir.
5. Örnek kipinde on iki işlevin hepsi sunucu olmadan yanıt döndürür.
6. Canlı kipte 404, 422 ve 503 yanıtları hata tipine çevrilir; `code` ve `message` korunur.
7. Senaryo adres çubuğuna yazılıp geri okunduğunda aynı senaryo elde edilir; tanınmayan `door` parametresi silinmez.
8. Karşılaştırma listesine beşinci senaryo eklenemez.

**Bağımlılıklar:** Yok.

### Faz 1 bağımlılık tablosu

| Issue | Bağlı olduğu | Aynı fazda beklediği | Paylaştığı dosya |
|---|---|---|---|
| `F1-A` | Yok | Yok | Yok |
| `F1-B` | Yok | Yok | Yok |
| `F1-C` | Yok | Yok | Yok |
| `F1-D` | Yok | Yok | Yok |

`data/examples/` klasörüne hem B hem D yazar, ama farklı dosyalara (3.2 tablosu).

### Faz 1 kapısı

Dört PR birleştikten sonra, herkes birlikte, yaklaşık 15 dakika:

1. `python -m pytest backend` ve `npm --prefix frontend run build` ana branch'te geçer.
2. Sunucu açılır; `/api/health` yanıtında `kernels_loaded` değeri `true` olur.
3. `/api/sites` on sahayı döndürür.
4. Arayüz örnek kipinde açılır.
5. Arazi ufku hesabı çalıştı mı kararı verilir (11. bölüm, risk 1).

## 7. Faz 2: Zorunlu ürün

Amaç: challenge'ın istediği her şeyi çalışır hale getirmek. Bu fazdaki issue'lar yalnızca Faz 1'e bağlıdır; birbirlerini beklemezler.

### F2-A: `feat(backend): add events, comm window, power and compare endpoints`

- **Hat ve kişi:** A, Oğuzhan (öneri)
- **Branch:** `feat/backend-events-power-compare`
- **Karşıladığı use case'ler:** `UC-05`, `UC-06`, `UC-07`, `UC-08`, `UC-10`; `UC-09` ve `UC-17` için hesap
- **Dayandığı belgeler:** [olaylar-ve-sureler.md](design/olaylar-ve-sureler.md), [guc-degerlendirmesi.md](design/guc-degerlendirmesi.md), [iletisim-penceresi.md](design/iletisim-penceresi.md), [karsilastirma-ve-aciklama.md](design/karsilastirma-ve-aciklama.md)

**Kapsam**

1. Geçici düz ufuk işlevini kaldırıp B'nin ufuk sağlayıcısına geçmek. `/api/sky-series` artık hazır sahalarda arazi ufkunu kullanır.
2. Olaylar: doğuş ve batış anlarının aranarak bulunması, pencereler, özet ölçüler ([olaylar-ve-sureler.md](design/olaylar-ve-sureler.md), bölüm 4). Güneş için ölçüt ilk kenar, Dünya için varsayılan `center`; ikisi de yanıtta `criterion` alanında bildirilir.
3. Duyarlılık aralığı: her olay, ufuk bir yay dakikası alçaltılarak ve yükseltilerek iki kez daha hesaplanır; sonuç `utc_earliest` ve `utc_latest` alanlarına yazılır (4.1, kural 6).
4. Seçili an durumu: kalan süreler, gece uzunluğu (`night_hours`), aranan sürede olay bulunamazsa `search_limited`.
5. İletişim penceresi: `CommWindow` alanları ve üç ölçüt.
6. Güç: dört panel tipi, Güneş uzaklığına göre düzeltme, görünen oran, alan ve verim; dik sabit panelde `fixed_azimuth_deg` verilmezse aralıktaki en iyi yön bulunur ve yanıtta bildirilir.
7. Karşılaştırma: en fazla dört senaryo; altı ölçü; her ölçüde en iyi senaryo; etiket senaryolar arasındaki en düşük etikettir.
8. Uç noktalar: `/api/events`, `/api/now`, `/api/comm-window`, `/api/power`, `/api/compare`.
9. Her uç nokta için sözleşme testi: yanıtın alan adları `data/examples/` altındaki dosyayla aynı.
10. Süre ölçümü ve [ADR-0004](adr/0004-api-uc-noktalari.md) içindeki sınırların ölçüme göre güncellenmesi.

**Dokunduğu dosyalar**

- `backend/app/core/events.py`, `now.py`, `comm.py`, `power.py`, `compare.py`
- `backend/app/core/sphere_horizon.py` (silinir), `backend/app/api/sky.py` (ufuk sağlayıcısı değişir)
- `backend/app/models/events.py`, `power.py`, `compare.py`
- `backend/app/api/events.py`, `now.py`, `comm.py`, `power.py`, `compare.py`
- `backend/tests/core/`, `backend/tests/api/`
- `docs/adr/0004-api-uc-noktalari.md` (yalnızca sınırlar ve değişiklik notu)

**Kabul ölçütleri**

1. `python -m pytest backend/tests/core backend/tests/api` geçer.
2. T2b tutar: Dünya'nın batışı, doğuşu ve yeniden batışı; `earth_visible_fraction` değeri 0,723, yarım puan içinde.
3. T3 tutar: dört panel tipinin üç ufuk varsayımındaki ortalama gücü yüzde yarım içinde; en uzun karanlık 232 ve 280 saat, 1 saat içinde. Alan oranı ile dikey oran arasındaki fark PR'da raporlanır.
4. T7 tutar: duyarlılık aralığı ekvatora yakın sahada yaklaşık 2 dakika, Mons Mouton'da en az 21 dakika.
5. `/api/now`, Mons Mouton test sahası için 6 Aralık 2026 00:00 anında `earth_up` değerini `false` ve Dünya'nın doğuşuna kalan süreyi yaklaşık 124,7 saat verir (yükseklik sıfır, ölçüt `center`).
6. `/api/comm-window`, aynı saha için 5 Aralık 2026 00:00 anında `visible_now` değerini `false` ve `next_change_utc` değerini 11 Aralık 04:41 verir, 2 dakika içinde.
7. Güneş ya da Dünya aralıkta hiç batmıyor ya da hiç doğmuyorsa ilgili süre `null`, `search_limited` değeri `true` olur. Chang'e 4 sahasında 2019 için `earth_visible_fraction` sıfırdır.
8. Dik sabit panelde `fixed_azimuth_deg` 270 verildiğinde, Güneş doğudayken güç sıfırdır (`S-07`).
9. `/api/compare` beş senaryo için 422 ve `too_many_scenarios` döndürür. Biri arazi ufkuyla, diğeri düz ufukla hesaplanan iki senaryonun karşılaştırması `SYNTHETIC` etiketi alır.
10. Eksi `mast_height_m` 422 ile reddedilir; 5 m ve 20 m için düz ufuk kullanılır ve yanıt bunu `horizon.method` ile bildirir.
11. Güç yanıtının etiketi, panel profili ile ufuk profilinin düşük olanıdır.
12. Her uç noktanın yanıtı sözleşme testini geçer.

**Bağımlılıklar:** `F1-A` (iskelet, Güneş ve Dünya hesabı), `F1-B` (ufuk sağlayıcısı, panel profilleri), `F1-D` (örnek yanıtlar).

### F2-B: `feat(terrain): add horizon and layer endpoints with validation run`

- **Hat ve kişi:** B, Tuna (öneri)
- **Branch:** `feat/terrain-endpoints-validation`
- **Karşıladığı use case'ler:** `UC-04`, `UC-10`, `UC-12`; `UC-13` için veri
- **Dayandığı belgeler:** [ufuk-hesabi.md](design/ufuk-hesabi.md), [dogrulama-plani.md](design/dogrulama-plani.md), [gecmis-gorev-vakalari.md](design/gecmis-gorev-vakalari.md), [veri-kaynaklari-ve-on-hesap.md](design/veri-kaynaklari-ve-on-hesap.md)

**Kapsam**

1. `/api/horizon`: konum ve `mast_height_m` alır, `HorizonProfile` döndürür.
2. Güney kutbu haritalarının kapsadığı kalan üç saha için ön hesap: `im2-athena`, `im1-odysseus`, `chandrayaan-3`; 2 m ve 10 m. Kapsam dışındaki altı saha (orta enlemler ve kuzey) ilk sürümde düz ufukla kalır ve öyle etiketlenir.
3. Harita katmanları: `mons-mouton` bölgesi için `hillshade`, `elevation` ve `slope`. Bir betik pencereleri okur ve `data/raw/layers/` altına yazar; uç nokta oradan sunar. Taşıma biçimi referans arayüzle aynıdır ([DESIGN.md](../frontend-migrate/DESIGN.md), 6.3); ızgara sınırları `X-Layer-Bounds` başlığındadır.
4. `data/reference_missions.json`: ilk altı vaka; beklenen açılar, doğrulanmış olgular, kanıt düzeyi etiketi, iniş saatinin güvenilirliği ([gecmis-gorev-vakalari.md](design/gecmis-gorev-vakalari.md)).
5. `data/examples/test_vectors.json`: 4.2 tablosundaki testlerden uç noktalarla kurulabilenler (T1, T2a, T2b, T4, T5, T7); her kayıtta uç nokta, parametreler, beklenen değer, eşik ve kaynak satırı. T3 burada yer almaz (4.2, T3 notu).
6. Doğrulama koşusu: betik test verisini çalışan sunucuya karşı koşar ve `data/validation_report.json` dosyasını yazar. Her satır: kimlik, başlık, beklenen, ölçülen, fark, eşik, birim, durum (`pass`, `warn`, `fail`, `skipped`) ve kaynak.

**Dokunduğu dosyalar**

- `backend/app/api/horizon.py`, `layers.py`
- `backend/app/terrain/layers.py`
- `backend/scripts/make_layers.py`, `run_validation.py`
- `data/horizons/` altında altı yeni dosya
- `data/reference_missions.json`, `data/examples/test_vectors.json`, `data/validation_report.json`
- `backend/tests/terrain/`, `backend/tests/data/`

**Kabul ölçütleri**

1. `python -m pytest backend/tests/terrain backend/tests/data` geçer.
2. `/api/horizon`, Mons Mouton test sahası ve 2 m için `method` değeri `terrain` olan profili; aynı saha ve 5 m için `sphere` profilini; özel bir koordinat için `sphere` profilini ve `SYNTHETIC` etiketini döndürür.
3. Yanıt, `data/examples/horizon.json` ile sözleşme testini geçer.
4. Altı yeni profil dosyası `F1-B` ölçütlerinin 6. ve 7. maddelerini sağlar. Hesaplanamayan saha olursa PR'da nedeniyle yazılır; o saha düz ufukla kalır.
5. `/api/layers/elevation?format=f32&region=mons-mouton` başlıklarıyla birlikte ikili dizi döndürür; dizinin boyu satır ve sütun sayısının çarpımının dört katıdır. Katman dosyası yoksa 503 ve `data_unavailable` döner.
6. Katman yanıtının etiketi `MEASURED` olur; kaynak haritanın adı başlıkta ya da yanıtla gelen bilgide yer alır.
7. `data/reference_missions.json` içindeki beklenen açılar [gecmis-gorev-vakalari.md](design/gecmis-gorev-vakalari.md) tablosuyla aynıdır. Her kaza nedeni cümlesinin yanında kanıt düzeyi etiketi vardır; etiketsiz neden cümlesi yoktur.
8. Çin görevlerinin kayıtlarında yalnızca NASA'nın koordinat tablosu ve resmi açıklamalar kaynak gösterilir ([saha-katalogu.md](design/saha-katalogu.md), bölüm 8).
9. Doğrulama koşusu T1 ve T4 için `pass` verir. Uç noktası henüz olmayan testler `skipped` olarak raporlanır; betik bu yüzden hata vermez.

**Bağımlılıklar:** `F1-A` (iskelet, konum çözme, sözleşme testi yardımcısı), `F1-B` (ufuk modülü, ön hesap betiği), `F1-D` (örnek yanıtlar).

### F2-C: `feat(frontend): add horizon strip, timeline, countdown and map`

- **Hat ve kişi:** C, Göktuğ (öneri)
- **Branch:** `feat/frontend-sky-timeline-map`
- **Karşıladığı use case'ler:** `UC-03`, `UC-04`, `UC-05`, `UC-10`, `UC-12`; `UC-01` ve `UC-02` için harita
- **Dayandığı belgeler:** [gosterim-ve-arayuz.md](design/gosterim-ve-arayuz.md), "Zorunlu gösterimler"; [olaylar-ve-sureler.md](design/olaylar-ve-sureler.md)

**Kapsam**

1. Ufuk şeridi (Sky sekmesi): ufuk silueti, Güneş'in ve Dünya'nın yolu, seçili andaki diskler görünen boyutlarıyla; ufkun altındaki disk soluk; üzerine gelince yön ve yükseklik açısı; kısmen örtülü Güneş'te görünen oran.
2. Zaman çizelgesi (alt bölme): güneşli ve karanlık bandı, Dünya görünür ve görünmez bandı, seçili an imleci; olaya tıklayınca zaman o ana gider; sürükleme ve oynatma; bir Ay günü ve bir ay ileri geri atlama.
3. Kalan süre göstergesi: gün batımına ya da gün doğumuna, Dünya'nın batışına ya da doğuşuna kalan süre ve gece uzunluğu. Olay yoksa geri sayım yerine durum yazılır ("Sun does not set in this period" gibi).
4. Aralık gösterimi: olay saatleri `utc_earliest` ve `utc_latest` varsa aralık olarak yazılır; aralık genişse "high uncertainty" uyarısı çıkar.
5. Kaynak penceresi: güvenilirlik etiketine basılınca ufuk yöntemi, yükseklik haritasının adı ve çözünürlüğü, konum hesabının kaynağı ve ölçüt görünür. Bilgi yanıtın kendi alanlarından okunur.
6. 2B harita: iki görünüm. Genel görünüm enlem ve boylam ızgarası üzerinde saha işaretlerini gösterir; bölge görünümü `mons-mouton` bölgesinin katmanlarını gösterir. Katman seçici ve harita açıklaması; haritaya tıklayınca nokta özel koordinat olur.
7. Ters izdüşüm: bölge görünümünde tıklanan noktanın enlem ve boylama çevrilmesi.

**Dokunduğu dosyalar**

- `frontend/src/features/sky/`, `timeline/`, `hud/`, `map/`
- `frontend/src/ui/SourcePopover.tsx`
- `frontend/src/shell/` (yalnızca oynatma denetimi)

**Kabul ölçütleri**

1. `npm --prefix frontend run typecheck`, `run test` ve `run build` geçer.
2. Örnek kipinde Mons Mouton test sahası için ufuk şeridi, zaman çizelgesi ve kalan süre göstergesi dolu görünür; sunucu gerekmez.
3. Zaman çubuğu sürüklendiğinde ufuk şeridindeki diskler ve kalan süre göstergesi birlikte güncellenir.
4. Güneşli ve karanlık bantlar renge ek olarak desenle, görünür ve görünmez diskler dolu ve boş çizimle ayrılır ([gosterim-ve-arayuz.md](design/gosterim-ve-arayuz.md), "Tasarım ilkeleri").
5. Saatler UTC olarak ve tarihiyle birlikte gösterilir.
6. `validity` değeri `SYNTHETIC` olan bir yanıtta ufuk şeridinin yanında "Assumed" etiketi ve "terrain not included" notu görünür.
7. Aralık taşıyan bir olay iki saatle gösterilir ve yanında aralığın ne anlama geldiği yazar: "range for a one arcminute horizon error".
8. Ters izdüşüm `data/examples/projection_vectors.json` içindeki noktaları derecenin milyonda biri içinde verir (birim testi).
9. Arayüzde elle yazılmış açı, saat ya da süre değeri yoktur; gösterilen her sayı veri katmanından gelir.
10. Katman dosyası yokken (503) harita ızgara ve işaretlerle çalışmaya devam eder ve "layer not available" notu gösterir.

**Bağımlılıklar:** `F1-C` (iskelet, panel kaydı, etiket, kancalar), `F1-D` (veri katmanı, senaryo durumu, örnek yanıtlar), `F1-B` (izdüşüm örnek noktaları).

### F2-D: `feat(frontend): add scenario setup, power, comms and compare panels`

- **Hat ve kişi:** D, Ahmet (öneri)
- **Branch:** `feat/frontend-scenario-panels`
- **Karşıladığı use case'ler:** `UC-01`, `UC-02`, `UC-03`, `UC-06`, `UC-07`, `UC-08`, `UC-11`
- **Dayandığı belgeler:** [kullanıcı planı](product/use-cases-and-scenarios.md), bölüm 5.3 ve 5.4; [karsilastirma-ve-aciklama.md](design/karsilastirma-ve-aciklama.md); [guc-degerlendirmesi.md](design/guc-degerlendirmesi.md); [iletisim-penceresi.md](design/iletisim-penceresi.md)

**Kapsam**

1. Senaryo kurulumu (sol bölme, PLAN kipi): kategorilere ayrılmış saha listesi, saha bilgi kartı (görev, tarih, koordinat, kaynak), elle enlem ve boylam girişi, başlangıç tarihi ve süre, direk yüksekliği (2, 5, 10, 20 m), panel tipi.
2. Girdi denetimi: geçersiz koordinat alanın yanında açıklanır ve senaryo değişmez; aralık dışı tarihte sunucunun bildirdiği aralık gösterilir ve en yakın geçerli tarih önerilir.
3. Power sekmesi: Güneş'in yükseklik açısı, güneşli süre, en uzun karanlık, güç eğrisi, ortalama güç; dik sabit panelde yön girişi.
4. Comms sekmesi: Dünya'nın yükseklik açısı, görünürlük pencereleri, kalan süre; ölçüt seçici (`center`, `first_limb`, `full_disk`).
5. Compare sekmesi: etkin senaryoyu ekleme; iki kalıp ("same site, another date" ve "same date, another site"); altı ölçü yan yana; her ölçüde en iyi senaryo ve fark; "launch slips by N days" kaydırıcısı.
6. Dışa aktarma: karşılaştırma tablosu CSV ve JSON olarak iner; senaryo bağlantısı kopyalanır.

**Dokunduğu dosyalar**

- `frontend/src/features/setup/`, `power/`, `comms/`, `compare/`
- `frontend/src/api/` ve `src/state/` (yalnızca bu panellerin gerektirdiği eklemeler)

**Kabul ölçütleri**

1. `npm --prefix frontend run typecheck`, `run test` ve `run build` geçer.
2. Örnek kipinde `S-01` baştan sona yürür: saha ve 1 Aralık 2026 seçilir, karşılaştırmaya eklenir, "same site, another date" ile 6 Aralık ve 12 Aralık eklenir, üç senaryo yan yana okunur.
3. Saha listesi kategorilere ayrılmıştır; iki Mons Mouton kaydı ayrı adlarla görünür.
4. Boylam 0 ile 360 arası yazıldığında çevrilmiş hali gösterilir; enlem 95 yazıldığında alan yanında hata görünür ve senaryo değişmez.
5. Direk yüksekliği 5 ya da 20 m seçildiğinde, yanıtın düz ufukla hesaplandığı etiketle görünür.
6. Güç sonuçlarının yanında "Assumed" etiketi görünür; sekmede batarya ya da gece dayanımı ile ilgili bir gösterge yoktur ([kullanıcı planı](product/use-cases-and-scenarios.md), `UC-06`).
7. Ölçüt değiştirildiğinde Comms sekmesi yeni ölçütle yeniden sorgular ve kullanılan ölçütü gösterir.
8. Karşılaştırmada etiketleri farklı iki senaryo varsa tablo bunu belirtir ([karsilastirma-ve-aciklama.md](design/karsilastirma-ve-aciklama.md), bölüm 4).
9. Beşinci senaryo eklenemez; düğme pasif olur ve nedenini söyler.
10. İndirilen CSV'deki sayılar ekrandaki tabloyla aynıdır; her satırda senaryonun sahası, tarihi ve güvenilirlik etiketi vardır.
11. Kopyalanan bağlantı yeni bir sekmede açıldığında aynı senaryo ve aynı karşılaştırma listesi görünür.

**Bağımlılıklar:** `F1-C` (iskelet, panel kaydı, etiket, kancalar), `F1-D` (veri katmanı, senaryo durumu, örnek yanıtlar).

### Faz 2 bağımlılık tablosu

| Issue | Bağlı olduğu | Aynı fazda beklediği | Paylaştığı dosya |
|---|---|---|---|
| `F2-A` | `F1-A`, `F1-B`, `F1-D` | Yok | Yok |
| `F2-B` | `F1-A`, `F1-B`, `F1-D` | Yok | Yok |
| `F2-C` | `F1-B`, `F1-C`, `F1-D` | Yok | Yok |
| `F2-D` | `F1-C`, `F1-D` | Yok | Yok |

`backend/app/api/` ve `backend/tests/` klasörlerine A ve B farklı dosyalarla yazar. `frontend/src/features/` altında C ve D farklı klasörlerdedir.

### Faz 2 kapısı

Dört PR birleştikten sonra, herkes birlikte, yaklaşık 45 dakika. Bu kapı ürünün ilk canlı denemesidir.

1. Arayüz canlı kipe alınır; `S-01`, `S-02`, `S-03`, `S-04` ve `S-05` sırayla yürünür.
2. `python backend/scripts/run_validation.py` ve `python -m pytest backend` çalıştırılır. T1, T2a, T2b, T4 ve T7 koşuda `pass`, T3 birim testinde geçmiş olmalıdır. `fail` varsa Faz 3'e geçilmez; önce neden bulunur.
3. Canlı yanıt ile örnek dosya arasında fark çıkarsa sözleşmeden sapan taraf düzeltir: sunucu ADR'den saptıysa A ya da B, örnek dosya saptıysa D.
4. `S-01` sayıları arazi ufkuyla yeniden okunur. Kullanıcı planı, bu senaryonun üç tarihinin arazisiz hesaba göre seçildiğini söylüyor; arazi ufku tarihleri kaydırıyorsa demo tarihleri burada güncellenir.
5. Faz 3 için kesme kararı verilir (8. bölüm).

## 8. Faz 3: Ekstralar ve teslim

Amaç: üç kapıyı, açıklamaları ve ekstraları eklemek; teslim malzemesini hazırlamak. Teslim issue'ları (`F3-A2`, `F3-C2`) yalnızca Faz 2'ye bağlıdır; ekstralar yetişmese de teslim yapılabilir.

Bir hatta iki issue varsa sıra kartta yazılıdır.

### F3-A1: `feat(backend): add relay status and eclipse events`

- **Hat ve kişi:** A, Oğuzhan (öneri). Sıra: önce bu, sonra `F3-A2`
- **Branch:** `feat/backend-relay-eclipses`
- **Karşıladığı use case'ler:** `UC-05` ve `UC-07` seçenekleri; `S-08`, `S-09`
- **Dayandığı belgeler:** [role-etiketi.md](design/role-etiketi.md), [tutulmalar.md](design/tutulmalar.md)

**Kapsam**

1. Röle durumu: `relay_status` ve `relay_required` alanları `/api/events` ve `/api/comm-window` yanıtlarına eklenir. Aralık bir aydan kısaysa ve Dünya hiç görünmediyse durum `unknown` olur.
2. Tutulmalar: Dünya'nın Güneş diskini örttüğü olaylar; `eclipse_start`, `eclipse_end` ve `max_obscured_fraction`. `/api/eclipses` uç noktası; olaylar `/api/events` yanıtına da eklenir.
3. Tutulma sırasında güç eğrisinde örtülme hesaba katılır.

**Dokunduğu dosyalar**

- `backend/app/core/relay.py`, `eclipse.py`
- `backend/app/core/events.py`, `comm.py`, `power.py`
- `backend/app/models/events.py`
- `backend/app/api/eclipses.py`
- `backend/tests/core/`, `backend/tests/api/`

**Kabul ölçütleri**

1. T5 tutar: Apollo 11 sahasında 20 ve 21 Şubat 2027 tutulmasının başlangıcı, bitişi ve en büyük örtülme oranı eşik içinde.
2. Chang'e 4 sahasında bir yıllık aralık için `relay_status` değeri `required` olur; Mons Mouton test sahasında Aralık 2026 için `required` olmaz.
3. Bir aydan kısa ve Dünya'nın hiç görünmediği aralıkta değer `unknown` olur.
4. Tutulma aralığında `/api/power` yanıtındaki güç, tutulma öncesine göre düşer (`S-09`).
5. Yanıtlar `data/examples/events-eclipse.json` ve `data/examples/comm-window-relay.json` ile sözleşme testini geçer.
6. Faz 2 testlerinin hepsi geçmeye devam eder.

**Bağımlılıklar:** `F2-A`.

### F3-A2: `docs(submission): add project description and update readme`

- **Hat ve kişi:** A, Oğuzhan (öneri)
- **Branch:** `docs/submission-description`
- **Dayandığı belgeler:** [teslim kılavuzu](challenge/project-submission-guide.pdf), [değerlendirme kılavuzu](challenge/judging-and-awards-guide.pdf)

**Kapsam**

1. Proje sayfası metni, İngilizce: proje adı, kısa özet, ayrıntılı açıklama (ne yapıyor, nasıl çalışıyor, hangi araçlarla yazıldı), kullanılan NASA verileri ve diğer kaynaklar, yapay zekâ kullanımı beyanı.
2. `README.md`: kurulum ve çalıştırma adımları, klasör düzeni, veri kaynakları ve lisans notları. [ADR-0001](adr/0001-uygulama-mimarisi-ve-stack.md) içindeki açık nokta kapatılır: NumPy, rasterio ve FastAPI lisanslarına bakılır ve yazılır.
3. `CHANGELOG.md`: ilk sürüm notu.

**Dokunduğu dosyalar**

- `docs/submission/project-description.md`
- `README.md`, `CHANGELOG.md`

**Kabul ölçütleri**

1. Metindeki her sayı ya `data/validation_report.json` içinden ya da "doğrulandı" etiketli bir doğrulama satırından gelir; yanında kaynağı yazar (4.1, kural 7).
2. Veri kaynakları listesi, kodun gerçekten kullandığı kaynaklarla aynıdır: SPICE dosyaları, kullanılan yükseklik haritaları, NASA koordinat tablosu.
3. Bilinen sınırlar açıkça yazılır: arazi ufku yalnızca güney kutbu haritalarının kapsadığı dört sahada, diğer sahalarda düz ufuk; panel profilleri varsayım; kaza nedenleri hesaplanmıyor.
4. Yapay zekâ kullanımı beyanı vardır ve teslim kılavuzunun istediği gibi nerede ve nasıl kullanıldığını söyler. Beyan `README.md` ve teslim metnindedir; commit ve PR metinlerine yazılmaz ([AGENTS.md](../AGENTS.md), kural 5).
5. NASA logosu ve işaretleri kullanılmaz.
6. `README.md` içindeki komutlar temiz bir kopyada denenmiş ve çalışmıştır.

**Bağımlılıklar:** `F2-A`, `F2-B` (doğrulama raporu). Ekstralara bağlı değildir.

### F3-B: `feat(data): add psr layer, csa cards and validation report`

- **Hat ve kişi:** B, Tuna (öneri)
- **Branch:** `feat/validation-report-psr-cards`
- **Karşıladığı use case'ler:** `UC-10`, `UC-12`; `UC-01` seçeneği
- **Dayandığı belgeler:** [dogrulama-plani.md](design/dogrulama-plani.md), [kalici-golge-katmani.md](design/kalici-golge-katmani.md), [csa-bilgi-kartlari.md](design/csa-bilgi-kartlari.md)

**Kapsam**

Sıra önemlidir; zaman daralırsa sondan kesilir.

1. Doğrulama raporu: koşu bütün testlerle yinelenir; `/api/validation` raporu sunar; `docs/validation-report.md` tabloyu ve koşulları İngilizce olarak verir.
2. T6: Mons Mouton test sahası için bir yıllık güneşli zaman oranı, NASA'nın ortalama aydınlanma haritasındaki değerle yan yana raporlanır; farkın beklenen nedenleri yazılır ([dogrulama-plani.md](design/dogrulama-plani.md), bölüm 7).
3. Kalıcı gölge katmanı: `psr` katmanı `mons-mouton` bölgesi için eklenir.
4. CSA bilgi kartları: `data/sites.json` içindeki ilgili sahalara `cards` alanı eklenir ([csa-bilgi-kartlari.md](design/csa-bilgi-kartlari.md)).

**Dokunduğu dosyalar**

- `backend/app/api/validation.py`
- `backend/app/terrain/layers.py`, `backend/scripts/make_layers.py`, `backend/scripts/run_validation.py`
- `data/validation_report.json`, `data/sites.json`
- `docs/validation-report.md`
- `backend/tests/terrain/`, `backend/tests/data/`

**Kabul ölçütleri**

1. Raporda 4.2 tablosundaki her test bir satırdır; her satırda koşul, beklenen, ölçülen, fark, eşik, durum ve kaynak vardır. T3 satırı A hattının birim testinin sonucundan yazılır. `fail` satırı varsa gizlenmez.
2. T6 satırı "approximate comparison" olarak etiketlenir; eşik uygulanmaz ve "doğrulandı" diye sunulmaz (4.1, kural 11).
3. `/api/validation` yanıtı `data/validation_report.json` ile aynıdır.
4. `psr` katmanı diğer katmanlarla aynı ızgaradadır; etiketi `MEASURED` olur. Katmanın adı ve açıklaması buz iddiası taşımaz ([kalici-golge-katmani.md](design/kalici-golge-katmani.md)).
5. Bilgi kartlarındaki her cümlenin kaynağı [dogrulama/csa-ve-diger-ulkeler.md](research/dogrulama/csa-ve-diger-ulkeler.md) içinde "doğrulandı" etiketli bir satırdır.
6. `data/sites.json` içindeki on sahanın koordinatları değişmez; `backend/tests/data` geçmeye devam eder.

**Bağımlılıklar:** `F2-A` (olay ve güç uç noktaları), `F2-B` (doğrulama betiği, katman altyapısı).

### F3-C1: `feat(frontend): add explore and classroom doors with event markers`

- **Hat ve kişi:** C, Göktuğ (öneri). Sıra: önce bu, sonra `F3-C2`; teslim saati yaklaşırsa `F3-C2` öne alınır
- **Branch:** `feat/frontend-doors-markers`
- **Karşıladığı use case'ler:** `UC-09` (düzeyler), `UC-12`, `UC-05` seçeneği; challenge hedefi O7
- **Dayandığı belgeler:** [gosterim-ve-arayuz.md](design/gosterim-ve-arayuz.md), "Üç giriş kapısı"; [kitle stratejisi](product/audience-strategy.md)

**Kapsam**

1. Explore kapısının yerleşimi: ana ekran ufuk şeridi ve zaman çubuğudur; tek cümlelik sonuç görünür. Hangi panelin bu kapıda görüneceği Faz 1'deki panel kaydından gelir; bu iş yerleşimi ve tek cümlelik sonucu ekler.
2. Classroom kapısının yerleşimi: ufuk şeridi ve zaman çubuğunun yanında hazır görev paneli durur. Panelin içeriği D hattındadır (`F3-D1`); panel boşken de yerleşim çalışır.
3. Üç kapı aynı saha, tarih ve seçili anı paylaşır; kapı değişince senaryo değişmez.
4. Haritada kalıcı gölge katmanı seçeneği; açıklamasında "shadow, not ice" notu.
5. Zaman çizelgesinde tutulma işareti; ufuk şeridinde tutulma sırasında Güneş diskinin örtülen kısmı.

**Dokunduğu dosyalar**

- `frontend/src/shell/doors/`
- `frontend/src/features/sky/`, `timeline/`, `map/`

**Kabul ölçütleri**

1. `npm --prefix frontend run typecheck`, `run test` ve `run build` geçer.
2. Kapı değiştirildiğinde adres çubuğundaki saha, tarih ve seçili an aynı kalır.
3. Explore kapısındaki tek cümlelik sonuç sunucudan gelen ölçülerden üretilir; elle yazılmış sayı içermez.
4. Explore ve Classroom kapılarında da güvenilirlik etiketi görünür.
5. Tutulma işareti `data/examples/events-eclipse.json` ile örnek kipinde görünür; canlı sunucuda tutulma uç noktası yoksa işaret çıkmaz ve hata oluşmaz.
6. Kalıcı gölge katmanı yokken (503) seçenek pasif görünür.

**Bağımlılıklar:** `F2-C`.

### F3-C2: `docs(submission): add seven-slide demo deck`

- **Hat ve kişi:** C, Göktuğ (öneri)
- **Branch:** `docs/submission-demo-deck`
- **Dayandığı belgeler:** [teslim kılavuzu](challenge/project-submission-guide.pdf); [kullanıcı planı](product/use-cases-and-scenarios.md), bölüm 9; [athena-demosu.md](design/athena-demosu.md)

**Kapsam**

1. En fazla yedi slayt, başlık ve giriş dahil, İngilizce.
2. İçerik: takım adı ve üyeler, seçilen challenge, ürünün görüntüsü, kullanıcı deneyimi, NASA verisinin çözümü nasıl mümkün kıldığı (teslim kılavuzunun istediği başlıklar).
3. Ana senaryo `S-01`, açılış görüntüsü `S-03` ([kullanıcı planı](product/use-cases-and-scenarios.md), bölüm 9).
4. Bir slayt doğrulamaya ayrılır: doğrulama raporunun özeti.

**Dokunduğu dosyalar**

- `docs/submission/demo/`

**Kabul ölçütleri**

1. Slayt sayısı yediyi geçmez; dil İngilizcedir.
2. Ekran görüntüleri çalışan üründen alınır; çizim ya da taslak, ürün görüntüsü gibi sunulmaz.
3. Slaytlardaki her sayı doğrulama raporundan ya da "doğrulandı" etiketli bir satırdan gelir (4.1, kural 7).
4. Arazisiz hesaplanan sayıların yanında bunun notu vardır.
5. NASA logosu ve işaretleri yoktur. Yapay zekâ ile üretilmiş görsel varsa üzerinde görünür filigran vardır.
6. Sunum herkese açık bir bağlantıdan, parola ya da kayıt gerektirmeden açılır.

**Bağımlılıklar:** `F2-A`, `F2-B`, `F2-C`, `F2-D` (çalışan ürün). Ekstralara bağlı değildir; ekstralar yetişirse görüntüler kod dondurulduktan sonra yenilenir.

### F3-D1: `feat(frontend): add past missions, guided tasks and why cards`

- **Hat ve kişi:** D, Ahmet (öneri). Sıra: önce bu, sonra `F3-D2`
- **Branch:** `feat/frontend-missions-tasks-why`
- **Karşıladığı use case'ler:** `UC-09`, `UC-10`, `UC-13`; `UC-01` ve `UC-07` seçenekleri; `S-06`, `S-07`, `S-08`, `S-10`
- **Dayandığı belgeler:** [gecmis-gorev-vakalari.md](design/gecmis-gorev-vakalari.md), [athena-demosu.md](design/athena-demosu.md), [karsilastirma-ve-aciklama.md](design/karsilastirma-ve-aciklama.md), [kitle stratejisi](product/audience-strategy.md)

**Kapsam**

Sıra önemlidir; zaman daralırsa sondan kesilir.

1. "Neden" kartları: bir sonucun ya da farkın yanındaki bağlantıdan açılır; üç düzey (Explore, Classroom, Plan). Planlamacı düzeyi, tek girdisi değişen ikinci bir karşılaştırmayla farkı o girdiye bağlar.
2. Geçmiş görevler listesi: altı vaka. Seçilince saha ve an yüklenir; doğrulanmış olgular ve kanıt düzeyi etiketi görünür. Athena için "Load demo" düğmesi.
3. Hazır görevler (Classroom kapısı): önceden ayarlanmış bir durum, bir soru ve bir açıklama. İlk set kitle stratejisindeki dört görevdir.
4. Validation paneli: `/api/validation` tablosunun özeti.
5. Comms sekmesinde "Relay required" etiketi; saha bilgi kartında CSA kartları.
6. Tek cümlelik kanca bilgiler (Explore kapısı).

**Dokunduğu dosyalar**

- `frontend/src/features/why/`, `missions/`, `tasks/`, `validation/`
- `frontend/src/features/comms/`, `setup/` (yalnızca etiket ve kart)
- `frontend/src/content/why-cards.json`, `guided-tasks.json`, `hook-facts.json`
- `data/examples/validation.json`

**Kabul ölçütleri**

1. `npm --prefix frontend run typecheck`, `run test` ve `run build` geçer.
2. Her kart yalnızca hesaplanan şeyi söyler; hesaplanmayan bir nedeni ima etmez ([karsilastirma-ve-aciklama.md](design/karsilastirma-ve-aciklama.md), "Neden kartları").
3. Bir kaza nedeni gösterilen her yerde kanıt düzeyi etiketi vardır: Official report, Preliminary ya da Commentary. Kurumun kullandığı dil korunur.
4. Athena vakasında kapanış cümlesi görünür: "We do not claim to explain why a mission failed. We show how the sky differs between sites and dates."
5. İçerik dosyalarındaki her sayının yanında kaynak alanı vardır ve kaynak "doğrulandı" etiketli bir doğrulama satırıdır. Kaynağı olmayan kanca bilgi eklenmez (4.1, kural 7).
6. Hazır görevlerdeki sayılar içerik dosyasına elle yazılmaz; görev açıldığında sunucudan gelir.
7. Validation paneli `fail` ve `warn` satırlarını da gösterir.
8. Çin görevlerinin vakalarında yalnızca NASA tablosundaki koordinat ve resmi açıklamalar kullanılır.

**Bağımlılıklar:** `F1-C` (hazır görev panelinin Classroom kapısındaki kaydı), `F2-B` (geçmiş görev verisi, doğrulama raporunun biçimi), `F2-D`. Röle etiketi ve CSA kartları, alan yanıtta varsa görünür; yoksa gizlenir. Bu yüzden aynı fazdaki sunucu ve veri işleri beklenmez.

### F3-D2: `feat(frontend): add landing window mini game`

- **Hat ve kişi:** D, Ahmet (öneri)
- **Branch:** `feat/frontend-landing-window-game`
- **Karşıladığı use case'ler:** `UC-17`
- **Dayandığı belgeler:** [mini-oyun.md](design/mini-oyun.md)

**Kapsam**

1. Explore kapısında "Can you pick the landing date?" kartı.
2. Seviye seçimi, tarih kaydırıcısı, "Land" düğmesi; 14 günlük aralık için `/api/events` çağrısı.
3. Üç hedefin denetimi ve sonuç ekranı; önceki denemelerin listesi; "Try another date".
4. İlk üç seviye: Apollo 11, Mons Mouton test sahası (Aralık 2026), Chang'e 4.
5. Sonuçtan aynı senaryoyu Plan kapısında açma.

**Dokunduğu dosyalar**

- `frontend/src/features/game/`
- `frontend/src/content/game-levels.json`

**Kabul ölçütleri**

1. `npm --prefix frontend run typecheck`, `run test` ve `run build` geçer.
2. Oyun batarya, ısı ya da araç dayanımı ile ilgili bir gösterge ya da hesap içermez.
3. Sonucu yalnızca `metrics` içindeki üç alan belirler: `sunlit_fraction`, `longest_dark_hours`, `earth_visible_fraction`. Arayüzdeki tek hesap oranın gün sayısına çevrilmesidir.
4. Mons Mouton seviyesinde 1 Aralık ile 20 Aralık arasındaki farklı tarihler farklı iletişim sonucu verir; canlı sunucuda denenir.
5. Chang'e 4 seviyesinde iletişim hedefi hiçbir tarihte tutmaz ve sonuç nedenini söyler.
6. Sonucun yanında güvenilirlik etiketi görünür.
7. Hedef değerler ürünün kendi hesabıyla denenip ayarlanmıştır ve seviye dosyasındadır; sonuç ekranı hedeflerin bir görev gereksinimi olmadığını belirtir.

**Bağımlılıklar:** `F1-C` (mini oyun panelinin Explore kapısındaki kaydı), `F2-A` (olay ölçüleri), `F2-D`. Explore kapısının yerleşimini bekleme gerekmez; panel Faz 1'den beri o kapıya kayıtlıdır.

### Faz 3 bağımlılık tablosu

| Issue | Bağlı olduğu | Aynı fazda beklediği | Paylaştığı dosya |
|---|---|---|---|
| `F3-A1` | `F2-A` | Yok | Yok |
| `F3-A2` | `F2-A`, `F2-B` | Yok | Yok |
| `F3-B` | `F2-A`, `F2-B` | Yok | Yok |
| `F3-C1` | `F2-C` | Yok | Yok |
| `F3-C2` | `F2-A`, `F2-B`, `F2-C`, `F2-D` | Yok | Yok |
| `F3-D1` | `F1-C`, `F2-B`, `F2-D` | Yok | Yok |
| `F3-D2` | `F1-C`, `F2-A`, `F2-D` | Yok | Yok |

Aynı hattaki iki issue aynı kişinindir ve sırayla yapılır; bu bir bekleme değildir. `docs/submission/` klasörüne A ve C farklı dosyalarla yazar. `data/sites.json` yalnızca `F3-B` tarafından, `data/examples/validation.json` yalnızca `F3-D1` tarafından değiştirilir.

### Kesme sırası

Zaman yetmezse işler aşağıdaki sırayla, yukarıdan başlanarak bırakılır. Kesme kararı Faz 2 kapısında ve kod dondurmadan iki saat önce gözden geçirilir.

| Sıra | Bırakılan iş | Etkisi |
|---|---|---|
| 1 | `F3-D2` mini oyun | `UC-17` yok |
| 2 | `F3-B` madde 4: CSA kartları | `UC-01` seçeneği yok |
| 3 | `F3-D1` madde 5 ve 6: röle etiketi gösterimi, CSA kartları, kanca bilgiler | |
| 4 | `F3-A1` tutulmalar ve `F3-C1` madde 5 | `S-09` yok |
| 5 | `F3-B` madde 3 ve `F3-C1` madde 4: kalıcı gölge katmanı | `UC-12` üç katmanla kalır |
| 6 | `F3-A1` röle durumu | `S-08` etiketsiz gösterilir |
| 7 | `F3-D1` madde 2 ve 3: geçmiş görevler ve hazır görevler | `UC-13` yok; `S-06`, `S-07`, `S-10` yok |
| 8 | `F3-C1` madde 1 ve 2 ile `F3-D1` madde 1: kapılar ve "neden" kartları | Challenge hedefi O7 zayıflar; en son kesilir |

Hiçbir durumda kesilmeyenler:

- Faz 2'nin tamamı.
- Doğrulama koşusu ve raporu (`F2-B` madde 6, `F3-B` madde 1).
- Güvenilirlik etiketleri, duyarlılık aralıkları ve kaynak gösterimi.
- Teslim issue'ları (`F3-A2`, `F3-C2`).

### Zaman kalırsa

Bu işler için issue açılmaz; bir hat kendi issue'larını bitirirse sahibi buradan, kendi klasörlerine düşen işi alır. Hepsinin tasarım belgesi hazırdır.

| İş | Hat | Tasarım belgesi | Not |
|---|---|---|---|
| Saha puanı (`UC-14`) | A ve D | [saha-puani.md](design/saha-puani.md) | Puanın yanında her ölçütün kendi değeri görünmeli |
| Yaklaşma profili ve gölge uyarısı (`UC-15`) | B ve C | [yaklasma-profili-ve-golge-uyarisi.md](design/yaklasma-profili-ve-golge-uyarisi.md) | Athena demosunun ikinci adımı buna bağlı |
| Yer istasyonu katmanı (`UC-07` seçeneği) | A ve D | [iletisim-penceresi.md](design/iletisim-penceresi.md) | Yalnızca bilgi satırı; pencere hesabına katılmaz |
| Araç bilgi kartı (`UC-12` seçeneği) | B ve D | [arac-modelleri.md](design/arac-modelleri.md) | Athena'nın 3B modeli depoda hazır ([shipmodel](../shipmodel/README.md)); web arayüzünde yalnızca bilgi kartı gösterilir |
| Artemis III aday bölgeleri | B | [saha-katalogu.md](design/saha-katalogu.md) | Sınır dosyası elle indirilmeli; otomatik indirilemiyor |
| Zemin sıcaklığı (`UC-16`) | A ve D | [zemin-sicakligi.md](design/zemin-sicakligi.md) | En son. Model sonuçları yeniden hesaplanmadı; yapılırsa "doğrulanmadı" notuyla gösterilir |

## 9. Zaman planı

Saatler öneridir ve yerel saattir. Ekip uyku ve mola düzenine göre kaydırabilir; sıra ve kapılar değişmez.

| Dilim | Bitiş | Ne olur |
|---|---|---|
| Faz 1 | 15 Kasım 01:00 | Dört temel issue; ardından Faz 1 kapısı |
| Faz 2 | 15 Kasım 14:00 | Dört ürün issue'su; ardından Faz 2 kapısı ve canlı deneme |
| Faz 3 | 15 Kasım 20:00 | Ekstralar ve teslim malzemesi |
| Kod dondurma | 15 Kasım 20:00 | Bu saatten sonra yalnızca hata düzeltmesi birleşir |
| Son doğrulama koşusu | 15 Kasım 20:30 | Rapor yenilenir; slayt ve metindeki sayılar raporla karşılaştırılır |
| Teslim hedefi | 15 Kasım 22:00 | Proje sayfası doldurulur, bağlantılar başka bir tarayıcıda denenir |
| Son saat | 15 Kasım 23:59 | Teslim kapanır |

Teslim hedefi ile son saat arasındaki süre yedektir; iş planlanmaz.

## 10. Ekip dışı iş: 3B görünüm

3B arazi görünümü Unreal Engine ile, ekibin dışındaki bir kişi tarafından ayrı geliştiriliyor ve sonradan birleştirilecek ([ADR-0001](adr/0001-uygulama-mimarisi-ve-stack.md), madde 2).

- Bu iş için issue yoktur ve dört hattan hiçbiri onu beklemez.
- Web arayüzünün teslimi 3B görünüme bağlı değildir.
- Öneri: 3B görünüm de aynı sunucudan beslenir (`/api/sites`, `/api/horizon`, `/api/sky-series`); böylece Güneş ve Dünya iki görünümde aynı yerde durur ([gosterim-ve-arayuz.md](design/gosterim-ve-arayuz.md), bölüm 8).
- Athena'nın 3B modeli depoda hazırdır ([shipmodel](../shipmodel/README.md)); 3B görünüm onu kullanabilir.
- Kod dondurmadan önce çalışan bir sürüm gelirse sunumda ikinci görünüm olarak gösterilir. Gösterilecek Güneş ve Dünya konumu sunucunun verdiği değerle karşılaştırılmadan "doğrulandı" diye sunulmaz.
- İletişim: Göktuğ.

## 11. Riskler ve yedek planlar

| No | Risk | Belirti | Yedek plan | Karar anı |
|---|---|---|---|---|
| 1 | Yükseklik haritasından pencere okuma yavaş ya da hatalı; arazi ufku hesaplanamıyor | `F1-B` içinde ilk profil iki saatte çıkmıyor | Bütün sahalar düz ufukla kalır ve "Assumed" etiketiyle gösterilir. `S-05` gösterilmez. Doğrulama raporu T6'yı "yapılamadı" diye yazar. Hesap doğruluğu etkilenmez; kapsam daralır | Faz 1 kapısı |
| 2 | SPICE dosyaları bir makinede inmiyor | İndirme betiği hata veriyor | Dosyalar bir ekip arkadaşından kopyalanır (yaklaşık 46 MB). Depoya konmaz | Faz 1 içinde |
| 3 | Sunucu yanıtı ile örnek dosyalar ayrışıyor | Canlı kipte arayüz boş ya da hatalı | Sözleşme testleri bunu Faz 2 içinde yakalar; kalan farklar Faz 2 kapısında kapatılır | Faz 2 kapısı |
| 4 | Bir referans test tutmuyor | `run_validation.py` çıktısında `fail` | Eşik gevşetilmez. Önce koşullar denetlenir (yükseklik, ölçüt, aralık, ufuk); neden bulunamazsa o özellik "doğrulanmadı" notuyla gösterilir ve teslim metnine yazılır | Faz 2 kapısı |
| 5 | Faz 2 uzuyor | 15 Kasım 14:00'te ürün issue'ları açık | Faz 3 ekstraları kesme sırasına göre bırakılır; teslim issue'ları korunur | Faz 2 kapısı |
| 6 | PR'lar birikiyor; merge tek kişide | Açık PR sayısı artıyor | Küçük PR; merge için belirli saatler; Tuna yokken kimin merge edeceği kararı (12. bölüm, açık karar 3) | Plan onayı |
| 7 | Yapay zekâ aracı limiti doluyor | Bir geliştirici ara vermek zorunda | `PAUSE` mesajı ([CLAUDE.md](../CLAUDE.md)); o hattın sıradaki işi kesme sırasına göre değerlendirilir | Sürekli |
| 8 | Demo sırasında internet ya da sunucu yok | Canlı gösterim açılmıyor | Demo slayttır; görüntüler önceden alınır. Canlı gösterim gerekirse arayüz örnek kipinde açılır ve bu ekranda belirtilir | Kod dondurma |

## 12. Kararlar

### 12.1 Bu planla gelen kararlar

Plan yazılırken verilen ve plan onayıyla kesinleşecek kararlar. İtiraz olursa ilgili issue açılmadan önce değiştirilir.

| No | Karar | Gerekçe | Etkilediği yer |
|---|---|---|---|
| 1 | Sunucuda saha, panel ve geçmiş görev dosyalarını sunan uç noktalar A hattında; dosyaların içeriği B hattında | A, konum çözmek için saha dosyasını zaten okuyor; böylece Faz 1'de iki hat birbirini beklemiyor | `F1-A`, `F1-B` |
| 2 | Örnek yanıtlar `data/examples/` altında ve D hattında | [ADR-0003](adr/0003-veri-sozlesmesi.md) örneklerin burada durmasını istiyor; arayüz ve sunucu testleri aynı dosyalara bakar | `F1-D`, `F2-A`, `F2-B` |
| 3 | `/api/sky-series` iki ucu da içerir; `hours` sıfırsa tek örnek döner | Doğrulama testleri tek bir an için sorgu yapıyor | [ADR-0004](adr/0004-api-uc-noktalari.md), `F1-A` |
| 4 | Olay aralığı, ufkun bir yay dakikası oynatılmasıyla bulunan duyarlılık aralığıdır; düz ufukta da verilir | Tasarım belgelerindeki hata payı tablosu bu birimle verilmiş ve doğrulanmış; `S-04` kutup ile ekvator sahasını kıyaslamayı gerektiriyor. Tasarım belgesindeki "düz ufukta hata payı verilmez" önerisinin yerini alır | [ADR-0003](adr/0003-veri-sozlesmesi.md), [olaylar-ve-sureler.md](design/olaylar-ve-sureler.md), `F2-A`, `F2-C` |
| 5 | Harita iki görünümlüdür: saha işaretli genel ızgara ve katmanlı bölge görünümü | Katmanlar ilk sürümde yalnızca `mons-mouton` bölgesi için var; diğer sahalar da haritada görünmeli. Genel görünüme görüntü altlığı eklenmez | `F2-C` |
| 6 | Arayüz testleri için Vitest eklenir | Vite ile aynı araç ailesi; ters izdüşüm ve adres çubuğu eşlemesi gibi saf işlevlerin sınanması gerekiyor | `F1-C` |
| 7 | Barındırma yapılmaz; ürün yerelde çalışır, demo slayttır | Teslim kılavuzu çalışan bir site istemiyor; depo bağlantısı ve demo bağlantısı yetiyor. [ADR-0001](adr/0001-uygulama-mimarisi-ve-stack.md) içindeki barındırma kararı böyle kapanır | `F3-A2`, `F3-C2` |
| 8 | Üç kapı, üst çubukta üç seçenekli bir anahtardır | Kullanıcı planındaki öneri (bölüm 10, madde 1) | `F1-C`, `F3-C1` |
| 9 | Arayüz dili ilk sürümde İngilizcedir | Kullanıcı planındaki öneri (bölüm 10, madde 10); teslim malzemesi İngilizce olmak zorunda | Bütün arayüz issue'ları |
| 10 | Gün doğumu Güneş'in ilk kenarıyla sayılır; Dünya için varsayılan ölçüt merkezdir | Tasarım belgelerindeki öneriler; ikisi de yanıtta `criterion` alanında bildirilir | `F2-A` |
| 11 | Arazi ufku, güney kutbu haritalarının kapsadığı dört saha için hesaplanır (Mons Mouton test sahası, Athena'nın indiği yer, IM-1, Chandrayaan-3); diğer altı saha ilk sürümde düz ufukla kalır | Kullanılan yükseklik haritaları 60 derece güneyden kutba kadar olan bölgeyi kapsıyor ([veri-kaynaklari-ve-on-hesap.md](design/veri-kaynaklari-ve-on-hesap.md), bölüm 3) | `F1-B`, `F2-B` |

### 12.2 Ekibin vermesi gereken açık kararlar

| No | Karar | Öneri | Ne zamana kadar |
|---|---|---|---|
| 1 | Hat ve kişi eşleşmesi | 2. bölümdeki tablo. Issue'lar bu öneriye göre atandı; takas olursa issue sahipleri değiştirilir | İsteyen olursa |
| 2 | Demo slayt mı, video mu | Slayt. 30 saniyelik videoya ancak üç adım sığıyor ([athena-demosu.md](design/athena-demosu.md), bölüm 8) | Faz 2 kapısı |
| 3 | Tuna yokken PR'ları kim merge eder | Karar ekibin; plan bir öneri getirmiyor | Dağıtımdan hemen sonra |
| 4 | Yer istasyonu için alım sınırı mı, gönderim sınırı mı | Alım sınırı. Yalnızca "zaman kalırsa" listesindeki iş yapılırsa gerekir | İş alınırsa |
| 5 | 3B görünümün web arayüzüyle birleştirilme yöntemi | 10. bölümdeki öneri | Teslimden sonra |

## 13. Bu planda olmayanlar

- **Kapsamdan çıkarılan konular:** rover ile ilgili her şey, batarya ve geceyi atlatma modeli, karmaşık katkı paylaştırma, ajans merkezleri haritası, araçların devrilme hesabı ([analiz özeti](research/ANALIZ-OZETI.md), bölüm 7.5).
- **İlk sürüme girmeyenler:** tarih ve saha ısı haritası, paylaşılabilir iniş kartı, özel koordinatta arazi ufkunun anında hesaplanması, 5 ve 20 m için arazi ufku, Türkçe arayüz metinleri, referans tasarımdaki asistan ve görev raporu.
- **Altyapı:** barındırma, sunucusuz yedek (tarayıcıda hesap), CI içine test adımı eklemek. Testler yerelde ve faz kapılarında koşulur.
- **3B görünüm:** ekip dışında (10. bölüm).

## 14. Bir issue ne zaman bitmiş sayılır

1. Kabul ölçütlerinin hepsi sağlandı ve PR açıklamasında komut çıktısıyla gösterildi.
2. İlgili testler ve derleme geçiyor. Atlanan test, yer tutucu işlev ya da "sonra yapılacak" notu yok.
3. Değişiklikler issue'nun "Dokunduğu dosyalar" listesinin dışına çıkmıyor.
4. Sözleşme değiştiyse ADR'de değişiklik notu ve kanalda `CONTRACT` mesajı var.
5. Arayüzde, içerikte ve belgede görünen her sayı ya sunucudan ya da doğrulanmış bir kaynaktan geliyor; yer tutucu sayı kalmadı (4.1, kural 7).
6. Her sonuç güvenilirlik etiketini taşıyor ve arayüz onu gösteriyor.
7. PR başlığı ve commit mesajları kurallara uygun; yapay zekâ atfı yok ([AGENTS.md](../AGENTS.md)).
