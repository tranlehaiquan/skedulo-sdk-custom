#!/bin/bash

set -eou pipefail

SOURCE_BRANCH=$1
BRANCH=${SOURCE_BRANCH//[\/,.]/-}

echo $BRANCH | tr '[:upper:]' '[:lower:]'