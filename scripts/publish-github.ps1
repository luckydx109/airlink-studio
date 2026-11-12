param(
    [switch]$CreateRepo,
    [switch]$CreateRelease
)

$gh = "$env:LOCALAPPDATA\GitHubCLI\bin\gh.exe"
$token = [Environment]::GetEnvironmentVariable("GH_TOKEN", "User")
if (-not $token) {
    Write-Error "GH_TOKEN not found in User environment variables."
    exit 1
}
$env:GH_TOKEN = $token

Write-Host "=== GitHub Auth Check ==="
& $gh auth status

if ($CreateRepo) {
    Write-Host "`n=== Creating Repository luckydx109/airlink-studio ==="
    & $gh repo create luckydx109/airlink-studio `
        --public `
        --description "An open-source Android and Windows device connectivity platform with wireless screen mirroring, remote control and file transfer." `
        --source=. `
        --remote=origin `
        --push

    Write-Host "`n=== Setting Topics ==="
    & $gh repo edit luckydx109/airlink-studio --add-topic "android,windows,screen-mirroring,remote-control,scrcpy,adb,wireless,file-transfer,electron,open-source"
}

if ($CreateRelease) {
    Write-Host "`n=== Publishing Release v1.0.0 ==="
    & $gh release create v1.0.0 `
        "dist-release\AirLink-Studio-Setup.exe#AirLink-Studio-Setup.exe" `
        "dist-release\AirLink-Studio.exe#AirLink-Studio.exe" `
        "dist-release\SHA256SUMS.txt#SHA256SUMS.txt" `
        --title "AirLink Studio v1.0.0 — Connect Everything. Control Everything." `
        --notes-file "RELEASE_NOTES.md"
}
