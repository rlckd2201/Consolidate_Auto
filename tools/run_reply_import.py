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
    parser.add_argument("--reply-dir", default=str(REPO_ROOT.parent / "회신자료"), help="Reply-material folder to scan.")
    parser.add_argument("--out-dir", default=str(REPO_ROOT.parent / "reply_import_runs"), help="Output directory for run JSON.")
    parser.add_argument("--period-label", default="2026년 5월 5주차", help="Period label passed into the import run.")
    parser.add_argument("--allow-gemini", action="store_true", help="Send selected real evidence to the configured Gemini API endpoint.")
    parser.add_argument("--ai-url", default="", help="Full Gemini analyze endpoint URL, e.g. http://server:8090/api/ai/gemini/analyze-evidence")
    parser.add_argument("--max-ai-sources", type=int, default=24, help="Maximum evidence blocks to send to Gemini.")
    parser.add_argument("--ai-batch-size", type=int, default=3, help="Evidence blocks per Gemini request.")
    parser.add_argument("--request-timeout", type=int, default=180, help="Seconds to wait for each Gemini request.")
    parser.add_argument("--quiet", action="store_true", help="Suppress progress logs and print only the final JSON.")
    parser.add_argument("--print-summary", action="store_true", help="Print compact JSON summary.")
    return parser.parse_args()


def progress(message: str, quiet: bool = False) -> None:
    if quiet:
        return
    print(f"[{time.strftime('%H:%M:%S')}] {message}", flush=True)


def select_ai_evidence(run: dict, max_items: int) -> list[dict]:
    current = [item for item in run.get("evidence_items", []) if item.get("current_period")]
    pool = current or run.get("evidence_items", [])
    priority = {"xlsx_sheet": 0, "pdf_page": 1, "pptx_slide": 2}
    return sorted(
        pool,
        key=lambda item: (
            priority.get(item.get("source_type", ""), 9),
            0 if item.get("current_period") else 1,
            item.get("source_path", ""),
            item.get("source_sheet_or_page", ""),
        ),
    )[:max_items]


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


def run_gemini_batches(
    run: dict,
    ai_url: str,
    period_label: str,
    max_sources: int,
    batch_size: int,
    request_timeout: int,
    quiet: bool,
) -> None:
    if not ai_url:
        raise ValueError("--ai-url is required when --allow-gemini is used")
    if batch_size <= 0:
        raise ValueError("--ai-batch-size must be greater than 0")
    evidence = select_ai_evidence(run, max_sources)
    total_batches = (len(evidence) + batch_size - 1) // batch_size if evidence else 0
    progress(
        f"AI enabled: selected {len(evidence)} evidence block(s), "
        f"batch_size={batch_size}, batches={total_batches}",
        quiet,
    )
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
        try:
            result = post_json(ai_url, body, request_timeout)
        except urllib.error.HTTPError as exc:
            elapsed = time.perf_counter() - batch_started
            detail = exc.read().decode("utf-8", errors="replace")
            ai["errors"].append({"batch": batch_no, "status_code": exc.code, "detail": detail[:1000], "source_ids": [item.get("source_id") for item in batch]})
            progress(f"AI batch {batch_no}/{total_batches} error after {elapsed:.1f}s: HTTP {exc.code}", quiet)
            continue
        except Exception as exc:
            elapsed = time.perf_counter() - batch_started
            ai["errors"].append({"batch": batch_no, "detail": f"{type(exc).__name__}: {str(exc)[:1000]}", "source_ids": [item.get("source_id") for item in batch]})
            progress(f"AI batch {batch_no}/{total_batches} error after {elapsed:.1f}s: {type(exc).__name__}", quiet)
            continue
        parsed = result.get("result", {})
        before_candidates = len(ai["candidate_rows"])
        for row in parsed.get("candidate_rows", []):
            ai["candidate_rows"].append({**row, "ai_batch": batch_no, "source_ids": [item.get("source_id") for item in batch]})
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


def main() -> int:
    args = parse_args()
    started = time.perf_counter()
    reply_dir = Path(args.reply_dir).expanduser().resolve()
    out_dir = Path(args.out_dir).expanduser().resolve()
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
