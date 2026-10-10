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
  TextBlock: "Editorial copy for introductions, stories, and supporting content",
  ImageBlock: "A single image with accessible alt text and an optional caption",
  Gallery: "A responsive image gallery for portfolios, venues, and products",
  Menu: "Restaurant menu items with descriptions and editable prices",
  Team: "People cards with portraits, roles, and short biographies",
  Contact: "Business contact details, location, and opening hours",
  ProductGrid: "Shoppable product cards for retail and ecommerce storefronts",
  ArticleFeed: "Editorial and news cards with author, date, category, and links",
  CourseCatalog: "Course cards with level, duration, and learner details",
  EventSchedule: "Upcoming events with date, time, venue, and details links",
  VideoFeature: "Featured video or media item with thumbnail and watch link",
  ProfileCard: "Personal profile with introduction and portfolio or social links",
  ResourceLibrary: "Guides, policies, references, and downloadable resource links",
  CommunityFeed: "Community updates, member posts, and group activity previews",
  DashboardMetrics: "At-a-glance metrics for software, operations, and internal tools",
  CareerOpenings: "Open roles with team, location, work type, and apply link",
  StayCards: "Hospitality and travel listings with location and rate details",
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
