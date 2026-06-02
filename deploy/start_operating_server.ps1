$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not $env:CONSOLIDATE_OUTPUT_ROOT) {
  $env:CONSOLIDATE_OUTPUT_ROOT = "C:\ERP_DB\Consolidate_Auto"
}

$VenvPython = Join-Path $Root ".venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
  python -m venv .venv
}

& $VenvPython -m pip install -r .\backend\requirements.txt
& $VenvPython -m uvicorn backend.app:app --host 0.0.0.0 --port 8090
