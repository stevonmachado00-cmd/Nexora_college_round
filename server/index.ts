import express from "express";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createApi } from "./api";
import { createWebinarApi } from "./webinars";
import { createGoogleCalendarApi } from "./google-calendar";
import { createIntegrationApi } from "./integrations";
import { createIntegratedAnalysisApi } from "./integrated-analysis";
import { z } from "zod";
const production = process.argv.includes("--production");
const app = express();
app.disable("x-powered-by");

/**
 * The billing service deliberately remains a loopback-only process, but the
 * product must have one browser origin.  Proxy the console and its API through
 * Nexus instead of exposing port 4175 to the user-facing UI.
 */
const billingOrigin = "http://127.0.0.1:4175";
const billingProxy = (api: boolean) =>
  async (req: express.Request, res: express.Response) => {
    try {
      const target = `${billingOrigin}${api ? "/api" : ""}${req.url || "/"}`;
      const headers = new Headers();
      for (const name of ["accept", "content-type", "cookie"] as const) {
        const value = req.headers[name];
        if (typeof value === "string") headers.set(name, value);
      }
      const hasBody = !["GET", "HEAD"].includes(req.method);
      const response = await fetch(target, {
        method: req.method,
        headers,
        body: hasBody ? req : undefined,
        // Node requires this when an IncomingMessage is used as a request body.
        duplex: hasBody ? "half" : undefined,
        signal: AbortSignal.timeout(15_000),
      } as RequestInit);
      res.status(response.status);
      for (const name of [
        "content-type",
        "cache-control",
        "x-content-type-options",
      ]) {
        const value = response.headers.get(name);
        if (value) res.setHeader(name, value);
      }
      const cookies = response.headers.getSetCookie?.() || [];
      if (cookies.length) res.setHeader("set-cookie", cookies);
      res.send(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.status(503).json({
        error:
          "Billing is starting or unavailable. The Nexus billing service is local-only; try again in a moment.",
      });
    }
  };

app.get("/api/billing/availability", async (_req, res) => {
  try {
    const response = await fetch(`${billingOrigin}/api/health`, {
      signal: AbortSignal.timeout(1500),
    });
    res.json({ available: response.ok });
  } catch {
    res.json({ available: false });
  }
});
// These must precede express.json(), otherwise the billing request stream is
// consumed before it can be forwarded to the local billing process.
app.use("/api/billing", billingProxy(true));
app.use("/billing", billingProxy(false));
app.use(express.json({ limit: "256kb" }));
app.use("/api/website-builder", createApi());
app.use("/api/webinars", createWebinarApi());
app.use("/api/webinars/google", createGoogleCalendarApi());
app.use("/api/integrations", createIntegrationApi());
app.use("/api/integrated-analysis", createIntegratedAnalysisApi());
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
