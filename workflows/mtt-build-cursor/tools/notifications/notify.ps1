<#
.SYNOPSIS
  Windows toast for Claude Code hooks: tells you which window needs you.

.DESCRIPTION
  Shows a balloon notification via System.Windows.Forms NotifyIcon. No modules,
  no installs -- ships with the .NET Framework already on the box.

  Title defaults to the repo folder name of the session's working directory.
  That is read from the hook JSON on stdin ("cwd"), walking up to the nearest
  .git so a session started in a subfolder still names the repo. Falls back to
  CLAUDE_PROJECT_DIR, then to the current directory.

  Outside a repo the title is the current folder's own name, and 'claude' when
  no meaningful folder can be resolved. A hook-launched PowerShell inherits
  C:\Windows\System32 as its working directory, so Windows system folders are
  treated as "no folder" rather than reported as the title.

  Always exits 0: a missed notification must never break a session.

.PARAMETER Title
  Toast title. Omit to derive the repo folder name as described above.

.PARAMETER Message
  Toast body, e.g. "Waiting for input" or "Finished".

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File notify.ps1 -Message "Finished"

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File notify.ps1 -Title MyRepo -Message "Waiting for input"
#>
[CmdletBinding()]
param(
    [string]$Title = '',
    [string]$Message = 'Claude Code',
    [int]$DurationSeconds = 6
)

function Get-RepoName {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) { return $null }

    try { $item = Get-Item -LiteralPath $Path -ErrorAction Stop } catch { return $null }
    if (-not $item.PSIsContainer) { $item = $item.Parent }
    if ($null -eq $item) { return $null }

    $probe = $item
    while ($null -ne $probe) {
        if (Test-Path -LiteralPath (Join-Path $probe.FullName '.git')) { return $probe.Name }
        $probe = $probe.Parent
    }
    return $item.Name
}

function Test-SystemPath {
    # A hook-launched PowerShell starts in System32, which is never a useful title.
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) { return $true }
    try { $full = (Resolve-Path -LiteralPath $Path -ErrorAction Stop).Path } catch { return $true }

    $windows = $env:SystemRoot
    if ([string]::IsNullOrWhiteSpace($windows)) { $windows = 'C:\Windows' }
    try { $windows = (Resolve-Path -LiteralPath $windows -ErrorAction Stop).Path } catch { }

    $trimmed = $full.TrimEnd('\')
    if ($trimmed -ieq $windows.TrimEnd('\')) { return $true }
    return $trimmed.StartsWith($windows.TrimEnd('\') + '\', [System.StringComparison]::OrdinalIgnoreCase)
}

function Get-HookCwd {
    # Hook events deliver their JSON payload on stdin. Only read it when stdin is
    # actually redirected, otherwise an interactive run would block on the console.
    if (-not [Console]::IsInputRedirected) { return $null }
    try {
        $raw = [Console]::In.ReadToEnd()
        if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
        return (ConvertFrom-Json $raw).cwd
    } catch {
        return $null
    }
}

try {
    if ([string]::IsNullOrWhiteSpace($Title)) {
        # First candidate that is neither empty nor a Windows system folder wins.
        $cwd = $null
        foreach ($candidate in @((Get-HookCwd), $env:CLAUDE_PROJECT_DIR, (Get-Location).Path)) {
            if (-not [string]::IsNullOrWhiteSpace($candidate) -and -not (Test-SystemPath $candidate)) {
                $cwd = $candidate
                break
            }
        }

        if (-not [string]::IsNullOrWhiteSpace($cwd)) { $Title = Get-RepoName $cwd }
        if ([string]::IsNullOrWhiteSpace($Title)) { $Title = 'claude' }
    }

    # Troubleshooting aid: set CLAUDE_NOTIFY_DEBUG=1 to echo what was resolved.
    # Goes to stderr so it never lands in a Stop hook's stdout, which Claude reads as context.
    if ($env:CLAUDE_NOTIFY_DEBUG) {
        [Console]::Error.WriteLine("notify.ps1: title='$Title' message='$Message'")
    }

    if ($env:CLAUDE_NOTIFY_DRYRUN) { exit 0 }

    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $notifyIcon = New-Object System.Windows.Forms.NotifyIcon
    try {
        $notifyIcon.Icon = [System.Drawing.SystemIcons]::Information
        $notifyIcon.Visible = $true
        $notifyIcon.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
        $notifyIcon.BalloonTipTitle = $Title
        $notifyIcon.BalloonTipText = $Message
        $notifyIcon.ShowBalloonTip($DurationSeconds * 1000)

        # The balloon lives only as long as the icon does, so hold the process open.
        Start-Sleep -Seconds $DurationSeconds
    } finally {
        $notifyIcon.Visible = $false
        $notifyIcon.Dispose()
    }
} catch {
    Write-Host "notify.ps1: toast suppressed -- $($_.Exception.Message)"
}

exit 0
