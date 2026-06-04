from __future__ import annotations

import json
import re
import zipfile
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


TARGET_DATE_TOKENS = (
    "2026-05-30",
    "2026-05-31",
    "2026-06-03",
    "05.30",
    "05.31",
    "06.03",
    "5.30",
    "5.31",
    "6.3",
    "5/30",
    "5/31",
    "6/3",
    "5월 30일",
    "5월 31일",
    "6월 3일",
)

TARGET_ISO_DATES = {"2026-05-30", "2026-05-31", "2026-06-03"}

KEYWORDS = (
    "특근",
    "특근인원",
    "인원",
    "시간",
    "M/H",
    "상세",
    "세부",
    "합계",
    "TOTAL",
    "관리직",
    "간접",
    "직접",
    "비생산",
    "생산",
    "보전",
    "물류",
    "품질",
    "설비",
    "납품",
    "유지보수",
    "재물",
    "출장",
    "청소",
    "지원",
)

CATEGORY_RULES = (
    ("유지보수", ("보전", "설비점검", "예방보전", "유지보수", "수리")),
    ("납품대응", ("납품", "물류", "출하", "창고", "고객사")),
    ("납품용기/제품관리", ("용기", "제품", "검사", "선별", "반송품", "제품조사")),
    ("설비/시설 청소", ("청소", "이형제", "시설")),
    ("행정업무", ("총무", "인사", "노사", "행정")),
    ("생산지원", ("생산지원", "라인지원", "가공라인", "주조라인")),
    ("기타", ("재물", "출장", "실사")),
)

JOB_GROUPS = ("관리직", "간접직", "직접직", "관리", "간접", "직접")


def now_id() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def norm(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    if hasattr(value, "strftime"):
        try:
            return value.strftime("%Y-%m-%d")
        except Exception:
            pass
    return str(value).replace("\n", " ").strip()


def rel(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def row_to_text(values: list[Any]) -> str:
    return " / ".join(text for text in (norm(value) for value in values) if text)


def contains_any(text: str, tokens: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(token.lower() in lowered for token in tokens)


def hits(text: str, tokens: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [token for token in tokens if token.lower() in lowered]


def role_guess(path: Path) -> str:
    name = path.name
    ext = path.suffix.lower()
    if ext == ".xls":
        return "legacy_xls_needs_conversion"
    if "52" in name or "근무시간" in name:
        return "work_hour_support"
    if "신고서" in name or "특근계획" in name:
        return "plan_declaration"
    if "상세" in name or "현황" in name or ext == ".xlsx":
        return "structured_candidate_source"
    if ext == ".pdf":
        return "approval_pdf_evidence"
    if ext == ".pptx":
        return "presentation_reference"
    return "unknown"


def extract_factory(text: str, fallback: str = "") -> str:
    for factory in ("D1공장", "D2공장", "D3공장", "P1공장", "P2공장", "P3공장", "P4공장", "일강1공장", "일강 1공장", "일강2공장", "일강 2공장", "더원공장", "제이엠공장"):
        if factory in text:
            return factory.replace("일강 1공장", "일강1공장").replace("일강 2공장", "일강2공장")
    for factory in ("1공장", "2공장"):
        if "일강" in text and factory in text:
            return f"일강{factory}"
    return fallback


def extract_date(text: str) -> str:
    explicit = re.search(r"20\d{2}[-./]\d{1,2}[-./]\d{1,2}", text)
    if explicit:
        parts = re.split(r"[-./]", explicit.group(0))
        return f"{int(parts[0]):04d}-{int(parts[1]):02d}-{int(parts[2]):02d}"
    mapped = {
        "5/30": "2026-05-30",
        "5.30": "2026-05-30",
        "05.30": "2026-05-30",
        "5월 30일": "2026-05-30",
        "5/31": "2026-05-31",
        "5.31": "2026-05-31",
        "05.31": "2026-05-31",
        "5월 31일": "2026-05-31",
        "6/3": "2026-06-03",
        "6.3": "2026-06-03",
        "06.03": "2026-06-03",
        "6월 3일": "2026-06-03",
    }
    for token, value in mapped.items():
        if token in text:
            return value
    return ""


def guess_category(text: str) -> str:
    for category, tokens in CATEGORY_RULES:
        if any(token in text for token in tokens):
            return category
    return "기타"


def normalize_job_group(value: str) -> str:
    if "관리" in value:
        return "관리직"
    if "직접" in value:
        return "직접직"
    if "간접" in value:
        return "간접직"
    return value or ""


def import_dependency_status() -> dict[str, bool]:
    status: dict[str, bool] = {}
    for name in ("openpyxl", "pypdf"):
        try:
            __import__(name)
            status[name] = True
        except Exception:
            status[name] = False
    return status


def file_inventory(reply_dir: Path) -> list[dict[str, Any]]:
    files = sorted([path for path in reply_dir.rglob("*") if path.is_file()], key=lambda p: (str(p.parent), p.name))
    items = []
    for path in files:
        stat = path.stat()
        items.append(
            {
                "folder": path.parent.name,
                "file": path.name,
                "path": str(path),
                "relative_path": rel(path, reply_dir.parent),
                "extension": path.suffix.lower(),
                "size_bytes": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
                "role_guess": role_guess(path),
            }
        )
    return items


def build_evidence(source: dict[str, Any], source_id: str, sheet_or_page: str, location: str, text: str, text_kind: str) -> dict[str, Any]:
    keyword_hits = hits(text, KEYWORDS)
    date_hits = hits(text, TARGET_DATE_TOKENS)
    return {
        "source_id": source_id,
        "source_file": source["file"],
        "source_path": source["relative_path"],
        "source_folder": source["folder"],
        "source_sheet_or_page": sheet_or_page,
        "source_location": location,
        "source_type": text_kind,
        "text": text[:12000],
        "text_chars": len(text),
        "keyword_hits": keyword_hits,
        "date_hits": date_hits,
        "current_period": bool(date_hits or contains_any(sheet_or_page, TARGET_DATE_TOKENS) or contains_any(source["file"], TARGET_DATE_TOKENS)),
        "factory_guess": extract_factory(f"{source['folder']} {source['file']} {sheet_or_page} {text}", source["folder"]),
    }


def extract_xlsx(source: dict[str, Any], source_index: int, reply_dir: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    try:
        import openpyxl
    except Exception as exc:
        return [], {"status": "dependency_missing", "error": f"openpyxl missing: {exc}"}

    path = Path(source["path"])
    evidence: list[dict[str, Any]] = []
    sheet_summaries: list[dict[str, Any]] = []
    try:
        workbook = openpyxl.load_workbook(path, data_only=True, read_only=True)
        for sheet_index, worksheet in enumerate(workbook.worksheets, start=1):
            evidence_lines: list[str] = []
            keyword_counter: Counter[str] = Counter()
            date_counter: Counter[str] = Counter()
            rows_scanned = 0
            non_empty = 0
            for row_number, row in enumerate(worksheet.iter_rows(max_row=220, max_col=60, values_only=True), start=1):
                rows_scanned += 1
                text = row_to_text(list(row))
                if not text:
                    continue
                non_empty += 1
                row_keywords = hits(text, KEYWORDS)
                row_dates = hits(text, TARGET_DATE_TOKENS)
                keyword_counter.update(row_keywords)
                date_counter.update(row_dates)
                if len(evidence_lines) < 42 and (row_keywords or row_dates or len(evidence_lines) < 4):
                    evidence_lines.append(f"R{row_number}: {text}")
            sheet_summary = {
                "sheet": worksheet.title,
                "rows_scanned": rows_scanned,
                "non_empty_rows": non_empty,
                "keyword_hits": dict(keyword_counter.most_common(20)),
                "date_hits": dict(date_counter.most_common(20)),
                "current_period": bool(date_counter or contains_any(worksheet.title, TARGET_DATE_TOKENS)),
                "evidence_line_count": len(evidence_lines),
            }
            sheet_summaries.append(sheet_summary)
            if evidence_lines and (sheet_summary["current_period"] or keyword_counter):
                source_id = f"xlsx-{source_index:03d}-{sheet_index:03d}"
                text = "\n".join(
                    [
                        f"file={source['file']}",
                        f"sheet={worksheet.title}",
                        f"folder={source['folder']}",
                        *evidence_lines,
                    ]
                )
                evidence.append(build_evidence(source, source_id, worksheet.title, f"sheet:{worksheet.title}", text, "xlsx_sheet"))
    except Exception as exc:
        return evidence, {"status": "error", "error": repr(exc), "sheets": sheet_summaries}
    return evidence, {"status": "ok", "sheets": sheet_summaries, "sheet_count": len(sheet_summaries)}


def extract_pdf(source: dict[str, Any], source_index: int) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    try:
        from pypdf import PdfReader
    except Exception as exc:
        return [], {"status": "dependency_missing", "error": f"pypdf missing: {exc}"}

    path = Path(source["path"])
    evidence: list[dict[str, Any]] = []
    pages: list[dict[str, Any]] = []
    try:
        reader = PdfReader(str(path))
        for page_index, page in enumerate(reader.pages, start=1):
            text = " ".join((page.extract_text() or "").split())
            page_summary = {
                "page": page_index,
                "text_chars": len(text),
                "keyword_hits": hits(text, KEYWORDS),
                "date_hits": hits(text, TARGET_DATE_TOKENS),
                "current_period": contains_any(text, TARGET_DATE_TOKENS),
            }
            pages.append(page_summary)
            if text and (page_summary["keyword_hits"] or page_summary["date_hits"]):
                source_id = f"pdf-{source_index:03d}-{page_index:03d}"
                evidence.append(build_evidence(source, source_id, f"p{page_index}", f"page:{page_index}", text, "pdf_page"))
    except Exception as exc:
        return evidence, {"status": "error", "error": repr(exc), "pages": pages}
    return evidence, {"status": "ok", "pages": pages, "page_count": len(pages)}


def extract_pptx(source: dict[str, Any], source_index: int) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    path = Path(source["path"])
    evidence: list[dict[str, Any]] = []
    slides: list[dict[str, Any]] = []
    try:
        with zipfile.ZipFile(path) as archive:
            names = sorted(
                [name for name in archive.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", name)],
                key=lambda name: int(re.search(r"slide(\d+)\.xml", name).group(1)),
            )
            ns = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
            for slide_index, name in enumerate(names, start=1):
                root = ET.fromstring(archive.read(name))
                text_parts = [node.text.strip() for node in root.findall(".//a:t", ns) if node.text and node.text.strip()]
                text = " ".join(text_parts)
                slide_summary = {
                    "slide": slide_index,
                    "text_chars": len(text),
                    "keyword_hits": hits(text, KEYWORDS),
                    "date_hits": hits(text, TARGET_DATE_TOKENS),
                    "current_period": contains_any(text, TARGET_DATE_TOKENS),
                }
                slides.append(slide_summary)
                if text and (slide_summary["keyword_hits"] or slide_summary["date_hits"]):
                    source_id = f"pptx-{source_index:03d}-{slide_index:03d}"
                    evidence.append(build_evidence(source, source_id, f"slide {slide_index}", f"slide:{slide_index}", text, "pptx_slide"))
    except Exception as exc:
        return evidence, {"status": "error", "error": repr(exc), "slides": slides}
    return evidence, {"status": "ok", "slides": slides, "slide_count": len(slides)}


LABELED_ROW_PATTERN = re.compile(
    r"(?:부서명\s*)?(?P<team>[^/\n]{1,30})\s*/\s*(?:직군\s*)?(?P<job>관리직|간접직|직접직|관리|간접|직접)\s*/.*?(?:업무명\s*)?(?P<work>[^/\n]{1,60})\s*/\s*(?:상세\s*내역\s*)?(?P<detail>[^/\n]{1,120})\s*/\s*(?:인원\s*)?(?P<headcount>\d+)\s*/\s*(?:시간\s*)?(?P<hours>\d+(?:\.\d+)?)",
    flags=re.IGNORECASE,
)


def local_candidates_from_evidence(evidence_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str, str, str]] = set()
    for item in evidence_items:
        if not item.get("current_period"):
            continue
        text = item["text"]
        date = extract_date(text)
        if date and date not in TARGET_ISO_DATES:
            continue
        source_factory = extract_factory(text, item.get("factory_guess", ""))
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            match = LABELED_ROW_PATTERN.search(line)
            if not match:
                continue
            team = re.sub(r"^R\d+:\s*", "", match.group("team")).strip()
            job_group = normalize_job_group(match.group("job"))
            detail = match.group("detail").strip()
            headcount = match.group("headcount")
            hours = match.group("hours")
            try:
                headcount_number = float(headcount)
                hours_number = float(hours)
            except ValueError:
                continue
            if not (0 < headcount_number <= 200 and 0 < hours_number <= 24):
                continue
            if team.isnumeric() or detail.isnumeric() or team in {"NO.", "NO", "직군", "현장직"}:
                continue
            if not any(token in line for token in ("부서", "직군", "업무", "상세", "관리직", "간접직", "직접직")):
                continue
            key = (item["source_id"], date, team, headcount, detail)
            if key in seen:
                continue
            seen.add(key)
            candidates.append(
                {
                    "source_id": item["source_id"],
                    "date": date,
                    "source_factory": source_factory,
                    "target_factory": "",
                    "team": team,
                    "name": "",
                    "job_group": job_group,
                    "headcount": headcount,
                    "hours": hours,
                    "detail": detail,
                    "category_guess": guess_category(f"{team} {match.group('work')} {detail}"),
                    "confidence": "medium",
                    "evidence": line[:500],
                    "needs_review_reason": "local_regex_candidate_confirm_before_report",
                }
            )
    return candidates


def run_reply_import(reply_dir: Path, period_label: str = "2026년 5월 5주차") -> dict[str, Any]:
    run_id = f"imp-{now_id()}"
    reply_dir = reply_dir.resolve()
    started_at = datetime.now().isoformat(timespec="seconds")
    inventory = file_inventory(reply_dir)
    evidence_items: list[dict[str, Any]] = []
    sources: list[dict[str, Any]] = []

    for source_index, source in enumerate(inventory, start=1):
        ext = source["extension"]
        extracted: list[dict[str, Any]] = []
        details: dict[str, Any]
        if ext == ".xlsx":
            extracted, details = extract_xlsx(source, source_index, reply_dir)
        elif ext == ".pdf":
            extracted, details = extract_pdf(source, source_index)
        elif ext == ".pptx":
            extracted, details = extract_pptx(source, source_index)
        elif ext == ".xls":
            details = {
                "status": "unsupported",
                "error": "legacy .xls requires resave to .xlsx or controlled Excel COM conversion",
            }
        else:
            details = {"status": "skipped", "error": f"unsupported extension {ext}"}
        evidence_items.extend(extracted)
        sources.append(
            {
                **source,
                "extract_status": details.get("status", "unknown"),
                "extract_error": details.get("error", ""),
                "evidence_count": len(extracted),
                "details": details,
            }
        )

    extension_counts = Counter(item["extension"] for item in inventory)
    folder_counts = Counter(item["folder"] for item in inventory)
    status_counts = Counter(item["extract_status"] for item in sources)
    evidence_type_counts = Counter(item["source_type"] for item in evidence_items)
    current_evidence_count = sum(1 for item in evidence_items if item["current_period"])
    local_candidates = local_candidates_from_evidence(evidence_items)
    finished_at = datetime.now().isoformat(timespec="seconds")
    return {
        "run_id": run_id,
        "period_label": period_label,
        "reply_dir": str(reply_dir),
        "started_at": started_at,
        "finished_at": finished_at,
        "mode": "local_extract_only",
        "dependency_status": import_dependency_status(),
        "summary": {
            "file_count": len(inventory),
            "extension_counts": dict(extension_counts),
            "folder_counts": dict(folder_counts),
            "extract_status_counts": dict(status_counts),
            "evidence_count": len(evidence_items),
            "current_period_evidence_count": current_evidence_count,
            "evidence_type_counts": dict(evidence_type_counts),
            "local_candidate_count": len(local_candidates),
            "unsupported_count": status_counts.get("unsupported", 0),
        },
        "sources": sources,
        "evidence_items": evidence_items,
        "local_candidate_rows": local_candidates,
        "ai": {
            "enabled": False,
            "candidate_rows": [],
            "source_assessment": [],
            "conflicts": [],
            "questions_for_human": [],
            "abstentions": [],
            "errors": [],
            "usage_metadata": [],
        },
        "review_policy": "candidate_rows_are_not_final_report_data_until_human_review_lock",
    }


def save_run(run: dict[str, Any], output_dir: Path) -> dict[str, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    run_path = output_dir / f"{run['run_id']}.json"
    latest_path = output_dir / "latest.json"
    text = json.dumps(run, ensure_ascii=False, indent=2)
    run_path.write_text(text, encoding="utf-8")
    latest_path.write_text(text, encoding="utf-8")
    return {"run_path": str(run_path), "latest_path": str(latest_path)}


def load_latest(output_dir: Path) -> dict[str, Any] | None:
    latest_path = output_dir / "latest.json"
    if not latest_path.exists():
        return None
    return json.loads(latest_path.read_text(encoding="utf-8"))
