import type { ReactNode } from "react";
import type { ComponentProps } from "../../../shared/schema";
function Section({
  id,
  tone,
  children,
  className = "",
}: {
  id: string;
  tone: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`nw-section tone-${tone} ${className}`}>
      <div className="nw-container">{children}</div>
    </section>
  );
}
function Heading({
  headline,
  description,
}: {
  headline: string;
  description?: string;
}) {
  return (
    <div className="nw-heading">
      <h2>{headline}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
function LinkButton({
  text,
  url,
  secondary = false,
}: {
  text: string;
  url: string;
  secondary?: boolean;
}) {
  return text ? (
    <a
      className={`nw-button ${secondary ? "secondary" : ""}`}
      href={url || "#"}
    >
      {text}
      <span aria-hidden="true">↗</span>
    </a>
  ) : null;
}
export function Navbar(p: ComponentProps<"Navbar">) {
  return (
    <Section id="top" tone={p.tone} className={`nw-nav nav-${p.variant}`}>
      <a className="nw-brand" href="#top">
        <span className="brand-symbol">N</span>
        {p.brand}
      </a>
      <nav aria-label="Website navigation">
        {p.links.map((l, i) => (
          <a key={i} href={l.url}>
            {l.label}
          </a>
        ))}
      </nav>
      {p.variant === "cta" && (
        <LinkButton text={p.buttonText} url={p.buttonUrl} />
      )}
    </Section>
  );
}
export function Hero(p: ComponentProps<"Hero">) {
  return (
    <Section id="hero" tone={p.tone} className={`nw-hero hero-${p.variant}`}>
      <div className="hero-copy">
        {p.showBadge && p.badge && (
          <span className="nw-badge">
            <i />
            {p.badge}
          </span>
        )}
        <h1>{p.headline}</h1>
        <p>{p.description}</p>
        <div className="nw-actions">
          <LinkButton text={p.buttonText} url={p.buttonUrl} />
          <LinkButton
            text={p.secondaryButtonText}
            url={p.secondaryButtonUrl}
            secondary
          />
        </div>
      </div>
      {p.variant === "split-image" && (
        <div className="nw-hero-visual">
          {p.image ? (
            <img src={p.image} alt={p.imageAlt} loading="lazy" />
          ) : (
            <ProductIllustration />
          )}
        </div>
      )}
    </Section>
  );
}
function ProductIllustration() {
  return (
    <div
      className="product-illustration"
      role="img"
      aria-label="Illustrative connected workspace"
    >
      <div className="product-toolbar">
        <span className="product-dot" />
        Your workspace<span>Overview</span>
      </div>
      <div className="product-grid">
        <div className="product-nav">
          <b>Workspace</b>
          <span>Overview</span>
          <span>Projects</span>
          <span>Activity</span>
          <span>Reports</span>
        </div>
        <div className="product-content">
          <small>WORK IN PERSPECTIVE</small>
          <h3>A clear path forward.</h3>
          <div className="product-bars">
            {[38, 66, 45, 74, 59, 89, 72, 96].map((height, i) => (
              <i key={i} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="product-progress">
            <span>Next milestone</span>
            <b>In progress</b>
            <i />
          </div>
        </div>
      </div>
      <div className="product-caption">Illustrative product preview</div>
    </div>
  );
}
export function LogoCloud(p: ComponentProps<"LogoCloud">) {
  return (
    <Section id="partners" tone={p.tone} className="nw-logos">
      <p>{p.label}</p>
      <div>
        {p.names.map((name, i) => (
          <span key={i}>{name}</span>
        ))}
      </div>
    </Section>
  );
}
export function Features(p: ComponentProps<"Features">) {
  return (
    <Section id="features" tone={p.tone}>
      <Heading {...p} />
      <div className={`nw-features features-${p.variant}`}>
        {p.items.map((item, i) => (
          <article key={i}>
            <span className="nw-icon" aria-hidden="true">
              {["◈", "↗", "⊞"][i % 3]}
            </span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
export function Stats(p: ComponentProps<"Stats">) {
  return (
    <Section id="impact" tone={p.tone} className="nw-stats">
      <Heading headline={p.headline} />
      <div>
        {p.items.map((item, i) => (
          <article key={i}>
            <strong>{item.value}</strong>
            <p>{item.label}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
export function HowItWorks(p: ComponentProps<"HowItWorks">) {
  return (
    <Section id="process" tone={p.tone}>
      <Heading {...p} />
      <div className="nw-steps">
        {p.items.map((item, i) => (
          <article key={i}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
export function Testimonials(p: ComponentProps<"Testimonials">) {
  return (
    <Section id="stories" tone={p.tone}>
      <Heading headline={p.headline} />
      <div className={`nw-quotes quotes-${p.variant}`}>
        {p.items.map((item, i) => (
          <figure key={i}>
            <span aria-hidden="true">“</span>
            <blockquote>{item.quote}</blockquote>
            <figcaption>
              <b>{item.name}</b>
              <small>{item.role}</small>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
export function Pricing(p: ComponentProps<"Pricing">) {
  const plans = p.plans.slice(0, p.variant === "two-tier" ? 2 : 3);
  return (
    <Section id="pricing" tone={p.tone}>
      <Heading {...p} />
      <div
        className="nw-pricing"
        style={{ gridTemplateColumns: `repeat(${plans.length},minmax(0,1fr))` }}
      >
        {plans.map((plan, i) => (
          <article key={i} className={plan.highlighted ? "highlighted" : ""}>
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <strong>{plan.price}</strong>
            <ul>
              {plan.features.map((f, j) => (
                <li key={j}>
                  <span aria-hidden="true">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <LinkButton text={plan.buttonText} url={plan.buttonUrl} />
          </article>
        ))}
      </div>
    </Section>
  );
}
export function FAQ(p: ComponentProps<"FAQ">) {
  return (
    <Section id="faq" tone={p.tone} className="nw-faq">
      <Heading headline={p.headline} />
      <div>
        {p.items.map((item, i) => (
          <details key={i}>
            <summary>
              {item.question}
              <span aria-hidden="true">＋</span>
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
export function CTA(p: ComponentProps<"CTA">) {
  return (
    <Section id="contact" tone={p.tone} className={`nw-cta cta-${p.variant}`}>
      <Heading {...p} />
      <LinkButton text={p.buttonText} url={p.buttonUrl} />
    </Section>
  );
}
export function Footer(p: ComponentProps<"Footer">) {
  return (
    <Section id="footer" tone={p.tone} className="nw-footer">
      <div>
        <a className="nw-brand" href="#top">
          {p.brand}
        </a>
        <p>{p.description}</p>
      </div>
      <nav aria-label="Footer navigation">
        {p.links.map((l, i) => (
          <a key={i} href={l.url}>
            {l.label}
          </a>
        ))}
      </nav>
      <small>{p.copyright}</small>
    </Section>
  );
}
