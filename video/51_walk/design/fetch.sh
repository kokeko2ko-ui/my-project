#!/bin/bash
# design/urls.tsv の画像を images/S<番号>.png に取得（既にあるものは飛ばす）
cd "$(dirname "$0")/.."
while IFS=$'\t' read -r n u; do
  f=$(printf "images/S%02d.png" "$n"); [ -s "$f" ] && continue
  curl -sS -o "$f" "$u" || echo "FAIL $n"
done < design/urls.tsv
ls images | wc -l
