# Lunar Landing Site Navigator — Sunum Kanıt Dosyası

| Alan | Değer |
|------|-------|
| Proje | Lunar Landing Site Navigator (FEZA, NASA Space Apps Challenge 2026) |
| İş | `F3-C2` (#45): yedi slaytlık demo sunumu |
| Dosyalar | `SUNUM_lunar-landing-site-navigator.html`, `SUNUM_lunar-landing-site-navigator.pdf`, bu dosya |
| Tarih | 2026-11-15 (ilk sürüm 2026-11-14) |
| Commit | `b57f485` (rapor); ekran görüntüleri `112fc58` ile çalışan üründen |

**Özet.** Sunum yedi slayttır, İngilizcedir ve teslim kılavuzunun istediği başlıkları taşır: takım adı ve üyeler, seçilen challenge, ürünün görüntüsü, kullanıcı deneyimi, NASA verisinin çözümü nasıl mümkün kıldığı. Ana senaryo `S-01`, açılış görüntüsü `S-03`'tür; bir slayt doğrulama raporuna ayrılmıştır. Ekran görüntüleri yerel makinede canlı sunucudan (`?data=live`, SPICE kernel'leri yüklü, hazır arazi ufukları) alınmıştır. Sunumdaki her rakam bu defterde bir kayda bağlıdır.

**Abstract.** A seven-slide English demo deck for the NASA Space Apps 2026 submission. Main scenario S-01, opening view S-03, one slide on the validation report. Screenshots come from the running product in live mode; every number on a slide is tied to a ledger record below.

## İçindekiler

1. Sunum özeti
2. Kanıt Defteri
3. Sınırlar ve cevapları
4. Jüri kartı ve kaynakları
5. Doğrulama sonuçları
6. Sayfa başına konuşma notları
7. Kaynakça
8. Bilinen Boşluklar

## 1 Sunum özeti

| Alan | Değer |
|------|-------|
| Yarışma tipi | Açık, küresel hackathon (NASA Space Apps Challenge 2026); jüri yerel ve küresel hakemler |
| Süre | Sahne sunumu yok; çevrimiçi değerlendirilen slayt demosu |
| Sınır | En fazla 7 slayt, başlık ve giriş dahil; aşan proje küresel değerlendirmeye giremez (teslim kılavuzu) |
| Dil | İngilizce |
| Teslim biçimi | Parolasız, herkese açık bağlantı; PDF |
| Jüri ölçütleri | Impact, Creativity, Validity, Relevance, Presentation (jüri kılavuzu) |
| Tarz | Koyu teknik keynote (kullanıcı seçimi); renk ürünün kendi lavanta rengi `#baaff5` |
| Sayfa | 7 ana sayfa, ek yok (7 sınırı ek sayfaya izin vermez) |

## 2 Kanıt Defteri

| Kimlik | İddia | Değer | Köken | Sunumdaki etiket | Sayfa |
|--------|-------|-------|-------|------------------|-------|
| K1 | Aralık 2026'da Mons Mouton'da Güneş'in en yüksek açısı | 6,47 ° | test-senaryosu | ▸ in our test scenario · flat horizon, no terrain | 2 |
| K2 | Aralık 2026'da Mons Mouton'da Dünya'nın ufkun altında kaldığı süre payı | 27,7 % | test-senaryosu | ▸ in our test scenario · flat horizon, no terrain | 3 |
| K3 | Doğrulama raporunda geçen kontrol | 45 test | test-senaryosu | ▸ in our test scenario | 6 |
| K4 | Doğrulama raporunda başarısız kontrol | 0 test | test-senaryosu | ▸ in our test scenario | 6 |
| K5 | Doğrulama raporunda atlanan kontrol | 0 test | test-senaryosu | ▸ in our test scenario | 6 |
| K6 | Mons Mouton, 2027 yılı güneşli süre, arazi ufkuyla ürünün hesabı | 44,98 % | test-senaryosu | ▸ in our test scenario · approximate check | 6 |
| K7 | Aynı nokta için NASA PGDA 69 ortalama güneş görünürlüğü haritasındaki değer | 46,46 % | test-senaryosu | ▸ in our test scenario · approximate check | 6 |
| K8 | Arazi ufku için kullanılan yükseklik haritasının çözünürlüğü | 20 m | test-senaryosu | ▸ in our test scenario | 4 |

```json
[
  { "id": "K1", "iddia": "Aralık 2026'da Mons Mouton test sahasında Güneş'in en yüksek açısı", "deger": "6,47", "birim": "°", "koken": "test-senaryosu", "kaynak_turu": "dosya", "yol_veya_komut": "data/validation_report.json", "tarih": "2026-11-15", "commit": "b57f485", "ortam": "run_validation.py, in-process", "not": "T2a-sun-max-elevation; ölçülen 6,470271, referans 6,47 (Horizons), eşik 0,01; sıfır yükseklik, düz ufuk (arazi yok)" },
  { "id": "K2", "iddia": "Aralık 2026'da Mons Mouton test sahasında Dünya'nın ufkun altında kaldığı süre payı", "deger": "27,7", "birim": "%", "koken": "test-senaryosu", "kaynak_turu": "dosya", "yol_veya_komut": "data/validation_report.json", "tarih": "2026-11-15", "commit": "b57f485", "ortam": "run_validation.py, in-process", "not": "T2b-earth-hidden-fraction; ölçülen 0,2772, referans 0,277; Dünya ölçütü merkez, ufuk 0 derece (arazi yok). Aynı testte Dünya batışı 2026-12-03 10:03 UTC, doğuşu 2026-12-11 04:41 UTC" },
  { "id": "K3", "iddia": "Doğrulama raporunda geçen kontrol sayısı", "deger": "45", "birim": "test", "koken": "test-senaryosu", "kaynak_turu": "dosya", "yol_veya_komut": "data/validation_report.json", "tarih": "2026-11-15", "commit": "b57f485", "ortam": "run_validation.py, in-process", "not": "summary.pass; rapor 2026-11-14T21:06:40Z, PR #69 ile yenilendi (tutulma olayları birleştikten sonra)" },
  { "id": "K4", "iddia": "Doğrulama raporunda başarısız kontrol sayısı", "deger": "0", "birim": "test", "koken": "test-senaryosu", "kaynak_turu": "dosya", "yol_veya_komut": "data/validation_report.json", "tarih": "2026-11-15", "commit": "b57f485", "ortam": "run_validation.py, in-process", "not": "summary.fail; summary.warn de 0" },
  { "id": "K5", "iddia": "Doğrulama raporunda atlanan kontrol sayısı", "deger": "0", "birim": "test", "koken": "test-senaryosu", "kaynak_turu": "dosya", "yol_veya_komut": "data/validation_report.json", "tarih": "2026-11-15", "commit": "b57f485", "ortam": "run_validation.py, in-process", "not": "summary.skipped; önceki raporda 3 olan T5 satırları artık geçiyor" },
  { "id": "K6", "iddia": "Mons Mouton test sahası, 2027 yılı, 2 m direk, arazi ufku: ürünün hesapladığı güneşli süre payı", "deger": "44,98", "birim": "%", "koken": "test-senaryosu", "kaynak_turu": "dosya", "yol_veya_komut": "data/validation_report.json", "tarih": "2026-11-15", "commit": "b57f485", "ortam": "run_validation.py, in-process", "not": "T6-mons-mouton-sunlit-fraction, measured 44,983; kind approximate, status info; eşik yok" },
  { "id": "K7", "iddia": "Aynı nokta için NASA PGDA 69 ortalama güneş görünürlüğü haritasındaki değer", "deger": "46,46", "birim": "%", "koken": "test-senaryosu", "kaynak_turu": "dosya", "yol_veya_komut": "data/validation_report.json", "tarih": "2026-11-15", "commit": "b57f485", "ortam": "run_validation.py, in-process", "not": "T6 expected 46,464; harita 120 m/px ve 18,6 yıllık ortalama, ürünün hesabı tek yıl: yaklaşık karşılaştırma" },
  { "id": "K8", "iddia": "Arazi ufku için kullanılan yükseklik haritasının çözünürlüğü", "deger": "20", "birim": "m", "koken": "test-senaryosu", "kaynak_turu": "dosya", "yol_veya_komut": "data/horizons/mons-mouton-im2-target_2m.json", "tarih": "2026-11-14", "commit": "112fc58", "ortam": "hazır ufuk dosyası", "not": "dem.product PGDA 90 LDEM_80S_20MPP_ADJ, dem.resolution_m 20" }
]
```

## 3 Sınırlar ve cevapları

| # | Sınır | Neden | Cevap ya da sonraki adım | Kanıt | Sayfa |
|--:|-------|-------|--------------------------|-------|-------|
| 1 | Arazi ufku yalnız katalog sahalarında var | Özel noktada ufkun anında hesabı ilk sürüme alınmadı (ADR-0004, "Veri yoksa davranış") | Özel nokta düz ufukla hesaplanır ve "Assumed" etiketi taşır | `data/horizons/` | 7 |
| 2 | Ufuk hatası olay saatini kaydırır | Kutupta bir yay dakikalık ufuk farkı gün doğumunu onlarca dakika oynatır (rapor T7) | Olay saatleri aralıkla ve "high uncertainty" uyarısıyla gösterilir | `data/validation_report.json` (T7) | 7 |
| 3 | K1 ve K2 düz ufukla ölçüldü | Referans değerler Horizons ile arazisiz hesaplandı; ürün arazi ufkunu ayrıca kullanır | Slaytta "flat horizon, no terrain" notu durur; arazili değerler ürünün ekranında DERIVED etiketiyle görünür | K1, K2 | 2, 3 |

## 4 Jüri kartı ve kaynakları

| Alan | Değer | Kaynak | Tarih |
|------|-------|--------|-------|
| Demo biçimi | En fazla 7 slayt (başlık ve giriş dahil) ya da en fazla 30 saniyelik video | `docs/challenge/project-submission-guide.pdf` | 2026-11-13 |
| Slaytta bulunması gerekenler | Takım adı, üyelerin adları, seçilen challenge; ürünün görüntüsü, kullanıcı deneyimi, NASA verisinin katkısı | `docs/challenge/project-submission-guide.pdf` | 2026-11-13 |
| Barındırma | Parolasız, izinsiz, kayıtsız açılan herkese açık bağlantı | `docs/challenge/project-submission-guide.pdf` | 2026-11-13 |
| Marka | NASA logosu, bayrağı ve görev işaretleri kullanılamaz; yapay zekâ ile üretilmiş görselde görünür filigran | `docs/challenge/project-submission-guide.pdf` | 2026-11-13 |
| Ölçütler | Impact, Creativity, Validity, Relevance, Presentation; 1–5 puan | `docs/challenge/judging-and-awards-guide.pdf` | 2026-11-13 |
| Renk | Jüri markası kullanılamadığı için ürünün kendi rengi `#baaff5`; renk jüriden türetilmedi | `frontend-migrate/design-export/tokens.css` | 2026-11-14 |

| Sayfa | Ölçüt ya da kılavuz maddesi |
|------:|-----------------------------|
| 1 | Takım adı, üyeler, challenge (kılavuz) |
| 2 | Impact, Relevance: kutup sahasının sorunu |
| 3 | Presentation: kullanıcı deneyimi, ana senaryo S-01 |
| 4 | Relevance: NASA verisinin çözümdeki yeri |
| 5 | Impact, Creativity: üç kitle, tek hesap motoru |
| 6 | Validity: doğrulama raporu |
| 7 | Validity, Presentation: sınırlar ve sonraki adım |

## 5 Doğrulama sonuçları

`verify-deck.mjs` ve `render.mjs` (feza-sunum 2.4.0) ile, 2026-11-14.

| Kod | Sonuç | Değer | Eşik |
|-----|-------|-------|------|
| S1 | OK | 72 | ≥ 72 px başlık |
| S2 | OK | 2 | ≤ 2 satır |
| S3 | OK | 48 | ≥ 48 px gövde |
| S4 | OK | 36 | ≥ 36 px rollü metin |
| S5 | OK | 55 | ≤ 60 kelime |
| S6 | OK | 0 | 0 |
| S7 | OK | 0 | 0 |
| S8 | OK | 0 | 0 |
| S9 | OK | 8,49 | ≥ 4,5 (AA) |
| S10 | BİLGİ | 0 öğe | ≥ 7 (AAA) |
| S11 | OK | 0 | 0 |
| S12 | OK | 0 | 0 |
| S13 | OK | 0 | 0 |
| S14 | OK | 0 | 0 |
| S15 | OK | 0 | 0 |
| S16 | OK | 0 ihlal, 0 belirsiz düğüm | 0 |

Render: 7 HTML sayfası, 7 PDF sayfası, fontlar gömülü. Görsel öz-denetim: yedi sayfa görüntü olarak okundu; taşma, çakışma ve okunmayan yazı yok. İlk turda iki metin düzeltildi: "for days" ifadesi kanıtsız olduğu için tasarım belgesindeki krater kenarı cümlesiyle değiştirildi; doğrulama başlığındaki "NASA tools" genellemesi kaldırıldı (T3 güç referansları NASA aracından gelmiyor).

Ekran görüntüleri: `node shots.mjs .feza/deck/20261114-234156` (Playwright, canlı sunucu, 1520 × 1040 CSS px); slayt 2 ve 3 bu görüntülerin aynı oranlı kırpımlarıdır. Kişisel veri içermez.

2026-11-15 (#83): slayt 5'in görseli, Surface view panelinin göründüğü canlı Explore ekranıyla değiştirildi (`node shot-scene.mjs`, Playwright, canlı sunucu, 1520 × 1040 CSS px; ufuk şeridi, sonuç cümlesi, zaman çizelgesi bantları ve illüstrasyon görseli yüklendikten sonra). Alt yazı ve C açıklaması görselin hesaplanmamış bir illüstrasyon olduğunu söyler. Yeni rakam eklenmedi; defter değişmedi. Doğrulama yeniden çalıştırıldı: S1–S16 OK (S5 60), 7 PDF sayfası, fontlar gömülü.

## 6 Sayfa başına konuşma notları

| Sayfa | Not |
|------:|-----|
| 1 | Team FEZA: Göktuğ, Tuna, Oğuzhan, Ahmet. Challenge: Lunar Landing Site Navigator. |
| 2 | Opening view S-03: at the south pole the Sun circles just above the horizon. The 6.47° value is from the validation report, flat horizon; the screenshot shows the product with the terrain horizon. |
| 3 | Main scenario S-01: a five-day slip moves the landing into the Earth-hidden window. Compare puts 1, 6 and 12 December side by side. |
| 4 | Positions from NASA JPL SPICE, terrain horizon from the LOLA 20 m map (PGDA 90), every number labelled with its validity. |
| 5 | Explore for the public, Classroom for teachers, Plan for engineers; the same scenario in every door. The Surface view in the screenshot is a pre-rendered illustration of the terrain type, labelled Illustration in the product: not the site's real surface, nothing in it computed (#80, #83). |
| 6 | 45 reference checks pass, none fail, none skipped (report refreshed after the eclipse feature). The one-year sunlit share is compared approximately with the NASA PGDA 69 map. |
| 7 | Limits are stated with their next step: custom points use a flat horizon, event times move with horizon error and are shown as ranges, the 3D view is a separate app. |

## Kaynakça

- NASA Space Apps Challenge 2026, Project Submission Guide ve Judging and Awards Guide (`docs/challenge/`)
- `data/validation_report.json` (doğrulama raporu, PR #69 ile yenilendi, 2026-11-15)
- `data/horizons/mons-mouton-im2-target_2m.json` (hazır arazi ufku)
- `docs/product/use-cases-and-scenarios.md` (S-01, S-03, bölüm 9)
- NAIF SPICE generic kernels, https://naif.jpl.nasa.gov/pub/naif/generic_kernels/
- NASA PGDA 69 ve PGDA 90, https://pgda.gsfc.nasa.gov/

## Bilinen Boşluklar

| # | Boşluk | Neden açık | Önerilen çözüm |
|--:|--------|------------|----------------|
| 1 | Herkese açık bağlantı yok | Repo private; teslim kılavuzu parolasız bağlantı istiyor | PDF'i Google Drive'a yükleyip "bağlantıya sahip herkes" ile paylaşmak; bağlantıyı gizli pencerede denemek |
| 2 | Ekran görüntülerinde yer tutucu paneller | Geçmiş görevler, rehberli görevler ve oyun panelleri (`F3-D1`, `F3-D2`) henüz dolmadı | Kod dondurulunca görüntüleri aynı betikle yeniden almak |
