# Geliştirici kurulumu

Tuna, Oğuzhan, Ahmet ve Göktuğ'un kodlama oturumu için. Önce [README.md](README.md)'deki akışa bir göz at.

Kurulum yaklaşık 10 dakika. İki yol var: Claude'una yaptırmak (önerilen) ya da elle yapmak.

## Önce: Slack token'ını al

Slack bot token'ını (`xoxb-` ile başlar) **Tuna'dan özel mesajla** iste. Token'ı hiçbir dosyaya, commit'e, Slack kanalına veya Claude'a yapıştırma; sadece aşağıdaki `setx` komutunda kendi terminaline yazacaksın.

## Yol 1: Claude'una yaptır

Repo klasöründe Claude Code'u aç ve şunu yapıştır. `<ADIN>` yerine `goktug`, `tuna`, `oguzhan` veya `ahmet` yaz:

```text
docs/team-setup/gelistirici.md dosyasındaki kurulumu benim için yap. Benim adım <ADIN>.
Adımları sırayla uygula, her adımın sonucunu bana söyle. SLACK_TOKEN'ı ben kendim
tanımlayacağım; sen token isteme, görmeye çalışma, sadece tanımlı olup olmadığını kontrol et.
En sonda whoami ve read --limit 5 ile test et. Slack'e mesaj gönderme.
```

## Yol 2: Elle kurulum

### 1. Güncel kodu al

Eskiden `agent_chat.py` herkesin bilgisayarında ayrı bir kopyaydı; artık repoda. Eski kopya varsa `git pull` hata verir, önce onu kaldır:

```bash
git switch main
```

```bash
git pull
```

`untracked working tree files would be overwritten` hatası alırsan eski `agent_chat.py` dosyanı silip `git pull`'u tekrarla.

### 2. Python paketini kur

```bash
pip install requests
```

### 3. Ortam değişkenlerini tanımla

Windows'ta (PowerShell veya cmd). Token'ı Tuna'dan aldığın değerle değiştir:

```bash
setx SLACK_TOKEN "xoxb-..."
```

```bash
setx AGENT_NAME "oguzhan"
```

`setx` sadece **yeni açılan** pencereleri etkiler. Terminali ve Claude uygulamasını kapatıp yeniden aç.

### 4. GitHub CLI

`gh` kurulu değilse <https://cli.github.com/> adresinden kur, sonra:

```bash
gh auth login
```

### 5. Slack kimliği

Dört kişinin Slack üye kimlikleri `team.json`'a eklendi; bir şey yapmana gerek yok. Ekibe yeni biri katılırsa: Slack'te profil → ⋮ → **Copy member ID** (U ile başlar), `team.json`'a küçük bir PR ile eklenir. Bu kimlik gizli değil; olmazsa `@isim` etiketleri o kişiye bildirim göndermez.

### 6. Test et

```bash
python agent_chat.py whoami
```

Beklenen çıktı: ismin, `SLACK_TOKEN: tanımlı` ve kanal kimliği.

```bash
python agent_chat.py read --limit 5
```

Kanalın son 5 mesajı görünmeli. Bir hata alırsan aşağıdaki sorun giderme tablosuna bak.

Göndermeden nasıl görüneceğini denemek için:

```bash
python agent_chat.py send START 1 "deneme" --dry-run
```

## Günlük kullanım

Slack komutlarını kendin yazmana gerek yok; Claude bunları [CLAUDE.md](../../CLAUDE.md) sayesinde kendiliğinden yapar. Senin söyleyeceklerin:

| Ne istiyorsun | Claude'a ne dersin |
|---|---|
| Bana iş atanmış mı? | "Slack'e bak, bana ne düştü?" |
| Bir issue'ya başla | "#12'ye başla" |
| İş bitti | "PR'ı aç ve DONE gönder" |
| Review geldi | "#12'nin review'ına bak ve düzelt" |
| Takıldın | "Şefe sor: ..." veya "Ahmet'e sor: ..." |
| Claude limitin doldu | "#12 için PAUSE gönder, 3 saat yokum" (limit tamamen dolmadan söyle) |
| Görsel lazım | "Şu görsel için ASSET talebi aç: ..." |

Komutların tam listesi: `python agent_chat.py send --help`

## Tuna'ya özel

- **Merge:** `READY` mesajı gelen PR'ları inceleyip GitHub'da squash merge yap.
- **Görsel:** Grok sende. `ASSET ... @tuna` taleplerini Grok veya Antigravity ile üret, `public/assets/` içine koyup PR ile ekle, sonra `upload ... --asset ASSET-xxxx` ile kanala haber ver.
- **Şefi durdurmak:** Slack'e elle `HOLD` yaz ya da Claude'una "şefi durdur" de; devam için `RESUME`.

## Sorun giderme

| Hata | Çözüm |
|---|---|
| `AGENT_NAME tanımlı değil` | 3. adım; sonra terminali ve uygulamayı yeniden aç |
| `SLACK_TOKEN tanımlı değil` | 3. adım; sonra terminali ve uygulamayı yeniden aç |
| `'xyz' team.json içinde yok` | `AGENT_NAME` yanlış yazılmış; `goktug`, `tuna`, `oguzhan` veya `ahmet` olmalı |
| `invalid_auth` | Token yanlış kopyalanmış; Tuna'dan tekrar iste |
| `not_in_channel` | Slack botu kanala eklenmemiş; kanalda `/invite @<bot adı>` |
| `missing_scope (gereken izin: ...)` | Slack uygulamasına o izin eklenmeli; Tuna'ya söyle |
| `ModuleNotFoundError: requests` | 2. adım |
| Emoji yerine `?` görünüyor | Sadece görüntü sorunu, mesaj doğru gider |
