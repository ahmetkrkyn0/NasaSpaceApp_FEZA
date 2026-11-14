@AGENTS.md

# OTONOM EKİP VE KÖPRÜ PROTOKOLÜ (SLACK MODU)

Biz 5 kişilik bir hackathon ekibiyiz. Hepimiz ayrı bilgisayarlarda paralel çalışıyoruz; ortak iletişim kanalımız Slack `#agent-chat` kanalıdır ve proje kökündeki `agent_chat.py` ile kullanılır.

Ön koşul: `pip install requests` ve `SLACK_TOKEN` ortam değişkeni tanımlı olmalı. Token asla repoya yazılmaz.

## 1. KİMLİĞİN
Rol anahtarın şunlardan biridir: `architect`, `backend`, `frontend`, `ai`, `mobile`.
Rolünü bilmiyorsan ilk mesajda geliştiriciye sor ve hafızanda tut.

## 2. KULLANICIYA SORMADAN SLACK HABERLEŞMESİ
Geliştirici sana bir görev verdiğinde "Slack'e yazayım mı?" diye sorma; şu adımları kendiliğinden uygula:
1. **Göreve başlamadan önce:** `python agent_chat.py read` çalıştır. Diğer ajanların bıraktığı `CONTRACT` (API/şema) ve `QUESTION` mesajlarını kontrol et.
2. **İşe başlarken:** `python agent_chat.py send <rolün> START "<hangi dosyada ne yapmaya başladığının tek cümlelik özeti>"`
3. **API / veritabanı değişikliğinde:** `python agent_chat.py send <rolün> CONTRACT "<endpoint URL, request ve response JSON formatı>"`
4. **Engel veya soru olduğunda:** `python agent_chat.py send <rolün> QUESTION "<soru> @<hedef rol>"`
5. **İş bittiğinde:** `python agent_chat.py send <rolün> DONE "<tamamlanan işin özeti>"`

Mesajlara asla token, şifre veya kişisel veri yazma.

## 3. DİĞER MODELLER VE GÖRSEL ALIŞVERİŞİ
Sen doğrudan görsel üretemezsin; ekipte Gemini (`agy`), ChatGPT (`codex`) ve Grok köprüleri var.
- **Görsel lazım olduğunda:**
  1. Bu bilgisayarda görsel aracı (`google-labs-mcp`, `grok` skill'i) varsa görseli `public/assets/` içine üret, sonra paylaş:
     `python agent_chat.py upload <rolün> "public/assets/resim.png" "Görseli ürettim ve projeye ekledim"`
  2. Yoksa talep aç:
     `python agent_chat.py send <rolün> ASSET "Hedef Dosya: public/hero.png | Prompt: <detaylı İngilizce prompt> @Medya-Ekibi"`
     Görsel kanala yüklenince indir: `python agent_chat.py fetch_image "public/hero.png"`
- **Derin analiz veya ikinci görüş gerektiğinde:** kuruluysa `agy-bridge` (Gemini) veya `codex exec "<görev>"` kullan.
