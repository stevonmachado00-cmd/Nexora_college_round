import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { Router } from "express";
import { z } from "zod";

type ActionName =
  | "website.create_page_draft"
  | "marketing.create_campaign_draft"
  | "marketing.send_campaign"
  | "webinar.create_event"
  | "crm.find_or_create_leads"
  | "analytics.get_funnel_report";

type PlannedAction = { id: string; name: ActionName; description: string; needsApproval: boolean };

function makePlan(request: string): PlannedAction[] {
  const text = request.toLowerCase();
  const actions: PlannedAction[] = [];
  const add = (name: ActionName, description: string, needsApproval = false) => actions.push({ id: `action_${actions.length + 1}`, name, description, needsApproval });
  if (text.includes("webinar")) add("webinar.create_event", "Create a webinar draft");
  if (text.includes("page") || text.includes("landing")) add("website.create_page_draft", "Create a landing-page draft from an approved template");
  if (text.includes("lead") || text.includes("audience") || text.includes("campaign")) {
    add("crm.find_or_create_leads", "Build a consent-aware CRM audience");
    add("marketing.create_campaign_draft", "Create campaign copy and a delivery draft");
  }
  if (text.includes("send") || text.includes("publish")) add("marketing.send_campaign", "Send the customer-facing campaign", true);
  if (text.includes("report") || text.includes("funnel") || text.includes("analytics")) add("analytics.get_funnel_report", "Return current funnel metrics");
  return actions.length ? actions : [{ id: "action_1", name: "analytics.get_funnel_report", description: "Clarify the request with a current business summary", needsApproval: false }];
}

async function crmOnline() {
  try {
    const response = await fetch("http://127.0.0.1:8000", { signal: AbortSignal.timeout(1_500) });
    return response.ok || response.status < 500;
  } catch { return false; }
}

const ctaPattern = /\b(shop now|learn more|order now|sign up|book now|download|apply now|get offer|send message|watch more|contact us)\b/i;

function adCopyParts(value: string) {
  const lines = value.split(/\r?\n|\s{2,}/).map((line) => line.trim()).filter(Boolean);
  const ctaIndex = lines.findIndex((line) => ctaPattern.test(line));
  const cta = ctaIndex >= 0 ? lines[ctaIndex].match(ctaPattern)?.[0] || "Not captured" : "Not captured";
  const headlineIndex = lines.length > 1 ? [...lines.keys()].reverse().find((index) => index !== ctaIndex && lines[index].length <= 120) : undefined;
  const headline = headlineIndex === undefined ? "Not captured" : lines[headlineIndex];
  const bodyText = lines.filter((_, index) => index !== ctaIndex && index !== headlineIndex).join(" ") || (headline === "Not captured" ? value.trim() : "Not captured");
  return { bodyText: bodyText.slice(0, 1_500), headline: headline.slice(0, 240), cta };
}

export function createIntegrationApi() {
  const router = Router();
  const analystRoot = resolve(process.cwd(), "..", ".research-tools", "adradar");
  const analystEntry = resolve(analystRoot, "dist", "index.js");
  router.get("/status", async (_req, res) => res.json({
    crm: { url: "http://127.0.0.1:8000", online: await crmOnline() },
    analyst: { ready: existsSync(analystEntry), mode: "Meta Ad Library · dry run" },
    agent: { ready: true, mode: "Approval-gated planner" },
  }));
  router.post("/agent/plan", (req, res) => {
    const input = z.object({ request: z.string().trim().min(3).max(2_000), approvedActionIds: z.array(z.string()).default([]) }).parse(req.body);
    const plan = makePlan(input.request);
    const pending = plan.filter((action) => action.needsApproval && !input.approvedActionIds.includes(action.id));
    const results = plan.filter((action) => !action.needsApproval || input.approvedActionIds.includes(action.id)).map((action) => ({ actionId: action.id, status: "completed", message: `Prepared ${action.name}: ${action.description}` }));
    res.json({ request: input.request, plan, status: pending.length ? "awaiting_approval" : "completed", results: pending.length ? [] : results });
  });
  router.get("/analyst/scan-stream", async (req, res) => {
    const input = z.object({ pageId: z.string().trim().regex(/^\d{5,30}$/, "Enter a numeric Meta page ID."), country: z.string().regex(/^(?:[A-Z]{2}|ALL)$/).default("ALL"), ourPositioning: z.string().trim().max(1500).default("") }).parse(req.query);
    if (!existsSync(analystEntry)) { res.status(503).json({ error: "AdRadar has not been built yet. Run npm run build in .research-tools/adradar." }); return; }
    res.status(200).set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.flushHeaders();
    const send = (event: string, payload: unknown) => { if (!res.writableEnded && !res.destroyed) res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`); };
    const snapshot = resolve(analystRoot, "data", `nexora-${input.pageId}-${input.country}.json`);
    send("progress", { stage: "Starting", detail: "Opening Meta Ad Library" });
    const child = spawn(process.execPath, [analystEntry, "--page-id", input.pageId, "--country", input.country, "--data", snapshot, "--dry-run", "--max-scrolls", "0", "--max-ads", "20", "--timeout", "60000"], { cwd: analystRoot, windowsHide: true });
    let output = "", remainder = "";
    const append = (chunk: Buffer) => {
      const value = chunk.toString(); output = `${output}${value}`.slice(-40_000); remainder += value;
      const lines = remainder.split(/\r?\n/); remainder = lines.pop() || "";
      for (const line of lines) {
        const text = line.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "").trim().replace(/^[›✓]\s*/, "");
        if (/Launching Chromium|Navigating to|No cookie banner|First results|Scroll pass|Hit max scroll cap|Extracting ad cards|Extracted \d+ unique|Scraped .*active ad|Reconciling|Snapshot written/.test(text)) send("progress", { stage: "AdRadar", detail: text });
      }
    };
    child.stdout.on("data", append); child.stderr.on("data", append);
    const timeout = setTimeout(() => child.kill(), 120_000);
    const close = () => { clearTimeout(timeout); if (!res.writableEnded) res.end(); };
    // IncomingMessage emits "close" as soon as a GET request body is complete.
    // Tie cancellation to the client response instead, otherwise every SSE scan is killed immediately.
    res.once("close", () => { if (!res.writableEnded && !child.killed) child.kill(); });
    child.once("error", (error) => { send("failure", { error: error.message }); close(); });
    child.once("close", async (code) => {
      clearTimeout(timeout);
      if (code !== 0) { send("failure", { error: output || "AdRadar could not complete the scan." }); close(); return; }
      try {
        send("progress", { stage: "Organizing", detail: "Keeping the 20 most recent live creatives and preparing their visual cards" });
        const raw = JSON.parse(await readFile(snapshot, "utf8")) as { ads?: Record<string, { adId?: string; pageName?: string; startedRunningOn?: string | null; text?: string | null; active?: boolean; media?: { type: string; url: string; thumbnailUrl?: string }[] }> };
        const ads = Object.values(raw.ads || {}).filter((ad) => ad.active !== false).map((ad) => ({ adId: String(ad.adId || ""), pageName: ad.pageName || "Unknown advertiser", startedRunningOn: ad.startedRunningOn || null, text: ad.text || "", media: ad.media || [], adLibraryUrl: `https://www.facebook.com/ads/library/?id=${encodeURIComponent(String(ad.adId || ""))}`, ...adCopyParts(ad.text || "") })).filter((ad) => ad.adId).sort((a, b) => (b.startedRunningOn || "").localeCompare(a.startedRunningOn || "")).slice(0, 20);
        const age = (ad: typeof ads[number]) => ad.startedRunningOn ? Math.max(0, Math.floor((Date.now() - Date.parse(ad.startedRunningOn)) / 86_400_000)) : null;
        const category = (ad: typeof ads[number]) => {
          const text = ad.text.toLowerCase();
          if (/credit card|cashback|hdfc|card/.test(text)) return "Payments & loyalty";
          if (/₹|\boff\b|deal|free delivery|save/.test(text)) return "Price & offer";
          if (/order now|delivered|delivery|doorstep/.test(text)) return "Convenience";
          if (/pizza|burger|biryani|meal|restaurant|food/.test(text)) return "Food & partner";
          return "Brand & app";
        };
        const categories = Object.entries(ads.reduce<Record<string, number>>((all, ad) => { const key = category(ad); all[key] = (all[key] || 0) + 1; return all; }, {})).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
        const concepts = new Map<string, { text: string; count: number; ads: typeof ads }>();
        for (const ad of ads) { const key = ad.text.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 500) || ad.adId; const item = concepts.get(key) || { text: ad.text, count: 0, ads: [] }; item.count += 1; item.ads.push(ad); concepts.set(key, item); }
        send("progress", { stage: "Saved", detail: "The structured 20-ad inventory is ready for review and on-demand Analytics reporting" });
        send("result", { pageId: input.pageId, country: input.country, ourPositioning: input.ourPositioning, scannedAt: new Date().toISOString(), totalCards: ads.length, uniqueCreativeConcepts: concepts.size, categories, ads, newest: [...ads].sort((a, b) => (b.startedRunningOn || "").localeCompare(a.startedRunningOn || "")).slice(0, 8), longestRunning: [...ads].filter((ad) => age(ad) !== null).sort((a, b) => (age(b) || 0) - (age(a) || 0)).slice(0, 8).map((ad) => ({ ...ad, ageDays: age(ad) })), repeatedConcepts: [...concepts.values()].filter((concept) => concept.count > 1).sort((a, b) => b.count - a.count).slice(0, 6).map((concept) => ({ text: concept.text, count: concept.count, example: concept.ads[0] })) });
      } catch (error) { send("failure", { error: error instanceof Error ? error.message : "The campaign inventory could not be organized." }); }
      close();
    });
  });
  return router;
}
