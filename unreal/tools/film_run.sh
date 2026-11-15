#!/bin/bash
# Kullanim: film_run.sh <cekim> [FILM_START]   -> editoru acar, kareleri yakalar, kapanir
S=$1; ST=${2:-300}
rm -f /c/Users/Berke/FEZA_Unreal/unreal/FezaMoon/Saved/Screenshots/WindowsEditor/film_${S}_*
FILM_SHOT=$S FILM_START=$ST "/c/Program Files/Epic Games/UE_5.8/Engine/Binaries/Win64/UnrealEditor.exe" "C:/Users/Berke/FEZA_Unreal/unreal/FezaMoon/FezaMoon.uproject" -ExecCmds="py C:/Users/Berke/FEZA_Unreal/tools/ue_film.py" -windowed -ResX=1920 -ResY=1080 > /c/Users/Berke/FEZA_Unreal/data/scratch/film_run.log 2>&1
tail -2 /c/Users/Berke/FEZA_Unreal/data/scratch/film_$S.txt
