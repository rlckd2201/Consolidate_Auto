# Graph Report - overtime_web  (2026-06-08)

## Corpus Check
- 9 files · ~15,275 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 213 nodes · 501 edges · 17 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
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
1. `$()` - 28 edges
2. `loadBootstrap()` - 15 edges
3. `clean_import_value()` - 13 edges
4. `load_state()` - 12 edges
5. `api()` - 11 edges
6. `renderSlides()` - 11 edges
7. `import_report_rows()` - 10 edges
8. `run_reply_import()` - 10 edges
9. `renderImportRun()` - 10 edges
10. `reference_report_baseline()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `run_reply_import()` --calls--> `main()`  [INFERRED]
  backend\reply_import.py → tools\run_reply_import.py
- `save_run()` --calls--> `main()`  [INFERRED]
  backend\reply_import.py → tools\run_reply_import.py
- `build_ppt_report_workspace()` --calls--> `load_latest()`  [INFERRED]
  backend\app.py → backend\reply_import.py
- `import_latest()` --calls--> `load_latest()`  [INFERRED]
  backend\app.py → backend\reply_import.py
- `import_run()` --calls--> `run_reply_import()`  [INFERRED]
  backend\app.py → backend\reply_import.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (25): all_rows(), apply_master_updates(), approval_preview(), bootstrap(), build_approval_body(), build_approval_title(), create_submission(), dashboard() (+17 more)

### Community 1 - "Community 1"
Cohesion: 0.21
Nodes (21): import_run(), build_evidence(), contains_any(), extract_date(), extract_factory(), extract_pdf(), extract_pptx(), extract_xlsx() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.19
Nodes (20): append_gemini_result(), count_by(), evidence_rank(), gemini_cache_key(), gemini_context(), is_auxiliary_evidence(), load_ai_cache(), main() (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (15): add_entity_filters(), choose_template(), classify_hr_employee(), copy_template_output(), display_factory_from_hr(), entity_code_from_hr(), export_excel_stub(), export_ppt_stub() (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (13): applyImportFilters(), buildImportErrorRows(), evidenceById(), handleImportFilterChange(), handleImportReviewChange(), importDisplayRows(), loadImportReview(), makeRowKey() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (14): candidateEvidenceIds(), chooseCandidateEvidence(), cleanImportValue(), defaultImportAction(), explicitEvidenceIds(), genericGeminiReason(), importNoiseReason(), importReviewKey() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.31
Nodes (13): candidate_evidence_ids(), choose_candidate_evidence(), clean_import_value(), column_index(), import_headcount(), import_noise_reason(), import_number(), import_report_rows() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.27
Nodes (13): $(), addEntryRow(), ensureReportWorkspace(), renderEntities(), renderEntryRows(), renderReportCategoryTable(), renderReportExceptions(), renderReportKpis() (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.19
Nodes (13): api(), exportExcel(), exportPpt(), fillDraft(), flattenRows(), fmtCount(), loadApprovalPreview(), loadBootstrap() (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.31
Nodes (9): applyEmployeeToRow(), applySelectedCandidate(), candidateLabel(), renderEmployeeResults(), rowField(), rowValue(), searchEmployees(), selectedEntryRow() (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.31
Nodes (9): countImportRows(), escapeHtml(), fmtImportCounts(), importInput(), loadImportLatest(), renderImportRun(), renderImportToolbar(), renderReconTable() (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.32
Nodes (8): analyze_evidence_with_gemini(), build_gemini_prompt(), call_gemini_json(), gemini_analysis_schema(), GeminiEvidenceAnalyzeRequest, GeminiEvidenceItem, run_gemini_import_batches(), selected_ai_evidence()

### Community 12 - "Community 12"
Cohesion: 0.52
Nodes (6): _candidate_columns(), _connect(), _fetchall(), _fetchone(), main(), _mask_name()

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (6): build_ppt_report_workspace(), import_latest(), report_exceptions(), report_workspace(), summarize_report_rows(), load_latest()

### Community 14 - "Community 14"
Cohesion: 0.6
Nodes (5): config(), gemini_configured(), gemini_key_status(), gemini_status(), reference_workbook_path()

### Community 15 - "Community 15"
Cohesion: 0.4
Nodes (5): build_reconciliation(), build_source_coverage(), evidence_by_id(), reconciliation_line(), source_label()

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

- **Why does `import_run()` connect `Community 1` to `Community 11`, `Community 3`, `Community 14`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `main()` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `run_reply_import()` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **What connects `Overtime reporting web backend.` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._