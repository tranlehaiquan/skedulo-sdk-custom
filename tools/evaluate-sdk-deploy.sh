#!/bin/bash

set -eou pipefail

[[ -z "$1" ]] && { echo "Error: No deploy type given"; exit 1; }
[[ -z "$2" ]] && { echo "Error: No branch name given"; exit 1; }
[[ -z "$3" ]] && { echo "Error: No asset path given"; exit 1; }

DEPLOY_TYPE=$1
BRANCH_NAME=$2

# Remove traling slash from path
SDK_ASSET_PATH=$(echo $3 | sed 's:/*$::')
TOOLS_PATH=$(echo $4 | sed 's:/*$::')

# Master is the only branch we ever want to use to deploy to AWS production, deal with credentials here
if [ "$BRANCH_NAME" = "master" ]
then
  # Overwrite dev credentials for AWS with production credentials
  export AWS_ACCESS_KEY_ID="$SKEDPKG_PROD_ACCESS_KEY"
  export AWS_SECRET_ACCESS_KEY="$SKEDPKG_PROD_SECRET_KEY"
  export AWS_DEFAULT_REGION="$SKEDPKG_PROD_AWS_REGION"

  AWS_BUCKET="$SKEDSDK_PROD_AWS_BUCKET"
else
  AWS_BUCKET="$SKEDSDK_TEST_AWS_BUCKET"
fi

# Determine filename prefix based on the type of deployment
case $DEPLOY_TYPE in
  latest)
      SDK_FILENAME_PREFIX='latest'
      ;;
  release)
      SDK_FILENAME_PREFIX=$($TOOLS_PATH/evaluate-next-release-version.sh $AWS_BUCKET)
      ;;
  branch)
      SDK_FILENAME_PREFIX=$($TOOLS_PATH/sanitize-branch-name.sh $BRANCH_NAME)
      ;;
  *)
      echo $"Invalid deploy_type specified: $DEPLOY_TYPE"
      exit 1
esac

./upload-sdk-to-s3.sh $SDK_FILENAME_PREFIX $SDK_ASSET_PATH $AWS_BUCKET