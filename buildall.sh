#!/bin/bash	

set -euo pipefail
VERSION=$(<zsgg_data_version.txt)
AT=$(date +%Y%m%d_%s)

for i in $(find zerospace -name '*.pkl'); do
  printf "# \e[0;1;33m%s\e[0m\n" "$i"
  pkl eval -m ./dist -p gg_version="$VERSION" -p gg_at="$AT" "$i"
done
