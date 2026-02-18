Set-Location -Path $PSScriptRoot

docker compose up -d

Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location -Path '$PSScriptRoot'; mvn spring-boot:run"
)

Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location -Path '$PSScriptRoot\\frontend'; npm run dev"
)
