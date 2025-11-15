#!/bin/bash
# Check: Scorecard Badge in README
set -e

REPO_PATH="${SCORECARD_REPO_PATH:-.}"

# Check if README exists (case-insensitive)
readme_file=""
for name in README.md readme.md README README.txt readme.txt; do
    if [ -f "$REPO_PATH/$name" ]; then
        readme_file="$name"
        break
    fi
done

if [ -z "$readme_file" ]; then
    echo "No README file found to check for badges" >&2
    exit 1
fi

# Search for scorecard badge patterns in README
# Looking for shields.io endpoint URLs that point to scorecard badge JSON files
readme_content=$(cat "$REPO_PATH/$readme_file")

# Count scorecard badges
score_badges=$(echo "$readme_content" | grep -c "img.shields.io/endpoint.*catalog/badges.*score\.json" || true)
rank_badges=$(echo "$readme_content" | grep -c "img.shields.io/endpoint.*catalog/badges.*rank\.json" || true)
total_badges=$((score_badges + rank_badges))

if [ $total_badges -eq 0 ]; then
    echo "No scorecard badges found in $readme_file" >&2
    echo "Expected: ![Score](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/.../catalog/badges/.../score.json)" >&2
    exit 1
fi

# Build success message
message="Found scorecard badge(s) in $readme_file:"
if [ $score_badges -gt 0 ]; then
    message="$message $score_badges score badge(s)"
fi
if [ $rank_badges -gt 0 ]; then
    if [ $score_badges -gt 0 ]; then
        message="$message and"
    fi
    message="$message $rank_badges rank badge(s)"
fi

echo "$message"
exit 0
