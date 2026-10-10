import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import {
  componentSchemas,
  SafeUrl,
  ImageUrl,
  validateDocument,
} from "../builder/shared/schema";
import {
  getTemplate,
  templates,
  emptyWebsite,
} from "../builder/shared/templates";
import { DemoProvider } from "../server/ai/demo";
import { editWebsite, generateWebsite } from "../server/ai/service";
import { systemPrompt } from "../server/ai/prompts";
import { JsonProjectRepository } from "../server/storage";
import { createApi } from "../server/api";

test("all templates and component defaults satisfy the shared contract", () => {
  for (const t of templates) {
    const doc = validateDocument(getTemplate(t.id));
    assert.ok(doc.data.content.length >= 8);
    assert.equal(
      new Set(doc.data.content.map((x) => x.props.id)).size,
      doc.data.content.length,
    );
  }
  for (const schema of Object.values(componentSchemas))
    schema.parse({ id: crypto.randomUUID() });
  assert.equal(emptyWebsite().data.content.length, 0);
  assert.throws(() => getTemplate("missing"));
});
test("untrusted URLs, props, components and duplicate IDs are rejected", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hi",
    "//evil.test",
    "/\\evil.test",
    "https://host.test/\n",
  ]) {
    assert.equal(SafeUrl.safeParse(url).success, false);
    assert.equal(ImageUrl.safeParse(url).success, false);
  }
  for (const url of [
    "/contact",
    "#pricing",
    "https://example.com",
    "mailto:hello@example.com",
  ])
    assert.equal(SafeUrl.safeParse(url).success, true);
  const doc = getTemplate("saas-modern");
  const duplicate = structuredClone(doc);
  duplicate.data.content[1].props.id = duplicate.data.content[0].props.id;
  assert.throws(() => validateDocument(duplicate));
  assert.throws(() =>
    validateDocument({
      ...doc,
      data: {
        ...doc.data,
        content: [
          { type: "ArbitraryCode", props: { id: "x", code: "alert(1)" } },
        ],
      },
    }),
  );
  const invalid = structuredClone(doc) as unknown as {
    data: { content: { props: Record<string, unknown> }[] };
  };
  invalid.data.content[0].props.onClick = "execute()";
  assert.throws(() => validateDocument(invalid));
});
test("demo composition is deterministic in behavior and factual placeholders stay explicit", async () => {
  const provider = new DemoProvider();
  const doc = await generateWebsite(
    { prompt: "Create a premium support SaaS called ResolveAI" },
    provider,
  );
  assert.equal(doc.data.root.props.title, "ResolveAI");
  const original = JSON.stringify(doc);
  const edited = await editWebsite(
    { current: doc, prompt: "Change the hero CTA to Book a Demo" },
    provider,
  );
  assert.equal(JSON.stringify(doc), original);
  const hero = edited.data.content.find((x) => x.type === "Hero");
  assert.equal(
    (hero?.props as Record<string, unknown>).buttonText,
    "Book a Demo",
  );
  assert.deepEqual(doc.data.root, edited.data.root);
  const pricing = await editWebsite(
    { current: doc, prompt: "Add a pricing section before the FAQ" },
    provider,
  );
  const lastPricing = pricing.data.content
    .map((x) => x.type)
    .lastIndexOf("Pricing");
  assert.equal(pricing.data.content[lastPricing + 1].type, "FAQ");
  const enterprise = await editWebsite(
    { current: doc, prompt: "Make pricing more enterprise focused" },
    provider,
  );
  const otherBefore = doc.data.content.filter((x) => x.type !== "Pricing"),
    otherAfter = enterprise.data.content.filter((x) => x.type !== "Pricing");
  assert.deepEqual(otherBefore, otherAfter);
});
test("bad provider output never mutates the current page", async () => {
  const doc = getTemplate("fintech-premium"),
    before = JSON.stringify(doc);
  const broken = {
    name: "broken",
    generateWebsite: async () => ({ data: "not a page" }),
    editWebsite: async () => ({ data: { content: [{ type: "Unknown" }] } }),
  };
  await assert.rejects(
    editWebsite({ current: doc, prompt: "Make the page better" }, broken),
  );
  assert.equal(JSON.stringify(doc), before);
  await assert.rejects(generateWebsite({ prompt: "x" }, broken));
  assert.match(systemPrompt(), /Never return JSX/);
  assert.ok(systemPrompt().length < 45000);
});
test("API stores durable drafts, enforces slug uniqueness, and isolates published snapshots", async () => {
  const directory = await mkdtemp(join(tmpdir(), "nexus-builder-"));
  const repository = new JsonProjectRepository(
    join(directory, "projects.json"),
  );
  const app = express();
  app.use(express.json());
  app.use("/api", createApi(repository));
  app.use(
    (
      e: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => res.status(422).json({ error: e.message }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api`;
  const call = (path: string, method = "GET", data?: unknown) =>
    fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
  try {
    const document = getTemplate("saas-modern"),
      input = { name: "Test site", slug: "test-site", document };
    let response = await call("/projects", "POST", input);
    assert.equal(response.status, 201);
    const project = await response.json();
    assert.equal((await call("/sites/test-site")).status, 404);
    response = await call("/projects", "POST", input);
    assert.equal(response.status, 422);
    response = await call(`/projects/${project.id}/publish`, "POST", {
      ...input,
      document: emptyWebsite(),
      expectedUpdatedAt: project.updatedAt,
    });
    assert.equal(response.status, 422);
    response = await call(`/projects/${project.id}/publish`, "POST", {
      ...input,
      expectedUpdatedAt: project.updatedAt,
    });
    assert.equal(response.status, 200);
    const published = await response.json();
    const draft = structuredClone(document);
    draft.data.root.props.title = "New unpublished title";
    response = await call(`/projects/${project.id}`, "PUT", {
      ...input,
      document: draft,
      expectedUpdatedAt: published.updatedAt,
    });
    assert.equal(response.status, 200);
    const site = await (await call("/sites/test-site")).json();
    assert.equal(
      site.document.data.root.props.title,
      document.data.root.props.title,
    );
    assert.equal(
      (await repository.get(project.id))?.document.data.root.props.title,
      "New unpublished title",
    );
    const secondRepository = new JsonProjectRepository(
      join(directory, "projects.json"),
    );
    assert.equal((await secondRepository.get(project.id))?.status, "published");
    response = await call(`/projects/${project.id}`, "PUT", {
      ...input,
      expectedUpdatedAt: "2020-01-01T00:00:00.000Z",
    });
    assert.equal(response.status, 422);
    response = await fetch(base + "/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://other.example",
      },
      body: JSON.stringify(input),
    });
    assert.equal(response.status, 403);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
    await rm(directory, { recursive: true, force: true });
  }
});
