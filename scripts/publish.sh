#!/usr/bin/env bash

set -x -u -e -o pipefail

# From https://github.com/angular/angular
# Find the most recent tag that is reachable from the current commit.
# This is shallow clone of the repo, so we might need to fetch more commits to
# find the tag.
function getLatestTag {
  local depth=`git log --oneline | wc -l`
  local latestTag=`git describe --tags --abbrev=0 || echo NOT_FOUND`

  while [ "$latestTag" == "NOT_FOUND" ]; do
    # Avoid infinite loop.
    if [ "$depth" -gt "1000" ]; then
      echo "Error: Unable to find the latest tag." 1>&2
      exit 1;
    fi

    # Increase the clone depth and look for a tag.
    depth=$((depth + 50))
    git fetch --depth=$depth
    latestTag=`git describe --tags --abbrev=0 || echo NOT_FOUND`
  done

  echo $latestTag;
}

function setupPackage {
  PKG_SRC=$1
  PKG_DIST=$2

  if [[ ! -f "$PKG_DIST/package.json" ]]; then
    # Only publish directories that contain a `package.json` file.
    echo "Skipping $PKG_DIST, it does not contain a package to be published."
    exit 1;
  fi

  local version=`getLatestTag`
  sed -i "s/\"0.0.0-PLACEHOLDER\"/\"$version\"/" "$PKG_DIST/package.json"
}

function setupNPM {
  echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ".npmrc"
}

function publishPackage {
    PKG_SRC=$1
    PKG_DIST=$2

    setupNPM
    setupPackage $PKG_SRC $PKG_DIST

    npm publish $PKG_DIST --access public
}

publishPackage "./src/material-components" "./dist/components"
