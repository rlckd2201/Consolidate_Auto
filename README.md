# Consolidate_Auto

특근계획 회신자료를 취합해 담당자용 전자결재 초안, 관리자용 검토 화면, 보고자료 Excel/PPT 산출로 이어가기 위한 웹 초안입니다.

## 실행

```powershell
powershell -ExecutionPolicy Bypass -File .\start_overtime_server.ps1
```

브라우저:

```text
http://localhost:8090
```

운영서버에서는:

```text
http://172.17.39.121:8090
```

## 현재 포함된 초안 기능

- 담당자 입력 화면
- 관리자 통합 검토 대시보드
- PPT 반영값 미리보기
- 그룹웨어 전자결재 본문 미리보기
- `fill-approval-draft` API 자리만 확보

## 중요한 정책

- 그룹웨어는 상신하지 않는다.
- draft fill은 작성 화면 자동입력 보조만 의미한다.
- Excel/PPT는 같은 검토 데이터에서 생성한다.
- 기존 회계 WEB `8080`과 분리해 `8090`에서 실행한다.
- 실행 스크립트는 `.venv`를 만들어 사용하므로 기존 회계 WEB Python 환경과 분리된다.
취합업무 자동화
