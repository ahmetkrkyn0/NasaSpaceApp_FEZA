"""FEZA ekip köprüsü: Slack #agent-chat kanalına okuma/yazma.

Kurulum ve kullanım: docs/team-setup/README.md

Kimlik makinedeki AGENT_NAME ortam değişkeninden gelir (goktug, tuna, oguzhan, ahmet).
Şef oturumu --as sef ile yazar. Token repoya YAZILMAZ: SLACK_TOKEN ortam değişkeni.
"""

import argparse
import json
import os
import re
import sys
import time

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

ROOT = os.path.dirname(os.path.abspath(__file__))
TEAM_FILE = os.path.join(ROOT, "team.json")
DEFAULT_CHANNEL = "C0CH5NLBB3N"  # FEZA #agent-chat
API = "https://slack.com/api/"

TYPES = {
    "TASK":     ("📌", True,  "Görev atama (şef -> kişi)"),
    "START":    ("🟡", True,  "İşe başladım"),
    "DONE":     ("🟢", True,  "İş bitti / PR hazır"),
    "REVIEW":   ("🔍", True,  "Review bulguları PR'a yazıldı"),
    "READY":    ("✅", True,  "PR merge'e hazır"),
    "PAUSE":    ("⏸️", True,  "Ara veriyorum (limit vb.)"),
    "QUESTION": ("🔴", False, "Soru / engel"),
    "CONTRACT": ("📋", False, "API / veri formatı değişti"),
    "ASSET":    ("📸", False, "Görsel talebi"),
    "STATUS":   ("📊", False, "Durum özeti"),
    "HOLD":     ("🛑", False, "Şef dursun"),
    "RESUME":   ("▶️", False, "Şef devam etsin"),
}

# İlk satır biçimi: "<emoji> <TYPE> [#issue] [ASSET-xxxx] · <isim>"
HEADER_RE = re.compile(
    r"^\S+\s+(?P<type>[A-Z]+)"
    r"(?:\s+#(?P<issue>\d+))?"
    r"(?:\s+\[(?P<asset>ASSET-[a-z0-9]+)\])?"
    r"\s+·\s+(?P<sender>[a-z0-9_-]+)\s*$"
)


class ChatError(Exception):
    pass


# ---------- ekip ve kimlik ----------

def load_team():
    try:
        with open(TEAM_FILE, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"people": {}}


def resolve_name(cli_name=None):
    name = (cli_name or os.environ.get("AGENT_NAME", "")).strip().lower()
    if not name:
        raise ChatError(
            "AGENT_NAME tanımlı değil. Windows: setx AGENT_NAME \"tuna\" "
            "(sonra terminali/uygulamayı yeniden aç). Bkz. docs/team-setup/gelistirici.md"
        )
    people = load_team().get("people", {})
    if people and name not in people:
        raise ChatError(f"'{name}' team.json içinde yok. Geçerli isimler: {', '.join(people)}")
    return name


def slack_ids(team=None):
    """isim -> Slack üye kimliği (boş olanlar atlanır)."""
    team = team or load_team()
    return {n: p.get("slack_id") for n, p in team.get("people", {}).items()
            if p.get("slack_id")}


def to_slack_mentions(text, team=None):
    ids = slack_ids(team)

    def repl(m):
        uid = ids.get(m.group(1).lower())
        return f"<@{uid}>" if uid else m.group(0)

    return re.sub(r"@([A-Za-z0-9_-]+)", repl, text)


def from_slack_mentions(text, team=None):
    rev = {uid: n for n, uid in slack_ids(team).items()}
    return re.sub(r"<@([A-Z0-9]+)>", lambda m: "@" + rev.get(m.group(1), m.group(1)), text)


def parse_header(text):
    """Mesajın ilk satırını ayrıştırır; uymuyorsa None."""
    first = (text or "").split("\n", 1)[0].strip()
    m = HEADER_RE.match(first)
    if not m or m.group("type") not in TYPES:
        return None
    d = m.groupdict()
    d["body"] = (text.split("\n", 1)[1] if "\n" in text else "").strip()
    return d


def build_message(mtype, sender, body, issue=None, asset=None):
    emoji = TYPES[mtype][0]
    head = f"{emoji} {mtype}"
    if issue:
        head += f" #{issue}"
    if asset:
        head += f" [{asset}]"
    head += f" · {sender}"
    return f"{head}\n{body}".rstrip()


def new_asset_id():
    n = int(time.time()) % (36 ** 4)
    chars = "0123456789abcdefghijklmnopqrstuvwxyz"
    s = ""
    for _ in range(4):
        n, r = divmod(n, 36)
        s = chars[r] + s
    return f"ASSET-{s}"


# ---------- Slack API ----------

def _token():
    tok = os.environ.get("SLACK_TOKEN")
    if not tok:
        raise ChatError("SLACK_TOKEN tanımlı değil. Token'ı ekipten özel mesajla al, "
                        "sonra: setx SLACK_TOKEN \"xoxb-...\" ve terminali yeniden aç.")
    return tok


def channel_id():
    return os.environ.get("SLACK_CHANNEL_ID", DEFAULT_CHANNEL)


def api(method, http="get", **kwargs):
    import requests

    headers = {"Authorization": f"Bearer {_token()}"}
    for attempt in range(3):
        if http == "get":
            r = requests.get(API + method, headers=headers, params=kwargs, timeout=20)
        else:
            r = requests.post(API + method, headers=headers, json=kwargs, timeout=20)
        if r.status_code == 429:
            time.sleep(int(r.headers.get("Retry-After", "5")) + 1)
            continue
        data = r.json()
        if not data.get("ok"):
            err = data.get("error")
            hint = f" (gereken izin: {data.get('needed')})" if err == "missing_scope" else ""
            raise ChatError(f"Slack {method} hatası: {err}{hint}")
        return data
    raise ChatError(f"Slack {method}: hız limiti, sonra tekrar dene.")


def history(limit=50, oldest=None):
    params = {"channel": channel_id(), "limit": limit}
    if oldest:
        params["oldest"] = oldest
    return api("conversations.history", **params).get("messages", [])


# ---------- komutlar ----------

def format_line(m, team=None):
    ts = time.strftime("%d.%m %H:%M", time.localtime(float(m.get("ts", 0))))
    who = m.get("username") or m.get("user", "?")
    text = from_slack_mentions(m.get("text", ""), team)
    files = [f.get("name") for f in m.get("files", [])]
    extra = f"  [dosya: {', '.join(files)}]" if files else ""
    return f"[{ts}] {who}: {text.replace(chr(10), ' | ')}{extra}"


def cmd_read(args):
    team = load_team()
    msgs = list(reversed(history(limit=args.limit)))
    me = None
    if args.mine:
        me = resolve_name(args.as_name)
        my_id = slack_ids(team).get(me)
    shown = 0
    for m in msgs:
        text = m.get("text", "")
        if args.issue:
            h = parse_header(text)
            if not h or h["issue"] != str(args.issue).lstrip("#"):
                continue
        if me:
            plain = from_slack_mentions(text, team).lower()
            if f"@{me}" not in plain and not (my_id and my_id in text):
                continue
        print(format_line(m, team))
        shown += 1
    if not shown:
        print("(eşleşen mesaj yok)")


def cmd_send(args):
    mtype = args.type.upper()
    if mtype not in TYPES:
        raise ChatError(f"Bilinmeyen tür '{args.type}'. Geçerli: {', '.join(TYPES)}")
    issue = None
    if args.issue not in (None, "-", ""):
        issue = str(args.issue).lstrip("#")
        if not issue.isdigit():
            raise ChatError(f"Issue numarası sayı olmalı: '{args.issue}'")
    if TYPES[mtype][1] and not issue:
        raise ChatError(f"{mtype} için issue numarası gerekli: send {mtype} 12 \"...\"")
    sender = resolve_name(args.as_name)
    asset = new_asset_id() if mtype == "ASSET" else None
    team = load_team()
    text = to_slack_mentions(build_message(mtype, sender, args.text, issue, asset), team)
    person = team.get("people", {}).get(sender, {})
    payload = {
        "channel": channel_id(),
        "username": person.get("display", sender),
        "icon_emoji": person.get("emoji", ":speech_balloon:"),
        "text": text,
    }
    if args.dry_run:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        api("chat.postMessage", http="post", **payload)
        print("Mesaj Slack kanalına gönderildi.")
    if asset:
        print(f"Talep kimliği: {asset}  (yükleyen: upload <dosya> \"...\" --asset {asset})")


def cmd_upload(args):
    import requests

    sender = resolve_name(args.as_name)
    path = args.file
    if not os.path.isfile(path):
        raise ChatError(f"Dosya yok: {path}")
    comment = build_message("ASSET", sender, args.message, asset=args.asset)
    comment = comment.replace("📸 ASSET", "📦 FILE", 1)
    if args.dry_run:
        print(f"[dry-run] {path} yüklenecekti. Mesaj:\n{comment}")
        return
    name = os.path.basename(path)
    u = api("files.getUploadURLExternal", filename=name, length=os.path.getsize(path))
    with open(path, "rb") as f:
        requests.post(u["upload_url"], files={"file": f}, timeout=120).raise_for_status()
    api("files.completeUploadExternal", http="post",
        files=[{"id": u["file_id"], "title": name}],
        channel_id=channel_id(), initial_comment=to_slack_mentions(comment))
    print(f"Yüklendi: {path}")


def cmd_fetch(args):
    import requests

    for m in history(limit=200):
        if not m.get("files"):
            continue
        if args.asset and f"[{args.asset}]" not in m.get("text", ""):
            continue
        url = m["files"][0]["url_private_download"]
        r = requests.get(url, headers={"Authorization": f"Bearer {_token()}"}, timeout=120)
        r.raise_for_status()
        os.makedirs(os.path.dirname(args.target) or ".", exist_ok=True)
        with open(args.target, "wb") as f:
            f.write(r.content)
        print(f"İndirildi -> {args.target}")
        return
    if args.asset:
        raise ChatError(f"{args.asset} kimlikli dosya kanalda bulunamadı (henüz yüklenmemiş olabilir).")
    raise ChatError("Kanalda indirilecek dosya bulunamadı.")


def cmd_whoami(args):
    name = resolve_name(args.as_name)
    person = load_team().get("people", {}).get(name, {})
    print(f"isim: {name}")
    print(f"görünen ad: {person.get('display', name)}")
    print(f"slack_id: {person.get('slack_id') or '(team.json içinde boş)'}")
    print(f"SLACK_TOKEN: {'tanımlı' if os.environ.get('SLACK_TOKEN') else 'YOK'}")
    print(f"kanal: {channel_id()}")


def build_parser():
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--as", dest="as_name", help="isim ezme (sadece şef: --as sef)")
    common.add_argument("--dry-run", action="store_true", help="göndermeden göster")

    p = argparse.ArgumentParser(description="FEZA Slack köprüsü")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("read", parents=[common], help="son mesajları oku")
    r.add_argument("--limit", type=int, default=50)
    r.add_argument("--mine", action="store_true", help="sadece beni etiketleyenler")
    r.add_argument("--issue", help="sadece bu issue (#12)")
    r.set_defaults(func=cmd_read)

    s = sub.add_parser("send", parents=[common], help="mesaj gönder",
                       description="Türler: " + ", ".join(f"{k} ({v[2]})" for k, v in TYPES.items()))
    s.add_argument("type")
    s.add_argument("issue", nargs="?", help="issue numarası; yoksa '-'")
    s.add_argument("text")
    s.set_defaults(func=cmd_send)

    u = sub.add_parser("upload", parents=[common], help="dosya yükle")
    u.add_argument("file")
    u.add_argument("message")
    u.add_argument("--asset", help="karşılık gelen ASSET kimliği")
    u.set_defaults(func=cmd_upload)

    f = sub.add_parser("fetch_image", parents=[common], help="görsel indir")
    f.add_argument("target")
    f.add_argument("--asset", help="ASSET kimliği; verilmezse en son dosya")
    f.set_defaults(func=cmd_fetch)

    w = sub.add_parser("whoami", parents=[common], help="kurulumu kontrol et")
    w.set_defaults(func=cmd_whoami)
    return p


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        args.func(args)
    except ChatError as e:
        print(f"HATA: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
