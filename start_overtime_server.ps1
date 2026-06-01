$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

python -m uvicorn backend.app:app --host 0.0.0.0 --port 8090
