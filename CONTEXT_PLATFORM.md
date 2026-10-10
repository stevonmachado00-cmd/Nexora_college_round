# Nexura (working name): AI-Powered Business Operating Platform

> Source note: the original requirements refer to the product as **Nexus**. This project uses **Nexura** as its working name. Confirm the final product name before publishing product-facing material.

## Product summary

Nexura is a B2B SaaS business operating platform that connects the tools businesses normally run separately: a website builder, CRM, marketing, webinars, subscriptions and billing, analytics, and AI-assisted workflows.

The product is not a loose bundle of modules. Its core value is a shared source of truth that lets customer and business data travel through the full lifecycle:

`Website visitor → Lead → CRM contact → Marketing campaign → Webinar registration → Attendance → Follow-up → Subscription → Analytics`

## Problem statement

Businesses often assemble separate tools for websites, contacts, marketing, payments, events, and reporting. This creates fragmented data, duplicate manual work, disconnected workflows, and poor end-to-end visibility. Existing AI products generally help with isolated tasks rather than coordinating outcomes across the business lifecycle.

Nexura addresses this by making each module aware of the same people, events, plans, campaigns, and conversions—and by allowing a controlled AI agent to coordinate approved multi-step work.

## Product goals

- Let businesses publish and manage conversion-oriented websites without code.
- Maintain a central CRM for leads, customers, lifecycle stages, activity, registrations, and subscriptions.
- Run campaigns and webinar journeys from the same customer data.
- Support recurring and usage-based SaaS billing.
- Measure the funnel from acquisition through revenue and retention.
- Let operators instruct an AI agent in natural language while retaining approval over consequential actions.

## Major product modules

### 1. Template-first website builder

Businesses select an industry-oriented template and edit structured content: copy, imagery, typography, colors, spacing, alignment, section order, and approved component variants. Pages should use structured JSON and design tokens—not arbitrary generated React or CSS. See [CONTEXT_WEBSITE_BUILDER.md](CONTEXT_WEBSITE_BUILDER.md).

### 2. Intelligent CRM

The CRM is the central customer record. It manages leads, contacts, customers, lifecycle status, registrations, campaign interactions, webinar participation, and subscription relationships.

### 3. Webinar management

Create events, collect registrations, track attendance, send reminders and follow-ups, and report webinar performance. Registration components on Nexura websites should bind directly to webinar records.

### 4. SaaS billing

Manage plans, recurring payments, usage-based pricing, customer subscriptions, billing state, and revenue reporting. Website pricing blocks should eventually bind to live plans. See [CONTEXT_SAAS_BILLING.md](CONTEXT_SAAS_BILLING.md).

### 5. Agentic Growth & Operations Engine

This is the connected layer that combines Marketing Automation, the AI Business Agent, and Integrated Analytics. It observes data, researches, plans, asks for approval where needed, executes through controlled tools, measures outcomes, and uses results to improve future recommendations. See [CONTEXT_AGENTIC_GROWTH_AND_ANALYTICS.md](CONTEXT_AGENTIC_GROWTH_AND_ANALYTICS.md).

## Example user outcomes

- “Create a webinar for our Java course next Saturday, create a registration page, promote it to interested leads, track registrations, and follow up with attendees.”
- “Find promising companies interested in developer tools, qualify them, create a campaign, and show me the audience before sending anything.”

## Design and architecture principles

- **Connected by default:** modules exchange events through a shared domain model rather than ad hoc exports.
- **Human approval for impact:** sending campaigns, publishing a website, charging customers, deleting important data, and changing subscription settings require confirmation.
- **Controlled AI tools:** agents call scoped functions such as `crm.create_lead`, `website.update_theme`, or `marketing.create_campaign`; they do not receive unrestricted system access.
- **Specialized agents, one orchestrator:** a supervisor coordinates research, CRM, marketing, website, webinar, billing, analytics, and approval/security responsibilities. LangGraph is the leading orchestration candidate.
- **Auditable operations:** every agent action should be traceable to its initiating request, inputs, approvals, tool calls, result, and metrics.
- **API-first and event-aware:** model core entities and events once so modules can consume the same lifecycle data.

## Suggested future technical direction

| Layer | Direction |
| --- | --- |
| Frontend | React / Next.js, initially hosted on Vercel |
| Main API | Spring Boot or equivalent service backend |
| AI service | Python + FastAPI + LangGraph |
| Primary data store | PostgreSQL |
| Deployment | Docker/container deployment to a VPS, cloud VM, Render, Railway, AWS, GCP, or Azure |

Open-source services may be self-hosted; self-hosted means deployable on managed infrastructure, not dependent on a developer laptop.

## Current phase: frontend/UI concept only

The immediate deliverable is a polished UI sketch using mock data. It should establish the application shell, navigation, dashboard, module pages, tables, charts, forms, empty states, website builder, CRM, webinar, billing, agentic workflows, and analytics views.

Do **not** implement backend logic, real AI integrations, payments, scraping, campaign delivery, or persistent business workflows in this phase.

## Visual direction

Nexura should feel like a premium, modern B2B SaaS product: professional, clean, trustworthy, data-oriented, and AI-native without looking futuristic for its own sake. Prefer light or neutral surfaces, strong typography, restrained accent color, subtle borders, readable density, clear hierarchy, and purposeful status badges. Avoid neon/cyberpunk styling, excessive gradients, playful dashboard decoration, generic Bootstrap aesthetics, and excessive rounding or animation.

