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
import { Theme } from "../components/website/Theme";
import { schemaFields } from "./fields";
export type SectionProps = { [K in ComponentName]: ComponentProps<K> };
const registry = Object.fromEntries(
  Object.entries(componentSchemas).map(([name, schema]) => {
    const Component = sections[
      name as ComponentName
    ] as unknown as ComponentType<Record<string, unknown>>;
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
