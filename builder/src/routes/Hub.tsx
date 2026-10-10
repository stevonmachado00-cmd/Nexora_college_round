import { useEffect, useMemo, useState } from "react";
import { templates, getTemplate, emptyWebsite } from "../../shared/templates";
import type { WebsiteDocument } from "../../shared/schema";
import { generateWebsite, projectStorage, request } from "../lib/api";
import { Logo, Status, message, slugify, type Health } from "../components/UI";
import { imageSource } from "../components/website/assets/catalog";
export default function Hub({ health }: { health: Health }) {
  const [prompt, setPrompt] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [category, setCategory] = useState("All templates"),
    [projects, setProjects] = useState<
      {
        id: string;
        name: string;
        slug: string;
        status: string;
        updatedAt: string;
        template: string;
      }[]
    >([]);
  useEffect(() => {
    request<typeof projects>("/projects")
      .then(setProjects)
      .catch((e) => setError(message(e)));
    const selected = new URLSearchParams(location.search).get("template");
    if (selected) {
      if (selected === "blank" || templates.some((t) => t.id === selected))
        void create(selected);
      else
        setError(
          "That template is not available. Choose one of the foundations below.",
        );
    }
  }, []);
  async function open(document: WebsiteDocument) {
    const name = document.data.root.props.title;
    const project = await projectStorage.save({
      name,
      slug: `${slugify(name)}-${crypto.randomUUID().slice(0, 6)}`,
      document,
    });
    location.assign(`/builder/${project.id}`);
  }
  async function create(kind: string) {
    setBusy(true);
    setError("");
    try {
      await open(
        kind === "blank"
          ? emptyWebsite()
          : kind === "generate"
            ? await generateWebsite(prompt)
            : getTemplate(kind),
      );
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  }
  const categories = useMemo(
    () => ["All templates", ...Array.from(new Set(templates.map((t) => t.category)))],
    [],
  );
  const visibleTemplates = category === "All templates"
    ? templates
    : templates.filter((template) => template.category === category);
  return (
    <div className="nb-hub">
      <header className="nb-hub-nav">
        <Logo />
        <a href="/#projects">Back to workspace ↗</a>
      </header>
      <main>
        <div className="nb-heading">
          <span className="nb-kicker">WEBSITE BUILDER</span>
          <h1>
            A clear starting point.
            <br />A website you can make your own.
          </h1>
          <p>
            Describe your business or choose a considered foundation. Edit every
            section visually, with your brand carried through the entire page.
          </p>
        </div>
        <section className="nb-prompt-card">
          <div>
            <span className="nb-assistant-mark">✦</span>
            <strong>What are you building?</strong>
            <span className="nb-provider">
              {health.demo ? "Demo composer" : "AI connected"}
            </span>
          </div>
          <textarea
            aria-label="Describe your business or website"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Create a premium B2B website for a customer-support platform called ResolveAI…"
          />
          <footer>
            <small>
              {health.demo
                ? "Rules-based demo · no model or API key required"
                : health.provider}
            </small>
            <button
              className="nb-button primary"
              disabled={busy || prompt.trim().length < 5}
              onClick={() => create("generate")}
            >
              {busy ? "Creating…" : "Generate website ↗"}
            </button>
          </footer>
        </section>
        <Status text={error} error />
        <div className="nb-section-title">
          <div>
            <h2>Designed foundations</h2>
            <p>Choose a direction, then edit every section, image, interaction, and theme token in the visual composer.</p>
          </div>
          <div className="nb-template-controls">
            <label>
              <span>Industry</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <button className="nb-button" disabled={busy} onClick={() => create("blank")}>＋ Start blank</button>
          </div>
        </div>
        <div className="nb-template-grid">
          {visibleTemplates.map((t) => (
            <article key={t.id} className="nb-template-card">
              <div className={`nb-template-art art-${t.id}`}>
                <img src={imageSource(t.heroImage)} alt="" aria-hidden="true" />
                <div className="nb-art-nav">
                  <b>{t.brand.toLowerCase()}.</b>
                  <span>About &nbsp; Contact</span>
                </div>
                <span>{t.category} / A NEXUS FOUNDATION</span>
                <h3>{t.headline}</h3>
                <div className="nb-art-blocks">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <div className="nb-template-info">
                <div>
                  <h3>{t.name}</h3>
                  <span>{t.category}</span>
                </div>
                <p>{t.description}</p>
                <button
                  className="nb-button"
                  disabled={busy}
                  onClick={() => create(t.id)}
                >
                  Use this template →
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="nb-section-title">
          <div>
            <h2>Your website projects</h2>
            <p>Drafts and published snapshots stay separate.</p>
          </div>
          <small>{projects.length} projects</small>
        </div>
        {projects.length ? (
          <div className="nb-project-list">
            {projects.map((p) => (
              <a key={p.id} href={`/builder/${p.id}`}>
                <span className="nb-project-icon">▤</span>
                <div>
                  <strong>{p.name}</strong>
                  <small>/site/{p.slug}</small>
                </div>
                <span className={`nb-project-status ${p.status}`}>
                  {p.status}
                </span>
                <time>{new Date(p.updatedAt).toLocaleDateString()}</time>
                <span>↗</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="nb-empty">
            Your first website starts above. Generate a draft or choose a
            template.
          </div>
        )}
        <p className="nb-footnote">
          Controlled components. Shared design tokens. Editable content. No
          generated application code.
        </p>
      </main>
    </div>
  );
}
