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
import { Theme } from "../components/website/Theme";
import { schemaFields } from "./fields";
export type SectionProps = { [K in ComponentName]: ComponentProps<K> };
const renderers = { ...sections, ...contentBlocks, ...industryBlocks } as unknown as Record<
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
    structure: { title: "Structure", components: ["Navbar", "Hero", "Footer"] },
    story: {
      title: "Your story",
      components: ["Features", "HowItWorks", "CTA"],
    },
    proof: {
      title: "Proof & conversion",
      components: ["LogoCloud", "Stats", "Testimonials", "Pricing", "FAQ"],
    },
    content: { title: "Content", components: ["TextBlock", "ImageBlock", "Gallery", "Team"] },
    business: { title: "Business & hospitality", components: ["Menu", "Contact"] },
    commerce: { title: "Commercial & retail", components: ["ProductGrid", "StayCards"] },
    media: { title: "Media & editorial", components: ["ArticleFeed", "VideoFeature"] },
    learning: { title: "Education & reference", components: ["CourseCatalog", "ResourceLibrary"] },
    community: { title: "Community & events", components: ["CommunityFeed", "EventSchedule"] },
    work: { title: "Corporate & careers", components: ["CareerOpenings", "ProfileCard"] },
    tools: { title: "Software & internal tools", components: ["DashboardMetrics"] },
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
