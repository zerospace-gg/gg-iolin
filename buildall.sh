#!/bin/bash	

set -euo pipefail
VERSION=$(<zsgg_data_version.txt)
AT=$(date +%Y%m%d%H%M%S)
CAT=$(which bat || which cat)
PKL=$(which pkl)
FILES=$(find zerospace -name '*.pkl' | sort)


time (
  for i in $FILES; do
    printf "\n# \e[0;1;33m%s\e[0m\n" "$i"
    echo "${PKL}" eval -m ./dist -p gg_version="$VERSION" -p gg_at="$AT" "$i"
    "${PKL}" eval -m ./dist -p gg_version="$VERSION" -p gg_at="$AT" "$i"
    printf "\n"
  done
)

printf "\n# \e[0;1;32m%s\e[0m\n\n" "DONE [$(date +%Y-%m-%d\ %H:%M:%S)]"

printf "\n# \e[0;1;36mTotal bytes of JSON rendered:\e[0m\n"
find dist -name '*json' -exec cat {} \; | wc -c

printf "\n# \e[0;1;36mRoot JSON files:\e[0m\n"
ls -lh dist/zsgg-data.*.json

printf "\n# \e[0;1;36mManifest:\e[0m\n"
"$CAT" dist/zsgg-data.manifest.json

