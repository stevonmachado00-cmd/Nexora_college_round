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
  return `<section class="ds-section"><div class="ds-section-head"><div><h2>Find your starting point</h2><p>Choose a foundation, then shape it around your brand in the builder.</p></div><a class="link" href="/builder">Explore all templates</a></div><div class="ds-template-grid">${nexusStarterTemplates.map(([id,name,category,description])=>`<article class="ds-template-tile"><div class="ds-template-preview" aria-hidden="true"><div><span></span><span></span></div><strong>${esc(name)}</strong><i></i><i></i></div><div><span class="ds-template-category">${esc(category)}</span><h3>${esc(name)}</h3><p>${esc(description)}</p><a class="btn" href="/builder?template=${encodeURIComponent(id)}">Use template</a></div></article>`).join("")}</div></section>`;
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
        ? NexusPages.projectRows(projects)
        : NexusUI.empty({title:"Your next website starts here",description:"Create a draft from a foundation or describe what you want to build.",kind:"website",action:'<a class="btn" href="/builder">Create a website</a>'});
    } catch {
      container.innerHTML = NexusUI.empty({title:"Websites are unavailable",description:"Your saved work could not be loaded. Try again shortly.",kind:"error",action:'<button class="btn" data-action="websites-retry">Try again</button>'});
    }
  });
  return (
    head(
      "Your websites",
      "Real drafts, controlled components, and published snapshots.",
      '<a class="btn primary" href="/builder">＋ Create website</a>',
    ) +
    `<section class="ds-section" style="margin-top:0"><div class="ds-section-head"><h2>Your projects</h2><span>Drafts and published pages</span></div><div id="nexus-saved-websites">${NexusUI.loading('Loading websites')}</div></section>${starterLibrary()}`
  );
}
document.addEventListener('click',event=>{if(event.target.closest('[data-action="websites-retry"]'))renderContent()});
if (page === "website") renderContent();
