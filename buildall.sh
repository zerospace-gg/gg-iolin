#!/bin/bash

GG_VERSION=0.5.0
ZS_VERSION=v123456789

set -euo pipefail
AT=$(node -e "console.log(new Date().toISOString())")
TS=$(node -e "console.log(Math.trunc(Date.now() / 1000))")
CAT=$(which bat || which cat)
PKL=$(which pkl)
FILES=$(find zerospace -name '*.pkl' | sort)
META=$(find meta -name '*.pkl' | sort)

time (
  for i in $FILES; do
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

printf "\n# \e[0;1;32m%s\e[0m\n\n" "DONE [$(date +%Y-%m-%d\ %H:%M:%S)]"

printf "\n# \e[0;1;36mTotal bytes of JSON rendered:\e[0m\n"
find dist/json -name '*json' -type f -exec cat {} \; | wc -c

printf "\n# \e[0;1;36mTotal number of JSON files rendered:\e[0m\n"
find dist/json -name '*json' -type f | wc -l

printf "\n# \e[0;1;35mRelease Details:\e[0m\n"
jq -C . dist/json/release.json
