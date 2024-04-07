#!/bin/bash	

set -euo pipefail
VERSION=$(<zsgg_data_version.txt)
AT=$(date +%Y%m%d%H%M%S)

time (
  for i in $(find zerospace -name '*.pkl' | sort); do
    printf "\n# \e[0;1;33m%s\e[0m\n" "$i"
    pkl eval -m ./dist -p gg_version="$VERSION" -p gg_at="$AT" "$i"
    printf "\n"
  done
)

printf "\n# \e[0;1;32m%s\e[0m\n" "DONE [$(date +%Y-%m-%d\ %H:%M:%S)]"
