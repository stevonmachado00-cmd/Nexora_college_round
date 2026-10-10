import { componentSchemas, type ComponentName } from "./schema";
import { z } from "zod";
export const descriptions: Record<ComponentName, string> = {
  Navbar: "Brand navigation and optional CTA",
  Hero: "Primary promise, copy, CTA and optional image",
  LogoCloud: "Approved logos or clearly marked placeholders",
  Features: "Benefit list with controlled grid variants",
  Stats: "Verified metrics or dash placeholders",
  HowItWorks: "Simple numbered process",
  Testimonials: "Approved quotes or explicitly labeled placeholders",
  Pricing: "Editable illustrative tiers; no checkout",
  FAQ: "Accessible expandable answers",
  CTA: "Closing conversion invitation",
  Footer: "Business details and essential links",
};
// Shared schemas are the source of props, variants and provider metadata.
function compact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(compact);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !["$schema", "default"].includes(key))
        .map(([key, item]) => [key, compact(item)]),
    );
  return value;
}
export function componentMetadata() {
  return Object.fromEntries(
    Object.entries(componentSchemas).map(([name, schema]) => [
      name,
      {
        description: descriptions[name as ComponentName],
        schema: compact(z.toJSONSchema(schema)),
      },
    ]),
  );
}
