# Nexus design direction

The main business dashboard remains a frontend blueprint. The Puck website builder now supports real local project editing, persistence, preview and published snapshots. No real customers, endorsements, or business-module integrations are implied by sample content.

## Visual system

- Ink: #172554 — strong hierarchy and business context.
- Cobalt: #3156D3 — navigation and primary actions.
- Paper: #FFFFFF — product surfaces.
- Cloud: #F4F7FC — page backgrounds and separated sections.
- Slate: #65728A — supporting copy.
- Mint: #3B9479 — illustrative connected states.

Typography: Plus Jakarta Sans for headlines, DM Sans for body and interface. Strong headlines, left-aligned product narratives, readable 65-character copy widths.

## Composition

The homepage progresses from a connected workspace mockup to an interactive customer journey, an example project gallery, detailed product scenes, an approval-based AI storyboard, and an invitation to explore the workspace. Project examples are explicitly concepts, not real customer case studies.

The visual anchor is a composed browser mockup, not decoration. Product previews show meaningful relationships between customer, event, campaign, and subscription views. Quiet surfaces give the examples room to breathe. The dashboard shares the public website's type, color, and icon language.

The business dashboard interactions remain illustrative. The website builder uses Puck with a controlled section library, global design tokens, three starter templates, saved drafts, clean previews and explicit publication of local snapshots. Assisted changes are reviewed before application and are undoable. A rules composer runs by default; real AI uses a configurable server provider. Authentication and live payment, CRM and email connections remain future work. See `docs/WEBSITE_BUILDER.md` for implementation details.

## Design guidance consulted

- Sites presentation-led design guidance (bundled skill).
- Anthropic frontend-design: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md — subject-specific visual direction, disciplined typography, purposeful motion, responsive layout, reduced motion, and screenshot critique.
