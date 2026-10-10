/* Keep legacy Nexus hash navigation while sending builder actions to the real Puck application. */
document.addEventListener(
  "click",
  (event) => {
    const target = event.target.closest(
      '[data-template],[data-starter],[data-page="builder"],[data-action="go-builder"],[data-action="new-site"]',
    );
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const id = target.dataset.template || target.dataset.starter;
    const aliases = {
      "saas-modern": "saas-modern",
      studio: "agency-clean",
      product: "saas-modern",
      blank: "blank",
    };
    const template = aliases[id];
    location.assign(
      template
        ? `/builder?template=${encodeURIComponent(template)}`
        : "/builder",
    );
  },
  true,
);
function redirectBuilder() {
  if (location.hash === "#builder") location.replace("/builder");
}
window.addEventListener("hashchange", redirectBuilder);
redirectBuilder();
const nexusStarterTemplates = [
  ["saas-modern", "Modern SaaS", "SaaS", "A focused product story"],
  ["fintech-premium", "Premium Fintech", "Fintech", "Trust and clarity"],
  ["agency-clean", "Independent Agency", "Agency", "Editorial portfolio"],
  ["restaurant-cafe", "Restaurant & Cafe", "Restaurant", "Menus and reservations"],
  ["beauty-wellness", "Beauty & Wellness", "Wellness", "Services and bookings"],
  ["commerce-editorial", "Editorial Commerce", "Retail", "Product-led retail"],
  ["coach-course", "Coach & Courses", "Education", "Program and inquiry"],
  ["event-summit", "Event & Summit", "Events", "Agenda and sign-up"],
  ["hospitality-stays", "Stays & Retreats", "Hospitality", "Rooms and table requests"],
  ["community-hub", "Community Hub", "Community", "Resources and gatherings"],
];
function starterLibrary() {
  return `<section class="card" style="padding:23px;margin-bottom:22px"><div class="card-head"><div><h2>Editable starter templates</h2><p style="margin-top:8px">Choose a foundation, then edit every component, image, copy, theme token, and business binding in the visual builder.</p></div><a class="btn" href="/builder">View all templates →</a></div><div class="sites-grid" style="margin-top:18px">${nexusStarterTemplates.map(([id,name,category,description],index)=>`<article class="card" style="padding:0;overflow:hidden"><div class="site-cover ${index%3===1?'alt':index%3===2?'orange':''}"><div class="mini-site"><div class="mini-nav"><strong>${esc(name.split(" ")[0].toLowerCase())}.</strong><span>About &nbsp; Contact</span></div><h3>${esc(name)}</h3><p>${esc(description)}</p></div></div><div style="padding:16px"><span class="pill purple">${esc(category)}</span><h3 style="margin:12px 0 7px">${esc(name)}</h3><a class="btn" style="display:inline-flex;margin-top:8px" href="/builder?template=${encodeURIComponent(id)}">Customize →</a></div></article>`).join("")}</div></section>`;
}
function websites() {
  queueMicrotask(async () => {
    const container = document.getElementById("nexus-saved-websites");
    if (!container) return;
    try {
      const response = await fetch("/api/website-builder/projects");
      if (!response.ok) throw new Error("unavailable");
      const projects = await response.json();
      if (!Array.isArray(projects)) throw new Error("invalid");
      container.innerHTML = projects.length
        ? projects
            .map(
              (p) =>
                `<article class="card" style="padding:24px"><span class="pill ${p.status === "published" ? "green" : ""}">${p.status === "published" ? "Published snapshot" : "Draft"}</span><h2 style="margin:18px 0 8px">${esc(p.name)}</h2><p>/site/${esc(p.slug)}</p><a class="btn" style="margin-top:18px;display:inline-flex" href="/builder/${encodeURIComponent(p.id)}">Open in Puck →</a></article>`,
            )
            .join("")
        : '<div class="card" style="padding:28px"><h2>Your first website starts here.</h2><p>Choose a template or describe your business in the builder.</p><a class="btn primary" style="display:inline-flex;margin-top:15px" href="/builder">Create a website →</a></div>';
    } catch {
      container.innerHTML =
        '<div class="card" style="padding:24px"><h2>Start the Nexus server to load projects.</h2><p>The Puck builder and project API run with npm run dev.</p></div>';
    }
  });
  return (
    head(
      "Your websites",
      "Real drafts, controlled components, and published snapshots.",
      '<a class="btn primary" href="/builder">＋ Create website</a>',
    ) +
    `<div class="card" style="padding:23px;margin-bottom:22px"><h2>Build a website around your business.</h2><p style="margin-top:8px">Choose a designed foundation. Edit visually in Puck. Review assisted changes before applying them.</p><a class="link" style="display:inline-block;margin-top:12px" href="/builder">Explore the website builder →</a></div>${starterLibrary()}<div id="nexus-saved-websites" class="sites-grid"><p>Loading your projects…</p></div>`
  );
}
if (page === "website") renderContent();
