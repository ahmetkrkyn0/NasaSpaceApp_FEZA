#!/bin/bash
# Tum kalan cekimleri sirayla calistirir (editor tek seferde bir kez acilir).
cd /c/Users/Berke/FEZA_Unreal
for s in sim14 map2d dish tour3d s2_compare s3_sky s3_countdown s3_power tl14 sc_polar sc_farside sc_night sc_athena sc_recommend; do
  echo "== $s $(date +%T)" >> data/scratch/film_batch.log
  bash tools/film_run.sh $s 700 >> data/scratch/film_batch.log 2>&1
done
echo "BATCH BITTI $(date +%T)" >> data/scratch/film_batch.log
