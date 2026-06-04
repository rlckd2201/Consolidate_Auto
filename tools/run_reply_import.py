from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.reply_import import run_reply_import, save_run  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run reply-material import pipeline locally.")
    parser.add_argument("--retry-run", default="", help="Existing import run JSON whose failed Gemini batches should be retried.")
    parser.add_argument("--reply-dir", default=str(REPO_ROOT.parent / "회신자료"), help="Reply-material folder to scan.")
    parser.add_argument("--out-dir", default=str(REPO_ROOT.parent / "reply_import_runs"), help="Output directory for run JSON.")
    parser.add_argument("--period-label", default="2026년 5월 5주차", help="Period label passed into the import run.")
    parser.add_argument("--allow-gemini", action="store_true", help="Send selected real evidence to the configured Gemini API endpoint.")
    parser.add_argument("--ai-url", default="", help="Full Gemini analyze endpoint URL, e.g. http://server:8090/api/ai/gemini/analyze-evidence")
    parser.add_argument("--max-ai-sources", type=int, default=24, help="Maximum evidence blocks to send to Gemini.")
    parser.add_argument("--ai-batch-size", type=int, default=3, help="Evidence blocks per Gemini request.")
    parser.add_argument("--ai-selection", choices=["balanced", "ordered"], default="balanced", help="How to choose evidence blocks for Gemini.")
    parser.add_argument("--include-auxiliary-ai-sources", action="store_true", help="Include auxiliary files such as 52-hour status workbooks in Gemini input.")
    parser.add_argument("--ai-retries", type=int, default=2, help="Retry count for transient Gemini batch failures.")
    parser.add_argument("--ai-retry-delay", type=float, default=5.0, help="Initial seconds to wait before retrying a failed Gemini batch.")
    parser.add_argument("--request-timeout", type=int, default=180, help="Seconds to wait for each Gemini request.")
    parser.add_argument("--quiet", action="store_true", help="Suppress progress logs and print only the final JSON.")
    parser.add_argument("--print-summary", action="store_true", help="Print compact JSON summary.")
    return parser.parse_args()


def progress(message: str, quiet: bool = False) -> None:
    if quiet:
        return
    print(f"[{time.strftime('%H:%M:%S')}] {message}", flush=True)


def count_by(items: list[dict], key: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        value = str(item.get(key) or "기타")
        counts[value] = counts.get(value, 0) + 1
    return counts


def source_sort_key(value: str) -> tuple[int, str]:
    order = {
        "D1공장": 1,
        "D2공장": 2,
        "D3공장": 3,
        "P1공장": 4,
        "P2공장": 5,
        "P3공장": 6,
        "P4공장": 7,
        "일강1공장": 8,
        "일강2공장": 9,
    }
    return (order.get(value, 99), value)


def sheet_relevance_penalty(item: dict) -> int:
    sheet = str(item.get("source_sheet_or_page", ""))
    source_file = str(item.get("source_file", ""))
    text = f"{source_file} {sheet}"
    if "전주" in sheet:
        return 9
    if "예제" in sheet or "sample" in text.lower():
        return 9
    if "CEO" in sheet or "보고" in sheet:
        return 7
    if "52시간" in sheet:
        return 5
    if any(token in sheet for token in ("5.30", "5.31", "6.3", "토", "일", "수")):
        return 0
    if "공장" in sheet:
        return 1
    if any(token in sheet for token in ("관리직", "근무", "특근", "계획", "상세")):
        return 2
    return 3


def evidence_rank(item: dict) -> tuple[int, int, int, str, str]:
    priority = {"xlsx_sheet": 0, "pdf_page": 1, "pptx_slide": 2}
    return (
        priority.get(item.get("source_type", ""), 9),
        0 if item.get("current_period") else 1,
        sheet_relevance_penalty(item),
        item.get("source_file", ""),
        item.get("source_sheet_or_page", ""),
    )


def is_auxiliary_evidence(item: dict) -> bool:
    source_file = str(item.get("source_file", ""))
    sheet = str(item.get("source_sheet_or_page", ""))
    if "식수" in sheet:
        return True
    if "주 52시간" in source_file and "특근" not in source_file:
        return True
    if "52시간" in source_file and "특근" not in source_file:
        return True
    if "전주" in sheet:
        return True
    if "CEO" in sheet:
        return True
    if sheet == "예제":
        return True
    if sheet.endswith("주") and sheet[:-1].isdigit():
        return True
    return False


def select_ai_evidence(run: dict, max_items: int, selection: str = "balanced", include_auxiliary: bool = False) -> list[dict]:
    current = [item for item in run.get("evidence_items", []) if item.get("current_period")]
    pool = current or run.get("evidence_items", [])
    if not include_auxiliary:
        pool = [item for item in pool if not is_auxiliary_evidence(item)]
    pool = sorted(pool, key=evidence_rank)
    if selection == "ordered":
        return pool[:max_items]

    groups: dict[str, list[dict]] = {}
    for item in pool:
        group = item.get("source_folder") or "기타"
        groups.setdefault(group, []).append(item)
    selected: list[dict] = []
    group_names = sorted(groups, key=source_sort_key)
    while len(selected) < max_items and group_names:
        next_group_names: list[str] = []
        for group in group_names:
            if groups[group] and len(selected) < max_items:
                selected.append(groups[group].pop(0))
            if groups[group]:
                next_group_names.append(group)
        group_names = next_group_names
    return selected


def normalized_category(row: dict) -> str:
    value = str(row.get("category_guess") or row.get("job_group") or "").strip().lower()
    if not value:
        return "검토필요"
    if any(token in value for token in ("non_production", "비생산", "관리직")):
        return "비생산"
    if any(token in value for token in ("indirect", "간접", "보전", "품질", "물류")):
        return "간접직"
    if any(token in value for token in ("direct", "직접", "production", "생산")):
        return "직접직"
    return "검토필요"


def normalize_candidate_row(row: dict) -> dict:
    normalized = dict(row)
    normalized["category_raw"] = row.get("category_guess", "")
    normalized["category_normalized"] = normalized_category(row)
    return normalized


def post_json(url: str, body: dict, timeout: int) -> dict:
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def post_gemini_batch(
    ai_url: str,
    period_label: str,
    context: dict,
    batch: list[dict],
    request_timeout: int,
    retries: int,
    retry_delay: float,
    quiet: bool,
    label: str,
) -> tuple[dict | None, dict | None, float]:
    body = {
        "period_label": period_label,
        "context": context,
        "evidence": [
            {
                "source_id": item.get("source_id", ""),
                "source_file": item.get("source_file", ""),
                "source_sheet_or_page": item.get("source_sheet_or_page", ""),
                "source_location": item.get("source_location", ""),
                "text": item.get("text", ""),
            }
            for item in batch
        ],
    }
    started = time.perf_counter()
    last_error: dict | None = None
    for attempt in range(1, retries + 2):
        try:
            return post_json(ai_url, body, request_timeout), None, time.perf_counter() - started
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            last_error = {"status_code": exc.code, "detail": detail[:1000]}
            if attempt <= retries:
                delay = retry_delay * attempt
                progress(f"{label} retry {attempt}/{retries} after HTTP {exc.code}; waiting {delay:.1f}s", quiet)
                time.sleep(delay)
                continue
            break
        except Exception as exc:
            last_error = {"detail": f"{type(exc).__name__}: {str(exc)[:1000]}"}
            if attempt <= retries:
                delay = retry_delay * attempt
                progress(f"{label} retry {attempt}/{retries} after {type(exc).__name__}; waiting {delay:.1f}s", quiet)
                time.sleep(delay)
                continue
            break
    return None, last_error, time.perf_counter() - started


def gemini_context() -> dict:
    return {
        "rule_1": "AI output is candidate evidence only; never final report truth.",
        "rule_2": "관리직은 비생산으로 본다.",
        "rule_3": "직접직은 실제 생산부서만 해당한다. 생산관리/생산기술은 직접직으로 단정하지 않는다.",
        "rule_4": "source_factory와 target_factory가 불명확하면 target_factory를 비우거나 N/A로 두고 검토 필요 사유를 남긴다.",
    }


def append_gemini_result(ai: dict, parsed: dict, batch: list[dict], batch_label: int | str) -> int:
    before_candidates = len(ai["candidate_rows"])
    for row in parsed.get("candidate_rows", []):
        ai["candidate_rows"].append(
            normalize_candidate_row({**row, "ai_batch": batch_label, "source_ids": [item.get("source_id") for item in batch]})
        )
    ai["source_assessment"].extend(parsed.get("source_assessment", []))
    ai["conflicts"].extend(parsed.get("conflicts", []))
    ai["questions_for_human"].extend(parsed.get("questions_for_human", []))
    ai["abstentions"].extend(parsed.get("abstentions", []))
    return len(ai["candidate_rows"]) - before_candidates


def update_ai_summary(run: dict) -> None:
    ai = run.setdefault("ai", {})
    run.setdefault("summary", {})
    run["summary"]["ai_evidence_sent_count"] = ai.get("evidence_sent_count", 0)
    run["summary"]["ai_candidate_count"] = len(ai.get("candidate_rows", []))
    run["summary"]["ai_error_count"] = len(ai.get("errors", []))
    run["summary"]["ai_normalized_category_counts"] = count_by(ai.get("candidate_rows", []), "category_normalized")


def retry_failed_gemini_batches(
    run: dict,
    ai_url: str,
    period_label: str,
    request_timeout: int,
    retries: int,
    retry_delay: float,
    quiet: bool,
) -> None:
    if not ai_url:
        raise ValueError("--ai-url is required with --retry-run")
    ai = run.setdefault("ai", {})
    errors = list(ai.get("errors", []))
    if not errors:
        progress("no failed Gemini batches to retry", quiet)
        update_ai_summary(run)
        return
    ai.setdefault("candidate_rows", [])
    ai.setdefault("source_assessment", [])
    ai.setdefault("conflicts", [])
    ai.setdefault("questions_for_human", [])
    ai.setdefault("abstentions", [])
    ai.setdefault("usage_metadata", [])
    evidence_by_id = {item.get("source_id"): item for item in run.get("evidence_items", [])}
    context = gemini_context()
    remaining_errors: list[dict] = []
    progress(f"retry failed Gemini batches: {len(errors)} batch(es)", quiet)
    for index, error in enumerate(errors, start=1):
        source_ids = [source_id for source_id in error.get("source_ids", []) if source_id in evidence_by_id]
        batch = [evidence_by_id[source_id] for source_id in source_ids]
        batch_no = error.get("batch", index)
        source_label = ", ".join(source_ids)
        progress(f"retry batch {index}/{len(errors)} original={batch_no}: [{source_label}]", quiet)
        result, last_error, elapsed = post_gemini_batch(
            ai_url,
            period_label,
            context,
            batch,
            request_timeout,
            retries,
            retry_delay,
            quiet,
            f"retry batch {index}/{len(errors)}",
        )
        if result is None:
            remaining_errors.append({"batch": batch_no, **(last_error or {}), "source_ids": source_ids})
            status = f"HTTP {last_error.get('status_code')}" if last_error and last_error.get("status_code") else (last_error or {}).get("detail", "unknown error")
            progress(f"retry batch {index}/{len(errors)} error after {elapsed:.1f}s: {status}", quiet)
            continue
        parsed = result.get("result", {})
        added = append_gemini_result(ai, parsed, batch, f"retry-{batch_no}")
        ai["usage_metadata"].append(result.get("usage_metadata", {}))
        usage = result.get("usage_metadata", {})
        tokens = usage.get("totalTokenCount") or usage.get("total_tokens") or "-"
        progress(f"retry batch {index}/{len(errors)} ok after {elapsed:.1f}s: +{added} candidate(s), tokens={tokens}", quiet)
    ai["errors"] = remaining_errors
    retry_history = ai.setdefault("retry_history", [])
    retry_history.append(
        {
            "started_from_errors": len(errors),
            "remaining_errors": len(remaining_errors),
            "candidate_count_after_retry": len(ai.get("candidate_rows", [])),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
    )
    run["mode"] = "local_extract_plus_gemini_retry_failed"
    update_ai_summary(run)


def run_gemini_batches(
    run: dict,
    ai_url: str,
    period_label: str,
    max_sources: int,
    batch_size: int,
    selection: str,
    include_auxiliary: bool,
    retries: int,
    retry_delay: float,
    request_timeout: int,
    quiet: bool,
) -> None:
    if not ai_url:
        raise ValueError("--ai-url is required when --allow-gemini is used")
    if batch_size <= 0:
        raise ValueError("--ai-batch-size must be greater than 0")
    evidence = select_ai_evidence(run, max_sources, selection, include_auxiliary)
    total_batches = (len(evidence) + batch_size - 1) // batch_size if evidence else 0
    progress(
        f"AI enabled: selected {len(evidence)} evidence block(s), "
        f"selection={selection}, include_auxiliary={include_auxiliary}, "
        f"batch_size={batch_size}, batches={total_batches}",
        quiet,
    )
    progress(f"AI evidence folders: {count_by(evidence, 'source_folder')}", quiet)
    ai = run.setdefault("ai", {})
    ai.update(
        {
            "enabled": True,
            "url": ai_url,
            "candidate_rows": [],
            "source_assessment": [],
            "conflicts": [],
            "questions_for_human": [],
            "abstentions": [],
            "errors": [],
            "usage_metadata": [],
            "batch_count": 0,
            "evidence_sent_count": len(evidence),
            "selection": selection,
            "include_auxiliary_sources": include_auxiliary,
            "evidence_folder_counts": count_by(evidence, "source_folder"),
        }
    )
    context = {
        "rule_1": "AI output is candidate evidence only; never final report truth.",
        "rule_2": "관리직은 비생산으로 본다.",
        "rule_3": "직접직은 실제 생산부서만 해당한다. 생산관리/생산기술은 직접직으로 단정하지 않는다.",
        "rule_4": "source_factory와 target_factory가 불명확하면 target_factory를 비우거나 N/A로 두고 검토 필요 사유를 남긴다.",
    }
    for start in range(0, len(evidence), batch_size):
        batch = evidence[start : start + batch_size]
        ai["batch_count"] += 1
        batch_no = ai["batch_count"]
        source_ids = [str(item.get("source_id", "")) for item in batch]
        source_files = sorted({str(item.get("source_file", "")) for item in batch if item.get("source_file")})
        source_label = ", ".join(source_ids)
        file_label = " | ".join(source_files[:3])
        if len(source_files) > 3:
            file_label += f" (+{len(source_files) - 3} more)"
        progress(
            f"AI batch {batch_no}/{total_batches} start: "
            f"{len(batch)} evidence [{source_label}] {file_label}",
            quiet,
        )
        batch_started = time.perf_counter()
        body = {
            "period_label": period_label,
            "context": context,
            "evidence": [
                {
                    "source_id": item.get("source_id", ""),
                    "source_file": item.get("source_file", ""),
                    "source_sheet_or_page": item.get("source_sheet_or_page", ""),
                    "source_location": item.get("source_location", ""),
                    "text": item.get("text", ""),
                }
                for item in batch
            ],
        }
        result: dict | None = None
        last_error: dict | None = None
        for attempt in range(1, retries + 2):
            try:
                result = post_json(ai_url, body, request_timeout)
                break
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="replace")
                last_error = {"status_code": exc.code, "detail": detail[:1000]}
                if attempt <= retries:
                    delay = retry_delay * attempt
                    progress(
                        f"AI batch {batch_no}/{total_batches} retry {attempt}/{retries} "
                        f"after HTTP {exc.code}; waiting {delay:.1f}s",
                        quiet,
                    )
                    time.sleep(delay)
                    continue
                break
            except Exception as exc:
                last_error = {"detail": f"{type(exc).__name__}: {str(exc)[:1000]}"}
                if attempt <= retries:
                    delay = retry_delay * attempt
                    progress(
                        f"AI batch {batch_no}/{total_batches} retry {attempt}/{retries} "
                        f"after {type(exc).__name__}; waiting {delay:.1f}s",
                        quiet,
                    )
                    time.sleep(delay)
                    continue
                break
        if result is None:
            elapsed = time.perf_counter() - batch_started
            ai["errors"].append({"batch": batch_no, **(last_error or {}), "source_ids": [item.get("source_id") for item in batch]})
            status = f"HTTP {last_error.get('status_code')}" if last_error and last_error.get("status_code") else (last_error or {}).get("detail", "unknown error")
            progress(f"AI batch {batch_no}/{total_batches} error after {elapsed:.1f}s: {status}", quiet)
            continue
        parsed = result.get("result", {})
        before_candidates = len(ai["candidate_rows"])
        for row in parsed.get("candidate_rows", []):
            ai["candidate_rows"].append(normalize_candidate_row({**row, "ai_batch": batch_no, "source_ids": [item.get("source_id") for item in batch]}))
        ai["source_assessment"].extend(parsed.get("source_assessment", []))
        ai["conflicts"].extend(parsed.get("conflicts", []))
        ai["questions_for_human"].extend(parsed.get("questions_for_human", []))
        ai["abstentions"].extend(parsed.get("abstentions", []))
        ai["usage_metadata"].append(result.get("usage_metadata", {}))
        elapsed = time.perf_counter() - batch_started
        usage = result.get("usage_metadata", {})
        tokens = usage.get("totalTokenCount") or usage.get("total_tokens") or "-"
        added = len(ai["candidate_rows"]) - before_candidates
        progress(
            f"AI batch {batch_no}/{total_batches} ok after {elapsed:.1f}s: "
            f"+{added} candidate(s), total_candidates={len(ai['candidate_rows'])}, tokens={tokens}",
            quiet,
        )
    run["mode"] = "local_extract_plus_gemini"
    run["summary"]["ai_evidence_sent_count"] = ai["evidence_sent_count"]
    run["summary"]["ai_candidate_count"] = len(ai["candidate_rows"])
    run["summary"]["ai_error_count"] = len(ai["errors"])
    run["summary"]["ai_normalized_category_counts"] = count_by(ai["candidate_rows"], "category_normalized")


def main() -> int:
    args = parse_args()
    started = time.perf_counter()
    out_dir = Path(args.out_dir).expanduser().resolve()
    if args.retry_run:
        retry_path = Path(args.retry_run).expanduser().resolve()
        if not retry_path.exists():
            print(f"retry run not found: {retry_path}", file=sys.stderr)
            return 2
        progress(f"retry run load: {retry_path}", args.quiet)
        run = json.loads(retry_path.read_text(encoding="utf-8"))
        original_run_id = str(run.get("run_id", retry_path.stem))
        run["parent_run_id"] = run.get("parent_run_id") or original_run_id
        run["run_id"] = f"{original_run_id}_retry_{time.strftime('%Y%m%d_%H%M%S')}"
        retry_failed_gemini_batches(
            run,
            args.ai_url,
            args.period_label,
            args.request_timeout,
            args.ai_retries,
            args.ai_retry_delay,
            args.quiet,
        )
        paths = save_run(run, out_dir)
        elapsed = time.perf_counter() - started
        progress(f"saved retry run JSON: {paths['run_path']}", args.quiet)
        progress(f"saved latest pointer: {paths['latest_path']}", args.quiet)
        progress(f"retry finished after {elapsed:.1f}s", args.quiet)
        summary = {
            "ok": True,
            "run_id": run["run_id"],
            "parent_run_id": run.get("parent_run_id"),
            "summary": run["summary"],
            "paths": paths,
        }
        if args.print_summary:
            print(json.dumps(summary, ensure_ascii=False, indent=2))
        else:
            print(json.dumps(summary, ensure_ascii=False))
        return 0

    reply_dir = Path(args.reply_dir).expanduser().resolve()
    if not reply_dir.exists():
        print(f"reply dir not found: {reply_dir}", file=sys.stderr)
        return 2
    progress(f"reply import start: reply_dir={reply_dir}", args.quiet)
    progress(f"output dir: {out_dir}", args.quiet)
    progress("local extraction start", args.quiet)
    run = run_reply_import(reply_dir, args.period_label)
    local_elapsed = time.perf_counter() - started
    summary_counts = run.get("summary", {})
    progress(
        "local extraction done "
        f"after {local_elapsed:.1f}s: "
        f"files={summary_counts.get('file_count', 0)}, "
        f"evidence={summary_counts.get('evidence_count', 0)}, "
        f"current_period={summary_counts.get('current_period_evidence_count', 0)}, "
        f"unsupported={summary_counts.get('unsupported_count', 0)}",
        args.quiet,
    )
    if args.allow_gemini:
        run_gemini_batches(
            run,
            args.ai_url,
            args.period_label,
            args.max_ai_sources,
            args.ai_batch_size,
            args.ai_selection,
            args.include_auxiliary_ai_sources,
            args.ai_retries,
            args.ai_retry_delay,
            args.request_timeout,
            args.quiet,
        )
    else:
        progress("AI disabled: local evidence inventory only", args.quiet)
    paths = save_run(run, out_dir)
    elapsed = time.perf_counter() - started
    progress(f"saved run JSON: {paths['run_path']}", args.quiet)
    progress(f"saved latest pointer: {paths['latest_path']}", args.quiet)
    progress(f"reply import finished after {elapsed:.1f}s", args.quiet)
    summary = {
        "ok": True,
        "run_id": run["run_id"],
        "summary": run["summary"],
        "paths": paths,
    }
    if args.print_summary:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(summary, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
