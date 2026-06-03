const state = {
  bootstrap: null,
  rows: [],
  nextRowId: 1,
  employeeCandidates: {},
  selectedEmployees: {},
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
    throw new Error(text || response.statusText);
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
      <td><input data-field="date" value="${escapeHtml(row.date || "2026-06-03")}"></td>
      <td>
        <div class="employee-cell">
          <input data-field="name" value="${escapeHtml(row.name || "")}">
          <div class="inline-actions">
            <button type="button" class="ghost small employee-search-btn">검색</button>
            <select data-field="employee_candidate" class="candidate-select"><option value="">후보 없음</option></select>
          </div>
          <span data-field="hr_status" class="row-note">미검색</span>
        </div>
      </td>
      <td><select data-field="job_group">${renderJobGroupOptions(row.job_group || "관리직")}</select></td>
      <td><input data-field="team" value="${escapeHtml(row.team || "")}"></td>
      <td><input data-field="position" value="${escapeHtml(row.position || "")}"></td>
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
  state.employeeCandidates = {};
  state.selectedEmployees = {};
  $("entryRows").innerHTML = sample.map(renderEntryRow).join("");
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
}

function rowField(tr, field) {
  return tr.querySelector(`[data-field="${field}"]`);
}

function rowValue(tr, field) {
  return rowField(tr, field)?.value || "";
}

function setRowStatus(tr, message, level = "") {
  const status = rowField(tr, "hr_status");
  status.textContent = message;
  status.className = `row-note ${level}`.trim();
}

function candidateLabel(candidate) {
  const position = candidate.position || candidate.duty || "-";
  return `${candidate.name} · ${candidate.factory || candidate.db_factory} · ${candidate.department} · ${position} · ${candidate.job_group}`;
}

function applyEmployeeToRow(tr, candidate) {
  const key = tr.dataset.rowKey;
  state.selectedEmployees[key] = candidate;
  rowField(tr, "name").value = candidate.name;
  rowField(tr, "job_group").value = candidate.job_group;
  rowField(tr, "team").value = candidate.department || candidate.org_name || "";
  rowField(tr, "position").value = candidate.position || candidate.duty || "";
  setRowStatus(tr, `${candidate.factory || candidate.db_factory} · ${candidate.classification_reason}`, candidate.confidence);
}

async function searchEmployeeForRow(tr) {
  const key = tr.dataset.rowKey;
  const name = rowValue(tr, "name").trim();
  delete state.selectedEmployees[key];
  if (name.length < 2) {
    setRowStatus(tr, "이름 2글자 이상", "low");
    return;
  }
  setRowStatus(tr, "검색 중");
  const params = new URLSearchParams({
    q: name,
    entity_code: $("entitySelect").value,
    factory: $("factoryInput").value,
  });
  const result = await api(`/api/hr/employees/search?${params.toString()}`);
  state.employeeCandidates[key] = result.items || [];
  const select = rowField(tr, "employee_candidate");
  if (!result.items?.length) {
    select.innerHTML = `<option value="">후보 없음</option>`;
    setRowStatus(tr, "HR 후보 없음", "low");
    return;
  }
  select.innerHTML = `<option value="">후보 선택</option>` + result.items.map((candidate, index) => `
    <option value="${index}">${escapeHtml(candidateLabel(candidate))}</option>
  `).join("");
  if (result.items.length === 1) {
    select.value = "0";
    applyEmployeeToRow(tr, result.items[0]);
  } else {
    setRowStatus(tr, `${result.items.length}명 후보`, "medium");
  }
}

function applySelectedEmployee(tr) {
  const key = tr.dataset.rowKey;
  const index = Number(rowValue(tr, "employee_candidate"));
  const candidate = state.employeeCandidates[key]?.[index];
  if (candidate) {
    applyEmployeeToRow(tr, candidate);
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
      target_factory: employee?.factory || "",
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
$("entitySelect").addEventListener("change", updateFactoryOptions);
$("entryRows").addEventListener("click", (event) => {
  if (event.target.classList.contains("employee-search-btn")) {
    searchEmployeeForRow(event.target.closest("tr")).catch((error) => {
      console.error(error);
      setRowStatus(event.target.closest("tr"), `검색 실패: ${error.message}`, "low");
    });
  }
});
$("entryRows").addEventListener("change", (event) => {
  if (event.target.dataset.field === "employee_candidate") {
    applySelectedEmployee(event.target.closest("tr"));
  }
});
$("loadApprovalBtn").addEventListener("click", loadApprovalPreview);
$("submissionSelect").addEventListener("change", loadApprovalPreview);
$("fillDraftBtn").addEventListener("click", fillDraft);

loadBootstrap().catch((error) => {
  console.error(error);
  alert(`초기 데이터를 불러오지 못했습니다: ${error.message}`);
});
