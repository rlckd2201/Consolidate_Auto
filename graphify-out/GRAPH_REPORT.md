# Graph Report - overtime_web  (2026-06-04)

## Corpus Check
- 9 files · ~9,869 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 145 nodes · 323 edges · 15 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]

## God Nodes (most connected - your core abstractions)
1. `$()` - 20 edges
2. `loadBootstrap()` - 14 edges
3. `load_state()` - 11 edges
4. `api()` - 11 edges
5. `run_reply_import()` - 10 edges
6. `_seed_state()` - 8 edges
7. `run_gemini_import_batches()` - 8 edges
8. `build_evidence()` - 7 edges
9. `searchEmployees()` - 7 edges
10. `run_gemini_batches()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `import_run()` --calls--> `run_reply_import()`  [INFERRED]
  backend\app.py → backend\reply_import.py
- `run_reply_import()` --calls--> `main()`  [INFERRED]
  backend\reply_import.py → tools\run_reply_import.py
- `save_run()` --calls--> `main()`  [INFERRED]
  backend\reply_import.py → tools\run_reply_import.py
- `import_latest()` --calls--> `load_latest()`  [INFERRED]
  backend\app.py → backend\reply_import.py
- `import_run()` --calls--> `save_run()`  [INFERRED]
  backend\app.py → backend\reply_import.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (21): import_latest(), build_evidence(), contains_any(), extract_date(), extract_factory(), extract_pdf(), extract_pptx(), extract_xlsx() (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (15): add_entity_filters(), choose_template(), classify_hr_employee(), copy_template_output(), display_factory_from_hr(), entity_code_from_hr(), export_excel_stub(), export_ppt_stub() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.2
Nodes (14): analyze_evidence_with_gemini(), build_gemini_prompt(), call_gemini_json(), config(), gemini_analysis_schema(), gemini_configured(), gemini_key_status(), gemini_status() (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.26
Nodes (12): count_by(), evidence_rank(), is_auxiliary_evidence(), main(), normalize_candidate_row(), normalized_category(), parse_args(), post_json() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.35
Nodes (10): escapeHtml(), fmtImportCounts(), loadImportLatest(), makeRowKey(), renderEntryRow(), renderImportRun(), renderJobGroupOptions(), rowField() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (10): apply_master_updates(), LegalEntity, OvertimeRow, Period, ReplyImportRunRequest, _seed_state(), State, Submission (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (8): flattenRows(), fmtCount(), loadBootstrap(), renderBars(), renderReviewRows(), renderSubmissionSelect(), saveSubmission(), switchView()

### Community 7 - "Community 7"
Cohesion: 0.43
Nodes (7): applyEmployeeToRow(), applySelectedCandidate(), candidateLabel(), renderEmployeeResults(), searchEmployees(), selectedEntryRow(), setLookupState()

### Community 8 - "Community 8"
Cohesion: 0.52
Nodes (6): _candidate_columns(), _connect(), _fetchall(), _fetchone(), main(), _mask_name()

### Community 9 - "Community 9"
Cohesion: 0.53
Nodes (6): create_submission(), fill_approval_draft_stub(), load_state(), _now(), save_state(), submissions()

### Community 10 - "Community 10"
Cohesion: 0.53
Nodes (6): $(), addEntryRow(), renderEntities(), renderEntryRows(), selectEntryRow(), updateFactoryOptions()

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (6): api(), exportExcel(), exportPpt(), fillDraft(), loadApprovalPreview(), renderSlides()

### Community 12 - "Community 12"
Cohesion: 0.6
Nodes (5): all_rows(), bootstrap(), dashboard(), report_preview(), summarize()

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (4): approval_preview(), build_approval_body(), build_approval_title(), split_counts()

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (1): Overtime reporting web backend.

## Knowledge Gaps
- **1 isolated node(s):** `Overtime reporting web backend.`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 14`** (2 nodes): `__init__.py`, `Overtime reporting web backend.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `import_run()` connect `Community 2` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Why does `run_reply_import()` connect `Community 0` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `main()` connect `Community 3` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **What connects `Overtime reporting web backend.` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._