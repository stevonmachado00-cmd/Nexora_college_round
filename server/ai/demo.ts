import {
  createBlock,
  type ComponentName,
  type WebsiteDocument,
} from "../../builder/shared/schema";
import { getTemplate } from "../../builder/shared/templates";
import type { WebsiteAIProvider } from "./provider";
export class DemoProvider implements WebsiteAIProvider {
  readonly name = "Demo composer (rules, not AI)";
  async generateWebsite(prompt: string) {
    const p = prompt.toLowerCase();
    const doc = getTemplate(
      /fintech|financial|bank|accounting/.test(p)
        ? "fintech-premium"
        : /agency|studio|portfolio|restaurant/.test(p)
          ? "agency-clean"
          : "saas-modern",
    );
    const match = prompt.match(
      /(?:called|named)\s+[“"']?([\w][\w &.-]{1,45})/i,
    );
    const name = match?.[1]
      .split(/\s+(?:for|that|targeting|with|and)\s+/i)[0]
      .replace(/[.,]$/, "")
      .trim();
    if (name) {
      doc.data.root.props.title = name;
      for (const block of doc.data.content) {
        if (block.type === "Navbar" || block.type === "Footer")
          block.props.brand = name;
        if (block.type === "Footer")
          block.props.copyright = `${name}. All rights reserved.`;
      }
    }
    if (/dark/.test(p)) darkTheme(doc);
    if (/support/.test(p)) {
      const hero = doc.data.content.find((x) => x.type === "Hero");
      if (hero) {
        hero.props.headline = "Give every customer a clearer path to help.";
        hero.props.description =
          "A focused workspace for your support team, built around the conversations that matter.";
      }
    }
    if (/restaurant/.test(p)) {
      const hero = doc.data.content.find((x) => x.type === "Hero");
      if (hero) {
        hero.props.headline = "Good food. Thoughtful company.";
        hero.props.description =
          "A welcoming place for your next gathering. Add your menu, opening hours and booking details.";
        hero.props.buttonText = "Plan your visit";
      }
    }
    return doc;
  }
  async editWebsite(current: WebsiteDocument, instruction: string) {
    const doc = structuredClone(current),
      p = instruction.toLowerCase();
    let changed = false;
    if (/dark(?:er)?|premium fintech/.test(p)) {
      if (/hero/.test(p) && !/entire|whole|website|theme/.test(p)) {
        const h = doc.data.content.find((x) => x.type === "Hero");
        if (h) h.props.tone = "dark";
      } else darkTheme(doc);
      changed = true;
    }
    if (/light theme/.test(p)) {
      Object.assign(doc.data.root.props.theme, {
        backgroundColor: "#ffffff",
        textColor: "#172554",
        primaryColor: "#3156d3",
      });
      changed = true;
    }
    if (/premium/.test(p)) {
      Object.assign(doc.data.root.props.theme, {
        spacingScale: "generous",
        borderRadius: "sharp",
      });
      changed = true;
    }
    const cta = instruction.match(
      /(?:CTA|button)(?:\s+text)?\s+(?:to|as)\s+[“"']?(.+?)[”"']?\.?$/i,
    );
    if (cta) {
      const h = doc.data.content.find((x) => x.type === "Hero");
      if (h) h.props.buttonText = cta[1].trim();
      changed = true;
    }
    const names: Record<string, ComponentName> = {
      pricing: "Pricing",
      testimonials: "Testimonials",
      features: "Features",
      faq: "FAQ",
      stats: "Stats",
      cta: "CTA",
      hero: "Hero",
      "logo cloud": "LogoCloud",
      footer: "Footer",
      "how it works": "HowItWorks",
    };
    const add = instruction.match(
      /add\s+(?:a\s+|an\s+)?(pricing|testimonials|features|faq|stats|cta|hero|logo cloud|footer|how it works)/i,
    );
    if (add) {
      const name = names[add[1].toLowerCase()];
      let at = doc.data.content.findIndex((x) => x.type === "Footer");
      const before = instruction.match(
        /before\s+(?:the\s+)?(faq|pricing|features|testimonials|footer)/i,
      );
      if (before)
        at = doc.data.content.findIndex(
          (x) => x.type === names[before[1].toLowerCase()],
        );
      doc.data.content.splice(
        at < 0 ? doc.data.content.length : at,
        0,
        createBlock(name),
      );
      changed = true;
    }
    const reorder = instruction.match(
      /(?:reorder|swap)\s+(?:the\s+)?(testimonials|features|pricing|faq)\s+(?:and|with)\s+(testimonials|features|pricing|faq)/i,
    );
    if (reorder) {
      const a = doc.data.content.findIndex(
          (x) => x.type === names[reorder[1].toLowerCase()],
        ),
        b = doc.data.content.findIndex(
          (x) => x.type === names[reorder[2].toLowerCase()],
        );
      if (a >= 0 && b >= 0) {
        [doc.data.content[a], doc.data.content[b]] = [
          doc.data.content[b],
          doc.data.content[a],
        ];
        changed = true;
      }
    }
    if (/enterprise/.test(p) && /pricing/.test(p)) {
      const pricing = doc.data.content.find((x) => x.type === "Pricing");
      if (pricing) {
        pricing.props.headline = "Built around your enterprise requirements.";
        pricing.props.description =
          "Discuss your requirements, implementation, and support with our team.";
        pricing.props.plans = pricing.props.plans.map((plan) => ({
          ...plan,
          price: "Custom",
          buttonText: "Talk to sales",
        }));
        changed = true;
      }
    }
    if (!changed)
      throw new Error(
        "The demo composer supports dark/light themes, premium spacing, hero CTA changes, adding named sections, swapping sections, and enterprise pricing. Connect an AI provider for open-ended requests.",
      );
    return doc;
  }
}
function darkTheme(doc: WebsiteDocument) {
  Object.assign(doc.data.root.props.theme, {
    backgroundColor: "#0b1723",
    textColor: "#edf5f8",
    primaryColor: "#86e6bf",
    secondaryColor: "#102432",
    accentColor: "#86e6bf",
  });
}
