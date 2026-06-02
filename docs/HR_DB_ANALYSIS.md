# HR DB Read-Only Analysis

Date: 2026-06-02

DB: `ksystem_yundong`

Tables inspected:
- `ds_t_emp`
- `buseo_t`

No HR DB password is stored in this repository. Use `HR_DB_*` environment variables only.

## Employee Table

`ds_t_emp` has 2,565 rows by `COUNT(*)`.

Important columns:
- `EmpName`: employee name
- `EmpID`: employee id
- `binum`: legal entity/company code candidate
- `PuName`: plant/factory name
- `DeptName`, `DeptSeq`: old department name/code
- `PosName`: direct/indirect marker
- `UMJpName`, `UMJpSeq`: rank/title
- `UMJdName`: duty/role name
- `UMJoName`: job family-like marker
- `PtName`: pay type
- `TypeName`, `TypeSeq`: employment status

Observed `TypeName` counts:
- active employees: 1,934
- retired employees: 631

`TypeSeq='3031001'` covers the main domestic active rows for `binum` 1-4. `TypeName` should remain the safer active/retired filter, but the app should exclude `binum` 5, 6, and 99 unless the user expands scope.

## Organization Table

`buseo_t` has 522 rows by `COUNT(*)`.

Important columns:
- `n_bu_name`: current organization node name
- `bu_code`: current organization code
- `up_bu_code`: parent organization code
- `lv_no`: hierarchy level
- `use_yn`, `apply_yn`: active/apply flags
- `old_bu_name`, `old_bi_code`, `old_bu_code`: old organization mapping

Practical join:

```sql
ds_t_emp.DeptSeq = CAST(buseo_t.old_bu_code AS CHAR)
AND ds_t_emp.binum = CAST(buseo_t.old_bi_code AS CHAR)
```

For domestic active rows in `binum` 1-4, the old-code join matched all checked rows. Because `buseo_t` can have duplicate old-code mappings, use it for hierarchy enrichment and do not let the join multiply app rows.

## Legal And Factory Mapping

Recommended app mapping:
- `binum=1`: Daeseung, D1/D2/D3 factories
- `binum=2`: Daeseung Precision, P1/P2/P3/P4 factories
- `binum=3`: Ilgang, Ilgang 1/2 factories
- `binum=4`: TheOne/JM area

For `binum=4`:
- `JM서울` rows include `더원-*` department names, so map them to TheOne / TheOne factory first.
- `JM평택` rows include `JOINT`, `SPIDER`, `제관`, etc.; treat them as JM / JM factory unless later corrected.

## Classification Rule

Use HR DB as person-resolution evidence:
- `UMJoName='관리직'` means management.
- Direct production requires `PosName='직접'`, `UMJoName='생산직'`, and a real production department/team.
- Indirect/support teams stay indirect or management: production management, production engineering, manufacturing engineering, quality, maintenance, logistics, material, purchasing, sales, HR/general affairs, finance, IT.
- Guard against odd rows such as logistics with `PosName='직접'`; department meaning still matters.

Person matching flow:
1. User selects legal entity and factory.
2. Query active employees only.
3. Match exact `EmpName`.
4. If duplicates remain, show candidates with `EmpID`, `PuName`, `DeptName`, `UMJpName`, `UMJdName`, `PosName`, and `UMJoName`.
5. Use the resolved person to fill target factory, team, position/rank, and direct/indirect/management classification.
