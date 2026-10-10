import type { CSSProperties, ReactNode } from "react";
import { ThemeSchema, type WebsiteTheme } from "../../../shared/schema";
export function Theme({
  theme,
  children,
}: {
  theme: WebsiteTheme;
  children: ReactNode;
}) {
  const t = ThemeSchema.parse(theme);
  const tokens = {
    "--primary": t.primaryColor,
    "--secondary": t.secondaryColor,
    "--accent": t.accentColor,
    "--background": t.backgroundColor,
    "--text": t.textColor,
    "--gradient-start": t.gradientStartColor,
    "--gradient-end": t.gradientEndColor,
    "--glow": t.glowColor,
    "--heading-font":
      t.headingFont === "Inter"
        ? "Inter, system-ui, sans-serif"
        : t.headingFont,
    "--body-font":
      t.bodyFont === "Inter" ? "Inter, system-ui, sans-serif" : t.bodyFont,
    "--radius": { sharp: "2px", soft: "12px", rounded: "24px" }[t.borderRadius],
    "--container": { compact: "960px", standard: "1160px", wide: "1320px" }[
      t.containerWidth
    ],
    "--space": { compact: "48px", comfortable: "76px", generous: "108px" }[
      t.spacingScale
    ],
  } as CSSProperties;
  return (
    <div className={`nw buttons-${t.buttonStyle} background-${t.backgroundEffect}`} style={tokens}>
      {children}
    </div>
  );
}
