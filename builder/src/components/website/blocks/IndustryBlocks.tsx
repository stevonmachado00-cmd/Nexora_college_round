import type { ComponentProps } from "../../../../shared/schema";
import type { ReactNode } from "react";

function Block({ id, tone, children, className = "" }: { id: string; tone: string; children: ReactNode; className?: string }) {
  return <section id={id} className={`nw-section tone-${tone} ${className}`}><div className="nw-container">{children}</div></section>;
}

export function ProductGrid(p: ComponentProps<"ProductGrid">) {
  return <Block id={p.id} tone={p.tone} className="nw-products"><div className="nw-industry-heading"><h2>{p.headline}</h2><p>{p.description}</p></div><div className="nw-product-grid">
    {p.products.map((item, i) => <article key={i}><a href={item.url} aria-label={`View ${item.name}`}>
      {item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : <div className="nw-image-placeholder" aria-hidden="true">Product image</div>}
      <div className="nw-card-copy"><h3>{item.name}</h3><p>{item.description}</p><strong>{item.price}</strong></div>
    </a></article>)}
  </div></Block>;
}

export function ArticleFeed(p: ComponentProps<"ArticleFeed">) {
  return <Block id={p.id} tone={p.tone} className="nw-articles"><div className="nw-industry-heading"><h2>{p.headline}</h2><p>{p.description}</p></div><div className="nw-article-list">
    {p.articles.map((item, i) => <article key={i}><span className="nw-card-kicker">{item.category}</span><h3><a href={item.url}>{item.title}</a></h3><p>{item.excerpt}</p><small>{item.author} <span aria-hidden="true">·</span> {item.date}</small></article>)}
  </div></Block>;
}

export function CourseCatalog(p: ComponentProps<"CourseCatalog">) {
  return <Block id={p.id} tone={p.tone} className="nw-courses"><div className="nw-industry-heading"><h2>{p.headline}</h2><p>{p.description}</p></div><div className="nw-course-grid">
    {p.courses.map((course, i) => <article key={i}><div className="nw-card-kicker">{course.level}<span aria-hidden="true"> · </span>{course.duration}</div><h3>{course.title}</h3><p>{course.description}</p><a className="nw-text-link" href={course.url}>Explore course <span aria-hidden="true">↗</span></a></article>)}
  </div></Block>;
}

export function EventSchedule(p: ComponentProps<"EventSchedule">) {
  return <Block id={p.id} tone={p.tone} className="nw-events"><div className="nw-industry-heading"><h2>{p.headline}</h2><p>{p.description}</p></div><div className="nw-event-list">
    {p.events.map((event, i) => <article key={i}><div className="nw-event-date"><strong>{event.date}</strong><span>{event.time}</span></div><div><h3>{event.title}</h3><p>{event.venue}</p></div><a href={event.url} aria-label={`Details for ${event.title}`}>↗</a></article>)}
  </div></Block>;
}

export function VideoFeature(p: ComponentProps<"VideoFeature">) {
  return <Block id={p.id} tone={p.tone} className="nw-video-feature"><div className="nw-video-art">
    {p.image ? <img src={p.image} alt={p.imageAlt} loading="lazy" /> : <div className="nw-image-placeholder" role="img" aria-label={p.imageAlt}>Add a video thumbnail</div>}
    <a className="nw-play-link" href={p.url} aria-label={`${p.linkText}: ${p.headline}`}>▶</a><span className="nw-video-duration">{p.duration}</span>
  </div><div className="nw-video-copy"><span className="nw-card-kicker">{p.category}</span><h2>{p.headline}</h2><p>{p.description}</p><a className="nw-text-link" href={p.url}>{p.linkText} <span aria-hidden="true">↗</span></a></div></Block>;
}

export function ProfileCard(p: ComponentProps<"ProfileCard">) {
  return <Block id={p.id} tone={p.tone} className="nw-profile"><div className="nw-profile-card">
    {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : <div className="nw-profile-placeholder" aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</div>}
    <div><span className="nw-card-kicker">{p.location}</span><h2>{p.name}</h2><h3>{p.role}</h3><p>{p.bio}</p><nav aria-label={`${p.name} links`}>{p.links.map((link, i) => <a key={i} href={link.url}>{link.label} <span aria-hidden="true">↗</span></a>)}</nav></div>
  </div></Block>;
}

export function ResourceLibrary(p: ComponentProps<"ResourceLibrary">) {
  return <Block id={p.id} tone={p.tone} className="nw-resources"><div className="nw-industry-heading"><h2>{p.headline}</h2><p>{p.description}</p></div><div className="nw-resource-grid">
    {p.resources.map((resource, i) => <a key={i} href={resource.url}><span className="nw-resource-format">{resource.format}</span><h3>{resource.title}</h3><p>{resource.description}</p><span className="nw-text-link">Open resource ↗</span></a>)}
  </div></Block>;
}

export function CommunityFeed(p: ComponentProps<"CommunityFeed">) {
  return <Block id={p.id} tone={p.tone} className="nw-community"><div className="nw-industry-heading"><h2>{p.headline}</h2><p>{p.description}</p></div><div className="nw-community-list">
    {p.posts.map((post, i) => <article key={i}><div className="nw-community-avatar" aria-hidden="true">{post.author.slice(0, 1).toUpperCase()}</div><div><header><strong>{post.author}</strong><span>{post.group} <span aria-hidden="true">·</span> {post.date}</span></header><p>{post.message}</p></div></article>)}
  </div></Block>;
}

export function DashboardMetrics(p: ComponentProps<"DashboardMetrics">) {
  return <Block id={p.id} tone={p.tone} className="nw-dashboard"><div className="nw-industry-heading"><h2>{p.headline}</h2><p>{p.description}</p></div><div className="nw-metric-grid">
    {p.metrics.map((metric, i) => <article key={i}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></article>)}
  </div></Block>;
}

export function CareerOpenings(p: ComponentProps<"CareerOpenings">) {
  return <Block id={p.id} tone={p.tone} className="nw-careers"><div className="nw-industry-heading"><h2>{p.headline}</h2><p>{p.description}</p></div><div className="nw-career-list">
    {p.openings.map((job, i) => <article key={i}><div><h3>{job.title}</h3><p>{job.team}<span aria-hidden="true"> · </span>{job.location}<span aria-hidden="true"> · </span>{job.type}</p></div><a href={job.url} aria-label={`Apply for ${job.title}`}>↗</a></article>)}
  </div></Block>;
}

export function StayCards(p: ComponentProps<"StayCards">) {
  return <Block id={p.id} tone={p.tone} className="nw-stays"><div className="nw-industry-heading"><h2>{p.headline}</h2><p>{p.description}</p></div><div className="nw-stay-grid">
    {p.stays.map((stay, i) => <article key={i}><a href={stay.url} aria-label={`Discover ${stay.name}`}>
      {stay.image ? <img src={stay.image} alt={stay.name} loading="lazy" /> : <div className="nw-image-placeholder" aria-hidden="true">Stay image</div>}
      <div className="nw-card-copy"><span className="nw-card-kicker">{stay.location}</span><h3>{stay.name}</h3><p>{stay.description}</p><strong>{stay.price}</strong></div>
    </a></article>)}
  </div></Block>;
}

export function ServiceMenu(p: ComponentProps<"ServiceMenu">) {
  return <Block id={p.id} tone={p.tone} className={`nw-service-menu services-${p.variant}`}><div className="nw-industry-heading"><span className="nw-eyebrow">Care, considered</span><h2>{p.headline}</h2><p>{p.description}</p></div><div className="nw-service-grid">
    {p.services.map((service, i) => <article key={i}><span className="nw-service-number">{String(i + 1).padStart(2, "0")}</span><div><h3>{service.name}</h3><p>{service.description}</p><small>{service.duration}</small></div><strong>{service.price}</strong></article>)}
  </div><a className="nw-button" href={p.buttonUrl}>{p.buttonText}<span aria-hidden="true">↗</span></a></Block>;
}
