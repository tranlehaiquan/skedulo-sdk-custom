#!/bin/bash

set -eou pipefail

[[ -z "$1" ]] && { echo "Error: No AWS Bucket given"; exit 1; }

AWS_BUCKET=$1

# 2 character year format
CURRENT_YEAR=$( date '+%y' )

# 2 character week format
CURRENT_WEEK=$( date '+%U' | sed 's/^0*//' )

# Get all versions with the same CalVer time components to find the next patch version
VERSION_TIME_COMPONENT="v${CURRENT_YEAR}.${CURRENT_WEEK}"
VERSIONS_COUNT_MATCHING_TIME=$(aws s3api list-objects --bucket $AWS_BUCKET | jq ".Contents | .[] | .Key | select(.|test(\"$VERSION_TIME_COMPONENT\"))" | jq -s . | jq length)

# Return time component and patch version (index starts at 0)
echo "$VERSION_TIME_COMPONENT.$VERSIONS_COUNT_MATCHING_TIME"