import { z } from "zod";

const text = z.string().max(2500);
export const SafeUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    if (value === "") return true;
    if (/[\u0000-\u0020\\]/.test(value)) return false;
    if (value.startsWith("#")) return true;
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
      return ["https:", "http:", "mailto:", "tel:"].includes(
        new URL(value).protocol,
      );
    } catch {
      return false;
    }
  }, "Use an http(s), mailto, tel, relative, or anchor URL.");
export const ImageUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    if (/[\u0000-\u0020\\]/.test(value)) return false;
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
      return ["https:", "http:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Use an http(s) or relative image URL.");
const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color.");
export const ThemeSchema = z
  .object({
    primaryColor: color.default("#3156d3"),
    secondaryColor: color.default("#172554"),
    accentColor: color.default("#3b9479"),
    backgroundColor: color.default("#ffffff"),
    textColor: color.default("#172554"),
    headingFont: z.enum(["Inter", "Georgia", "Arial"]).default("Inter"),
    bodyFont: z.enum(["Inter", "Arial", "Georgia"]).default("Inter"),
    borderRadius: z.enum(["sharp", "soft", "rounded"]).default("soft"),
    buttonStyle: z.enum(["solid", "outline"]).default("solid"),
    containerWidth: z.enum(["compact", "standard", "wide"]).default("standard"),
    spacingScale: z
      .enum(["compact", "comfortable", "generous"])
      .default("comfortable"),
  })
  .strict();
export type WebsiteTheme = z.infer<typeof ThemeSchema>;
const common = {
  id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, "Use a safe section identifier."),
  tone: z.enum(["base", "muted", "dark", "accent"]).default("base"),
};
const heading = {
  headline: text.default("A better way to do business"),
  description: text.default("Tell visitors what you offer and why it matters."),
};
const cta = {
  buttonText: text.default("Book a demo"),
  buttonUrl: SafeUrl.default("#contact"),
};
const feature = z
  .object({
    title: text.default("A clear benefit"),
    description: text.default("Describe how this helps your customer."),
  })
  .strict();
export const componentSchemas = {
  Navbar: z
    .object({
      ...common,
      brand: text.default("Your business"),
      variant: z.enum(["simple", "centered", "cta"]).default("cta"),
      links: z
        .array(z.object({ label: text, url: SafeUrl }).strict())
        .max(8)
        .default([
          { label: "Features", url: "#features" },
          { label: "Pricing", url: "#pricing" },
        ]),
      ...cta,
    })
    .strict(),
  Hero: z
    .object({
      ...common,
      ...heading,
      variant: z
        .enum(["centered", "split-image", "left-aligned"])
        .default("split-image"),
      badge: text.default("Built for what comes next"),
      showBadge: z.boolean().default(true),
      ...cta,
      secondaryButtonText: text.default("Explore the product"),
      secondaryButtonUrl: SafeUrl.default("#features"),
      image: ImageUrl.default(""),
      imageAlt: text.default("Product illustration"),
    })
    .strict(),
  LogoCloud: z
    .object({
      ...common,
      label: text.default("Add your approved customer or partner names"),
      names: z
        .array(text)
        .max(10)
        .default(["Your logo here", "Partner logo here", "Customer logo here"]),
    })
    .strict(),
  Features: z
    .object({
      ...common,
      ...heading,
      variant: z
        .enum(["three-column", "icon-grid", "alternating"])
        .default("three-column"),
      items: z
        .array(feature)
        .max(9)
        .default([
          {
            title: "Everything in context",
            description: "Keep your essential work in one place.",
          },
          {
            title: "Make progress visible",
            description: "Understand the next step without the guesswork.",
          },
          {
            title: "Built around your team",
            description: "Create a workflow that fits the way you work.",
          },
        ]),
    })
    .strict(),
  Stats: z
    .object({
      ...common,
      headline: text.default("Show your impact with verified numbers"),
      items: z
        .array(z.object({ value: text, label: text }).strict())
        .max(6)
        .default([
          { value: "—", label: "Add a verified metric" },
          { value: "—", label: "Add a verified metric" },
          { value: "—", label: "Add a verified metric" },
        ]),
    })
    .strict(),
  HowItWorks: z
    .object({
      ...common,
      ...heading,
      items: z
        .array(feature)
        .max(6)
        .default([
          {
            title: "Connect your context",
            description: "Bring the information your team needs.",
          },
          {
            title: "Choose your next step",
            description: "Make priorities clear and actionable.",
          },
          {
            title: "Move forward together",
            description: "Review progress in one shared workspace.",
          },
        ]),
    })
    .strict(),
  Testimonials: z
    .object({
      ...common,
      headline: text.default("Make room for customer stories"),
      variant: z.enum(["cards", "featured-quote"]).default("cards"),
      items: z
        .array(z.object({ quote: text, name: text, role: text }).strict())
        .max(6)
        .default([
          {
            quote: "Replace this placeholder with an approved customer quote.",
            name: "Customer name placeholder",
            role: "Role and company placeholder",
          },
        ]),
    })
    .strict(),
  Pricing: z
    .object({
      ...common,
      ...heading,
      variant: z.enum(["two-tier", "three-tier"]).default("three-tier"),
      plans: z
        .array(
          z
            .object({
              name: text,
              price: text,
              description: text,
              features: z.array(text).max(8),
              buttonText: text,
              buttonUrl: SafeUrl,
              highlighted: z.boolean().default(false),
            })
            .strict(),
        )
        .min(1)
        .max(3)
        .default([
          {
            name: "Starter",
            price: "Contact us",
            description: "For teams getting started.",
            features: ["Your core offering", "Support details"],
            buttonText: "Discuss your needs",
            buttonUrl: "#contact",
            highlighted: false,
          },
          {
            name: "Business",
            price: "Custom",
            description: "For growing operations.",
            features: ["Your expanded offering", "Tailored onboarding"],
            buttonText: "Talk to sales",
            buttonUrl: "#contact",
            highlighted: true,
          },
        ]),
    })
    .strict(),
  FAQ: z
    .object({
      ...common,
      headline: text.default("Questions, answered"),
      items: z
        .array(z.object({ question: text, answer: text }).strict())
        .max(12)
        .default([
          {
            question: "How do I get started?",
            answer:
              "Contact the team to discuss your requirements and next steps.",
          },
          {
            question: "Can this fit my business?",
            answer:
              "Tell us about your workflow so we can find the right approach.",
          },
        ]),
    })
    .strict(),
  CTA: z
    .object({
      ...common,
      ...heading,
      ...cta,
      variant: z.enum(["centered", "split"]).default("centered"),
    })
    .strict(),
  Footer: z
    .object({
      ...common,
      brand: text.default("Your business"),
      description: text.default("A clear direction for your next chapter."),
      links: z
        .array(z.object({ label: text, url: SafeUrl }).strict())
        .max(8)
        .default([{ label: "Contact", url: "mailto:hello@example.com" }]),
      copyright: text.default("Your business. All rights reserved."),
    })
    .strict(),
};
export type ComponentName = keyof typeof componentSchemas;
export type ComponentProps<K extends ComponentName> = z.infer<
  (typeof componentSchemas)[K]
>;
const componentTypes = Object.keys(componentSchemas) as ComponentName[];
const blocks = componentTypes.map((type) =>
  z.object({ type: z.literal(type), props: componentSchemas[type] }).strict(),
);
export type WebsiteBlock = {
  [K in ComponentName]: { type: K; props: ComponentProps<K> };
}[ComponentName];
export type WebsiteData = {
  root: { props: { title: string; theme: WebsiteTheme } };
  content: WebsiteBlock[];
};
export const PuckDataSchema = z
  .object({
    root: z
      .object({
        props: z
          .object({ title: text.default("Your website"), theme: ThemeSchema })
          .strict(),
      })
      .strict(),
    content: z
      .discriminatedUnion(
        "type",
        blocks as [
          (typeof blocks)[number],
          (typeof blocks)[number],
          ...(typeof blocks)[number][],
        ],
      )
      .array()
      .max(40),
  })
  .strict()
  .superRefine((data, ctx) => {
    const ids = new Set<string>();
    for (const [i, block] of data.content.entries()) {
      if (ids.has(block.props.id))
        ctx.addIssue({
          code: "custom",
          message: "Section IDs must be unique.",
          path: ["content", i, "props", "id"],
        });
      ids.add(block.props.id);
    }
  }) as unknown as z.ZodType<WebsiteData>;
export const WebsiteDocumentSchema = z
  .object({
    template: z
      .enum(["saas-modern", "fintech-premium", "agency-clean"])
      .nullable(),
    data: PuckDataSchema,
  })
  .strict();
export type WebsiteDocument = z.infer<typeof WebsiteDocumentSchema>;
export const PromptSchema = z
  .string()
  .trim()
  .min(5, "Add a little more detail.")
  .max(4000, "Keep instructions under 4,000 characters.");
export const GenerationRequestSchema = z
  .object({ prompt: PromptSchema })
  .strict();
export const EditRequestSchema = z
  .object({ prompt: PromptSchema, current: WebsiteDocumentSchema })
  .strict();
export function validateDocument(input: unknown): WebsiteDocument {
  return WebsiteDocumentSchema.parse(input);
}
export function createBlock(
  type: ComponentName,
  props: Record<string, unknown> = {},
) {
  return {
    type,
    props: componentSchemas[type].parse({ id: crypto.randomUUID(), ...props }),
  } as WebsiteData["content"][number];
}
export function validationMessage(error: unknown) {
  return error instanceof z.ZodError
    ? error.issues
        .slice(0, 3)
        .map((x) => `${x.path.join(".")}: ${x.message}`)
        .join("; ")
    : "The page configuration is invalid.";
}
