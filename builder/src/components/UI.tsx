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
      <span>N</span>Nexus <em>/ Websites</em>
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
    <div className="nb-loading" role="status">
      Loading your website…
    </div>
  );
}
export function ErrorPage({ text }: { text: string }) {
  return (
    <div className="nb-error-page">
      <Logo />
      <h1>We couldn’t open this website.</h1>
      <Status text={text} error />
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
