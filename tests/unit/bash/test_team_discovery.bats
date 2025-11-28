#!/usr/bin/env bats

load helpers

setup() {
    export TEST_TEMP_DIR="$(mktemp -d)"

    source "$ACTION_LIB/common.sh"
    source "$ACTION_LIB/team-discovery.sh"
}

teardown() {
    [ -n "$TEST_TEMP_DIR" ] && rm -rf "$TEST_TEMP_DIR"
}

# Helper to extract JSON from output (filters out log messages)
# The functions output log messages to stderr that get captured.
# Lines with ANSI escape codes start with ESC character (\x1b or ^[)
get_json_output() {
    local input="$1"
    # Filter out lines starting with ESC character (ANSI codes)
    # Then use jq -s to slurp and compact the remaining JSON
    echo "$input" | grep -v $'^\x1b' | jq -s '.[0]'
}

# =============================================================================
# find_codeowners_file tests
# =============================================================================

@test "find_codeowners_file - finds CODEOWNERS in .github directory" {
    mkdir -p "$TEST_TEMP_DIR/.github"
    echo "* @org/my-team" > "$TEST_TEMP_DIR/.github/CODEOWNERS"

    run find_codeowners_file "$TEST_TEMP_DIR"
    [ "$status" -eq 0 ]
    [ "$output" = "$TEST_TEMP_DIR/.github/CODEOWNERS" ]
}

@test "find_codeowners_file - finds CODEOWNERS in root directory" {
    echo "* @org/my-team" > "$TEST_TEMP_DIR/CODEOWNERS"

    run find_codeowners_file "$TEST_TEMP_DIR"
    [ "$status" -eq 0 ]
    [ "$output" = "$TEST_TEMP_DIR/CODEOWNERS" ]
}

@test "find_codeowners_file - finds CODEOWNERS in docs directory" {
    mkdir -p "$TEST_TEMP_DIR/docs"
    echo "* @org/my-team" > "$TEST_TEMP_DIR/docs/CODEOWNERS"

    run find_codeowners_file "$TEST_TEMP_DIR"
    [ "$status" -eq 0 ]
    [ "$output" = "$TEST_TEMP_DIR/docs/CODEOWNERS" ]
}

@test "find_codeowners_file - prioritizes .github over root" {
    mkdir -p "$TEST_TEMP_DIR/.github"
    echo "* @org/github-team" > "$TEST_TEMP_DIR/.github/CODEOWNERS"
    echo "* @org/root-team" > "$TEST_TEMP_DIR/CODEOWNERS"

    run find_codeowners_file "$TEST_TEMP_DIR"
    [ "$status" -eq 0 ]
    [ "$output" = "$TEST_TEMP_DIR/.github/CODEOWNERS" ]
}

@test "find_codeowners_file - returns error when not found" {
    run find_codeowners_file "$TEST_TEMP_DIR"
    [ "$status" -eq 1 ]
    [ -z "$output" ]
}

# =============================================================================
# extract_teams_from_owners tests
# =============================================================================

@test "extract_teams_from_owners - extracts single team" {
    run extract_teams_from_owners "@org/my-team"
    [ "$status" -eq 0 ]
    result=$(echo "$output" | jq -r '.teams[0]')
    [ "$result" = "my-team" ]
}

@test "extract_teams_from_owners - extracts multiple teams" {
    run extract_teams_from_owners "@org/team-a @org/team-b @org/team-c"
    [ "$status" -eq 0 ]

    length=$(echo "$output" | jq '.teams | length')
    [ "$length" -eq 3 ]

    team1=$(echo "$output" | jq -r '.teams[0]')
    team2=$(echo "$output" | jq -r '.teams[1]')
    team3=$(echo "$output" | jq -r '.teams[2]')

    [ "$team1" = "team-a" ]
    [ "$team2" = "team-b" ]
    [ "$team3" = "team-c" ]
}

@test "extract_teams_from_owners - handles mixed teams and users" {
    run extract_teams_from_owners "@org/my-team @individual-user"
    [ "$status" -eq 0 ]

    # Should extract team first, user is fallback only when no teams
    team=$(echo "$output" | jq -r '.teams[0]')
    [ "$team" = "my-team" ]
}

@test "extract_teams_from_owners - extracts users when no teams present" {
    run extract_teams_from_owners "@user1 @user2"
    [ "$status" -eq 0 ]

    length=$(echo "$output" | jq '.teams | length')
    [ "$length" -eq 2 ]

    user1=$(echo "$output" | jq -r '.teams[0]')
    user2=$(echo "$output" | jq -r '.teams[1]')

    [ "$user1" = "user1" ]
    [ "$user2" = "user2" ]
}

@test "extract_teams_from_owners - returns empty array for empty input" {
    run extract_teams_from_owners ""
    [ "$status" -eq 0 ]
    teams_length=$(echo "$output" | jq '.teams | length')
    [ "$teams_length" -eq 0 ]
}

@test "extract_teams_from_owners - handles different org names" {
    run extract_teams_from_owners "@company/platform-team @other-org/backend-team"
    [ "$status" -eq 0 ]

    team1=$(echo "$output" | jq -r '.teams[0]')
    team2=$(echo "$output" | jq -r '.teams[1]')

    [ "$team1" = "platform-team" ]
    [ "$team2" = "backend-team" ]
}

# =============================================================================
# parse_codeowners_for_root tests
# =============================================================================

@test "parse_codeowners_for_root - extracts root pattern owner" {
    mkdir -p "$TEST_TEMP_DIR/.github"
    cat > "$TEST_TEMP_DIR/.github/CODEOWNERS" << 'EOF'
# This is a comment
/   @org/root-team
/src @org/src-team
EOF

    run parse_codeowners_for_root "$TEST_TEMP_DIR"
    [ "$status" -eq 0 ]

    json_output=$(get_json_output "$output")
    primary=$(echo "$json_output" | jq -r '.primary')
    source=$(echo "$json_output" | jq -r '.source')

    [ "$primary" = "root-team" ]
    [ "$source" = "codeowners" ]
}

@test "parse_codeowners_for_root - extracts wildcard pattern owner" {
    mkdir -p "$TEST_TEMP_DIR/.github"
    cat > "$TEST_TEMP_DIR/.github/CODEOWNERS" << 'EOF'
*   @org/default-team
/src @org/src-team
EOF

    run parse_codeowners_for_root "$TEST_TEMP_DIR"
    [ "$status" -eq 0 ]

    json_output=$(get_json_output "$output")
    primary=$(echo "$json_output" | jq -r '.primary')
    [ "$primary" = "default-team" ]
}

@test "parse_codeowners_for_root - prioritizes root over wildcard" {
    mkdir -p "$TEST_TEMP_DIR/.github"
    cat > "$TEST_TEMP_DIR/.github/CODEOWNERS" << 'EOF'
*   @org/default-team
/   @org/root-team
EOF

    run parse_codeowners_for_root "$TEST_TEMP_DIR"
    [ "$status" -eq 0 ]

    json_output=$(get_json_output "$output")
    primary=$(echo "$json_output" | jq -r '.primary')
    [ "$primary" = "root-team" ]
}

@test "parse_codeowners_for_root - handles multiple teams in all array" {
    mkdir -p "$TEST_TEMP_DIR/.github"
    cat > "$TEST_TEMP_DIR/.github/CODEOWNERS" << 'EOF'
*   @org/team-a @org/team-b @org/team-c
EOF

    run parse_codeowners_for_root "$TEST_TEMP_DIR"
    [ "$status" -eq 0 ]

    json_output=$(get_json_output "$output")
    primary=$(echo "$json_output" | jq -r '.primary')
    all_length=$(echo "$json_output" | jq '.all | length')

    [ "$primary" = "team-a" ]
    [ "$all_length" -eq 3 ]
}

@test "parse_codeowners_for_root - returns null primary when no owners" {
    mkdir -p "$TEST_TEMP_DIR/.github"
    cat > "$TEST_TEMP_DIR/.github/CODEOWNERS" << 'EOF'
# Only directory-specific patterns
/src @org/src-team
/docs @org/docs-team
EOF

    run parse_codeowners_for_root "$TEST_TEMP_DIR"
    [ "$status" -eq 1 ]

    json_output=$(get_json_output "$output")
    primary=$(echo "$json_output" | jq -r '.primary')
    [ "$primary" = "null" ]
}

@test "parse_codeowners_for_root - skips comments and empty lines" {
    mkdir -p "$TEST_TEMP_DIR/.github"
    cat > "$TEST_TEMP_DIR/.github/CODEOWNERS" << 'EOF'
# This is a comment


# Another comment
*   @org/valid-team
EOF

    run parse_codeowners_for_root "$TEST_TEMP_DIR"
    [ "$status" -eq 0 ]

    json_output=$(get_json_output "$output")
    primary=$(echo "$json_output" | jq -r '.primary')
    [ "$primary" = "valid-team" ]
}

# =============================================================================
# normalize_team_id tests
# =============================================================================

@test "normalize_team_id - converts to lowercase" {
    run normalize_team_id "Platform-Engineering"
    [ "$status" -eq 0 ]
    [ "$output" = "platform-engineering" ]
}

@test "normalize_team_id - replaces spaces with hyphens" {
    run normalize_team_id "Platform Engineering Team"
    [ "$status" -eq 0 ]
    [ "$output" = "platform-engineering-team" ]
}

@test "normalize_team_id - removes special characters" {
    run normalize_team_id "Team@#$%^&*()!123"
    [ "$status" -eq 0 ]
    [ "$output" = "team123" ]
}

@test "normalize_team_id - handles already normalized input" {
    run normalize_team_id "my-team-name"
    [ "$status" -eq 0 ]
    [ "$output" = "my-team-name" ]
}

@test "normalize_team_id - handles mixed case with numbers" {
    run normalize_team_id "Team123ABC"
    [ "$status" -eq 0 ]
    [ "$output" = "team123abc" ]
}

# =============================================================================
# discover_team tests
# =============================================================================

@test "discover_team - uses manual team when provided" {
    run discover_team "$TEST_TEMP_DIR" "org" "repo" "" "manual-team-name"
    [ "$status" -eq 0 ]

    json_output=$(get_json_output "$output")
    primary=$(echo "$json_output" | jq -r '.primary')
    source=$(echo "$json_output" | jq -r '.source')

    [ "$primary" = "manual-team-name" ]
    [ "$source" = "manual" ]
}

@test "discover_team - falls back to CODEOWNERS when no manual team" {
    mkdir -p "$TEST_TEMP_DIR/.github"
    echo "* @org/codeowners-team" > "$TEST_TEMP_DIR/.github/CODEOWNERS"

    run discover_team "$TEST_TEMP_DIR" "org" "repo" ""
    [ "$status" -eq 0 ]

    json_output=$(get_json_output "$output")
    primary=$(echo "$json_output" | jq -r '.primary')
    source=$(echo "$json_output" | jq -r '.source')

    [ "$primary" = "codeowners-team" ]
    [ "$source" = "codeowners" ]
}

@test "discover_team - returns none source when no team found" {
    run discover_team "$TEST_TEMP_DIR" "org" "repo" ""
    [ "$status" -eq 0 ]

    json_output=$(get_json_output "$output")
    primary=$(echo "$json_output" | jq -r '.primary')
    source=$(echo "$json_output" | jq -r '.source')

    [ "$primary" = "null" ]
    [ "$source" = "none" ]
}

@test "discover_team - includes timestamp in result" {
    run discover_team "$TEST_TEMP_DIR" "org" "repo" "" "test-team"
    [ "$status" -eq 0 ]

    json_output=$(get_json_output "$output")
    timestamp=$(echo "$json_output" | jq -r '.last_discovered')
    [ -n "$timestamp" ]
    [[ "$timestamp" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]
}

@test "discover_team - manual team creates single-item all array" {
    run discover_team "$TEST_TEMP_DIR" "org" "repo" "" "my-team"
    [ "$status" -eq 0 ]

    json_output=$(get_json_output "$output")
    all_length=$(echo "$json_output" | jq '.all | length')
    first_team=$(echo "$json_output" | jq -r '.all[0]')

    [ "$all_length" -eq 1 ]
    [ "$first_team" = "my-team" ]
}
