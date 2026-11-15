import unreal

out = open("C:/Users/Berke/FEZA_Unreal/data/scratch/probe_input.txt", "w", encoding="utf-8")
for cname in ("WidgetLibrary", "PlayerController", "WidgetLayoutLibrary", "GameplayStatics"):
    c = getattr(unreal, cname, None)
    out.write("== %s\n" % cname)
    if c:
        out.write("   " + ", ".join(m for m in dir(c) if not m.startswith("_") and any(k in m for k in ("input", "mouse", "cursor", "viewport", "hit", "deproject", "click", "focus", "scale"))) + "\n")
out.close()
