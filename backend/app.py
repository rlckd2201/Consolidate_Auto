from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


APP_VERSION = "0.1.0"
ROOT = Path(__file__).resolve().parent
STATIC_DIR = ROOT / "static"
DATA_DIR = ROOT / "data"
STATE_PATH = DATA_DIR / "app_state.json"
GENERATED_DIR = ROOT / "generated"


class Period(BaseModel):
    id: str
    label: str
    start_date: str
    end_date: str
    weekend_dates: list[str]
    reference_dates: list[str]
    status: str = "open"


class LegalEntity(BaseModel):
    entity_code: str
    display_name: str
    factory_label: str
    default_overtime_form_label: str
    active: bool = True
    note: str = ""


class OvertimeRow(BaseModel):
    id: str
    date: str
    company: str
    source_factory: str
    target_factory: str = ""
    job_group: Literal["직접직", "간접직", "관리직"]
    team: str
    name: str = ""
    position: str = ""
    headcount: int = Field(ge=0)
    hours: float = Field(ge=0)
    category1: str
    category2: str = ""
    detail: str
    reason: str = ""
    confidence: Literal["high", "medium", "low"] = "high"
    review_status: Literal["mapped", "needs_review", "reviewed"] = "mapped"
    source: str = "seed"


class Submission(BaseModel):
    id: str
    period_id: str
    submitter: str
    entity_code: str
    factory: str
    team: str
    status: Literal["draft", "submitted_for_admin_review", "returned", "admin_reviewed", "locked_for_report"] = "draft"
    groupware_draft_status: Literal["not_filled", "draft_filled", "draft_fill_failed", "adapter_pending"] = "not_filled"
    rows: list[OvertimeRow]
    attachments: list[str] = []
    updated_at: str


class SubmissionCreate(BaseModel):
    submitter: str = "담당자"
    entity_code: str = "daeseung"
    factory: str = "D3공장"
    team: str = "생산"
    rows: list[OvertimeRow]


class State(BaseModel):
    periods: list[Period]
    legal_entities: list[LegalEntity]
    submissions: list[Submission]


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _seed_state() -> State:
    period = Period(
        id="2026-05-W5",
        label="2026년 5월 5주차",
        start_date="2026-05-30",
        end_date="2026-06-03",
        weekend_dates=["2026-05-30", "2026-05-31"],
        reference_dates=["2026-06-03"],
    )
    entities = [
        LegalEntity(entity_code="daeseung", display_name="대승", factory_label="D1/D2/D3공장", default_overtime_form_label="대승 - 특근계획서"),
        LegalEntity(entity_code="daeseung_precision", display_name="대승정밀", factory_label="P1/P2/P3/P4공장", default_overtime_form_label="대승정밀 - 특근계획서"),
        LegalEntity(entity_code="theone", display_name="더원", factory_label="더원공장", default_overtime_form_label="더원 - 특근계획서"),
        LegalEntity(entity_code="ilgang", display_name="일강", factory_label="일강1/2공장", default_overtime_form_label="일강 - 특근계획서"),
        LegalEntity(entity_code="jm", display_name="제이엠", factory_label="제이엠공장", default_overtime_form_label="제이엠 - 특근계획서", note="현재 특근 발생 가능성 낮음"),
    ]
    rows = [
        OvertimeRow(id="r-001", date="2026-05-30", company="대승", source_factory="D2공장", job_group="관리직", team="보전", name="송인섭", position="마스터", headcount=1, hours=4, category1="유지보수", category2="설비유지보수", detail="승용컷팅 콜렛척 가이드 교체"),
        OvertimeRow(id="r-002", date="2026-05-30", company="대승", source_factory="D2공장", job_group="관리직", team="물류", name="박광덕", position="매니저", headcount=1, hours=4, category1="납품대응", category2="고객사 납품", detail="고객사 납품대응 및 창고정리"),
        OvertimeRow(id="r-003", date="2026-05-30", company="대승", source_factory="D3공장", job_group="간접직", team="보전", headcount=2, hours=8, category1="유지보수", category2="설비유지보수", detail="PHB 세척기, RO수 Lay-OUT 변경 및 정상화"),
        OvertimeRow(id="r-004", date="2026-06-03", company="대승정밀", source_factory="P3공장", job_group="관리직", team="품질", name="김박동", position="책임", headcount=1, hours=8, category1="납품용기/제품관리", category2="제품조사", detail="개선누 TAP BURR 밀림 조사"),
        OvertimeRow(id="r-005", date="2026-06-03", company="대승정밀", source_factory="P3공장", job_group="관리직", team="생관", name="고두형", position="매니저", headcount=1, hours=8, category1="기타", category2="재물조사", detail="P4공장 재물실사", confidence="medium"),
        OvertimeRow(id="r-006", date="2026-05-31", company="일강", source_factory="일강2공장", job_group="관리직", team="가공생산", name="최태호", position="마스터", headcount=1, hours=8, category1="생산지원", category2="가공생산", detail="가공라인 지원"),
    ]
    submission = Submission(
        id="sub-001",
        period_id=period.id,
        submitter="샘플 담당자",
        entity_code="daeseung",
        factory="D3공장",
        team="생산",
        rows=rows,
        attachments=["D2공장 특근계획서.pdf", "D3공장 특근 상세.xlsx"],
        updated_at=_now(),
    )
    return State(periods=[period], legal_entities=entities, submissions=[submission])


def load_state() -> State:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not STATE_PATH.exists():
        state = _seed_state()
        save_state(state)
        return state
    return State.model_validate(json.loads(STATE_PATH.read_text(encoding="utf-8")))


def save_state(state: State) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(state.model_dump_json(indent=2), encoding="utf-8")


def all_rows(state: State) -> list[OvertimeRow]:
    rows: list[OvertimeRow] = []
    for submission in state.submissions:
        rows.extend(submission.rows)
    return rows


def summarize(rows: list[OvertimeRow], period: Period | None = None) -> dict:
    total = sum(row.headcount for row in rows)
    weekend_dates = set(period.weekend_dates if period else [])
    weekend_total = sum(row.headcount for row in rows if row.date in weekend_dates)
    reference_total = total - weekend_total
    by_category: dict[str, int] = {}
    by_factory: dict[str, int] = {}
    by_date: dict[str, int] = {}
    unresolved = 0
    for row in rows:
        by_category[row.category1] = by_category.get(row.category1, 0) + row.headcount
        by_factory[row.source_factory] = by_factory.get(row.source_factory, 0) + row.headcount
        by_date[row.date] = by_date.get(row.date, 0) + row.headcount
        if row.review_status == "needs_review" or row.confidence == "low":
            unresolved += 1
    return {
        "total_headcount": total,
        "weekend_headcount": weekend_total,
        "reference_headcount": reference_total,
        "by_category": by_category,
        "by_factory": by_factory,
        "by_date": by_date,
        "unresolved_rows": unresolved,
    }


def build_approval_title(submission: Submission, period: Period) -> str:
    return f"{submission.factory} {period.label} 특근계획서"


def build_approval_body(submission: Submission, period: Period) -> str:
    summary = summarize(submission.rows, period)
    row_html = "\n".join(
        "<tr>"
        f"<td>{row.date}</td><td>{row.source_factory}</td><td>{row.job_group}</td>"
        f"<td>{row.team}</td><td>{row.name or '-'}</td><td>{row.headcount}</td>"
        f"<td>{row.hours:g}</td><td>{row.category1}</td><td>{row.detail}</td>"
        "</tr>"
        for row in submission.rows
    )
    return f"""
<h3>{build_approval_title(submission, period)}</h3>
<p>아래와 같이 {period.label} 특근계획을 보고드립니다.</p>
<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;">
  <tr><th>구분</th><th>인원</th></tr>
  <tr><td>총 특근인원</td><td>{summary["total_headcount"]}명</td></tr>
  <tr><td>주말 특근인원</td><td>{summary["weekend_headcount"]}명</td></tr>
  <tr><td>참고일 포함 인원</td><td>{summary["reference_headcount"]}명</td></tr>
</table>
<br>
<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;">
  <tr><th>일자</th><th>공장</th><th>직군</th><th>팀</th><th>성명</th><th>인원</th><th>시간</th><th>분류</th><th>세부내용</th></tr>
  {row_html}
</table>
<p style="color:#666;">※ 본문은 자동 작성 초안이며, 그룹웨어 화면에서 확인 후 수동 상신합니다.</p>
""".strip()


app = FastAPI(title="특근 보고 취합 WEB", version=APP_VERSION)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
def health() -> dict:
    return {"ok": True, "version": APP_VERSION, "service": "overtime-reporting-web"}


@app.get("/api/version")
def version() -> dict:
    return {"product": "특근 보고 취합 WEB", "version": APP_VERSION}


@app.get("/api/bootstrap")
def bootstrap() -> dict:
    state = load_state()
    period = state.periods[0] if state.periods else None
    return {
        "periods": [p.model_dump() for p in state.periods],
        "legal_entities": [e.model_dump() for e in state.legal_entities],
        "submissions": [s.model_dump() for s in state.submissions],
        "dashboard": summarize(all_rows(state), period),
    }


@app.get("/api/dashboard")
def dashboard() -> dict:
    state = load_state()
    period = state.periods[0] if state.periods else None
    return summarize(all_rows(state), period)


@app.get("/api/submissions")
def submissions() -> list[dict]:
    return [s.model_dump() for s in load_state().submissions]


@app.post("/api/submissions")
def create_submission(payload: SubmissionCreate) -> dict:
    state = load_state()
    period = state.periods[0]
    new_id = f"sub-{len(state.submissions) + 1:03d}"
    submission = Submission(
        id=new_id,
        period_id=period.id,
        submitter=payload.submitter,
        entity_code=payload.entity_code,
        factory=payload.factory,
        team=payload.team,
        rows=payload.rows,
        updated_at=_now(),
    )
    state.submissions.append(submission)
    save_state(state)
    return submission.model_dump()


@app.get("/api/report/preview")
def report_preview() -> dict:
    state = load_state()
    period = state.periods[0]
    rows = all_rows(state)
    summary = summarize(rows, period)
    return {
        "period": period.model_dump(),
        "summary": summary,
        "slides": [
            {"slide": 2, "title": "주말 특근현황", "items": [{"label": "전체 특근인원", "value": summary["total_headcount"]}, {"label": "주말 특근현황", "value": summary["weekend_headcount"]}]},
            {"slide": 3, "title": "공장별 비생산부문 특근업무 세부", "items": [{"label": key, "value": value} for key, value in summary["by_category"].items()]},
            {"slide": 4, "title": "해외출장/재물조사 등 특이사항", "items": [{"label": row.source_factory, "value": row.detail} for row in rows if row.category2 in {"재물조사", "해외출장"}]},
        ],
    }


@app.post("/api/report/export-excel")
def export_excel_stub() -> dict:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    state = load_state()
    output = GENERATED_DIR / f"normalized_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output.write_text(state.model_dump_json(indent=2), encoding="utf-8")
    return {"ok": True, "message": "초안 단계에서는 JSON 기준 데이터로 저장했습니다. Excel 생성기는 다음 단계에서 연결합니다.", "path": str(output)}


@app.post("/api/report/export-ppt")
def export_ppt_stub() -> dict:
    return {"ok": False, "status": "adapter_pending", "message": "PPT 생성기는 검토 데이터 잠금 기능 다음 단계에서 연결합니다."}


@app.get("/api/overtime-submissions/{submission_id}/approval-preview")
def approval_preview(submission_id: str) -> dict:
    state = load_state()
    period = state.periods[0]
    submission = next((s for s in state.submissions if s.id == submission_id), None)
    if not submission:
        raise HTTPException(status_code=404, detail="submission not found")
    entity = next((e for e in state.legal_entities if e.entity_code == submission.entity_code), None)
    return {
        "submission_id": submission_id,
        "title": build_approval_title(submission, period),
        "body_html": build_approval_body(submission, period),
        "form_label": entity.default_overtime_form_label if entity else "",
        "submit_policy": "draft_only_never_auto_submit",
    }


@app.post("/api/overtime-submissions/{submission_id}/fill-approval-draft")
def fill_approval_draft_stub(submission_id: str) -> dict:
    state = load_state()
    submission = next((s for s in state.submissions if s.id == submission_id), None)
    if not submission:
        raise HTTPException(status_code=404, detail="submission not found")
    submission.groupware_draft_status = "adapter_pending"
    submission.updated_at = _now()
    save_state(state)
    return {
        "ok": False,
        "raw_status": "adapter_pending",
        "message": "그룹웨어 브라우저 자동입력 어댑터는 아직 연결 전입니다. 이 API는 상신을 수행하지 않습니다.",
        "submission": submission.model_dump(),
    }
