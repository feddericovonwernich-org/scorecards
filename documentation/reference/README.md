# Reference Documentation

Complete reference documentation for Scorecards.

## Documents

- **[Configuration](configuration.md)** - .scorecard/config.yml schema and options
- **[Token Requirements](token-requirements.md)** - GitHub token scopes and permissions
- **[Workflows](workflows.md)** - GitHub Actions workflow specifications

## Quick References

### Score Tiers

| Tier | Score Range | Badge Color | Description |
|------|-------------|-------------|-------------|
| Platinum | 90-100 | Purple | Exceptional quality |
| Gold | 75-89 | Gold | High quality |
| Silver | 50-74 | Silver | Good quality |
| Bronze | 0-49 | Bronze | Basic quality |

### Check Categories

- **documentation** - Documentation quality (README, API docs, etc.)
- **testing** - Test coverage and quality
- **ci** - Continuous integration configuration
- **api** - API documentation and quality
- **metadata** - Repository metadata (config, license, etc.)

### Configuration File Location

`.scorecard/config.yml` in the root of your repository

### Common Check Weights

- Critical checks (README, License): 10 points
- Important checks (CI, Tests): 7-8 points
- Nice-to-have checks: 3-5 points

See [Check Development Guide](../guides/check-development-guide.md) for creating custom checks and [Configuration](configuration.md) for service metadata.

## File Formats

### Registry Format

The catalog registry stores service data in JSON format:

```json
{
  "repo": "org/service-name",
  "score": 85,
  "rank": "gold",
  "checks_passed": 8,
  "checks_failed": 2,
  "last_updated": "2025-01-15T12:00:00Z",
  "team": "Platform Team",
  "description": "Core API service"
}
```

### Results Format

Individual check results stored in `results.json`:

```json
{
  "score": 85,
  "rank": "gold",
  "total_points": 85,
  "max_points": 100,
  "checks": [
    {
      "id": "01-readme",
      "name": "README Documentation",
      "passed": true,
      "points": 10
    }
  ]
}
```

See [Configuration](configuration.md) for complete schema documentation.
