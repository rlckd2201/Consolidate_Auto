$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

python -m pip install -r .\backend\requirements.txt
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8090
