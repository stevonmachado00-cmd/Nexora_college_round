# Nexura Agentic Growth & Operations Engine

## Scope

This context joins three product areas into one connected operating layer:

1. **Marketing automation** — audiences, journeys, campaigns, delivery, and follow-up.
2. **AI business agent** — natural-language planning and coordinated tool use.
3. **Integrated analytics** — unified lifecycle, campaign, revenue, and agent-performance measurement.

Rather than ship them as disconnected features, Nexura should operate as a closed loop:

`Observe → Research → Decide → Plan → Request approval → Execute → Measure → Learn`

## Product behavior

The engine should understand a business instruction, inspect trusted business context, research only when necessary, produce a reviewable plan, request approval for high-impact actions, execute approved tools, and return measurable results.

### Example: webinar growth workflow

1. Create the webinar record.
2. Generate a website registration page from an approved page template.
3. Segment CRM contacts by stated interest and consent.
4. Draft a campaign and present the audience, copy, schedule, and expected reach for approval.
5. Deliver reminders, record registrations and attendance, then trigger follow-up paths.
6. Report registrations, attendance, conversion, revenue influence, and lessons for the next event.

## Recommended agent design

- **Supervisor/orchestrator:** converts user intent into a bounded, observable execution plan.
- **Research agent:** finds and synthesizes publicly available information.
- **CRM agent:** queries, segments, and updates contacts within permissions.
- **Marketing agent:** creates audiences, drafts campaigns, and manages approved journeys.
- **Website, webinar, billing, and analytics agents:** own their respective scoped tools.
- **Approval/security agent:** enforces policy, consent, permissions, and human checkpoints.

Use **LangGraph** as the leading orchestration choice because it supports explicit graph states, routing, durable workflows, and human-in-the-loop checkpoints. Keep models behind a provider-neutral gateway such as **LiteLLM**.

## Approval policy

Require an explicit user approval before:

- Sending or scheduling an external marketing campaign.
- Publishing or materially changing a public website.
- Charging, refunding, or changing a customer subscription.
- Deleting important records.
- Taking browser actions with external side effects.

Drafting, analysis, simulation, internal reporting, and building a proposed audience may proceed without approval, subject to the user’s access rights.

## Recommended platforms and tools

| Need | Recommended tool | Role in Nexura | Notes |
| --- | --- | --- | --- |
| Agent orchestration | **LangGraph** | Runs the multi-agent workflow, state, approvals, and retries. | Keep tool permissions narrow and action logs durable. |
| Competitor Meta-ad research | **AdRadar** | Scans public Meta Ad Library inventory and saves a bounded campaign snapshot for review. | Treat results as research leads; retain the source URL and respect platform terms. |
| AI-native web/company search | **Exa** | Semantic web search and company/person research for prospecting and market context. | Good first-choice hosted research API; validate high-stakes facts. |
| Web crawling | **Crawl4AI** | Self-hostable crawling and structured extraction. | Best when control and predictable operating cost matter. |
| Hosted scraping fallback | **Firecrawl** | Robust crawl/extract option when self-hosting is not preferred. | Assess cost and compliance per workload. |
| Search fallback | **Tavily** | Search optimized for AI workflows. | Useful as a secondary search provider. |
| Browser interaction | **Browser Use** or **Playwright** | Browser automation only where APIs are unavailable. | Run server-side with isolated persistent sessions; do not depend on a developer’s cookies. |
| Marketing automation | **Listmonk** | Self-hosted audiences, lists, and campaign management. | Lean starting point when Nexura owns the workflow UI. |
| Marketing automation suite | **Mautic** | More complete automation and segmentation. | Consider when visual journey automation is needed sooner. |
| Email delivery | **Resend** | Transactional and campaign-email delivery API. | Recommended lightweight pairing: Listmonk + Resend. |
| Alternative email suite | **Brevo** | Email/SMS marketing service. | Use if the team prefers an all-in-one hosted service. |
| Product/lifecycle analytics | **PostHog** | Events, funnels, cohorts, paths, feature flags, and business/product analytics. | Track the full customer lifecycle with a consistent event taxonomy. |
| Agent observability | **Langfuse** | LLM calls, tool calls, traces, latency, token costs, errors, and agent runs. | Essential before agents execute consequential work. |
| External automation | **Activepieces**, **n8n**, or **Composio** | Integrates approved Nexura workflows with third-party apps. | Prefer API-based integrations before browser automation. |
| Model routing | **LiteLLM** | Decouples application code from a single model provider. | Centralize model policy, fallbacks, and cost controls. |

## Unified analytics model

Use a shared event schema across modules. Core event families include:

- Website: `page_viewed`, `form_started`, `lead_created`, `cta_clicked`.
- Marketing: `audience_built`, `campaign_drafted`, `campaign_sent`, `email_opened`, `link_clicked`, `unsubscribed`.
- Webinar: `webinar_registered`, `reminder_sent`, `webinar_attended`, `follow_up_completed`.
- Billing: `checkout_started`, `subscription_started`, `invoice_paid`, `subscription_cancelled`, `usage_reported`.
- Agent: `plan_created`, `approval_requested`, `approval_granted`, `tool_called`, `workflow_completed`, `workflow_failed`.

Key dashboard metrics: lead-to-customer conversion, campaign conversion, webinar registration and attendance, subscription conversion, MRR/ARR, churn, revenue attribution, agent success rate, approval rate, latency, and cost per completed workflow.

## Guardrails

- Keep consent, suppression lists, audience rules, and contact permissions enforceable at the tool layer.
- Separate research data from CRM truth; research findings require review or confidence labeling before they alter customer records.
- Never let an agent invent campaign results, billing state, or customer consent.
- Capture provenance, timestamps, user approvals, and before/after changes for consequential actions.

