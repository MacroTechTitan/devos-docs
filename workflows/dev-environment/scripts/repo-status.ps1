<#
  MTT Dev Environment -- cross-repo status board
  Usage (PowerShell):
    powershell -ExecutionPolicy Bypass -File scripts\repo-status.ps1
    ... -Root C:\Dev -Depth 3 -DirtyOnly
    ... -Json                                   # machine-readable
  Read-only: runs only git status/rev-list/log. Never fetches, never writes.
#>
[CmdletBinding()]
param([string]$Root = 'C:\Dev', [int]$Depth = 3, [switch]$DirtyOnly, [switch]$Json)

$ErrorActionPreference = 'SilentlyContinue'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Error 'git not on PATH'; exit 1 }

$gitDirs = Get-ChildItem -Path $Root -Directory -Recurse -Depth $Depth -Filter '.git' -Force |
  Where-Object { $_.FullName -notmatch '\\node_modules\\' }

$rows = foreach ($g in $gitDirs) {
  $repo = Split-Path $g.FullName -Parent
  $branch  = (git -C $repo rev-parse --abbrev-ref HEAD 2>$null)
  if (-not $branch) { continue }
  $dirty   = @(git -C $repo status --porcelain 2>$null).Count
  $ahead   = 0; $behind = 0
  $counts  = (git -C $repo rev-list --left-right --count "@{upstream}...HEAD" 2>$null)
  if ($counts) { $parts = $counts -split '\s+'; $behind = [int]$parts[0]; $ahead = [int]$parts[1] }
  $lastIso = (git -C $repo log -1 --format=%cI 2>$null)
  $days    = if ($lastIso) { [math]::Round(((Get-Date) - [datetime]$lastIso).TotalDays, 0) } else { $null }
  $trees   = @(git -C $repo worktree list 2>$null).Count
  [pscustomobject]@{
    Repo     = Split-Path $repo -Leaf
    Branch   = $branch
    Dirty    = $dirty
    Ahead    = $ahead
    Behind   = $behind
    DaysIdle = $days
    Trees    = $trees
    Path     = $repo
  }
}

if ($DirtyOnly) { $rows = $rows | Where-Object { $_.Dirty -gt 0 -or $_.Ahead -gt 0 } }
$rows = @($rows | Sort-Object @{e={$_.Dirty -gt 0 -or $_.Ahead -gt 0}; Descending=$true}, DaysIdle)

# --- Attention summary ---
# Built before any early return so -Json carries it too.
$needs = @($rows | Where-Object { $_.Dirty -gt 0 -or $_.Ahead -gt 0 })
$needsAttention = @(foreach ($n in $needs) {
  $what = @()
  if ($n.Dirty -gt 0) { $what += "$($n.Dirty) uncommitted" }
  if ($n.Ahead -gt 0) { $what += "$($n.Ahead) unpushed" }
  if ($n.Behind -gt 0) { $what += "$($n.Behind) behind" }
  "{0} [{1}] -- {2}" -f $n.Repo, $n.Branch, ($what -join ', ')
})

if ($Json) {
  [ordered]@{
    root           = $Root
    generated      = (Get-Date -Format 'o')
    rows           = $rows
    needsAttention = @($needsAttention)
  } | ConvertTo-Json -Depth 6
  return
}

Write-Output ""
Write-Output ("REPO STATUS -- {0}  ({1})" -f $Root, (Get-Date -Format 'yyyy-MM-dd HH:mm'))
$rows | Format-Table Repo, Branch, Dirty, Ahead, Behind, DaysIdle, Trees -AutoSize

if ($needsAttention.Count) {
  Write-Output "NEEDS ATTENTION"
  foreach ($line in $needsAttention) { Write-Output ("  {0}" -f $line) }
} else { Write-Output "All repos clean and pushed." }
Write-Output ""
