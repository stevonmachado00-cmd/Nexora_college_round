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
  TextBlock: z.object({
    ...common,
    eyebrow: text.default("A little more about us"),
    headline: text.default("Words that make your story clear."),
    body: text.default("Use this space for a longer introduction, editorial story, or a useful explanation of what makes your work different."),
    alignment: z.enum(["left", "center"]).default("left"),
  }).strict(),
  ImageBlock: z.object({
    ...common,
    image: ImageUrl.default(""),
    imageAlt: text.default("Describe this image"),
    caption: text.default("Add an optional image caption"),
    variant: z.enum(["wide", "contained"]).default("wide"),
  }).strict(),
  Gallery: z.object({
    ...common,
    headline: text.default("A closer look"),
    images: z.array(z.object({ image: ImageUrl.default(""), alt: text.default("Describe this image"), caption: text.default("") }).strict()).max(8).default([{ image: "", alt: "Describe this image", caption: "" }, { image: "", alt: "Describe this image", caption: "" }, { image: "", alt: "Describe this image", caption: "" }]),
  }).strict(),
  Menu: z.object({
    ...common,
    ...heading,
    items: z.array(z.object({ name: text.default("House favorite"), description: text.default("A short description of this dish."), price: text.default("$12") }).strict()).max(12).default([{ name: "Seasonal special", description: "A fresh, thoughtful plate made with seasonal ingredients.", price: "$18" }, { name: "House favorite", description: "A guest favorite, prepared with care.", price: "$14" }, { name: "Something sweet", description: "A small treat to finish your meal.", price: "$8" }]),
  }).strict(),
  Team: z.object({
    ...common,
    headline: text.default("Meet the people behind the work"),
    members: z.array(z.object({ name: text.default("Team member"), role: text.default("Role or specialty"), bio: text.default("A short introduction."), image: ImageUrl.default("") }).strict()).max(8).default([{ name: "Team member", role: "Founder", bio: "Add a short introduction.", image: "" }, { name: "Team member", role: "Creative lead", bio: "Add a short introduction.", image: "" }]),
  }).strict(),
  Contact: z.object({
    ...common,
    headline: text.default("Let’s start a conversation"),
    description: text.default("Tell visitors how to reach your team and when you are available."),
    email: text.default("hello@example.com"),
    phone: text.default("+1 (555) 010-2020"),
    address: text.default("Add your business address"),
    hours: text.default("Monday–Friday · 9am–5pm"),
  }).strict(),
  ProductGrid: z.object({
    ...common, ...heading,
    products: z.array(z.object({ name: text.default("Featured product"), description: text.default("A short product detail."), price: text.default("$48"), image: ImageUrl.default(""), url: SafeUrl.default("#contact") }).strict()).max(8).default([{ name: "Everyday essential", description: "Thoughtfully made for daily use.", price: "$48", image: "", url: "#contact" }, { name: "Studio favorite", description: "A customer-loved design.", price: "$72", image: "", url: "#contact" }, { name: "New arrival", description: "Meet the latest addition.", price: "$56", image: "", url: "#contact" }]),
  }).strict(),
  ArticleFeed: z.object({
    ...common, headline: text.default("The latest stories"), description: text.default("Ideas, reporting, and perspectives from our editors."),
    articles: z.array(z.object({ category: text.default("News"), title: text.default("Add a clear, specific headline"), excerpt: text.default("A short preview that helps readers decide what to read next."), author: text.default("Editorial team"), date: text.default("Add publication date"), url: SafeUrl.default("#") }).strict()).max(8).default([{ category: "Editor's pick", title: "A story worth sharing", excerpt: "Add a concise summary of this article.", author: "Editorial team", date: "Latest", url: "#" }, { category: "Insights", title: "Ideas and perspectives", excerpt: "Help readers understand what they will learn.", author: "Contributors", date: "Latest", url: "#" }, { category: "Updates", title: "What is happening now", excerpt: "A useful preview of this update.", author: "News desk", date: "Latest", url: "#" }]),
  }).strict(),
  CourseCatalog: z.object({
    ...common, ...heading,
    courses: z.array(z.object({ title: text.default("Course title"), description: text.default("What learners will explore."), level: text.default("All levels"), duration: text.default("4 weeks"), url: SafeUrl.default("#") }).strict()).max(8).default([{ title: "Foundations", description: "Build a strong starting point.", level: "Beginner", duration: "4 weeks", url: "#" }, { title: "Applied practice", description: "Put your knowledge to work.", level: "Intermediate", duration: "6 weeks", url: "#" }, { title: "Advanced topics", description: "Explore specialist ideas in depth.", level: "Advanced", duration: "8 weeks", url: "#" }]),
  }).strict(),
  EventSchedule: z.object({
    ...common, ...heading,
    events: z.array(z.object({ date: text.default("Add date"), time: text.default("Add time"), title: text.default("Event title"), venue: text.default("Venue or online"), url: SafeUrl.default("#") }).strict()).max(10).default([{ date: "May 18", time: "6:00 PM", title: "An evening together", venue: "Main Hall", url: "#" }, { date: "May 24", time: "10:00 AM", title: "A day of discovery", venue: "Riverside Studio", url: "#" }]),
  }).strict(),
  VideoFeature: z.object({
    ...common, ...heading,
    image: ImageUrl.default(""), imageAlt: text.default("Video preview image"), duration: text.default("12 min"), category: text.default("Featured"), url: SafeUrl.default("#"), linkText: text.default("Watch now"),
  }).strict(),
  ProfileCard: z.object({
    ...common, name: text.default("Your name"), role: text.default("Your role or specialty"), bio: text.default("A concise introduction to your work, approach, and the people you help."), image: ImageUrl.default(""), location: text.default("Your location"),
    links: z.array(z.object({ label: text.default("Portfolio"), url: SafeUrl.default("#") }).strict()).max(5).default([{ label: "Portfolio", url: "#" }, { label: "LinkedIn", url: "#" }]),
  }).strict(),
  ResourceLibrary: z.object({
    ...common, ...heading,
    resources: z.array(z.object({ title: text.default("Resource title"), description: text.default("What this resource covers."), format: text.default("Guide"), url: SafeUrl.default("#") }).strict()).max(10).default([{ title: "Getting started guide", description: "Essential information and next steps.", format: "Guide", url: "#" }, { title: "Policies and standards", description: "Reference material for your team.", format: "Policy", url: "#" }, { title: "Frequently asked questions", description: "Answers to common questions.", format: "FAQ", url: "#" }]),
  }).strict(),
  CommunityFeed: z.object({
    ...common, ...heading,
    posts: z.array(z.object({ author: text.default("Community member"), group: text.default("Community"), message: text.default("Share a useful update with your community."), date: text.default("Recently") }).strict()).max(8).default([{ author: "Community member", group: "Introductions", message: "Share what you are working on and meet others in the community.", date: "Today" }, { author: "Community team", group: "Announcements", message: "Post updates, upcoming gatherings, and community news here.", date: "This week" }]),
  }).strict(),
  DashboardMetrics: z.object({
    ...common, ...heading,
    metrics: z.array(z.object({ label: text.default("Metric"), value: text.default("—"), detail: text.default("Add a verified status or period") }).strict()).max(8).default([{ label: "Open requests", value: "—", detail: "Update with current data" }, { label: "Completion rate", value: "—", detail: "Add reporting period" }, { label: "Next review", value: "—", detail: "Add the next milestone" }]),
  }).strict(),
  CareerOpenings: z.object({
    ...common, ...heading,
    openings: z.array(z.object({ title: text.default("Role title"), team: text.default("Team"), location: text.default("Location"), type: text.default("Full time"), url: SafeUrl.default("mailto:careers@example.com") }).strict()).max(10).default([{ title: "Senior product designer", team: "Product", location: "Remote", type: "Full time", url: "mailto:careers@example.com" }, { title: "Customer success lead", team: "Customer team", location: "Hybrid", type: "Full time", url: "mailto:careers@example.com" }]),
  }).strict(),
  StayCards: z.object({
    ...common, ...heading,
    stays: z.array(z.object({ name: text.default("Stay name"), location: text.default("Destination"), description: text.default("A welcoming place to stay."), price: text.default("From $120 / night"), image: ImageUrl.default(""), url: SafeUrl.default("#contact") }).strict()).max(8).default([{ name: "Garden House", location: "Countryside", description: "A quiet retreat surrounded by nature.", price: "From $120 / night", image: "", url: "#contact" }, { name: "Harbor Rooms", location: "Coastal district", description: "A relaxed base near the water.", price: "From $160 / night", image: "", url: "#contact" }]),
  }).strict(),
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
