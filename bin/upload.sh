#!/bin/bash

VER="$1"
JSON_MIN="$2"
JSON_MANIFEST="$3"
DIR=$(echo "${VER}" | perl -pe 's|^([\d.]+)-(\d{6}).*$|$1/$2|g')

UP_LATEST="s3://zsgg/zsgg-data/zsgg-data-latest.json"
UP_MANIFEST="s3://zsgg/zsgg-data/zsgg-data-manifest.json"
UP_VERSION="s3://zsgg/zsgg-data/${DIR}/zsgg-data-${VER}.json"

echo "Uploading to ${UP_LATEST}"
s3cmd put --acl-public "${JSON_MIN}" "${UP_LATEST}"

echo "Uploading to ${UP_MANIFEST}"
s3cmd put --acl-public "${JSON_MANIFEST}" "${UP_MANIFEST}"

echo "Uploading to ${UP_VERSION}"
s3cmd put --acl-public "${JSON_MIN}" "${UP_VERSION}"
