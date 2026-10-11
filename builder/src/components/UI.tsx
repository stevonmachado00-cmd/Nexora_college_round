import { Component, type ReactNode } from "react";
export const message = (e: unknown) =>
  e instanceof Error
    ? e.message
    : "Something went wrong. Your current page is unchanged.";
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "website";
export type Health = { provider: string; demo: boolean };
export function Logo() {
  return (
    <a className="nb-logo" href="/#website">
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h10M5 7v10M19 7v10M7 19h10M7 7l10 10"/></svg></span>Nexus <em>/ Websites</em>
    </a>
  );
}
export function Status({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return text ? (
    <div
      className={`nb-status ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {text}
    </div>
  ) : null;
}

export function Loading() {
  return (
    <div className="ds-loading nb-loading" role="status" aria-live="polite">
      <span className="ds-skeleton" /><span className="ds-skeleton" /><span className="ds-skeleton" />
      <p>Loading your website…</p>
    </div>
  );
}
export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return <section className="ds-empty"><div className="ds-empty-art" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4h14v12H3z M3 8h14 M6 6h1 M9 6h1" /></svg></div><h2>{title}</h2>{children}</section>;
}
export function ErrorPage({ text }: { text: string }) {
  return (
    <div className="nb-error-page">
      <Logo />
      <Empty title="We couldn’t open this website."><p>{text}</p></Empty>
      <a className="nb-button" href="/builder">
        Return to website projects
      </a>
    </div>
  );
}
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <ErrorPage text="The editor encountered an unexpected error. Saved projects are preserved. Reload to continue." />
    ) : (
      this.props.children
    );
  }
}
