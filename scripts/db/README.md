# DB scripts (dev)

This folder contains **development-only** helper scripts for working with the local Docker MySQL used by this repo.

## Why not `utils/`?

Database maintenance commands are **operational scripts**, not application code utilities.
A `scripts/` folder keeps them discoverable without mixing them into runtime code.

## Flyway checksum mismatch (dev)

If you see an error like:

- `Migration checksum mismatch for migration version 15`

it means the database already has that migration recorded in `flyway_schema_history`, but the local file content changed.

**Best practice:** don’t edit applied migrations. Create a new migration instead.

**If it already happened on your local dev DB**, you can repair the checksum.

### Repair script

From repo root:

```powershell
./scripts/db/repair-flyway-checksum.ps1
```

Optional parameters:

```powershell
./scripts/db/repair-flyway-checksum.ps1 -MigrationVersion 15 -ExpectedChecksum 449096149
```

Notes:
- This script assumes the Docker container name is `cultivo_inteligente_mysql`.
- It ensures the `cultivo_inteligente_test` database exists (Spring tests expect it).
- **Do not use this against production databases.** Use `flyway repair` in controlled environments.
