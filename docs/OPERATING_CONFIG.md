# Operating Config

## Ports
- Existing accounting WEB uses `8080`; do not use it.
- This app uses `8090`.

## Template And Output Paths

Set these only if the defaults are not suitable.

```powershell
$env:CONSOLIDATE_TEMPLATE_DIR = "C:\path\to\보고자료"
$env:CONSOLIDATE_OUTPUT_ROOT = "C:\ERP_DB\Consolidate_Auto"
```

Default behavior:
- If `C:\ERP_DB` exists, output root is `C:\ERP_DB\Consolidate_Auto`.
- Otherwise output root is `%APPDATA%\Consolidate_Auto`.
- Local template default is the sibling `보고자료` folder beside `overtime_web`.

The app copies templates before writing. It must not modify original files in `보고자료`.

## HR MariaDB

Use environment variables. Do not commit secrets.

```powershell
$env:HR_DB_HOST = "172.16.19.33"
$env:HR_DB_PORT = "3306"
$env:HR_DB_USER = "dlpadmin2"
$env:HR_DB_PASSWORD = "<secret>"
$env:HR_DB_NAME = "ksystem_yundong"
```

The app reads these variables at server startup. If they are missing, the web UI still runs but HR employee lookup returns an unavailable state.

Read-only rule:
- Only `SELECT` and metadata inspection.
- No mutation SQL.
- No stored procedures with side effects.

Still needed before live HR mapping:
- live connector endpoint and UI disambiguation flow
- duplicate-name handling
- final confirmation for `binum=4` split: `JM서울` + `더원-*` departments as 더원공장, `JM평택` as 제이엠공장

Inspected table basis:
- Employee table: `ds_t_emp`
- Organization table: `buseo_t`
- Detailed notes: root `HR_DB_ANALYSIS.md`

Live read-only endpoints:
- `GET /api/hr/status`
- `GET /api/hr/employees/search?q=<name>&entity_code=<code>&factory=<factory>`

## Business Numbers
- 더원: `421-86-02723`
- 제이엠: `125-81-54876`

## Gemini AI Evidence Triage

Use environment variables. Do not commit API keys.

```powershell
$env:GEMINI_API_KEY = "<secret>"
$env:GEMINI_MODEL = "gemini-2.5-flash"
```

Live endpoints:
- `GET /api/ai/gemini/status`
- `POST /api/ai/gemini/analyze-evidence`

Policy:
- Gemini output is candidate evidence only.
- Do not create final Excel/PPT directly from AI output.
- Final reporting requires a human-confirmed locked dataset.
- Do not send real employee names, HR details, or confidential overtime evidence to an external API unless the organization approves that data transfer.
