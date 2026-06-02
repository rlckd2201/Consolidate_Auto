from __future__ import annotations

import json
import os
from typing import Any

import pymysql


DB_NAME = os.environ.get("HR_DB_NAME", "ksystem_yundong")
TABLES = ("ds_t_emp", "buseo_t")


def _connect():
    return pymysql.connect(
        host=os.environ["HR_DB_HOST"],
        port=int(os.environ.get("HR_DB_PORT", "3306")),
        user=os.environ["HR_DB_USER"],
        password=os.environ["HR_DB_PASSWORD"],
        database=DB_NAME,
        charset="utf8mb4",
        connect_timeout=10,
        read_timeout=20,
        cursorclass=pymysql.cursors.DictCursor,
    )


def _fetchall(cur, sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    cur.execute(sql, params)
    return list(cur.fetchall())


def _fetchone(cur, sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    cur.execute(sql, params)
    return cur.fetchone()


def _mask_name(value: Any) -> Any:
    if not isinstance(value, str) or not value:
        return value
    if len(value) == 1:
        return "*"
    return value[0] + "*" * (len(value) - 1)


def _candidate_columns(columns: list[dict[str, Any]], table: str) -> list[str]:
    markers = (
        "emp",
        "name",
        "buseo",
        "dept",
        "team",
        "corp",
        "company",
        "factory",
        "plant",
        "code",
        "level",
        "jp",
        "type",
    )
    picked: list[str] = []
    for row in columns:
        if row["TABLE_NAME"] != table:
            continue
        name = row["COLUMN_NAME"]
        lowered = name.lower()
        if any(marker in lowered or marker in name for marker in markers):
            picked.append(name)
    return picked[:18]


def main() -> None:
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute("SET SESSION TRANSACTION READ ONLY")
            cur.execute("START TRANSACTION READ ONLY")
            output: dict[str, Any] = {}
            output["database"] = _fetchone(cur, "SELECT DATABASE() AS db")
            output["tables"] = _fetchall(
                cur,
                """
                SELECT TABLE_NAME, TABLE_ROWS
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = %s AND TABLE_NAME IN %s
                ORDER BY TABLE_NAME
                """,
                (DB_NAME, TABLES),
            )
            columns = _fetchall(
                cur,
                """
                SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, ORDINAL_POSITION
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = %s AND TABLE_NAME IN %s
                ORDER BY TABLE_NAME, ORDINAL_POSITION
                """,
                (DB_NAME, TABLES),
            )
            output["columns"] = columns
            output["counts"] = {}
            for table in TABLES:
                output["counts"][table] = _fetchone(cur, f"SELECT COUNT(*) AS cnt FROM `{table}`")
            output["type_counts"] = _fetchall(
                cur,
                "SELECT TypeName, COUNT(*) AS cnt FROM ds_t_emp GROUP BY TypeName ORDER BY cnt DESC",
            )
            output["rank_counts_top30"] = _fetchall(
                cur,
                "SELECT UMJpName, COUNT(*) AS cnt FROM ds_t_emp GROUP BY UMJpName ORDER BY cnt DESC LIMIT 30",
            )
            output["candidate_columns"] = {
                table: _candidate_columns(columns, table) for table in TABLES
            }
            output["samples"] = {}
            for table in TABLES:
                picked = output["candidate_columns"][table]
                if not picked:
                    continue
                sql_cols = ", ".join(f"`{col}`" for col in picked)
                rows = _fetchall(cur, f"SELECT {sql_cols} FROM `{table}` LIMIT 20")
                if table == "ds_t_emp":
                    for row in rows:
                        if "EmpName" in row:
                            row["EmpName"] = _mask_name(row["EmpName"])
                output["samples"][table] = rows
            cur.execute("ROLLBACK")
    print(json.dumps(output, ensure_ascii=False, default=str, indent=2))


if __name__ == "__main__":
    main()
