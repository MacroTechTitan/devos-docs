# Clear Cursor's safe caches and stuck update payloads.
# Keeps settings, keybindings, extensions, and chat history.
# Usage (PowerShell): powershell -ExecutionPolicy Bypass -File scripts\clear-cursor-cache.ps1
Get-Process -Name Cursor -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3
$paths = @(
  "$env:APPDATA\Cursor\Cache",
  "$env:APPDATA\Cursor\Code Cache",
  "$env:APPDATA\Cursor\GPUCache",
  "$env:APPDATA\Cursor\CachedData",
  "$env:APPDATA\Cursor\DawnGraphiteCache",
  "$env:APPDATA\Cursor\DawnWebGPUCache",
  "$env:APPDATA\Cursor\logs",
  "$env:LOCALAPPDATA\cursor-updater"
)
foreach ($p in $paths) {
  if (Test-Path $p) { Remove-Item $p -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "cleared $p" }
  else { Write-Host "absent  $p" }
}
Write-Host ""
Write-Host "Done. Reopen Cursor, then Ctrl+Shift+P -> Cursor: Attempt Update"
Write-Host "Then relaunch each Claude Code window: claude --continue"
