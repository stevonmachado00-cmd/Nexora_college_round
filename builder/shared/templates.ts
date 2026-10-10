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
    heroImage: "asset:saas-dashboard",
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
    heroImage: "asset:saas-dashboard",
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
    heroImage: "asset:studio-editorial",
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
  {
    id: "restaurant-cafe",
    name: "Restaurant & Cafe",
    category: "Restaurant",
    description: "A warm, editorial layout for menus, reservations, and a sense of place.",
    brand: "Juniper Table",
    headline: "Seasonal plates. A table worth lingering at.",
    body: "A neighborhood kitchen bringing thoughtful ingredients, generous hospitality, and a little room to slow down.",
    heroImage: "asset:restaurant-table",
    theme: {
      primaryColor: "#996540",
      secondaryColor: "#332b24",
      accentColor: "#7c8d66",
      backgroundColor: "#fbf8f2",
      textColor: "#332b24",
      headingFont: "Georgia",
      borderRadius: "sharp",
      backgroundEffect: "gradient",
      gradientStartColor: "#fffaf1",
      gradientEndColor: "#f4ede0",
    },
    hero: "split-image",
    order: ["Navbar", "Hero", "TextBlock", "Menu", "Gallery", "EventSchedule", "TableReservation", "Contact", "Footer"],
  },
  {
    id: "beauty-wellness",
    name: "Beauty & Wellness",
    category: "Beauty & wellness",
    description: "A calm, polished starting point for salons, studios, and wellness practices.",
    brand: "Serein Studio",
    headline: "A little time, just for you.",
    body: "Personalized treatments and thoughtful rituals designed to help you feel more like yourself.",
    heroImage: "asset:wellness-arch",
    theme: {
      primaryColor: "#9c615e",
      secondaryColor: "#3c3030",
      accentColor: "#8c9b79",
      backgroundColor: "#fcf7f4",
      textColor: "#3c3030",
      headingFont: "Georgia",
      borderRadius: "rounded",
      backgroundEffect: "soft-glow",
      gradientStartColor: "#fbefed",
      gradientEndColor: "#eff4e9",
      glowColor: "#ecc9c2",
    },
    hero: "centered",
    order: ["Navbar", "Hero", "TextBlock", "ServiceMenu", "Team", "Testimonials", "AppointmentBooking", "Contact", "Footer"],
  },
  {
    id: "commerce-editorial",
    name: "Editorial Commerce",
    category: "Retail & product",
    description: "A polished product story with a simple path to a first purchase.",
    brand: "Morrow Goods",
    headline: "Everyday objects, made considered.",
    body: "A small collection of useful pieces designed with longevity, texture, and the rituals of daily life in mind.",
    heroImage: "asset:commerce-shelf",
    theme: { primaryColor: "#6D28D9", secondaryColor: "#2E1065", accentColor: "#D97706", backgroundColor: "#FDFBFF", textColor: "#2E1065", backgroundEffect: "soft-glow", glowColor: "#DDD6FE", borderRadius: "soft" },
    hero: "split-image",
    order: ["Navbar", "Hero", "LogoCloud", "ProductGrid", "Testimonials", "FAQ", "NewsletterSignup", "Footer"],
  },
  {
    id: "coach-course",
    name: "Coach & Courses",
    category: "Coaching & education",
    description: "A personal, credible layout for a coach, expert, or learning-led business.",
    brand: "Clarity Practice",
    headline: "Make your next move with more clarity.",
    body: "Practical coaching and focused learning for people building a career and life that fit.",
    heroImage: "asset:wellness-arch",
    theme: { primaryColor: "#0F766E", secondaryColor: "#134E4A", accentColor: "#F59E0B", backgroundColor: "#F5FFFC", textColor: "#134E4A", backgroundEffect: "gradient", gradientStartColor: "#F0FDFA", gradientEndColor: "#ECFDF5", borderRadius: "rounded" },
    hero: "left-aligned",
    order: ["Navbar", "Hero", "ProfileCard", "CourseCatalog", "Testimonials", "LeadForm", "FAQ", "Footer"],
  },
  {
    id: "event-summit",
    name: "Event & Summit",
    category: "Events & webinars",
    description: "An energetic event page with an agenda, speaker content, and registration handoff.",
    brand: "Signal Summit",
    headline: "A day for the ideas changing how we work.",
    body: "Join operators, builders, and creative leaders for conversations that leave you with a clearer next step.",
    heroImage: "asset:event-stage",
    theme: { primaryColor: "#8B5CF6", secondaryColor: "#111827", accentColor: "#67E8F9", backgroundColor: "#F8FAFC", textColor: "#111827", backgroundEffect: "gradient", gradientStartColor: "#F5F3FF", gradientEndColor: "#ECFEFF", borderRadius: "soft" },
    hero: "split-image",
    order: ["Navbar", "Hero", "LogoCloud", "EventSchedule", "VideoFeature", "Testimonials", "LeadForm", "Footer"],
  },
  {
    id: "hospitality-stays",
    name: "Stays & Retreats",
    category: "Hospitality",
    description: "A calm, accommodation-first website for boutique stays and retreat experiences.",
    brand: "Hearth House",
    headline: "A slower kind of stay.",
    body: "Quiet rooms, generous mornings, and a thoughtful base for seeing a place differently.",
    heroImage: "asset:restaurant-table",
    theme: { primaryColor: "#8B5E3C", secondaryColor: "#3F2A1D", accentColor: "#7C8D66", backgroundColor: "#FFFDF8", textColor: "#3F2A1D", backgroundEffect: "gradient", gradientStartColor: "#FFF9EE", gradientEndColor: "#EEF3E8", headingFont: "Georgia", borderRadius: "soft" },
    hero: "split-image",
    order: ["Navbar", "Hero", "TextBlock", "StayCards", "Gallery", "TableReservation", "Testimonials", "Footer"],
  },
  {
    id: "community-hub",
    name: "Community Hub",
    category: "Community & membership",
    description: "A welcoming home for members, resources, gatherings, and ongoing conversation.",
    brand: "Common Ground",
    headline: "A place to learn out loud.",
    body: "A member community for people sharing practical knowledge, generous feedback, and momentum.",
    heroImage: "asset:studio-editorial",
    theme: { primaryColor: "#DB2777", secondaryColor: "#500724", accentColor: "#F59E0B", backgroundColor: "#FFF7FB", textColor: "#500724", backgroundEffect: "soft-glow", glowColor: "#FBCFE8", borderRadius: "rounded" },
    hero: "centered",
    order: ["Navbar", "Hero", "CommunityFeed", "ResourceLibrary", "EventSchedule", "NewsletterSignup", "FAQ", "Footer"],
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
          image: t.heroImage,
          imageAlt: `${t.name} template artwork`,
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
