# Graph Report - overtime_web  (2026-06-01)

## Corpus Check
- 6 files · ~2,273 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 51 nodes · 108 edges · 8 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]

## God Nodes (most connected - your core abstractions)
1. `loadBootstrap()` - 13 edges
2. `load_state()` - 11 edges
3. `$()` - 11 edges
4. `_seed_state()` - 8 edges
5. `api()` - 7 edges
6. `summarize()` - 5 edges
7. `create_submission()` - 5 edges
8. `saveSubmission()` - 5 edges
9. `Submission` - 4 edges
10. `_now()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `create_submission()` --calls--> `Submission`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 0 → community 2_
- `bootstrap()` --calls--> `load_state()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 2 → community 3_
- `approval_preview()` --calls--> `load_state()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 2 → community 7_
- `build_approval_body()` --calls--> `summarize()`  [EXTRACTED]
  backend\app.py → backend\app.py  _Bridges community 3 → community 7_
- `renderEntryRows()` --calls--> `$()`  [EXTRACTED]
  backend\static\app.js → backend\static\app.js  _Bridges community 5 → community 6_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.39
Nodes (8): LegalEntity, OvertimeRow, Period, _seed_state(), State, Submission, SubmissionCreate, BaseModel

### Community 1 - "Community 1"
Cohesion: 0.46
Nodes (7): api(), exportExcel(), fillDraft(), loadApprovalPreview(), renderSlides(), saveSubmission(), switchView()

### Community 2 - "Community 2"
Cohesion: 0.43
Nodes (7): create_submission(), export_excel_stub(), fill_approval_draft_stub(), load_state(), _now(), save_state(), submissions()

### Community 3 - "Community 3"
Cohesion: 0.6
Nodes (5): all_rows(), bootstrap(), dashboard(), report_preview(), summarize()

### Community 5 - "Community 5"
Cohesion: 0.4
Nodes (5): $(), addEntryRow(), renderEntities(), renderReviewRows(), renderSubmissionSelect()

### Community 6 - "Community 6"
Cohesion: 0.4
Nodes (5): flattenRows(), fmtCount(), loadBootstrap(), renderBars(), renderEntryRows()

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (3): approval_preview(), build_approval_body(), build_approval_title()

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (1): Overtime reporting web backend.

## Knowledge Gaps
- **1 isolated node(s):** `Overtime reporting web backend.`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 8`** (2 nodes): `__init__.py`, `Overtime reporting web backend.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `loadBootstrap()` connect `Community 6` to `Community 1`, `Community 5`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `load_state()` connect `Community 2` to `Community 0`, `Community 3`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `$()` connect `Community 5` to `Community 1`, `Community 6`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `Overtime reporting web backend.` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._