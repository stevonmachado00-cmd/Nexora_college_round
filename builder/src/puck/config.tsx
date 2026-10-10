import type { Config } from "@puckeditor/core";
import type { ComponentType, ReactNode } from "react";
import { z } from "zod";
import {
  componentSchemas,
  ThemeSchema,
  type ComponentName,
  type ComponentProps,
} from "../../shared/schema";
import { descriptions } from "../../shared/catalog";
import * as sections from "../components/website/Sections";
import * as contentBlocks from "../components/website/blocks/ContentBlocks";
import * as industryBlocks from "../components/website/blocks/IndustryBlocks";
import * as formBlocks from "../components/website/blocks/FormBlocks";
import { Theme } from "../components/website/Theme";
import { schemaFields } from "./fields";
export type SectionProps = { [K in ComponentName]: ComponentProps<K> };
const renderers = { ...sections, ...contentBlocks, ...industryBlocks, ...formBlocks } as unknown as Record<
  ComponentName,
  ComponentType<Record<string, unknown>>
>;
const registry = Object.fromEntries(
  Object.entries(componentSchemas).map(([name, schema]) => {
    const Component = renderers[name as ComponentName];
    const { id, ...defaults } = schema.parse({ id: "default" });
    return [
      name,
      {
        label: name.replace(/([a-z])([A-Z])/g, "$1 $2"),
        fields: schemaFields(z.toJSONSchema(schema)),
        defaultProps: defaults,
        metadata: { description: descriptions[name as ComponentName] },
        render: (props: Record<string, unknown>) => <Component {...props} />,
      },
    ];
  }),
);
// Dynamic registration is confined to this boundary; validated props and all renderers are predefined.
export const config: Config = {
  components: registry,
  categories: {
    structure: { title: "Structure", components: ["Navbar", "Footer"] },
    hero: { title: "Hero & calls to action", components: ["Hero", "CTA"] },
    story: { title: "Story & trust", components: ["TextBlock", "Features", "HowItWorks", "LogoCloud", "Stats", "Testimonials", "FAQ"] },
    media: { title: "Images & editorial", components: ["ImageBlock", "Gallery", "Team", "VideoFeature", "ArticleFeed", "ResourceLibrary", "ProfileCard"] },
    forms: { title: "Forms & signups", components: ["LeadForm", "NewsletterSignup"] },
    restaurants: { title: "Restaurant & cafe", components: ["Menu", "TableReservation"] },
    beauty: { title: "Beauty & wellness", components: ["ServiceMenu", "AppointmentBooking"] },
    commerce: { title: "Retail & hospitality", components: ["ProductGrid", "StayCards"] },
    learning: { title: "Education & community", components: ["CourseCatalog", "EventSchedule", "CommunityFeed"] },
    business: { title: "Business & SaaS", components: ["Pricing", "Contact", "CareerOpenings", "DashboardMetrics"] },
  },
  root: {
    fields: {
      title: { type: "text", label: "Website title" },
      theme: {
        type: "object",
        label: "Global website theme",
        objectFields: schemaFields(z.toJSONSchema(ThemeSchema)),
      },
    },
    defaultProps: { title: "Your website", theme: ThemeSchema.parse({}) },
    render: (props: Record<string, unknown>) => (
      <Theme theme={ThemeSchema.parse(props.theme)}>
        {props.children as ReactNode}
      </Theme>
    ),
  },
};
