"""PNG karelerini (Saved/Screenshots/WindowsEditor/film_<ad>_NNNN.png) mp4'e cevirir: python film_encode.py <ad> [fps] [bas_kare_at]"""
import glob
import os
import subprocess
import sys

FFMPEG = r"C:\Users\Berke\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
SRC = r"C:\Users\Berke\FEZA_Unreal\unreal\FezaMoon\Saved\Screenshots\WindowsEditor"
OUT = r"C:\Users\Berke\FEZA_Unreal\export\film"
name = sys.argv[1]
fps = sys.argv[2] if len(sys.argv) > 2 else "30"
skip = int(sys.argv[3]) if len(sys.argv) > 3 else 0
os.makedirs(OUT, exist_ok=True)
import shutil
have = sorted(int(os.path.basename(f).rsplit("_", 1)[1][:4]) for f in glob.glob(os.path.join(SRC, "film_%s_????.png" % name)))
for k in range(have[0], have[-1] + 1):        # editorun ilk ekran goruntusu kayboluyor: bosluklari onceki kareyle doldur
    f = os.path.join(SRC, "film_%s_%04d.png" % (name, k))
    if not os.path.exists(f):
        shutil.copyfile(os.path.join(SRC, "film_%s_%04d.png" % (name, k - 1)), f)
n = have[-1] - have[0] + 1
subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-framerate", fps, "-start_number", str(skip), "-i", os.path.join(SRC, "film_%s_%%04d.png" % name),
                "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-vf", "scale=1920:1080:flags=lanczos", os.path.join(OUT, name + ".mp4")], check=True)
print(name, n, "kare ->", os.path.join(OUT, name + ".mp4"))
