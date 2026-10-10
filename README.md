# Nexus frontend concept

A buildless frontend sketch of a connected B2B business workspace.

Run locally with `python -m http.server 4173 --directory dist`, then visit http://localhost:4173.

Includes Overview, Websites, Templates, Website Builder, CRM (contacts, leads, customers, pipeline), Campaigns, AI Agent, Workflows, Analytics, Webinars, Billing (subscriptions, plans, usage), and Settings.

The default homepage tells the Nexus story through an interactive customer journey, four example project showcases, product mockups, an AI planning storyboard, and FAQs. Open `/#projects` for the project workspace, or `/#overview` for the business dashboard. Project filters, search, grid/list views, details, and journey tabs are temporary UI interactions.

The Website Builder is a composable frontend blueprint: start from a starter kit or blank page, add and remove approved page sections, apply shared design tokens, inspect the structured page definition, and review an AI change proposal before applying it locally. No page, lead, token, or AI request is persisted or sent.

The commercial visual system and design sources are documented in `DESIGN.md`. Showcase brands and customer projects are fictional concepts, not endorsements or verified customer results.

All business data and approvals are illustrative. No backend, AI, payment, email, scraping, authentication, or business-data persistence is implemented. Interactions change temporary UI state only. Website preview data uses predefined sections and a structured schema. Fonts load from Google Fonts with system fallbacks.
