# Nexus frontend concept

A buildless frontend sketch of a connected B2B business workspace.

Run the complete app with `npm ci` then `npm run dev`, and visit http://localhost:4173. Open `/builder` for the integrated Puck website builder. `npm test` runs validation/persistence tests; `npm run build` and `npm start` run the production build locally.

Includes Overview, Websites, Templates, Website Builder, CRM (contacts, leads, customers, pipeline), Campaigns, AI Agent, Workflows, Analytics, Webinars, Billing (subscriptions, plans, usage), and Settings.

The default homepage tells the Nexus story through an interactive customer journey, four example project showcases, product mockups, an AI planning storyboard, and FAQs. Open `/#projects` for the project workspace, or `/#overview` for the business dashboard. Project filters, search, grid/list views, details, and journey tabs are temporary UI interactions.

The Website Builder uses Puck 0.23, controlled React sections, three structured templates, shared theme tokens, durable local project storage, reviewed AI change proposals, clean preview routes and published snapshots. The default composer is a clearly labeled deterministic demo; a server-side OpenAI-compatible provider can be configured without changing the editor. See [implementation notes](docs/WEBSITE_BUILDER.md) for the architecture diagram, file map, environment, workflows and limitations.

The commercial visual system and design sources are documented in `DESIGN.md`. Showcase brands and customer projects are fictional concepts, not endorsements or verified customer results.

The existing business dashboard data remains illustrative. The builder now has a server API and project persistence in ignored `.nexus-data/`, but no authentication, payments, email, scraping or live CRM connections. Actual AI calls require a configured server provider; default demo generation needs no keys. Published routes are local to the running server. Legacy homepage fonts use Google Fonts with system fallbacks; website templates use system fonts.
