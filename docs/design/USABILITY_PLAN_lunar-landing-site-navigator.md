# Kullanılabilirlik Değerlendirme Planı: Lunar Landing Site Navigator

| Alan | Değer |
|------|-------|
| Tarih | 2026-11-17 |
| Durum | Plan. Test henüz yapılmadı; sonuçlar `docs/design/USABILITY_RESULTS_lunar-landing-site-navigator.md` dosyasına yazılacak. |
| Kapsam | Üç kullanıcı sınıfı (K1 görev planlamacı, K2 eğitimci, K3 halk), üç kapı (Plan, Classroom, Explore), rol sayfaları ve mini oyun |
| Yöntem | Görev odaklı kullanıcı testi ve sesli düşünme, post-test anketi, SUS, kısa kapanış görüşmesi; ön adım olarak heuristic walkthrough |
| Dayanak | SENG 477 hafta 4-6 kullanıcı testi protokolü |
| Girdi | [HEURISTIC_EVAL_lunar-landing-site-navigator.md](HEURISTIC_EVAL_lunar-landing-site-navigator.md), [use-cases-and-scenarios.md](../product/use-cases-and-scenarios.md), [audience-strategy.md](../product/audience-strategy.md), `frontend/src`, `data/examples/recorded/`, `README.md` |
| Taban commit | `6c84eb0` (main) |

```
Yöntem:        Görev odaklı kullanıcı testi + sesli düşünme, post-test anketi (13 soru), SUS, kapanış görüşmesi
Katılımcı:     15 (K1 5, K2 2 öğretmen + 3 öğrenci, K3 5) + 2 erişilebilirlik oturumu (AT-01, AT-02)
Görev:         18 çekirdek görev + 1 yedek görev + 5 erişilebilirlik görevi
Oturum süresi: K1 60, öğretmen 50, öğrenci 40, K3 38, AT 45 dakika
Ortam:         Her kitlenin doğal ortamı; uygulama moderatör dizüstünde canlı modda
Takvim:        6 hafta; tarihler TBD (bölüm 12.1)
```

## 1. Test Hedefleri

| # | Hedef | Ölçüt | Dayanak |
|---|-------|-------|---------|
| TH-1 | Her kapının kendi kitlesine temel işini yardımsız bitirtip bitirtmediğini ölçmek. K1: iki ya da daha çok senaryoyu aynı ölçülerle kıyaslayıp birini seçmek. K2: bir kavramı tek bir girdiyi değiştirerek göstermek. K3: bir sahada Güneş'in ve Dünya'nın ne yaptığını kendi cümlesiyle anlatmak. | M-01, M-02, M-03 | `docs/product/use-cases-and-scenarios.md`, bölüm 3, "İşini bitirdiğini nasıl anlar" sütunu |
| TH-2 | Heuristic değerlendirmede severity 3 bulunup düzeltilen beş sorunun (HE-01 ile HE-05) gerçek kullanımda giderildiğini doğrulamak. Klavye ve ekran okuyucu kullanıcılarıyla yapılan ayrı oturumlar bu hedef içindir. | M-06, gözlem notları | [HEURISTIC_EVAL_lunar-landing-site-navigator.md](HEURISTIC_EVAL_lunar-landing-site-navigator.md), bölüm 6 |
| TH-3 | Kullanıcıyı en çok etkilemesi beklenen severity 2 bulguları gözlemle doğrulamak ya da ağırlığını düşürmek, gerekirse yeniden derecelendirmek. | Gözlem formu, kritik olaylar | Aynı rapor, bölüm 5 ve 8 |
| TH-4 | Geçerlilik etiketlerinin, örnek veri notlarının ve kaynak bilgilerinin fark edilip doğru yorumlandığını ölçmek. Projenin bilimsel şeffaflık kuralı bu öğelerin görünür kalmasını şart koşar; test bunların anlaşılıp anlaşılmadığını sınar. | Görev bazlı gözlem noktaları, post-test 2. ve 13. sorular | `docs/design/gosterim-ve-arayuz.md` |
| TH-5 | Kitle başına öznel memnuniyet ve algılanan kullanılabilirlik tabanını çıkarmak; sonraki sürümde karşılaştırma için referans oluşturmak. | M-04 (SUS), M-05 | SENG 477 hafta 4-6 protokolü |

## 2. Yöntem Seçimi

Ders slaytlarındaki sorgulama yöntemlerinden (Questioning Methods) aşağıdakiler seçildi.

| Yöntem | Kullanılıyor mu | Gerekçe |
|--------|-----------------|---------|
| Heuristic Walkthrough | Evet, test öncesi tamamlandı | Görevler [heuristic değerlendirme](HEURISTIC_EVAL_lunar-landing-site-navigator.md) bulgularına göre daraltıldı ve önceliklendirildi (Albert, Tullis ve Tedesco, 2010). Severity 3 düzeltmeleri ve kullanıcıya en görünür severity 2 bulguları görevlerle eşlendi (bölüm 3.2). |
| User test (görev odaklı) | Evet, ana yöntem | Tamamlama oranı, süre ve hata sayısı yalnızca gerçek görevle ölçülebilir. Sesli düşünme (think-aloud) ile birlikte uygulanır. |
| Questionnaire | Evet | Demografik bilgi formu, post-test anketi (13 soru) ve SUS. |
| Face-to-face interview | Evet, kısa | Oturum sonunda açık uçlu kapanış görüşmesi (yürütme adımı f). |
| Observing users in work environment | Kısmen | Oturumlar her kitlenin doğal ortamında yapılır (bölüm 7). Uzun süreli saha gözlemi bu planın kapsamı dışındadır. |

## 3. Görev Senaryoları

Görevler, bölüm 3.2'deki önceliklendirmeye göre seçildi: 18 çekirdek görev (K1 6, öğretmen 4, öğrenci 3, K3 5), 1 yedek görev (T-P07) ve erişilebilirlik oturumları için 5 kısaltılmış görev (T-A01-T-A05). Kimlikler: T-P (K1 planlamacı), T-E (K2 öğretmen), T-S (K2 öğrenci), T-H (K3 halk), T-A (erişilebilirlik). Use case kimlikleri (UC-xx) kullanıcı planından, bulgu kimlikleri (HE-xx) heuristic değerlendirmeden alınmıştır.

### 3.1 Ortak Kurallar

- **İpucu yasağı.** Görev metni katılımcıya Türkçe okunur ve basılı kart olarak verilir. Metin arayüz etiketi, kapı, sekme, düğme ya da panel adı içermez; amacı söyler, yolu söylemez. Gözlemci sütunlarında ise etiketler özgün İngilizce adlarıyla yazılmıştır.
- **Başlangıç adresi.** Her görev kendi başlangıç adresinden açılır. `<taban>` = `http://127.0.0.1:5173/?data=live` (moderatör dizüstü, canlı mod; bölüm 7.3). Görev kartlarındaki adresler pilottan önce uygulamanın kendi bağlantı kopyalama çıktısıyla üretilir ve karta yazılır.
- **Beklenen cevap.** Kayıtlı kapsam içindeki görevlerin beklenen cevapları kayıtlı sunucu cevaplarından alınmıştır ve dosya referansıyla verilmiştir: `data/examples/recorded/`, onun kopyası olan `frontend/src/roles/data.json` ve oyunun kayıtlı sunucu cevapları `frontend/src/features/game/recorded-answers.json`. Kayıtlı kapsam: Aralık 2026, katalog sahaları ve aday bölgeler, 2 m direk, dikey izleyen panel, varsayılan Recommend ağırlıkları. Kapsam dışına çıkan görevlerin (T-P05, rehberli görevler) beklenen cevapları Hafta 1'de canlı sunucudan alınır ve karta işlenir.
- **Biçim.** Sayısal değerler arayüzün gösterdiği biçimle yazılmıştır (`frontend/src/api/format.ts`).
- **Süre ve sıra.** Her görevin süre üst sınırı tablosundadır. Görev sırası sabittir; öğrenme etkisi sınırlılık olarak raporlanır.
- **Sabit sürüm.** Tüm gerçek oturumlar pilottan sonra dondurulan tek bir commit üzerinde yapılır (bölüm 8).

### 3.2 Heuristic Walkthrough ile Önceliklendirme

Görevler, heuristic değerlendirmenin bulgularına göre önceliklendirildi. Önce düzeltilen severity 3 bulgular, sonra kullanıcıya en görünür severity 2 bulgular görevlere bağlandı.

| Bulgu | Severity | Durum | Sınayan görevler | Not |
|-------|----------|-------|------------------|-----|
| HE-01 | 3 | Düzeltildi | T-P02 (klavye koşulu), T-A04 | Odak taşıma birim testlerinde sınanmıyor |
| HE-02 | 3 | Düzeltildi | T-A02 | Yalnız ekran okuyucuyla sınanabilir (AT-02) |
| HE-03 | 3 | Düzeltildi | T-H01, T-E01, T-S01, T-A01, T-A05 | Regresyon kontrolü |
| HE-04 | 3 | Düzeltildi | T-P05 (yalnız yedek ya da örnek modda) | Canlı oturumda kullanıcıyla sınanamaz; bölüm 7.3.1 |
| HE-05 | 3 | Düzeltildi | T-H04 (görsel döngü), T-A03 | Odak ve duyuru doğrulaması AT oturumlarında |
| HE-08, HE-09 | 2 | Açık | T-H01, T-H05, T-P04 | Rol sayfalarına erişim, açılış ekranının tekrarı |
| HE-10, HE-11 | 2 | Açık | T-H01, T-H03, T-E01 | Kapı ipuçları, "door" terimi |
| HE-12, HE-15, HE-16 | 2 | Açık | T-P06, T-H05 | Rol sayfalarında etiket, kontrast, renk |
| HE-20, HE-28 | 2 | Açık | T-P01, T-P03 | Harita tıklaması, nedensiz devre dışı düğme |
| HE-22 | 2 | Açık | T-P02, T-A02 | Zaman kaydırıcısı |
| HE-23, HE-24 | 2 | Açık | T-H02, T-E03, T-S02, T-S03 | Zaman şeridi lejantı, gökyüzü şeridi eksenleri |
| HE-25 | 2 | Açık | T-H03 | 3B sahnelerde fare tekerleği |
| HE-26 | 2 | Açık | T-S01, T-A05 | Rehberli görevde odak kaybı |
| HE-27 | 2 | Açık | T-P05 | Eğim alanında ondalık giriş |
| HE-29 | 2 | Açık | T-P03 | Karşılaştırma sütun başlıkları |
| HE-30 | 2 | Açık | T-P04, T-A03 | Durum mesajları |
| HE-31 | 2 | Açık | T-P07 (yedek) | Yalnız canlı modda ve süre yeterse |
| HE-32 | 2 | Açık | T-E04 | Hazır senaryonun karşılaştırmayı silmesi |
| HE-07, HE-17 | 2 | Açık | T-A01, T-A02 | Yalnız AT oturumlarında |
| HE-34, HE-38, HE-39 | 1 | Açık | T-P06, T-P03, T-E02, T-S03 | Yan gözlem |

Görevle sınanmayan bulgular: HE-06 (panel hata sınırı yok; nadir bir arıza durumudur ve görevle güvenli biçimde üretilemez), HE-13, HE-14, HE-18, HE-19 (isteğe bağlı AT gözlemi), HE-21, HE-33, HE-35, HE-36, HE-37 ve severity 0-1 düzeyindeki HE-40-HE-46. Bunların durumu sonuç raporunda "test edilmedi" olarak yazılır.

### 3.3 K1: Görev Planlamacı (Plan kapısı ve `#/engineer`)

Kapsam: K1 için 6 çekirdek görev (toplam süre sınırı 35 dk) ve 1 yedek görev. Oturum 60 dakikadır; zamanlama bölüm 10.2'dedir. Dosya yolları `data/examples/` köküne göredir; `recorded/` kısaltması `data/examples/recorded/` anlamına gelir. Tablodaki ekran metinleri `frontend/src/api/format.ts` biçimiyle yazıldı (ör. `123.1 h (5.1 d)`, `2026-12-09 12:35 UTC`).

**Görev bağlamı (moderatör ilk görevden önce bir kez okur):** "Bir Ay iniş aracı ekibinde saha ve tarih planlıyorsunuz. Aracın güneş paneli Güneş'i izleyen dikey bir panel; panel ve anten 2 metrelik bir direğin üzerinde. Yüzey görevi 30 gün sürüyor. Bütün saatler UTC."

#### Görev tablosu

| ID | Katılımcıya okunan görev metni | Gözlemci için amaç | Başlangıç durumu (URL ya da ekran) | Başarı ölçütü (beklenen cevap + dosya referansı) | Süre sınırı (dk) | UC | HE | Öncelik gerekçesi |
|---|---|---|---|---|---|---|---|---|
| T-P01 | "Ekibiniz Mons Mouton test sahasına 1 Aralık 2026'da inmeyi planlıyor. Bu 30 günlük görev için aracın ortalama panel gücünü ve sahadaki en uzun karanlık süreyi bulun." | Senaryonun sıfırdan kurulması (saha, tarih, süre) ve güç sonucuna ulaşılması. Eksik alanda düğmenin nedensiz devre dışı kalması (HE-28) ve sahayı haritada tıklayarak arama (HE-20) gözlenir. | `/?door=plan`. Moderatör açılış ekranını geçer. PLAN modu, etkin senaryo yok. | Ortalama panel gücü `188.0 W` (`recorded/mons-mouton-im2-target/power.json`, `summary.mean_power_w` = 188.0). En uzun karanlık `330.0 h (13.8 d)` (aynı dosya, `summary.longest_dark_hours` = 330.0) ya da `330.5 h` (`recorded/mons-mouton-im2-target/events.json`, `metrics.longest_dark_hours` = 330.46); iki okuma da doğru sayılır. Kurulan senaryo: Mons Mouton (IM-2 target point), 2026-12-01, 30 gün, 2 m, dikey izleyen panel. | 7 | UC-01, UC-03, UC-06 | HE-28, HE-20, HE-01 | 6.1 akışının ilk adımı (P1-P2). Kurulum hatası sonraki tüm görevleri bozar. HE-28 yalnızca kurulumda görünür. |
| T-P02 | "Donanım gecikmesi yüzünden iniş 6 Aralık 2026'ya kayabilir. O gün sahadan Dünya ile röle olmadan doğrudan iletişim kurulabilecek mi? Kurulamıyorsa doğrudan iletişimin yeniden mümkün olduğu ilk tarihi ve saati söyleyin. Bu görevi fare kullanmadan, yalnızca klavyeyle yapın." | Fırlatma kaymasının iletişime etkisini dönem penceresinden okuma. Sonuç sekmelerine klavyeyle erişim (HE-01 düzeltmesinin doğrulanması). Örnek veri dışına düşen yolların fark edilip edilmediği. | T-P01 sonu. Moderatör denetler: etkin senaryo Mons Mouton, 2026-12-01 ile 2026-12-31, 2 m, dikey izleyen panel; seçili an 2026-12-01 00:00 UTC. Biri tutmuyorsa U1 yüklenir. | "Hayır." Dünya `2026-12-04 09:30 UTC` ile `2026-12-09 12:35 UTC` arasında görünmüyor, süre `123.1 h (5.1 d)`. İlk doğrudan iletişim `2026-12-09 12:35 UTC` (`recorded/mons-mouton-im2-target/events.json`, `windows`: `earth_hidden` 2026-12-04T09:30:06Z - 2026-12-09T12:35:12Z; `earth-link.json`: aynı aralık `relay_needed`, ardından `dsn-madrid` ile `direct`). Yedek (örnek) modda verilebilecek `2026-12-11 04:41 UTC` cevabı genel örnekten okunmuştur (`comm-window.json`, `next_change_utc`; `events.json`, `earth_visible` başlangıcı 2026-12-11T04:41:00Z) ve başarısız kodlanır. | 7 | UC-07, UC-05, UC-03 | HE-01, HE-22 | S-01 zorunlu senaryo. HE-01 (severity 3, düzeltildi) yalnızca klavyeyle sınanabilir; uzaktan K1 oturumlarında başka görev bunu kapsamaz. |
| T-P03 | "Tarih değişmezse yakındaki başka bir saha işe yarar mı? Aynı 30 günlük dönem için Mons Mouton'u, IM-1 Odysseus sahası ve Athena'nın gerçekte indiği nokta ile yan yana koyun. Dünya'nın hiç kaybolmadığı saha hangisi, ortalama panel gücü en yüksek saha hangisi?" | Aynı dönem, başka saha kalıbı. Üç sütunlu tabloda harf ile saha eşleştirmesi (HE-29). Etkin senaryonun listeye eklenmesinin unutulması, devre dışı ekleme düğmesi ipucu (HE-38). | U1 her durumda yeniden yüklenir; T-P02'de kalmış olabilecek kaydırılmış senaryo ve kayıt dışı kurulum böylece temizlenir. Karşılaştırma listesi boş. | Dünya'nın hiç kaybolmadığı saha IM-1 Odysseus: `100.0 %`, en uzun kesinti `0.0 h` (`recorded/im1-odysseus/events.json`, `earth_visible_fraction` = 1.0, `longest_earth_hidden_hours` = 0.0). En yüksek ortalama güç Athena iniş noktası: `188.8 W` (`recorded/im2-athena/power.json`, 188.76); Mons Mouton `188.0 W`, IM-1 `162.1 W` (`recorded/im1-odysseus/power.json`, 162.11). Tablo üç sütunlu (A-C); her sütun Assumed etiketi taşır. | 7 | UC-08, UC-01, UC-09 | HE-29, HE-38, HE-20 | S-02 zorunlu senaryo. Üç sütun HE-29'u doğrudan sınar. Mons ile Athena arasındaki 0.8 W farkın "best" işaretiyle okunması K1 yargısı için kritik. |
| T-P04 | "Bu karşılaştırmayı ekip toplantısına götüreceksiniz. Tabloyu bir dosya olarak kaydedin ve ekip arkadaşınızın aynı görünümü açabileceği bir bağlantı hazırlayıp yeni bir sekmede deneyin." | Dışa aktarma ve paylaşma. Kopyalama onayının fark edilmesi (HE-30). Bağlantının açılış ekranına düşmesi (HE-09) ve yeni sekmede karşılaştırmanın bulunabilmesi. | T-P03 sonu (üç senaryolu karşılaştırma). Bozulmuşsa U3. | `comparison.csv` ya da `comparison.json` indirildi ve içinde T-P03 değerleri var (ör. Athena `188.8`; dışa aktarma ekrandaki yuvarlamayı kullanır). "Link copied." ya da pano erişimi yoksa "Copy this link: …" mesajı görüldü (ikincisi sayfa localhost ya da https dışında sunulursa çıkar). Yeni sekmede, açılış ekranı geçildikten sonra aynı üç senaryo (Mons Mouton, IM-1 Odysseus, IM-2 Athena) karşılaştırma listesinde. Değer kaynakları T-P03 ile aynı. | 5 | UC-11 | HE-30, HE-09 | K1'in işi bitirme ölçütü dışa aktarmadır (kullanıcı planı, bölüm 3 ve 6.1, P7). |
| T-P05 | "Aracınızın iniş ayakları en fazla 8,5 derece eğimli zemine dayanabiliyor. Bu sınırla bölgede Aralık 2026 için önerilen ilk üç saha hangileri?" | Eğim alanına ondalık değer girişi (HE-27). Yalnız yedek (örnek) modda: kayıt dışı bir istekte örnek veri notunun fark edilmesi (HE-04 düzeltmesinin doğrulanması). | U1. PLAN modu, karşılaştırma boş. | Canlı modda sunucu 8,5° sınırıyla sıralar; başarı, değerin doğru girilmesi ve ilk üç sahanın söylenmesidir. Beklenen sıralama Hafta 1'de canlı sunucudan kaydedilir (bölüm 13). Yedek (örnek) modda bu isteğin kaydı yoktur; o durumda başarı: katılımcı, örnek veri notuna ("This example does not match the selected site, period or settings…") dayanarak gösterilen sıralamanın kendi sınırı için olmadığını söyler. Ekrandaki yedek sıralama: 1. Candidate 1 (71), 2. Mons Mouton (64), 3. Candidate 2 (58), Candidate 3 elenmiş (`recommend.json`, `limits.max_slope_deg` = 12, SYNTHETIC). Bunu 8,5° cevabı olarak vermek başarısızdır. Karşılaştırma için 12° kaydı: 1. Candidate 11 (53.8), 2. Candidate 1 (53.5), 3. Mons Mouton (53.5) (`recorded/region/recommend.json`). | 5 | UC-14, UC-10 | HE-04, HE-27 | HE-04 (severity 3, düzeltildi) yalnızca kayıt dışı bir istekte görünür. Türkçe ondalık virgülü HE-27'yi kesin tetikler. |
| T-P06 | "Önünüzdeki sayfada Mons Mouton ile Apollo 11'i Aralık 2026 için karşılaştırın. Panel ay boyunca hangisinde daha çok enerji üretir, fark yaklaşık kaç kilovatsaat? Bu sayfadaki sayılar canlı bir hesaptan mı geliyor?" | Rol sayfasında tablo okuma. En iyi hücrenin yalnızca renkle işaretlenmesi (HE-16), ham geçerlilik etiketleri (HE-12), "Not live" uyarısının fark edilmesi (HE-15). Son sahanın seçimini kaldırma denemesi (HE-34). | `#/engineer`. Rol sayfaları açılış ekranı göstermez. | Mons Mouton `135.4` kWh, Apollo 11 `86.0` kWh; fark yaklaşık 49.3-49.4 kWh (`recorded/mons-mouton-im2-target/power.json`, `energy_kwh` = 135.363; `recorded/apollo-11/power.json`, 86.038; sayfa bu değerleri `frontend/src/roles/data.json` içine kopyalar). Sayılar canlı değil, kayıtlı örnek (alt bilgi: "Recorded example … Not live."). | 4 | UC-08, UC-10 | HE-16, HE-12, HE-15, HE-34 | `#/engineer` K1'in rol sayfası. Etiket metni ve "Not live" uyarısı K1'in güven yargısını doğrudan etkiler. |
| T-P07 (yedek) | "Athena'nın inişini Blue Ghost 1'in inişiyle, iki aracın iniş sonrası ilk ayı için yan yana görün. Uygulamanın bunun için sunduğu en kısa yolu kullanın." | Hazır gösterim düğmesinin görünür bir değişiklik yaratmaması (HE-31). | `/?door=plan&data=live`, PLAN modu. | Gezinme ölçütü: ANALYZE modunda iki sütunlu karşılaştırmaya ulaşır. İniş anları 2025-03-06T17:30:00Z ve 2025-03-02T08:34:00Z (`reference-missions.json`). Kayıt olmadığı için örnek modda tablo `—` gösterir. Değerler: TBD (canlı sunucu). Canlı mod şart. | 5 | UC-13, UC-08 | HE-31 | K1 için ikincil (UC-13 ○). Yalnızca canlı modlu bir oturumda ya da süre artarsa uygulanır. |

#### Gözlem noktaları

**T-P01**
- Saha listesi yerine haritada tıklama: etkin saha özel bir noktaya dönüşür (HE-20) ve sonuç kayıt dışına düşer. Örnek veri notunu fark ediyor mu?
- Tarih girmeden kaydetmeye çalışma: düğme nedensiz devre dışı (HE-28). Kaç saniye takılıyor, ne deniyor?
- Sonuçların ayrı bir modda olduğunu nasıl buluyor (PLAN modunda sağ raydaki sonuç sekmelerinin hepsi devre dışı)?
- Panel türünü ya da direk yüksekliğini değiştiriyor mu? Değişiklik kayıt dışına düşürür; not fark ediliyor mu?
- Güç sonucunun yanındaki Assumed etiketini okuyor ya da soruyor mu?

**T-P02**
- Etkin sekmeden sonraki sekmeye ok tuşuyla mı geçiyor, yoksa Tab ile sekme listesini atlıyor mu (HE-01)?
- Kural: 3 dakika içinde klavyeyle hiçbir sonuç sekmesine ulaşamazsa moderatör fareye izin verir. HE-01 sonucu (klavyeyle ulaştı / ulaşamadı) ile iletişim cevabı ayrı kodlanır.
- Kaydırıcıyla ya da başlangıç tarihini 6 Aralık yaparak çözmeye çalışma: karşılaştırma sütunu `—` gösterir ya da "does not match" notu çıkar. Bunu fark ediyor mu?
- Zaman çizelgesinde ok tuşu başına 1 dakikalık ilerleme (HE-22). Tab ile kaydırıcıya gelince oynatmanın durması.
- Zamanı kaydırdıktan ya da başlangıcı 6 Aralık yaptıktan sonra yedek cevabı (`2026-12-11 04:41 UTC`) gerçek cevap sanıyor mu?
- Dönem penceresi tablosunu kendiliğinden buluyor mu?

**T-P03**
- Etkin senaryoyu listeye eklemeyi unutuyor mu? "Add one more scenario…" ipucunu okuyor mu?
- A, B ve C harflerini sahalarla eşleştirmek için yukarı kaydırıyor mu, yanlış sütunu okuyor mu (HE-29)?
- Devre dışı ekleme düğmesinde "Set up a scenario first." ipucunu görüyor mu (HE-38)?
- Athena ve Mons işaretleri haritada yaklaşık 370 m arayla duruyor (`sites.json` koordinatlarından). Haritada bir işarete tıklamak etkin senaryoyu sessizce değiştirir ve Mons, A sütunu olarak kaybolur (HE-20). Bunu fark ediyor mu?
- Mons ile Athena arasındaki 0.8 W ve 0.1 yüzde puanlık (82.9 % ile 82.8 %) farkları anlamlı sayıyor mu? "Why?" bağlantısını açıyor mu (UC-09)?
- Alternatif yol: etkin sahayı tek tek değiştirip güç ve iletişim sekmelerini okumak geçerlidir. Kullanılan yol kaydedilir.

**T-P04**
- "Link copied." mesajını fark ediyor mu? Mesaj duyurulmuyor (HE-30).
- Yeni sekmede açılış ekranında duraksama (HE-09).
- Bağlantı PLAN modunda açılır, karşılaştırma ANALYZE modunda kalır. Karşılaştırmanın kaybolduğunu düşünüyor mu?
- CSV ile JSON arasında seçim yaparken duraksıyor mu? Dosyayı açıp değerleri kontrol ediyor mu?

**T-P05**
- "8,5" yazınca alan "NaN" gösterir; "8.5" yazınca değer 85 olur (HE-27). Hatayı fark ediyor mu, nasıl düzeltiyor?
- Sınırı değiştirmeden sıralıyor mu? Bu durumda kayıtlı sıralama notsuz gelir ve görev başarısız sayılır.
- Örnek veri notunu okuyor mu? Yedek sıralamayı "sınır sırayı değiştirdi" diye yorumluyor mu (HE-04)?
- Puan notlarını ("does not certify a site") ve eleme listesini okuyor mu?

**T-P06**
- En iyi hücreyi yalnızca çerçeve rengiyle buluyor mu (HE-16)?
- "SYNTHETIC" ve "DERIVED" etiketlerini nasıl yorumluyor (HE-12)?
- Alt bilgideki "Not live" uyarısını kendiliğinden görüyor mu (HE-15)?
- Odaklanmak için Chang'e 4'ün seçimini kaldırıyor mu? Son sahayı kaldırmaya çalışırsa sessiz ret (HE-34).

#### Kapsam notu

- Oturumlar canlı modda yürütülür (bölüm 7.3). Aşağıdaki örnek mod notları, oturum yedek moda geçerse (bölüm 7.3.3) geçerlidir.
- **Örnek modda güvenli:** T-P01, T-P02, T-P03, T-P04 ve T-P06. Hepsi 2026-12-01 ile 2026-12-31 arası kayıtlı dönemi, 2 m direği, dikey izleyen paneli ve Dünya merkezi ölçütünü kullanır. T-P06 statik rol sayfasıdır.
- **T-P05 örnek modda güvenli ama kasıtlı olarak kayıt dışıdır.** 8,5° isteğinin kaydı yoktur. Görev, bu durumda HE-04 düzeltmesinin notu gösterip göstermediğini ölçer. Sayısal bir sıralama cevabı canlı mod ister (TBD).
- **Canlı mod şart:** yalnızca yedek T-P07. Athena ve Blue Ghost 1 iniş anları (Mart 2025) kayıtlı dönemin dışındadır.
- **Anlık değerler yalnızca 2026-12-01 00:00 UTC'de kayıtlıdır.** "Now" bölümü ve geri sayım zaman kaydırılınca yedek örneğe düşer (`comm-window.json`, `now.json`: 0 m direk, düz ufuk). Bu yüzden başarı ölçütleri dönem pencerelerine, özet ölçülere ve karşılaştırma tablosuna dayanır.
- **Kayıt dışı her kurulum yedek cevaba düşer.** Kaydırılmış fırlatma tarihi, 0/5/10/20 m direk, başka panel türü ve haritadan seçilen özel nokta bu kapsamdadır. Karşılaştırmada sütun `—` gösterir; diğer panellerde "does not match" notu çıkar.
- **U1:** Mons Mouton (IM-2 target point) etkin; 2026-12-01 ile 2026-12-31 arası, 2 m, `vertical_tracking`, seçili an 2026-12-01 00:00 UTC; karşılaştırma boş.
- **U3:** U1'e ek olarak karşılaştırma listesinde Mons Mouton, IM-1 Odysseus ve IM-2 Athena (landing point) var.

#### Varsayımlar ve açık noktalar

- Varsayım: Uzak K1 oturumunda katılımcı, moderatörün makinesinde canlı modda çalışan yerel kopyayı ekran paylaşımı ve uzaktan denetimle kullanır (bölüm 7.3.2, seçenek A). Pano ve indirme klasörü o makinededir.
- Varsayım: Her sayfa yüklemesinde açılış ekranı çıkar (HE-09). Moderatör bunu geçip ekranı devreder; T-P04'teki yeni sekme hariç, çünkü orada açılış ekranı gözlem konusudur.
- Varsayım: Görev bağlamındaki araç bilgileri (dikey izleyen panel, 2 m direk, 30 gün) planlamacının kendi görev girdisidir; ipucu sayılmaz.
- Varsayım: Katılımcılar İngilizce arayüz metinlerini okuyabilir (arayüz `lang="en"`). Ondalık ayırıcı katılımcının alışkanlığına bırakılır.
- Varsayım: Başarı, cevabın süre sınırı içinde ve moderatör yardımı olmadan verilmesidir. Yardımla verilen cevap "kısmi" kodlanır.
- TBD — U1 ve U3 bağlantıları pilot oturumda uygulamanın kendi "bağlantı kopyala" çıktısıyla üretilmeli. `sid` ve `label` alanları elle yazılırsa hata çıkabilir.
- Karar: kök adres `<taban>`'dır (bölüm 3.1). Pano moderatör makinesinde ve adres localhost olduğundan T-P04'te "Link copied." beklenir.
- TBD — T-P05'in canlı moddaki beklenen sıralaması Hafta 1'de canlı sunucudan kaydedilecek; kayıtlı kapsamda 8,5° isteği yok.
- Karar: T-P02'nin klavye koşulu K1 oturumlarında kalır; AT oturumları aynı yolu bölüm 3.6'daki T-A04 ile ayrıca sınar.

### 3.4 K2: Eğitimci (Classroom kapısı ve `#/educator`)

Bu bölüm K2 görevlerini verir. Görevler [kullanıcı planı](../product/use-cases-and-scenarios.md) bölüm 3 ve 6.2'ye, [kitle stratejisi](../product/audience-strategy.md) bölüm 3'e ve [heuristik değerlendirmeye](HEURISTIC_EVAL_lunar-landing-site-navigator.md) dayanır. Katılımcıya okunan metinlerde arayüz etiketi ve denetim adı yoktur. Gözlemci sütunlarında ise etiketler, gözlemcinin işini kolaylaştırmak için özgün İngilizce adlarıyla verilmiştir.

#### Başlangıç adresleri

Gözlemci, A3–A5 adreslerini oturumdan önce ilgili hazır soruyu açarak tarayıcının adres çubuğundan kaydeder. `<taban>` için bkz. bölüm 3.1.

| Kod | Adres ya da ekran | İçerik |
| --- | --- | --- |
| A0 | `<taban>/` | Varsayılan kapı Plan, senaryo yok (`frontend/src/shell/ui-state.ts`, `DEFAULT_DOOR`) |
| A1 | `<taban>/?door=classroom` | Classroom kapısı, senaryo yok. "Talking to Earth" panelinde HE-03 düzeltmesinin metni görünür: "No scenario yet. Pick a site at the top of the main view." |
| A2 | `<taban>/#/educator` | Eğitimci rol sayfası, kayıtlı örnek değerler (`frontend/src/roles/data.json`) |
| A3 | A1 + "Apollo 11: the lunar night" (`equatorial-night`) açılmış hali | Tek saha. 1–31 Aralık 2026, direk 2 m, `vertical_tracking` |
| A4 | A1 + "Chang'e 4: beyond direct Earth view" (`far-side`) açılmış hali | Tek saha, A3 ile aynı ayarlar |
| A5 | A1 + "Athena: target and landing point" (`athena-points`) açılmış hali | İki saha karşılaştırmada: `im2-athena` ve `mons-mouton-im2-target` |

#### Öğretmen görevleri (K2-T1, K2-T2; oturum 50 dk)

| ID | Katılımcıya okunan görev metni | Gözlemci için amaç | Başlangıç durumu (URL ya da ekran) | Başarı ölçütü (beklenen cevap + dosya referansı) | Süre sınırı (dk) | UC | HE | Öncelik gerekçesi |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-E01 | "Bu uygulamada öğretmenlerin derste kullanması için hazırlanmış bölümü bulun." | Kapı seçiminin yalnızca `title` ipucuyla anlaşılıp anlaşılmadığını ve boş Classroom ekranındaki yönlendirmeyi gözlemek | A0 | Adreste `door=classroom` görünür ve katılımcı dört hazır görevin listesini gösterir (`frontend/src/content/guided-tasks.json`, 4 görev). Yalnızca gezinme puanlanır, sayısal cevap yoktur | 3 | UC-13 | HE-10, HE-03 | Öğretmenin ürüne ilk girişi. Bu adımda başarısız olan kullanıcı diğer görevlere ulaşamaz |
| T-E02 | "Bu sayfada, Ay'ın uzak yüzündeki bir iniş yerinde Dünya'nın ay boyunca ne kadar göründüğü yazıyor. Bu bilgiyi derste kullanmadan önce, uygulamada nereden geldiğini ve hesaplanırken neyin kabul edildiğini bulun." | Rol sayfasından canlı konsola geçişi, kaynak ve varsayım bilgisinin bulunabilirliğini gözlemek. "0.0 %" metni rol sayfasının kapalı gelen 2. adımındadır ("Compare"). Katılımcının bu adımı açması ipucu sayılmaz | A2 | Rol sayfasında "Earth is in view 0.0 % of the month" yazar (`frontend/src/roles/data.json`, `change-4` ← `data/examples/recorded/change-4/events.json`, `earth_visible_fraction` 0.0). Konsolda Chang'e 4 hazır sorusu "Earth in view" için 0.0 % gösterir (aynı dosya). Katılımcı en az bir kaynak adı söyler: "Verified far-side Earth visibility", "NASA NSSDC lunar artifact table" ya da "Recorded relay windows" (`frontend/src/content/scenarios.json`, `far-side`). Ayrıca en az bir varsayım söyler: "generic assumed solar panel", "no relay orbit or radio link budget is modelled" ya da "Panel power is assumed" | 8 | UC-13, UC-07, UC-10 | HE-39 | Öğretmen derse girmeden önce sayının dayanağını doğrulamak ister. Bu görev, bilimsel güvenilirlik iddiasının arayüzde karşılığını sınar |
| T-E03 | "Ekranda Ay'ın ekvatoruna yakın bir iniş yeri açık. Ay'ın güney kutbuna yakın bir yerde Güneş'in gökyüzünde ne kadar alçakta kaldığını, aynı tarihte bu yerle karşılaştırarak sınıfa gösterin ve farkın nedenini açıklayın." | K2 başarı ölçütü: "Bir kavramı tek bir girdiyi değiştirerek gösterebildi". Puanlama aşağıdaki T-E03 rubriğiyle yapılır | A3 | Saha seçicisinden güney kutbuna daha yakın bir saha seçilir. Bu seçim tarihi, direği ve paneli korur (`frontend/src/shell/doors/site-pick.ts`, `sameDateAnotherSite`), bu nedenle kayıtla eşleşir. Apollo 11'de "Highest Sun" 88.0866°'dir (`data/examples/recorded/apollo-11/events.json`, `max_sun_elevation_deg`; şerit örneklerinde en çok 87.84°, `.../apollo-11/sky-series.json`). Uygun sahaların değerleri aynı dosyalardadır: Mons Mouton 6.4703, IM-2 Athena 6.4598, aday bölgeler 6.1992–6.6677, IM-1 Odysseus 11.0651, Chandrayaan-3 21.8813 (`.../<saha>/events.json`). Neden: Ay'ın dönme ekseni az eğik olduğundan Güneş'in yüksekliğini büyük ölçüde enlem belirler (`guided-tasks.json`, `why-poles` açıklaması) | 10 | UC-01, UC-04, UC-08 | HE-24, HE-23 | K2'nin asıl sorusu: "Kutupta iniş neden bu kadar zor, bunu nasıl gösteririm?" Bu görev ölçütü doğrudan puanlayan tek görevdir |
| T-E04 | "Ekranınızdaki karşılaştırmayı öğrencilerinizin kendi cihazlarında aynı şekilde açabilecekleri bir bağlantı hazırlayın." | Classroom'da "Copy link" denetimi olmadığından paylaşımın adres çubuğundan yapılıp yapılamadığını gözlemek. Paylaşım aracı ararken başka bir hazır soru açılır ve karşılaştırma sessizce silinirse bunu kaydetmek | A5 | Hazırlanan adreste `door=classroom`, `sid=research-athena-points-im2-athena` ve iki `cmp` parametresi bulunur (`frontend/src/state/url-sync.ts`). Gözlemci adresi görevden sonra ikinci sekmede açar. Açılan ekranda iki saha görünür ve tablo değerleri şöyledir: "Highest Sun" 6.46° ve 6.47°, "Sunlit time" 51.9 % ve 51.6 % (`data/examples/recorded/im2-athena/events.json`: 6.4598, 0.519; `.../mons-mouton-im2-target/events.json`: 6.4703, 0.5158) | 7 | UC-11, UC-08 | HE-32 | Öğretmen, hazırladığı senaryoyu öğrencilere bağlantıyla dağıtmalıdır (UC-11). Durum kaybı en çok bu adımda zarar verir |

##### T-E03 rubriği (K2 başarı ölçütü)

| Düzey | Tanım |
| --- | --- |
| Doğru | Yalnızca saha değişti: Apollo 11'den güney kutbuna daha yakın, kaydı olan bir sahaya geçildi (Mons Mouton, IM-2 Athena, aday bölgeler, IM-1 Odysseus ya da Chandrayaan-3). Tarih, direk ve panel aynı kaldı. Öğretmen yeni sahada Güneş'in belirgin biçimde daha alçak olduğunu okunan bir değerle gösterdi (Apollo 11 ≥ 80°; yeni saha için T-E03 başarı ölçütünde verilen kayıtlı değerin çevresinde) ve farkı enlemle ya da eksen eğikliğinin küçüklüğüyle ilişkilendirdi. Kanıt gökyüzü şeridinin eksen etiketleri olabilir. Plan kapısında yalnızca saha değiştirilerek kurulan aynı tarihli karşılaştırmadaki "Highest Sun" satırı da kabul edilir |
| Kısmen | Fark gösterildi, ancak şu durumlardan biri gerçekleşti: (a) birden fazla girdi değişti; örneğin Plan kapısında tarih değiştirildi, bu da kapsam dışına çıkış sayılır ve sapma olarak kaydedilir. (b) Girdi değiştirilmedi, bunun yerine hazır içerik kullanıldı (`why-poles` görevi ya da `#/educator` sayıları). (c) Fark doğru gösterildi ama neden açıklanmadı ya da eksen yanlış okundu |
| Yanlış | Karşılaştırma kurulamadı, süre doldu ya da yanlış sonuç söylendi (örneğin kutupta Güneş'in daha yüksek olduğu) |

#### Öğrenci görevleri (K2-S1..S3; oturum bir ders saati, 40 dk)

| ID | Katılımcıya okunan görev metni | Gözlemci için amaç | Başlangıç durumu (URL ya da ekran) | Başarı ölçütü (beklenen cevap + dosya referansı) | Süre sınırı (dk) | UC | HE | Öncelik gerekçesi |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-S01 | "Ay'ın güney kutbuna yakın bir yerde duran bir astronot düşünün. Bu astronot Dünya'yı her gün doğup batarken görür mü? Önce tahmininizi yüksek sesle söyleyin, sonra doğru cevabı uygulamada bulun." | Tahmin et, gözle, açıkla döngüsünü gözlemek. "Earth stays" hazır görevi bulunmalı ve cevap açılmalıdır. "Check my guess" sonrasında odak kaybı (HE-26) ve boş ekran yönlendirmesi (HE-03) gözlenir | A1 (öğretmenin gönderdiği adres) | Katılımcı önce tahminini söyler; doğru ya da yanlış olması fark etmez. Ardından cevabı açar ve "Hayır" sonucunu en az bir kanıtla destekler. Kanıt olabilecekler (aşağıdaki değerler yedek moddaki genel örnektir; canlı moddaki 0 m değerleri Hafta 1'de kaydedilir): Mons Mouton satırındaki "Earth in view" 72.3 % ve "Longest Earth gap" 186.6 h değerleri (`data/examples/events.json`: 0.723, 186.63; koşul direk 0 m, 1–31 Aralık 2026). Ya da zaman şeridinde Dünya'nın 3 Aralık 10:03'te batıp 11 Aralık 04:41'de doğması (aynı dosya, `events`). Chang'e 4 satırı ve gökyüzü şeridi için canlı mod şart | 8 | UC-13, UC-05, UC-09 | HE-26, HE-03 | Kitle stratejisindeki temel sınıf döngüsü budur. HE-26 yalnızca bu akışta ortaya çıkar |
| T-S02 | "Ekranda Apollo 11'in indiği yer açık. Aralık 2026'da bu yerde Güneş hangi gün doğuyor?" | Zaman şeridindeki bantların ve olay işaretlerinin okunup okunamadığını gözlemek (HE-23: işaret lejantı yok) | A3 | 14 Aralık 2026, 15:31 UTC (`data/examples/recorded/apollo-11/events.json`, `sunrise` 2026-12-14T15:31:12Z). Kabul edilen cevap: 14 Aralık. Alternatif yol yalnızca açılış anında geçerlidir: geri sayım 1 Aralık 00:00 UTC'den itibaren 327.52 saat gösterir (`.../apollo-11/now.json`, `hours_to_sunrise`). `now` kaydı yalnızca bu an için vardır. Öğrenci zamanı kaydırdığında geri sayım genel örneğe düşer ve puanlanmaz | 5 | UC-05, UC-03 | HE-23 | Olay saatleri zorunlu bir use case'tir. Öğrencinin tek başına okuyabileceği en basit sayısal sorudur |
| T-S03 | "Ekranda Ay'ın uzak yüzündeki bir iniş yeri açık. Buradan bakan biri Dünya'yı gökyüzünde görebilir mi? Ekranda gördüklerinize dayanarak nedenini kendi cümlelerinizle anlatın." | Gökyüzü şeridinin eksenlerinin anlaşılıp anlaşılmadığını (HE-24) ve tek sahalı durumda Why panelinin boş metnine verilen tepkiyi (HE-39) gözlemek | A4 | Cevap "Hayır, ay boyunca hiç"tir. Dayanaklar: "Earth in view" 0.0 % (`data/examples/recorded/change-4/events.json`, `earth_visible_fraction` 0.0; `earth_hidden` penceresi 1–31 Aralık). Şeritte Dünya yüksekliği en çok −38,04° (`.../change-4/sky-series.json`). Bağlantı durumu "Relay needed" (`.../change-4/earth-link.json`, tek `relay_needed` penceresi). Açıklama düzeyleri: doğru = Ay'ın Dünya'ya hep aynı yüzünü dönmesiyle ilişkilendirir. Kısmen = Dünya'nın ufkun altında olduğunu söyler ama neden vermez. Yanlış = Dünya'nın görüneceğini söyler ya da durumu "orası hep karanlık" diye açıklar (Güneş ayın yarısında görünür: "Sunlit time" 50.3 %, aynı dosya, 0.5032) | 8 | UC-04, UC-07, UC-09 | HE-24, HE-39 | Kavramı açıklama adımını ölçer. Ayrıca yaygın "karanlık yüz" kavram yanılgısını yakalar |

#### Gözlem noktaları

- **T-E01:** Katılımcı kapı düğmelerinin üzerinde durup ipucunu okuyor mu, yoksa deneme yanılmayla mı ilerliyor (HE-10)? Boş Classroom ekranındaki "Pick a site at the top of the main view." metnini fark edip bir sonraki adımı çıkarabiliyor mu (HE-03 regresyon kontrolü)? Saha seçicisinden bir saha seçerse senaryo bugünün tarihiyle başlar ve ekran genel örneğe düşer. Bu durum puanlanmaz, yalnızca not edilir.
- **T-E02:** Katılımcı "Open the live classroom" düğmesini kullanıyor mu? Doğru hazır soruyu (`far-side`) kaç denemede buluyor? "Sources and recording" bölümü kapalı olduğu için gözden kaçıyor mu? Why panelindeki "Open the Plan door…" metni katılımcıyı yanlış kapıya yönlendiriyor mu (HE-39)?
- **T-E03:** Katılımcı saha seçicisini girdi değiştirme aracı olarak tanıyor mu? Dikey ekseni yükseklik açısı olarak okuyabiliyor mu, yoksa yatay pusula eksenini mi yorumluyor (HE-24)? Şeridin dikey ölçeği her senaryoda yeniden ayarlanır (`frontend/src/features/sky/geometry.ts`, `elevationDomain`). Bu yüzden 88° ve 6,5° yolları çizimde benzer yükseklikte görünebilir; fark yalnızca eksen etiketlerinden okunur. Somut HE-24 riski budur. Tarih değiştirmek için Plan kapısına geçiyor mu? Bu durum kapsam dışına çıkıştır ve sapma olarak kaydedilir. "Mons Mouton: a low Sun" hazır sorusunu açarsa Explore kapısına taşınır. Bu bir HE-32 gözlemidir, katılımcı hatası sayılmaz.
- **T-E04:** Katılımcı paylaşım düğmesi arıyor mu, bulamayınca adres çubuğuna mı geçiyor? Arama sırasında bir hazır görev ya da başka bir hazır soru açarak karşılaştırmayı kaybediyor mu? Kaybederse kaybı fark ediyor mu ve Geri tuşunu deniyor mu? Geri tuşu eski durumu getirmez (HE-32).
- **T-S01:** Öğrenci soruyla eşleşen hazır görevi listede buluyor mu? Cevap açıldıktan sonra odak kayboluyor mu ve öğrenci cevabı arıyor mu (HE-26)? Chang'e 4 satırındaki "—" ve "Add ?data=live" notuna nasıl tepki veriyor? Gökyüzü şeridinin genel örneği (Athena, 2025) göstermesi öğrenciyi şaşırtıyor mu? Bu kapsam kaynaklıdır, öğrenci hatası sayılmaz.
- **T-S02:** Öğrenci bant renklerini ("Sunlit", "Dark (hatched)") ve dolu/çerçeve işaretleri ayırt edebiliyor mu (HE-23)? Saati UTC olarak yorumluyor mu? Geri sayımı kullanıyor mu? Kullanıyorsa zamanı kaydırdıktan sonra değerin örneğe düşmesiyle şaşırıyor mu?
- **T-S03:** Öğrenci ufuk çizgisinin altındaki çerçeveli Dünya diskini "görünmüyor" diye okuyabiliyor mu? Eksen başlığı olmadığı için açıyı anlamlandırabiliyor mu (HE-24)? Açıklama ararken Why paneline bakıyor mu ve oradaki Plan yönlendirmesine uyuyor mu (HE-39)?

#### Sınıf ortamı notu

- **Ortam:** Öğrenci oturumu gerçek bir lise sınıfında, bir ders saati (40 dk) içinde yapılır. Önerilen dağılım şöyledir: 5 dk tanışma ve rıza, yaklaşık 21 dk görev (T-S01 8 dk, T-S02 5 dk, T-S03 8 dk), 5–8 dk son test soruları, kalan süre yedek. Süre sınırını aşan görev "başarısız (süre)" olarak işaretlenir ve bir sonraki göreve geçilir.
- **Cihaz ve sıra:** Öğrenciler moderatör dizüstünde (canlı mod) sırayla, tek tek çalışır; ikinci dizüstü yedektir (bölüm 7.2). Görev sırasında ortak projeksiyon ekranı kullanılmaz; kullanılırsa test bireysel kullanım ölçmekten çıkar, grup çalışmasına dönüşür. Projeksiyonun okunurluğu ayrı bir gözlem konusudur (kitle stratejisi, bölüm 3).
- **Eşzamanlılık:** Üç öğrenci oturumu aynı gün ardışık ders saatlerinde yapılır. Sırası gelmeyen öğrenci, önceki oturumu görmeyecek biçimde öğretmenin dersine devam eder. Bir gözlemci yeterlidir.
- **Öğretmenin rolü:** Öğrenciler reşit olmadığı için öğretmen sınıfta bulunur. Başlangıç adresini moderatör açar; görev kartında bu adres "öğretmenin gönderdiği bağlantı" olarak sunulur. Görev sırasında yardım etmez. Öğretmen müdahale ederse gözlemci bunu ipucu olarak kaydeder.
- **Gürültü:** Sesli düşünme protokolü sınıf gürültüsünden etkilenir. Ekran ve ses kaydı yaka mikrofonuyla alınır, gözlemci anlık not tutar. Gürültü yoğunsa görev sonrasında kısa geriye dönük sorgulama yapılır.
- **Dil:** Arayüz yalnızca İngilizcedir. Gözlemci ekrandaki metni çevirmez; görev metni Türkçe okunur.

#### Kapsam notu

- Oturumlar canlı modda yürütülür (bölüm 7.3); kayıtlı kapsam içinde canlı cevap kayıtla aynıdır. Aşağıdaki örnek kip notları, oturum yedek moda geçerse geçerlidir. Kayıt koşulları şunlardır: 1–31 Aralık 2026, direk 2 m, panel `vertical_tracking`, ölçüt `center` (`data/examples/recorded/index.json`, `data/examples/README.md`). A3–A5 adresleri bu koşulları kurar.
- Hazır görevler (`guided-tasks.json`) 0 m direkle açılır (`frontend/src/features/tasks/tasks.ts`, `taskScenarios`). Bu nedenle kayıtlarla eşleşmezler. Örnek kipte yalnızca Mons Mouton satırı `data/examples/events.json` dosyasından dolar. "Sunlit time" ve "Longest dark" bu dosyada `null` olduğundan "—" görünür. Diğer saha satırları ile gökyüzü şeridi genel örneğe düşer. T-S01 yalnızca Mons Mouton satırı, zaman şeridi ve açıklama metni üzerinden puanlanır.
- Boş durumdan saha seçmek bugünün tarihiyle bir senaryo başlatır (`site-pick.ts`, `todayUtc`). Bu senaryo kapsam dışında kalır. T-E01 ve T-S01'de bu yol yalnızca gezinme olarak puanlanır ve her görev kendi başlangıç adresinden açılır.
- Yedek modda ekranda görünen "Add ?data=live" notuna gözlemci uymaz. Katılımcı bu notu uygularsa durum gözlem olarak kaydedilir ve başlangıç adresi yeniden yüklenir.
- Plan kapısına geçip tarih, direk ya da panel değiştirmek kayıt kapsamından çıkar. Bu durumda gösterilen sayılar puanlanmaz, sapma olarak kaydedilir.

#### Varsayımlar ve açık noktalar

- Varsayım: `<taban>`, ekibin `npm --prefix frontend run dev` ya da derleme ve önizleme ile çalıştırdığı yerel kopyadır.
- Varsayım: K2-S katılımcıları lise öğrencisidir, reşit değildir ve basit İngilizce arayüz metnini okuyabilir. Veli onayı ve öğrenci rızası alınır.
- Varsayım: T-E03'te gökyüzü şeridinden yapılan açı okumasında kayıtlı değerin çevresinde birkaç derecelik okuma hatası kabul edilir. Apollo 11 için eşik ≥ 80°'dir (şerit örneklerinde en çok 87.84°).
- Varsayım: Öğretmen oturumu okulda, ders dışı bir saatte, moderatör dizüstünde (canlı mod) yapılır. Her görev kendi başlangıç adresiyle açılır, önceki görevden durum taşınmaz.
- TBD — Test tarihleri ve okul henüz belirlenmedi. Ekip kararı bekleniyor.
- TBD — A3–A5 adreslerinin tam dizgisi pilottan önce kaydedilecek. Adresten yeniden açılınca hazır soru kartının `research-<id>-` önekiyle geri geldiği ikinci sekmede doğrulanmadı.
- TBD — Gözlemcinin İngilizce ekran metnini açıklaması ipucu sayılır mı? Pilot testte kararlaştırılacak.

### 3.5 K3: Halk (Explore kapısı, `#/public` ve mini oyun)

Bu bölüm K3 oturumunun görev adımını (d) tanımlar. Bölüm 10.2 K3 oturumunu 38 dakika olarak planlar. Görevlere 9. ile 28. dakikalar arası, yani 19 dakika ayrılmıştır; aşağıdaki süre sınırlarının toplamı da 19 dakikadır. Görevler sabit sırayla (T-H01'den T-H05'e) uygulanır. Dayanaklar:
- `docs/product/use-cases-and-scenarios.md`: bölüm 3, 5 ve 6.3 ile S-03 ve S-08.
- `docs/design/HEURISTIC_EVAL_lunar-landing-site-navigator.md`.
- `frontend/src` altındaki ilgili kod.
- `data/examples/recorded/` altındaki kayıtlar.

#### Başlangıç durumları

`<taban>` = `http://127.0.0.1:5173/?data=live`. Örnek modda `data=live` çıkarılır, diğer parametreler aynı kalır.

| Kod | Adres | Ekranda beklenen |
|-----|-------|------------------|
| S0 | `<taban>`, temiz gizli pencere, ek parametre yok | Açılış ekranı. Geçilince varsayılan görünüm Plan'dır (`frontend/src/shell/ui-state.ts:18`, `DEFAULT_DOOR = 'plan'`). Senaryo yok. |
| URL-A | `<taban>&door=explore&site=mons-mouton-im2-target&start=2026-12-01T00:00:00Z&end=2026-12-31T00:00:00Z&mast=2&panel=vertical_tracking&crit=center&t=2026-12-01T00:00:00Z` | Açılış ekranı yeniden gelir (HE-09) ve moderatör tarafından geçilir. Ardından Explore görünümü açılır: Mons Mouton (IM-2 target point), 1-31 Aralık 2026, seçili an 2026-12-01 00:00 UTC. Bu durum, "Mons Mouton: a low Sun" araştırma senaryosunun parametreleriyle aynıdır (`frontend/src/content/scenarios.json`, `polar-sun`). |
| URL-R | `<taban>#/start` | Rol başlangıç sayfası. Rol adresleri açılış ekranını göstermez (`frontend/src/App.tsx:20-26`). |

#### Görev tablosu

| ID | Katılımcıya okunan görev metni | Gözlemci için amaç | Başlangıç durumu (URL ya da ekran) | Başarı ölçütü (beklenen cevap + dosya referansı) | Süre sınırı (dk) | UC | HE | Öncelik gerekçesi |
|----|------|------|------|------|------|------|------|------|
| T-H01 | "Bu uygulamayı ilk kez açtınız. Ay'daki bir iniş yerinden gökyüzünün nasıl göründüğünü merak ediyorsunuz. Uygulamada sizin gibi meraklı ziyaretçiler için hazırlanmış bölümü bulun ve orada ilk olarak ne yapmanız gerektiğini söyleyin." | Katılımcının açılış ekranından ve varsayılan Plan görünümünden ziyaretçi görünümüne geçebildiğini görmek. Senaryo yokken ilk adımın "yer seçmek" olduğunu anlayıp anlamadığını ölçmek. | S0, açılış ekranı. Süre açılış ekranında başlar. | Sayısal cevap yoktur. Başarı için iki koşul gerekir: (1) adreste `door=explore` görünür, durum çubuğunda "Explore door" yazar; (2) katılımcı ilk adımı "yer seçmek" diye söyler ya da üstteki "Site" listesini açar. Görev, seçim yapılmadan biter (bkz. bölüm 3.5, kapsam notu). Ekrandaki boş durum metinleri `frontend/src/shell/doors/DoorSummary.tsx:29` ve `frontend/src/features/setup/shared.tsx:130` içindedir. | 3 | UC-01 (ilk adım) | HE-03, HE-08, HE-09, HE-10, HE-11 | Öncelik 2. Düzeltilen severity 3 bulgusu HE-03'ün K3'teki tek bağlamı senaryosuz ziyaretçi görünümüdür. Görev ilk izlenimi de ölçer. |
| T-H02 | "Ay'ın güney kutbuna yakın Mons Mouton'da bir ay geçirdiğinizi düşünün. Bu ay boyunca başınızı kaldırıp baksaydınız Güneş'in ve Dünya'nın ne yaptığını görürdünüz? Uygulamada izleyin. Sonra bunu bir arkadaşınıza anlatır gibi kendi cümlelerinizle anlatın." | K3 başarı ölçütünü doğrudan ölçmek: katılımcı bir sahada Güneş'in ve Dünya'nın ne yaptığını kendi cümlesiyle anlatabilmeli. Ufuk şeridinin ve zaman şeridinin okunabilirliğini görmek. | URL-A, açılış ekranı geçilmiş. | T-H02 puanlama rubriğiyle "doğru" puanı: en az bir Güneş öğesi ve en az bir Dünya öğesi doğru, yanlış iddia yok. Kaynaklar: `data/examples/recorded/mons-mouton-im2-target/events.json` ve `sky-series.json`. | 6 | UC-03, UC-04, UC-05, UC-09 (S-03) | HE-23, HE-24 | Öncelik 1 ve görev atlanmaz. Görev, use-case belgesinin K3 başarı ölçütünü (TH-1, M-01) ve zorunlu senaryo S-03'ü karşılar. |
| T-H03 | "Çin'in Chang'e 4 aracı Ay'ın arka yüzüne indi. Aralık 2026'da o noktada duruyor olsaydınız, Dünya'ya doğrudan mesaj gönderebilir miydiniz? Cevabınızı ve uygulamada bunu nereden anladığınızı söyleyin." | Katılımcının sahayı yalnız ziyaretçi görünümündeki seçiciyle değiştirebildiğini görmek. İletişim kavramını ekrandaki bir kanıta dayandırıp dayandıramadığını ölçmek. | URL-A, açılış ekranı geçilmiş. Seçili an 2026-12-01 00:00 UTC'dir. | Başarı için üç koşul gerekir: seçicide Chang'e 4 seçilidir, katılımcı "hayır" der ve en az bir ekran kanıtı gösterir. Kabul edilen kanıtlar: (a) `data/examples/recorded/change-4/events.json`, `response.metrics.earth_visible_fraction` = 0.0; sonuç cümlesinde "Earth is in view 0 % of the time" yazar (`longest_earth_hidden_hours` = 720.0, `relay_status` = "required"). (b) `.../change-4/earth-link.json`, `link_windows` alanında 2026-12-01T00:00:00Z ile 2026-12-31T00:00:00Z arasında tek bir `relay_needed` penceresi vardır; panelde "Relay needed" yazar. (c) `.../change-4/now.json`: `earth_up` = false, `hours_to_earthrise` = null, `search_limited` = true; sayaçta "Earth does not rise in this period" yazar. | 4 | UC-01, UC-05, UC-07 (S-08) | HE-11, HE-25 | Öncelik 4. Saha seçici, K3'ün sahayı değiştirebildiği tek yerdir; görev zorunlu UC-01'i ve UC-07'yi kapsar. |
| T-H04 | "Mons Mouton'a Aralık 2026'da iki haftalık bir görev için araç indireceksiniz. Aracın bol güneş alacağı, uzun süre karanlıkta kalmayacağı ve Dünya ile konuşabileceği bir iniş günü bulun." | Kullanıcının oyun içinde doğru seviyeyi ve tarihi bulabildiğini görmek. "Land" ile "Try another date" döngüsünde yönünü kaybedip kaybetmediğini izlemek. | URL-A, açılış ekranı geçilmiş. Oyun varsayılan olarak Apollo 11 seviyesinde ve 2026-12-01 tarihinde açılır. | Başarı için Mons Mouton December 2026 seviyesinde 12-19 Aralık 2026 arasında bir tarihle iniş yapılmalı. Sonuç kartının başlığında "Landing on 2026-12-1x" yazar ve üç yıldız da doludur; üç hedef satırının hepsinde ✓ vardır. Aynı yıldızlar "Your landings" listesinde de görünür. ("3 of 3 goals met" metni yalnız `aria-label` içindedir, ekranda görünmez.) Kaynak: `frontend/src/features/game/recorded-answers.json` (seviye `polar-december`; yalnız bu sekiz tarih 3/3 verir). Hedefler `frontend/src/content/game-levels.json` içindedir: en az 7.0 gün güneş, en çok 72 saat karanlık, en az 9.8 gün Dünya. Örnek: 2026-12-15 için kayıt `[1, 0, 1]`, ekranda "saw the Sun on 14.0 of 14 days … 0.0 hours … 14.0 of 14 days". Çapraz denetim: `data/examples/recorded/mons-mouton-im2-target/events.json` içinde sunrise 2026-12-14T18:55:31Z, sunset 2026-12-30T05:50:52Z, earthrise 2026-12-09T12:35:12Z. Apollo 11 seviyesinde alınan 3/3 sonuç başarı sayılmaz. | 4 | UC-17 | HE-05 (kısmi), HE-30 (yalnız AT) | Öncelik 3. UC-17 yalnız bu görünümdedir. Görev, severity 3 düzeltmesi HE-05'in görsel döngüsünü de sınar. |
| T-H05 | "Ay'da bir gece ne kadar sürer? Apollo 11'in indiği yer için öğrenin." | Rol sayfalarından ziyaretçiye ait olanı seçip sayıyı okuyabildiğini görmek. Geçerlilik etiketinin anlaşılıp anlaşılmadığını yoklamak. | URL-R. Rol sayfasına arayüzden ulaşılamadığı için adresi moderatör elle açar (HE-08). | Başarı için `#/public` sayfasında Apollo 11 seçilidir ve katılımcı "13.6 days" değerini verir. Kaynak: `data/examples/recorded/apollo-11/events.json`, `response.metrics.longest_dark_hours` = 327.52. Ekranda "13.6 days, longest stretch without sunlight" yazar; değerin kopyası `frontend/src/roles/data.json` içindedir. Varsayılan Mons Mouton değeri (330.46 saat, ekranda "13.8 days") başarı sayılmaz. | 2 | UC-05 | HE-08, HE-09, HE-12, HE-15 | Öncelik 5. Süre yetmezse ilk bu görev çıkarılır. Rol sayfaları ana ekranın tekrar eden bir özetidir. |

#### T-H02 puanlama rubriği

Öğeler kayıtlı dosyalara dayanır:

| Öğe | İçerik | Kayıt |
|-----|--------|-------|
| G1 | Güneş alçakta kalır: ufkun hemen üstünde ufku dolaşır, tepeye çıkmaz. | `sky-series.json`: en yüksek 6.470271°, 2026-12-21T12:00:00Z; Güneş azimutu 1.4° ile 358.4° arası. `events.json`: `max_sun_elevation_deg` = 6.4703. |
| G2 | Gün ve gece haftalarca sürer. Güneş ayın başında batar, iki haftaya yakın karanlık kalır, 14 Aralık'ta doğar. | `events.json`: sunset 2026-12-01T00:28:10Z, sunrise 2026-12-14T18:55:31Z, sunset 2026-12-30T05:50:52Z. `longest_dark_hours` = 330.46, ekranda "13 d 18.5 h". `sunlit_fraction` = 0.5158, ekranda "52 %". |
| D1 | Dünya gökyüzünde hemen hemen aynı yönde durur, yalnız biraz yükselip alçalır. | `sky-series.json`: Dünya azimutu 322.5° ile 338.5° arası, yüksekliği −2.1° ile 10.6° arası. |
| D2 | Dünya ayın çoğunda görünür, ama birkaç gün ufkun altına iner. | `events.json`: earthset 2026-12-04T09:30:06Z, earthrise 2026-12-09T12:35:12Z. `longest_earth_hidden_hours` = 123.08. `earth_visible_fraction` = 0.829, ekranda "83 %". |

| Puan | Koşul |
|------|-------|
| Doğru | En az bir G öğesi ve en az bir D öğesi kendi sözcükleriyle doğru anlatılır, temel bir yanlış iddia yoktur. Sayı söylenmesi gerekmez. |
| Kısmen | Yalnız Güneş ya da yalnız Dünya hakkında doğru öğe vardır. "Did you know?" kartındaki cümle tekrarlanır ama karta eklenen bir öğe yoktur. Ya da doğru öğelerin yanında bir yanlış iddia vardır. |
| Yanlış | Doğru öğe yoktur ya da şu temel yanlışlardan biri söylenir: Güneş tepeye çıkar; Güneş her gün doğup batar; Dünya her gün doğup batar; Dünya hiç görünmez. |

Öncelik kuralı: listelenen temel yanlışlardan biri söylenirse cevap, öteki içeriğe bakılmaksızın "yanlış" puanlanır. Doğru öğelerin yanındaki listede olmayan küçük bir hata ise "kısmen" sayılır. Moderatör ve gözlemci kayıttan bağımsız puan verir; uyuşmazlık tartışmayla çözülür. M-01'de yalnız "doğru" puanı başarı sayılır, "kısmen" ayrı raporlanır.

#### Gözlem noktaları

**T-H01**
- "Open console" düğmesinin katılımcıda yarattığı beklenti ve geçişten sonra mühendis görünümünün (Plan) açılmasına tepkisi.
- "Audience" adlı seçicinin anlaşılması. Görünüm ipuçları yalnız fareyle üzerine gelince çıkar (HE-10). Katılımcının bir başlangıç ya da roller sayfası arayıp aramadığı izlenir (HE-08).
- "door" sözcüğünün anlaşılması (HE-11). Bu sözcük "No site chosen yet. Pick one above; every door shows the same scenario." metninde ve durum çubuğundaki "Explore door" yazısında geçer.
- Sağ sütundaki "No scenario yet. Pick a site at the top of the main view." yönlendirmesinin izlenip izlenmediği ve etkisiz bir düğmenin kalmadığı (HE-03 düzeltmesi).

**T-H02**
- Ufuk şeridinde eksen başlığı yoktur (HE-24). Katılımcının yatay ekseni pusula yönü, dikey ekseni derece olarak okuyup okumadığı izlenir.
- Katılımcının zamanı nasıl ilerlettiği: oynatma, hız, ay günü atlama ya da kaydırıcı. Zaman şeridindeki işaretlerin lejantı yoktur (HE-23). Dolu işaretin doğuş, çerçeveli işaretin batış olduğunu çözüp çözemediği izlenir.
- Anlatımın kaynağı: katılımcı kendi gözlemini mi aktarıyor, yoksa sağ sütundaki "Did you know?" kartını ya da tek cümlelik sonucu mu tekrarlıyor (rubrik, "kısmen" satırı).
- Yalnız örnek modda: oynatmadan sonra sayaç genel örneğe düşer ve uyuşmazlık notu gösterir. Katılımcının bu nota ve geçerlilik etiketine tepkisi izlenir (TH-4).

**T-H03**
- Saha listesinde Chang'e 4'ün bulunma süresi. Listede kategori grupları ve "Candidate regions" vardır. Listenin altındaki "Change dates, mast or panel in the Plan door." notu da izlenir (HE-11).
- Katılımcının kanıt olarak hangi öğeyi kullandığı: sonuç cümlesi, sayaç, "Talking to Earth" paneli ya da uzay sahnesi. "Relay needed" teriminin anlaşılıp anlaşılmadığı da izlenir.
- Katılımcı 3B Ay'ı ya da uzay sahnesini açarsa: fare tekerleği sayfayı kaydırmak yerine sahneyi yakınlaştırır (HE-25). "Illustration" ve "not to scale" notlarının fark edilip edilmediği izlenir.

**T-H04**
- Varsayılan Apollo 11 seviyesinden Mons Mouton seviyesine geçilmesi ve seviye düğmelerinin seçim olarak algılanması.
- "Land" sonrası sonuç kartı formun yerini alır, "Try another date" sonrası form geri gelir. Bu sırada katılımcının yönünü kaybedip kaybetmediği izlenir (HE-05). Gören katılımcıda bu yalnız kısmi kanıttır; odak ve duyuru doğrulaması, HE-30 ile birlikte AT-01 ve AT-02'de yapılır.
- Deneme sayısı ("Your landings" listesi) ve katılımcının stratejisi: rastgele mi deniyor, önceki sonuçtan mı çıkarım yapıyor? İlk tarih 2026-12-01 0/3 verir; ekranda Sun 0.2 gün, darkness 330.5 saat, Earth 8.9 gün yazar.
- Hedeflerin görev gereksinimi olmadığını söyleyen notun fark edilip edilmediği.

**T-H05**
- Başlangıç sayfasında Public kartının ziyaretçiye ait olarak tanınma süresi.
- Varsayılan Mons Mouton seçiminden Apollo 11'e geçişin fark edilip edilmediği; 13.8 ile 13.6 günün karıştırılması.
- Görev bitince tek yoklama sorusu sorulur: "Sayıların altındaki 'SYNTHETIC' sözcüğü size ne anlatıyor?" (HE-12, TH-4). Moderatör yorum yapmaz.
- Alt bilgideki "Recorded example … Not live." uyarısının okunabilirliği (HE-15). Katılımcı "Open the live explorer" bağlantısına basarsa açılış ekranı yeniden gelir ve senaryo yüklenmez (HE-09).

#### Kapsam notu

Oturumlar canlı modda yürütülür (bölüm 7.3). Beş görevin beşi de yedek (örnek) modda da güvenlidir; hiçbiri için canlı mod şart değildir.

| Görev | Koşul |
|-------|-------|
| T-H01 | Görev, saha seçiminden önce biter. Senaryo yokken yapılan seçim bugünden itibaren 30 günlük bir senaryo başlatır (`frontend/src/shell/doors/site-pick.ts`, `scenarioForPick`); bu dönem kayıtlı kapsamın dışındadır. Bu yüzden T-H02'den önce adres URL-A ile sıfırlanır. |
| T-H02 | Olay ve gökyüzü kayıtları Aralık ayının tamamını kapsar; gökyüzü örnekleri 6 saatte birdir (`index.json`, `sky_step_minutes` 360). Sayaç (`now.json`) yalnız 2026-12-01 00:00 için kayıtlıdır. 1 Aralık 00:00 dışındaki sayaç değerleri ancak canlı modda doğrudur ve ölçüte girmez. |
| T-H03 | Seçici, etkin senaryonun tarihlerini korur (`sameDateAnotherSite`); bu yüzden Chang'e 4 kayıtları eşleşir. Sayaç kanıtı yalnız seçili an değişmediyse geçerlidir; diğer iki kanıt tüm dönem için geçerlidir. 3B Ay ışığı ve uzay sahnesi geometrisi sahaya özgü olmayan `data/examples/body-series.json` örneğinden gelir. Bu yüzden yalnız gözlem noktasıdır; sahnedeki bağlantı kipi metni ise kayıtlı `earth-link.json` dosyasından gelir. |
| T-H04 | Oyun, kendi kayıtlı sunucu cevaplarını kullanır (`recorded-answers.json`, `recorded_utc` 2026-11-15T03:46:00Z, commit `001efd1`). Mons Mouton seviyesi yalnız 1-20 Aralık 2026 tarihlerini sunar. |
| T-H05 | Rol sayfaları statik `frontend/src/roles/data.json` dosyasını okur. Bu dosya Aralık 2026 kayıtlarının kopyasıdır ve veri kipinden bağımsızdır. |

#### Varsayımlar ve açık noktalar

- Oturum, bölüm 7.3'teki gibi canlı modda yürütülür. Canlı sunucu kayıtla aynı sonucu verir (`index.json`, `main_sha` cb461ae). Teknik sorumlu pilot öncesi URL-A'yı iki modda dener. Beklenen görünüm: sonuç cümlesinde "52 %", "13 d 18.5 h", "83 %"; sayaçta "28 min" (`hours_to_sunset` = 0.47) ve "3 d 9.5 h" (`hours_to_earthset` = 81.5). Oyun kayıtları başka bir sunucu commit'inden (`001efd1`) alındığı için oyunda bir sınır çifti de denenir. 2026-12-12 3/3 vermelidir. 2026-12-11 3/3 vermemelidir: karanlık 90.9 saattir ve 72 saatlik sınırı aşar. Fark çıkarsa ölçüt pilot öncesi güncellenir.
- Varsayım: K3 katılımcıları arayüzün İngilizce metinlerini okuyabilir; görev kartı Türkçe okunur. Dil kaynaklı takılmalar ayrı kritik olay olarak kodlanır.
- Varsayım: Sıra sabittir. T-H02, T-H04'teki tarih seçimini kolaylaştırabilir; bu öğrenme etkisi sınırlılık olarak raporlanır.
- Karar: `frontend/src/features/game/recorded-answers.json` oyunun kayıtlı sunucu cevaplarıdır ve atıf kuralına dahildir (bölüm 3.1). Commit farkı, yukarıdaki sınır çifti denemesiyle pilot öncesi kontrol edilir.
- TBD — Süre sınırlarının toplamı 19 dakikadır. Adres dört kez sıfırlanır ve her seferinde açılış ekranı gelir; bu yüzden blok aşılabilir. Süreyi Pilot 1 ölçer. Aşılırsa önce T-H05, sonra T-H03 çıkarılır.
- TBD — İki puanlayıcı arasında kabul edilecek uyum eşiği belirlenmedi.

### 3.6 Erişilebilirlik Oturumlarının Görev Seti (AT-01, AT-02)

Erişilebilirlik oturumları sorun keşfi için değil, belirli bulguları doğrulamak içindir (bölüm 9.6). Görevler mevcut görevlerden türetilip kısaltılmıştır; süre üst sınırlarının toplamı 20 dakikadır. AT-01 tüm görevleri fare kullanmadan, AT-02 ekran okuyucuyla yapar. Sonuçlar M-06'ya girer, M-01'e girmez. Bulgu bazlı geçme ölçütleri bölüm 9.6'daki tablodadır.

| ID | Katılımcıya okunan görev metni | Kaynak görev | Başlangıç durumu | Başarı ölçütü | Süre sınırı (dk) | HE |
|----|-------------------------------|--------------|------------------|---------------|------------------|----|
| T-A01 | "Bu uygulamada Ay'ı merak eden ziyaretçiler için hazırlanmış bölümü bulun ve orada güney kutbuna yakın bir yer seçin." | T-H01 | S0 (bölüm 3.5) | Adreste `door=explore` görünür ve bir güney kutbu sahası seçilidir. AT-02'de seçimden sonra değişen sonuç cümlesinin duyurulup duyurulmadığı ya da katılımcının onu bulup bulmadığı kaydedilir. | 4 | HE-03, HE-07, HE-10 |
| T-A02 | "Zamanı ileri oynatın, bir süre sonra durdurun ve bir sonraki gün doğumuna ne kadar kaldığını söyleyin. Sonra bu değerin kaynak bilgisini açıp kapatın." | T-H02 | URL-A (bölüm 3.5) | Oynatma başlatılıp durdurulur ve geri sayımdaki gün doğumu değeri okunur. Değer seçilen ana bağlıdır; gözlemci ekrandan doğrular. Geri sayımın kaynak bilgisi açılıp kapatıldıktan sonra odağın nereye düştüğü kaydedilir (`frontend/src/features/hud/HudView.tsx`, `SourcePopover`). | 4 | HE-02, HE-22, HE-17 |
| T-A03 | "Bu oyunda Mons Mouton için Aralık 2026'da bir iniş günü deneyin, sonucu söyleyin, sonra başka bir gün deneyin." | T-H04 | URL-A | Bir iniş sonucu okunur ve ikinci bir tarih denenir. Land sonrasında ve "Try another date" sonrasında odağın nereye gittiği kaydedilir. | 4 | HE-05, HE-30 |
| T-A04 | "Bu sayfadaki sonuçlar arasında Dünya ile iletişimle ilgili olanı açın ve Aralık başında iletişimin hangi tarihler arasında kesildiğini söyleyin." | T-P02 | U1 (bölüm 3.3), ANALYZE modu moderatör tarafından açılmış | Dünya `2026-12-04 09:30 UTC` ile `2026-12-09 12:35 UTC` arasında görünmüyor (`data/examples/recorded/mons-mouton-im2-target/events.json`, `earth_hidden` penceresi). | 4 | HE-01 |
| T-A05 | "Ay'ın güney kutbuna yakın bir yerde duran bir astronot Dünya'yı her gün doğup batarken görür mü? Tahmininizi söyleyin, sonra cevabı uygulamada kontrol edin." | T-S01 | A1 (bölüm 3.4) | T-S01 ile aynı. Cevap açıldıktan sonra odağın nereye gittiği ve cevabın duyurulup duyurulmadığı kaydedilir. | 4 | HE-26, HE-03 |

## 4. Demografik Bilgi Formu

Ders slaytındaki beş soru değiştirilmeden kullanılır. 5. sorudaki "mevcut yazılım" Lunar Landing Site Navigator'dır; moderatör bunu soruyu okurken söyler.

```
1. Eğitim seviyesi:
2. Yaş:
3. Bilgisayar kullanım seviyesi: ☐ Insufficient  ☐ Partially Sufficient  ☐ Sufficient
4. İnternet kullanım seviyesi:   ☐ Insufficient  ☐ Partially Sufficient  ☐ Sufficient
5. Mevcut yazılımı tanıyor musunuz? ☐ Evet  ☐ Hayır
```

Sık, orta ve ilk kez kullanıcı karışımını kurmak için kullanılan deneyim tarama soruları (bölüm 9.3) ile isteğe bağlı cinsiyet sorusu (bölüm 9.4) bu formun parçası değildir; işe alım aşamasında ayrı sorulur.

## 5. Pre-test Soruları

Moderatör bu soruları onaydan sonra, görevlerden önce sorar. Bilgi sorusu (P7) her zaman en son sorulur ve "bilmemek tamamen normal" denerek sunulur. Moderatör P7'nin doğru cevabını söylemez, katılımcıyı düzeltmez; cevabı yalnızca kodlar: 0 = bilmiyor ya da yanlış, 1 = kısmen doğru, 2 = doğru. Bu kod analizde ön bilgi değişkeni olarak kullanılır. K2-S'ye sorular "sen" diliyle sorulur.

| # | Grup | Soru | Beklenen ya da moderatörün yapacağı |
|---|------|------|-------------------------------------|
| P1 | Tümü | "Bugün burada neyin sınandığını kendi cümlelerinizle anlatır mısınız?" | Yazılımın sınandığını, kendisinin sınanmadığını söyler. Söylemezse moderatör bunu yeniden açıklar. |
| P2 | Tümü | "Bir görevde takılırsanız ne yaparsınız?" | Sesli düşünerek denemeye devam eder ya da "pas" der. Moderatörün ipucu vermeyeceğini bilir. |
| P3 | Tümü | "Sesli düşünmeyi bir örnekle gösterir misiniz? Örneğin telefonunuzda alarm kurarken." | Adımları sesli söyler. Bu soru ısınma olarak kullanılır. |
| P4 | Tümü | "Görev kartını okuduğunuzda görevin bittiğini nasıl anlayacaksınız?" | Kartta istenen sonucu söylediğinde bittiğini bilir; her görevin bir üst süresi olduğunu, ama acele etmesi gerekmediğini bilir. |
| P5 | Tümü | "İstediğiniz an durabileceğinizi biliyor musunuz?" | "Evet" der. K2-S'de sözlü onay metni tekrar hatırlatılır. |
| P6 | K1 | "Görevlerde saha ve tarih seçen bir planlamacısınız; kararı yalnızca ekrandaki bilgiyle vereceksiniz. Bu çerçeve kendi işinize ne kadar benziyor?" | Rolü kabul eder. Benzemediğini söylerse nedeni not edilir. |
| P6 | K2-T | "Görevlerde bu aracı derste kullanmayı düşünen bir öğretmensiniz. Bir kavramı sınıfa gösterirken bir araçtan ne beklersiniz?" | Beklentisi not edilir; görev sonrası karşılaştırmada kullanılır. |
| P6 | K2-S | "Görevlerde Ay hakkında ödev hazırlayan bir öğrencisin. Ödev için bir bilgisayar programından en çok neyi öğrenmek isterdin?" | Rolü anlar; beklentisi not edilir. Doğru ya da yanlış diye değerlendirilmez. |
| P6 | K3 | "Görevlerde Ay'ı merak eden bir ziyaretçisiniz. Ay'da bir noktada durmakla ilgili ne merak ediyorsunuz?" | Merak ettiği şey not edilir. |
| P7 | K1 | "Ay'ın güney kutbunda Güneş neden hep ufka yakın kalır?" | 2 puan: Ay'ın dönme ekseninin ekliptiğe göre eğikliğinin çok küçük olduğunu söyler. |
| P7 | K2-T | "Öğrencilere Ay'ın neden hep aynı yüzünü gördüğümüzü nasıl açıklıyorsunuz?" | 2 puan: Ay'ın kendi ekseni etrafında dönme süresinin Dünya etrafında dolanma süresine eşit olduğunu söyler. |
| P7 | K2-S, K3 | "Ay'ın neden hep aynı yüzünü gördüğümüzü biliyor musunuz?" | Kodlama K2-T ile aynıdır. |
| P8 | AT-01, AT-02 | K3 sorularına ek olarak: "Bugün kullandığınız ayarlar her zamankiyle aynı mı? Bir sayfada nasıl gezindiğinizi kısaca gösterir misiniz?" | Kurulum doğrulanır. AT-02'de İngilizce ses kontrolü burada yapılır. |

## 6. Post-test Anketi

Ders slaytındaki 13 soru değiştirilmeden kullanılır.

```
1. Sistemde aradığınız bilgiyi bulmak: ☐ Difficult ☐ Normal ☐ Easy
2. Yardım ve dokümantasyon: ☐ Insufficient ☐ Partially Sufficient ☐ Sufficient
3. Estetik özellikler (ikon, renk, font): ☐ Bad ☐ Normal ☐ Good
4. Sistemin dili: ☐ Incomprehensible ☐ Partially Understandable ☐ Understandable
5. Sistem: ☐ Slow ☐ Normal ☐ Fast
6. Kullanım ve öğrenme: ☐ Difficult ☐ Normal ☐ Easy
7. Kullanım hatırlanabilirliği: ☐ Easy ☐ Partially ☐ Not easy
8. Hata önleyici rehberlik: ☐ Available ☐ Partially Available ☐ Not Available
9. Sistemde kaybolma hissi: ☐ Experienced ☐ Partly experienced ☐ Not experienced
10. Bilgi mesajları (transaction status): ☐ Sufficient ☐ Partially ☐ Not Sufficient
11. Hata mesajları (informing/directing): ☐ Sufficient ☐ Partially ☐ Not Sufficient
12. Hangi task'larda en çok zorlandınız? Neden?
    [açık uçlu]
13. Sistemde yanlış veya eksik bulduklarınız:
    [açık uçlu]
```

**Puanlama (M-05).** 1-11. sorular 1-3 arasında puanlanır ve 3 her zaman olumlu uçtur. Seçeneklerin sırası sorudan soruya değiştiği için puan yönü soru bazında sabitlenir:

| Soru | 1 puan | 2 puan | 3 puan | Not |
|------|--------|--------|--------|-----|
| 1, 6 | Difficult | Normal | Easy | |
| 2 | Insufficient | Partially Sufficient | Sufficient | |
| 3 | Bad | Normal | Good | |
| 4 | Incomprehensible | Partially Understandable | Understandable | Arayüz yalnız İngilizce olduğundan yalnız İngilizce okuyabilen kullanıcıları temsil eder (bölüm 9.1) |
| 5 | Slow | Normal | Fast | |
| 7 | Not easy | Partially | Easy | Ters puanlanır: olumlu seçenek formda ilk sıradadır |
| 8 | Not Available | Partially Available | Available | Ters puanlanır |
| 9 | Experienced | Partly experienced | Not experienced | Kaybolma hissinin yaşanmaması olumludur |
| 10 | Not Sufficient | Partially | Sufficient | Ters puanlanır |
| 11 | Not Sufficient | Partially | Sufficient | Ters puanlanır |

12 ve 13. sorular açık uçludur ve puanlanmaz; içerik analizinde bulgu kaynağı olarak kullanılır (bölüm 12). Katılımcı başına M-05, 1-11. soruların ortalamasıdır; kitle değeri bu ortalamaların ortalamasıdır. Anket, SUS'tan önce uygulanır.

### 6.1 System Usability Scale (SUS)

SUS maddeleri (Brooke, J. (1996). SUS: A "quick and dirty" usability scale. P. W. Jordan vd. (Ed.), *Usability Evaluation in Industry* içinde, 189-194. Taylor & Francis). Ölçek: 1 Kesinlikle katılmıyorum - 5 Kesinlikle katılıyorum. Puanlama: tek numaralı maddelerde (puan − 1), çift numaralı maddelerde (5 − puan); toplam x 2,5 = SUS puanı (0-100). Aşağıdaki metin çalışma çevirisidir. TBD — Türkçe geçerlik çalışması yapılmış bir SUS çevirisi birincil kaynaktan teyit edilmedi; teyit edilen çeviri bulunursa o kullanılır, bulunmazsa bu durum raporda sınır olarak yazılır.

| # | Madde | Yön |
|---|---|---|
| 1 | Bu sistemi sık sık kullanmak isteyeceğimi düşünüyorum. | + |
| 2 | Sistemi gereksiz yere karmaşık buldum. | − |
| 3 | Sistemin kullanımının kolay olduğunu düşündüm. | + |
| 4 | Bu sistemi kullanabilmek için teknik bir kişinin desteğine ihtiyaç duyacağımı düşünüyorum. | − |
| 5 | Sistemdeki çeşitli işlevlerin iyi bütünleştirildiğini düşündüm. | + |
| 6 | Sistemde çok fazla tutarsızlık olduğunu düşündüm. | − |
| 7 | Çoğu insanın bu sistemi kullanmayı çok çabuk öğreneceğini düşünüyorum. | + |
| 8 | Sistemi kullanmayı çok zahmetli buldum. | − |
| 9 | Sistemi kullanırken kendimden çok emin hissettim. | + |
| 10 | Bu sistemi kullanmaya başlamadan önce birçok şey öğrenmem gerekti. | − |

## 7. Test Ortamı

### 7.1 Laboratuvar ve doğal ortam

Ders slaytı, Brush, Ames ve Davis (2004), Tullis vd. (2002) ve Hertzum (1999) çalışmalarına dayanarak laboratuvar testlerinin gerçek kullanım davranışından sapabildiğini belirtir. Bu nedenle her kitle ürünü kullanacağı doğal ortamda test edilir: K1 kendi çalışma yerinden uzaktan, K2 gerçek bir okul sınıfında, K3 kampüste ya da evde.

| Kazanılan | Kaybedilen kontrol | Telafi |
|---|---|---|
| Gerçek gürültü, kesinti ve kullanım bağlamı | Kitleler arasında ortam eşitliği | Ortam koşulları her oturumda gözlem formuna yazılır |
| Gerçek kullanıma yakın davranış | Ekran, ağ ve ışığın sabitliği | Uygulama tek bir moderatör dizüstünde, sabit tarayıcı ve çözünürlükle çalışır |
| Katılımcının alışık olduğu yer | Sürelerin kitleler arası karşılaştırılabilirliği; ses ve ekran kaydının kalitesi | M-02 yalnız kitle içinde karşılaştırılır (bölüm 11); yaka mikrofonu ya da kulaklık |

Barındırılan bir sürüm yoktur. Uygulama her oturumda moderatör dizüstünde çalışır; katılımcının cihazı yalnız uzak oturumlarda görüntü ve kontrol için kullanılır.

### 7.2 Kitleye göre ortam

| Değişken | K1 (uzaktan) | K2 (okul sınıfı) | K3 (kampüs / ev) | AT-01 / AT-02 |
|---|---|---|---|---|
| Yer | Katılımcının çalışma yeri | Okulun kendi sınıfı; öğretmenler ders dışı saatte, öğrenciler ders saatinde | Kampüs ortak alanı ya da katılımcının evi | Katılımcının seçtiği sessiz yer |
| Cihaz | Uygulama moderatör dizüstünde; katılımcı kendi bilgisayarından uzaktan kontrol eder | Moderatör dizüstü, harici fare | Moderatör dizüstü, harici fare; evde uzak oturum yapılırsa K1 düzeni | AT-01: moderatör dizüstü, Türkçe Q klavye, fare kaldırılır; AT-02: bölüm 7.3.2 |
| Tarayıcı | Varsayım: Chrome güncel kararlı sürüm, %100 yakınlaştırma, tüm oturumlarda aynı | Aynı | Aynı | Aynı; AT-02'de ekran okuyucuyla uyumu pilotta denenir |
| Ekran | Moderatör 1920x1080 sabit; Varsayım: katılımcı ekranı en az 1366x768; yalnız tarayıcı penceresi paylaşılır | Dizüstü ekranı 1920x1080 | Aynı | Aynı; büyütme kullanılmaz |
| İnternet | Varsayım: görüntülü görüşme için iki tarafta en az 10 Mbps; uygulamanın kendisi yerel çalışır | Uygulama ağ gerektirmez (yerel sunucu); okul ağı kullanılmaz | Ağ gerekmez | Uzaktan yapılırsa K1 koşulu |
| Gürültü ve ışık | Katılımcının kontrolünde; kulaklık istenir | Sınıf gürültüsü; yaka mikrofonu, pencere yansımasına göre masa seçimi | Kantin gürültüsü; sessiz köşe seçilir | Ekran okuyucu sesi için sessiz ortam zorunlu |
| Dikkat dağıtıcı ve kesinti | Bildirimler, e-posta, iş arkadaşları | Diğer öğrenciler, zil, okul anonsu | Aile bireyleri, telefon | Bildirimler, telefon |
| Moderatör önlemi | Başta bildirimlerin kapatılması istenir; kesintide süre durdurulur | Varsayım: öğrenciler aynı gün ardışık ders saatlerinde, tek dizüstüyle sırayla ve diğerlerinin ekranı görmediği masada çalışır (ikinci dizüstü yedektir); zilde görev "kesinti" sayılır | Telefon sessize alınır; kesinti forma yazılır | Kesinti forma yazılır |

### 7.3 Veri Modu Kararı

#### 7.3.1 Öneri: moderatör dizüstünde canlı mod

Moderatör dizüstü canlı modda çalışır ve görevler kayıtlı kapsamın içinde kalır. Kayıtlar canlı sunucunun aynen saklanmış cevaplarıdır (`backend/scripts/record_examples.py`, kayıt commit'i `cb461ae`; bu commit ile taban commit arasında `backend/app`, `data/sites.json` ve `data/horizons` değişmedi). Bu nedenle kapsam içinde canlı ve örnek cevaplar aynıdır; tek fark, örnek modda gökyüzü serisinin 6 saatte bir örneklenmesidir (olay zamanları sunucu hassasiyetini korur). Taban commit `backend/` altında değişirse kayıtlar yeniden alınır. Görev yazarlarının uyması gereken kayıtlı kapsam: Aralık 2026; katalog sahaları ve aday bölgeler; 2 m direk; dikey izleme paneli; Recommend için varsayılan ağırlıklar. Kapsam dışına çıkan görevlerin (T-P05, rehberli görevler) beklenen cevapları Hafta 1'de canlı sunucudan alınır. HE-04 düzeltmesinin notu yalnız örnek modda göründüğünden canlı oturumlarda kullanıcıyla sınanamaz; pilot sırasında ekip tarafından örnek modda kontrol edilir ve raporda "kullanıcıyla sınanmadı" diye işaretlenir. Seçenek B (bölüm 7.3.2) onaylanırsa uzak K1 oturumlarında T-P05 bu notu kullanıcıyla sınar.

README komutları (depo kökünden, sırasıyla); katılımcı adresi `http://127.0.0.1:5173/?data=live`:

```bash
python -m pip install -e "backend[dev]"
python backend/scripts/download_kernels.py
npm ci --prefix frontend
python -m uvicorn app.main:app --app-dir backend --port 8000 --reload
npm --prefix frontend run dev
```

#### 7.3.2 Uzak K1 oturumları

| Seçenek | Açıklama | Durum |
|---|---|---|
| A. Uzaktan kontrol (önerilen) | Katılımcı, görüntülü görüşme aracının uzaktan kontrol özelliğiyle moderatör tarayıcısını kullanır; uygulama canlı modda kalır | Varsayım: kullanılacak araç uzaktan kontrolü destekler (ör. Zoom, Microsoft Teams). Gecikme nedeniyle K1 süreleri diğer kitlelerle karşılaştırılmaz. |
| B. Statik örnek mod derlemesi | `npm --prefix frontend run build` çıktısı barındırılır; kayıtlı cevaplar derlemeye gömülüdür (`frontend/src/api/recorded.ts`), katılımcı kendi tarayıcısını kullanır | TBD — barındırma yeri, erişim kısıtı ve ekip onayı belirlenmedi; barındırılan sürüm yayın sayılır ve onay gerektirir |

AT-02 için uzaktan kontrol uygun değildir: ekran okuyucu sesi moderatör makinesinde üretilir ve katılımcı kendi ayarlarını kaybeder. Seçenek B onaylanırsa AT-02 katılımcının kendi cihazında ve kendi ekran okuyucusuyla yapılır. Onaylanmazsa moderatör dizüstünde NVDA ile yapılır; katılımcı eğitim adımında konuşma hızını ayarlar ve bu durum geçerlik sınırı olarak raporlanır.

#### 7.3.3 Sunucu oturum ortasında durursa

1. Gözlemci süreyi durdurur ve formda "teknik kesinti" işaretler; teknik sorumlu sunucuyu README komutuyla yeniden başlatır. Varsayım: en çok 2 dakika beklenir.
2. Başlamazsa adres `http://127.0.0.1:5173/` (örnek mod) yapılır. Görevler kapsam içinde olduğundan cevaplar aynıdır; ancak arayüz kayıtlı cevap etiketini gösterir ve gökyüzü serisi daha seyrek örneklenir; bu fark forma yazılır. Kesilen görev baştan tekrarlanır; ilk deneme "kesinti" sayılır ve M-01, M-02 paydasına girmez.
3. Ön uç sunucusu da çalışmıyorsa oturum ertelenir; katılımcı aynı görevlerle yeniden davet edilmez, yeni katılımcı alınır.

#### 7.3.4 Oturum öncesi kontrol listesi

| # | Kontrol | Beklenen |
|---|---|---|
| 1 | Depo yolu | Yalnız ASCII karakter; README'ye göre ASCII dışı yolda `kernels_loaded: false` olur |
| 2 | Çekirdekler | `data/raw/kernels/` altında beş SPICE dosyası |
| 3 | Sağlık ucu | `http://127.0.0.1:8000/api/health`: `kernels_loaded: true`; `ephemeris_range` Aralık 2026'yı kapsar |
| 4 | Uç taraması | `python backend/scripts/smoke_api.py` çıkış kodu 0 |
| 5 | Commit | `git rev-parse --short HEAD` taban commit ile aynı; oturumlar arasında uygulama değişmez |
| 6 | Tarayıcı durumu | Her katılımcı için yeni gizli pencere ya da temiz profil; önbellek ve `localStorage` boş |
| 7 | Tema | `feza-theme` anahtarı yok; varsayılan koyu tema açık |
| 8 | URL durumu | Her görev, görev kartındaki başlangıç adresinden açılır (bölüm 3.1); senaryo URL parametrelerinde tutulduğu için adres her görevde yeniden yazılır |
| 9 | Görev başlangıç durumu | Açılış ekranı her yeniden yüklemede gelir; her görev kartı açılış ekranından önce mi sonra mı başladığını belirtir |
| 10 | Kayıt, bildirim ve paylaşım | Ekran ve ses kaydı çalışıyor; işletim sistemi bildirimleri kapalı; yakınlaştırma %100. Uzak oturumda yalnız tarayıcı penceresi paylaşılır; dosya gezgini, sohbet ve sunucu terminalleri paylaşım dışında kalır. Varsayım: oturumlar için ayrı bir işletim sistemi kullanıcı hesabı açılır |

## 8. Pilot Test

Gerçek testten önce iki ardışık pilot zorunludur. Varsayım: Pilot 1 ekip dışı bir üniversite öğrencisiyle (K3 profili), Pilot 2 bir öğretmenle (K2 profili) yapılır. İkisi de gerçek ortamda, gerçek ekipmanla ve tam oturum süresiyle yürütülür. Pilot katılımcıları ana örnekleme dahil edilmez ve verileri analize girmez. Aşağıdaki ders kontrol listesini her pilottan sonra moderatör ve gözlemci birlikte doldurur.

| Kontrol sorusu | Pilot 1 | Pilot 2 | Alınan karar |
|---|---|---|---|
| Pre-test sorular net mi? | | | |
| Task'lar iyi tanımlı mı? | | | |
| Eğitim ne kadar sürer? | | | |
| Teknik engel var mı? | | | |
| Final anket soruları net mi? | | | |
| Soru sırası uygun mu? | | | |

Kural: test iki pilottan sonra yeniden tasarlanır. Pilot 1 bulguları Pilot 2'den önce uygulanır; Pilot 2'den sonraki revizyonla protokol dondurulur ve ilk gerçek oturumdan sonra değişmez.

| Pilottan sonra izin verilen | İzin verilmeyen |
|---|---|
| Görev metninin ve başarı ölçütünün netleştirilmesi | M-01..M-06 tanımlarının ve hedeflerinin değiştirilmesi |
| Görev sırası, süre üst sınırları ve oturum zamanlaması | Kayıtlı kapsam dışına çıkan görev eklenmesi |
| Formlarda soru ifadesi ve sırası (SUS hariç); eğitim içeriği ve süresi | SUS maddelerinin değiştirilmesi; pilot verisinin ana analize katılması |
| Testi engelleyen (severity 4) bir hatanın düzeltilmesi; yeni commit taban olarak kaydedilir, `backend/` değiştiyse kayıtlar yeniden alınır | İlk gerçek oturumdan sonra arayüzde herhangi bir değişiklik |

## 9. Katılımcı Profili ve Sayısı

### 9.1 Gruplar, ölçütler ve kimlikler

| Grup | Kimlikler | Dahil etme ölçütü | Hariç tutma ölçütü | İşe alım kanalı | Ortam |
|------|-----------|-------------------|--------------------|-----------------|-------|
| K1 Görev planlamacı | K1-01, K1-02, K1-03, K1-04, K1-05 | 18 yaş ve üstü; havacılık-uzay, gezegen bilimi ya da yer bilimlerinde lisansüstü öğrenci, araştırmacı ya da mühendis; yörünge, efemeris ya da CBS aracıyla saha veya tarih analizi yapmış olmak | Ortak ölçütler (aşağıda) | Üniversitelerin uzay ve havacılık bölümleri, CubeSat ve roket takımları, Space Apps mentor ağı; kurum çalışanları için TBD — TUA ve TÜBİTAK UZAY ile kurumsal iletişim kanalı kurulmadı | Uzaktan, ekran paylaşımı |
| K2-T Öğretmen | K2-T1, K2-T2 | Lisede fizik, fen bilimleri ya da coğrafya dersi veren, en az 1 yıl deneyimli öğretmen | Ortak ölçütler | İzin alınan okul (bkz. "Okul izni" maddesi), bilim merkezleri, astronomi kulübü danışmanları | Gerçek okul sınıfı |
| K2-S Öğrenci | K2-S1, K2-S2, K2-S3 | 9-12. sınıf öğrencisi; veli onayı ve öğrencinin kendi sözlü onayı alınmış | Ortak ölçütler; onaylardan biri eksik olan | K2-T öğretmenlerinin okulu. Öğretmen yalnızca duyuruyu yapar; seçimi gönüllüler arasından ekip yapar | Gerçek okul sınıfı |
| K3 Halk | K3-01, K3-02, K3-03, K3-04, K3-05 | 18 yaş ve üstü; Ay ya da uzay konusunda mesleki eğitimi olmayan | Ortak ölçütler; havacılık-uzay, fizik ya da astronomi alanında öğrenim gören ya da çalışan | Kampüste mühendislik dışı öğrenci ve personel, ev ortamında tanıdık çevresi | Kampüs ya da ev |

**Ortak ölçütler.** Hariç tutulanlar: ekip üyeleri ve birinci derece yakınları; uygulamanın demosunu izlemiş, heuristic değerlendirmeye ya da pilot teste katılmış olanlar; başka bir grupta oturuma girmiş olanlar. Yardımcı teknoloji kullanan adaylar ana oturumlardan çıkarılmaz, erişilebilirlik oturumlarına (AT-01, AT-02) yönlendirilir. Varsayım: K2-S öğrencileri 14-17 yaş aralığındadır; 18 yaşını doldurmuş bir öğrenci Gönüllü Katılım Formunu kendisi imzalar. K3'e 18 yaş altı katılımcı alınmaz; reşit olmayanlar yalnızca K2-S'de yer alır. Varsayım: Arayüz yalnızca İngilizcedir (`frontend/index.html`, `lang="en"`). Bu nedenle tüm gruplarda dahil etme ölçütü, kısa İngilizce arayüz metnini okuyabildiğini beyan etmektir (öz-beyan, CEFR A2 ve üstü). Bu seçim görev başarısızlığının dil engelinden kaynaklanmasını önler. Bedeli de vardır: post-test 4. soru ("Sistemin dili") yalnızca İngilizce okuyabilen kullanıcıları temsil eder.

### 9.2 Sayının gerekçesi

Virzi (1990, 1992), 4-5 katılımcının kullanılabilirlik sorunlarının yaklaşık %80'ini bulduğunu ve ağır sorunların ilk katılımcılarda ortaya çıktığını göstermiştir. Nielsen ve Landauer (1993) bulunan sorun oranını P(n) = 1 - (1 - L)^n ile modeller. Burada L, tek bir katılımcının bir sorunu bulma olasılığıdır; incelenen projelerde ortalama L = 0,31 bulunmuştur. Bu durumda 5 katılımcı sorunların yaklaşık %84-85'ini bulur. Bu akıl yürütme her kullanıcı sınıfına ayrı uygulanır. Üç kapı farklı arayüz ve görev sunduğu için K1, K2 ve K3 ayrı sınıf sayılır; her birine 5 katılımcı ayrılır. Karşı görüş olarak Spool ve Schroeder (2001), büyük ve görevleri açık uçlu web sitelerinde ilk beş kullanıcının sorunların ancak küçük bir bölümünü bulduğunu gösterir; L ürün karmaşıklığına bağlıdır. Bu uygulamada çok sayıda panel bulunduğu için L 0,31'den düşük olabilir. Bu risk iki önlemle azaltılır: görevler heuristic değerlendirmeye göre daraltılır, düzeltmelerden sonra yeni bir test turu yapılır.

| n | L = 0,31 (Nielsen ve Landauer) | L = 0,15 (kötümser) | Kullanıldığı yer |
|---|-------------------------------|----------------------|------------------|
| 2 | %52 | %28 | K2-T |
| 3 | %67 | %39 | K2-S |
| 5 | %84 | %56 | K1, K3, K2 (iki alt grubun ortak sorunları) |

### 9.3 Deneyim karışımı (vekil ölçüt)

Uygulama yenidir; kimse onu sık kullanmamıştır. Bu nedenle ders slaytının istediği sık, orta ve ilk kez kullanıcı karışımı, grubun işine en yakın araç sınıfıyla vekil olarak kurulur. Seviye tanımları tüm gruplarda aynıdır. **Sık:** son 12 ayda ayda en az 2 kez kullanım. **Orta:** son 12 ayda en az 1 kez ama daha seyrek. **İlk kez:** son 12 ayda hiç kullanmamış. Tarama sorusunun cevap seçenekleri bu üç seviyedir: "Ayda 2 ya da daha çok", "Daha seyrek", "Hiç". Bu tarama soruları demografik formdan ayrı tutulur ve işe alım aşamasında sorulur.

| Grup | Tarama sorusu: "Son 12 ayda aşağıdakilerden birini ne sıklıkla kullandınız?" | Hedef (sık / orta / ilk kez) |
|------|------------------------------------------------------------------------------|------------------------------|
| K1 | Yörünge, efemeris ya da CBS aracı: STK, GMAT, SPICE, JPL Horizons, QGIS, ArcGIS, JMARS, LROC QuickMap | 2 / 2 / 1 |
| K2-T | Derste simülasyon ya da gökyüzü aracı: PhET, Stellarium, GeoGebra, EBA simülasyonları | 1 / 0 / 1 (yalnızca uçlar) |
| K2-S | Gökyüzü ya da planetaryum uygulaması (Stellarium, Star Walk, Sky Map) ya da okulda simülasyon | 1 / 1 / 1 |
| K3 | Gökyüzü ya da planetaryum uygulaması, Google Earth benzeri harita ya da küre | 1 / 2 / 2 |

### 9.4 Çeşitlilik hedefleri

Demografik formda cinsiyet maddesi yoktur. Bu nedenle cinsiyet, tarama aşamasında isteğe bağlı bir soruyla toplanır: "Kadın / Erkek / Kendim tanımlamak isterim / Belirtmek istemiyorum". Cevap yalnızca grup düzeyinde, toplu olarak raporlanır.

| Boyut | Hedef |
|-------|-------|
| Eğitim | K1'de en az 1 lisans ve 1 lisansüstü. K3'te en az 2 üniversite mezunu olmayan ve en az 1 STEM dışı alandan katılımcı. |
| Yaş | K3'te 18-24, 25-44 ve 45 yaş üstü aralıklarının her birinden en az 1 katılımcı. K2-T'de biri 10 yıla kadar, diğeri 10 yıldan fazla mesleki deneyimli öğretmen. |
| Cinsiyet | 5 kişilik her grupta (K2 için T ve S birlikte) tek bir cinsiyetten en fazla 3 katılımcı. Bu bir hedeftir, kota değildir. |

### 9.5 Bilinen sınırlılıklar

K2 alt grupları 5'in altındadır: K2-T 2, K2-S 3 kişidir. Alt gruba özgü sorunların beklenen kapsama oranı yaklaşık %52 ve %67'dir; bu alt gruplardan gelen bulgular keşif niteliğinde raporlanır. K2-T iki kişiyle üç deneyim seviyesini kapsayamaz. Varsayım: Gerçek görev planlamacılarına ulaşmak zordur. K1 çoğunlukla bu alanda çalışan lisansüstü öğrenci ve araştırmacılardan oluşur, profesyonel planlamacı sayısı azdır. Örneklem kolayda örneklemedir ve Türkiye ile sınırlıdır. Arayüz yalnızca İngilizce olduğu için İngilizce okuyamayan kullanıcılar dışarıda kalır.

### 9.6 Erişilebilirlik Oturumları (AT-01, AT-02)

Bu iki oturum 15 kişilik örnekleme eklenir. Amaçları sorun keşfi değil, belirli bulguları doğrulamaktır; bu nedenle sayı gerekçesindeki kapsama formülü bu oturumlara uygulanmaz.

| Kimlik | Profil | İşe alım kanalı | Kurulum |
|--------|--------|-----------------|---------|
| AT-01 | En az 1 yıldır günlük olarak yalnızca klavyeyle bilgisayar kullanan kişi (ör. motor engeli olan). Böyle biri bulunamazsa fare kullanmadan çalışmaya alışkın, deneyimli bir klavye kullanıcısı alınır ve kanıtın daha zayıf olduğu raporda belirtilir. | Üniversite engelli öğrenci birimi (TBD — hangi üniversitenin hangi biriminin başvurulacağı belirlenmedi) ve engelli hakları dernekleri | Katılımcının kendi bilgisayarı, tarayıcısı ve ayarları. Fare ve dokunmatik yüzey devre dışı bırakılır. |
| AT-02 | En az 1 yıldır günlük olarak ekran okuyucu kullanan, görme engelli kişi | Aynı birim ve görme engelliler dernekleri (TBD — iletişim kurulacak dernek ve şube seçilmedi) | Windows'ta NVDA (Chrome ya da Firefox ile) veya macOS'ta VoiceOver (Safari ile). Katılımcının kendi cihazı ve ayarları kullanılır. |

AT-02 için oturum öncesi kontrol yapılır. Ekran okuyucuda İngilizce okuyabilen bir ses yüklü olmalı ve otomatik dil değişimi açık olmalıdır; sayfa `lang="en"` bildirir. Oturum uzaktan yapılırsa ekran okuyucunun sesi ekran paylaşımına dahil edilir. Katılımcının kendi cihazı ve ayarları tercih edilir, çünkü alışık olunmayan bir kurulum yardımcı teknoloji becerisini ürün sorunlarıyla karıştırır. Bu, barındırılan bir sürüm gerektirir (bölüm 7.3.2, seçenek B); o onaylanmazsa oturum moderatör dizüstünde yapılır ve bu durum geçerlik sınırı olarak raporlanır. AT katılımcılarının görev seti bölüm 3.6'dadır. Tablodaki "rapor" atıfları heuristic değerlendirme raporuna (`docs/design/HEURISTIC_EVAL_lunar-landing-site-navigator.md`) aittir.

| Bulgu | Durum | Oturum | Gözlenecek nokta | Sonuç ölçütü |
|-------|-------|--------|------------------|--------------|
| HE-01 | Düzeltildi | AT-01, AT-02 | Plan > ANALYZE görünümünde sonuç sekmeleri arasında ok, Home ve End tuşlarıyla gezinme | Geçer: Katılımcı fare kullanmadan Power, Comms ve Compare sekmelerine ulaşır, odak yeni sekmeye taşınır. Odak taşıma birim testlerinde sınanmıyor, elle doğrulanması gerekiyor (rapor bölüm 6, HE-01 satırı). |
| HE-02 | Düzeltildi | AT-02 | Oynatma sırasında ve Pause'dan sonra geri sayım | Geçer, iki koşulun ikisi de sağlanırsa: (i) oynatma sırasında geri sayım satırları kendiliğinden okunmaz; (ii) katılımcı geri sayım değerlerine gezinerek ulaşıp okuyabilir. |
| HE-05 | Düzeltildi | AT-01, AT-02 | Oyunda Land, sonuç kartı ve "Try another date" | Geçer: Land'den sonra odak sonuç kartına gider ve sonuç okunur; "Try another date"den sonra odak Land düğmesine döner. Bu da elle doğrulama gerektirir (rapor bölüm 6, HE-05 satırı). |
| HE-07 | Açık, severity 2 | AT-02 | Explore'da saha seçildikten sonra değişen sonuç cümlesi | Severity doğrulanır ya da çürütülür (TH-3): Katılımcı sonucun değiştiğini fark ediyor mu? |
| HE-17 | Açık, severity 2 | AT-01, AT-02 | Kaynak penceresi içindeyken Escape | Odak `body`'ye düşüyor mu, katılımcı yönünü kaybediyor mu? |
| HE-26 | Açık, severity 2 | AT-01, AT-02 | Rehberli görevde "Check my guess" | Odak kayboluyor mu, cevap duyurulmuyor mu, katılımcı cevabı bulabiliyor mu? |
| HE-30 | Açık, severity 2 | AT-02 | "Link copied.", karşılaştırmaya ekleme, "Loading…", "Why?" kartı, oyunun tarih kaydırıcısı | Durum mesajları duyuruluyor mu? Kaydırıcı tarihi değil sıra numarasını mı okuyor? |

**Açık bulgular için karar kuralı.** Katılımcı yardımsız devam edemiyorsa severity 3'e yükseltilmesi önerilir. Sorunu fark edip yardımsız toparlanıyorsa severity 2 korunur. Sorunu fark etmiyor ve iş etkilenmiyorsa severity 1'e indirilmesi önerilir. Her oturum tek gözlemdir; bu nedenle sonuç kesin bir yeniden derecelendirme değil, bir öneri olarak raporlanır. İsteğe bağlı olarak HE-19 (harita işaretleri) da gözlenebilir: raporun "Sonraki Adımlar" bölümündeki 2. madde bu bulgunun ekran okuyucuyla denenmesini ister. Görev haritaya dokunursa not edilir.

## 10. Yürütme Adımları

Yürütme, ders protokolünün a-f adımlarını izler:

- a) Test amacının açıklanması ve Gönüllü Katılım Formu
- b) Demografik form
- c) Kısa sistem eğitimi
- d) Görevler: sesli düşünme, tamamlama oranı ve süre kaydı
- e) Post-test anketi ve SUS
- f) Açık uçlu kapanış görüşmesi

Onay metinleri bölüm 10.1'de, roller ve dakika bazında zamanlama bölüm 10.2'de, eğitim metni bölüm 10.3'tedir.

### 10.1 Etik ve Onay

Onay sırası şöyledir: kurum etik kurulu onayı, okul izni, veli onayı, öğrencinin sözlü onayı ve en son oturum. TBD — kurum etik kurulunun adı ve ders kapsamındaki bu çalışma için başvuru gerekip gerekmediği belirlenmedi. 18 yaş altı katılımcı ve okul ortamı bulunduğu için başvurunun gerekli olduğu varsayılır; muafiyet olup olmadığına kurul karar verir.

**(a) Gönüllü Katılım Formu**
```
GÖNÜLLÜ KATILIM FORMU - Lunar Landing Site Navigator Kullanılabilirlik Testi
1. Amaç: Bu çalışmada sizi değil, yazılımı değerlendiriyoruz. Ay'da iniş sahası ve tarihi incelemeye yarayan bir web uygulamasının ne kadar kolay kullanıldığını ölçüyoruz.
2. Ne yapacaksınız: Kısa bir form dolduracak, birkaç görevi düşüncelerinizi sesli söyleyerek yapacak, sonunda bir anket dolduracaksınız. Toplam süre, katıldığınız gruba göre 40 ile 60 dakika arasındadır.
3. Gönüllülük: Katılım gönüllüdür; ücret, not ya da başka bir karşılığı yoktur. Katılmamanın hiçbir sonucu olmaz.
4. Çekilme hakkı: İstediğiniz an, gerekçe göstermeden bırakabilirsiniz. Oturumdan sonra da <silme son tarihi> tarihine kadar katılımcı kodunuzu bildirerek verilerinizin silinmesini isteyebilirsiniz.
5. Kaydedilenler: Ekran görüntüsü ve sesiniz kaydedilir; yüzünüz kaydedilmez. Moderatör not alır. Form ve anket cevaplarınız saklanır.
6. Anonimleştirme: Verileriniz adınızla değil, katılımcı kodunuzla (ör. K3-02) saklanır. Raporlarda ad, okul ya da kurum adı geçmez; alıntılar yalnızca kodla verilir.
7. Risk ve fayda: Bilinen bir risk yoktur; yorulursanız ara verebilirsiniz. Size doğrudan bir faydası yoktur; bulgular uygulamayı iyileştirmek için kullanılır.
8. İletişim: <ekip iletişim adresi>; etik kurul: <kurul iletişim adresi>.
Okudum, anladım ve gönüllü olarak katılıyorum.  [ ] Ekran ve ses kaydına onay veriyorum.
[ ] (Yalnızca AT oturumları) Kullandığım yardımcı teknolojinin kaydedilmesine ayrıca açık rıza veriyorum.
Ad Soyad / İmza / Tarih: ................        Moderatör / İmza: ................
```

`<silme son tarihi>`, ad ile kod arasındaki eşleme listesinin imha edileceği tarihtir; liste imha edildikten sonra veriler kişiye bağlanamaz. TBD — ekip için ortak bir iletişim adresi açılmadı; forma kişisel adres yazılmaz.

**(b) Veli Onay Formu** (18 yaş altı öğrenciler için)
```
VELİ ONAY FORMU
(a) formundaki 1-8. maddeler çocuğunuz için de geçerlidir. Ek olarak:
9.  Oturum okulda, öğretmen gözetiminde yapılır.
10. Çocuğunuzun yalnızca sesi ve ekranı kaydedilir. Yüzü hiçbir koşulda kaydedilmez, fotoğrafı çekilmez.
11. Katılıp katılmamak çocuğunuzun notlarını etkilemez. Öğretmene çocuğunuzun cevapları ya da başarısı bildirilmez.
12. Siz onay verseniz bile çocuğunuz katılmak istemezse çalışmaya alınmaz.
Öğrencinin adı ve sınıfı: ..........   Velinin adı soyadı ve yakınlığı: ..........
[ ] Çocuğumun katılmasına onay veriyorum.   [ ] Ses ve ekran kaydına onay veriyorum.   İmza / Tarih: ..........
```

**(c) Öğrenci sözlü onayı** (moderatör okur): "Merhaba, ben <ad>. Ay hakkındaki bir bilgisayar programını deniyoruz. Burada sınanan sen değilsin, program. Doğru ya da yanlış cevap yok; zorlanırsan bu programın sorunudur. Senden birkaç küçük iş yapmanı ve bu sırada aklından geçenleri sesli söylemeni isteyeceğim. Yaklaşık 40 dakika sürecek. Ekranı ve sesini kaydedeceğiz, yüzünü kaydetmeyeceğiz. Adın hiçbir yere yazılmayacak. Katılmak zorunda değilsin; katılmazsan ya da yarıda bırakırsan kimse kızmaz, notun da etkilenmez. Durmak istersen 'durmak istiyorum' demen yeterli. Sormak istediğin bir şey var mı? Katılmak istiyor musun?" Moderatör cevabı ve saati oturum günlüğüne yazar; ikinci bir ekip üyesi buna tanık olur. Sessiz kalmak ya da tereddüt etmek "hayır" sayılır.

**(d) Okul izni.** TBD — Türkiye'de okullarda araştırma izninin güncel usulü ekipçe bir kaynaktan doğrulanmadı. İzni verecek makam büyük olasılıkla İl Milli Eğitim Müdürlüğüdür (devlet okulları için valilik onayı). Özel okullarda usul farklı olabilir; okul müdürlüğünün izni her durumda gerekir. Başvuruya etik kurul onayının, bu plandaki formların ve veli onay formunun eklenmesi beklenir; kesin usulü kurum etik kurulu teyit etmelidir. İzin süreci tarih planını belirler.

**(e) KVKK (6698) aydınlatma metni taslağı.** Aydınlatma metni ile açık rıza beyanı ayrı belgeler olarak sunulur.

| Öğe | İçerik |
|-----|--------|
| Veri sorumlusu | TBD — ders kapsamındaki bir çalışmada veri sorumlusunun kurum mu, dersi yürüten öğretim üyesi mi olduğunu kurumun KVKK birimi belirlemelidir. |
| Amaç | Yazılımın kullanılabilirliğini ölçmek ve iyileştirmek; ders raporunu hazırlamak. |
| Veri kategorileri | Kimlik (ad soyad, yalnızca onay formunda); iletişim (randevu için e-posta ya da telefon); demografik bilgi (eğitim, yaş, bilgisayar ve internet kullanım düzeyi; cinsiyet isteğe bağlı); ses ve ekran kaydı; görev performansı, gözlem notları, anket cevapları. |
| Özel nitelikli veri (md. 6) | Yalnızca AT-01 ve AT-02'de: Kullanılan yardımcı teknoloji bir engellilik durumunu ima eder ve sağlık verisi sayılır. Tanı ya da engel türü sorulmaz; yalnızca kullanılan araç ("NVDA", "yalnız klavye") kaydedilir. Bunun için ayrı açık rıza alınır. |
| Toplama yöntemi ve hukuki sebep | Form, kayıt ve gözlem yoluyla; açık rızaya dayanarak (md. 5/1). |
| Aktarım | Veriler üçüncü kişilere aktarılmaz; yalnızca anonim bulgular yayımlanır. TBD — uzaktan oturum aracı yurt dışındaki sunucuları kullanıyorsa md. 9 kapsamındaki aktarım koşulunu kurumun KVKK birimi doğrulamalıdır. |
| Saklama | Varsayım: Ham kayıtlar ve ad-kod eşleme listesi, analiz raporu teslim edildikten sonra en geç 30 gün içinde silinir; anonim veriler ders arşivinde kalır. TBD — onay formlarının saklama süresini etik kurul belirlemelidir. |
| Haklar (md. 11) | Verinin işlenip işlenmediğini öğrenme; bilgi talep etme; işleme amacını ve verinin bu amaca uygun kullanılıp kullanılmadığını öğrenme; aktarıldığı üçüncü kişileri bilme; düzeltme; silme ya da yok etme; bu işlemlerin aktarılan kişilere bildirilmesini isteme; yalnızca otomatik analizle ortaya çıkan aleyhe sonuca itiraz; zararın giderilmesini isteme. Başvuru veri sorumlusuna yapılır ve en geç 30 gün içinde cevaplanır (md. 13). |

**(f) Kayıt politikası**

| Konu | Kural |
|------|-------|
| Ne kaydedilir | Yalnızca ekran ve ses. 18 yaş altında yüz videosu hiçbir koşulda alınmaz. Veriyi en aza indirmek için yetişkinlerde de kamera kapalıdır. |
| Sınıf ortamı | Kulaklık ya da yaka mikrofonu kullanılır ve sınıfın sessiz bir köşesi seçilir; amaç başka öğrencilerin sesinin kayda girmemesidir. Fotoğraf çekilmez. |
| Uzaktan (K1, gerekirse AT) | Yalnızca paylaşılan ekran kaydedilir. Bulut kaydı kapalıdır, kayıt yerel alınır. Katılımcıdan bildirimleri ve ilgisiz pencereleri kapatması istenir. |
| Dosya adı | Katılımcı kodu ve tarih (ör. `K1-03_2026-xx-xx`); dosya adında ad geçmez. |
| Saklama | Şifreli disk (BitLocker ya da FileVault) ya da şifreli kap kullanılır; erişim yalnızca test ekibindedir; bulut senkronizasyonu kapalıdır. Onay formları ve ad-kod listesi verilerden ayrı saklanır; kağıt formlar kilitli dolapta durur. |
| Depo | Ham veri hiçbir zaman Git deposuna eklenmez (`.omc/` dahil). Depoya yalnızca anonim özetler girer. |
| Transkript | Ad, okul, kurum ve yer adları çıkarılır; alıntılar yalnızca kodla verilir. |
| Silme | Silme, KVKK aydınlatma metnindeki saklama süresine göre yapılır. Çekilen katılımcının verisi 7 gün içinde silinir. Silme tarihi ve yöntemi oturum günlüğüne yazılır. |

### 10.2 Roller, Sesli Düşünme ve Zamanlama

Roller. **Moderatör:** yönergeyi okur, görev kartını verir, sesli düşünmeyi hatırlatır, yardım düzeyini (bölüm 11) uygular; doğru ya da yanlış yorumu yapmaz. **Gözlemci:** süre, sonuç, hata, kritik olay ve alıntıları gözlem formuna yazar; katılımcıyla konuşmaz. **Teknik sorumlu:** Varsayım: K2 ve AT oturumlarında ayrı kişidir; sunucu, kayıt ve yedek planı yürütür, diğer oturumlarda bu işi gözlemci üstlenir.

Sesli düşünme yönergesi (c adımında okunur ve bir alıştırma göreviyle denenir): "Görevleri yaparken aklınızdan geçenleri sesli söylemenizi istiyoruz: neye baktığınızı, ne aradığınızı, ne beklediğinizi ve sizi şaşırtan şeyleri. Test edilen siz değilsiniz, uygulamadır; yanlış cevap yoktur. Görev sırasında sorularınızı yanıtlamayabilirim, görev bitince konuşabiliriz. Bitirdiğinizi düşündüğünüzde 'bitti' deyin." Katılımcı 10-15 saniye sessiz kalırsa moderatör yalnız "Ne düşünüyorsunuz?" ya da "Sesli düşünmeye devam edin" der; yönlendirici soru sorulmaz.

| Adım | İçerik | K1 (60 dk) | Öğretmen (50 dk) | Öğrenci (40 dk) | K3 (38 dk) | AT (45 dk) |
|---|---|---|---|---|---|---|
| a | Amacın açıklanması, kayıt izni, Gönüllü Katılım Formu | 0-4 | 0-3 | 0-3 | 0-3 | 0-4 |
| b | Demografik form | 4-7 | 3-6 | 3-5 | 3-6 | 4-7 |
| c | Kısa eğitim ve sesli düşünme alıştırması | 7-12 | 6-10 | 5-8 | 6-9 | 7-15 |
| d | Görevler: sesli düşünme; tamamlama ve süre kaydı | 12-47 | 10-38 | 8-29 | 9-28 | 15-35 |
| e | Post-test anket ve SUS | 47-54 | 38-45 | 29-35 | 28-34 | 35-41 |
| f | Açık kapanış görüşmesi | 54-60 | 45-50 | 35-40 | 34-38 | 41-45 |

Görev bloğu (d), görev tablolarındaki süre üst sınırlarının toplamıdır: K1 35 dk, öğretmen 28 dk, öğrenci 21 dk, K3 19 dk, AT 20 dk. Görevler çoğunlukla bu sınırlardan kısa sürer; artan süre kapanış görüşmesine kalır.

- a) K1 formu oturumdan önce elektronik imzalar, onayını kayıt başında sözlü olarak yineler. K2 öğrencileri için veli onayı, öğrencinin kendi rızası ve okul idaresi izni oturumdan önce alınır; öğrenciye istediği an bırakabileceği söylenir.
- c) Eğitim, bölüm 10.3'teki sabit metnin okunmasıdır; ekranda hiçbir öğe gösterilmez ya da işaret edilmez, hiçbir görevin çözüm yolu verilmez. AT oturumlarında katılımcı kendi klavye ve ekran okuyucu ayarlarını bu adımda yapar.
- d, e) Görev kartı basılı verilir ve moderatör tarafından okunur. AT-02'de görev kartı yalnız sesli okunur; anket ve SUS sesli okunur ya da ekran okuyucu uyumlu formla doldurulur.

### 10.3 Kısa Sistem Eğitimi

**Kurallar.** Metin sabittir ve okunarak verilir; 2 dakikayı aşmaz (ortak metin ve ek cümle birlikte yaklaşık 90 kelime, okuma süresi 1 dakikanın altında). Ekranda uygulamanın açılış görünümü durur; moderatör hiçbir öğeyi göstermez, işaret etmez, tıklamaz. Şunlar eğitimde anılmaz, çünkü görevlerde gözlenecek noktalardır: kapı, sekme, düğme ve panel adları; geçerlilik etiketleri, örnek veri notları ve kaynak bilgisi (TH-4 ve HE-17); "Why?" açıklamaları ve yardım (HE-30); görev cevaplarına dair her türlü ipucu.

**Ortak metin:** "Bu uygulama, Ay'da özellikle güney kutbu çevresinde iniş için düşünülen noktaları incelemek için yapıldı. Bir nokta ve bir tarih seçildiğinde, o noktada duran biri için Güneş'in ve Dünya'nın ufka göre nerede olacağını hesaplar. Güneş'in görünüp görünmemesi aracın elektrik üretimini, Dünya'nın görünüp görünmemesi Dünya ile iletişimi etkiler. Arayüz İngilizcedir. Uygulamanın nasıl kullanıldığını göstermeyeceğim; bunu bulmak testin bir parçası. Görev sırasında sorularınızı not alacağım, cevaplarını oturumun sonunda vereceğim."

| Grup | Ortak metne eklenen tek cümle |
|------|-------------------------------|
| K1 | "Bugün aracı, iniş tarihi ya da sahası değiştiğinde güç ve iletişim açısından neyin değiştiğini anlamak isteyen bir planlamacı gözüyle kullanacaksınız." |
| K2-T | "Bugün aracı, bu konuyu derste anlatmak isteyen bir öğretmen gözüyle kullanacaksınız." |
| K2-S | Metin "sen" diliyle okunur; ek cümle: "Bugün aracı, Ay'da bir yerde durmanın nasıl bir şey olduğunu merak eden biri gibi kullanacaksın." |
| K3, AT | "Bugün aracı, Ay'da bir yerde durmanın nasıl bir şey olduğunu merak eden biri gözüyle kullanacaksınız." |

## 11. Metrikler

| ID | Metrik | Tanım ve hesaplama | Hedef |
|---|---|---|---|
| M-01 | Görev tamamlama oranı | Kitle ve görev başına: yardımsız başarılı / (denenen − kesinti) x 100. "Yardımla" sonuçları ayrı sütunda raporlanır | ≥ %80 (yalnız yardımsız başarı) |
| M-02 | Görev süresi | Yardımsız başarılı denemelerde, kesinti süresi düşülerek saniye; kitle ve görev başına medyan ve aralık | Ders hedefi yoktur. Varsayım: hazırlıkta ölçülen ekip üyesi süresinin 3 katını aşmaması |
| M-03 | Hata sayısı | Görev başına sayılan hatalar; katılımcı başına görev ortalaması | < 2. Varsayım: dersin "kullanıcı başına < 2" hedefi görev başına uygulanır, çünkü oturum toplamı görev sayısıyla büyür |
| M-04 | SUS | Brooke (1996) puanı, 0-100; kitle başına ortalama ve medyan | ≥ 68 |
| M-05 | Post-test memnuniyet | Post-test anketinin 1-11. sorularının bölüm 6'daki puan yönüyle hesaplanan ortalaması (1-3) | > 2 |
| M-06 | AT görev başarısı | AT-01 ve AT-02'de yardımcı teknolojiyle yardımsız tamamlanan görev / denenen görev; görevi engelleyen adım ayrıca kaydedilir | Varsayım: ≥ %80; temel bir görevi engelleyen her adım en az severity 3 (heuristic raporu, bölüm 2) |

| Sonuç | Kural |
|---|---|
| Başarılı | Başarı ölçütü karşılandı; yardım düzeyi 0 ya da 1 |
| Yardımla | Düzey 2 ipucundan sonra tamamlandı; M-01'de başarı sayılmaz, ayrıca raporlanır |
| Başarısız | Düzey 3 müdahale, vazgeçme, süre üst sınırının aşılması ya da yanlış cevapla "bitti" denmesi |
| Kesinti | Dış olay ya da teknik arıza; paydaya girmez, tekrar yeni deneme sayılır |

- Yardım düzeyleri: 0 sesli düşünme hatırlatması; 1 görev kartının yeniden okunması; 2 ekran bölgesine ya da kavrama işaret eden ipucu; 3 moderatörün adımı söylemesi ya da yapması.
- Hata: görev hedefinden uzaklaştıran ve düzeltme gerektiren eylem. Örnekler: yanlış kapı, panel ya da sekmeye gidip geri dönme; yanlış saha, tarih ya da direk girme; bir değeri yanlış okuyup yanlış sonuca varma. Aynı yanlış eylemin ardışık tekrarı tek hata sayılır. Görev yolunu bozmayan keşif ve kendiliğinden hemen düzeltilen kayma tıklaması hata değildir.
- Süre: başlangıç, moderatörün görev kartını okumayı bitirip "Başlayabilirsiniz" dediği andır; bitiş, katılımcının "bitti" demesi, vazgeçmesi ya da üst sınırdır. Varsayım: üst sınır görev başına 5 dakika (öğrenci 4 dakika); görev yazarı başka sınır verirse o geçerlidir.
- Küçük gruplar (öğretmen n=2, öğrenci n=3, AT n=1) için yüzde yerine n/N ve betimsel sonuç verilir; genellenebilir oran iddia edilmez.

### 11.1 Gözlem Formu Şablonu

Başlık: Katılımcı ID | Kitle | Oturum haftası | Moderatör | Gözlemci | Veri modu (canlı / örnek) | Commit | Ortam ve kesinti notu

| Görev ID | Başladı (ss:dd:sn) | Bitti (ss:dd:sn) | Süre (sn) | Sonuç (başarılı / yardımla / başarısız / kesinti) | Yardım düzeyi (0-3) | Hata sayısı | Kritik olay notu | Sesli düşünme alıntısı | İlgili HE / UT |
|---|---|---|---|---|---|---|---|---|---|
| T-..-01 | | | | | | | | | |
| T-..-02 | | | | | | | | | |

## 12. Çıktı ve Raporlama

- Rapor dosyası: `docs/design/USABILITY_RESULTS_lunar-landing-site-navigator.md`.
- Severity: heuristic raporuyla aynı Nielsen 0-4 skalası ve etiketleri (0 Sorun değil, 1 Cosmetic, 2 Minor, 3 Major, 4 Catastrophic). Varsayım: iki ekip üyesi bağımsız puanlar, fark uzlaşmayla kapatılır; sıklık (kaç katılımcı), etki (görev başarısızlığı) ve kalıcılık dikkate alınır.
- Eşleme: her gözlenen sorun, aynı konum ve nedene sahipse mevcut bir HE kimliğine bağlanır; değilse yeni kimlik alır (UT-01, UT-02, ...). Her bulgu satırı: kimlik, görev ID, katılımcı sayısı, konum, severity, kanıt (alıntı, zaman damgası), öneri.

| HE sonucu | Kural |
|---|---|
| Doğrulandı | Yolu deneyen en az bir katılımcı sorunu yaşadı |
| Gözlenmedi | Yolu deneyen katılımcıların hiçbiri sorunu yaşamadı. Küçük örneklem nedeniyle bu, bulgunun çürütüldüğü anlamına gelmez; yalnız ağırlığını düşürür |
| Test edilmedi | Hiçbir görev o yola dokunmadı |
| Düzeltme tuttu / tutmadı | HE-01..HE-05 için; bu bulgular test öncesinde düzeltildi, test düzeltmenin geçerliğini ölçer |

- AT hedefleri: AT-02, heuristic raporunun bölüm 8'inde ekran okuyucuyla doğrulanması istenen HE-02, HE-05, HE-19, HE-26 ve HE-30'u sınar. AT-01, elle doğrulanması istenen HE-01 klavye gezinmesini ve HE-05 odak taşınmasını sınar.
- Rapor bölümleri: özet; katılımcılar; M-01..M-06 sonuçlarının hedeflerle karşılaştırması; bulgu tablosu (UT ve HE); HE sonuç tablosu; öncelikli öneriler; sınırlar (doğal ortam, küçük n, uzaktan kontrol gecikmesi, örnek moda geçişler, doğrulanmamış SUS çevirisi).

### 12.1 Takvim

| Hafta | İş | Çıktı | Tarih |
|---|---|---|---|
| Hafta 1 | Hazırlık: görev kartları, başlangıç adresleri, kapsam dışı görevlerin beklenen cevaplarının canlı sunucudan kaydı, formlar, kontrol listesi; etik onay başvurusu; okul idaresi izni ve veli onay formları | Onay başvuruları, hazır materyal | TBD — onay mercii (ders hocası ya da etik kurul) ve izin süreleri teyit edilmedi |
| Hafta 2 | Pilot 1, revizyon, Pilot 2, revizyon ve protokolün dondurulması | Revize protokol, taban commit | TBD — pilot katılımcılarının uygunluğu bilinmiyor |
| Hafta 3 | K1 oturumları (K1-01..05) | 5 gözlem formu ve kayıt | TBD — planlamacıların takvimi bilinmiyor |
| Hafta 3 | K2 sınıf oturumu: öğretmenler (K2-T1..T2) ve öğrenciler (K2-S1..S3) | 5 gözlem formu ve kayıt | TBD — okulun ders programı ve izin tarihi bilinmiyor |
| Hafta 4 | K3 oturumları (K3-01..05) | 5 gözlem formu ve kayıt | TBD — katılımcı bulma süresi bilinmiyor |
| Hafta 4 | AT oturumları (AT-01, AT-02) | 2 gözlem formu ve kayıt | TBD — yardımcı teknoloji kullanıcılarına erişim belirsiz; B seçeneğinin kararına bağlı |
| Hafta 5 | Analiz: metrik hesabı, bulgu birleştirme, severity oylaması | Metrik tabloları, bulgu listesi | TBD — son oturumun haftasına bağlı |
| Hafta 6 | Rapor | `USABILITY_RESULTS` belgesi | TBD — analiz bitişine bağlı |

### 12.2 Hazırlık Sırasında Saptanan Aday Sorunlar

Aşağıdaki sorunlar heuristic değerlendirmede yoktu. Plan hazırlanırken kod ve kayıt dosyaları okunurken saptandı. "Kodla doğrulandı" satırlarında ilgili kod satırı okunmuştur; "okumayla saptandı" satırları pilotta çalışan uygulamada doğrulanır. Severity değerleri adaydır; sonuç raporunda doğrulanan sorunlar UT kimliği alır, doğrulanmayanlar çıkarılır.

| ID | Gözlem | Konum | Aday severity | Doğrulama | İlgili görev |
|----|--------|-------|---------------|-----------|--------------|
| HZ-01 | Açılış ekranından sonra varsayılan görünüm Plan kapısıdır; ilk kez gelen ziyaretçi mühendis görünümüyle karşılaşır. | `frontend/src/shell/ui-state.ts:18` (`DEFAULT_DOOR = 'plan'`) | 2 | Kodla doğrulandı | T-H01 |
| HZ-02 | Rol sayfalarındaki "Open the live …" bağlantısı `data` parametresini taşımaz. Canlı modda çalışan kullanıcı örnek moda ve açılış ekranına düşer. | `frontend/src/roles/route.ts:39` (`liveHref`), `frontend/src/roles/parts.tsx:105` | 2 | Kodla doğrulandı (`roles.test.tsx:33-35` bağlantıyı `/?door=explore` olarak bekler) | T-E02, T-H05 |
| HZ-03 | Rehberli görevler ve geçmiş görev vakaları 0 m direkle açılır. Bu kasıtlıdır: doğrulanmış örnek cevapların ve referans açıların koşuludur (`tasks.ts:40`, `missions.ts:40`, `gecmis-gorev-vakalari.md` bölüm 4). Kayıtlar ise 2 m içindir. Rehberli görevlerde tablo çoğunlukla doğrulanmış 0 m örnek cevaplarıyla dolar; eşleşmeyen satırlar açık bir notla "—" gösterir. Gökyüzü şeridi ve geri sayım etiketli genel örneğe düşer. Geçmiş görev vakalarında ise hiçbir panel kayıtla eşleşmez: zaman şeridi "No sunlit or dark windows in the response" der ve görev kartı örnek modda da "product's own result" cümlesini gösterir. | `frontend/src/features/tasks/tasks.ts:52`, `frontend/src/features/missions/missions.ts:50`, `frontend/src/features/missions/index.tsx:75` | 3 | Kodla doğrulandı (#159 incelemesi). İlk yazımda rehberli görevlerin satırlarının çoğunun boş olduğu söylenmişti; bu yanlıştı | T-S01, T-P07 |
| HZ-04 | Senaryo yokken saha seçmek bugünden başlayan bir senaryo kurar; örnek modda bu dönem kayıtlı kapsamın dışındadır. | `frontend/src/shell/doors/site-pick.ts:24-36` (`todayUtc`) | 2 | Kodla doğrulandı | T-H01, T-E01 |
| HZ-05 | Örnek modda zaman kaydırılınca anlık değerler ve geri sayım 0 m düz ufuklu genel örneğe düşer. Dünya'nın dönüşü kayıttaki `2026-12-09 12:35 UTC` yerine `2026-12-11 04:41 UTC` olarak görünür. | `data/examples/now.json`, `data/examples/comm-window.json` | 2 | Okumayla saptandı | T-P02, T-H02 |
| HZ-06 | Örnek modda kaydı olmayan karşılaştırma sütunu yalnız "—" gösterir; sütunda neden yazmaz. | `frontend/src/features/compare/` | 2 | Okumayla saptandı | T-P02 |
| HZ-07 | Aynı senaryonun en uzun karanlık süresi Power sekmesinde 330.0 h, karşılaştırma tablosunda ve `#/engineer` sayfasında 330.5 h görünür. | `data/examples/recorded/mons-mouton-im2-target/power.json` (330.0), `events.json` (330.46) | 1 | Okumayla saptandı | T-P01 |
| HZ-08 | Paylaşılan bağlantı PLAN modunda açılır, karşılaştırma ANALYZE modunun sekmesinde kalır; çünkü mod adreste tutulmaz. | `frontend/src/shell/ui-state.ts:68-73` | 2 | Kodla doğrulandı | T-P04 |
| HZ-09 | Classroom kapısında bağlantı kopyalama denetimi yoktur; paylaşım adres çubuğundan yapılır. | Classroom paneli | 2 | Okumayla saptandı | T-E04 |
| HZ-10 | Gökyüzü şeridinin dikey ölçeği senaryoya göre yeniden ayarlanır. Bu yüzden 88° ve 6,5° yolları çizimde benzer yükseklikte görünebilir ve fark yalnız eksen etiketlerinden okunur (HE-24 ile ilişkili). | `frontend/src/features/sky/geometry.ts` (`elevationDomain`) | 2 | Okumayla saptandı | T-E03 |

## Kaynakça

- Albert, W., Tullis, T. ve Tedesco, D. (2010). *Beyond the Usability Lab: Conducting Large-scale Online User Experience Studies*. Morgan Kaufmann.
- Brooke, J. (1996). SUS: A "quick and dirty" usability scale. P. W. Jordan vd. (Ed.), *Usability Evaluation in Industry* içinde (s. 189-194). Taylor & Francis.
- Brush, A. J. B., Ames, M. ve Davis, J. (2004); Tullis, T. vd. (2002); Hertzum, M. (1999). Laboratuvar ve doğal ortam testlerinin karşılaştırması; ders slaytında anılan biçimiyle. Tam künyeler yayın kayıtlarından teyit edilmelidir.
- Nielsen, J. (1993). *Usability Engineering*. Academic Press.
- SENG 477 ders notları, hafta 4-6: kullanılabilirlik testi protokolü, formlar ve pilot test kontrol listesi.

Ayrıca: Nielsen, J. ve Landauer, T. K. (1993). A mathematical model of the finding of usability problems. *INTERCHI '93*, 206-213. Spool, J. ve Schroeder, W. (2001). Testing web sites: Five users is nowhere near enough. *CHI '01 Extended Abstracts*, 285-286. Virzi, R. A. (1990). Streamlining the design process: Running fewer subjects. *Proceedings of the Human Factors Society 34th Annual Meeting*. Virzi, R. A. (1992). Refining the test phase of usability evaluation: How many subjects is enough? *Human Factors*, 34(4), 457-468. 6698 sayılı Kişisel Verilerin Korunması Kanunu, md. 5, 6, 9, 10, 11 ve 13.

## 13. Bilinen Boşluklar

| # | Boşluk | Neden açık | Önerilen çözüm |
|---|--------|------------|----------------|
| 1 | Etik kurulun adı ve bu çalışma için başvuru gerekip gerekmediği | Ders kapsamındaki çalışmalar için kurum kuralı depoda yok; 18 yaş altı katılımcı ve okul ortamı nedeniyle başvuru gerekli varsayıldı | Dersi yürüten öğretim üyesine ve kurum etik kuruluna sorulur (Hafta 1) |
| 2 | Okulda araştırma izninin usulü | Güncel usul bir kaynaktan doğrulanmadı; olası makam İl Milli Eğitim Müdürlüğü | Etik kurul ve okul idaresiyle teyit edilir (bölüm 10.1 d) |
| 3 | KVKK veri sorumlusu, yurt dışı aktarım, onay formlarının saklama süresi | Kurumun KVKK birimi henüz görüşülmedi | KVKK birimine sorulur; uzaktan görüşme aracı seçilirken sunucu konumu kontrol edilir |
| 4 | Formlar için ekip ortak iletişim adresi | Ortak adres açılmadı; forma kişisel adres yazılmaz | Ekip ortak bir adres açar |
| 5 | İşe alım kanalları (TUA ve TÜBİTAK UZAY iletişimi, üniversite engelli birimi, görme engelliler derneği) | Kurumlarla temas kurulmadı | Hafta 1'de iletişime geçilir; K1 için önce üniversite ve öğrenci takımları denenir |
| 6 | Barındırılan örnek mod derlemesi (bölüm 7.3.2, seçenek B) | Barındırma yeri ve ekip onayı yok; barındırılan sürüm yayın sayılır | Ekip karar verir. Karar AT katılımcılarının kendi cihazını kullanmasını ve HE-04'ün kullanıcıyla sınanmasını belirler |
| 7 | Doğrulanmış Türkçe SUS çevirisi | Birincil kaynaktan teyit edilmedi; çalışma çevirisi kullanılıyor | Literatürden geçerlik çalışması yapılmış çeviri bulunur; bulunamazsa sınır olarak raporlanır |
| 8 | Takvim tarihleri | Onay süreleri, okul programı ve katılımcı uygunluğu bilinmiyor | Etik onaydan sonra bölüm 12.1'deki haftalar tarihe bağlanır |
| 9 | Kapsam dışı görevlerin beklenen cevapları (T-P05 sıralaması, rehberli görevlerin 0 m değerleri) | Kayıtlı kapsamda bu istekler yok | Hafta 1'de canlı sunucudan alınıp görev kartlarına işlenir |
| 10 | Başlangıç adreslerinin tam dizgisi (U1, U3, A3-A5, URL-A) ve hazır soru kartının paylaşılan adresle geri gelmesi | Adresler uygulamanın kopyalama çıktısıyla üretilmedi; kartın geri gelmesi denenmedi | Pilottan önce üretilir ve ikinci sekmede denenir |
| 11 | K2 alt grupları 5'in altında (2 öğretmen, 3 öğrenci) | Kullanıcı toplam 15 katılımcı ve kitle başına 5 kişi kararı verdi | Bulgular keşif niteliğinde raporlanır; kaynak bulunursa 5 + 5'e çıkarılır |
| 12 | Sık, orta ve ilk kez kullanıcı karışımı vekil ölçütle kuruluyor | Uygulama yeni; kimse onu sık kullanmadı | Benzer araç kullanım sıklığı ölçütü kullanılır (bölüm 9.3); sınır olarak raporlanır |
| 13 | Arayüz yalnız İngilizce | Türkçe arayüz yok; İngilizce okuma dahil etme ölçütü yapıldı | Post-test 4. soru sınırlı yorumlanır; ekran metnini açıklamanın ipucu sayılıp sayılmayacağı pilotta kararlaştırılır |
| 14 | Oyun kayıtlarının farklı bir sunucu commit'inden (`001efd1`) gelmesi | Oyun cevapları ayrı kaydedildi | Pilottan önce sınır çifti (2026-12-11 ve 2026-12-12) canlı modda denenir (bölüm 3.5) |
| 15 | İki puanlayıcı arasında kabul edilecek uyum eşiği (T-E03, T-H02, T-S03 rubrikleri) | Eşik belirlenmedi | Pilotta iki puanlayıcı bağımsız puanlar; eşik ve uzlaşma kuralı pilottan sonra yazılır |
| 16 | HE-04 canlı oturumda kullanıcıyla sınanamaz; HE-02 yalnız tek bir ekran okuyucu kullanıcısıyla sınanır | Not yalnız örnek modda görünür; AT örneklemi bir kişidir | HE-04 pilotta ekip tarafından kontrol edilir; HE-02 sonucu betimsel raporlanır |
