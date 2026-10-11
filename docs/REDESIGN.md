# Nexus visual system — audit and design contract

Audit completed before UI implementation, 11 October 2026. Scope: all first-party routes in this checkout, including the separate billing service, public registration, builder, and generated-site components. External Frappe CRM and Meta pages are external products, not Nexus screens.

## Route and state inventory

| Route / screen | Existing states and subviews | Audit / intended focal point |
| --- | --- | --- |
| `/`, `/#home` | Marketing, journey tabs, project categories, FAQ, mobile menu, project detail modal | Repetitive sections, many competing CTAs, blue everywhere. One editorial proposition and workspace action. |
| `/#overview` | Generic empty workspace; obsolete illustrative KPI/chart/activity renderer | Replace anonymous empty box with useful launch workspace; no invented performance numbers. |
| `/#projects` | Generic empty override; legacy concept grid/list/search/detail | Real saved projects with loading, empty, error, populated list; separate concepts from saved work. |
| `/#website` | Ten templates, saved draft/published projects, fetch loading/error/empty | Template cards dominate actual work. Saved projects first; template library secondary. |
| `/#builder` | Redirect to `/builder` | Preserve redirect. |
| `/#crm` | Checking, connected, disconnected, failed service check; legacy contacts/leads/customers/pipeline/detail | Connection workspace with a clear primary open action and a real unavailable state. |
| `/#campaigns` | Scan form, validation error, service error, streaming progress, disconnected stream, saved scan absent, populated ad inventory, missing creative | Form is focal; progress and saved inventory get deliberate layouts. |
| `/#analytics` | No scan, cached inventory ready, generating, generation failure, populated report, evidence ledger, clear report | Empty analysis preview or executive report is focal; sources recede. |
| `/#agent` | Prompt, preparing, plan, approval required, prepared result, error | Prompt and proposed plan are two sequential focal points, not stacked heroes. |
| `/#webinars` | Loading, error/retry, calendar disconnected/configured/connected, events empty/populated, registrations empty/populated | Existing refresh drops page heading and tabs. Preserve heading/tabs across every state; event list focal. |
| Webinar dialogs | Create/validation, event detail, publish, attendance CSV/error/result, follow-up empty/list/view/edit, delete confirmation | Shared dialog, form and data-list rules. |
| `/#workflows` | Generic empty override; obsolete security/planner/trace panels | Honest capability empty state linked to agent planning. |
| `/#billing` | Embedded console, currently connection-refused iframe | Add first-party loading/unavailable/retry treatment; same token system in embedded console. |
| `/console.html` (billing service 4175) | Login/validation/loading/error, connected/unconfigured provider, plans/subscriptions/invoices count, empty/populated tables, logout | Login primary action; operational table hierarchy after login. |
| `/#settings` | Generic placeholder; legacy general/team/integrations tabs | Useful appearance and connection settings matching available capabilities. |
| `/#integrations` | Redirect to overview | Preserve compatibility. |
| `/builder` | Provider health, template filters (10 industries), generation prompt/busy/error, blank creation, saved project loading/error/empty/populated | Prompt primary; templates and saved projects secondary. |
| `/builder/:id` | Loading, missing/error, Puck section library, canvas, field inspector, desktop/tablet/mobile, selection, undo/redo, saved/unsaved/saving | Canvas primary; quiet tools and field hierarchy. |
| Builder assistant | Closed, instruction, preparing, proposal/diff, discard/apply, stale proposal, error | Shared form/status system. |
| Builder publish dialog | Slug, validation, busy, success, error | One publish action. |
| `/preview/:id` | Loading, invalid/missing, empty draft, populated website | Shared loading/error shell; authored website theme retained. |
| `/site/:slug` | Loading, unavailable, published website | Same state shell; authored brand tokens remain user data. |
| `/events/:slug`, `/event.html` | Loading, missing/error, published event/capacity, registration form, validation/submitting/error, success/duplicate/Meet | Event title primary; registration form secondary. |
| Global overlays | Search/results, notifications, help, account, toast, confirmation, mobile sidebar, light/dark | Shared type, focus, overlay elevation, icon family and navigation. |

## Reusable component inventory

Shell/sidebar/nav group/active item, workspace switcher, breadcrumb, search trigger and command dialog, account menu, theme toggle; brand mark; primary/secondary/text/destructive/icon buttons; tabs and segmented filters; title/description/action header; data table/row/avatar/contact identity; metric strip and chart; form/label/help/input/select/textarea/checkbox/radio; status badge and integration health; project/template/media preview tiles; editorial section; operational panel; status/error/success notice; illustrative empty state; skeleton/progress; dialog/backdrop/footer/focus return; toast; timeline/steps; evidence reference/source ledger; responsive drawers; FAQ disclosure; editor toolbar/inspector/library/AI proposal/publish review.

Generated-site catalog: Navbar, Hero, LogoCloud, Features, Stats, HowItWorks, Testimonials, Pricing, FAQ, CTA, Footer, TextBlock, ImageBlock, Gallery, Menu, Team, Contact, ProductGrid, ArticleFeed, CourseCatalog, EventSchedule, VideoFeature, ProfileCard, ResourceLibrary, CommunityFeed, DashboardMetrics, CareerOpenings, StayCards, LeadForm, NewsletterSignup, AppointmentBooking, TableReservation, ServiceMenu. Authored brand colors are intentionally distinct from workspace UI. Shared spacing, accessible controls, and loading/error chrome apply across their preview/published routes.

## Anti-pattern audit

The machine-readable occurrence inventory in `visual-audit-before.json` records each matching file/line/selector and value before migration, including inline styles. This covers dormant components as well as live routes.

| Anti-pattern | Locations / root cause |
| --- | --- |
| All-caps eyebrows | `app.js` head/metric/table labels, `experience.js` section tags via CSS, `modules.js` workflow labels, `console.html/js`, `Hub.tsx`, `Editor.tsx`, analysis kickers and template labels. |
| Arrow-suffixed actions | All workspace template actions, homepage CTAs/icons, builder bridge, analysis actions/sources, webinar detail links, billing/console, Hub and Editor. Replace textual arrows, retain only meaningful diagram connectors and undo icons. |
| Middle-dot metadata | Workspace identity, status badges, date/timezone, inventory metadata, follow-up rows, billing labels, builder status, console and public registration. Use sentences or distinct labeled fields. |
| One card style everywhere | `.card`, `.nb-template-card`, `.nb-prompt-card`, status/metrics/forms/empty containers across every sheet. Separate bordered data panels, open metric strips, inset forms and editorial sections. |
| Accent doing every job | Blue/purple hard-coded separately in styles, premium, integrations, analytics, builder/Puck and console. Action ink, plum brand/selection, neutral underlined links, high-contrast focus, semantic status. |
| Sentence-only empty/loading | Generic workspace routes; saved projects; analytics; missing saved scan toast; webinar registrations/drafts; billing tables; builder loading; missing ad image. Add schematic illustration/skeleton plus next action. |
| Arbitrary spacing | All legacy CSS, inline template styles and generated-site CSS use unrelated 3/5/7/9/10/11/13/15/18/22/23/26/30px values. Migrate padding, margins and gaps to shared 8px tokens; geometry (1px borders, icon strokes, positioned illustration strokes) is not layout spacing. |

## Design system — defined before implementation

Brand idea: a quiet junction where work connects. Use a compact connected-node mark, warm paper, ink controls, and a restrained aubergine selection accent. No decorative success/warning/error colors.

Six core colors: `--nx-brand: #684B72`, `--nx-ink: #25242A`, `--nx-paper: #FAF9F6`, `--nx-success: #287452`, `--nx-warning: #946315`, `--nx-error: #B43E43`. Surface, muted text, lines and brand tint are derived with `color-mix`; dark mode reverses the neutral roles and uses readable derived status tones.

Type: self-hosted DM Sans (body/controls, 400/500/600), Manrope (headings, 500/600). Scale: 12/14/16/20/24/32/48/64px. Body 14px/1.6, page headings 32px/1.2, marketing 64px/1.08. Sentence case, no tracking on body, modest negative tracking on large headings only.

Spacing: 0 or 8/16/24/32/48/64px. Layout widths and illustration geometry are separate from spacing. Radius: 8px controls, 16px panels/dialogs, round avatar only. Border: 1px. No resting card shadows; one neutral overlay shadow for dialogs/popovers. Control height 40px; mobile targets at least 40px.

Navigation: frequent work first (Overview, Websites, CRM, Campaigns, Analytics), creation/planning next (AI agent, Webinars, Projects, Workflows), settings and billing at bottom. Active item has a 2px plum edge plus a quiet tint, no solid fill. One 1.6px outlined SVG family. Top bar groups breadcrumb, search and account with explicit separators and flexible space.

Hierarchy: each route's single focal point is listed above. Empty states use a neutral schematic with one clear sentence and a useful action. Status is never decoration. Loading is a quiet skeleton with reduced-motion support. Errors stay beside the failed work and provide recovery. Narrow layouts collapse the sidebar and stack columns without hiding functionality.

## Per-page changelog

| Page / area | What changed and why |
| --- | --- |
| Home | Replaced the multi-CTA template layout with one editorial proposition, a connected-node visual, and one clear workspace action. Home remains the first screen at `/`. |
| Overview | Replaced illustrative revenue and generic empty cards with a launch workspace and honest progress cues; no fabricated business metrics. |
| Projects | Saved work is a scan-friendly list with distinct loading, error, empty, and populated states; templates and concepts no longer masquerade as projects. |
| Websites and builder hub | Saved sites lead, while the template library and generation prompt sit below; templates use image-led tiles, and the editor canvas remains focal. |
| Builder editor, preview, published sites | Toolbar, inspector, assistant, dialogs, loading and errors inherit the shared system. Customer-authored website brand themes remain independent. |
| CRM | Connection status and next action are separated; semantic status colors are reserved for service health. |
| Campaigns | Scan form, progress, failures and inventory use the same type and spacing rules, with evidence rows quieter than the main action. |
| Analytics | No-report state has a schematic preview and a clear scan action; populated report/evidence hierarchy uses restrained panels. |
| AI agent | Prompt and approval/result states use one control family and emphasize the current step. |
| Webinars | Stable heading/tabs across refreshes; events, registrations, forms and dialogs use the shared state and control styling. |
| Workflows | Replaced a generic empty box with a capability explanation and route to agent planning. |
| Billing and console | Embedded service gets a first-party loading/unavailable/retry state; console sign-in, tables and empty states receive the same type, color and component rules. |
| Settings | Replaced placeholder tabs with appearance and connection settings, avoiding nonfunctional save controls. |
| Public registration | Event page, registration states, loading and unavailable treatment use the same neutral structural language. |
| Global shell | Sidebar and top bar now share one outline icon family, edge-accent active state, grouped breadcrumb/search/account controls, and responsive drawer behavior. |

## Verification

- `npm run build`: passed (TypeScript and Vite). The builder resolves the shared stylesheet and self-hosted font files from the existing `/dist` static root at runtime; Vite emits non-fatal build-time resolution notices for those root-absolute paths.
- `npm test`: 6/6 passed, including project durability, publish snapshot and webinar lifecycle tests. The sandbox initially denied loopback ports; the allowed localhost rerun passed.
- `npm run billing:test`: 1/1 passed on the allowed localhost rerun.
- Browser-reviewed home, overview, websites, analytics, webinars, settings light/dark, builder hub/editor/assistant, billing unavailable, console sign-in, public-event error and the narrow home layout. All workspace routes rendered without runtime exceptions.
- The billing service on port 4175 was not running during visual review; `/#billing` deliberately shows its styled unavailable/retry state. Starting that service enables the embedded console.
