(() => {
  const originalRenderContent = renderContent;
  const originalAction = action;
  const originalRender = render;
  const api = "/api/integrations";
  const themeStorageKey = "nexus-theme";
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const state = (label, online) => `<span class="integration-state ${online ? "online" : "offline"}" title="${label}">${online ? "Connected" : "Needs attention"}</span>`;
  function activeTheme() {
    try { return localStorage.getItem(themeStorageKey); } catch { return null; }
  }
  function setTheme(theme) {
    document.body.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try { localStorage.setItem(themeStorageKey, theme); } catch { /* Theme still works for this visit. */ }
    const button = document.querySelector("[data-action='theme-toggle']");
    if (button) {
      const dark = theme === "dark";
      button.innerHTML = `${NexusUI.icon(dark ? "sun" : "moon")}<span class="theme-toggle-label">${dark ? "Light" : "Dark"}</span>`;
      button.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
      button.setAttribute("aria-pressed", String(dark));
    }
    document.getElementById("billing-console")?.contentWindow?.postMessage({ type: "nexus-theme", theme }, window.location.origin);
  }
  function addThemeToggle() {
    const actions = document.querySelector(".topactions");
    if (!actions || actions.querySelector("[data-action='theme-toggle']")) return;
    const button = document.createElement("button");
    button.className = "theme-toggle";
    button.dataset.action = "theme-toggle";
    button.type = "button";
    actions.insertBefore(button, actions.querySelector(".divider"));
    setTheme(document.body.dataset.theme || "light");
  }
  render = function () {
    originalRender();
    addThemeToggle();
  };

  const crmPipeline = {
    "New lead": [["Layers", "James Wilson", "Website", "$2,400"], ["Forma", "Daniel Brooks", "Campaign", "$1,800"]],
    "Qualified": [["Acme Studio", "Olivia Lee", "Webinar", "$4,800"], ["Pulse", "Michael Reed", "Website", "$3,200"]],
    "Proposal": [["Atlas Works", "Priya Shah", "Referral", "$6,400"]],
    "Customer": [["Orbit", "Sophia Chen", "Campaign", "$149 / mo"], ["Mono", "Amelia Kim", "Webinar", "$149 / mo"]]
  };
  const crmImportStorageKey = "nexus.crm-local-import.v1";
  const loadCrmImport = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(crmImportStorageKey) || "null");
      return Array.isArray(saved?.contacts) ? saved : { contacts: [] };
    } catch { return { contacts: [] }; }
  };
  const saveCrmImport = (data) => localStorage.setItem(crmImportStorageKey, JSON.stringify(data));
  const clearCrmImport = () => localStorage.removeItem(crmImportStorageKey);
  const initials = (value) => value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  const crmPersonRows = () => {
    const imported = loadCrmImport().contacts.map((contact) => [initials(contact.name), contact.name, contact.email || "No email", contact.company || "—", contact.status || "New lead", contact.source || "Spreadsheet import"]);
    return [...people, ...imported];
  };
  function crmImportSummary() {
    const imported = loadCrmImport();
    if (!imported.contacts.length) return "No file imported yet. Sample records remain available below.";
    const date = imported.importedAt ? new Date(imported.importedAt).toLocaleString() : "this browser session";
    return `${imported.contacts.length} contact${imported.contacts.length === 1 ? "" : "s"} imported from ${escapeHtml(imported.fileName || "a spreadsheet")} · ${date}`;
  }
  function bindCrmImport() {
    const input = document.getElementById("crm-import-file");
    if (!input || input.dataset.bound) return;
    input.dataset.bound = "true";
    input.addEventListener("change", () => {
      const [file] = input.files || [];
      if (file) void importCrmFile(file);
      input.value = "";
    });
  }
  async function importCrmFile(file) {
    const progress = document.getElementById("crm-import-progress");
    const allowed = /\.(csv|xlsx)$/i.test(file.name);
    if (!allowed) { if (progress) progress.innerHTML = '<p class="crm-import-error">Choose a CSV or XLSX file.</p>'; return; }
    if (file.size > 5 * 1024 * 1024) { if (progress) progress.innerHTML = '<p class="crm-import-error">Keep the file under 5 MB for this local import.</p>'; return; }
    if (progress) progress.innerHTML = '<p class="crm-import-pending">Reading columns and validating contacts locally…</p>';
    try {
      const response = await fetch(`${api}/crm/import`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream", "X-Nexus-File-Name": file.name },
        body: await file.arrayBuffer(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The spreadsheet could not be imported.");
      saveCrmImport(data);
      toast(`${data.contacts.length} contacts are ready in this browser.`, "ok");
      renderContent();
    } catch (error) {
      if (progress) progress.innerHTML = `<p class="crm-import-error">${escapeHtml(error.message || "The spreadsheet could not be imported.")}</p>`;
    }
  }
  const crmWorkspace = () => {
    const activeTab = tab || "All contacts";
    const pipeline = Object.entries(crmPipeline).map(([stage, deals]) => `<div class="column"><h3>${stage} ${badge(String(deals.length), stage === "Customer" ? "green" : stage === "Proposal" ? "purple" : "")}</h3>${deals.map(([company, contact, source, value]) => `<article class="deal"><h3>${company}</h3><p>${contact}. ${source}</p><div class="deal-footer"><span>${value}</span>${badge(stage, stage === "Customer" ? "green" : "purple")}</div></article>`).join("")}</div>`).join("");
    const metrics = `<div class="metrics"><div class="card metric"><div class="metric-top"><span>Open pipeline</span><span class="metric-icon">♧</span></div><div class="metric-value">$18.6k</div><div class="metric-foot"><span class="up"> 8 active deals</span><span>illustrative</span></div></div><div class="card metric"><div class="metric-top"><span>Imported contacts</span><span class="metric-icon">⇧</span></div><div class="metric-value">${loadCrmImport().contacts.length}</div><div class="metric-foot"><span class="up">Local only</span><span>this browser</span></div></div><div class="card metric"><div class="metric-top"><span>Customers</span><span class="metric-icon">▦</span></div><div class="metric-value">892</div><div class="metric-foot"><span class="up"> 8.2%</span><span>sample workspace</span></div></div></div>`;
    const allContacts = crmPersonRows();
    const contactList = activeTab === "Customers" ? allContacts.filter((person) => person[4] === "Customer") : activeTab === "Leads" ? allContacts.filter((person) => person[4] !== "Customer") : allContacts;
    const imported = loadCrmImport();
    const importer = `<section class="card crm-import" aria-labelledby="crm-import-title"><div><span class="analysis-kicker">Bring your own contacts</span><h2 id="crm-import-title">Import a CRM spreadsheet</h2><p>Choose CSV or XLSX with common columns such as Name, Email, Company, Status, and Source. Nexus maps the first worksheet and keeps the normalized contact list only in this browser.</p></div><div class="crm-import-actions"><input id="crm-import-file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden><button class="btn primary" data-action="crm-import-picker">Choose spreadsheet </button>${imported.contacts.length ? '<button class="btn" data-action="crm-import-clear">Clear local import</button>' : ""}</div><div id="crm-import-progress" class="crm-import-status"><span>${crmImportSummary()}</span><small>Your original file is not stored or sent to a CRM. Maximum 500 valid contacts / 5 MB.</small></div></section>`;
    return head("Nexus CRM", "Import a contact spreadsheet, review it in context, and keep the working list in this browser.", badge("Local import ready", "purple")) + importer + tabs(["All contacts", "Leads", "Customers", "Pipeline"]) + (activeTab === "Pipeline" ? `<section class="board" aria-label="Demo sales pipeline">${pipeline}</section>` : `${metrics}<section class="card" style="margin-top:var(--nx-space-24)"><div class="card-head"><div><h2>${activeTab}</h2><p>${imported.contacts.length ? "Your imported contacts are shown alongside illustrative demo records." : "Preloaded sample records are available until you import a spreadsheet."}</p></div>${badge(`${contactList.length} contacts`, "purple")}</div><div class="table-wrap"><table class="table"><thead><tr><th>Contact</th><th>Company</th><th>Status</th><th>Source</th></tr></thead><tbody>${contactList.map((person) => `<tr><td><div class="person"><span class="avatar">${escapeHtml(person[0])}</span><div>${escapeHtml(person[1])}<small>${escapeHtml(person[2])}</small></div></div></td><td>${escapeHtml(person[3])}</td><td>${badge(escapeHtml(person[4]), person[4] === "Customer" ? "green" : person[4] === "Qualified" ? "purple" : "")}</td><td>${escapeHtml(person[5])}</td></tr>`).join("")}</tbody></table></div><p class="bottomnote" style="padding:var(--nx-space-16);margin:0">Imported records are browser-local. They are not sent to the demo CRM or any external service.</p></section>`);
  };
  const campaignsWorkspace = () => head("Competitor ads, in focus", "Search public Meta Ad Library inventory, then review the campaign mix in a decision-ready format.", btn("Refresh status", "analyst-refresh")) + `
    <section class="card integration-panel" id="analyst-workbench">
      <div class="card-head" style="padding:0 0 var(--nx-space-16)"><div><h2>Integrated analyst</h2><p>Save a snapshot of public ads to understand a competitor’s approach.</p></div><span class="integration-state">Checking AdRadar…</span></div>
      <div class="analyst-inputs"><label class="field">Facebook Page ID<input id="analyst-page-id" class="input" inputmode="numeric" placeholder="Enter a numeric Facebook Page ID"></label><label class="field">Country<select id="analyst-country" class="input"><option value="ALL">All countries</option><option value="IN">India</option><option value="US">United States</option></select></label><label class="field analyst-positioning">Your positioning <span>Optional — used only for grounded differentiation.</span><textarea id="analyst-positioning" class="input" rows="3" maxlength="1500" placeholder="What you offer, who it is for, or the angle you want to compare."></textarea></label></div>
      <div class="integration-actions"><button class="btn primary" data-action="analyst-run">Scan 20 live ads </button><button class="btn" data-action="analyst-load-saved">Open saved scan</button><span class="subtle">Your scan is saved in this browser for later analysis.</span></div>
      <div class="analyst-progress" id="analyst-progress" aria-live="polite"></div>
    </section>`;
  const agentWorkspace = () => head("What’s your next move?", "Describe the outcome. Review a clear plan before taking action.") + `
    <section class="card integration-panel" id="agent-workbench">
      <div class="card-head" style="padding:0 0 var(--nx-space-16)"><div><h2>Business agent</h2><p>Bring your website, audience, and campaigns into the same plan.</p></div><span class="integration-state">Ready to plan</span></div>
      <label class="field" for="agent-request">Your goal</label><textarea id="agent-request" class="input" rows="4" placeholder="Describe the work you would like the agent to prepare."></textarea>
      <div class="integration-actions"><button class="btn primary" data-action="agent-run">Prepare plan</button><span class="subtle">Send and publish actions require your approval.</span></div>
    </section>`;
  const billingWorkspace = () => head("Billing", "Manage live plans, subscriptions, and billing activity without leaving Nexus.") + `
    <section class="billing-embed-shell">
      <iframe id="billing-console" class="billing-embed" title="Nexus Billing Console" src="/billing/console.html?embed=1&theme=${document.body.dataset.theme || "light"}"></iframe>
    </section>`;

  function activateWorkspaceMotion(content) {
    content.classList.remove("nx-motion-page");
    // This only runs on a route change, never during scroll or input.
    void content.offsetWidth;
    content.classList.add("nx-motion-page");
  }
  function mountWorkspace(content, markup) {
    content.innerHTML = markup;
    activateWorkspaceMotion(content);
  }
  renderContent = function () {
    const content = document.getElementById("content");
    if (page === "webinars") { window.nexusWebinarTab = tab || "Events"; mountWorkspace(content, head("Webinars", "Meaningful conversations, from invitation to follow-up.") + tabs(["Events", "Registrations"]) + `<div id="webinar-content" class="ds-webinar-body">${NexoraWebinars.render()}</div>`); void NexoraWebinars.refresh(); return; }
    if (page === "analytics") { mountWorkspace(content, head("Analytics", "Understand the patterns. Keep the evidence in view.") + window.NexoraCompetitiveAnalysis.analyticsPanel()); return; }
    // Websites has a real builder bridge. It is intentionally not part of the
    // generic empty-state map even when the workspace has no saved projects.
    if (page === "website") { mountWorkspace(content, websites()); return; }
    // Workflows remains the working module supplied by Nexora_dummy.
    if (NexusPages[page] && page !== "workflows") { mountWorkspace(content, NexusPages[page]()); return; }
    if (page === "billing") { mountWorkspace(content, billingWorkspace()); return; }
    if (page === "crm") { mountWorkspace(content, crmWorkspace()); bindCrmImport(); return; }
    if (page === "campaigns") { mountWorkspace(content, campaignsWorkspace()); void refreshAnalyst(); return; }
    if (page === "agent") { mountWorkspace(content, agentWorkspace()); return; }
    originalRenderContent();
    activateWorkspaceMotion(content);
  };

  async function refreshCrm() {
    try {
      const result = await fetch(`${api}/status`).then((response) => response.json());
      const target = document.querySelector("#crm-workbench .integration-state");
      if (target) target.outerHTML = state("Frappe CRM", result.crm.online);
    } catch {
      const target = document.querySelector("#crm-workbench .integration-state");
      if (target) target.textContent = "○ Service check unavailable";
    }
  }
  async function refreshAnalyst() {
    try {
      const result = await fetch(`${api}/status`).then((response) => response.json());
      const target = document.querySelector("#analyst-workbench .integration-state");
      if (target) target.outerHTML = state(result.analyst.ready ? "AdRadar ready" : "Build required", result.analyst.ready);
    } catch {
      const target = document.querySelector("#analyst-workbench .integration-state");
      if (target) target.textContent = "○ Service check unavailable";
    }
  }
  function setWorkbench(id, title, body) {
    const target = document.getElementById(id);
    if (target) target.innerHTML = `<div class="nx-workbench-reveal"><h2>${title}</h2>${body}</div>`;
  }
  async function runAgent(approvedActionIds = []) {
    const request = document.getElementById("agent-request")?.value.trim() || window.nexusLastRequest;
    if (!request) return;
    window.nexusLastRequest = request;
    setWorkbench("agent-workbench", "Business agent", NexusUI.loading("Preparing your plan"));
    try {
      const result = await fetch(`${api}/agent/plan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request, approvedActionIds }) }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to prepare the plan.");
        return data;
      });
      const pending = result.plan.filter((item) => item.needsApproval && !approvedActionIds.includes(item.id));
      window.nexusPendingApprovals = pending.map(item => item.id);
      setWorkbench("agent-workbench", "Business agent", `<p>${escapeHtml(result.request)}</p><div class="agent-plan">${result.plan.map((item, index) => `<div class="planstep"><span class="stepnum">${index + 1}</span><div><h3>${escapeHtml(item.description)}</h3><p>${escapeHtml(item.name)}</p></div>${item.needsApproval ? '<span class="pill amber">Approval required</span>' : '<span class="pill green">Prepared</span>'}</div>`).join("")}</div>${pending.length ? '<div class="integration-actions"><button class="btn primary" data-action="agent-approve">Approve sensitive step</button><span class="subtle">Only the customer-facing send step requires approval.</span></div>' : `<p class="integration-result">${result.results.map((item) => escapeHtml(item.message)).join("\n")}</p>`}`);
    } catch (error) { setWorkbench("agent-workbench", "Business agent", NexusUI.empty({title:"The plan could not be prepared",description:escapeHtml(error.message),kind:"error",action:'<button class="btn" data-action="agent-run">Try again</button>'})); }
  }
  const safeMediaUrl = (value) => { try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : ""; } catch { return ""; } };
  const renderAd = (ad) => { const media = (ad.media || [])[0]; const mediaUrl = safeMediaUrl(media?.thumbnailUrl || media?.url || ""); const visual = mediaUrl ? `<img src="${escapeHtml(mediaUrl)}" alt="Creative preview for ${escapeHtml(ad.pageName)}" loading="lazy">` : `<div class="analyst-media-empty">Creative preview unavailable</div>`; return `<article class="analyst-ad"><div class="analyst-phone"><div class="analyst-phone-bar"><span>${escapeHtml(ad.pageName)}</span><small>Sponsored</small></div><p class="analyst-primary-text">${escapeHtml((ad.bodyText || ad.text || "No primary text captured.").replace(/\s+/g, " ").slice(0, 500))}</p><div class="analyst-media">${visual}</div><div class="analyst-ad-copy"><strong>${escapeHtml(ad.headline || "Headline not captured")}</strong><span>${escapeHtml(ad.cta || "CTA not captured")}</span></div></div><div class="analyst-card-meta"><span>${escapeHtml(ad.startedRunningOn || "Start date unavailable")}</span><a href="${escapeHtml(ad.adLibraryUrl)}" target="_blank" rel="noopener noreferrer">Meta source </a></div></article>`; };
  function renderAnalystResult(result) {
    const categoryList = result.categories.map((item) => `<span class="analyst-category"><strong>${item.count}</strong>${escapeHtml(item.name)}</span>`).join("");
    const reportAction = '<span class="pill green">Inventory cached</span><button class="btn" data-page="analytics">Generate analysis in Analytics </button>';
    return `<div class="analyst-results"><div class="analyst-result-head"><div><span class="analysis-kicker">Saved 20-ad campaign inventory</span><h2>${escapeHtml(result.totalCards)} active ad creatives, visually organized</h2><p>Page ID ${escapeHtml(result.pageId)}. ${escapeHtml(result.country)}. saved ${new Date(result.scannedAt).toLocaleString()}. ${escapeHtml(result.uniqueCreativeConcepts)} distinct copy concepts observed.</p></div><div class="row">${reportAction}</div></div><div class="analyst-category-list">${categoryList}</div><section class="analyst-section"><div><h3>20 stored creative previews</h3><p>Each card uses the publicly visible creative image when available. Headline and CTA are best-effort extractions from the public ad card.</p></div><div class="analyst-ad-grid">${result.ads.map((ad) => renderAd(ad)).join("")}</div></section><p class="analyst-disclaimer">Source: public Meta Ad Library via AdRadar. This bounded 20-ad snapshot is stored locally for review and analysis; it does not show spend, impressions, targeting, conversion rate, or profitability.</p></div>`;
  }
  function updateProgress(events) {
    const target = document.getElementById("analyst-progress");
    if (!target) return;
    target.innerHTML = `<div class="analyst-progress-head"><strong>${escapeHtml(events.at(-1)?.stage || "Preparing")}</strong><span>${events.length} update${events.length === 1 ? "" : "s"}</span></div><ol>${events.slice(-6).map((event) => `<li><span></span><div><strong>${escapeHtml(event.stage)}</strong><p>${escapeHtml(event.detail)}</p></div></li>`).join("")}</ol>`;
  }
  const savedInventoryKey = "nexora.meta-campaign-inventory.v1";
  function saveInventory(result) {
    localStorage.setItem(savedInventoryKey, JSON.stringify(result));
  }
  function loadSavedInventory() {
    try { return JSON.parse(localStorage.getItem(savedInventoryKey) || "null"); } catch { return null; }
  }
  function openSavedInventory() {
    const result = loadSavedInventory();
    if (!result?.ads?.length) { document.getElementById("analyst-progress").innerHTML = NexusUI.empty({title:"No saved scans yet",description:"Scan a Facebook Page above to save its public ads for later review.",kind:"campaigns",compact:true}); return; }
    const workbench = document.getElementById("analyst-workbench");
    if (workbench) workbench.innerHTML = renderAnalystResult(result);
    window.nexoraAnalystResult = result;
    toast("Opened the locally saved campaign inventory.", "ok");
  }
  async function runAnalyst() {
    const pageId = document.getElementById("analyst-page-id")?.value.trim(); const country = document.getElementById("analyst-country")?.value || "ALL"; const ourPositioning = document.getElementById("analyst-positioning")?.value.trim() || "";
    if (!/^\d{5,30}$/.test(pageId || "")) { const progress = document.getElementById("analyst-progress"); if (progress) progress.innerHTML = '<p class="analyst-error">Enter a numeric Facebook Page ID to start the scan.</p>'; return; }
    try { const health = await fetch(`${api}/status`, { signal: AbortSignal.timeout(3000) }); if (!health.ok) throw new Error(); } catch { const progress = document.getElementById("analyst-progress"); if (progress) progress.innerHTML = '<p class="analyst-error">Nexora’s local server is unavailable on port 4173. Start it with <code>npm run dev</code> from the Nexora_dummy folder, then refresh this page.</p>'; return; }
    const events = [{ stage: "Connecting", detail: "Opening the live AdRadar progress stream" }]; updateProgress(events);
    const source = new EventSource(`${api}/analyst/scan-stream?pageId=${encodeURIComponent(pageId)}&country=${encodeURIComponent(country)}&ourPositioning=${encodeURIComponent(ourPositioning)}`);
    source.addEventListener("progress", (event) => { const update = JSON.parse(event.data); events.push(update); updateProgress(events); });
    source.addEventListener("result", (event) => { source.close(); const result = JSON.parse(event.data); localStorage.removeItem("nexora.meta-integrated-analysis.v1"); saveInventory(result); events.push({ stage: "Ready", detail: "20-ad inventory saved locally and ready for on-demand Analytics reporting" }); const workbench = document.getElementById("analyst-workbench"); if (workbench) workbench.innerHTML = renderAnalystResult(result); window.nexoraAnalystResult = result; toast("20 ads saved locally. Generate an analysis later from Analytics—no rescan needed.", "ok"); });
    source.addEventListener("failure", (event) => { source.close(); const data = JSON.parse(event.data); events.push({ stage: "Could not finish", detail: data.error || "AdRadar could not complete the scan." }); updateProgress(events); });
    source.onerror = () => { if (source.readyState !== EventSource.CLOSED) { source.close(); events.push({ stage: "Connection lost", detail: "The scan stream disconnected before AdRadar returned a result." }); updateProgress(events); } };
  }
  action = function (name) {
    if (name === "theme-toggle") { setTheme(document.body.dataset.theme === "dark" ? "light" : "dark"); if (page === "settings") renderContent(); return; }
    if (name === "crm-refresh") return void refreshCrm();
    if (name === "crm-open") return window.open("http://127.0.0.1:8000/crm/lead", "_blank", "noopener");
    if (name === "crm-import-picker") return void document.getElementById("crm-import-file")?.click();
    if (name === "crm-import-clear") { clearCrmImport(); toast("The browser-local import was cleared.", "ok"); return renderContent(); }
    if (name === "analyst-refresh") return void refreshAnalyst();
    if (name === "analyst-run") return void runAnalyst();
    if (name === "analyst-load-saved") return void openSavedInventory();
    if (name === "analytics-generate-cached-report") return void window.NexoraCompetitiveAnalysis.generateCachedReport();
    if (name === "billing-retry") { renderContent(); return; }
    if (name === "agent-run") return void runAgent();
    if (name === "agent-approve") return void runAgent(window.nexusPendingApprovals || []);
    return originalAction(name);
  };
  if (page === "integrations") {
    history.replaceState(null, "", `${location.pathname}${location.search}#overview`);
    page = "overview";
  }
  const savedTheme = activeTheme();
  setTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light");
  render();
})();
