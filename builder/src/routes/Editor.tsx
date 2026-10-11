import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Puck, createUsePuck, type PuckApi, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { config } from "../puck/config";
import { descriptions } from "../../shared/catalog";
import type { ComponentName } from "../../shared/schema";
import { templates } from "../../shared/templates";
import {
  validateDocument,
  validationMessage,
  type WebsiteDocument,
} from "../../shared/schema";
import type { WebsiteProject } from "../../shared/project";
import { editWebsite, projectStorage } from "../lib/api";
import { summarizeChanges } from "../lib/diff";
import {
  Status,
  Loading,
  ErrorPage,
  message,
  type Health,
} from "../components/UI";
export default function LoadEditor({
  id,
  health,
}: {
  id: string;
  health: Health;
}) {
  const [project, setProject] = useState<WebsiteProject | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    projectStorage
      .get(id)
      .then(setProject)
      .catch((e) => setError(message(e)));
  }, [id]);
  return error ? (
    <ErrorPage text={error} />
  ) : project ? (
    <Editor project={project} health={health} />
  ) : (
    <Loading />
  );
}
type EditorTools = {
  name: string;
  setName: (name: string) => void;
  busy: boolean;
  dirty: boolean;
  save: () => void;
  publish: () => void;
  preview: () => void;
  toggleAI: () => void;
  aiOpen: boolean;
  bridge: React.RefObject<PuckApi | null>;
};
const ToolsContext = createContext<EditorTools | null>(null);
const useEditorPuck = createUsePuck();
function Toolbar() {
  const tools = useContext(ToolsContext)!;
  const api = useEditorPuck((state) => state);
  useEffect(() => {
    tools.bridge.current = api;
  }, [api, tools.bridge]);
  function viewport(width: number) {
    api.dispatch({
      type: "setUi",
      ui: {
        viewports: {
          ...api.appState.ui.viewports,
          current: { width, height: "auto" },
        },
      },
    });
  }
  return (
    <header className="nb-toolbar">
      <a
        className="nb-home-symbol"
        href="/builder"
        aria-label="Website projects"
      >
        N
      </a>
      <input
        aria-label="Project name"
        value={tools.name}
        onChange={(e) => tools.setName(e.target.value)}
        maxLength={100}
      />
      <span className="nb-save-state">{tools.dirty ? "Unsaved" : "Saved"}</span>
      <div className="nb-viewports">
        {[
          [1280, "Desktop"],
          [768, "Tablet"],
          [390, "Mobile"],
        ].map(([width, label]) => (
          <button
            key={label}
            aria-label={`${label} preview`}
            aria-pressed={api.appState.ui.viewports.current.width === width}
            onClick={() => viewport(Number(width))}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="nb-history">
        <button
          aria-label="Undo"
          disabled={!api.history.hasPast}
          onClick={() => api.history.back()}
        >
          ↶
        </button>
        <button
          aria-label="Redo"
          disabled={!api.history.hasFuture}
          onClick={() => api.history.forward()}
        >
          ↷
        </button>
      </div>
      <div className="nb-toolbar-actions">
        <button
          className="nb-button"
          onClick={tools.preview}
          disabled={tools.busy}
        >
          Preview
        </button>
        <button
          className="nb-button"
          onClick={tools.save}
          disabled={tools.busy}
        >
          Save
        </button>
        <button
          className={`nb-button ${tools.aiOpen ? "active" : ""}`}
          onClick={tools.toggleAI}
        >
          ✦ Assistant
        </button>
        <button
          className="nb-button primary"
          onClick={tools.publish}
          disabled={tools.busy}
        >
          Publish
        </button>
      </div>
    </header>
  );
}
function DrawerItem({ children, name }: { children: ReactNode; name: string }) {
  const key = Object.keys(descriptions).find((item) => item.toLowerCase() === name.replace(/\s+/g, "").toLowerCase()) as ComponentName | undefined;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const description = key ? descriptions[key] : "A reusable section for your website";
  return (
    <div className="nb-library-card">
      <div className={`nb-library-thumb thumb-${slug}`} aria-hidden="true">
        <div className="nb-thumb-nav"><i /><span /><span /></div>
        <div className="nb-thumb-body">
          <div className="nb-thumb-copy"><i /><i /><i /><b /></div>
          <div className="nb-thumb-art"><i /><i /><i /></div>
        </div>
        <div className="nb-thumb-cards"><i /><i /><i /></div>
      </div>
      <div className="nb-library-entry">
        <div className="nb-library-name">{children}</div>
        <small>{description}</small>
      </div>
    </div>
  );
}
const overrides = { header: Toolbar, drawerItem: DrawerItem };
function Editor({
  project: initial,
  health,
}: {
  project: WebsiteProject;
  health: Health;
}) {
  const [project, setProject] = useState(initial),
    [name, setName] = useState(initial.name),
    [slug, setSlug] = useState(initial.slug),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [aiOpen, setAiOpen] = useState(false),
    [publishing, setPublishing] = useState(false);
  const current = useRef<WebsiteDocument>(initial.document),
    bridge = useRef<PuckApi | null>(null),
    [revision, setRevision] = useState(0);
  const [instruction, setInstruction] = useState(""),
    [aiBusy, setAiBusy] = useState(false),
    [proposal, setProposal] = useState<{
      before: WebsiteDocument;
      after: WebsiteDocument;
      changes: string[];
    } | null>(null);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  function snapshot() {
    const emitted = {
      ...(bridge.current?.appState.data || current.current.data),
    };
    if (
      "zones" in emitted &&
      emitted.zones &&
      Object.keys(emitted.zones).length === 0
    )
      delete emitted.zones;
    return validateDocument({
      template: current.current.template,
      data: emitted,
    });
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const p = await projectStorage.save({
        id: project.id,
        name,
        slug,
        document: snapshot(),
        expectedUpdatedAt: project.updatedAt,
      });
      setProject(p);
      setDirty(false);
      setNotice("Draft saved.");
      return p;
    } catch (e) {
      setError(message(e));
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function preview() {
    const p = await save();
    if (p) location.assign(`/preview/${p.id}`);
  }
  async function publish() {
    setBusy(true);
    setError("");
    try {
      const p = await projectStorage.publish(project, snapshot(), name, slug);
      setProject(p);
      setDirty(false);
      setPublishing(false);
      setNotice(`Published snapshot available at /site/${p.slug}`);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function ask() {
    setAiBusy(true);
    setError("");
    setProposal(null);
    try {
      const before = structuredClone(snapshot());
      const after = await editWebsite(before, instruction);
      setProposal({ before, after, changes: summarizeChanges(before, after) });
    } catch (e) {
      setError(message(e));
    } finally {
      setAiBusy(false);
    }
  }
  function apply() {
    if (!proposal) return;
    let draft: WebsiteDocument;
    try {
      draft = snapshot();
    } catch (e) {
      setError(validationMessage(e));
      return;
    }
    if (JSON.stringify(draft) !== JSON.stringify(proposal.before)) {
      setError(
        "The page changed while this proposal was being prepared. Ask again against the current draft.",
      );
      return;
    }
    current.current = proposal.after;
    bridge.current?.dispatch({
      type: "setData",
      data: proposal.after.data,
      recordHistory: true,
    });
    setProposal(null);
    setDirty(true);
    setRevision((x) => x + 1);
    setNotice("Proposal applied. Use Undo to revert it.");
  }
  function changed(data: Data) {
    try {
      // Puck emits an empty zones object even when no nested zones are configured.
      const raw = { ...data };
      if (raw.zones && Object.keys(raw.zones).length === 0) delete raw.zones;
      const next = validateDocument({
        template: current.current.template,
        data: raw,
      });
      if (JSON.stringify(next) !== JSON.stringify(current.current)) {
        current.current = next;
        setDirty(true);
        setNotice("");
        setRevision((x) => x + 1);
      }
    } catch (e) {
      setDirty(true);
      setError(validationMessage(e));
    }
  }
  const tools: EditorTools = {
    name,
    setName: (v) => {
      setName(v);
      setDirty(true);
    },
    busy,
    dirty,
    save: () => void save(),
    publish: () => setPublishing(true),
    preview: () => void preview(),
    toggleAI: () => setAiOpen((x) => !x),
    aiOpen,
    bridge,
  };
  return (
    <ToolsContext value={tools}>
      <div className={`nb-editor ${aiOpen ? "assistant-open" : ""}`}>
        <div className="nb-editor-meta">
          <a href="/builder"> Websites</a>
          <span>
            {templates.find((t) => t.id === project.document.template)?.name ||
              "Blank page"}{" "}
            <i>/</i>{" "}
            {project.status === "published"
              ? "Published. editing draft"
              : "Draft"}
          </span>
          <span>
            {health.demo ? "Demo composer. no model" : health.provider}
          </span>
        </div>
        <Status text={error} error />
        <Status text={notice} />
        <div className="nb-editor-body">
          <div className="nb-puck" inert={busy} aria-busy={busy}>
            <Puck
              config={config}
              data={initial.document.data}
              onChange={changed}
              onPublish={() => setPublishing(true)}
              headerTitle={name}
              viewports={[
                { width: 1280, label: "Desktop" },
                { width: 768, label: "Tablet" },
                { width: 390, label: "Mobile" },
              ]}
              overrides={overrides}
              height="calc(100vh - 40px)"
              iframe={{ enabled: true }}
            />
          </div>
          {aiOpen && (
            <aside className="nb-ai-panel" inert={busy}>
              <div className="nb-ai-heading">
                <span className="nb-assistant-mark">✦</span>
                <div>
                  <h2>Nexus assistant</h2>
                  <p>
                    {health.demo
                      ? "Deterministic demo"
                      : "Structured AI composer"}
                  </p>
                </div>
                <button
                  aria-label="Close assistant"
                  onClick={() => setAiOpen(false)}
                >
                  ×
                </button>
              </div>
              <p className="nb-ai-intro">
                Describe a change. Review the proposed configuration before
                applying it.
              </p>
              <label htmlFor="instruction">Your instruction</label>
              <textarea
                id="instruction"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Add a pricing section before the FAQ…"
                maxLength={4000}
              />
              <button
                className="nb-button primary"
                disabled={aiBusy || instruction.trim().length < 5}
                onClick={() => void ask()}
              >
                {aiBusy ? "Preparing proposal…" : "Propose changes "}
              </button>
              <div className="nb-suggestions">
                {[
                  "Make the hero darker",
                  "Change the hero CTA to Book a Demo",
                  "Add a pricing section before the FAQ",
                  "Reorder testimonials and features",
                  "Make the entire website use a dark theme",
                ].map((s) => (
                  <button key={s} onClick={() => setInstruction(s)}>
                    {s}
                  </button>
                ))}
              </div>
              {proposal && (
                <section className="nb-proposal">
                  <span>Review proposed changes</span>
                  <ul>
                    {proposal.changes.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                  <details>
                    <summary>View proposed JSON</summary>
                    <pre>{JSON.stringify(proposal.after, null, 2)}</pre>
                  </details>
                  <div>
                    <button
                      className="nb-button"
                      onClick={() => setProposal(null)}
                    >
                      Discard
                    </button>
                    <button className="nb-button primary" onClick={apply}>
                      Apply changes
                    </button>
                  </div>
                </section>
              )}
              <div className="nb-ai-context">
                <span>Page context</span>
                <strong>
                  {current.current.data.content.length} sections. {revision}{" "}
                  changes
                </strong>
                <p>
                  Only component definitions, theme, page configuration and your
                  instruction are sent.
                </p>
              </div>
              <details className="nb-schema-view">
                <summary>Current page configuration</summary>
                <pre>{JSON.stringify(current.current, null, 2)}</pre>
              </details>
              {project.status === "published" && (
                <a className="nb-published-link" href={`/site/${project.slug}`}>
                  Open published snapshot
                </a>
              )}
            </aside>
          )}
        </div>
        {publishing && (
          <div className="nb-modal-backdrop" role="presentation">
            <section
              className="nb-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="publish-title"
            >
              <button
                className="nb-modal-close"
                aria-label="Close publish review"
                onClick={() => setPublishing(false)}
              >
                ×
              </button>
              <span className="nb-kicker">Publish website</span>
              <h2 id="publish-title">A snapshot ready to share.</h2>
              <p>
                Publish this draft at the route below. Future draft edits will
                stay separate until you publish again.
              </p>
              <label>
                Website slug
                <input
                  disabled={busy}
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setDirty(true);
                  }}
                  maxLength={80}
                />
              </label>
              <div className="nb-url">/site/{slug}</div>
              <p className="nb-footnote">
                This prototype stores projects on this Nexus server. Confirm
                copy, links, placeholder quotes and plan details before
                publishing.
              </p>
              <Status text={error} error />
              <footer>
                <button
                  className="nb-button"
                  onClick={() => setPublishing(false)}
                >
                  Keep editing
                </button>
                <button
                  className="nb-button primary"
                  disabled={busy}
                  onClick={() => void publish()}
                >
                  {busy ? "Publishing…" : "Publish snapshot"}
                </button>
              </footer>
            </section>
          </div>
        )}
      </div>
    </ToolsContext>
  );
}
