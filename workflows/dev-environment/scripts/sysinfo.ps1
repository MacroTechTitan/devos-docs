<#
  MTT Dev Environment -- system report
  Usage (PowerShell):
    powershell -ExecutionPolicy Bypass -File scripts\sysinfo.ps1
    ... -File scripts\sysinfo.ps1 -Json           # machine-readable
    ... -File scripts\sysinfo.ps1 -Save           # also write a dated .txt next to the script
  Read-only. Reports names of env vars, never values.
#>
[CmdletBinding()]
param([switch]$Json, [switch]$Save)

$ErrorActionPreference = 'SilentlyContinue'
$r = [ordered]@{}

# --- OS ---
$os  = Get-CimInstance Win32_OperatingSystem
$cs  = Get-CimInstance Win32_ComputerSystem
$r.os = [ordered]@{
  machine      = $env:COMPUTERNAME
  user         = $env:USERNAME
  caption      = $os.Caption
  version      = $os.Version
  build        = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion').DisplayVersion
  installed    = $os.InstallDate
  lastBoot     = $os.LastBootUpTime
  uptimeHours  = [math]::Round(((Get-Date) - $os.LastBootUpTime).TotalHours, 1)
  locale       = (Get-Culture).Name
  timezone     = (Get-TimeZone).Id
}

# --- Hardware ---
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$r.hardware = [ordered]@{
  model        = "$($cs.Manufacturer) $($cs.Model)"
  cpu          = $cpu.Name.Trim()
  cores        = $cpu.NumberOfCores
  threads      = $cpu.NumberOfLogicalProcessors
  ramTotalGB   = [math]::Round($cs.TotalPhysicalMemory / 1GB, 1)
  ramFreeGB    = [math]::Round($os.FreePhysicalMemory / 1MB, 1)
  ramUsedPct   = [math]::Round(100 - ($os.FreePhysicalMemory * 100 / $os.TotalVisibleMemorySize), 0)
  gpu          = (Get-CimInstance Win32_VideoController | ForEach-Object { $_.Name }) -join '; '
}

# --- Disks ---
$r.disks = @(Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {
  [ordered]@{
    drive     = $_.DeviceID
    totalGB   = [math]::Round($_.Size / 1GB, 1)
    freeGB    = [math]::Round($_.FreeSpace / 1GB, 1)
    freePct   = if ($_.Size) { [math]::Round($_.FreeSpace * 100 / $_.Size, 0) } else { 0 }
  }
})

# --- Toolchain ---
# Not named $args: that is PowerShell's automatic variable, which shadows the
# parameter and made every tool run with no arguments (bare node/claude/python hang).
function Get-ToolVersion([string]$exe, [string]$toolArgs) {
  $cmd = Get-Command $exe -ErrorAction SilentlyContinue
  if (-not $cmd) { return [ordered]@{ installed = $false; version = $null; path = $null } }
  $v = & $exe $toolArgs.Split(' ') 2>$null | Select-Object -First 1
  [ordered]@{ installed = $true; version = ("$v").Trim(); path = $cmd.Source }
}
$r.tools = [ordered]@{
  node     = Get-ToolVersion 'node' '--version'
  npm      = Get-ToolVersion 'npm' '--version'
  pnpm     = Get-ToolVersion 'pnpm' '--version'
  git      = Get-ToolVersion 'git' '--version'
  gh       = Get-ToolVersion 'gh' '--version'
  claude   = Get-ToolVersion 'claude' '--version'
  supabase = Get-ToolVersion 'supabase' '--version'
  vercel   = Get-ToolVersion 'vercel' '--version'
  docker   = Get-ToolVersion 'docker' '--version'
  python   = Get-ToolVersion 'python' '--version'
}

# --- Editors / apps ---
function Get-AppVersion([string]$path) {
  if (Test-Path $path) { (Get-Item $path).VersionInfo.ProductVersion } else { $null }
}
$r.apps = [ordered]@{
  cursor        = Get-AppVersion "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe"
  claudeDesktop = Get-AppVersion "$env:LOCALAPPDATA\AnthropicClaude\claude.exe"
  windowZen     = @(Get-Process -Name '*zen*' | Select-Object -Expand ProcessName -Unique) -join ', '
  cursorWindows = @(Get-Process -Name 'Cursor').Count
  claudeCodeProcs = @(Get-Process -Name 'claude').Count
}

# --- AI layer config ---
$claudeSettings = "$env:USERPROFILE\.claude\settings.json"
$ai = [ordered]@{ settingsPath = $claudeSettings; exists = (Test-Path $claudeSettings) }
if ($ai.exists) {
  try {
    $s = Get-Content $claudeSettings -Raw | ConvertFrom-Json
    $ai.defaultMode  = $s.permissions.defaultMode
    $ai.blockReads   = $s.permissions.blockReadsOutsideWorkingDirectories
    $ai.denyRules    = @($s.permissions.deny).Count
    $ai.allowRules   = @($s.permissions.allow).Count
    $ai.plugins      = @($s.enabledPlugins.PSObject.Properties.Name) -join ', '
  } catch { $ai.parseError = $_.Exception.Message }
}
$ai.skills   = @(Get-ChildItem "$env:USERPROFILE\.claude\skills" -Directory | Select-Object -Expand Name) -join ', '
$ai.agents   = @(Get-ChildItem "$env:USERPROFILE\.claude\agents" -Filter *.md | Select-Object -Expand BaseName) -join ', '
$desktopCfg  = "$env:APPDATA\Claude\claude_desktop_config.json"
$ai.desktopMcp = if (Test-Path $desktopCfg) {
  try { (@((Get-Content $desktopCfg -Raw | ConvertFrom-Json).mcpServers.PSObject.Properties.Name)) -join ', ' } catch { 'parse error' }
} else { 'not configured' }
$r.ai = $ai

# --- Shell config ---
$r.shell = [ordered]@{
  bashrc          = Test-Path "$env:USERPROFILE\.bashrc"
  claudeAlias     = (Select-String -Path "$env:USERPROFILE\.bashrc" -Pattern 'dangerously-skip-permissions' -Quiet) -eq $true
  mttRunAlias     = (Select-String -Path "$env:USERPROFILE\.bashrc" -Pattern 'mtt-run.js' -Quiet) -eq $true
  bashProfile     = Test-Path "$env:USERPROFILE\.bash_profile"
  psVersion       = $PSVersionTable.PSVersion.ToString()
}

# --- Dev ports in use ---
$watch = 3000,3001,4000,5173,5174,8000,8080,8787,54321,54322
$r.ports = @(foreach ($p in $watch) {
  $c = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($c) {
    $proc = (Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue).ProcessName
    [ordered]@{ port = $p; process = $proc; pid = $c.OwningProcess }
  }
})

# --- Secrets hygiene (names only) ---
$r.envVarsPresent = @('ANTHROPIC_API_KEY','SUPABASE_SECRET_KEY','GITHUB_TOKEN','VERCEL_TOKEN','RENDER_API_KEY' |
  Where-Object { [Environment]::GetEnvironmentVariable($_) })

# --- Flags ---
# Computed before any early return so -Json carries them too.
$flags = @()
foreach ($d in $r.disks) { if ($d.freePct -lt 15) { $flags += "Disk $($d.drive) is at $($d.freePct)% free" } }
if ($r.hardware.ramUsedPct -gt 85) { $flags += "RAM at $($r.hardware.ramUsedPct)% used" }
if ($r.ai.blockReads -eq $true) { $flags += "blockReadsOutsideWorkingDirectories is TRUE -- expect approval prompts" }
if ($r.ai.defaultMode -ne 'bypassPermissions') { $flags += "Claude Code defaultMode is '$($r.ai.defaultMode)'" }
if (-not $r.shell.claudeAlias) { $flags += "bypass alias missing from ~/.bashrc" }
if ($r.os.uptimeHours -gt 336) { $flags += "uptime $([math]::Round($r.os.uptimeHours/24,0)) days -- reboot pending updates" }
foreach ($t in 'node','git','gh','claude') { if (-not $r.tools[$t].installed) { $flags += "$t not on PATH" } }
$r.flags = @($flags)

if ($Json) { $r | ConvertTo-Json -Depth 6; return }

# --- Text report ---
$out = New-Object System.Text.StringBuilder
function W($s) { [void]$out.AppendLine($s) }
W "MTT DEV ENVIRONMENT -- $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
W ("=" * 62)
W ""
W "SYSTEM"
W ("  {0}  ({1})" -f $r.os.machine, $r.os.user)
W ("  {0}  version {1}  build {2}" -f $r.os.caption, $r.os.build, $r.os.version)
W ("  up {0} h   locale {1}   {2}" -f $r.os.uptimeHours, $r.os.locale, $r.os.timezone)
W ""
W "HARDWARE"
W ("  {0}" -f $r.hardware.model)
W ("  {0}" -f $r.hardware.cpu)
W ("  {0} cores / {1} threads" -f $r.hardware.cores, $r.hardware.threads)
W ("  RAM {0} GB total, {1} GB free ({2}% used)" -f $r.hardware.ramTotalGB, $r.hardware.ramFreeGB, $r.hardware.ramUsedPct)
W ("  GPU {0}" -f $r.hardware.gpu)
W ""
W "DISKS"
foreach ($d in $r.disks) { W ("  {0}  {1} GB free of {2} GB  ({3}% free)" -f $d.drive, $d.freeGB, $d.totalGB, $d.freePct) }
W ""
W "TOOLCHAIN"
foreach ($k in $r.tools.Keys) {
  $t = $r.tools[$k]
  if ($t.installed) { W ("  {0,-9} {1}" -f $k, $t.version) } else { W ("  {0,-9} NOT INSTALLED" -f $k) }
}
W ""
W "APPS"
W ("  Cursor          {0}   ({1} window(s) open)" -f $(if($r.apps.cursor){$r.apps.cursor}else{'not found'}), $r.apps.cursorWindows)
W ("  Claude Desktop  {0}" -f $(if($r.apps.claudeDesktop){$r.apps.claudeDesktop}else{'not found'}))
W ("  Claude Code     {0} process(es) running" -f $r.apps.claudeCodeProcs)
if ($r.apps.windowZen) { W ("  Window Zen      running ({0})" -f $r.apps.windowZen) }
W ""
W "AI LAYER"
if ($r.ai.exists) {
  W ("  permissions     mode={0}  blockReads={1}  allow={2}  deny={3}" -f $r.ai.defaultMode, $r.ai.blockReads, $r.ai.allowRules, $r.ai.denyRules)
  if ($r.ai.plugins) { W ("  plugins         {0}" -f $r.ai.plugins) }
} else { W "  settings.json   MISSING" }
W ("  skills          {0}" -f $(if($r.ai.skills){$r.ai.skills}else{'none'}))
W ("  agents          {0}" -f $(if($r.ai.agents){$r.ai.agents}else{'none'}))
W ("  desktop MCP     {0}" -f $r.ai.desktopMcp)
W ("  bash aliases    claude-bypass={0}  mtt-run={1}" -f $r.shell.claudeAlias, $r.shell.mttRunAlias)
W ""
W "DEV PORTS IN USE"
if ($r.ports.Count) { foreach ($p in $r.ports) { W ("  {0,-6} {1} (pid {2})" -f $p.port, $p.process, $p.pid) } }
else { W "  none of the watched ports are listening" }
W ""
W "CREDENTIALS IN ENVIRONMENT (names only)"
if ($r.envVarsPresent.Count) { foreach ($v in $r.envVarsPresent) { W ("  {0}  SET" -f $v) } }
else { W "  none of the watched variables are set at user/machine scope" }
W ""
W "FLAGS"
if ($flags.Count) { foreach ($f in $flags) { W ("  ! {0}" -f $f) } } else { W "  none" }

$text = $out.ToString()
Write-Output $text
if ($Save) {
  $dest = Join-Path $PSScriptRoot ("sysinfo-{0}.txt" -f (Get-Date -Format 'yyyyMMdd-HHmm'))
  $text | Set-Content -Path $dest -Encoding UTF8
  Write-Output "saved: $dest"
}
