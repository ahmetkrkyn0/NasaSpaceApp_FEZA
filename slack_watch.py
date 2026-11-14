"""Şef oturumunu uyandıran Slack izleyicisi.

Claude Code'un Monitor aracıyla arka planda çalıştırılır:
    python slack_watch.py --me sef

Her N saniyede bir kanalı yoklar. İlgili yeni bir mesaj gelince stdout'a TEK satır yazar;
Monitor bu satırla şef oturumunu uyandırır. İlgisiz mesajlarda hiçbir şey yazmaz,
böylece Claude kotası harcanmaz. Ayrıntı: docs/team-setup/sef.md
"""

import argparse
import json
import os
import sys
import time

import agent_chat as ac

STATE_FILE = os.path.join(ac.ROOT, ".slack_watch_state.json")
WAKE_TYPES = {"DONE", "QUESTION", "CONTRACT", "PAUSE", "HOLD", "RESUME"}


def load_state():
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f).get("last_ts")
    except (FileNotFoundError, ValueError):
        return None


def save_state(ts):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump({"last_ts": ts}, f)


def classify(msg, me, team=None):
    """Uyandırması gereken mesaj için tek satırlık açıklama, değilse None."""
    if msg.get("subtype") in ("channel_join", "channel_leave", "message_changed", "message_deleted"):
        return None
    text = ac.from_slack_mentions(msg.get("text", ""), team)
    head = ac.parse_header(text)
    mentioned = f"@{me}" in text.lower()
    snippet = lambda s: " ".join(s.split())[:160]

    if head:
        if head["sender"] == me:
            return None
        t = head["type"]
        if t == "QUESTION":
            others = [p for p in (team or {}).get("people", {}) if p != me and f"@{p}" in text.lower()]
            if others and not mentioned:
                return None  # başka birine sorulmuş
        if t in WAKE_TYPES or mentioned:
            issue = f" #{head['issue']}" if head["issue"] else ""
            return f"[slack] {t}{issue} from {head['sender']}: {snippet(head['body'])}"
        return None

    # Biçimsiz mesaj: Slack'e elle yazan bir insan (bot değil)
    if msg.get("user") and not msg.get("bot_id"):
        who = msg.get("user")
        for name, uid in ac.slack_ids(team).items():
            if uid == who:
                who = name
        return f"[slack] HUMAN from {who}: {snippet(text)}"
    return None


def poll_once(me, last_ts, team):
    msgs = ac.history(limit=100, oldest=last_ts) if last_ts else ac.history(limit=1)
    msgs = sorted(msgs, key=lambda m: float(m.get("ts", 0)))
    if not last_ts:
        # İlk çalıştırma: eski mesajları tekrar bildirme, sadece şimdiden sonrasını izle.
        return (msgs[-1]["ts"] if msgs else f"{time.time():.6f}"), []
    lines = []
    for m in msgs:
        if float(m["ts"]) <= float(last_ts):
            continue
        line = classify(m, me, team)
        if line:
            lines.append(line)
        last_ts = m["ts"]
    return last_ts, lines


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("--me", default="sef", help="kimin adına izleniyor (varsayılan sef)")
    p.add_argument("--interval", type=int, default=25, help="yoklama aralığı, saniye")
    p.add_argument("--once", action="store_true", help="bir kez yokla ve çık")
    args = p.parse_args(argv)

    last_ts = load_state()
    failures = 0
    while True:
        try:
            team = ac.load_team()
            last_ts, lines = poll_once(args.me, last_ts, team)
            save_state(last_ts)
            for line in lines:
                print(line, flush=True)
            if failures >= 5:
                print("[slack-watch] bağlantı geri geldi", flush=True)
            failures = 0
        except ac.ChatError as e:
            if "SLACK_TOKEN" in str(e) or "missing_scope" in str(e) or "invalid_auth" in str(e):
                print(f"[slack-watch] durdu: {e}", flush=True)
                return 1
            failures += 1
        except Exception as e:  # ağ hataları vb.
            failures += 1
            print(f"[slack-watch] geçici hata: {e}", file=sys.stderr, flush=True)
        if failures == 5:
            print("[slack-watch] Slack'e 5 kez ulaşılamadı, denemeye devam ediyorum", flush=True)
        if args.once:
            return 0
        time.sleep(args.interval)


if __name__ == "__main__":
    sys.exit(main())
