# Architecture Overview

This document describes the high-level architecture of the Scorecards system.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Service Repository                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  .github/workflows/scorecards.yml                      │ │
│  │  .scorecard/config.yml                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │ Triggers on push/PR
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Scorecards Action                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Clone repository                                   │ │
│  │  2. Run checks in Docker                               │ │
│  │  3. Calculate score                                    │ │
│  │  4. Generate badge                                     │ │
│  │  5. Update catalog                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │ Writes results
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Catalog Branch                             │
│  registry.json - All repository scores and metadata         │
└─────────────────────┬───────────────────────────────────────┘
                      │ Served via GitHub Pages
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Catalog UI                                │
│  Web interface to browse and explore results                │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### Service Repository

Each service repository being scored contains:

- **Workflow file** (`.github/workflows/scorecards.yml`) - Triggers the action
- **Config file** (`.scorecard/config.yml`) - Team name, description, metadata

### Scorecards Action

The GitHub Action that performs scoring:

- **Entrypoint** (`action/entrypoint.sh`) - Orchestrates the scoring process
- **Check Runner** - Executes individual checks in Docker
- **Score Calculator** - Computes overall score from check results
- **Badge Generator** - Creates score badge
- **Registry Updater** - Updates central registry

### Checks

Individual quality checks are:

- **Self-contained** - Each check in its own directory
- **Multi-language** - Bash, Python, or JavaScript
- **Weighted** - Different point values based on importance
- **Categorized** - Documentation, testing, CI, etc.

### Catalog Branch

The `catalog` branch contains:

- **registry/all-services.json** - Consolidated results from all repositories
- **registry/{org}/{repo}.json** - Individual service result files
- **results/{org}/{repo}/results.json** - Detailed check results per service
- **badges/** - Badge JSON files for shields.io
- **current-checks-hash.txt** - SHA256 hash of current check suite
- **current-checks.json** - Current check metadata for staleness detection
- **docs/** - Catalog UI static files (synced from main branch)

### Catalog UI

Static web application that displays scores in a sortable, filterable table with drill-down into individual checks. See [Catalog UI Architecture](catalog-ui.md) for details on features and implementation.

## Workflows

The system uses GitHub Actions workflows for automation:

### Service Workflows

- **scorecards.yml** - Installed in service repositories; triggers scoring on push/PR

### Central Workflows

- **test.yml** - Runs JavaScript, Bash, and Python tests plus linting
- **create-installation-pr.yml** - Automatically creates PRs in service repos to install scorecards workflow
- **install.yml** - Reusable workflow that performs the installation process
- **trigger-service-workflow.yml** - Triggers scoring on single or multiple services via workflow_dispatch
- **update-checks-hash.yml** - Auto-generates hash when checks are modified; writes to catalog branch
- **consolidate-registry.yml** - Merges individual registry files into all-services.json
- **sync-docs.yml** - Syncs catalog UI from main branch to catalog branch for GitHub Pages

## Data Flow

### Scoring Flow

1. **Trigger**: Push to service repository triggers workflow
2. **Clone**: Action clones the repository
3. **Execute**: Runs all checks against the repository
4. **Score**: Calculates total score from check results
5. **Badge**: Generates SVG badge with score and tier
6. **Commit**: Creates commit in catalog branch with results
7. **Display**: Catalog UI shows updated score

### Check Execution Flow

1. **Discovery**: Find all checks in `checks/` directory
2. **Parse Metadata**: Read weight, timeout, category from metadata.json
3. **Build Docker**: Create container with all runtimes
4. **Run Check**: Execute check script with timeout
5. **Parse Result**: Extract pass/fail/points from output
6. **Aggregate**: Sum points for total score

### Installation Flow

1. **Trigger**: Manual workflow dispatch for target repository
2. **Create Files**: Generate .github/workflows/scorecards.yml and .scorecard/config.yml
3. **Create Branch**: Push files to scorecards-installation branch
4. **Open PR**: Create pull request in target repository
5. **Track**: Update registry with installation_pr metadata (number, state, url)
6. **Merge**: Service maintainers review and merge PR
7. **Activate**: First push triggers initial scorecard run

### Staleness Detection Flow

1. **Hash Generation**: When checks are modified, update-checks-hash.yml calculates SHA256
2. **Store Current**: Write hash to catalog branch (current-checks-hash.txt)
3. **Service Scoring**: Each scorecard run stores the checks_hash it used
4. **Comparison**: UI compares service's checks_hash vs current-checks-hash.txt
5. **Flag**: Services with mismatched hashes shown as stale
6. **Trigger**: Bulk re-run available for all stale services

## Security Model

- **Read-only**: Checks never modify the repository being scored
- **Isolated**: Checks run in Docker containers
- **Timeouts**: All checks have maximum execution time
- **Non-blocking**: Never fails CI, only reports

## Performance

- **Results Caching**: Daily cache of scorecard results to avoid redundant calculations
- **Docker Image**: Multi-runtime image (Node.js 20, Python 3, bash tools) built fresh each run
- **Sequential Execution**: Checks run sequentially within a single Docker container

## Extension Points

- **New Checks**: Add directory in `checks/` with check script and metadata.json
- **Custom Weights**: Configure point values via metadata.json
- **Custom Categories**: Add new category values to metadata.json
- **Custom Workflows**: Add triggers via create-installation-pr.yml or install.yml

## Related Documentation

- [Catalog UI](catalog-ui.md) - Frontend architecture and features
