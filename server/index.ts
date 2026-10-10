import express from "express";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createApi } from "./api";
import { createWebinarApi } from "./webinars";
import { z } from "zod";
const production = process.argv.includes("--production");
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));
app.use("/api/website-builder", createApi());
app.use("/api/webinars", createWebinarApi());
if (!production) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.get(
    /^\/(?:builder(?:\/[a-f0-9-]{36})?|preview\/[a-f0-9-]{36}|site\/[a-z0-9-]+)\/?$/,
    async (req, res, next) => {
      try {
        const html = await readFile(resolve("builder/index.html"), "utf8");
        res.type("html").send(await vite.transformIndexHtml("/builder/", html));
      } catch (e) {
        next(e);
      }
    },
  );
  app.use(vite.middlewares);
} else {
  app.use(
    "/builder",
    express.static(resolve("dist/builder"), { index: false }),
  );
  app.get(/^\/(builder|preview|site)(\/.*)?$/, (_req, res) =>
    res.sendFile(resolve("dist/builder/index.html")),
  );
}
app.use(express.static(resolve("dist")));
app.get("/events/:slug", (_req, res) => res.sendFile(resolve("dist/event.html")));
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const message =
      error instanceof z.ZodError
        ? error.issues
            .slice(0, 3)
            .map((x) => `${x.path.join(".")}: ${x.message}`)
            .join("; ")
        : error instanceof Error
          ? error.message
          : "The request could not be completed.";
    res
      .status(error instanceof z.ZodError ? 400 : 422)
      .json({ error: message });
  },
);
const port = Number(process.env.PORT || 4173);
app.listen(port, "127.0.0.1", () =>
  console.log(
    `Nexus: http://localhost:${port}\nBuilder: http://localhost:${port}/builder\nAI: ${process.env.WEBSITE_AI_PROVIDER || "demo"} (server-side)`,
  ),
);
