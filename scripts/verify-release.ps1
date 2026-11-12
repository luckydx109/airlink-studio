$gh = "$env:LOCALAPPDATA\GitHubCLI\bin\gh.exe"
$token = [Environment]::GetEnvironmentVariable('GH_TOKEN', 'User')
$env:GH_TOKEN = $token

Write-Host "=== RELEASE ASSETS ==="
& $gh release view v1.0.0 --repo luckydx109/airlink-studio --json assets,tagName,name,url
