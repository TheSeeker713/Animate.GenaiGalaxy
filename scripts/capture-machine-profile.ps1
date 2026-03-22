# Capture basic Windows hardware info for choosing local LLMs. Safe to run locally.
$out = Join-Path $PSScriptRoot "..\docs\MACHINE_PROFILE.generated.md"
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty Name
$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
$os = (Get-CimInstance Win32_OperatingSystem).Caption
$gpus = Get-CimInstance Win32_VideoController | ForEach-Object { "$($_.Name) (VRAM driver reported: $($_.AdapterRAM))" }
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'" | ForEach-Object {
  "C: free {0} GB / {1} GB" -f [math]::Round($_.FreeSpace / 1GB, 1), [math]::Round($_.Size / 1GB, 1)
}
$models = "D:/models"
$modelNote = if (Test-Path $models) {
  $dirs = Get-ChildItem $models -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
  "Folders: " + ($dirs -join ", ")
} else { "D:/models not found or not accessible." }

@"
# Machine profile (generated)

- **OS**: $os
- **CPU**: $cpu
- **RAM**: ${ram} GB
- **GPU**: $($gpus -join '; ')
- **Disk**: $disk
- **Models root**: $models — $modelNote

Use RAM/VRAM to choose GGUF quantization (e.g. Q4 for tight RAM, Q8 where you have headroom).

Generated: $(Get-Date -Format o)
"@ | Set-Content -Encoding utf8 $out
Write-Host "Wrote $out"
