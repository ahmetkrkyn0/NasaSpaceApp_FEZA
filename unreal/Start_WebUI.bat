@echo off
rem Ekibin web arayuzunu (repodaki frontend/) 127.0.0.1:5199 uzerinde baslatir; Unreal bu adresi gomulu tarayicida acar.
rem Sira: 1) bu dosya  2) Open_FezaMoon.bat  3) Orbit haritasi > Play
rem Gokyuzu servisi (secilen saha ve ana gore Gunes/Dunya yonu): 127.0.0.1:5198
set "HERE=%~dp0"
if exist "%HERE%tools\.venv\Scripts\python.exe" (set "PY=%HERE%tools\.venv\Scripts\python.exe") else (set "PY=python")
start "sky" /min "%PY%" "%HERE%tools\sky_service.py"
cd /d "%HERE%..\frontend"
if not exist node_modules call npm ci
npm run dev -- --port 5199 --host 127.0.0.1
