# Graph Report - overtime_web  (2026-06-02)

## Corpus Check
- 7 files · ~3,315 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 65 nodes · 133 edges · 11 communities detected
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

## God Nodes (most connected - your core abstractions)
1. `loadBootstrap()` - 13 edges
2. `load_state()` - 11 edges
3. `$()` - 11 edges
4. `_seed_state()` - 8 edges
5. `api()` - 8 edges
6. `main()` - 6 edges
7. `summarize()` - 5 edges
8. `build_approval_body()` - 5 edges
9. `bootstrap()` - 5 edges
10. `create_submission()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `create_submission()` --calls--> `Submission`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 0 → community 4_
- `bootstrap()` --calls--> `load_state()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 4 → community 5_
- `approval_preview()` --calls--> `load_state()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 4 → community 8_
- `build_approval_body()` --calls--> `summarize()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 5 → community 8_
- `renderSubmissionSelect()` --calls--> `$()`  [EXTRACTED]
  backend\static\app.js → backend\static\app.js  _Bridges community 7 → community 6_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.33
Nodes (9): apply_master_updates(), LegalEntity, OvertimeRow, Period, _seed_state(), State, Submission, SubmissionCreate (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.31
Nodes (4): choose_template(), copy_template_output(), export_excel_stub(), export_ppt_stub()

### Community 2 - "Community 2"
Cohesion: 0.52
Nodes (6): api(), exportExcel(), exportPpt(), fillDraft(), loadApprovalPreview(), renderSlides()

### Community 3 - "Community 3"
Cohesion: 0.52
Nodes (6): _candidate_columns(), _connect(), _fetchall(), _fetchone(), main(), _mask_name()

### Community 4 - "Community 4"
Cohesion: 0.53
Nodes (6): create_submission(), fill_approval_draft_stub(), load_state(), _now(), save_state(), submissions()

### Community 5 - "Community 5"
Cohesion: 0.47
Nodes (6): all_rows(), bootstrap(), config(), dashboard(), report_preview(), summarize()

### Community 6 - "Community 6"
Cohesion: 0.4
Nodes (5): flattenRows(), fmtCount(), loadBootstrap(), renderBars(), renderSubmissionSelect()

### Community 7 - "Community 7"
Cohesion: 0.4
Nodes (5): $(), addEntryRow(), renderEntities(), renderEntryRows(), renderReviewRows()

### Community 8 - "Community 8"
Cohesion: 0.67
Nodes (4): approval_preview(), build_approval_body(), build_approval_title(), split_counts()

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (1): Overtime reporting web backend.

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (2): saveSubmission(), switchView()

## Knowledge Gaps
- **1 isolated node(s):** `Overtime reporting web backend.`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 9`** (2 nodes): `__init__.py`, `Overtime reporting web backend.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `saveSubmission()`, `switchView()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `loadBootstrap()` connect `Community 6` to `Community 2`, `Community 10`, `Community 7`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `load_state()` connect `Community 4` to `Community 0`, `Community 1`, `Community 5`, `Community 8`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `$()` connect `Community 7` to `Community 2`, `Community 10`, `Community 6`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `Overtime reporting web backend.` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._