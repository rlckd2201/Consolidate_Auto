# Graph Report - overtime_web  (2026-06-04)

## Corpus Check
- 9 files · ~9,335 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 138 nodes · 311 edges · 17 communities detected
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
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

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
10. `hr_candidate_from_row()` - 6 edges

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
Cohesion: 0.24
Nodes (8): approval_preview(), build_approval_body(), build_approval_title(), choose_template(), copy_template_output(), export_excel_stub(), export_ppt_stub(), split_counts()

### Community 2 - "Community 2"
Cohesion: 0.29
Nodes (10): apply_master_updates(), LegalEntity, OvertimeRow, Period, ReplyImportRunRequest, _seed_state(), State, Submission (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.33
Nodes (9): addEntryRow(), candidateLabel(), makeRowKey(), renderEntryRow(), renderEntryRows(), renderJobGroupOptions(), rowField(), rowValue() (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.44
Nodes (9): $(), applyEmployeeToRow(), applySelectedCandidate(), renderEmployeeResults(), renderEntities(), searchEmployees(), selectedEntryRow(), setLookupState() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.32
Nodes (8): analyze_evidence_with_gemini(), build_gemini_prompt(), call_gemini_json(), gemini_analysis_schema(), GeminiEvidenceAnalyzeRequest, GeminiEvidenceItem, run_gemini_import_batches(), selected_ai_evidence()

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (8): flattenRows(), fmtCount(), loadBootstrap(), renderBars(), renderReviewRows(), renderSubmissionSelect(), saveSubmission(), switchView()

### Community 7 - "Community 7"
Cohesion: 0.57
Nodes (6): main(), parse_args(), post_json(), progress(), run_gemini_batches(), select_ai_evidence()

### Community 8 - "Community 8"
Cohesion: 0.52
Nodes (6): _candidate_columns(), _connect(), _fetchall(), _fetchone(), main(), _mask_name()

### Community 9 - "Community 9"
Cohesion: 0.53
Nodes (6): create_submission(), fill_approval_draft_stub(), load_state(), _now(), save_state(), submissions()

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (6): classify_hr_employee(), display_factory_from_hr(), entity_code_from_hr(), hr_candidate_from_row(), HREmployeeCandidate, production_department()

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (6): api(), exportExcel(), exportPpt(), fillDraft(), loadApprovalPreview(), renderSlides()

### Community 12 - "Community 12"
Cohesion: 0.4
Nodes (5): add_entity_filters(), hr_connection(), hr_db_configured(), hr_status(), search_hr_employees()

### Community 13 - "Community 13"
Cohesion: 0.6
Nodes (5): all_rows(), bootstrap(), dashboard(), report_preview(), summarize()

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (5): escapeHtml(), fmtImportCounts(), loadImportLatest(), renderImportRun(), runImport()

### Community 15 - "Community 15"
Cohesion: 0.83
Nodes (4): config(), gemini_configured(), gemini_key_status(), gemini_status()

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (1): Overtime reporting web backend.

## Knowledge Gaps
- **1 isolated node(s):** `Overtime reporting web backend.`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 16`** (2 nodes): `__init__.py`, `Overtime reporting web backend.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `import_run()` connect `Community 0` to `Community 1`, `Community 5`, `Community 15`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Why does `run_reply_import()` connect `Community 0` to `Community 7`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `main()` connect `Community 7` to `Community 0`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `Overtime reporting web backend.` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._