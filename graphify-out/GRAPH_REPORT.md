# Graph Report - overtime_web  (2026-06-04)

## Corpus Check
- 7 files · ~5,063 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 89 nodes · 187 edges · 14 communities detected
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
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `$()` - 13 edges
2. `loadBootstrap()` - 13 edges
3. `load_state()` - 11 edges
4. `api()` - 9 edges
5. `_seed_state()` - 8 edges
6. `searchEmployeeForRow()` - 7 edges
7. `hr_candidate_from_row()` - 6 edges
8. `main()` - 6 edges
9. `summarize()` - 5 edges
10. `build_approval_body()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `HREmployeeCandidate` --inherits--> `BaseModel`  [EXTRACTED]
  backend\app.py →   _Bridges community 0 → community 5_
- `bootstrap()` --calls--> `load_state()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 0 → community 4_
- `approval_preview()` --calls--> `load_state()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 0 → community 11_
- `build_approval_body()` --calls--> `summarize()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 4 → community 11_
- `config()` --calls--> `hr_db_configured()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 8 → community 4_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.23
Nodes (15): apply_master_updates(), create_submission(), fill_approval_draft_stub(), LegalEntity, load_state(), _now(), OvertimeRow, Period (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.27
Nodes (4): choose_template(), copy_template_output(), export_excel_stub(), export_ppt_stub()

### Community 2 - "Community 2"
Cohesion: 0.48
Nodes (5): addEntryRow(), escapeHtml(), makeRowKey(), renderEntryRow(), renderJobGroupOptions()

### Community 3 - "Community 3"
Cohesion: 0.52
Nodes (6): _candidate_columns(), _connect(), _fetchall(), _fetchone(), main(), _mask_name()

### Community 4 - "Community 4"
Cohesion: 0.47
Nodes (6): all_rows(), bootstrap(), config(), dashboard(), report_preview(), summarize()

### Community 5 - "Community 5"
Cohesion: 0.33
Nodes (6): classify_hr_employee(), display_factory_from_hr(), entity_code_from_hr(), hr_candidate_from_row(), HREmployeeCandidate, production_department()

### Community 6 - "Community 6"
Cohesion: 0.4
Nodes (6): $(), fillDraft(), renderEntities(), renderReviewRows(), renderSubmissionSelect(), updateFactoryOptions()

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (6): applyEmployeeToRow(), applySelectedEmployee(), rowField(), rowValue(), searchEmployeeForRow(), setRowStatus()

### Community 8 - "Community 8"
Cohesion: 0.4
Nodes (5): add_entity_filters(), hr_connection(), hr_db_configured(), hr_status(), search_hr_employees()

### Community 9 - "Community 9"
Cohesion: 0.4
Nodes (5): flattenRows(), fmtCount(), loadBootstrap(), renderBars(), renderEntryRows()

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (5): api(), exportExcel(), exportPpt(), loadApprovalPreview(), renderSlides()

### Community 11 - "Community 11"
Cohesion: 0.67
Nodes (4): approval_preview(), build_approval_body(), build_approval_title(), split_counts()

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (1): Overtime reporting web backend.

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (2): saveSubmission(), switchView()

## Knowledge Gaps
- **1 isolated node(s):** `Overtime reporting web backend.`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 12`** (2 nodes): `__init__.py`, `Overtime reporting web backend.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `saveSubmission()`, `switchView()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `loadBootstrap()` connect `Community 9` to `Community 2`, `Community 10`, `Community 13`, `Community 6`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `$()` connect `Community 6` to `Community 2`, `Community 7`, `Community 9`, `Community 10`, `Community 13`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `load_state()` connect `Community 0` to `Community 1`, `Community 11`, `Community 4`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `Overtime reporting web backend.` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._