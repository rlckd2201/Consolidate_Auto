const state = {
  bootstrap: null,
  rows: [],
  nextRowId: 1,
  employeeResults: [],
  selectedEmployees: {},
  selectedRowKey: null,
  importRun: null,
  importFilters: { quality: "usable", status: "all", category: "all", query: "" },
};

const $ = (id) => document.getElementById(id);
const JOB_GROUPS = ["관리직", "간접직", "직접직"];
const IMPORT_ACTIONS = ["검토대기", "확정", "제외", "수정필요"];
const REPORT_CATEGORIES = ["직접직", "간접직", "비생산", "검토필요"];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtCount(value) {
  return `${value ?? 0}명`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    let detail = text || response.statusText;
    try {
      detail = JSON.parse(text).detail || detail;
    } catch {
      // Keep original text.
    }
    if (response.status === 404 && path.startsWith("/api/hr/")) {
      throw new Error("HR 검색 API가 없습니다. 운영서버에서 git reset 후 FastAPI 서버를 재시작해야 합니다.");
    }
    throw new Error(detail);
  }
  return response.json();
}

function switchView(name) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === name));
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === name));
}

function flattenRows(submissions) {
  return submissions.flatMap((submission) => submission.rows.map((row) => ({ ...row, submission_id: submission.id })));
}

function renderBars(target, data) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  target.innerHTML = entries.map(([label, value]) => `
    <div class="bar-row">
      <span>${label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(value / max) * 100}%"></div></div>
      <strong>${value}명</strong>
    </div>
  `).join("");
}

function renderReviewRows(rows) {
  $("reviewRows").innerHTML = rows.map((row) => `
    <tr>
      <td>${row.date}</td>
      <td>${row.company}</td>
      <td>${row.source_factory}</td>
      <td>${row.target_factory || "-"}</td>
      <td>${row.job_group}</td>
      <td>${row.team}</td>
      <td>${row.name || "-"}</td>
      <td>${row.position || "-"}</td>
      <td>${row.headcount}</td>
      <td>${row.category1}</td>
      <td>${row.category2 || "-"}</td>
      <td>${row.detail}</td>
      <td><span class="status ${row.confidence} ${row.review_status}">${row.review_status}</span></td>
    </tr>
  `).join("");
}

function renderEntities(entities) {
  $("entitySelect").innerHTML = entities.map((entity) => `
    <option value="${entity.entity_code}">${entity.display_name} (${entity.default_overtime_form_label})</option>
  `).join("");
  updateFactoryOptions();
}

function renderSubmissionSelect(submissions) {
  $("submissionSelect").innerHTML = submissions.map((submission) => `
    <option value="${submission.id}">${submission.id} · ${submission.factory} · ${submission.submitter}</option>
  `).join("");
}

function fmtImportCounts(counts = {}) {
  return Object.entries(counts).map(([key, value]) => `${key} ${value}`).join(" · ") || "-";
}

function normalizedImportCategory(row) {
  return cleanImportValue(row.category_normalized || row.category_raw || row.category_guess || "검토필요") || "검토필요";
}

function cleanImportValue(value) {
  const text = String(value ?? "").trim();
  if (!text || ["N/A", "NA", "None", "null", "-", "미기재"].includes(text)) return "";
  return text;
}

function isBlankImportValue(value) {
  return !cleanImportValue(value);
}

function numberImportValue(value) {
  const text = cleanImportValue(value).replaceAll(",", "");
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function candidateEvidenceIds(row) {
  const fromEvidence = String(row.evidence || "").match(/\b(?:xlsx|xls|pdf|pptx)-\d+-\d+\b/g) || [];
  const sourceIds = row.source_id ? [row.source_id] : (row.source_ids || []);
  return [...new Set([...fromEvidence, ...sourceIds])];
}

function importReviewKey(row, index) {
  const source = candidateEvidenceIds(row).join("|") || row.source_file || "unknown";
  return `importReview:${state.importRun?.run_id || "none"}:${row.row_kind || "row"}:${source}:${index}`;
}

function loadImportReview(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function saveImportReview(key, patch) {
  const next = { ...loadImportReview(key), ...patch, updated_at: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(next));
  return next;
}

function genericGeminiReason(reason) {
  const text = String(reason || "").toLowerCase();
  if (!text || text === "none") return true;
  return [
    "target_factory is not explicitly stated",
    "target factory is not specified",
    "no individual name is available",
    "name field",
  ].some((token) => text.includes(token));
}

function importNoiseReason(row) {
  if (row.row_kind === "error") return "";
  const evidenceText = `${row.source_sheet_or_page || ""} ${row.evidence || ""} ${row.needs_review_reason || ""}`;
  const detail = cleanImportValue(row.detail || row.category_guess);
  const headcount = numberImportValue(row.headcount);
  const hours = numberImportValue(row.hours);
  const hasPerson = !isBlankImportValue(row.name) || /외\s*\d+명/.test(`${row.team || ""} ${row.name || ""} ${row.detail || ""}`);
  const linePlanSignal = /수급사|라인근무계획|M\/H|man-hours/i.test(evidenceText);
  if (hours !== null && hours > 24 && (headcount === null || /M\/H|man-hours/i.test(evidenceText))) {
    return "M/H·라인계획 집계값";
  }
  if (linePlanSignal && headcount === null && !hasPerson && detail.length <= 10) {
    return "라인계획 보조값";
  }
  if (isBlankImportValue(detail)) {
    return "세부내용 없음";
  }
  return "";
}

function importWarnings(row) {
  const warnings = [];
  const noiseReason = importNoiseReason(row);
  if (noiseReason) warnings.push(noiseReason);
  if (row.evidence_factory && row.ai_source_factory && row.evidence_factory !== row.ai_source_factory) {
    warnings.push(`공장 보정: AI ${row.ai_source_factory} → 원천 ${row.evidence_factory}`);
  }
  if (row.headcount_inferred && !noiseReason) {
    warnings.push("성명 기반 인원 1명 추정");
  }
  if (!genericGeminiReason(row.needs_review_reason) && row.needs_review_reason) {
    warnings.push(row.needs_review_reason);
  }
  return warnings;
}

function importRowNeedsReview(row) {
  if (row.row_kind === "error") return true;
  const confidence = String(row.confidence || "").toLowerCase();
  const category = normalizedImportCategory(row);
  const missingCore = isBlankImportValue(row.date) || isBlankImportValue(row.detail);
  return Boolean(importNoiseReason(row) || confidence === "low" || category === "검토필요" || missingCore || row.factory_corrected || row.headcount_inferred || (!isBlankImportValue(row.needs_review_reason) && !genericGeminiReason(row.needs_review_reason)));
}

function defaultImportAction(row) {
  if (row.row_kind === "error") return "수정필요";
  if (importNoiseReason(row)) return "제외";
  return importRowNeedsReview(row) ? "검토대기" : "확정";
}

function evidenceById(run) {
  return Object.fromEntries((run?.evidence_items || []).map((item) => [item.source_id, item]));
}

function buildImportErrorRows(run) {
  const index = evidenceById(run);
  return (run?.ai?.errors || []).flatMap((error) => (error.source_ids || []).map((sourceId) => {
    const evidence = index[sourceId] || {};
    return {
      row_kind: "error",
      source_id: sourceId,
      source_ids: [sourceId],
      source_file: evidence.source_file || "-",
      source_sheet_or_page: evidence.source_sheet_or_page || "-",
      source_factory: evidence.factory_guess || evidence.source_folder || "-",
      date: evidence.date_hits?.join(", ") || "",
      team: "",
      name: "",
      headcount: "",
      hours: "",
      detail: "AI 미처리. 근거 블록 확인 필요",
      category_normalized: "검토필요",
      confidence: "low",
      needs_review_reason: error.detail || "Gemini 처리 실패",
    };
  }));
}

function importDisplayRows(run) {
  const index = evidenceById(run);
  const enrich = (row) => {
    const evidenceId = candidateEvidenceIds(row)[0];
    const evidence = index[evidenceId] || {};
    const aiSourceFactory = cleanImportValue(row.source_factory);
    const evidenceFactory = cleanImportValue(evidence.factory_guess || evidence.source_folder);
    const sourceFactory = evidenceFactory || aiSourceFactory;
    const headcount = cleanImportValue(row.headcount);
    const headcountInferred = !headcount && !isBlankImportValue(row.name);
    const inferredHeadcount = headcountInferred ? "1" : headcount;
    return {
      ...row,
      source_id: evidenceId || row.source_id,
      source_file: row.source_file || evidence.source_file || "",
      source_sheet_or_page: row.source_sheet_or_page || evidence.source_sheet_or_page || "",
      source_factory: sourceFactory,
      ai_source_factory: aiSourceFactory,
      evidence_factory: evidenceFactory,
      factory_corrected: Boolean(sourceFactory && aiSourceFactory && sourceFactory !== aiSourceFactory),
      target_factory: cleanImportValue(row.target_factory),
      team: cleanImportValue(row.team),
      name: cleanImportValue(row.name),
      headcount: inferredHeadcount,
      headcount_inferred: headcountInferred,
      hours: cleanImportValue(row.hours),
      detail: cleanImportValue(row.detail),
    };
  };
  const aiRows = (run?.ai?.candidate_rows || []).map((row) => enrich({ ...row, row_kind: "gemini" }));
  const localRows = (run?.local_candidate_rows || []).map((row) => enrich({ ...row, row_kind: "local" }));
  return [...aiRows, ...localRows, ...buildImportErrorRows(run)];
}

function countImportRows(rows) {
  return rows.reduce((acc, row) => {
    const category = normalizedImportCategory(row);
    acc.categories[category] = (acc.categories[category] || 0) + 1;
    if (importRowNeedsReview(row)) acc.review += 1;
    if (row.row_kind === "error") acc.errors += 1;
    if (importNoiseReason(row)) acc.noise += 1;
    return acc;
  }, { categories: {}, review: 0, errors: 0, noise: 0 });
}

function renderImportToolbar(rows) {
  const counts = countImportRows(rows);
  const categoryOptions = ["all", ...REPORT_CATEGORIES, ...Object.keys(counts.categories).filter((item) => !REPORT_CATEGORIES.includes(item))];
  $("importReviewToolbar").innerHTML = `
    <label>품질
      <select id="importFilterQuality">
        <option value="usable" ${state.importFilters.quality === "usable" ? "selected" : ""}>유효후보</option>
        <option value="noise" ${state.importFilters.quality === "noise" ? "selected" : ""}>제외권장 ${counts.noise}</option>
        <option value="all" ${state.importFilters.quality === "all" ? "selected" : ""}>전체</option>
      </select>
    </label>
    <label>상태
      <select id="importFilterStatus">
        <option value="all" ${state.importFilters.status === "all" ? "selected" : ""}>전체</option>
        <option value="review" ${state.importFilters.status === "review" ? "selected" : ""}>검토필요 ${counts.review}</option>
        <option value="error" ${state.importFilters.status === "error" ? "selected" : ""}>AI오류 ${counts.errors}</option>
        <option value="confirmed" ${state.importFilters.status === "confirmed" ? "selected" : ""}>확정</option>
      </select>
    </label>
    <label>분류
      <select id="importFilterCategory">
        ${categoryOptions.map((value) => `<option value="${escapeHtml(value)}" ${state.importFilters.category === value ? "selected" : ""}>${escapeHtml(value === "all" ? "전체" : `${value} ${counts.categories[value] || ""}`)}</option>`).join("")}
      </select>
    </label>
    <label>검색
      <input id="importFilterQuery" value="${escapeHtml(state.importFilters.query)}" placeholder="파일, 팀, 이름, 세부내용" />
    </label>
    <div class="review-counts">
      <strong>${rows.length}</strong> 후보 · <span>${counts.review}</span> 검토 · <span>${counts.noise}</span> 제외권장 · <span>${counts.errors}</span> 오류
    </div>
  `;
}

function applyImportFilters(rows) {
  const query = state.importFilters.query.trim().toLowerCase();
  return rows.filter((row, index) => {
    const key = importReviewKey(row, index);
    const saved = loadImportReview(key);
    const action = saved.action || defaultImportAction(row);
    const category = saved.category || normalizedImportCategory(row);
    const noise = Boolean(importNoiseReason(row));
    if (state.importFilters.quality === "usable" && noise && action !== "확정") return false;
    if (state.importFilters.quality === "noise" && !noise) return false;
    if (state.importFilters.status === "review" && !importRowNeedsReview(row) && action !== "수정필요" && action !== "검토대기") return false;
    if (state.importFilters.status === "error" && row.row_kind !== "error") return false;
    if (state.importFilters.status === "confirmed" && action !== "확정") return false;
    if (state.importFilters.category !== "all" && category !== state.importFilters.category) return false;
    if (!query) return true;
    const haystack = [
      row.source_id,
      row.source_ids?.join(" "),
      row.source_file,
      row.source_sheet_or_page,
      row.source_factory,
      row.target_factory,
      row.date,
      row.team,
      row.name,
      row.detail,
      row.evidence_factory,
      row.ai_source_factory,
      row.needs_review_reason,
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function sourceLabel(row) {
  const ids = candidateEvidenceIds(row);
  const id = row.source_id || ids[0] || "-";
  const file = row.source_file || "";
  const sheet = row.source_sheet_or_page ? ` / ${row.source_sheet_or_page}` : "";
  const batch = ids.length > 1 ? ` · batch ${ids.length}` : "";
  return `${id}${file ? ` · ${file}${sheet}` : ""}${batch}`;
}

function importInput(value, field, key, className = "") {
  return `<input class="${className}" data-review-key="${escapeHtml(key)}" data-review-field="${field}" value="${escapeHtml(cleanImportValue(value))}" />`;
}

function renderImportReviewRows(rows) {
  const filtered = applyImportFilters(rows);
  $("importCandidateRows").innerHTML = filtered.map((row) => {
    const index = rows.indexOf(row);
    const key = importReviewKey(row, index);
    const saved = loadImportReview(key);
    const action = saved.action || defaultImportAction(row);
    const category = saved.category || normalizedImportCategory(row);
    const needsReview = importRowNeedsReview(row);
    const noiseReason = importNoiseReason(row);
    const warnings = importWarnings(row);
    const statusClass = row.row_kind === "error" ? "bad" : (noiseReason ? "noise" : (needsReview ? "needs-review" : "ready"));
    return `
      <tr class="import-row ${statusClass}" data-review-key="${escapeHtml(key)}">
        <td><span class="status ${row.confidence || "low"}">${row.row_kind === "error" ? "AI오류" : (noiseReason ? "제외권장" : (needsReview ? "검토" : "후보"))}</span></td>
        <td>
          <select data-review-key="${escapeHtml(key)}" data-review-field="action">
            ${IMPORT_ACTIONS.map((value) => `<option value="${value}" ${action === value ? "selected" : ""}>${value}</option>`).join("")}
          </select>
        </td>
        <td>
          <select data-review-key="${escapeHtml(key)}" data-review-field="category">
            ${REPORT_CATEGORIES.map((value) => `<option value="${value}" ${category === value ? "selected" : ""}>${value}</option>`).join("")}
          </select>
        </td>
        <td class="source-cell">${escapeHtml(sourceLabel(row))}${row.factory_corrected ? `<span class="mini-warn">공장보정</span>` : ""}</td>
        <td>${importInput(saved.source_factory ?? row.source_factory ?? row.target_factory, "source_factory", key)}</td>
        <td>${importInput(saved.date ?? row.date, "date", key, "date-input")}</td>
        <td>
          ${importInput(saved.team ?? row.team ?? "", "team", key)}
          ${importInput(saved.name ?? row.name ?? "", "name", key)}
        </td>
        <td>${importInput(saved.headcount ?? row.headcount, "headcount", key, "small-input")}</td>
        <td>${importInput(saved.hours ?? row.hours, "hours", key, "small-input")}</td>
        <td>${importInput(saved.detail ?? row.detail ?? row.category_guess, "detail", key, "detail-input")}</td>
        <td class="reason-cell">${escapeHtml(warnings.join(" / ") || row.confidence || "-")}</td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="11">표시할 후보가 없습니다. 필터를 바꾸거나 회신자료 Import를 다시 실행하세요.</td></tr>`;
}

function renderImportRun(run) {
  state.importRun = run;
  if (!run) {
    $("importStatus").textContent = "실행 전";
    $("importSummary").innerHTML = `<span class="muted">아직 import 결과가 없습니다.</span>`;
    $("importReviewToolbar").innerHTML = "";
    $("importCandidateRows").innerHTML = "";
    return;
  }
  const summary = run.summary || {};
  const ai = run.ai || {};
  const rows = importDisplayRows(run);
  const counts = countImportRows(rows);
  $("importStatus").textContent = `${run.run_id} · ${run.mode}`;
  $("importSummary").innerHTML = `
    <div><strong>${summary.file_count ?? 0}</strong><span>파일</span></div>
    <div><strong>${summary.evidence_count ?? 0}</strong><span>근거 블록</span></div>
    <div><strong>${summary.current_period_evidence_count ?? 0}</strong><span>해당기간 근거</span></div>
    <div><strong>${summary.local_candidate_count ?? 0}</strong><span>로컬 후보</span></div>
    <div><strong>${summary.ai_candidate_count ?? 0}</strong><span>AI 후보</span></div>
    <div><strong>${summary.unsupported_count ?? 0}</strong><span>XLS 등 미지원</span></div>
    <div><strong>${counts.review}</strong><span>검토 필요 후보</span></div>
    <div><strong>${counts.errors}</strong><span>AI 미처리</span></div>
    <div><strong>${counts.noise}</strong><span>제외권장</span></div>
    <p>확장자: ${escapeHtml(fmtImportCounts(summary.extension_counts))}</p>
    <p>추출상태: ${escapeHtml(fmtImportCounts(summary.extract_status_counts))}</p>
    <p>AI 분류: ${escapeHtml(fmtImportCounts(summary.ai_normalized_category_counts || counts.categories))}</p>
    ${ai.errors?.length ? `<p class="bad">AI 오류 ${ai.errors.length}건: ${escapeHtml(ai.errors[0].detail || "")}</p>` : ""}
  `;
  renderImportToolbar(rows);
  renderImportReviewRows(rows);
}

async function loadImportLatest() {
  try {
    const result = await api("/api/import/latest");
    renderImportRun(result.run);
  } catch (error) {
    $("importStatus").textContent = "조회 실패";
    $("importSummary").innerHTML = `<p class="bad">${escapeHtml(error.message)}</p>`;
    $("importReviewToolbar").innerHTML = "";
  }
}

async function runImport(allowGemini = false) {
  $("importStatus").textContent = allowGemini ? "Gemini 후보 생성 중..." : "로컬 색인 중...";
  $("importSummary").innerHTML = `<span class="muted">회신자료를 읽는 중입니다.</span>`;
  const result = await api("/api/import/run", {
    method: "POST",
    body: JSON.stringify({
      allow_gemini: allowGemini,
      max_ai_sources: allowGemini ? 24 : 0,
      ai_batch_size: 3,
    }),
  });
  renderImportRun(result.run);
}

function updateFactoryOptions() {
  const entityCode = $("entitySelect").value || "daeseung";
  const options = state.bootstrap?.config?.hr_factory_options?.[entityCode] || ["D3공장"];
  const current = $("factoryInput").value;
  $("factoryInput").innerHTML = options.map((factory) => `<option value="${escapeHtml(factory)}">${escapeHtml(factory)}</option>`).join("");
  $("factoryInput").value = options.includes(current) ? current : options[0];
  if (!state.bootstrap?.config?.hr_factory_options) {
    setLookupState("서버 재시작 필요: HR 공장 옵션이 아직 로드되지 않았습니다.", "bad");
  }
}

function renderJobGroupOptions(selected = "관리직") {
  return JOB_GROUPS.map((value) => `<option value="${value}" ${value === selected ? "selected" : ""}>${value}</option>`).join("");
}

function makeRowKey() {
  return `entry-${state.nextRowId++}`;
}

function renderEntryRow(row = {}) {
  const key = makeRowKey();
  return `
    <tr data-row-key="${key}">
      <td><input type="radio" name="selectedEntryRow" data-field="row_select" value="${key}"></td>
      <td><input data-field="date" value="${escapeHtml(row.date || "2026-06-03")}"></td>
      <td><input data-field="name" value="${escapeHtml(row.name || "")}"></td>
      <td><select data-field="job_group">${renderJobGroupOptions(row.job_group || "관리직")}</select></td>
      <td><input data-field="team" value="${escapeHtml(row.team || "")}"></td>
      <td><input data-field="position" value="${escapeHtml(row.position || "")}"></td>
      <td><input data-field="target_factory" value="${escapeHtml(row.target_factory || "")}" readonly></td>
      <td><input data-field="headcount" type="number" min="0" value="${escapeHtml(row.headcount ?? 1)}"></td>
      <td><input data-field="hours" type="number" min="0" step="0.5" value="${escapeHtml(row.hours ?? 8)}"></td>
      <td><input data-field="detail" value="${escapeHtml(row.detail || "")}"></td>
    </tr>
  `;
}

function renderEntryRows() {
  const sample = [
    { date: "2026-06-03", name: "서동철", job_group: "관리직", team: "생산", headcount: 1, hours: 8, detail: "생산관리 총괄" },
    { date: "2026-06-03", name: "", job_group: "간접직", team: "보전", headcount: 2, hours: 8, detail: "특근라인 설비대응" },
  ];
  state.employeeResults = [];
  state.selectedEmployees = {};
  $("entryRows").innerHTML = sample.map(renderEntryRow).join("");
  const firstRow = $("entryRows").querySelector("tr");
  if (firstRow) {
    selectEntryRow(firstRow.dataset.rowKey);
  }
}

async function renderSlides() {
  const preview = await api("/api/report/preview");
  $("slideCards").innerHTML = preview.slides.map((slide) => `
    <article class="slide-card">
      <h3>${slide.slide}p · ${slide.title}</h3>
      <dl>
        ${slide.items.map((item) => `
          <div><dt>${item.label}</dt><dd>${item.value}</dd></div>
        `).join("") || "<p>표시할 항목 없음</p>"}
      </dl>
    </article>
  `).join("");
}

async function loadApprovalPreview() {
  const submissionId = $("submissionSelect").value;
  if (!submissionId) return;
  const preview = await api(`/api/overtime-submissions/${submissionId}/approval-preview`);
  const doc = $("approvalPreview").contentDocument;
  doc.open();
  doc.write(`
    <html><head><style>
      body { font-family: Malgun Gothic, sans-serif; padding: 20px; color: #1d2733; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ccd5df; padding: 7px; font-size: 13px; }
      h2 { margin-top: 0; }
    </style></head><body>
      <h2>${preview.title}</h2>
      <p><strong>양식:</strong> ${preview.form_label}</p>
      ${preview.body_html}
    </body></html>
  `);
  doc.close();
}

async function loadBootstrap() {
  state.bootstrap = await api("/api/bootstrap");
  state.rows = flattenRows(state.bootstrap.submissions);
  const period = state.bootstrap.periods[0];
  $("periodText").textContent = `${period.label} · ${period.start_date} ~ ${period.end_date}`;
  $("kpiTotal").textContent = fmtCount(state.bootstrap.dashboard.total_headcount);
  $("kpiWeekend").textContent = fmtCount(state.bootstrap.dashboard.weekend_headcount);
  $("kpiReference").textContent = fmtCount(state.bootstrap.dashboard.reference_headcount);
  $("kpiUnresolved").textContent = `${state.bootstrap.dashboard.unresolved_rows}건`;
  renderBars($("categoryBars"), state.bootstrap.dashboard.by_category);
  renderBars($("factoryBars"), state.bootstrap.dashboard.by_factory);
  renderReviewRows(state.rows);
  renderEntities(state.bootstrap.legal_entities);
  renderSubmissionSelect(state.bootstrap.submissions);
  renderEntryRows();
  await renderSlides();
  await loadApprovalPreview();
  await loadImportLatest();
}

function addEntryRow() {
  $("entryRows").insertAdjacentHTML("beforeend", renderEntryRow());
  const row = $("entryRows").querySelector("tr:last-child");
  selectEntryRow(row.dataset.rowKey);
}

function rowField(tr, field) {
  return tr.querySelector(`[data-field="${field}"]`);
}

function rowValue(tr, field) {
  return rowField(tr, field)?.value || "";
}

function selectedEntryRow() {
  if (!state.selectedRowKey) return null;
  return $("entryRows").querySelector(`tr[data-row-key="${state.selectedRowKey}"]`);
}

function selectEntryRow(rowKey) {
  state.selectedRowKey = rowKey;
  $("entryRows").querySelectorAll("tr").forEach((tr) => {
    const selected = tr.dataset.rowKey === rowKey;
    tr.classList.toggle("selected-row", selected);
    const radio = rowField(tr, "row_select");
    if (radio) radio.checked = selected;
  });
}

function setLookupState(message, level = "") {
  $("hrLookupState").textContent = message;
  $("hrLookupState").className = `lookup-state ${level}`.trim();
}

function candidateLabel(candidate) {
  const position = candidate.position || candidate.duty || "-";
  return `${candidate.name} · ${candidate.factory || candidate.db_factory} · ${candidate.department} · ${position} · ${candidate.job_group}`;
}

function renderEmployeeResults(items = []) {
  state.employeeResults = items;
  if (!items.length) {
    $("employeeResults").innerHTML = `<div class="empty-result">후보가 없습니다. 법인/공장 또는 이름을 확인하세요.</div>`;
    return;
  }
  $("employeeResults").innerHTML = items.map((candidate, index) => `
    <button type="button" class="employee-result" data-candidate-index="${index}">
      <strong>${escapeHtml(candidate.name)}</strong>
      <span>${escapeHtml(candidate.factory || candidate.db_factory)} · ${escapeHtml(candidate.department)} · ${escapeHtml(candidate.position || candidate.duty || "-")}</span>
      <em>${escapeHtml(candidate.job_group)} / ${escapeHtml(candidate.classification_reason)}</em>
    </button>
  `).join("");
}

function applyEmployeeToRow(tr, candidate) {
  const key = tr.dataset.rowKey;
  state.selectedEmployees[key] = candidate;
  rowField(tr, "name").value = candidate.name;
  rowField(tr, "job_group").value = candidate.job_group;
  rowField(tr, "team").value = candidate.department || candidate.org_name || "";
  rowField(tr, "position").value = candidate.position || candidate.duty || "";
  rowField(tr, "target_factory").value = candidate.factory || candidate.db_factory || "";
  setLookupState(`${candidateLabel(candidate)} 적용됨`, candidate.confidence);
}

async function searchEmployees() {
  const name = $("employeeSearchInput").value.trim();
  if (name.length < 2) {
    setLookupState("이름을 2글자 이상 입력하세요.", "bad");
    renderEmployeeResults([]);
    return;
  }
  const row = selectedEntryRow();
  if (!row) {
    setLookupState("먼저 적용할 입력 행을 선택하세요.", "bad");
    return;
  }
  setLookupState("검색 중...");
  const params = new URLSearchParams({
    q: name,
    entity_code: $("entitySelect").value,
    factory: $("factoryInput").value,
  });
  try {
    const result = await api(`/api/hr/employees/search?${params.toString()}`);
    renderEmployeeResults(result.items || []);
    if (result.items?.length === 1) {
      applyEmployeeToRow(row, result.items[0]);
    } else if (result.items?.length) {
      setLookupState(`${result.items.length}명 후보. 적용할 사람을 선택하세요.`, "warn");
    } else {
      setLookupState("검색 결과 없음", "bad");
    }
  } catch (error) {
    renderEmployeeResults([]);
    setLookupState(error.message, "bad");
  }
}

function applySelectedCandidate(index) {
  const row = selectedEntryRow();
  const candidate = state.employeeResults[index];
  if (!row) {
    setLookupState("먼저 적용할 입력 행을 선택하세요.", "bad");
    return;
  }
  if (candidate) {
    applyEmployeeToRow(row, candidate);
  } else {
    setLookupState("선택한 후보를 찾지 못했습니다.", "bad");
  }
}

async function saveSubmission() {
  const rows = [...$("entryRows").querySelectorAll("tr")].map((tr, index) => {
    const employee = state.selectedEmployees[tr.dataset.rowKey];
    return {
      id: `new-${Date.now()}-${index}`,
      date: rowValue(tr, "date"),
      company: $("entitySelect").selectedOptions[0].textContent.split(" ")[0],
      source_factory: $("factoryInput").value,
      target_factory: rowValue(tr, "target_factory") || employee?.factory || "",
      job_group: rowValue(tr, "job_group"),
      team: rowValue(tr, "team"),
      name: rowValue(tr, "name"),
      position: rowValue(tr, "position"),
      headcount: Number(rowValue(tr, "headcount") || 0),
      hours: Number(rowValue(tr, "hours") || 0),
      category1: "특근대응",
      category2: employee ? "HR 인원매핑" : "자동분류 대기",
      detail: rowValue(tr, "detail"),
      reason: employee?.classification_reason || "",
      confidence: employee?.confidence || "low",
      review_status: employee?.confidence === "high" ? "mapped" : "needs_review",
      source: employee ? "manual_hr" : "manual",
    };
  });
  await api("/api/submissions", {
    method: "POST",
    body: JSON.stringify({
      submitter: $("submitterInput").value,
      entity_code: $("entitySelect").value,
      factory: $("factoryInput").value,
      team: $("teamInput").value,
      rows,
    }),
  });
  await loadBootstrap();
  switchView("manager");
}

async function exportExcel() {
  const result = await api("/api/report/export-excel", { method: "POST" });
  alert(`${result.message}\n${result.path || ""}`);
}

async function exportPpt() {
  const result = await api("/api/report/export-ppt", { method: "POST" });
  alert(`${result.message}\n${result.path || ""}`);
}

async function fillDraft() {
  const submissionId = $("submissionSelect").value;
  const result = await api(`/api/overtime-submissions/${submissionId}/fill-approval-draft`, { method: "POST" });
  $("draftMessage").textContent = result.message;
}

function refreshImportRowsOnly() {
  if (state.importRun) {
    renderImportReviewRows(importDisplayRows(state.importRun));
  }
}

function handleImportFilterChange(event) {
  if (event.target.id === "importFilterQuality") {
    state.importFilters.quality = event.target.value;
    refreshImportRowsOnly();
  }
  if (event.target.id === "importFilterStatus") {
    state.importFilters.status = event.target.value;
    refreshImportRowsOnly();
  }
  if (event.target.id === "importFilterCategory") {
    state.importFilters.category = event.target.value;
    refreshImportRowsOnly();
  }
  if (event.target.id === "importFilterQuery") {
    state.importFilters.query = event.target.value;
    refreshImportRowsOnly();
  }
}

function handleImportReviewChange(event) {
  const key = event.target.dataset.reviewKey;
  const field = event.target.dataset.reviewField;
  if (!key || !field) return;
  saveImportReview(key, { [field]: event.target.value });
  if (field === "action" || field === "category") {
    refreshImportRowsOnly();
  }
}

document.querySelectorAll(".nav-btn").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));
$("refreshBtn").addEventListener("click", loadBootstrap);
$("exportExcelBtn").addEventListener("click", exportExcel);
$("exportPptBtn").addEventListener("click", exportPpt);
$("runImportBtn").addEventListener("click", () => runImport(false).catch((error) => {
  $("importStatus").textContent = "로컬 색인 실패";
  $("importSummary").innerHTML = `<p class="bad">${escapeHtml(error.message)}</p>`;
}));
$("runImportAiBtn").addEventListener("click", () => runImport(true).catch((error) => {
  $("importStatus").textContent = "Gemini 실행 실패";
  $("importSummary").innerHTML = `<p class="bad">${escapeHtml(error.message)}</p>`;
}));
$("importReviewToolbar").addEventListener("input", handleImportFilterChange);
$("importReviewToolbar").addEventListener("change", handleImportFilterChange);
$("importCandidateRows").addEventListener("input", handleImportReviewChange);
$("importCandidateRows").addEventListener("change", handleImportReviewChange);
$("addEntryBtn").addEventListener("click", addEntryRow);
$("saveSubmissionBtn").addEventListener("click", saveSubmission);
$("entitySelect").addEventListener("change", () => {
  updateFactoryOptions();
  renderEmployeeResults([]);
  setLookupState("HR 조회 대기");
});
$("factoryInput").addEventListener("change", () => {
  renderEmployeeResults([]);
  setLookupState("HR 조회 대기");
});
$("employeeSearchBtn").addEventListener("click", searchEmployees);
$("employeeSearchInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchEmployees();
  }
});
$("employeeResults").addEventListener("click", (event) => {
  const button = event.target.closest(".employee-result");
  if (button) {
    applySelectedCandidate(Number(button.dataset.candidateIndex));
  }
});
$("entryRows").addEventListener("click", (event) => {
  const row = event.target.closest("tr");
  if (row) {
    selectEntryRow(row.dataset.rowKey);
  }
});
$("entryRows").addEventListener("change", (event) => {
  if (event.target.dataset.field === "row_select") {
    selectEntryRow(event.target.value);
  }
});
$("loadApprovalBtn").addEventListener("click", loadApprovalPreview);
$("submissionSelect").addEventListener("change", loadApprovalPreview);
$("fillDraftBtn").addEventListener("click", fillDraft);

loadBootstrap().catch((error) => {
  console.error(error);
  alert(`초기 데이터를 불러오지 못했습니다: ${error.message}`);
});
