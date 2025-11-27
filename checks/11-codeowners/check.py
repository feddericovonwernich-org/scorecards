#!/usr/bin/env python3
"""Check: CODEOWNERS file existence"""
import os
import sys
from pathlib import Path

repo_path = Path(os.environ.get('SCORECARD_REPO_PATH', '.'))

# Valid CODEOWNERS locations (GitHub standard)
codeowners_locations = [
    'CODEOWNERS',
    '.github/CODEOWNERS',
    'docs/CODEOWNERS'
]

codeowners_file = None
for location in codeowners_locations:
    file_path = repo_path / location
    if file_path.exists() and file_path.is_file():
        codeowners_file = file_path
        break

if not codeowners_file:
    print("No CODEOWNERS file found", file=sys.stderr)
    print("Expected locations: CODEOWNERS, .github/CODEOWNERS, or docs/CODEOWNERS", file=sys.stderr)
    sys.exit(1)

# Read and validate content
content = codeowners_file.read_text(errors='ignore')
lines = content.splitlines()

# Count non-empty, non-comment lines (actual ownership rules)
rule_count = 0
for line in lines:
    stripped = line.strip()
    if stripped and not stripped.startswith('#'):
        rule_count += 1

if rule_count == 0:
    print(f"CODEOWNERS file found at {codeowners_file.relative_to(repo_path)} but contains no ownership rules", file=sys.stderr)
    print("Add at least one ownership rule (e.g., '* @team-name')", file=sys.stderr)
    sys.exit(1)

# Success
relative_path = codeowners_file.relative_to(repo_path)
print(f"CODEOWNERS file found: {relative_path} ({rule_count} ownership rule{'s' if rule_count != 1 else ''})")
sys.exit(0)
