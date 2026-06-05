# Graph Report - overtime_web  (2026-06-05)

## Corpus Check
- 9 files · ~11,557 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 172 nodes · 386 edges · 13 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]

## God Nodes (most connected - your core abstractions)
1. `$()` - 22 edges
2. `loadBootstrap()` - 14 edges
3. `load_state()` - 11 edges
4. `api()` - 11 edges
5. `run_reply_import()` - 10 edges
6. `renderImportRun()` - 10 edges
7. `_seed_state()` - 8 edges
8. `run_gemini_import_batches()` - 8 edges
9. `post_gemini_batch()` - 8 edges
10. `build_evidence()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `run_reply_import()` --calls--> `main()`  [INFERRED]
  backend\reply_import.py → tools\run_reply_import.py
- `save_run()` --calls--> `main()`  [INFERRED]
  backend\reply_import.py → tools\run_reply_import.py
- `import_latest()` --calls--> `load_latest()`  [INFERRED]
  backend\app.py → backend\reply_import.py
- `import_run()` --calls--> `run_reply_import()`  [INFERRED]
  backend\app.py → backend\reply_import.py
- `import_run()` --calls--> `save_run()`  [INFERRED]
  backend\app.py → backend\reply_import.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (23): import_latest(), import_run(), build_evidence(), contains_any(), extract_date(), extract_factory(), extract_pdf(), extract_pptx() (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (21): applyImportFilters(), buildImportErrorRows(), candidateEvidenceIds(), defaultImportAction(), evidenceById(), handleImportFilterChange(), handleImportReviewChange(), importDisplayRows() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.19
Nodes (20): append_gemini_result(), count_by(), evidence_rank(), gemini_cache_key(), gemini_context(), is_auxiliary_evidence(), load_ai_cache(), main() (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.16
Nodes (16): add_entity_filters(), approval_preview(), build_approval_body(), build_approval_title(), choose_template(), classify_hr_employee(), copy_template_output(), display_factory_from_hr() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (14): api(), exportExcel(), exportPpt(), fillDraft(), flattenRows(), fmtCount(), loadApprovalPreview(), loadBootstrap() (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.28
Nodes (13): $(), addEntryRow(), applyEmployeeToRow(), applySelectedCandidate(), candidateLabel(), renderEmployeeResults(), renderEntities(), renderEntryRows() (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.23
Nodes (12): apply_master_updates(), GeminiEvidenceAnalyzeRequest, GeminiEvidenceItem, LegalEntity, OvertimeRow, Period, ReplyImportRunRequest, _seed_state() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.31
Nodes (11): all_rows(), bootstrap(), create_submission(), dashboard(), fill_approval_draft_stub(), load_state(), _now(), report_preview() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.36
Nodes (8): countImportRows(), escapeHtml(), fmtImportCounts(), importInput(), loadImportLatest(), renderImportRun(), renderImportToolbar(), runImport()

### Community 9 - "Community 9"
Cohesion: 0.38
Nodes (7): config(), gemini_configured(), gemini_key_status(), gemini_status(), hr_connection(), hr_db_configured(), hr_status()

### Community 10 - "Community 10"
Cohesion: 0.52
Nodes (6): _candidate_columns(), _connect(), _fetchall(), _fetchone(), main(), _mask_name()

### Community 11 - "Community 11"
Cohesion: 0.47
Nodes (6): analyze_evidence_with_gemini(), build_gemini_prompt(), call_gemini_json(), gemini_analysis_schema(), run_gemini_import_batches(), selected_ai_evidence()

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (1): Overtime reporting web backend.

## Knowledge Gaps
- **1 isolated node(s):** `Overtime reporting web backend.`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 12`** (2 nodes): `__init__.py`, `Overtime reporting web backend.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `import_run()` connect `Community 0` to `Community 11`, `Community 9`, `Community 3`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Why does `run_reply_import()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `main()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **What connects `Overtime reporting web backend.` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._