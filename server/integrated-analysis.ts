import { Router } from "express";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { z } from "zod";

const AdSchema = z.object({
  adId: z.string(),
  pageName: z.string().min(1),
  startedRunningOn: z.string().nullable().optional(),
  startedRunningRaw: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
  media: z.array(z.object({ type: z.string(), url: z.string().url(), thumbnailUrl: z.string().url().optional() })).optional(),
  bodyText: z.string().optional(),
  headline: z.string().optional(),
  cta: z.string().optional(),
  adLibraryUrl: z.string().url().nullable().optional(),
});

const RequestSchema = z.object({
  pageId: z.string().regex(/^\d{5,30}$/, "Enter a numeric Facebook Page ID."),
  country: z.string().regex(/^(?:[A-Z]{2}|ALL)$/, "Use a two-letter country code or ALL.").default("IN"),
  ourPositioning: z.string().trim().max(1500).optional().default(""),
  // Analytics only operates on the bounded campaign inventory. Keeping this
  // small makes every model call predictable in both latency and token usage.
  ads: z.array(AdSchema).max(20).optional(),
});

const GeminiReportSchema = z.object({
  headline: z.string().min(1).max(180),
  executiveSummary: z.string().min(1).max(1100),
  confidence: z.enum(["high", "medium", "low"]),
  observations: z.array(z.object({
    title: z.string().min(1).max(100),
    finding: z.string().min(1).max(500),
    evidenceIds: z.array(z.string()).min(1).max(6),
  })).min(3).max(6),
  competitorPlaybook: z.array(z.object({
    tactic: z.string().min(1).max(100),
    interpretation: z.string().min(1).max(500),
    evidenceIds: z.array(z.string()).min(1).max(6),
  })).min(2).max(5),
  differentiation: z.array(z.object({
    opportunity: z.string().min(1).max(120),
    recommendation: z.string().min(1).max(500),
    evidenceIds: z.array(z.string()).max(6),
    confidence: z.enum(["high", "medium", "low"]),
  })).min(2).max(5),
  trends: z.array(z.object({
    trend: z.string().min(1).max(120),
    evidenceIds: z.array(z.string()).min(1).max(8),
    caveat: z.string().min(1).max(300),
  })).min(2).max(5),
  creativeMechanics: z.array(z.object({
    pattern: z.string().min(1).max(120),
    whatTheAdsDo: z.string().min(1).max(400),
    whyItMayBeUsed: z.string().min(1).max(350),
    evidenceIds: z.array(z.string()).min(1).max(6),
  })).min(2).max(5),
  nextTests: z.array(z.object({
    test: z.string().min(1).max(140),
    rationale: z.string().min(1).max(350),
    evidenceIds: z.array(z.string()).min(1).max(6),
  })).min(2).max(4),
  limitations: z.array(z.string().min(1).max(300)).min(1).max(5),
});

export type MetaAd = z.infer<typeof AdSchema>;
type GeminiReport = z.infer<typeof GeminiReportSchema>;

/**
 * This prompt is deliberately evidence-first. The model may interpret the campaign
 * set, but never turn public ad-library observations into claims about spend, reach,
 * conversion, targeting, or profitability.
 */
export const integratedAnalysisSystemPrompt = `You are Nexora's integrated competitive analyst. Produce a precise, decision-useful analysis of a competitor's currently observable Meta Ad Library inventory.

Your only factual evidence is the structured campaign dataset supplied by the user. Treat every ad as a public observation, not proof of performance. You may infer that a creative has remained live for its observed run length, but you MUST NOT assert or imply spend, reach, impressions, audience targeting, conversion rate, ROI, profitability, internal strategy, or causal performance unless those fields are explicitly present in the evidence (they are not in this task).

Evidence rules:
- Every factual claim about the competitor must cite one or more evidence IDs in the matching evidenceIds field.
- An evidence ID maps to a source record; use it exactly as supplied (for example S1).
- Use counts only when they can be derived from the provided inventory. Do not say "all ads" when the crawler may have a bounded scan.
- Separate fact from interpretation. Phrase interpretations as "suggests", "is consistent with", or "worth testing", never as certainty.
- "Long-running" means present in this scan with an earlier observed start date; it is a durability signal, not proof that it is the top-performing ad.
- If the user's own positioning is absent, do not invent a comparison. State that a differentiation conclusion needs their positioning.
- Do not write generic marketing filler, inspirational language, or advice without a concrete observation.
- Explain creative mechanics plainly: the hook or offer, the behavioural job it appears designed to do, and why that tactic may be useful. This is interpretation, not a performance claim.
- In creativeMechanics, identify recurring ad patterns rather than recapping individual cards. In nextTests, recommend a falsifiable experiment the user could run; do not call it a guaranteed win.
- Keep the report concise, specific, and useful to a marketer deciding what to inspect or test next.

Output strict JSON matching the requested schema. Make the executive summary specific to this dataset. Include limitations that explain what Meta's public library cannot prove.`;

function adSource(ad: MetaAd, index: number) {
  const id = `S${index + 1}`;
  return {
    id,
    adId: ad.adId,
    advertiser: ad.pageName,
    startedRunningOn: ad.startedRunningOn || null,
    bodyText: (ad.bodyText || ad.text || "").slice(0, 900),
    headline: (ad.headline || "Not captured").slice(0, 180),
    cta: (ad.cta || "Not captured").slice(0, 100),
    mediaTypes: (ad.media || []).map((x) => x.type),
    url: ad.adLibraryUrl || `https://www.facebook.com/ads/library/?id=${encodeURIComponent(ad.adId)}`,
  };
}

type AnalysisResult = Awaited<ReturnType<typeof analyseWithGemini>>;
type CachedAnalysis = AnalysisResult & { cache: { status: "generated" | "hit"; expiresAt: string } };

const REPORT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const GEMINI_MIN_INTERVAL_MS = 5_000; // 12 RPM: deliberate headroom under the 15 RPM key limit.
const reportCache = new Map<string, { expiresAt: number; value: CachedAnalysis }>();
const inFlightReports = new Map<string, Promise<CachedAnalysis>>();
let nextGeminiSlotAt = 0;

function reportCacheKey(input: { pageId: string; country: string; ads: MetaAd[]; ourPositioning: string }) {
  const evidence = compactAds(input.ads).map((ad) => ({
    adId: ad.adId,
    startedRunningOn: ad.startedRunningOn || null,
    text: ad.bodyText || ad.text || "",
    headline: ad.headline || "",
    cta: ad.cta || "",
  }));
  return createHash("sha256").update(JSON.stringify({
    pageId: input.pageId,
    country: input.country,
    ourPositioning: input.ourPositioning,
    evidence,
  })).digest("hex");
}

async function reserveGeminiSlot() {
  const delay = Math.max(0, nextGeminiSlotAt - Date.now());
  nextGeminiSlotAt = Math.max(nextGeminiSlotAt, Date.now()) + GEMINI_MIN_INTERVAL_MS;
  if (delay) await new Promise<void>((resolveWait) => setTimeout(resolveWait, delay));
}

function compactAds(ads: MetaAd[]) {
  // The product keeps a deliberately small local inventory: one bounded 20-ad scan.
  const sorted = [...ads].sort((a, b) => (a.startedRunningOn || "9999").localeCompare(b.startedRunningOn || "9999"));
  const newest = [...ads].sort((a, b) => (b.startedRunningOn || "").localeCompare(a.startedRunningOn || "")).slice(0, 20);
  const picked = new Map<string, MetaAd>();
  [...sorted.slice(0, 20), ...newest, ...ads.slice(0, 20)].forEach((ad) => picked.set(ad.adId, ad));
  return [...picked.values()].slice(0, 20);
}

async function runAdRadar(pageId: string, country: string): Promise<MetaAd[]> {
  const root = resolve(process.env.ADRADAR_DIR || "../.research-tools/adradar");
  const script = resolve(root, "dist/index.js");
  const snapshot = resolve(root, "data", `nexora-${pageId}-${country}.json`);
  await new Promise<void>((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [script, "--page-id", pageId, "--country", country, "--data", snapshot, "--dry-run", "--max-scrolls", "0", "--max-ads", "20", "--timeout", "120000"], {
      cwd: root,
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", rejectRun);
    child.on("exit", (code) => code === 0 ? resolveRun() : rejectRun(new Error(`AdRadar scan failed${stderr ? `: ${stderr.slice(-500)}` : ""}`)));
  });
  const raw = JSON.parse(await readFile(snapshot, "utf8")) as { ads?: Record<string, unknown> };
  return z.array(AdSchema).parse(Object.values(raw.ads || {})).slice(0, 20);
}

async function analyseWithGemini(input: {
  pageId: string; country: string; ads: MetaAd[]; ourPositioning: string;
}) {
  // Reuse the site's existing compatible-Gemini configuration when a dedicated
  // campaign-analysis key has not been set. This keeps the secret server-only
  // and avoids requiring the same Google AI Studio key twice in .env.
  const apiKey = process.env.GEMINI_API_KEY || process.env.WEBSITE_AI_API_KEY;
  if (!apiKey) throw new Error("Set GEMINI_API_KEY or WEBSITE_AI_API_KEY on the server before generating an integrated analysis.");
  const useNativeGemini = Boolean(process.env.GEMINI_API_KEY)
    || /generativelanguage\.googleapis\.com/i.test(process.env.WEBSITE_AI_BASE_URL || "");
  const model = process.env.GEMINI_MODEL || process.env.WEBSITE_AI_MODEL || "gemini-3.5-flash-lite";
  const evidence = compactAds(input.ads).map(adSource);
  const now = new Date().toISOString().slice(0, 10);
  const reportSchema = z.toJSONSchema(GeminiReportSchema);
  const analysisInput = {
    task: "Analyse this Meta Ad Library campaign inventory and return the specified report JSON.",
    observedOn: now,
    pageId: input.pageId,
    country: input.country,
    inventory: { observedCards: input.ads.length, evidenceRecordsProvided: evidence.length },
    ourPositioning: input.ourPositioning || "Not provided",
    sources: evidence,
  };
  const payload = {
    system_instruction: { parts: [{ text: integratedAnalysisSystemPrompt }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify(analysisInput) }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 3200,
      responseMimeType: "application/json",
      responseJsonSchema: reportSchema,
    },
  };
  const response = useNativeGemini
    ? await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      signal: AbortSignal.timeout(60000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    : await fetch(new URL("chat/completions", `${process.env.WEBSITE_AI_BASE_URL?.replace(/\/$/, "")}/`).toString(), {
      method: "POST",
      signal: AbortSignal.timeout(60000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: integratedAnalysisSystemPrompt },
          { role: "user", content: JSON.stringify(analysisInput) },
        ],
      }),
    });
  if (!response.ok) throw new Error(`Gemini analysis failed with HTTP ${response.status}. Check the configured model and API access.`);
  const body = await response.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    choices?: { message?: { content?: string } }[];
  };
  const text = useNativeGemini
    ? body.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim()
    : body.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Gemini returned no analysis.");
  let report: GeminiReport;
  try { report = GeminiReportSchema.parse(JSON.parse(text)); }
  catch { throw new Error("Gemini returned an analysis outside Nexora's evidence schema."); }
  const referenced = new Set([
    ...report.observations.flatMap((x) => x.evidenceIds),
    ...report.competitorPlaybook.flatMap((x) => x.evidenceIds),
    ...report.differentiation.flatMap((x) => x.evidenceIds),
    ...report.trends.flatMap((x) => x.evidenceIds),
    ...report.creativeMechanics.flatMap((x) => x.evidenceIds),
    ...report.nextTests.flatMap((x) => x.evidenceIds),
  ]);
  const sources = evidence.filter((source) => referenced.has(source.id));
  return { report, sources, model, observedCards: input.ads.length, generatedAt: new Date().toISOString() };
}

export async function generateMetaCampaignAnalysis(input: {
  pageId: string; country: string; ads: MetaAd[]; ourPositioning: string;
}): Promise<CachedAnalysis> {
  if (!process.env.GEMINI_API_KEY && !process.env.WEBSITE_AI_API_KEY)
    throw new Error("Set GEMINI_API_KEY or WEBSITE_AI_API_KEY on the server before generating an integrated analysis.");
  const key = reportCacheKey(input);
  const now = Date.now();
  const cached = reportCache.get(key);
  if (cached && cached.expiresAt > now)
    return { ...cached.value, cache: { status: "hit", expiresAt: new Date(cached.expiresAt).toISOString() } };
  if (cached) reportCache.delete(key);

  const active = inFlightReports.get(key);
  if (active) return active;

  const job = (async () => {
    await reserveGeminiSlot();
    const expiresAt = Date.now() + REPORT_CACHE_TTL_MS;
    const value: CachedAnalysis = {
      ...await analyseWithGemini(input),
      cache: { status: "generated", expiresAt: new Date(expiresAt).toISOString() },
    };
    reportCache.set(key, { expiresAt, value });
    return value;
  })().finally(() => inFlightReports.delete(key));
  inFlightReports.set(key, job);
  return job;
}

export function createIntegratedAnalysisApi() {
  const api = Router();
  api.post("/meta", async (req, res, next) => {
    try {
      const input = RequestSchema.parse(req.body);
      const ads = input.ads?.length ? input.ads : await runAdRadar(input.pageId, input.country);
      if (!ads.length) throw new Error("No active ads were returned for this Page ID and country filter.");
      res.json(await generateMetaCampaignAnalysis({ ...input, ads }));
    } catch (error) { next(error); }
  });
  return api;
}
