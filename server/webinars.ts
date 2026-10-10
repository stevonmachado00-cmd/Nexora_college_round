import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Router } from "express";
import { z } from "zod";
import { transaction } from "./storage";

const text = z.string().trim().min(1).max(3000);
const WebinarInput = z.object({
  title: text.max(160),
  description: text,
  startsAt: z.string().datetime({ offset: true }),
  timezone: z.string().min(1).max(80),
  durationMinutes: z.number().int().min(5).max(720),
  host: text.max(160),
  capacity: z.number().int().min(1).max(100000).nullable(),
  meetingUrl: z.string().url().max(2048).or(z.literal("")),
});
const RegistrationInput = z.object({
  name: text.max(160),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(160).default(""),
  consent: z.literal(true, { error: "Please consent to event updates." }),
  source: z.string().trim().max(100).default("website"),
  utmSource: z.string().trim().max(160).default(""),
  utmCampaign: z.string().trim().max(160).default(""),
});
const AttendanceRows = z.array(z.object({
  email: z.string().trim().email().max(254),
  minutesAttended: z.number().int().min(0).max(720),
})).min(1).max(10000);

type Webinar = z.infer<typeof WebinarInput> & {
  id: string;
  slug: string;
  status: "draft" | "published" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};
type Registration = {
  id: string;
  webinarId: string;
  contactId: string;
  name: string;
  email: string;
  company: string;
  status: "registered" | "attended" | "partial" | "no_show";
  consent: true;
  source: string;
  utmSource: string;
  utmCampaign: string;
  minutesAttended: number;
  registeredAt: string;
};
type Contact = { id: string; email: string; name: string; company: string; lifecycle: "lead"; createdAt: string; updatedAt: string };
type FollowUp = { id: string; webinarId: string; segment: "attended" | "no_show"; audienceCount: number; status: "draft"; createdAt: string };
type Data = { webinars: Webinar[]; contacts: Contact[]; registrations: Registration[]; followUps: FollowUp[] };

const WebinarSchema = WebinarInput.extend({
  id: z.uuid(), slug: z.string().min(1),
  status: z.enum(["draft", "published", "completed", "cancelled"]),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
});
const DataSchema = z.object({
  webinars: z.array(WebinarSchema),
  contacts: z.array(z.object({ id: z.uuid(), email: z.string().email(), name: text.max(160), company: z.string(), lifecycle: z.literal("lead"), createdAt: z.string().datetime(), updatedAt: z.string().datetime() })),
  registrations: z.array(z.object({
    id: z.uuid(), webinarId: z.uuid(), contactId: z.uuid(), name: text.max(160),
    email: z.string().email(), company: z.string(), status: z.enum(["registered", "attended", "partial", "no_show"]),
    consent: z.literal(true), source: z.string(), utmSource: z.string(), utmCampaign: z.string(),
    minutesAttended: z.number().int(), registeredAt: z.string().datetime(),
  })),
  followUps: z.array(z.object({ id: z.uuid(), webinarId: z.uuid(), segment: z.enum(["attended", "no_show"]), audienceCount: z.number().int(), status: z.literal("draft"), createdAt: z.string().datetime() })),
});

export class JsonWebinarRepository {
  constructor(private readonly path = resolve(".nexus-data/webinars.json")) {}
  async read(): Promise<Data> {
    try { return DataSchema.parse(JSON.parse(await readFile(this.path, "utf8"))); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { webinars: [], contacts: [], registrations: [], followUps: [] };
      throw new Error("Webinar storage could not be read. Existing records have not been overwritten.");
    }
  }
  async write(data: Data) {
    const parsed = DataSchema.parse(data);
    await mkdir(dirname(this.path), { recursive: true });
    const temporary = `${this.path}.tmp`;
    await writeFile(temporary, JSON.stringify(parsed, null, 2), "utf8");
    await rename(temporary, this.path);
  }
}

const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "webinar";
const withCounts = (data: Data, webinar: Webinar) => {
  const registrations = data.registrations.filter((row) => row.webinarId === webinar.id);
  return { ...webinar, registrationCount: registrations.length, attendedCount: registrations.filter((row) => row.status === "attended" || row.status === "partial").length };
};

export function createWebinarApi(repository = new JsonWebinarRepository()) {
  const api = Router();
  const registrationRate = new Map<string, { count: number; until: number }>();
  api.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

  api.get("/", async (_req, res, next) => {
    try { const data = await repository.read(); res.json(data.webinars.map((item) => withCounts(data, item))); }
    catch (error) { next(error); }
  });
  api.post("/", async (req, res, next) => {
    try {
      const input = WebinarInput.parse(req.body);
      const result = await transaction(async () => {
        const data = await repository.read();
        const base = slugify(input.title);
        let slug = base, suffix = 2;
        while (data.webinars.some((item) => item.slug === slug)) slug = `${base}-${suffix++}`;
        const now = new Date().toISOString();
        const webinar: Webinar = { ...input, id: randomUUID(), slug, status: "draft", createdAt: now, updatedAt: now };
        data.webinars.push(webinar); await repository.write(data); return withCounts(data, webinar);
      });
      res.status(201).json(result);
    } catch (error) { next(error); }
  });
  api.get("/contacts", async (_req, res, next) => {
    try { res.json((await repository.read()).contacts); }
    catch (error) { next(error); }
  });
  api.get("/:id", async (req, res, next) => {
    try {
        const data = await repository.read();
      const webinar = data.webinars.find((item) => item.id === req.params.id);
      if (!webinar) { res.status(404).json({ error: "Webinar not found." }); return; }
      res.json({ ...withCounts(data, webinar), registrations: data.registrations.filter((row) => row.webinarId === webinar.id), followUps: data.followUps.filter((item) => item.webinarId === webinar.id) });
    } catch (error) { next(error); }
  });
  api.put("/:id", async (req, res, next) => {
    try {
      const input = WebinarInput.parse(req.body);
      const result = await transaction(async () => {
        const data = await repository.read(), index = data.webinars.findIndex((item) => item.id === req.params.id);
        if (index < 0) throw new Error("Webinar not found.");
        if (data.webinars[index].status !== "draft") throw new Error("Only draft webinars can be edited.");
        const old = data.webinars[index];
        const nextItem = { ...old, ...input, updatedAt: new Date().toISOString() };
        data.webinars[index] = nextItem; await repository.write(data); return withCounts(data, nextItem);
      });
      res.json(result);
    } catch (error) { next(error); }
  });
  api.post("/:id/publish", async (req, res, next) => {
    try {
      const result = await transaction(async () => {
        const data = await repository.read(), item = data.webinars.find((row) => row.id === req.params.id);
        if (!item) throw new Error("Webinar not found.");
        if (item.status !== "draft") throw new Error("Only draft webinars can be published.");
        item.status = "published"; item.updatedAt = new Date().toISOString(); await repository.write(data); return withCounts(data, item);
      });
      res.json(result);
    } catch (error) { next(error); }
  });
  api.get("/public/:slug", async (req, res, next) => {
    try {
      const data = await repository.read(), item = data.webinars.find((row) => row.slug === req.params.slug && row.status === "published");
      if (!item) { res.status(404).json({ error: "This event is not available." }); return; }
      const { meetingUrl: _meetingUrl, ...publicEvent } = withCounts(data, item);
      res.json(publicEvent);
    } catch (error) { next(error); }
  });
  api.post("/:id/registrations", async (req, res, next) => {
    try {
      const now = Date.now(), key = req.ip || "unknown";
      if (registrationRate.size > 1000) registrationRate.clear();
      let bucket = registrationRate.get(key);
      if (!bucket || bucket.until < now) { bucket = { count: 0, until: now + 60_000 }; registrationRate.set(key, bucket); }
      if (++bucket.count > 12) { res.status(429).json({ error: "Too many registration attempts. Please try again in a minute." }); return; }
      const input = RegistrationInput.parse(req.body);
      const result = await transaction(async () => {
        const data = await repository.read(), webinar = data.webinars.find((row) => row.id === req.params.id && row.status === "published");
        if (!webinar) throw new Error("This webinar is not accepting registrations.");
        const email = input.email.toLowerCase();
        const existing = data.registrations.find((row) => row.webinarId === webinar.id && row.email === email);
        if (existing) return { registration: existing, duplicate: true };
        const count = data.registrations.filter((row) => row.webinarId === webinar.id).length;
        if (webinar.capacity !== null && count >= webinar.capacity) throw new Error("This webinar has reached capacity.");
        // CRM contacts are canonical within this prototype store and can be reused across events.
        let contact = data.contacts.find((row) => row.email === email);
        if (!contact) {
          const now = new Date().toISOString();
          contact = { id: randomUUID(), email, name: input.name, company: input.company, lifecycle: "lead", createdAt: now, updatedAt: now };
          data.contacts.push(contact);
        } else {
          contact.name = input.name; contact.company = input.company || contact.company; contact.updatedAt = new Date().toISOString();
        }
        const contactId = contact.id;
        const registration: Registration = { id: randomUUID(), webinarId: webinar.id, contactId, name: input.name, email, company: input.company, status: "registered", consent: true, source: input.source, utmSource: input.utmSource, utmCampaign: input.utmCampaign, minutesAttended: 0, registeredAt: new Date().toISOString() };
        data.registrations.push(registration); await repository.write(data); return { registration, duplicate: false };
      });
      res.status(result.duplicate ? 200 : 201).json(result);
    } catch (error) { next(error); }
  });
  api.get("/:id/registrations", async (req, res, next) => {
    try { const data = await repository.read(); res.json(data.registrations.filter((row) => row.webinarId === req.params.id)); }
    catch (error) { next(error); }
  });
  api.post("/:id/attendance/import", async (req, res, next) => {
    try {
      const rows = AttendanceRows.parse(req.body.rows);
      const result = await transaction(async () => {
        const data = await repository.read(), webinar = data.webinars.find((row) => row.id === req.params.id);
        if (!webinar) throw new Error("Webinar not found.");
        let matched = 0;
        for (const row of rows) {
          const registration = data.registrations.find((item) => item.webinarId === webinar.id && item.email === row.email.toLowerCase());
          if (!registration) continue;
          matched++; registration.minutesAttended = row.minutesAttended;
          registration.status = row.minutesAttended === 0 ? "no_show" : row.minutesAttended >= webinar.durationMinutes * 0.75 ? "attended" : "partial";
        }
        await repository.write(data); return { imported: rows.length, matched, unmatched: rows.length - matched };
      });
      res.json(result);
    } catch (error) { next(error); }
  });
  api.post("/:id/follow-ups/draft", async (req, res, next) => {
    try {
      const segment = z.enum(["attended", "no_show"]).parse(req.body.segment);
      const result = await transaction(async () => {
        const data = await repository.read(), webinar = data.webinars.find((row) => row.id === req.params.id);
        if (!webinar) throw new Error("Webinar not found.");
        const audienceCount = data.registrations.filter((row) => row.webinarId === webinar.id && (segment === "attended" ? row.status === "attended" || row.status === "partial" : row.status === "no_show") && row.consent).length;
        const followUp: FollowUp = { id: randomUUID(), webinarId: webinar.id, segment, audienceCount, status: "draft", createdAt: new Date().toISOString() };
        data.followUps.push(followUp); await repository.write(data); return followUp;
      });
      res.status(201).json(result);
    } catch (error) { next(error); }
  });
  return api;
}
