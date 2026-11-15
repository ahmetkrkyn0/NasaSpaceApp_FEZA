# Unreal penceresini (yalnizca kendi UE penceresi) PrintWindow ile yakalar; test_web.txt icindeki "SHOT <ad>" satirlarini izler.
# Kullanim: powershell -File tools\win_capture.ps1   (ue_test_web.py ile ayni anda)
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System; using System.Runtime.InteropServices;
public class W { [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint f);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  public struct RECT { public int L, T, R, B; } }
"@
$log = "C:\Users\Berke\FEZA_Unreal\data\scratch\test_web.txt"
$done = @{}
$t0 = Get-Date
while (((Get-Date) - $t0).TotalSeconds -lt 420) {
  Start-Sleep -Milliseconds 400
  if (-not (Test-Path $log)) { continue }
  $txt = Get-Content $log -ErrorAction SilentlyContinue
  foreach ($l in $txt) {
    if ($l -match "SHOT (\w+)" -and -not $done[$Matches[1]]) {
      $n = $Matches[1]; $done[$n] = 1
      $p = Get-Process UnrealEditor -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
      if ($p) {
        $r = New-Object W+RECT; [W]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
        $bmp = New-Object System.Drawing.Bitmap ($r.R - $r.L), ($r.B - $r.T)
        $g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc()
        [W]::PrintWindow($p.MainWindowHandle, $dc, 2) | Out-Null
        $g.ReleaseHdc($dc); $g.Dispose()
        $bmp.Save("C:\Users\Berke\FEZA_Unreal\data\scratch\win_$n.png"); $bmp.Dispose()
      }
    }
    if ($l -match "BITTI") { exit }
  }
}
