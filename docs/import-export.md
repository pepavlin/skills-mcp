# Import & Export (Backup)

Skills MCP supports bulk export and import of all skills and tags as a portable JSON backup file. This enables easy backups, migration between instances, and sharing skill collections.

## File Format

The backup is a `.json` file with the following structure:

```json
{
  "version": "1.0",
  "exportedAt": "2026-03-17T10:00:00.000Z",
  "tags": [
    { "name": "react", "color": "#61dafb" }
  ],
  "skills": [
    {
      "name": "My Skill",
      "slug": "my-skill",
      "description": "Short description",
      "content": "Full skill content...",
      "type": "prompt",
      "tags": ["react"]
    }
  ]
}
```

### Fields

- **version** — Backup format version (`"1.0"`)
- **exportedAt** — ISO 8601 timestamp of when the backup was created
- **tags[]** — All tags with their display colors (using name for portability, not internal ID)
- **skills[].type** — One of: `prompt`, `workflow`, `technique`, `snippet`, `config`
- **skills[].tags** — Array of tag *names* (not IDs), resolved at import time

## API Endpoints

### Export — `GET /api/export`

Downloads all skills and tags as a JSON file.

**Response headers:**
```
Content-Type: application/json
Content-Disposition: attachment; filename="skills-backup-2026-03-17.json"
```

**Requires:** authentication cookie

---

### Import — `POST /api/import`

Imports skills and tags from a backup file.

**Query parameters:**

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `mode` | `skip` \| `overwrite` | `skip` | How to handle duplicate skills (matched by slug) |

**Request body:** `multipart/form-data` with a `file` field, or raw `application/json`

**Response:**

```json
{
  "imported": 5,
  "skipped": 2,
  "tagsImported": 3,
  "errors": []
}
```

**Requires:** authentication cookie

## Import Modes

| Mode | Behavior |
|------|----------|
| `skip` (default) | Skills that already exist (matched by slug) are left unchanged |
| `overwrite` | Existing skills are updated with the imported data |

In both modes, **tags are never duplicated** — if a tag name already exists, it is reused.

## Using the Dashboard UI

The Skills list page has three controls in the top-right area:

1. **Mode selector** (`Skip dupes` / `Overwrite`) — select import behavior
2. **Import** button — opens a file picker; select a `.json` backup file
3. **Export** button — immediately downloads a backup of all your skills

After a successful import, a green banner shows how many skills and tags were imported. Errors appear in red.

## Example: Create a Backup

```bash
# Export via API (requires session cookie)
curl -b "session=<token>" https://your-instance/api/export -o skills-backup.json
```

## Example: Restore from Backup

```bash
# Import via API (skip mode — safe, won't overwrite)
curl -b "session=<token>" \
  -F "file=@skills-backup.json" \
  "https://your-instance/api/import?mode=skip"

# Import with overwrite (replaces existing skills)
curl -b "session=<token>" \
  -F "file=@skills-backup.json" \
  "https://your-instance/api/import?mode=overwrite"
```
