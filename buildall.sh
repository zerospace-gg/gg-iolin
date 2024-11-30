#!/bin/bash

GG_VERSION=0.8.1
ZS_VERSION=v16494193

set -euo pipefail
AT=$(node -e "console.log(new Date().toISOString())")
TS=$(node -e "console.log(Math.trunc(Date.now() / 1000))")
CAT=$(which bat || which cat)
PKL=$(which pkl)
FILES=$(find zerospace -name '*.pkl' -and -not -ipath '/talent/' -and -not -ipath '/topbar/' -and -not -ipath '/passive/' | sort)
META=$(find meta -name '*.pkl' | sort)

time (
  for i in $FILES; do
    if [[ $i =~ "/talent/" ]]; then continue;
    elif [[ $i =~ "/topbar/" ]]; then continue;
    elif [[ $i =~ "/passive/" ]]; then continue;
    fi
    printf "\n# \e[0;1;33mCORE: %s\e[0m\n" "$i"
    echo "${PKL}" eval -m ./dist/json -p zs_version="$ZS_VERSION" -p gg_version="$GG_VERSION" -p gg_at="$AT" -p gg_ts="$TS" "$i"
    "${PKL}" eval -m ./dist/json -p zs_version="$ZS_VERSION" -p gg_version="$GG_VERSION" -p gg_at="$AT" -p gg_ts="$TS" "$i"
    printf "\n"
  done
  for i in $META; do
    printf "\n# \e[0;1;33mMETA: %s\e[0m\n" "$i"
    echo "${PKL}" eval -m ./dist/json -p zs_version="$ZS_VERSION" -p gg_version="$GG_VERSION" -p gg_at="$AT" -p gg_ts="$TS" "$i"
    "${PKL}" eval -m ./dist/json -p zs_version="$ZS_VERSION" -p gg_version="$GG_VERSION" -p gg_at="$AT" -p gg_ts="$TS" "$i"
    printf "\n"
  done
)

printf "\n# \e[0;1;33mpkl level tests\e[0m\n"
pkl test

printf "\n# \e[0;1;33mts-types\e[0m\n"
cp -av ext/gg-iolin.d.ts dist/json/gg-iolin.d.ts

printf "\n# \e[0;1;32m%s\e[0m\n\n" "DONE [$(date +%Y-%m-%d\ %H:%M:%S)]"

printf "\n# \e[0;1;36mTotal bytes of JSON rendered:\e[0m\n"
find dist/json -name '*json' -type f -exec cat {} \; | wc -c

printf "\n# \e[0;1;36mTotal number of JSON files rendered:\e[0m\n"
find dist/json -name '*json' -type f | wc -l

printf "\n# \e[0;1;35mRelease Details:\e[0m\n"
jq -C . dist/json/release.json
