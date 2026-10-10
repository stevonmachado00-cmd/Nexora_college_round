(() => {
  const state = { events: [], loading: false, error: "" };
  const api = async (path, options = {}) => {
    const response = await fetch(`/api/webinars${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Webinar request failed.");
    return result;
  };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const date = (value, timezone) => {
    try { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(new Date(value)) + ` · ${timezone}`; }
    catch { return new Date(value).toLocaleString(); }
  };
  const statusClass = (status) => status === "published" ? "purple" : status === "completed" ? "green" : status === "cancelled" ? "amber" : "";

  function render() {
    if (state.loading && !state.events.length) return `<div class="card webinar-state"><p>Loading webinars…</p></div>`;
    if (state.error && !state.events.length) return `<div class="card webinar-state"><h2>Webinars could not be loaded</h2><p>${esc(state.error)}</p><button class="btn" data-webinar-action="refresh">Retry</button></div>`;
    const events = state.events;
    const rows = events.flatMap((event) => (event._registrations || []).map((registration) => ({ ...registration, webinarTitle: event.title })));
    if (document.querySelector('.tab.selected')?.dataset.tab === "Registrations") return `<div class="card"><div class="card-head"><div><h2>All webinar registrations</h2><p>Attendee records linked to a reusable contact identity.</p></div>${window.badge ? window.badge(`${rows.length} total`, "purple") : ""}</div>${rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>CONTACT</th><th>WEBINAR</th><th>STATUS</th><th>SOURCE</th><th>REGISTERED</th></tr></thead><tbody>${rows.map((row) => `<tr><td><div class="person"><span class="avatar">${esc(row.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase())}</span><div>${esc(row.name)}<small>${esc(row.email)}${row.company ? ` · ${esc(row.company)}` : ""}</small></div></div></td><td>${esc(row.webinarTitle)}</td><td>${esc(row.status.replace("_", " "))}</td><td>${esc(row.utmSource || row.source)}</td><td>${esc(new Date(row.registeredAt).toLocaleDateString())}</td></tr>`).join("")}</tbody></table></div>` : `<div class="webinar-state"><p>No registrations yet. Publish an event and share its registration page.</p></div>`}</div>`;
    return `<div class="webinar-toolbar"><div><strong>${events.length}</strong> ${events.length === 1 ? "event" : "events"} · Registration pages and guest lists in one place</div><button class="btn" data-webinar-action="refresh">Refresh</button></div>${events.length ? `<div class="sites-grid">${events.map((event) => `<article class="card webinar-card"><div class="event-banner"><div><div class="webinar-date-month">${esc(new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric", timeZone: event.timezone }).format(new Date(event.startsAt)).toUpperCase())}</div><strong>${esc(new Intl.DateTimeFormat(undefined, { day: "2-digit", timeZone: event.timezone }).format(new Date(event.startsAt)))}</strong></div><span class="event-symbol" aria-hidden="true">▷</span></div><div class="event-body">${window.badge ? window.badge(esc(event.status), statusClass(event.status)) : esc(event.status)}<h2>${esc(event.title)}</h2><p>${esc(date(event.startsAt, event.timezone))}</p><div class="webinar-summary"><span>${event.registrationCount} registered</span><span>${event.attendedCount} attended</span></div><div class="event-foot"><span>${event.durationMinutes} min · ${event.capacity === null ? "No limit" : `${event.capacity} seats`}</span><button class="link" data-webinar-action="detail" data-webinar-id="${event.id}">Manage event →</button></div></div></article>`).join("")}</div>` : `<div class="card webinar-state"><div class="empty"><div class="spark" style="margin:0 auto 16px">▷</div><h2>Create your first webinar</h2><p>Set up an event, publish its registration page, and manage guests and follow-ups here.</p><button class="btn primary" data-action="form-webinar">Create webinar</button></div></div>`}`;
  }

  async function refresh() {
    state.loading = true; state.error = "";
    const content = document.getElementById("content"); if (content && location.hash.slice(1) === "webinars") content.innerHTML = render();
    try {
      state.events = await api("/");
      const details = await Promise.all(state.events.map(async (event) => {
        const detail = await api(`/${event.id}`);
        return { ...event, ...detail, _registrations: detail.registrations };
      }));
      state.events = details;
    } catch (error) { state.error = error.message; }
    state.loading = false;
    if (content && location.hash.slice(1) === "webinars") content.innerHTML = render();
  }

  async function loadContacts() {
    const container = document.getElementById("content");
    if (!container) return;
    document.getElementById("webinar-crm-contacts")?.remove();
    try {
      const contacts = await api("/contacts");
      if (!contacts.length || location.hash.slice(1) !== "crm") return;
      const section = document.createElement("section");
      section.id = "webinar-crm-contacts";
      section.className = "card webinar-crm-contacts";
      section.innerHTML = `<div class="card-head"><div><h2>Contacts from webinar registrations</h2><p>Persisted CRM contacts linked to event activity.</p></div>${window.badge(contacts.length + " contacts", "purple")}</div><div class="table-wrap"><table class="table"><thead><tr><th>CONTACT</th><th>COMPANY</th><th>LIFECYCLE</th><th>UPDATED</th></tr></thead><tbody>${contacts.map((contact) => `<tr><td><div class="person"><span class="avatar">${esc(contact.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase())}</span><div>${esc(contact.name)}<small>${esc(contact.email)}</small></div></div></td><td>${esc(contact.company || "—")}</td><td>${esc(contact.lifecycle)}</td><td>${esc(new Date(contact.updatedAt).toLocaleDateString())}</td></tr>`).join("")}</tbody></table></div>`;
      container.append(section);
    } catch { /* Keep the existing CRM screen usable if the webinar API is unavailable. */ }
  }

  function createForm() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    const d = new Date(Date.now() + 7 * 86400000); d.setMinutes(0, 0, 0);
    const localValue = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    window.modal("Create webinar", `<p>Create an event draft. Publishing makes its public registration page available.</p><label class="field">Event title<input class="input" id="webinar-title" maxlength="160" required placeholder="Growth Masterclass"></label><label class="field">Description<textarea class="input" id="webinar-description" rows="3" maxlength="3000" required placeholder="What will attendees learn?"></textarea></label><div class="webinar-form-grid"><label class="field">Date and time<input class="input" id="webinar-start" type="datetime-local" value="${localValue}" required></label><label class="field">Duration (minutes)<input class="input" id="webinar-duration" type="number" min="5" max="720" value="60" required></label></div><div class="webinar-form-grid"><label class="field">Timezone<input class="input" id="webinar-timezone" value="${esc(tz)}" required></label><label class="field">Host / speaker<input class="input" id="webinar-host" value="Nexora team" maxlength="160" required></label></div><div class="webinar-form-grid"><label class="field">Registration capacity<input class="input" id="webinar-capacity" type="number" min="1" placeholder="Leave blank for unlimited"></label><label class="field">Meeting URL<input class="input" id="webinar-meeting" type="url" placeholder="https://... (optional)"></label></div><div id="webinar-form-error" class="notice error" role="alert"></div>`, `<button class="btn primary" data-webinar-action="create">Save draft</button>`);
  }

  async function create() {
    const title = document.getElementById("webinar-title").value.trim();
    const description = document.getElementById("webinar-description").value.trim();
    const start = new Date(document.getElementById("webinar-start").value);
    const capacityText = document.getElementById("webinar-capacity").value;
    const body = { title, description, startsAt: start.toISOString(), timezone: document.getElementById("webinar-timezone").value.trim(), durationMinutes: Number(document.getElementById("webinar-duration").value), host: document.getElementById("webinar-host").value.trim(), capacity: capacityText ? Number(capacityText) : null, meetingUrl: document.getElementById("webinar-meeting").value.trim() };
    try { const event = await api("/", { method: "POST", body: JSON.stringify(body) }); window.close(); await refresh(); detail(event.id); }
    catch (error) { document.getElementById("webinar-form-error").textContent = error.message; }
  }

  function detailMarkup(event) {
    const registrations = event._registrations || [];
    const attended = registrations.filter((item) => item.status === "attended" || item.status === "partial").length;
    const noShows = registrations.filter((item) => item.status === "no_show").length;
    return `<p>${esc(event.description)}</p><div class="detail-stat"><div><strong>${registrations.length}</strong><small>Registrations</small></div><div><strong>${attended}</strong><small>Attended / partial</small></div><div><strong>${noShows}</strong><small>No-shows</small></div></div><div class="webinar-detail-meta"><span><strong>When</strong>${esc(date(event.startsAt, event.timezone))}</span><span><strong>Host</strong>${esc(event.host)}</span><span><strong>Status</strong>${esc(event.status)}</span><span><strong>Registration page</strong>${event.status === "published" ? `<a href="/events/${encodeURIComponent(event.slug)}" target="_blank" rel="noopener">/events/${esc(event.slug)} ↗</a>` : "Publish this event to make its page available."}</span></div><div class="webinar-actions">${event.status === "draft" ? `<button class="btn primary" data-webinar-action="publish" data-webinar-id="${event.id}">Publish registration page</button>` : ""}${event.status === "published" ? `<a class="btn" href="/events/${encodeURIComponent(event.slug)}" target="_blank" rel="noopener">Open registration page ↗</a>` : ""}<button class="btn" data-webinar-action="attendance" data-webinar-id="${event.id}">Import attendance CSV</button><button class="btn" data-webinar-action="followup" data-segment="attended" data-webinar-id="${event.id}">Draft attendee follow-up (${attended})</button><button class="btn" data-webinar-action="followup" data-segment="no_show" data-webinar-id="${event.id}">Draft no-show follow-up (${noShows})</button></div><h3 class="webinar-subhead">Registrations</h3>${registrations.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>CONTACT</th><th>STATUS</th><th>ATTENDANCE</th><th>REGISTERED</th></tr></thead><tbody>${registrations.map((row) => `<tr><td><div class="person"><span class="avatar">${esc(row.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase())}</span><div>${esc(row.name)}<small>${esc(row.email)}${row.company ? ` · ${esc(row.company)}` : ""}</small></div></div></td><td>${esc(row.status.replace("_", " "))}</td><td>${row.minutesAttended} min</td><td>${esc(new Date(row.registeredAt).toLocaleDateString())}</td></tr>`).join("")}</tbody></table></div>` : `<p>No one has registered yet.</p>`}<div class="webinar-drafts"><strong>Follow-up drafts</strong>${(event.followUps || []).length ? (event.followUps || []).map((draft) => `<span>${esc(draft.segment.replace("_", " "))} · ${draft.audienceCount} contacts · Draft</span>`).join("") : `<span>No follow-up drafts yet.</span>`}</div>`;
  }

  function detail(id) {
    const event = state.events.find((item) => item.id === id);
    if (!event) return;
    window.modal(event.title, detailMarkup(event), `<button class="btn" data-action="close">Done</button>`);
  }

  function attendanceForm(id) {
    window.modal("Import webinar attendance", `<p>Paste CSV rows with email and minutes attended. Use the headers <code>email,minutesAttended</code>. Matching registrations will be updated.</p><label class="field">Attendance CSV<textarea class="input" id="attendance-csv" rows="8" placeholder="email,minutesAttended&#10;alex@example.com,54"></textarea></label><div id="attendance-error" class="notice error" role="alert"></div>`, `<button class="btn primary" data-webinar-action="attendance-save" data-webinar-id="${id}">Import attendance</button>`);
  }

  function parseCsv(raw) {
    const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const rows = lines.map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
    const header = rows[0].map((cell) => cell.toLowerCase());
    const emailIndex = header.indexOf("email"), minutesIndex = header.findIndex((cell) => ["minutesattended", "minutes", "durationminutes"].includes(cell));
    if (emailIndex < 0 || minutesIndex < 0) throw new Error("CSV must include email and minutesAttended columns.");
    return rows.slice(1).map((row) => ({ email: row[emailIndex], minutesAttended: Number(row[minutesIndex]) })).filter((row) => row.email && Number.isFinite(row.minutesAttended));
  }

  async function handle(action, button) {
    const id = button.dataset.webinarId;
    try {
      if (action === "refresh") return refresh();
      if (action === "create") return create();
      if (action === "detail") return detail(id);
      if (action === "publish") { await api(`/${id}/publish`, { method: "POST", body: "{}" }); await refresh(); detail(id); return; }
      if (action === "attendance") return attendanceForm(id);
      if (action === "attendance-save") {
        const rows = parseCsv(document.getElementById("attendance-csv").value);
        const result = await api(`/${id}/attendance/import`, { method: "POST", body: JSON.stringify({ rows }) });
        window.close(); await refresh(); detail(id); window.toast(`Attendance imported: ${result.matched} matched, ${result.unmatched} unmatched.`); return;
      }
      if (action === "followup") {
        const result = await api(`/${id}/follow-ups/draft`, { method: "POST", body: JSON.stringify({ segment: button.dataset.segment }) });
        await refresh(); detail(id); window.toast(`Follow-up draft prepared for ${result.audienceCount} consented contacts. It has not been sent.`);
      }
    } catch (error) {
      const target = document.getElementById(action === "attendance-save" ? "attendance-error" : "webinar-form-error");
      if (target) target.textContent = error.message; else window.toast(error.message);
    }
  }

  document.addEventListener("click", (event) => {
    const appButton = event.target.closest('[data-action="form-webinar"]');
    if (appButton) { event.preventDefault(); event.stopImmediatePropagation(); createForm(); return; }
    const button = event.target.closest("[data-webinar-action]");
    if (!button) return;
    event.preventDefault();
    handle(button.dataset.webinarAction, button);
  });
  window.NexoraWebinars = { render, refresh, createForm, loadContacts };
})();
