param(
  [switch]$Install
)

Set-Location -Path $PSScriptRoot

function Assert-CommandExists([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Error "Comando '$Name' não encontrado no PATH. Instale/configure e rode novamente."
    exit 1
  }
}

Assert-CommandExists -Name "docker"
Assert-CommandExists -Name "mvn"
Assert-CommandExists -Name "npm"

Write-Host "[1/3] Subindo MySQL (Docker Compose)..." -ForegroundColor Cyan
docker compose up -d

# If the container already existed from an older compose config, it may not have host ports published.
# Ensure 3306 is published so the Spring Boot app can connect via localhost.
try {
  $portsJson = docker inspect cultivo_inteligente_mysql --format "{{json .NetworkSettings.Ports}}" 2>$null
  if ($portsJson) {
    $ports = $portsJson | ConvertFrom-Json
    $published = $ports."3306/tcp"
    $hostPort = if ($published -and $published.Count -gt 0) { $published[0].HostPort } else { $null }
    if (-not $hostPort -or $hostPort -ne "3307") {
      Write-Host "MySQL sem porta 3307 publicada. Recriando container..." -ForegroundColor Yellow
      docker compose up -d --force-recreate
    }
  }
} catch {
  # ignore: we'll rely on docker compose output if something goes wrong
}

Write-Host "[2/3] Subindo API (Spring Boot)..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location -Path '$PSScriptRoot'; $env:DB_PORT='3307'; mvn spring-boot:run"
)

Write-Host "[3/3] Subindo Frontend (Vite)..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "frontend"
$nodeModulesPath = Join-Path $frontendPath "node_modules"

$frontendCmd = if ($Install -or -not (Test-Path $nodeModulesPath)) {
  "Set-Location -Path '$frontendPath'; npm install; npm run dev"
} else {
  "Set-Location -Path '$frontendPath'; npm run dev"
}

Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoExit",
  "-Command",
  $frontendCmd
)

Write-Host "OK: containers + API + frontend iniciados." -ForegroundColor Green
Write-Host "Dica: se for a primeira vez, rode: .\\start-dev.ps1 -Install" -ForegroundColor DarkGray
Write-Host "Frontend: http://localhost:3000 (ou a porta mostrada pelo Vite)" -ForegroundColor DarkGray
Write-Host "API: http://localhost:8080 (quando o Spring terminar de subir)" -ForegroundColor DarkGray
