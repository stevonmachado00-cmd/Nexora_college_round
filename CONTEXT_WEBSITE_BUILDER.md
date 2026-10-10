# Nexura Website Builder Context

## Product position

Nexura’s website builder is a **template-first, component-based business website editor**. It is intentionally not a competitor to free-form code-generation products such as Lovable, Cursor, Emergent, or a fully open-ended Webflow-style editor.

Its advantage is reliable integration with Nexura business modules: a page is not merely visual content; it can capture leads, register webinar attendees, present real subscription plans, and report funnel behavior.

## Primary user experience

Users should be able to:

- Choose a template by industry or job to be done.
- Edit copy and imagery.
- Apply brand colors, fonts, spacing, alignment, and button style.
- Reorder sections; add or remove approved sections.
- Choose from predefined variants for each section.
- Attach lead forms, newsletters, webinar registrations, and pricing blocks to Nexura data.
- Preview responsive layouts and publish only after confirmation.

Suggested template categories: SaaS, startup, agency, professional services, coaching, webinar/event, ecommerce/product landing page, and restaurant/local business.

## Component library

Approved base components include:

- Navbar, hero, rich text/image section, feature list, logo cloud, testimonials, pricing, FAQ, CTA, lead form, webinar registration, newsletter form, and footer.

Each component exposes bounded variants. For example:

- Hero: centered, left aligned, text-left/image-right, image-left/text-right.
- Features: 3-column grid, 2-column grid, icon list, alternating rows.
- Pricing: plan cards, comparison table, single-plan callout.

## Structured state, not arbitrary code

Store page configuration as JSON and render it through a safe component registry. The AI edits this schema through approved operations rather than generating entire React components or CSS. This reduces token use, preserves design quality, limits unsafe changes, and makes pages easier to version and maintain.

```json
{
  "template": "saas-modern",
  "theme": {
    "primaryColor": "#2563EB",
    "font": "Inter"
  },
  "sections": [
    {
      "type": "hero",
      "variant": "split",
      "heading": "Grow your business",
      "alignment": "left"
    },
    { "type": "features", "variant": "three-column" },
    { "type": "pricing", "variant": "cards", "planSource": "nexura" }
  ]
}
```

## Global design tokens

Themes should control primary/secondary colors, background, text color, heading font, body font, border radius, spacing scale, and button style. Components should consume these tokens rather than retain arbitrary page-level styling.

## AI editing model

Example controlled tools:

- `website.get_page()`
- `website.update_text()`
- `website.update_theme()`
- `website.add_section()`
- `website.move_section()`
- `website.bind_component()`
- `website.preview_page()`
- `website.request_publish()`

The assistant can propose changes and create previews, but public publishing requires approval.

## Business bindings

| Website component | Nexura module | Expected outcome |
| --- | --- | --- |
| Lead form | CRM | Creates or enriches a lead with source attribution. |
| Webinar registration | Webinar management + CRM | Registers the contact and triggers approved reminders. |
| Pricing section / checkout CTA | SaaS billing | Displays plan data and begins the subscription flow. |
| Newsletter form | Marketing automation + CRM | Adds a consented contact to the relevant audience. |
| Page and CTA events | Integrated analytics | Measures visits, conversion paths, and attribution. |

## Implementation direction

**Puck** is a strong open-source candidate for the visual React editing layer because it aligns with a structured component model. Wrap it with Nexura’s component registry, theme system, business bindings, permission checks, and page-version model.

For the current UI-only phase, model these capabilities as realistic controls and mock bindings—do not implement live publication, CRM writes, payment checkout, or persistence.

