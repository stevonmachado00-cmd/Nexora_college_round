import type { FormEvent, ReactNode } from "react";
import type { ComponentProps } from "../../../../shared/schema";

function Block({ id, tone, children, className = "" }: { id: string; tone: string; children: ReactNode; className?: string }) {
  return <section id={id} className={`nw-section tone-${tone} ${className}`}><div className="nw-container">{children}</div></section>;
}

function preventPreviewSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}

export function LeadForm(p: ComponentProps<"LeadForm">) {
  return <Block id={p.id} tone={p.tone} className={`nw-form-section nw-lead-form form-${p.variant}`}>
    <div className="nw-form-copy"><span className="nw-eyebrow">Get in touch</span><h2>{p.headline}</h2><p>{p.description}</p></div>
    <form onSubmit={preventPreviewSubmit}>
      <div className="nw-form-grid">
        <label>Name<input name="name" autoComplete="name" placeholder="Your name" /></label>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@company.com" /></label>
      </div>
      <label>How can we help?<textarea name="message" rows={4} placeholder="Tell us a little about what you’re looking for" /></label>
      <button className="nw-button" type="submit">{p.buttonText}<span aria-hidden="true"> </span></button>
      <small>{p.privacyNote} <span>Preview only. submissions are not stored.</span></small>
    </form>
  </Block>;
}

export function NewsletterSignup(p: ComponentProps<"NewsletterSignup">) {
  return <Block id={p.id} tone={p.tone} className={`nw-newsletter form-${p.variant}`}>
    <div><span className="nw-eyebrow">The occasional update</span><h2>{p.headline}</h2><p>{p.description}</p></div>
    <form onSubmit={preventPreviewSubmit}>
      <label className="nw-sr-only" htmlFor={`${p.id}-email`}>Email address</label>
      <input id={`${p.id}-email`} name="email" type="email" autoComplete="email" placeholder="Your email address" />
      <button className="nw-button" type="submit">{p.buttonText}<span aria-hidden="true"> </span></button>
      <small>{p.privacyNote} <span>Preview only. submissions are not stored.</span></small>
    </form>
  </Block>;
}

export function AppointmentBooking(p: ComponentProps<"AppointmentBooking">) {
  return <Block id={p.id} tone={p.tone} className={`nw-form-section nw-booking form-${p.variant}`}>
    <div className="nw-form-copy"><span className="nw-eyebrow">Your next visit</span><h2>{p.headline}</h2><p>{p.description}</p><div className="nw-booking-benefits"><span>✦ Thoughtful, personal care</span><span>◷ Flexible appointment times</span></div></div>
    <form onSubmit={preventPreviewSubmit}>
      <label>Choose a service<select defaultValue=""><option value="" disabled>Select a service</option>{p.services.map((service) => <option key={service}>{service}</option>)}</select></label>
      <div className="nw-form-grid"><label>Your name<input name="name" autoComplete="name" placeholder="Name" /></label><label>Email or phone<input name="contact" autoComplete="email" placeholder="How can we reach you?" /></label></div>
      <div className="nw-form-grid"><label>Preferred date<input type="date" name="date" /></label><label>Preferred time<select defaultValue=""><option value="" disabled>Select a time</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label></div>
      <button className="nw-button" type="submit">{p.buttonText}<span aria-hidden="true"> </span></button>
      <small>{p.note} <span>Preview only. requests are not stored.</span></small>
    </form>
  </Block>;
}

export function TableReservation(p: ComponentProps<"TableReservation">) {
  return <Block id={p.id} tone={p.tone} className={`nw-reservation form-${p.variant}`}>
    <div><span className="nw-eyebrow">Join us</span><h2>{p.headline}</h2><p>{p.description}</p></div>
    <form onSubmit={preventPreviewSubmit}>
      <label>Your name<input name="name" autoComplete="name" placeholder="Name" /></label>
      <label>Email or phone<input name="contact" placeholder="How can we reach you?" /></label>
      <div className="nw-form-grid"><label>Date<input type="date" name="date" /></label><label>Time<select defaultValue=""><option value="" disabled>Choose a time</option><option>12:00 PM</option><option>6:00 PM</option><option>7:30 PM</option></select></label></div>
      <div className="nw-form-grid"><label>Guests<select defaultValue="2"><option>1 guest</option><option value="2">2 guests</option><option>3 guests</option><option>4 guests</option><option>5+ guests</option></select></label><label>Occasion<input name="occasion" placeholder="Optional" /></label></div>
      <button className="nw-button" type="submit">{p.buttonText}<span aria-hidden="true"> </span></button>
      <small>{p.note} <span>Preview only. requests are not stored.</span></small>
    </form>
  </Block>;
}
