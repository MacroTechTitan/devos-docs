# Environment triage

Destination: Claude Code (Cursor)

```text
Environment problem: [symptom, exact error text, what changed recently].

Diagnose before changing anything:
1. Run: powershell -File C:\Dev\DevOS\workflows\dev-environment\scripts\sysinfo.ps1
2. Read the relevant config: %USERPROFILE%\.claude\settings.json, the repo's .claude\settings*.json, %APPDATA%\Cursor\User\settings.json, ~/.bashrc — whichever the symptom points at.
3. Identify which layer owns the symptom using C:\Dev\DevOS\workflows\dev-environment\docs\environment-map.md.

Then propose ONE change, with: what it changes, why it should fix this, how to verify, how to undo it. Wait for my approval before applying.

After applying: re-run sysinfo.ps1 and show the before/after difference for the affected item. Do not batch multiple environment changes.
```
