(() => {
  const root = document.getElementById("event-root");
  const slug = location.pathname.split("/").filter(Boolean).at(-1);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const dateText = (date, timezone) => new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short", timeZone: timezone }).format(new Date(date)) + ` · ${timezone}`;

  async function start() {
    try {
      const response = await fetch(`/api/webinars/public/${encodeURIComponent(slug)}`);
      const webinar = await response.json();
      if (!response.ok) throw new Error(webinar.error || "This event could not be loaded.");
      root.innerHTML = `<section class="copy"><span class="eyebrow">Webinar · ${esc(webinar.status)}</span><h1>${esc(webinar.title)}</h1><p class="description">${esc(webinar.description)}</p><div class="meta"><span>${esc(dateText(webinar.startsAt, webinar.timezone))}</span><span>${esc(webinar.durationMinutes)} minutes · Hosted by ${esc(webinar.host)}</span><span>${webinar.capacity === null ? "Open registration" : `${Math.max(0, webinar.capacity - webinar.registrationCount)} seats remaining`}</span></div></section><section class="form"><div id="form-wrap"><h2>Reserve your place</h2><p>Register with your email to receive event updates.</p><form id="register-form"><label>Name<input name="name" autocomplete="name" required maxlength="160"></label><label>Email<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label>Company <span class="description">(optional)</span><input name="company" autocomplete="organization" maxlength="160"></label><label class="consent"><input name="consent" type="checkbox" required><span>I agree to receive registration details and event updates for this webinar.</span></label><button type="submit">Register for webinar</button><div id="notice" class="notice" role="status"></div></form></div></section>`;
      document.getElementById("register-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget, button = form.querySelector("button"), notice = document.getElementById("notice");
        const params = new URLSearchParams(location.search);
        button.disabled = true; notice.textContent = "Submitting your registration…";
        try {
          const response = await fetch(`/api/webinars/${encodeURIComponent(webinar.id)}/registrations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.elements.name.value, email: form.elements.email.value, company: form.elements.company.value, consent: form.elements.consent.checked, source: "website", utmSource: params.get("utm_source") || "", utmCampaign: params.get("utm_campaign") || "" }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Registration failed.");
          const joinLink = result.meetingUrl ? `<p><a class="btn primary" href="${esc(result.meetingUrl)}" target="_blank" rel="noopener noreferrer">Join Google Meet ↗</a></p>` : "";
          const calendarMessage = result.calendarInviteSent ? "A Google Calendar invitation has been sent." : result.calendarInviteWarning ? esc(result.calendarInviteWarning) : "We’ve saved your place. Check back for event updates.";
          document.getElementById("form-wrap").innerHTML = `<div class="success"><strong>You’re registered.</strong><br>${result.duplicate ? "This email was already registered for the event." : ""} ${calendarMessage}${joinLink}</div>`;
        } catch (error) { notice.textContent = error.message; notice.classList.add("error"); button.disabled = false; }
      });
    } catch (error) {
      root.innerHTML = `<section class="copy"><span class="eyebrow">Online event</span><h1>Event unavailable</h1><p class="description">${esc(error.message)}</p></section>`;
    }
  }
  start();
})();
