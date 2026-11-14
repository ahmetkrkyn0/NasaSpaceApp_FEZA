# Ephemeris, Dönüş Açıları ve Yer İstasyonları

"Efemerisin (veri inceleme) yanında dönüş açıları da lazım + Space agency konumu dünya üzerinde" araştırma başlığı kapsamında hazırlanan çıktılar: iniş bölgesinden Güneş ve Dünya'nın azimut/yükseklik açıları, araç yönelim (dönüş) açıları ve Dünya üzerindeki yer istasyonlarının Ay'ı görünürlüğü.

## Dosyalar

| Dosya | İçerik | Orijinal ad |
|---|---|---|
| [ephemeris-donus-acilari-yer-istasyonlari-arastirma.pdf](ephemeris-donus-acilari-yer-istasyonlari-arastirma.pdf) | Araştırma raporu | `Lunar Landing Site Navigator — Ephemeris, Dönüş Açıları ve Yer İstasyonları Araş.pdf` |
| [ay-geometri-katmani-ekip-sunumu.pptx](ay-geometri-katmani-ekip-sunumu.pptx) | Ay geometri katmanı ekip sunumu | `Ay-Geometri-Katmani-Ekip-Sunumu.pptx` |
| [lunar-navigator-hesaplar.zip](lunar-navigator-hesaplar.zip) | Hesap betikleri ve örnek veriler | `lunar_navigator_hesaplar.zip` |

Dosyalar içerikleri değiştirilmeden kopyalandı; yalnızca adları repo kuralına (ASCII, kebab-case) uyarlandı.

## Zip içeriği

| Yol | Açıklama |
|---|---|
| `code/lunarAzEl.mjs` | Tarayıcıda astronomy-engine ile Ay yüzeyindeki bir noktadan Güneş/Dünya az/el hesabı |
| `code/site_azel_spice.py` | Aynı hesabın SpiceyPy ve NAIF kernel'leri ile referans sürümü |
| `data/hz_*.txt`, `data/vec_*.txt` | JPL Horizons çıktıları (topocentric açılar, alt noktalar, ICRF vektörleri) |
| `scripts/crosscheck.py` | Üç bağımsız yöntemle az/el çapraz doğrulaması |
| `scripts/crossings.py` | Güneş ve Dünya doğuş/batış anları |
| `scripts/dsn_coverage.py` | DSN, ESTRACK, JAXA ve ISRO istasyonlarının Ay'ı görünürlük boşluk analizi |
| `scripts/dsn_handover.py` | İstasyonlar arası devir ve kapsama boşlukları |
| `scripts/f1_check.py` | Eğim, bakı ve yön açılarından araç gövde dönüş matrisinin doğrulaması |
| `crosscheck_out.csv` | Çapraz doğrulama çıktısı |

> Not: Zip içindeki kod SpiceyPy, NumPy ve astronomy-engine kullanır. Bu bağımlılıklar ekip tarafından henüz stack'e alınmadı; kod referans amaçlıdır.

## Doğrulama notları (14 Kasım 2026)

Rapor, sunum ve zip dosyası değiştirilmedi. Kaynak doğrulamasında bulunan düzeltmeler aşağıda; tam tablo [dogrulama/efemeris-ve-yer-istasyonlari.md](../dogrulama/efemeris-ve-yer-istasyonlari.md) dosyasında.

| Yer | Raporda yazan | Doğrusu |
|---|---|---|
| `code/site_azel_spice.py` | `str2et("2026-12-01T00:00:00 UTC")` | Bu yazım SPICE'ta `SPICE(UNPARSEDTIME)` hatası veriyor. Sondaki ` UTC` kaldırılınca betik çalışıyor ve 61 adımda Horizons ile farkı 0,001 yay dakikasından küçük. |
| Özet 4, kütüphane tablosu, sunum | Üç yöntem arasında "≤0.1′ uyum" | Yalnızca yükseklik açısı için. Azimut farkı 0,17′ ile 0,36′ arasında. |
| Özet 1, risk 4, sunum | PA/ME karışıklığı sahayı ~875 m (~0,9 km) kaydırır | 875 m üst sınır. Test sahasında kayma 0,69 km. |
| Özet 5 | Aralık 2026'nın ~%27'sinde (3–11 Aralık) Dünya ufkun altında | Yüzde 27,7'nin bir kısmı 30–31 Aralık'tan geliyor. Yalnızca 3–11 Aralık yüzde 25,9. |
| Özet 9 | DSN'de "günde 26 dk" boşluk | Bu değer −28,5° deklinasyon için. Raporun test ayında (Aralık 2026, −27,6°) değer 16,3 dk. |
| Özet 9 | "10° maskeyle ≤ −10°'den itibaren günlük boşluk" | Aynı modelle taranan her deklinasyonda boşluk var (en az 1,3 dk). −10° değeri taramanın üst sınırı. |
| B3, B5, F3 | Dünya diskinin dönüklüğü için quantity 17 sorgusu (COMMAND=301, CENTER=500@399) | Bu sorgu Ay'ın kutup açısını verir. Dünya diski için hedef 399, gözlemci `coord@301` olmalı. |
| Özet 1 | DE421 ME ile DE440 ME farkı "≤0.5 m" | Kernel açıklamasına göre yaklaşık 53,4 cm. |

Doğrulanan başlıca sonuçlar: önerilen kernel seti NAIF sunucusunda mevcut; `data/hz_*.txt` dosyaları gerçek Horizons çıktısı (61 satırda fark sıfır); `crosscheck.py`, `dsn_coverage.py` ve `f1_check.py` yeniden çalıştırıldı ve rapordaki tablolarla aynı sonucu verdi.
