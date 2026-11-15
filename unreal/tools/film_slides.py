"""Sunum sayfalari icin en fazla 3 sn'lik klipler: export/film/slides/ (sayfa-no_ad.mp4). Sayfa 5: tam akis."""
import os
import subprocess

FF = r"C:\Users\Berke\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
D = r"C:\Users\Berke\FEZA_Unreal\export\film"
O = D + r"\slides"
os.makedirs(O, exist_ok=True)
CLIPS = [("s1_space-link-apollo11", "apollo", 0.0, 3.0), ("s2_compare-windows", "tl14T", 0.0, 3.0),
         ("s3_1_sky-sun-earth", "s3_sky", 0.0, 2.5), ("s3_2_countdown-sunset", "s3_countdown", 0.0, 3.0), ("s3_3_timeline-lunar-day", "tl14T", 0.0, 3.0), ("s3_4_power-panel", "s3_power", 0.0, 3.0),
         ("s4_1_candidate-region", "sc_recommend", 0.0, 2.5), ("s4_2_map-2d-drone", "map2d", 2.0, 3.0), ("s4_3_moon-3d-drone", "tour3d", 1.5, 3.0)]
for name, src, ss, t in CLIPS:
    subprocess.run([FF, "-y", "-loglevel", "error", "-ss", str(ss), "-t", str(t), "-i", D + "\\" + src + ".mp4", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", O + "\\" + name + ".mp4"], check=True)
subprocess.run([FF, "-y", "-loglevel", "error", "-i", D + r"\apollo.mp4", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", O + r"\s5_1_apollo11-direct-link.mp4"], check=True)
open(O + r"\list.txt", "w").write("file '%s\change4.mp4'\nfile '%s\dish.mp4'\n" % (D.replace("\\", "/"), D.replace("\\", "/")))
subprocess.run([FF, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", O + r"\list.txt", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", O + r"\s5_2_change4-relay-needed.mp4"], check=True)
os.remove(O + r"\list.txt")
print(sorted(os.listdir(O)))
