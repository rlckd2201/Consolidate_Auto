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
$env:HR_DB_NAME = "<schema-name>"
```

Read-only rule:
- Only `SELECT` and metadata inspection.
- No mutation SQL.
- No stored procedures with side effects.

Still needed before live HR mapping:
- schema/database name
- table names
- column names for name, employee id, company, factory, team, job group, position, active flag

## Business Numbers
- 더원: `421-86-02723`
- 제이엠: `125-81-54876`
