(function () {
  const storageKey = "nexora.meta-integrated-analysis.v1";
  const inventoryKey = "nexora.meta-campaign-inventory.v1";
  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const sourceTags = (ids) =>
    (ids || [])
      .map((id) => `<span class="analysis-evidence">${escapeHtml(id)}</span>`)
      .join("");
  const get = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "null");
    } catch {
      return null;
    }
  };
  const set = (report) =>
    localStorage.setItem(storageKey, JSON.stringify(report));
  const clear = () => localStorage.removeItem(storageKey);
  const getInventory = () => {
    try {
      return JSON.parse(localStorage.getItem(inventoryKey) || "null");
    } catch {
      return null;
    }
  };

  function campaignPanel() {
    return `<section class="card meta-campaign-intake" aria-label="Meta Ad Library campaign analysis"><div class="meta-intake-copy"><span class="analysis-kicker">Integrated analysis</span><h2>Turn a competitor’s live Meta ads into an evidence brief</h2><p>Enter a Facebook Page ID. Nexora scans the public Meta Ad Library with AdRadar, then Gemini produces a source-linked analysis in Analytics.</p></div><form id="meta-analysis-form" class="meta-analysis-form"><label>Facebook Page ID<input id="meta-page-id" class="input" name="pageId" inputmode="numeric" pattern="[0-9]{5,30}" placeholder="e.g. 313788932116395" required></label><label>Country<select id="meta-country" class="input" name="country"><option value="IN">India</option><option value="US">United States</option><option value="ALL">All countries</option></select></label><label class="meta-positioning">What do we do differently? <span>Optional but needed for a grounded comparison.</span><textarea id="meta-positioning" class="input" name="positioning" rows="3" maxlength="1500" placeholder="Describe your audience, offer, positioning, constraints, or brand voice."></textarea></label><div class="meta-analysis-actions"><span id="meta-analysis-status" class="subtle">Public ads only. no account login required</span><button class="btn primary" type="submit">Analyze Meta campaigns </button></div></form></section>`;
  }
  function list(items, className, titleKey, bodyKey) {
    return `<div class="analysis-list ${className}">${items.map((item) => `<article><h3>${escapeHtml(item[titleKey])} ${sourceTags(item.evidenceIds)}</h3><p>${escapeHtml(item[bodyKey])}</p>${item.caveat ? `<small>${escapeHtml(item.caveat)}</small>` : ""}${item.confidence ? `<small>Confidence: ${escapeHtml(item.confidence)}</small>` : ""}</article>`).join("")}</div>`;
  }
  function mechanicsList(items) {
    return `<div class="analysis-list analysis-playbook">${items.map((item) => `<article><h3>${escapeHtml(item.pattern)} ${sourceTags(item.evidenceIds)}</h3><p>${escapeHtml(item.whatTheAdsDo)}</p><small><strong>Why this may be in the mix:</strong> ${escapeHtml(item.whyItMayBeUsed)}</small></article>`).join("")}</div>`;
  }
  function analyticsPanel() {
    const data = get();
    const inventory = getInventory();
    const reportMatchesInventory = data && (!inventory?.scannedAt || new Date(data.generatedAt) >= new Date(inventory.scannedAt));
    if (!reportMatchesInventory && inventory?.ads?.length)
      return `<section class="card competitive-analysis-empty"><div class="ds-empty-art" aria-hidden="true">${NexusUI.icon("analytics")}</div><div><span class="analysis-kicker">Saved campaign inventory</span><h2>${escapeHtml(String(inventory.totalCards || inventory.ads.length))} ads are ready for analysis</h2><p>Saved ${escapeHtml(new Date(inventory.scannedAt).toLocaleString())} from Page ID ${escapeHtml(inventory.pageId)}. Gemini has not been called. Generate a cited report directly from this cached 20-ad set—no new Meta scan is required.</p></div><button class="btn primary" data-action="analytics-generate-cached-report">Generate analysis </button></section>`;
    if (!reportMatchesInventory)
      return `<section class="card competitive-analysis-empty"><div class="ds-empty-art" aria-hidden="true">${NexusUI.icon("analytics")}</div><div><span class="analysis-kicker">Integrated analysis</span><h2>Competitive campaign intelligence will appear here</h2><p>Run a Meta Ad Library scan from Campaigns. The report will cite the exact public ad records behind each observation.</p></div><button class="btn" data-page="campaigns">Open Campaigns </button></section>`;
    const { report, sources, model, observedCards, generatedAt } = data;
    const mechanics = report.creativeMechanics?.length
      ? `<section><h3>How the creatives work</h3>${mechanicsList(report.creativeMechanics)}</section>`
      : "";
    const tests = report.nextTests?.length
      ? `<section><h3>Experiments worth testing</h3>${list(report.nextTests, "analysis-differentiation", "test", "rationale")}</section>`
      : "";
    const cacheNote = data.cache?.status === "hit" ? "Reused a matching cached report." : "Generated from the saved campaign inventory.";
    return `<section class="competitive-analysis" aria-label="Meta campaign competitive analysis"><div class="competitive-analysis-head"><div><span class="analysis-kicker">Meta campaign analysis. evidence-backed</span><h2>${escapeHtml(report.headline)}</h2><p>${escapeHtml(report.executiveSummary)}</p></div><div class="analysis-meta"><strong>${escapeHtml(String(observedCards))}</strong><span>observed ad cards</span><span class="pill ${report.confidence === "high" ? "green" : report.confidence === "low" ? "amber" : "purple"}">${escapeHtml(report.confidence)} confidence</span></div></div><div class="analysis-columns"><section><h3>What stands out</h3>${list(report.observations, "analysis-observations", "title", "finding")}</section><section><h3>Competitor playbook</h3>${list(report.competitorPlaybook, "analysis-playbook", "tactic", "interpretation")}</section></div><div class="analysis-columns"><section><h3>Trend signals</h3>${list(report.trends, "analysis-trends", "trend", "caveat")}</section><section><h3>Where to differentiate</h3>${list(report.differentiation, "analysis-differentiation", "opportunity", "recommendation")}</section></div>${mechanics || tests ? `<div class="analysis-columns">${mechanics}${tests}</div>` : ""}<section class="analysis-sources"><div class="analysis-sources-head"><div><h3>Source ledger</h3><p>Each claim above points to one or more public Meta Ad Library records.</p></div><button class="link" data-action="clear-meta-analysis">Clear report</button></div><ol>${sources.map((source) => `<li><span class="analysis-source-id">${escapeHtml(source.id)}</span><div><strong>${escapeHtml(source.advertiser)}</strong><p>${escapeHtml(source.startedRunningOn ? `Started running ${source.startedRunningOn}. ` : "")}${escapeHtml((source.text || "No extractable ad text.").slice(0, 260))}</p><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">View in Meta Ad Library </a></div></li>`).join("")}</ol><p class="analysis-limitations"><strong>What this cannot prove:</strong> ${report.limitations.map(escapeHtml).join(". ")}</p><small>${escapeHtml(cacheNote)} Generated ${escapeHtml(new Date(generatedAt).toLocaleString())} with ${escapeHtml(model)}. Analysis is based only on the cited public inventory.</small></section></section>`;
  }
  async function run(event) {
    event.preventDefault();
    const status = document.getElementById("meta-analysis-status");
    if (status) status.textContent = "Campaign scans are cached first. Open Analytics to generate a report from the saved inventory.";
    if (typeof window.go === "function") window.go("analytics");
  }
  async function generateCachedReport() {
    const inventory = getInventory();
    if (!inventory?.ads?.length) return;
    const button = document.querySelector('[data-action="analytics-generate-cached-report"]');
    if (button) { button.disabled = true; button.textContent = "Generating analysis…"; }
    try {
      const response = await fetch("/api/integrated-analysis/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: inventory.pageId, country: inventory.country, ourPositioning: inventory.ourPositioning || "", ads: inventory.ads }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The analysis could not be generated.");
      set(payload);
      location.hash = "analytics";
      if (typeof window.go === "function") window.go("analytics");
    } catch (error) {
      if (button) { button.disabled = false; button.textContent = "Try again"; let notice = document.querySelector("#analysis-error"); if (!notice) { notice = document.createElement("p"); notice.id="analysis-error"; notice.className="notice error"; notice.setAttribute("role","alert"); button.after(notice); } notice.textContent = error instanceof Error ? error.message : "The analysis could not be generated."; }
    }
  }
  window.NexoraCompetitiveAnalysis = {
    campaignPanel,
    analyticsPanel,
    run,
    generateCachedReport,
    clear,
  };
})();
