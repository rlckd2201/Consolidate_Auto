# Graph Report - overtime_web  (2026-06-04)

## Corpus Check
- 7 files · ~5,945 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 99 nodes · 212 edges · 12 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
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

## God Nodes (most connected - your core abstractions)
1. `$()` - 17 edges
2. `loadBootstrap()` - 13 edges
3. `load_state()` - 11 edges
4. `api()` - 9 edges
5. `_seed_state()` - 8 edges
6. `searchEmployees()` - 7 edges
7. `hr_candidate_from_row()` - 6 edges
8. `setLookupState()` - 6 edges
9. `applyEmployeeToRow()` - 6 edges
10. `main()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `HREmployeeCandidate` --inherits--> `BaseModel`  [EXTRACTED]
  backend\app.py →   _Bridges community 2 → community 7_
- `create_submission()` --calls--> `Submission`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 2 → community 0_
- `config()` --calls--> `hr_db_configured()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 8 → community 10_
- `search_hr_employees()` --calls--> `hr_candidate_from_row()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 7 → community 8_
- `bootstrap()` --calls--> `config()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 0 → community 10_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.22
Nodes (15): all_rows(), approval_preview(), bootstrap(), build_approval_body(), build_approval_title(), create_submission(), dashboard(), fill_approval_draft_stub() (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.26
Nodes (13): $(), applyEmployeeToRow(), applySelectedCandidate(), candidateLabel(), fillDraft(), renderEmployeeResults(), renderEntities(), renderReviewRows() (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.25
Nodes (11): apply_master_updates(), GeminiEvidenceAnalyzeRequest, GeminiEvidenceItem, LegalEntity, OvertimeRow, Period, _seed_state(), State (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (11): api(), exportExcel(), exportPpt(), flattenRows(), fmtCount(), loadApprovalPreview(), loadBootstrap(), renderBars() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.36
Nodes (9): addEntryRow(), escapeHtml(), makeRowKey(), renderEntryRow(), renderEntryRows(), renderJobGroupOptions(), rowField(), rowValue() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.31
Nodes (4): choose_template(), copy_template_output(), export_excel_stub(), export_ppt_stub()

### Community 6 - "Community 6"
Cohesion: 0.52
Nodes (6): _candidate_columns(), _connect(), _fetchall(), _fetchone(), main(), _mask_name()

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (6): classify_hr_employee(), display_factory_from_hr(), entity_code_from_hr(), hr_candidate_from_row(), HREmployeeCandidate, production_department()

### Community 8 - "Community 8"
Cohesion: 0.4
Nodes (5): add_entity_filters(), hr_connection(), hr_db_configured(), hr_status(), search_hr_employees()

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (4): analyze_evidence_with_gemini(), build_gemini_prompt(), call_gemini_json(), gemini_analysis_schema()

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (3): config(), gemini_configured(), gemini_status()

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (1): Overtime reporting web backend.

## Knowledge Gaps
- **1 isolated node(s):** `Overtime reporting web backend.`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 11`** (2 nodes): `__init__.py`, `Overtime reporting web backend.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$()` connect `Community 1` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `loadBootstrap()` connect `Community 3` to `Community 1`, `Community 4`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `load_state()` connect `Community 0` to `Community 2`, `Community 5`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `Overtime reporting web backend.` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._