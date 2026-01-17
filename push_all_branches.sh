#!/bin/bash

# Push all local branches to origin
echo "Pushing all local branches to origin..."

# Get list of all local branches
branches=$(git branch | cut -c 3-)

for branch in $branches; do
  echo "Pushing $branch..."
  git push origin "$branch"
done

echo "✅ All local branches pushed!"
