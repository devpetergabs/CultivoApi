param(
  [string]$ContainerName = 'cultivo_inteligente_mysql',
  [string]$RootUser = 'root',
  [string]$RootPassword = 'root',
  [string]$DbName = 'cultivo_inteligente',
  [string]$TestDbName = 'cultivo_inteligente_test',
  [string]$MigrationVersion = '15',
  [int]$ExpectedChecksum = 449096149
)

$ErrorActionPreference = 'Stop'

function Invoke-MySqlInContainer {
  param(
    [Parameter(Mandatory=$true)][string]$Database,
    [Parameter(Mandatory=$true)][string]$Sql
  )

  $escapedSql = $Sql.Replace('"', '\"')

  docker exec $ContainerName mysql -u$RootUser -p$RootPassword -D $Database -e "$escapedSql"
  if ($LASTEXITCODE -ne 0) {
    throw "mysql command failed with exit code $LASTEXITCODE"
  }
}

Write-Host "[flyway] Repair checksum in Docker MySQL" -ForegroundColor Cyan
Write-Host "  container: $ContainerName"
Write-Host "  db:        $DbName"
Write-Host "  test db:   $TestDbName"
Write-Host "  version:   $MigrationVersion"
Write-Host "  checksum:  $ExpectedChecksum" 

# Ensure test DB exists (Spring tests expect it)
Write-Host "[mysql] Ensuring test database exists..." -ForegroundColor Cyan

docker exec $ContainerName mysql -u$RootUser -p$RootPassword -e "CREATE DATABASE IF NOT EXISTS $TestDbName;"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to create database '$TestDbName' (exit code $LASTEXITCODE)"
}

# Update checksum in main DB
Write-Host "[flyway] Updating checksum in main database..." -ForegroundColor Cyan
Invoke-MySqlInContainer -Database $DbName -Sql "UPDATE flyway_schema_history SET checksum = $ExpectedChecksum WHERE version = '$MigrationVersion';"
Invoke-MySqlInContainer -Database $DbName -Sql "SELECT version, checksum, script, description, installed_on, success FROM flyway_schema_history WHERE version = '$MigrationVersion';"

# If flyway schema history exists in test DB, update it too.
Write-Host "[flyway] Updating checksum in test database (if schema history exists)..." -ForegroundColor Cyan
try {
  Invoke-MySqlInContainer -Database $TestDbName -Sql "UPDATE flyway_schema_history SET checksum = $ExpectedChecksum WHERE version = '$MigrationVersion';"
  Invoke-MySqlInContainer -Database $TestDbName -Sql "SELECT version, checksum, script, description, installed_on, success FROM flyway_schema_history WHERE version = '$MigrationVersion';"
} catch {
  Write-Host "[flyway] Note: test DB doesn't have flyway_schema_history yet (this is OK)." -ForegroundColor Yellow
}

Write-Host "[done] Flyway checksum repaired (dev-only)." -ForegroundColor Green
