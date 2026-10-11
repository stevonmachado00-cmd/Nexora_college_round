# Nexus Business Agent

A small LangGraph workflow for Nexus's AI Business Agent. It works with no API key: a deterministic planner turns a request into approved Nexus actions. This keeps the demo reliable while the real model integration is still pending.

## Business-analysis system prompt

[`src/business-analysis-prompt.ts`](src/business-analysis-prompt.ts) contains the production-ready system prompt for the model-backed advisor. It tells the future model to combine CRM, Meta Ads, website, webinar, campaign, and billing information into an evidence-based business review.

It covers key measures such as lead quality, pipeline conversion, spend, CPM, CTR, CPC, CPL, qualified-lead cost, ROAS, landing-page conversion, webinar attendance, follow-up conversion, revenue, retention, and data quality. Its output is strict JSON so the Nexus UI can render a scorecard, findings, recommendations, and data gaps reliably.

When wiring a model, provide this system prompt plus a structured analytics snapshot. Never send raw database access or allow the model to set `approvedActionIds`; sensitive actions remain behind the existing LangGraph approval gate.

## Run

```powershell
cd agent
npm install
npm run dev
```

The default demo deliberately stops at approval because sending a campaign is a customer-facing action.

## Approval flow

1. Call `runBusinessAgent({ request })`.
2. Render `result.plan` in the Nexus UI.
3. If `result.status` is `awaiting_approval`, let an authorized user approve the listed action IDs.
4. Call `runBusinessAgent({ request, approvedActionIds: ["action_4"] })` to continue.

## Adding a model later

Only replace `makePlan()` in `src/agent.ts`. The model must produce a schema-validated list of `PlannedAction` values; it must never decide that a sensitive action is approved. Keep the graph's approval gate and tool permissions unchanged.

Replace `executeLocally()` with calls to the website, CRM, marketing, webinar, billing, and analytics modules as each backend API becomes available.
