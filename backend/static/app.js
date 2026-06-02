const state = {
  bootstrap: null,
  rows: [],
};

const $ = (id) => document.getElementById(id);

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
      <td>${row.job_group}</td>
      <td>${row.team}</td>
      <td>${row.name || "-"}</td>
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
}

function renderSubmissionSelect(submissions) {
  $("submissionSelect").innerHTML = submissions.map((submission) => `
    <option value="${submission.id}">${submission.id} · ${submission.factory} · ${submission.submitter}</option>
  `).join("");
}

function renderEntryRows() {
  const sample = [
    ["2026-06-03", "관리직", "생산", "서동철", 1, 8, "생산관리 총괄"],
    ["2026-06-03", "간접직", "보전", "", 2, 8, "특근라인 설비대응"],
  ];
  $("entryRows").innerHTML = sample.map((row) => `
    <tr>
      ${row.map((value, index) => `<td><input data-col="${index}" value="${value}"></td>`).join("")}
    </tr>
  `).join("");
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
  const row = document.createElement("tr");
  row.innerHTML = ["2026-06-03", "관리직", "", "", 1, 8, ""].map((value, index) => `<td><input data-col="${index}" value="${value}"></td>`).join("");
  $("entryRows").appendChild(row);
}

async function saveSubmission() {
  const rows = [...$("entryRows").querySelectorAll("tr")].map((tr, index) => {
    const values = [...tr.querySelectorAll("input")].map((input) => input.value);
    return {
      id: `new-${Date.now()}-${index}`,
      date: values[0],
      company: $("entitySelect").selectedOptions[0].textContent.split(" ")[0],
      source_factory: $("factoryInput").value,
      job_group: values[1],
      team: values[2],
      name: values[3],
      headcount: Number(values[4] || 0),
      hours: Number(values[5] || 0),
      category1: "특근대응",
      category2: "자동분류 대기",
      detail: values[6],
      confidence: "low",
      review_status: "needs_review",
      source: "manual",
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
$("loadApprovalBtn").addEventListener("click", loadApprovalPreview);
$("submissionSelect").addEventListener("change", loadApprovalPreview);
$("fillDraftBtn").addEventListener("click", fillDraft);

loadBootstrap().catch((error) => {
  console.error(error);
  alert(`초기 데이터를 불러오지 못했습니다: ${error.message}`);
});
