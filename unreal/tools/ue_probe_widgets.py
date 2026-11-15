import unreal

out = open("C:/Users/Berke/FEZA_Unreal/data/scratch/probe_widgets.txt", "w", encoding="utf-8")
keys = ("WebBrowser", "UserWidget", "WidgetBlueprint", "WidgetTree", "EditorUtilityWidget", "Canvas", "WidgetLibrary", "WidgetLayout", "Http", "Json")
for n in sorted(dir(unreal)):
    if any(k.lower() in n.lower() for k in keys):
        out.write(n + "\n")
wb = getattr(unreal, "WebBrowser", None)
if wb:
    out.write("--- WebBrowser members\n")
    for m in sorted(dir(wb)):
        if not m.startswith("_"):
            out.write("  " + m + "\n")
wbp = getattr(unreal, "WidgetBlueprint", None)
if wbp:
    out.write("--- WidgetBlueprint members\n")
    for m in sorted(dir(wbp)):
        if not m.startswith("_") and ("tree" in m or "widget" in m.lower()):
            out.write("  " + m + "\n")
wt = getattr(unreal, "WidgetTree", None)
if wt:
    out.write("--- WidgetTree members\n")
    for m in sorted(dir(wt)):
        if not m.startswith("_"):
            out.write("  " + m + "\n")
out.close()
