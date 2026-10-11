(() => {
  const state = { events: [], loading: false, error: "", calendar: { configured: false, connected: false } };
  const api = async (path, options = {}) => {
    const response = await fetch(`/api/webinars${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Webinar request failed.");
    return result;
  };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const pill = (label, tone = "") => `<span class="pill ${tone}">${esc(label)}</span>`;
  const date = (value, timezone) => {
    try { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(new Date(value)) + `. ${timezone}`; }
    catch { return new Date(value).toLocaleString(); }
  };
  const statusClass = (status) => status === "published" ? "purple" : status === "completed" ? "green" : status === "cancelled" ? "amber" : "";

  function calendarCard() {
    const connected = state.calendar.connected;
    const configured = state.calendar.configured;
    return `<div class="card webinar-calendar-connect"><div><strong>Google Calendar</strong><p>${connected ? "Organizer account connected. Calendar permissions are ready." : configured ? "Connect the organizer account to authorize webinar calendar access." : "Google OAuth credentials still need to be configured on the server."}</p></div>${connected ? `<button class="btn" data-webinar-action="google-disconnect">Disconnect</button>` : configured ? `<a class="btn primary" href="/api/webinars/google/connect">Connect Google Calendar</a>` : `<span class="pill">Setup required</span>`}</div>`;
  }

  function render() {
    if (state.loading && !state.events.length) return `<div class="card webinar-state">${NexusUI.loading("Loading webinars")}</div>`;
    if (state.error && !state.events.length) return `<div class="card webinar-state"><h2>Webinars could not be loaded</h2><p>${esc(state.error)}</p><button class="btn" data-webinar-action="refresh">Retry</button></div>`;
    const events = state.events;
    const rows = events.flatMap((event) => (event._registrations || []).map((registration) => ({ ...registration, webinarTitle: event.title })));
    if (window.nexusWebinarTab === "Registrations") return `${calendarCard()}<div class="card"><div class="card-head"><div><h2>All webinar registrations</h2><p>Attendee records linked to a reusable contact identity.</p></div>${pill(`${rows.length} total`, "purple")}</div>${rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Contact</th><th>Webinar</th><th>Status</th><th>Source</th><th>Registered</th></tr></thead><tbody>${rows.map((row) => `<tr><td><div class="person"><span class="avatar">${esc(row.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase())}</span><div>${esc(row.name)}<small>${esc(row.email)}${row.company ? `. ${esc(row.company)}` : ""}</small></div></div></td><td>${esc(row.webinarTitle)}</td><td>${esc(row.status.replace("_", " "))}</td><td>${esc(row.utmSource || row.source)}</td><td>${esc(new Date(row.registeredAt).toLocaleDateString())}</td></tr>`).join("")}</tbody></table></div>` : `${NexusUI.empty({title:"Your guest list starts here",description:"Publish an event and share its registration page to welcome your first attendee.",kind:"crm",compact:true})}`}</div>`;
    return `${calendarCard()}<div class="webinar-toolbar"><div><strong>${events.length}</strong> ${events.length === 1 ? "event" : "events"}. Registration pages and guest lists in one place</div><div class="webinar-toolbar-actions"><button class="btn primary" data-action="form-webinar">+ Create webinar</button><button class="btn" data-webinar-action="refresh">Refresh</button></div></div>${events.length ? `<div class="sites-grid">${events.map((event) => `<article class="card webinar-card"><div class="event-banner"><div><div class="webinar-date-month">${esc(new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric", timeZone: event.timezone }).format(new Date(event.startsAt)).toUpperCase())}</div><strong>${esc(new Intl.DateTimeFormat(undefined, { day: "2-digit", timeZone: event.timezone }).format(new Date(event.startsAt)))}</strong></div><span class="event-symbol" aria-hidden="true">▷</span></div><div class="event-body">${pill(event.status, statusClass(event.status))}<h2>${esc(event.title)}</h2><p>${esc(date(event.startsAt, event.timezone))}</p><div class="webinar-summary"><span>${event.registrationCount} registered</span><span>${event.attendedCount} attended</span></div><div class="event-foot"><span>${event.durationMinutes} min. ${event.capacity === null ? "No limit" : `${event.capacity} seats`}</span><div class="webinar-card-actions"><button class="link" data-webinar-action="detail" data-webinar-id="${event.id}">Manage event </button><button class="link webinar-delete-link" data-webinar-action="delete" data-webinar-id="${event.id}" data-webinar-title="${esc(event.title)}" data-registration-count="${event.registrationCount}">Delete</button></div></div></div></article>`).join("")}</div>` : NexusUI.empty({title:"Bring your audience together",description:"Create an event to manage registrations, attendance, and follow-ups here.",kind:"webinars",action:'<button class="btn" data-action="form-webinar">Create webinar</button>'})}`;
  }

  async function refresh() {
    state.loading = true; state.error = "";
    const content = document.getElementById("webinar-content"); if (content && location.hash.slice(1) === "webinars") content.innerHTML = render();
    try {
      state.calendar = await api("/google/status").catch(() => ({ configured: false, connected: false }));
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
      section.innerHTML = `<div class="card-head"><div><h2>Contacts from webinar registrations</h2><p>Persisted CRM contacts linked to event activity.</p></div>${pill(contacts.length + " contacts", "purple")}</div><div class="table-wrap"><table class="table"><thead><tr><th>Contact</th><th>Company</th><th>Lifecycle</th><th>Updated</th></tr></thead><tbody>${contacts.map((contact) => `<tr><td><div class="person"><span class="avatar">${esc(contact.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase())}</span><div>${esc(contact.name)}<small>${esc(contact.email)}</small></div></div></td><td>${esc(contact.company || "—")}</td><td>${esc(contact.lifecycle)}</td><td>${esc(new Date(contact.updatedAt).toLocaleDateString())}</td></tr>`).join("")}</tbody></table></div>`;
      container.append(section);
    } catch { /* Keep the existing CRM screen usable if the webinar API is unavailable. */ }
  }

  function createForm() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    const d = new Date(Date.now() + 7 * 86400000); d.setMinutes(0, 0, 0);
    const localValue = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    window.modal("Create webinar", `<p>Create an event draft. Publishing makes its public registration page available${state.calendar.connected ? " and creates a Google Calendar event with a Meet link." : "."}</p><label class="field">Event title<input class="input" id="webinar-title" maxlength="160" required placeholder="Enter an event title"></label><label class="field">Description<textarea class="input" id="webinar-description" rows="3" maxlength="3000" required placeholder="Describe what attendees will learn"></textarea></label><div class="webinar-form-grid"><label class="field">Date and time<input class="input" id="webinar-start" type="datetime-local" value="${localValue}" required></label><label class="field">Duration (minutes)<input class="input" id="webinar-duration" type="number" min="5" max="720" value="60" required></label></div><div class="webinar-form-grid"><label class="field">Timezone<input class="input" id="webinar-timezone" value="${esc(tz)}" required></label><label class="field">Host / speaker<input class="input" id="webinar-host" maxlength="160" required placeholder="Enter the host name"></label></div><div class="webinar-form-grid"><label class="field">Registration capacity<input class="input" id="webinar-capacity" type="number" min="1" placeholder="Leave blank for unlimited"></label><label class="field">Meeting URL<input class="input" id="webinar-meeting" type="url" placeholder="https://... (optional manual link)"></label></div><div id="webinar-form-error" class="notice error" role="alert"></div>`, `<button class="btn primary" data-webinar-action="create">Save draft</button>`);
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
    return `<p>${esc(event.description)}</p>
      <div class="detail-stat"><div><strong>${registrations.length}</strong><small>Registrations</small></div><div><strong>${attended}</strong><small>Attended / partial</small></div><div><strong>${noShows}</strong><small>No-shows</small></div></div>
      <div class="webinar-detail-meta"><span><strong>When</strong>${esc(date(event.startsAt, event.timezone))}</span><span><strong>Host</strong>${esc(event.host)}</span><span><strong>Status</strong>${esc(event.status)}</span><span><strong>Registration page</strong>${event.status === "published" ? `<a href="/events/${encodeURIComponent(event.slug)}" target="_blank" rel="noopener">/events/${esc(event.slug)} </a>` : "Publish this event to make its page available."}</span>${event.meetingUrl ? `<span><strong>Google Meet</strong><a href="${esc(event.meetingUrl)}" target="_blank" rel="noopener">Join meeting </a></span>` : ""}</div>
      <div class="webinar-actions">${event.status === "draft" ? `<button class="btn primary" data-webinar-action="publish" data-webinar-id="${event.id}">Publish registration page</button>` : ""}${event.status === "published" ? `<a class="btn" href="/events/${encodeURIComponent(event.slug)}" target="_blank" rel="noopener">Open registration page </a>` : ""}<button class="btn" data-webinar-action="attendance" data-webinar-id="${event.id}">Import attendance CSV</button><button class="btn" data-webinar-action="followup" data-segment="attended" data-webinar-id="${event.id}">Draft attendee follow-up (${attended})</button><button class="btn" data-webinar-action="followup" data-segment="no_show" data-webinar-id="${event.id}">Draft no-show follow-up (${noShows})</button></div>
      <h3 class="webinar-subhead">Registrations</h3>${registrations.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Contact</th><th>Status</th><th>Attendance</th><th>Registered</th></tr></thead><tbody>${registrations.map((row) => `<tr><td><div class="person"><span class="avatar">${esc(row.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase())}</span><div>${esc(row.name)}<small>${esc(row.email)}${row.company ? `. ${esc(row.company)}` : ""}</small></div></div></td><td>${esc(row.status.replace("_", " "))}</td><td>${row.minutesAttended} min</td><td>${esc(new Date(row.registeredAt).toLocaleDateString())}</td></tr>`).join("")}</tbody></table></div>` : `${NexusUI.empty({title:"No registrations yet",description:"Share the event’s registration page to start your guest list.",kind:"crm",compact:true})}`}
      <div class="webinar-drafts"><strong>Follow-up drafts</strong>${(event.followUps || []).length ? (event.followUps || []).map((draft) => `<div class="follow-up-draft"><span>${esc(draft.segment.replace("_", " "))}. ${draft.audienceCount} contacts. Draft</span><button class="link" data-webinar-action="followup-view" data-webinar-id="${event.id}" data-follow-up-id="${draft.id}">View message</button></div>`).join("") : `${NexusUI.empty({title:"Keep the conversation going",description:"Import attendance, then prepare a follow-up for your guests.",kind:"campaigns",compact:true})}`}</div>`;
  }

  function detail(id) {
    const event = state.events.find((item) => item.id === id);
    if (!event) return;
    window.modal(event.title, detailMarkup(event), `${event.status === "draft" ? `<button class="btn danger" data-webinar-action="delete" data-webinar-id="${event.id}" data-webinar-title="${esc(event.title)}" data-registration-count="${event.registrationCount}">Delete webinar</button>` : ""}<button class="btn" data-action="close">Done</button>`);
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
      if (action === "google-disconnect") {
        await api("/google/disconnect", { method: "POST", body: "{}" });
        await refresh(); window.toast("Saved Google Calendar connection removed."); return;
      }
      if (action === "create") return create();
      if (action === "delete") {
        const title = button.dataset.webinarTitle || "this webinar";
        const registrationCount = Number(button.dataset.registrationCount || 0);
        const impact = registrationCount ? ` This also deletes ${registrationCount} registration${registrationCount === 1 ? "" : "s"} and related follow-up drafts.` : " This also deletes its registration and follow-up records.";
        const calendarWarning = state.calendar.connected ? " If it has a Google Calendar event, that event will be removed and Calendar may notify invitees." : " If the Google account is disconnected, any existing Calendar event will remain.";
        if (!window.confirm(`Delete “${title}”?${impact}${calendarWarning} This cannot be undone.`)) return;
        const result = await api(`/${id}`, { method: "DELETE" });
        await refresh();
        if (result.calendarDeleteWarning) window.toast(result.calendarDeleteWarning); else window.toast(`“${title}” deleted.`);
        return;
      }
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
      if (action === "followup-view") {
        const webinar = state.events.find((event) => event.id === id);
        const draft = webinar?.followUps?.find((item) => item.id === button.dataset.followUpId);
        if (!draft) return window.toast("That follow-up draft is no longer available.");
        window.modal("Follow-up message draft", `<p>${esc(draft.audienceCount)} consented ${esc(draft.segment.replace("_", " "))} contacts. Not sent</p><label class="field">Subject<input class="input" id="follow-up-subject" maxlength="200" value="${esc(draft.subject)}"></label><label class="field">Message<textarea class="input" id="follow-up-body" rows="8" maxlength="5000">${esc(draft.body)}</textarea></label><p>Personalization token: <code>{{first_name}}</code>. Email delivery is not configured in this local version.</p>`, `<button class="btn" data-action="close">Close</button><button class="btn primary" data-webinar-action="followup-save" data-webinar-id="${id}" data-follow-up-id="${draft.id}">Save draft</button>`);
      }
      if (action === "followup-save") {
        const subject = document.getElementById("follow-up-subject").value.trim();
        const body = document.getElementById("follow-up-body").value.trim();
        await api(`/${id}/follow-ups/${button.dataset.followUpId}`, { method: "PUT", body: JSON.stringify({ subject, body }) });
        await refresh(); detail(id); window.toast("Follow-up draft saved. It has not been sent.");
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
