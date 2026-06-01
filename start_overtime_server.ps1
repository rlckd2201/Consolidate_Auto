$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$VenvPython = Join-Path $Root ".venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
  python -m venv .venv
  & $VenvPython -m pip install -r .\backend\requirements.txt
}

& $VenvPython -m uvicorn backend.app:app --host 0.0.0.0 --port 8090
