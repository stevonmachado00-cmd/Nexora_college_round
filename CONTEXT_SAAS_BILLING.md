# Nexura SaaS Billing Context

## Purpose

The billing module lets Nexura businesses define offers, manage customer subscriptions, collect recurring or usage-based revenue, and understand billing health in the same platform that manages customers, websites, marketing, webinars, and analytics.

## Core capabilities

- Product and plan catalog.
- Fixed recurring subscriptions (monthly, annual, and custom intervals).
- Usage-based pricing and metered usage records.
- Customer-to-subscription relationships.
- Billing and payment status.
- Invoices, payment history, cancellations, upgrades, downgrades, trials, and grace periods.
- Revenue reporting, MRR/ARR, churn, and subscription conversion analytics.
- Plan bindings for website pricing blocks and checkout calls to action.

## Core domain model

| Entity | Responsibility |
| --- | --- |
| Product | Marketable offering or service. |
| Plan / price | Currency, cadence, price model, included limits, and display content. |
| Customer | Billing identity linked to a Nexura CRM contact/account. |
| Subscription | Current plan, lifecycle status, entitlement period, renewal, and cancellation data. |
| Usage record | Timestamped measurable consumption for metered pricing. |
| Invoice | Amount due, taxes, payment state, line items, and immutable record. |
| Payment | Processor reference and outcome; do not store raw card data. |
| Entitlement | What the customer can access based on a valid subscription. |

## Lifecycle and integrations

`Website pricing → Checkout → Customer / CRM link → Subscription → Invoice / payment → Entitlement → Analytics → Renewal, change, or cancellation`

Key cross-module behavior:

- A pricing component reads approved plan data rather than hard-coded prices.
- A completed checkout links to a CRM contact/account and records acquisition source.
- Subscription changes can trigger consent-aware lifecycle campaigns.
- Webinar/website/campaign attribution informs revenue analytics.
- The AI agent may draft a plan or explain billing state, but may not charge, refund, or change a subscription without approval.

## Recommended external-service approach

Start with a payment provider integration behind a Nexura billing abstraction rather than building card vaulting or payment rails. Suitable provider candidates include **Stripe Billing**, **Paddle**, or **Chargebee**, selected later based on merchant-of-record needs, tax responsibilities, target geographies, and pricing model complexity.

Nexura should own its catalog view, CRM linkage, entitlements, analytics events, approval logic, and operator UI. The provider should own sensitive payment collection and processor-level compliance responsibilities. Never store card numbers, CVVs, or processor secrets in Nexura business records.

## Approval and safety rules

- Require approval for charges, refunds, cancellation, plan changes, and any action that immediately changes a customer’s financial obligation.
- Verify webhook signatures and make payment-event processing idempotent.
- Treat provider webhooks as authoritative for payment outcomes; retain an append-only audit trail.
- Separate test/sandbox billing from production billing and make the environment obvious in the UI.
- Apply least privilege to staff access, exports, and API credentials.

## Analytics events

Track at minimum: `checkout_started`, `checkout_completed`, `subscription_started`, `trial_started`, `invoice_paid`, `payment_failed`, `subscription_upgraded`, `subscription_downgraded`, `subscription_cancelled`, and `usage_reported`.

Primary metrics: MRR, ARR, net revenue retention, trial-to-paid conversion, payment-failure recovery, churn, expansion/contraction revenue, revenue by acquisition source, and revenue influenced by campaigns or webinars.

## Current UI-only scope

The first design pass should show plan management, subscriptions, customers, invoice/payment states, revenue cards/charts, usage views, and clear empty/error states using mock data. It must not process live payments, persist billing records, or call payment providers.

