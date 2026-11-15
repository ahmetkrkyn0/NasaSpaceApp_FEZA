@echo off
rem FezaMoon projesini dogrudan acar. Unreal kurulu degilse UE_EXE degiskenini kendi yoluna cevir.
if not defined UE_EXE set "UE_EXE=C:\Program Files\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe"
start "" "%UE_EXE%" "%~dp0FezaMoon\FezaMoon.uproject"
