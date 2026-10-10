import {
  createBlock,
  ThemeSchema,
  validateDocument,
  type ComponentName,
  type WebsiteDocument,
} from "./schema";
const definitions = [
  {
    id: "saas-modern",
    name: "Modern SaaS",
    category: "SaaS",
    description: "A clear product story with a confident blue accent.",
    brand: "Orbit",
    headline: "Bring your best work into focus.",
    body: "One connected workspace for the people, decisions, and projects that move your business forward.",
    theme: {
      primaryColor: "#3156d3",
      secondaryColor: "#172554",
      accentColor: "#3b9479",
      backgroundColor: "#ffffff",
      textColor: "#172554",
    },
    hero: "split-image",
    order: [
      "Navbar",
      "Hero",
      "LogoCloud",
      "Features",
      "HowItWorks",
      "Testimonials",
      "Pricing",
      "FAQ",
      "CTA",
      "Footer",
    ],
  },
  {
    id: "fintech-premium",
    name: "Premium Fintech",
    category: "Fintech",
    description: "Dark navy, precise typography, and a restrained mint accent.",
    brand: "Ledger",
    headline: "A clearer view of your financial world.",
    body: "Bring your financial operations into one considered workspace. Make decisions with the context your team needs.",
    theme: {
      primaryColor: "#86e6bf",
      secondaryColor: "#102432",
      accentColor: "#86e6bf",
      backgroundColor: "#0b1723",
      textColor: "#edf5f8",
    },
    hero: "left-aligned",
    order: [
      "Navbar",
      "Hero",
      "Features",
      "HowItWorks",
      "Stats",
      "Testimonials",
      "Pricing",
      "FAQ",
      "CTA",
      "Footer",
    ],
  },
  {
    id: "agency-clean",
    name: "Independent Agency",
    category: "Agency",
    description:
      "Editorial type, warm paper, and space for a strong point of view.",
    brand: "Forma",
    headline: "Thoughtful work. Meaningful impact.",
    body: "An independent studio bringing strategy, design, and craft together to shape your next chapter.",
    theme: {
      primaryColor: "#a83f2c",
      secondaryColor: "#302b26",
      accentColor: "#a83f2c",
      backgroundColor: "#faf8f3",
      textColor: "#302b26",
      headingFont: "Georgia",
      borderRadius: "sharp",
    },
    hero: "split-image",
    order: [
      "Navbar",
      "Hero",
      "Features",
      "HowItWorks",
      "Testimonials",
      "FAQ",
      "CTA",
      "Footer",
    ],
  },
] as const;
export const templates = definitions.map(
  ({ order, hero, theme, ...rest }) => rest,
);
export function getTemplate(id: string): WebsiteDocument {
  const t = definitions.find((x) => x.id === id);
  if (!t)
    throw new Error(
      "That template is unavailable. Choose another starting point.",
    );
  const data = {
    root: { props: { title: t.brand, theme: ThemeSchema.parse(t.theme) } },
    content: t.order.map((type) => {
      const props: Record<string, unknown> = {};
      if (type === "Navbar" || type === "Footer") props.brand = t.brand;
      if (type === "Footer")
        props.copyright = `${t.brand}. All rights reserved.`;
      if (type === "Navbar" && t.category === "Agency")
        props.links = [
          { label: "Services", url: "#features" },
          { label: "Process", url: "#process" },
          { label: "Contact", url: "#contact" },
        ];
      if (type === "Hero")
        Object.assign(props, {
          headline: t.headline,
          description: t.body,
          variant: t.hero,
        });
      if (type === "Features")
        Object.assign(props, {
          headline:
            t.category === "Agency"
              ? "Good thinking, made tangible."
              : "Less friction. More focus.",
          description:
            "A considered set of capabilities, built around the way your business works.",
        });
      if (type === "CTA")
        Object.assign(props, {
          headline: "Let’s shape your next chapter.",
          description: "Start a conversation about what your business needs.",
        });
      if (type === "Pricing")
        Object.assign(props, {
          headline: "The right fit for your next stage.",
          description:
            "Illustrative plan structure. Replace with your approved pricing.",
        });
      return createBlock(type as ComponentName, props);
    }),
  };
  return validateDocument({ template: id, data });
}
export function emptyWebsite(): WebsiteDocument {
  return validateDocument({
    template: null,
    data: {
      root: {
        props: { title: "Untitled website", theme: ThemeSchema.parse({}) },
      },
      content: [],
    },
  });
}
