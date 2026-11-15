# Betiklerdeki sabit yolu (C:\Users\Berke\FEZA_Unreal) bu checkout'un unreal\ klasorune cevirir.
# Kullanim (repo kokunden): powershell -File unreal\tools\set_paths.ps1
# Not: Unreal'in ara ciktilari (data\, Content\, Saved\) unreal\ altinda olusur; hepsi .gitignore'dadir.
$eski = 'C:\Users\Berke\FEZA_Unreal'
$yeni = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$dosyalar = Get-ChildItem -Path $yeni -Recurse -Include *.py,*.ini,*.ps1 -File |
  Where-Object { $_.FullName -notmatch '\(\.venv|Content|Saved|Intermediate)\' -and $_.Name -ne 'set_paths.ps1' }
foreach ($f in $dosyalar) {
  $t = [System.IO.File]::ReadAllText($f.FullName)
  $n = $t.Replace($eski, $yeni).Replace($eski.Replace('\','/'), $yeni.Replace('\','/'))
  if ($n -ne $t) { [System.IO.File]::WriteAllText($f.FullName, $n, (New-Object System.Text.UTF8Encoding($false))); 'guncellendi: ' + $f.Name }
}
