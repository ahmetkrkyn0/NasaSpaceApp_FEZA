"""export/film/*.mp4 klipleri kisa kararma gecisiyle birlestirip export/film/FEZA_unreal_final.mp4 uretir (yazisiz, sessiz, ~48 sn)."""
import subprocess

FFMPEG = r"C:\Users\Berke\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
D = "C:/Users/Berke/FEZA_Unreal/export/film"
F = 0.18                                                      # gecis (sn): her klibin basinda ve sonunda
SEQ = [("tour3d", 5.5), ("map2d", 5.5), ("apollo", 4.5), ("change4", 6.0), ("dish", 1.15), ("sim14T", 8.5), ("tl14T", 2.5), ("s3_countdown", 2.5),
       ("sc_polar", 2.3), ("sc_farside", 2.3), ("sc_night", 3.0), ("sc_athena", 2.3), ("sc_recommend", 2.3)]
args = [FFMPEG, "-y", "-loglevel", "error"]
for n, _ in SEQ:
    args += ["-i", "%s/%s.mp4" % (D, n)]
fc = []
for i, (n, d) in enumerate(SEQ):
    fc.append("[%d:v]fps=30,trim=duration=%s,setpts=PTS-STARTPTS,fade=t=in:st=0:d=%s,fade=t=out:st=%.3f:d=%s,format=yuv420p[c%d]" % (i, d, F, d - F, F, i))
fc.append("".join("[c%d]" % i for i in range(len(SEQ))) + "concat=n=%d:v=1:a=0[out]" % len(SEQ))
args += ["-filter_complex", ";".join(fc), "-map", "[out]", "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", "-r", "30", D + "/FEZA_unreal_final.mp4"]
subprocess.run(args, check=True)
print("sure %.1f sn" % sum(d for _, d in SEQ))
