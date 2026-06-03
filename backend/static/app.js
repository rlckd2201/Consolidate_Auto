const state = {
  bootstrap: null,
  rows: [],
  nextRowId: 1,
  employeeResults: [],
  selectedEmployees: {},
  selectedRowKey: null,
};

const $ = (id) => document.getElementById(id);
const JOB_GROUPS = ["관리직", "간접직", "직접직"];

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

document.querySelectorAll(".nav-btn").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));
$("refreshBtn").addEventListener("click", loadBootstrap);
$("exportExcelBtn").addEventListener("click", exportExcel);
$("exportPptBtn").addEventListener("click", exportPpt);
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
