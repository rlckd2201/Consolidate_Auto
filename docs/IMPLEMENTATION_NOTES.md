# Implementation Notes

## Scope
- 담당자용 특근계획 입력 화면
- 관리자용 통합 검토 대시보드
- PPT 보고자료 반영값 미리보기
- 그룹웨어 전자결재 본문 초안 preview

## Current MVP State
- FastAPI serves both APIs and static frontend.
- Data is seeded into `backend/data/app_state.json` on first run.
- `backend/data/app_state.json` is ignored by Git and treated as runtime state.
- Excel/PPT generation endpoints are placeholders.
- Groupware draft fill endpoint is a placeholder and never submits approval.

## Deployment
Use port `8090`.

```powershell
cd "C:\Users\Administrator\Desktop\특근보고_WEB"
git fetch origin main
git reset --hard origin/main
powershell -ExecutionPolicy Bypass -File .\deploy\start_operating_server.ps1
```

## Important Policies
- Do not use port `8080`; existing accounting web runs there.
- Do not treat groupware draft fill as submitted approval.
- Keep `더원/더원공장` and `제이엠/제이엠공장` in the legal entity master.
- Use the existing human-made report workbook as the category mapping reference.
