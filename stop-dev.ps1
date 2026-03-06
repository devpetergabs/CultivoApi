Set-Location -Path $PSScriptRoot

Write-Host "Parando infraestrutura local (Docker Compose)..." -ForegroundColor Cyan
docker compose down

Write-Host "Obs: os consoles do 'mvn spring-boot:run' e 'npm run dev' precisam ser fechados manualmente." -ForegroundColor DarkGray
