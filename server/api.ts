import { Router } from "express";
import { z } from "zod";
import { generateWebsite, editWebsite, provider } from "./ai/service";
import { SaveProjectSchema, ProjectSchema } from "../builder/shared/project";
import {
  JsonProjectRepository,
  transaction,
  type ProjectRepository,
} from "./storage";
export function createApi(
  repository: ProjectRepository = new JsonProjectRepository(),
) {
  const api = Router();
  const rate = new Map<string, { count: number; until: number }>();
  api.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!["GET", "HEAD"].includes(req.method)) {
      const origin = req.get("origin");
      if (origin && origin !== `${req.protocol}://${req.get("host")}`) {
        res
          .status(403)
          .json({ error: "Requests must originate from this Nexus instance." });
        return;
      }
    }
    next();
  });
  api.get("/health", (_req, res) => {
    try {
      res.json({
        ok: true,
        provider: provider().name,
        demo: (process.env.WEBSITE_AI_PROVIDER || "demo") === "demo",
      });
    } catch {
      res.json({ ok: true, provider: "Not configured", demo: false });
    }
  });
  api.post("/ai/:operation", async (req, res, next) => {
    try {
      if (!["generate", "edit"].includes(String(req.params.operation))) {
        res.status(404).json({ error: "Unknown AI operation." });
        return;
      }
      const key = req.ip || "local",
        now = Date.now();
      if (rate.size > 1000) rate.clear();
      let bucket = rate.get(key);
      if (!bucket || bucket.until < now) {
        bucket = { count: 0, until: now + 60000 };
        rate.set(key, bucket);
      }
      if (++bucket.count > 20) {
        res.status(429).json({
          error: "Too many generation requests. Try again in a minute.",
        });
        return;
      }
      const document =
        req.params.operation === "generate"
          ? await generateWebsite(req.body)
          : await editWebsite(req.body);
      res.json({ document, provider: provider().name });
    } catch (e) {
      next(e);
    }
  });
  api.get("/projects", async (_req, res, next) => {
    try {
      res.json(
        (await repository.list()).map(
          ({ publishedDocument, document, ...p }) => ({
            ...p,
            template: document.template,
          }),
        ),
      );
    } catch (e) {
      next(e);
    }
  });
  api.get("/projects/:id", async (req, res, next) => {
    try {
      z.uuid().parse(req.params.id);
      const project = await repository.get(String(req.params.id));
      if (!project) {
        res.status(404).json({ error: "Website project not found." });
        return;
      }
      res.json(project);
    } catch (e) {
      next(e);
    }
  });
  api.post("/projects", async (req, res, next) => {
    try {
      const input = SaveProjectSchema.parse(req.body);
      const now = new Date().toISOString();
      const project = ProjectSchema.parse({
        id: crypto.randomUUID(),
        name: input.name,
        slug: input.slug,
        document: input.document,
        status: "draft",
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
        publishedDocument: null,
      });
      await transaction(() => repository.save(project));
      res.status(201).json(project);
    } catch (e) {
      next(e);
    }
  });
  api.put("/projects/:id", async (req, res, next) => {
    try {
      z.uuid().parse(req.params.id);
      const input = SaveProjectSchema.parse(req.body);
      const project = await transaction(async () => {
        const prior = await repository.get(String(req.params.id));
        if (!prior) throw new Error("Website project not found.");
        if (
          input.expectedUpdatedAt &&
          input.expectedUpdatedAt !== prior.updatedAt
        )
          throw new Error(
            "This project changed in another editor. Reload before saving.",
          );
        const next = {
          ...prior,
          name: input.name,
          slug: input.slug,
          document: input.document,
          updatedAt: new Date().toISOString(),
        };
        await repository.save(next);
        return next;
      });
      res.json(project);
    } catch (e) {
      next(e);
    }
  });
  api.post("/projects/:id/publish", async (req, res, next) => {
    try {
      z.uuid().parse(req.params.id);
      const input = SaveProjectSchema.parse(req.body);
      if (!input.document.data.content.length)
        throw new Error(
          "Add at least one section before publishing this website.",
        );
      const project = await transaction(async () => {
        const prior = await repository.get(String(req.params.id));
        if (!prior) throw new Error("Website project not found.");
        if (
          input.expectedUpdatedAt &&
          prior.updatedAt !== input.expectedUpdatedAt
        )
          throw new Error(
            "This project changed in another editor. Reload before publishing.",
          );
        const now = new Date().toISOString();
        const next = ProjectSchema.parse({
          ...prior,
          name: input.name,
          slug: input.slug,
          document: input.document,
          status: "published",
          publishedDocument: input.document,
          updatedAt: now,
          publishedAt: now,
        });
        await repository.save(next);
        return next;
      });
      res.json(project);
    } catch (e) {
      next(e);
    }
  });
  api.get("/sites/:slug", async (req, res, next) => {
    try {
      const p = (await repository.list()).find(
        (x) => x.status === "published" && x.slug === req.params.slug,
      );
      if (!p || !p.publishedDocument) {
        res.status(404).json({ error: "This website has not been published." });
        return;
      }
      res.json({ name: p.name, document: p.publishedDocument });
    } catch (e) {
      next(e);
    }
  });
  return api;
}
