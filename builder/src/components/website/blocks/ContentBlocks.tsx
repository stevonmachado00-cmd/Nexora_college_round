import type { ComponentProps } from "../../../../shared/schema";
import type { ReactNode } from "react";

function Block({ id, tone, children, className = "" }: { id: string; tone: string; children: ReactNode; className?: string }) {
  return <section id={id} className={`nw-section tone-${tone} ${className}`}><div className="nw-container">{children}</div></section>;
}

export function TextBlock(p: ComponentProps<"TextBlock">) {
  return <Block id={p.id} tone={p.tone} className={`nw-text-block text-${p.alignment}`}>
    {p.eyebrow && <span className="nw-eyebrow">{p.eyebrow}</span>}
    <h2>{p.headline}</h2><p>{p.body}</p>
  </Block>;
}

export function ImageBlock(p: ComponentProps<"ImageBlock">) {
  return <Block id={p.id} tone={p.tone} className={`nw-image-block image-${p.variant}`}>
    {p.image ? <figure><img src={p.image} alt={p.imageAlt} loading="lazy" />{p.caption && <figcaption>{p.caption}</figcaption>}</figure> : <div className="nw-image-placeholder" role="img" aria-label={p.imageAlt}>Add an image in the editor</div>}
  </Block>;
}

export function Gallery(p: ComponentProps<"Gallery">) {
  return <Block id={p.id} tone={p.tone} className="nw-gallery">
    <h2>{p.headline}</h2><div className="nw-gallery-grid">
      {p.images.map((item, index) => <figure key={index}>{item.image ? <img src={item.image} alt={item.alt} loading="lazy" /> : <div className="nw-image-placeholder" role="img" aria-label={item.alt}>Add an image in the editor</div>}{item.caption && <figcaption>{item.caption}</figcaption>}</figure>)}
    </div>
  </Block>;
}

export function Menu(p: ComponentProps<"Menu">) {
  return <Block id={p.id} tone={p.tone} className="nw-menu">
    <div className="nw-menu-heading"><h2>{p.headline}</h2><p>{p.description}</p></div>
    <div className="nw-menu-items">{p.items.map((item, index) => <article key={index}><div><h3>{item.name}</h3><p>{item.description}</p></div><strong>{item.price}</strong></article>)}</div>
  </Block>;
}

export function Team(p: ComponentProps<"Team">) {
  return <Block id={p.id} tone={p.tone} className="nw-team">
    <h2>{p.headline}</h2><div className="nw-team-grid">{p.members.map((member, index) => <article key={index}>
      {member.image ? <img src={member.image} alt={member.name} loading="lazy" /> : <div className="nw-team-placeholder" aria-hidden="true">{member.name.slice(0, 1).toUpperCase()}</div>}
      <h3>{member.name}</h3><span>{member.role}</span><p>{member.bio}</p>
    </article>)}</div>
  </Block>;
}

export function Contact(p: ComponentProps<"Contact">) {
  return <Block id={p.id} tone={p.tone} className="nw-contact">
    <div><h2>{p.headline}</h2><p>{p.description}</p></div>
    <address>
      {p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}
      {p.phone && <a href={`tel:${p.phone.replace(/[^+\d]/g, "")}`}>{p.phone}</a>}
      {p.address && <span>{p.address}</span>}{p.hours && <span>{p.hours}</span>}
    </address>
  </Block>;
}
