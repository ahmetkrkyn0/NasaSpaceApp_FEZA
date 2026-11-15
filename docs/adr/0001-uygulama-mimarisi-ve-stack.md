# ADR-0001: Uygulama mimarisi ve stack

- **Status:** Accepted
- **Date:** 2026-11-14
- **Related:** [frontend-migrate/DESIGN.md](../../frontend-migrate/DESIGN.md), [docs/research/ANALIZ-OZETI.md](../research/ANALIZ-OZETI.md) (bölüm 8 ve 10), [docs/design/gosterim-ve-arayuz.md](../design/gosterim-ve-arayuz.md), [docs/design/veri-kaynaklari-ve-on-hesap.md](../design/veri-kaynaklari-ve-on-hesap.md)

## Context

`AGENTS.md` stack'in henüz belirlenmediğini söylüyor. Araştırma notları üç ayrı yön öneriyordu: Unreal Engine ile simülasyon, Unity ya da Unreal ile 3B sahne, Python ile ön hesap ve tarayıcıda arayüz ([ANALIZ-OZETI.md, bölüm 8](../research/ANALIZ-OZETI.md)).

14 Kasım 2026'da şu kararlar verildi:

- Arayüz için `frontend-migrate/DESIGN.md` belgesindeki tasarım esas alınacak.
- Rover simülasyonu kapsamdan çıkarıldı ([ANALIZ-OZETI.md, bölüm 7.5](../research/ANALIZ-OZETI.md)).
- 3B arazi görünümünü bir ekip üyesi Unreal Engine ile ayrı olarak geliştiriyor; web arayüzüyle birleştirme daha sonra yapılacak.
- Bu taslaktaki stack önerisi onaylandı.

Tasarım belgesi yalnızca tarayıcı arayüzünü kapsıyor ve arayüzün "herhangi bir teknolojiyle" yeniden kurulabileceğini söylüyor ([DESIGN.md, giriş ve 0.1](../../frontend-migrate/DESIGN.md)). Referans uygulamanın teknolojisi bilgi amaçlı verilmiş: React 18.2, TypeScript 5.3, Vite 5, three.js r183; yönlendirici, CSS çatısı ve bileşen kitaplığı yok ([DESIGN.md, 0.1](../../frontend-migrate/DESIGN.md)). Referans arayüz bütün veriyi aynı kökten `/api` altındaki bir FastAPI servisinden alıyor ([DESIGN.md, 0.4 ve 6](../../frontend-migrate/DESIGN.md)).

Kalan süre kısa (teslim 15 Kasım 2026, 23:59; [project-submission-guide.pdf](../challenge/project-submission-guide.pdf)). Dört kişinin paralel çalışabilmesi için arayüz ile hesap arasındaki sınırın bugün çizilmesi gerekiyor.

## Decision

1. **Web arayüzü:** `frontend-migrate/DESIGN.md` içindeki tasarım bu depoda yeniden kurulur. Teknoloji referans uygulamayla aynıdır: React, TypeScript ve Vite. Görsel değerler (renk, yazı tipi, hareket) `frontend-migrate/design-export/` altındaki dosyalardan alınır. Web arayüzünün kapsamı: saha ve tarih seçimi, 2B harita, ufuk şeridi, zaman çizelgesi, güç ve iletişim panelleri, karşılaştırma.
2. **3B arazi görünümü:** Web arayüzünün ilk sürümünde yoktur. Unreal Engine ile ayrı olarak geliştirilir ve sonra birleştirilir. Birleştirme yöntemi açık karardır; 3B görünümün de aynı sunucudan ve aynı veri sözleşmesinden beslenmesi önerilir ki Güneş ve Dünya iki görünümde aynı yerde dursun ([ADR-0003](0003-veri-sozlesmesi.md), [ADR-0004](0004-api-uc-noktalari.md)).
3. **Sunucu:** Python ile yazılmış bir FastAPI servisi. Arayüz bütün çağrıları aynı kökten `/api` altına yapar. Uç noktalar [ADR-0004](0004-api-uc-noktalari.md) içinde.
4. **Hesap:** Bütün gök mekaniği ve arazi hesabı sunucu tarafında, Python ile yapılır. Güneş ve Dünya konumu için NASA'nın SPICE kütüphanesi (SpiceyPy üzerinden), dizi hesabı için NumPy, yükseklik haritalarını okumak için rasterio kullanılır.
5. **Ön hesap:** Hazır saha listesindeki her saha için arazi ufku bir kez hesaplanır ve küçük bir dosya olarak depoya konur. Kullanıcının girdiği özel koordinatlarda ilk sürüm düz ufuk kullanır ve sonucu buna göre etiketler ([ADR-0003](0003-veri-sozlesmesi.md), `validity` alanı). Özel koordinatta arazi ufkunun o anda hesaplanması, süre ölçümünden sonra eklenebilir ([ufuk-hesabi.md](../design/ufuk-hesabi.md)).
6. **Kullanılmayacaklar:** Unity. Unreal Engine yalnızca 2. maddedeki 3B görünüm için kullanılır; rover simülasyonu için kullanılmaz.

Varsayım: SpiceyPy ve astronomy-engine MIT lisanslı (doğrulandı: [dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 72 ve 77). NumPy, rasterio ve FastAPI lisansları bu çalışmada açılıp kontrol edilmedi; eklenmeden önce bakılmalı.

## Consequences

Kazanılanlar:

- Arayüz tasarımı hazır; ekran çizimi için sıfırdan karar gerekmiyor.
- Hesap tek dilde ve tek yerde. Ekibin doğrulanmış Python kodu doğrudan kullanılabilir ([dogrulama/efemeris-ve-yer-istasyonlari.md](../research/dogrulama/efemeris-ve-yer-istasyonlari.md), No 47 ve 51).
- Arayüz ve sunucu, [ADR-0003](0003-veri-sozlesmesi.md) ve [ADR-0004](0004-api-uc-noktalari.md) üzerinden birbirini beklemeden geliştirilebilir.

Bedeli:

- Demo için sunucunun bir yerde çalışması gerekir. Barındırma kararı açık.
- SPICE veri dosyaları yaklaşık 46 MB ([dogrulama/zamanda-degisen-veri.md](../research/dogrulama/zamanda-degisen-veri.md), No 29) ve yükseklik haritaları 2 ile 5 GB ([dogrulama/veri-kaynaklari.md](../research/dogrulama/veri-kaynaklari.md), No 21). Bunlar depoya konmaz (`AGENTS.md`, kural 6); bir indirme betiği gerekir.
- Referans arayüz rover rota planlama için tasarlanmış. Panellerin bir kısmı bu projede kullanılmayacak; hangilerinin kalacağı [gosterim-ve-arayuz.md](../design/gosterim-ve-arayuz.md) içinde.
- İki ayrı görünüm (web ve Unreal) iki ayrı uygulama demektir. Birleştirme yapılana kadar demo iki parçalı olur.

Yapılacaklar:

- `README.md` içindeki "Tech Stack" tablosu ve `AGENTS.md` içindeki "Commands" tablosu doldurulmalı.
- Barındırma ve sunucusuz yedek (tarayıcıda hesap) kararı ayrıca verilmeli.
- 3B görünümün web arayüzüyle nasıl birleşeceği kararlaştırılmalı.

## Değişiklik notu

- 2026-11-14: 5. maddedeki özel koordinat cümlesi `ufuk-hesabi.md` ile tutarlı olacak şekilde daraltıldı (ilk sürümde düz ufuk). Karar değişmedi, sözleşme belgeleri arasındaki çelişki giderildi (PR #31).
- 2026-11-15: 6. madde daraltıldı. Unity çalışma zamanında kullanılmaz; Unity ile önceden üretilmiş sabit görseller ve kısa döngüler (`frontend/public/media/`) arayüzde yalnızca illüstrasyon olarak kullanılır ve ekranda öyle etiketlenir. Bu görsellerdeki Güneş, gölge ve araç konumu hesaplanmış değildir; hesaplanan konumlar ufuk şeridindedir. 2. maddedeki canlı 3B görünüm kararı aynen durur (#80).
- 2026-11-15: Açık tema eklendi (#92, Göktuğ kararı). Koyu tema varsayılan kalır ve değişmez. Açık tema değerleri tasarım dışa aktarımında yoktur; ekibin eklemesidir ve `frontend/src/styles/theme-light.css` içinde durur. Bu dosya yalnızca `frontend-migrate/design-export/tokens.css` içinde tanımlı renk değişkenlerini `:root[data-theme='light']` altında yeniden tanımlar; `tokens.css` dışa aktarıldığı gibi kalır. Seçim üst çubuktaki düğmeyle yapılır ve tarayıcıda (`localStorage`) saklanır; işletim sistemi tercihi kendiliğinden uygulanmaz.
