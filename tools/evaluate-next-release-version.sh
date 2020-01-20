#!/bin/bash

set -euxo pipefail

[ $# -lt 1 ] && { echo "Error: No AWS Bucket given"; exit 1; }

AWS_BUCKET=$1

# Get all versions with the same CalVer time components to find the next patch version
# This produces a string in the format of v{2 char year}.{week number} which is used to match on existing patch versions
VERSION_TIME_COMPONENT="v$(date +%y.%U)"

VERSIONS_COUNT_MATCHING_TIME=$(aws s3api list-objects --bucket $AWS_BUCKET | jq ".Contents | .[] | .Key | select(.|test(\"$VERSION_TIME_COMPONENT\"))" | jq -s . | jq length)

# Return time component and patch version (index starts at 0)
echo "$VERSION_TIME_COMPONENT.$VERSIONS_COUNT_MATCHING_TIME"