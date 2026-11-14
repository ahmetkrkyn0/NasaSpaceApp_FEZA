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
