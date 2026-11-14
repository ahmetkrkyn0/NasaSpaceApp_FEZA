# Şef için uygulama planı el kitabı

Bu belge şef oturumunun [uygulama planını](../PLAN.md) nasıl dağıtacağını ve yöneteceğini anlatır. Genel şef kuralları [sef.md](sef.md) içindedir ve aynen geçerlidir; bu belge yalnızca bu plana özgü olanı ekler. Bir çelişki olursa [PLAN.md](../PLAN.md) geçerlidir.

- **Yazıldığı an:** 14 Kasım 2026 akşamı
- **Teslim:** 15 Kasım 2026, 23:59 yerel saat
- **Takip issue'su:** #48 (faz kapılarının sonuçları ve kararlar oraya yorum olarak yazılır)

## 1. Devralınan durum

Plan, Göktuğ'un ayrı bir planlama oturumunda yazıldı. O oturumun bıraktığı durum:

| Konu | Durum |
|---|---|
| Plan belgeleri | `docs/implementation-plan` dalında, push edildi. İçinde: `docs/PLAN.md`, `docs/design/mini-oyun.md`, ADR-0003 ve ADR-0004 ekleri, ürün belgelerinde `UC-17`, bu el kitabı |
| Plan PR'ı | 2. bölümdeki ilk adıma bak |
| Issue'lar | 15 iş issue'su (#33 ile #47 arası) ve takip issue'su (#48) açıldı; kişilere atandı; `phase: 1`, `phase: 2`, `phase: 3` etiketleri verildi |
| Slack | Bu plan için henüz hiçbir mesaj gönderilmedi. Dağıtım şefindir (2. bölüm) |
| Kod | Yok. `backend/`, `frontend/` ve `data/` klasörleri Faz 1 ile oluşacak |
| Hat ve kişi eşleşmesi | Plandaki öneriyle atandı; Göktuğ itiraz etmedi. Takas olursa issue sahipleri değiştirilir |

Önce şunları oku: [PLAN.md](../PLAN.md) (tamamı), [ADR-0003](../adr/0003-veri-sozlesmesi.md), [ADR-0004](../adr/0004-api-uc-noktalari.md). Plan dalı henüz `main` ile birleşmediyse dosyaları dalda oku: `git show origin/docs/implementation-plan:docs/PLAN.md`.

### Issue haritası

| Kimlik | Issue | İş | Kişi | Slack adı | Branch | Bağlı olduğu | Onu bekleyenler |
|---|---|---|---|---|---|---|---|
| `F1-A` | #33 | Sunucu iskeleti, Güneş ve Dünya serisi | Oğuzhan | `oguzhan` | `feat/backend-skeleton-sky-series` | Yok | #37, #38 |
| `F1-B` | #34 | Saha verisi, panel profilleri, ufuk modülü | Tuna | `tuna` | `feat/site-data-horizon-module` | Yok | #37, #38, #39 |
| `F1-C` | #35 | Arayüz iskeleti | Göktuğ | `goktug` | `feat/frontend-shell` | Yok | #39, #40, #46, #47 |
| `F1-D` | #36 | Tipler, örnek yanıtlar, veri katmanı, senaryo durumu | Ahmet | `ahmet` | `feat/frontend-data-layer` | Yok | #37, #38, #39, #40 |
| `F2-A` | #37 | Olaylar, iletişim penceresi, güç, karşılaştırma | Oğuzhan | `oguzhan` | `feat/backend-events-power-compare` | #33, #34, #36 | #41, #42, #43, #45, #47 |
| `F2-B` | #38 | Ufuk ve katman uç noktaları, doğrulama koşusu | Tuna | `tuna` | `feat/terrain-endpoints-validation` | #33, #34, #36 | #42, #43, #45, #46 |
| `F2-C` | #39 | Ufuk şeridi, zaman çizelgesi, kalan süre, harita | Göktuğ | `goktug` | `feat/frontend-sky-timeline-map` | #34, #35, #36 | #44, #45 |
| `F2-D` | #40 | Senaryo kurulumu, Power, Comms, Compare | Ahmet | `ahmet` | `feat/frontend-scenario-panels` | #35, #36 | #45, #46, #47 |
| `F3-A1` | #41 | Röle durumu ve tutulmalar | Oğuzhan | `oguzhan` | `feat/backend-relay-eclipses` | #37 | Yok |
| `F3-A2` | #42 | Proje açıklaması ve README (teslim) | Oğuzhan | `oguzhan` | `docs/submission-description` | #37, #38 | Yok |
| `F3-B` | #43 | Doğrulama raporu, kalıcı gölge, CSA kartları | Tuna | `tuna` | `feat/validation-report-psr-cards` | #37, #38 | Yok |
| `F3-C1` | #44 | Explore ve Classroom kapıları, olay işaretleri | Göktuğ | `goktug` | `feat/frontend-doors-markers` | #39 | Yok |
| `F3-C2` | #45 | Yedi slaytlık demo (teslim) | Göktuğ | `goktug` | `docs/submission-demo-deck` | #37, #38, #39, #40 | Yok |
| `F3-D1` | #46 | Geçmiş görevler, hazır görevler, "neden" kartları | Ahmet | `ahmet` | `feat/frontend-missions-tasks-why` | #35, #38, #40 | Yok |
| `F3-D2` | #47 | Mini oyun | Ahmet | `ahmet` | `feat/frontend-landing-window-game` | #35, #37, #40 | Yok |

Her kişinin iş sırası:

| Kişi | Sıra |
|---|---|
| Oğuzhan | #33, #37, #41, #42 |
| Tuna | #34, #38, #43 |
| Göktuğ | #35, #39, #44, #45 |
| Ahmet | #36, #40, #46, #47 |

Her issue kendi başına okunabilir: kapsam, kabul ölçütleri, dokunulacak dosyalar, bağımlılıklar, hatlar arası arayüzler, sınanacak referans testler ve değerleri, komutlar, bilimsel doğruluk kuralları. Slack mesajına ayrıntı yazma; issue numarası yeter.

## 2. İlk dağıtım

Sırayla uygula. Komutlardaki `--as sef` her zaman sonda durur.

### Adım 1: Plan PR'ı

`gh pr list --head docs/implementation-plan` ile bak.

- **PR varsa:** Bu bir belge PR'ıdır; herkesin sözleşme eklerine `main` üzerinden ulaşması için öncelikli. Tek tur yeter: CI geçiyor mu, başlık kurala uyuyor mu, yapay zekâ atfı var mı. Temizse `READY` gönder ve Tuna'dan öncelikli merge iste. Codex ile uzun inceleme döngüsüne girme.
- **PR yoksa:** Göktuğ'a sor; onay verirse aç. Başlık: `docs(plan): add implementation plan, mini game and contract alignment`.

Plan dalı birleşmeden de iş başlayabilir: issue'lardaki bağlantılar kalıcı sürüm bağlantılarıdır.

### Adım 2: Sözleşme haberi

```bash
python agent_chat.py send CONTRACT 48 "Sözleşme ekleri plan dalında (docs/implementation-plan): NowStatus night_hours; PowerSeries ve Scenario fixed_azimuth_deg; health ephemeris_range; hata kodları tablosu; katman adları ve X-Layer-Bounds; sky-series iki ucu da içerir; olay aralığı bir yay dakikalık duyarlılık. Belgeler: docs/adr/0003 ve 0004" --as sef
```

### Adım 3: Faz 1 görevleri

Dört işin bağımlılığı yok; hepsi aynı anda başlar.

```bash
python agent_chat.py send TASK 33 "F1-A sunucu iskeleti: SPICE indirme betiği, Güneş ve Dünya serisi, health, sky-series, sites, panel-profiles, reference-missions. Branch feat/backend-skeleton-sky-series. Klasör: backend/app (main, core, models, api), backend/scripts/download_kernels.py, AGENTS.md ve README tabloları. Kabul: T1 ve T2a 0,01 derece içinde. Ayrıntı issue'da @oguzhan" --as sef
```

```bash
python agent_chat.py send TASK 34 "F1-B veri ve ufuk: data/sites.json (10 saha), data/panel_profiles.json, backend/app/terrain (düz ufuk, izdüşüm, harita penceresi okuma, arazi ufku), ön hesap betiği, Mons Mouton için 2 m ve 10 m profil. Branch feat/site-data-horizon-module. Kabul: T4 ve yapay arazi testleri. İlk profil iki saatte çıkmazsa haber ver. Ayrıntı issue'da @tuna" --as sef
```

```bash
python agent_chat.py send TASK 35 "F1-C arayüz iskeleti: React, TypeScript, Vite; ekran düzeni, kapı anahtarı, panel kaydı ve 13 yer tutucu, güvenilirlik etiketi, genel kancalar. Branch feat/frontend-shell. Klasör: frontend (package.json, src/shell, src/ui, src/lib, src/styles, src/features/registry.ts). Ayrıntı issue'da @goktug" --as sef
```

```bash
python agent_chat.py send TASK 36 "F1-D arayüz verisi: ADR-0003 tipleri, data/examples altında her uç nokta için örnek yanıt, veri katmanı (örnek ve canlı kip), senaryo durumu ve adres çubuğu eşlemesi. Branch feat/frontend-data-layer. Klasör: frontend/src/api, frontend/src/state, data/examples. React'e bağlı değil; iskeleti beklemez. Ayrıntı issue'da @ahmet" --as sef
```

### Adım 4: Genel durum

```bash
python agent_chat.py send STATUS - "Uygulama planı dağıtıldı: 15 issue (#33 ile #47 arası), takip #48. Faz 1 şimdi: #33 oguzhan, #34 tuna, #35 goktug, #36 ahmet. Faz 2 işleri (#37 ile #40 arası) bağımlılıkları birleşince atanır. Faz 3 işleri (#41 ile #47 arası) Faz 2 kapısından sonra. Kod dondurma 15 Kasım 20:00, teslim hedefi 22:00. Plan: docs/PLAN.md" --as sef
```

### Adım 5: Göktuğ'un kodlama oturumu

#35 için goktug kodlama oturumu kartını öner ([sef.md](sef.md), "goktug kodlama oturumu"): model Opus, ayrı worktree. Görev özeti: "Issue #35'i uygula. Dokunulacak dosyalar issue'daki listedir. Başlarken `START 35`, PR açınca `DONE 35` gönder. Merge yapma."

## 3. İşleri serbest bırakma kuralları

1. **Faz 2 işi, bağlı olduğu Faz 1 PR'larının hepsi `main` ile birleşince atanır.** Diğer hatların bitmesi ve faz kapısı beklenmez. Bağımlılıklar issue haritasındadır. Örnek: #35 ve #36 birleştiyse #40 hemen atanır.
2. **Faz 3 işleri Faz 2 kapısı geçmeden atanmaz.** Kapıda bir referans test `fail` verirse Faz 3 başlamaz; önce neden bulunur.
3. **Bir issue iki kişiye bölünmez.** Dosya sahipliği hat bazındadır ([PLAN.md](../PLAN.md), bölüm 3.2); iki kişi aynı dosyaya dokunursa çakışma çıkar.
4. **`PAUSE` gelirse:** iş kritikse (Faz 1 ve Faz 2 işlerinin hepsi kritiktir) issue'yu boşta olan birine bütün olarak aktar ve issue sahibini değiştir. Faz 3 ekstrası ise kesme sırasına bak (5. bölüm).
5. **İşini bitiren kişi:** sıradaki işinin bağımlılıkları birleşmediyse önce açık PR'lardaki düzeltmelere yardım eder. Bütün işleri bittiyse [PLAN.md](../PLAN.md) bölüm 8'deki "zaman kalırsa" listesinden, kendi hattının klasörlerine düşen bir iş alır. O listedeki işler için issue yoktur; alınırsa şef yeni bir issue açar.
6. **`START` geldiğinde:** mesajdaki dosyaları issue'daki "Files / Folders to Touch" listesiyle karşılaştır. Liste dışı dosya varsa sahibine ve o dosyanın hat sahibine haber ver.

Öneri (Göktuğ onaylarsa uygulanır): Faz 2 işi birleşen ama kapı henüz toplanamayan bir kişiye, kendi Faz 3 işi "ön çalışma" olarak açılabilir. Kapıda `fail` çıkarsa o iş durur ve önce hata giderilir.

Atama mesajı için hazır özetler (issue numarasının yanına tek satır):

| Issue | Tek satırlık özet |
|---|---|
| #37 | F2-A olaylar ve aralıklar, now, comm-window, power, compare. Branch feat/backend-events-power-compare. Kabul: T2b, T3, T7 |
| #38 | F2-B /api/horizon, /api/layers, kalan üç saha için profil, reference_missions.json, test_vectors.json, doğrulama koşusu. Branch feat/terrain-endpoints-validation |
| #39 | F2-C ufuk şeridi, zaman çizelgesi, kalan süre göstergesi, kaynak penceresi, 2B harita. Branch feat/frontend-sky-timeline-map |
| #40 | F2-D senaryo kurulumu, Power, Comms, Compare, dışa aktarma. Branch feat/frontend-scenario-panels. Kabul: S-01 örnek kipinde baştan sona yürür |
| #41 | F3-A1 röle durumu ve tutulmalar. Branch feat/backend-relay-eclipses. Kabul: T5 |
| #42 | F3-A2 proje açıklaması, README, CHANGELOG. Branch docs/submission-description. Teslim işi |
| #43 | F3-B doğrulama raporu ve /api/validation, T6, kalıcı gölge katmanı, CSA kartları. Branch feat/validation-report-psr-cards. Sıra önemli; sondan kesilir |
| #44 | F3-C1 Explore ve Classroom yerleşimleri, kalıcı gölge seçeneği, tutulma işareti. Branch feat/frontend-doors-markers |
| #45 | F3-C2 yedi slaytlık demo, İngilizce. Branch docs/submission-demo-deck. Teslim işi |
| #46 | F3-D1 "neden" kartları, geçmiş görevler, hazır görevler, Validation paneli. Branch feat/frontend-missions-tasks-why. Sıra önemli; sondan kesilir |
| #47 | F3-D2 mini oyun. Branch feat/frontend-landing-window-game. Kesme sırasında ilk bırakılan |

## 4. Faz kapıları

Kapı, bir fazın dört PR'ı birleşince herkesin birlikte yaptığı kısa denetimdir. Şef kapıyı `STATUS` ile çağırır, sonucu #48'e yorum olarak yazar ve #48'deki kutuları işaretler.

### Faz 1 kapısı (yaklaşık 15 dakika; hedef 15 Kasım 01:00)

1. `python -m pytest backend` ve `npm --prefix frontend run build` ana branch'te geçer.
2. Sunucu açılır; `/api/health` yanıtında `kernels_loaded` değeri `true` olur.
3. `/api/sites` on sahayı döndürür.
4. Arayüz örnek kipinde açılır.
5. Karar: arazi ufku hesabı çalıştı mı. `data/horizons/` altında Mons Mouton için iki profil yoksa bütün sahalar düz ufukla kalır, `S-05` demodan çıkar ve bu karar #48'e yazılır.

### Faz 2 kapısı (yaklaşık 45 dakika; hedef 15 Kasım 14:00)

1. Arayüz canlı kipe alınır; `S-01`, `S-02`, `S-03`, `S-04`, `S-05` sırayla yürünür.
2. `python backend/scripts/run_validation.py` ve `python -m pytest backend` çalıştırılır. T1, T2a, T2b, T4 ve T7 koşuda `pass`, T3 birim testinde geçmiş olmalıdır.
3. Canlı yanıt ile örnek dosya arasında fark çıkarsa sözleşmeden sapan taraf düzeltir: sunucu ADR'den saptıysa A ya da B hattı, örnek dosya saptıysa D hattı.
4. `S-01` sayıları arazi ufkuyla yeniden okunur; tarihler kaydıysa demo tarihleri güncellenir.
5. Kesme kararı verilir (5. bölüm).
6. Demo slayt mı video mu kararı Göktuğ'a sorulur (öneri: slayt).

## 5. Zaman ve kesme

| Dilim | Bitiş | Şefin yapacağı |
|---|---|---|
| Faz 1 | 15 Kasım 01:00 | Kapıyı çağır |
| Faz 2 | 15 Kasım 14:00 | Kapıyı çağır; gecikme varsa kesme sırasını uygula |
| Kesme gözden geçirme | 15 Kasım 18:00 | Açık Faz 3 işlerine bak; yetişmeyecek olanı sahibine ve Göktuğ'a bildir |
| Kod dondurma | 15 Kasım 20:00 | Bu saatten sonra yalnızca hata düzeltmesi için `READY` gönder |
| Son doğrulama koşusu | 15 Kasım 20:30 | Raporun yenilendiğini ve slayt ile metindeki sayıların raporla aynı olduğunu sor |
| Teslim hedefi | 15 Kasım 22:00 | Bağlantıların herkese açık olduğunu sor |
| Son saat | 15 Kasım 23:59 | Teslim kapanır |

Saatler öneridir; sıra ve kapılar değişmez.

Kesme sırası, yukarıdan başlanarak ([PLAN.md](../PLAN.md), bölüm 8):

1. #47 mini oyun
2. #43 içindeki CSA kartları
3. #46 içindeki röle etiketi gösterimi, CSA kartları ve kanca bilgiler
4. #41 içindeki tutulmalar ve #44 içindeki tutulma işareti
5. #43 ve #44 içindeki kalıcı gölge katmanı
6. #41 içindeki röle durumu
7. #46 içindeki geçmiş görevler ve hazır görevler
8. #44 içindeki kapı yerleşimleri ve #46 içindeki "neden" kartları (challenge hedefi O7; en son kesilir)

Hiçbir durumda kesilmeyenler: Faz 2'nin tamamı; doğrulama koşusu ve raporu; güvenilirlik etiketleri, duyarlılık aralıkları ve kaynak gösterimi; teslim işleri (#42 ve #45). Kesme kararı şefin tek başına vereceği bir karar değildir: öner, Göktuğ ya da Tuna onaylasın, sonucu #48'e yaz.

## 6. Review'da bakılacaklar

[sef.md](sef.md) içindeki review döngüsü aynen geçerlidir: önce CI, sonra Codex, en fazla iki tur, merge yok. Bu plan için ek olarak her PR'da şunlara bak.

### Her PR için

1. **Dosya sahipliği.** `gh pr diff <n> --name-only` çıktısındaki her dosya, issue'nun "Files / Folders to Touch" listesinde mi. Liste dışı dosya varsa düzeltme iste.
2. **Kabul ölçütleri.** PR açıklamasında kabul ölçütleri için komut çıktısı var mı. "Geçiyor" demek yetmez.
3. **Atlanan iş.** Atlanmış test, yer tutucu işlev ya da "sonra yapılacak" notu var mı.
4. **Sözleşme.** Alan adları [ADR-0003](../adr/0003-veri-sozlesmesi.md) ile aynı mı; sözleşme değiştiyse ADR'de değişiklik notu ve `CONTRACT` mesajı var mı.
5. **Atıf.** Commit ve PR metninde yapay zekâ atfı var mı ([AGENTS.md](../../AGENTS.md), kural 5). CI bunu zaten reddeder.

Codex'e verilen talimata şunu ekle: "Issue'daki kabul ölçütlerini ve dokunulacak dosya listesini de denetle. Koda elle yazılmış açı, saat ya da süre değeri varsa bildir."

### Bilimsel doğruluk için

Aşağıdakilerden biri görülürse PR hazır sayılmaz ([PLAN.md](../PLAN.md), bölüm 4):

1. Bir referans testin eşiği gevşetilmiş, test atlanmış ya da beklenen değer değiştirilmiş.
2. SPICE'a verilen tarihin sonunda `UTC` eki var; koordinat sistemi `MOON_ME` değil; düzeltme `LT+S` değil; açılar sahadan değil Ay'ın merkezinden hesaplanmış.
3. Bir yanıtta `validity` yok ya da düz ufukla yapılan hesap `SYNTHETIC` dışında bir etiket taşıyor.
4. Doğuş ve batış anları aranmadan, yalnızca örneklerden okunmuş.
5. Arayüz kendi başına gök mekaniği hesabı yapıyor ya da ekranda sunucudan gelmeyen bir sayı var.
6. İçerik dosyasında, slaytta ya da teslim metninde kaynağı olmayan bir sayı var. Kabul edilen kaynak: ürünün kendi hesabı ya da `docs/research/dogrulama/` altında "doğrulandı" etiketli bir satır.
7. Bir kaza nedeni kanıt düzeyi etiketi olmadan yazılmış ya da ürün nedeni hesaplıyormuş gibi sunulmuş.
8. Kalıcı gölge katmanı buz gösteriyormuş gibi adlandırılmış.
9. Çin görevleri için NASA tablosu ve resmi açıklamalar dışında bir kaynak kullanılmış.
10. Çalışma zamanında Horizons çağrılıyor.
11. Arayüzde ya da slaytta NASA logosu ya da işareti var.

Bir referans test tutmuyorsa çözüm eşiği değiştirmek değildir. Önce koşullara bakılır: gözlem yüksekliği, Dünya ölçütü, tarih aralığı, ufuk. Neden bulunamazsa özellik "doğrulanmadı" notuyla gösterilir ve bu #48'e yazılır.

### Hatlara göre en önemli kabul ölçütleri

| Issue | Kaçırılmaması gereken |
|---|---|
| #33 | T1 ve T2a çıktısı; hata kodları; `ephemeris_range` elle yazılmamış |
| #34 | T4; iki profil dosyası 720 değerli ve `DERIVED`; 10 m profili hiçbir yönde 2 m profilinden yüksek değil; hesap süresi PR'da |
| #35 | Üç kapı, iki kip, dört sekme; 13 yer tutucu; renkler `design-export` değişkenlerinden |
| #36 | Her örnek dosya tipine uyuyor; örneklerdeki sayılar doğrulanmış değerler ya da "yer tutucu" diye listelenmiş |
| #37 | T2b, T3, T7; alan oranı ile dikey oran farkı PR'da raporlanmış; geçici düz ufuk işlevi silinmiş |
| #38 | Doğrulama koşusu T1 ve T4 için `pass`; uç noktası olmayan testler `skipped`; kaza nedenlerinde kanıt etiketi |
| #39 | Ekranda elle yazılmış sayı yok; `SYNTHETIC` yanıtta "Assumed" etiketi; aralığın anlamı yazılı |
| #40 | `S-01` baştan sona; batarya göstergesi yok; CSV ekrandaki tabloyla aynı |
| #41 | T5; Faz 2 testleri hâlâ geçiyor |
| #42 | Her sayının kaynağı var; bilinen sınırlar yazılı; yapay zekâ kullanımı beyanı README ve teslim metninde |
| #43 | Raporda `fail` satırı gizlenmemiş; T6 "approximate comparison" |
| #44 | Kapı değişince saha, tarih ve seçili an aynı kalıyor |
| #45 | En fazla yedi slayt; görüntüler çalışan üründen; sayılar rapordan |
| #46 | Kartlar yalnızca hesaplananı söylüyor; içerikteki her sayının kaynak alanı var |
| #47 | Batarya yok; sonucu yalnızca üç ölçü belirliyor |

## 7. Bilinen riskler ve şefin tepkisi

| Risk | Belirti | Şefin yapacağı |
|---|---|---|
| Arazi ufku hesaplanamıyor | #34 için `START` üzerinden iki saat geçti, profil dosyası yok | Tuna'ya sor. Çözüm yoksa Faz 1 kapısında "düz ufuk" kararını Göktuğ'a götür; #34 geri kalan kapsamıyla kapanır |
| SPICE dosyaları inmiyor | #33 içinde indirme hatası | Dosyalar bir ekip arkadaşından kopyalanır; depoya konmaz |
| Sunucu yanıtı ile örnek dosyalar ayrışıyor | Faz 2 kapısında arayüz boş | 4. bölümdeki kural: sözleşmeden sapan taraf düzeltir |
| Referans test tutmuyor | Koşuda `fail` | 6. bölümdeki kural; Faz 3 başlamaz |
| Faz 2 uzuyor | 15 Kasım 14:00'te Faz 2 işleri açık | Kesme sırasını öner; teslim işlerini (#42, #45) koru |
| PR'lar birikiyor | Açık PR sayısı artıyor, `READY` bekleyen var | Tuna'ya tek mesajda sıra ver; Tuna yoksa Göktuğ'a sor (açık karar) |
| Yapay zekâ aracı limiti | `PAUSE` mesajı | 3. bölüm, kural 4 |

## 8. Açık kararlar

Şef bunları kendisi vermez; ilgili anda sorar ve cevabı #48'e yazar.

| Karar | Kime | Ne zaman |
|---|---|---|
| Tuna yokken PR'ları kim merge eder | Göktuğ ve Tuna | Dağıtımdan hemen sonra |
| Demo slayt mı, video mu | Göktuğ | Faz 2 kapısı |
| Faz 3 için "ön çalışma" kuralı (3. bölümdeki öneri) | Göktuğ | Faz 2 sürerken |
| Hat takası | Ekip | İsteyen olursa |

## 9. Bu planın dışında kalanlar

- **3B görünüm:** Unreal Engine ile, ekibin dışındaki bir kişi tarafından geliştiriliyor. Issue'su yok; `TASK` gönderilmez; kimse onu beklemez. İletişim Göktuğ üzerindendir.
- **Artemis III aday bölgeleri:** sınır dosyası elle indirilmeyi bekliyor; indirilene kadar saha listesine girmez.
- **Barındırma:** yapılmaz; ürün yerelde çalışır, demo slayttır.
- **Kapsam dışı konular:** rover, batarya ve geceyi atlatma modeli, ısı haritası. Bir PR bunları eklerse kapsam dışı olduğunu yaz.
