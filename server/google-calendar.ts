import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { Router } from "express";

const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const TOKEN_PATH = resolve(".nexus-data/google-calendar-token.enc");
const STATE_COOKIE = "nexora_google_oauth_state";
const stateLifetimeMs = 10 * 60 * 1000;
const pendingStates = new Map<string, number>();

type StoredTokens = { refresh_token: string; connectedAt: string };
export type CalendarWebinar = { id: string; title: string; description: string; startsAt: string; timezone: string; durationMinutes: number; host: string };
export type CalendarMeeting = { calendarEventId: string; meetingUrl: string };
export type WebinarCalendarProvider = {
  isConnected(): Promise<boolean>;
  createMeeting(webinar: CalendarWebinar): Promise<CalendarMeeting>;
  inviteAttendee(calendarEventId: string, email: string): Promise<void>;
  deleteMeeting(calendarEventId: string): Promise<void>;
};

function config() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, WEBINAR_TOKEN_ENCRYPTION_KEY } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI || !WEBINAR_TOKEN_ENCRYPTION_KEY) return null;
  if (!/^[a-f\d]{64}$/i.test(WEBINAR_TOKEN_ENCRYPTION_KEY)) throw new Error("WEBINAR_TOKEN_ENCRYPTION_KEY must be a 64-character hexadecimal key.");
  const callback = new URL(GOOGLE_REDIRECT_URI);
  if (callback.protocol !== "https:" && callback.hostname !== "localhost") throw new Error("GOOGLE_REDIRECT_URI must use HTTPS (HTTP is allowed only for localhost development).");
  return { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET, redirectUri: GOOGLE_REDIRECT_URI, key: Buffer.from(WEBINAR_TOKEN_ENCRYPTION_KEY, "hex"), secureCookie: callback.protocol === "https:" };
}

function cookieValue(header: string | undefined, name: string) {
  return header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function clearStateCookie(secure: boolean) {
  return `${STATE_COOKIE}=; Path=/api/webinars/google; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

async function readTokens(key: Buffer): Promise<StoredTokens | null> {
  try {
    const [ivText, tagText, encrypted] = (await readFile(TOKEN_PATH, "utf8")).split(".");
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64url"));
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8")) as StoredTokens;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error("Saved Google Calendar connection could not be decrypted. Check WEBINAR_TOKEN_ENCRYPTION_KEY; saved credentials were not changed.");
  }
}

async function writeTokens(key: Buffer, tokens: StoredTokens) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(tokens), "utf8"), cipher.final()]);
  const value = `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
  await mkdir(dirname(TOKEN_PATH), { recursive: true });
  const temporary = `${TOKEN_PATH}.tmp`;
  await writeFile(temporary, value, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, TOKEN_PATH);
}

async function accessToken() {
  const cfg = config();
  if (!cfg) throw new Error("Google Calendar is not configured on the server.");
  const saved = await readTokens(cfg.key);
  if (!saved) throw new Error("Connect Google Calendar before publishing a Meet webinar.");
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, refresh_token: saved.refresh_token, grant_type: "refresh_token" }) });
  const tokens = await response.json() as { access_token?: string; refresh_token?: string; error?: string; error_description?: string };
  if (!response.ok || !tokens.access_token) {
    if (tokens.error === "invalid_grant") throw new Error("Google Calendar authorization expired or was revoked. Disconnect and reconnect the organizer account.");
    throw new Error(tokens.error_description || tokens.error || "Google Calendar could not refresh its authorization.");
  }
  if (tokens.refresh_token) await writeTokens(cfg.key, { ...saved, refresh_token: tokens.refresh_token });
  return tokens.access_token;
}

async function calendarRequest(path: string, init: RequestInit = {}) {
  const token = await accessToken();
  const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  const data = await response.json().catch(() => ({})) as { error?: { message?: string }; id?: string; conferenceData?: { createRequest?: { status?: { statusCode?: string } }; entryPoints?: Array<{ entryPointType?: string; uri?: string }> }; hangoutLink?: string; attendees?: Array<{ email: string }> };
  if (!response.ok) {
    const message = data.error?.message || `Google Calendar request failed (${response.status}).`;
    const error = new Error(message.slice(0, 400));
    Object.assign(error, { status: response.status });
    throw error;
  }
  return data;
}

async function createMeet(webinar: CalendarWebinar): Promise<CalendarMeeting> {
  // A deterministic Calendar event ID makes a retry safe if Google created the
  // event but the local process stopped before it saved the response.
  const eventId = createHash("sha256").update(`nexora-webinar:${webinar.id}`).digest("hex").slice(0, 40);
  const startsAt = new Date(webinar.startsAt);
  const endsAt = new Date(startsAt.getTime() + webinar.durationMinutes * 60_000);
  const payload = {
    id: eventId,
    summary: webinar.title,
    description: `${webinar.description}\n\nHosted by ${webinar.host}`,
    start: { dateTime: startsAt.toISOString(), timeZone: webinar.timezone },
    end: { dateTime: endsAt.toISOString(), timeZone: webinar.timezone },
    conferenceData: { createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } },
  };
  try {
    await calendarRequest("/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all", { method: "POST", body: JSON.stringify(payload) });
  } catch (error) {
    if (!(error instanceof Error) || (error as Error & { status?: number }).status !== 409) throw error;
    // The deterministic event already exists from a prior publish attempt.
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const event = await calendarRequest(`/calendars/primary/events/${eventId}?conferenceDataVersion=1`);
    const meetingUrl = event.conferenceData?.entryPoints?.find((point) => point.entryPointType === "video")?.uri || event.hangoutLink;
    if (event.conferenceData?.createRequest?.status?.statusCode === "failure") throw new Error("Google Calendar could not generate a Meet link for this event.");
    if (meetingUrl && event.id) return { calendarEventId: event.id, meetingUrl };
    await delay(750);
  }
  throw new Error("Google Calendar created the event, but the Meet link is still being prepared. Try publishing again in a few seconds.");
}

async function inviteToEvent(calendarEventId: string, email: string) {
  const event = await calendarRequest(`/calendars/primary/events/${encodeURIComponent(calendarEventId)}?conferenceDataVersion=1`);
  const attendees = event.attendees || [];
  if (attendees.some((attendee) => attendee.email.toLowerCase() === email.toLowerCase())) return;
  attendees.push({ email });
  await calendarRequest(`/calendars/primary/events/${encodeURIComponent(calendarEventId)}?conferenceDataVersion=1&sendUpdates=all`, { method: "PATCH", body: JSON.stringify({ attendees }) });
}

async function deleteMeeting(calendarEventId: string) {
  try {
    await calendarRequest(`/calendars/primary/events/${encodeURIComponent(calendarEventId)}?sendUpdates=all`, { method: "DELETE" });
  } catch (error) {
    if (!(error instanceof Error) || (error as Error & { status?: number }).status !== 404) throw error;
  }
}

export const googleCalendarProvider: WebinarCalendarProvider = {
  async isConnected() {
    const cfg = config();
    return cfg ? Boolean(await readTokens(cfg.key)) : false;
  },
  createMeeting: createMeet,
  inviteAttendee: inviteToEvent,
  deleteMeeting,
};

export function createGoogleCalendarApi() {
  const api = Router();
  api.get("/status", async (_req, res, next) => {
    try {
      const cfg = config();
      res.json({ configured: Boolean(cfg), connected: cfg ? Boolean(await readTokens(cfg.key)) : false });
    } catch (error) { next(error); }
  });

  api.get("/connect", (_req, res, next) => {
    try {
      const cfg = config();
      if (!cfg) { res.status(503).json({ error: "Google Calendar is not configured yet. Add the OAuth client and token-encryption settings to the server environment." }); return; }
      const now = Date.now();
      for (const [state, expiry] of pendingStates) if (expiry <= now) pendingStates.delete(state);
      const state = randomBytes(32).toString("base64url");
      pendingStates.set(state, now + stateLifetimeMs);
      res.setHeader("Set-Cookie", `${STATE_COOKIE}=${state}; Path=/api/webinars/google; HttpOnly; SameSite=Lax; Max-Age=600${cfg.secureCookie ? "; Secure" : ""}`);
      const authorization = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authorization.search = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: cfg.redirectUri, response_type: "code", scope: SCOPE, access_type: "offline", prompt: "consent", include_granted_scopes: "true", state }).toString();
      res.redirect(302, authorization.toString());
    } catch (error) { next(error); }
  });

  api.get("/callback", async (req, res, next) => {
    let cfg: ReturnType<typeof config>;
    try { cfg = config(); }
    catch (error) { next(error); return; }
    if (!cfg) { res.status(503).send("Google Calendar is not configured."); return; }
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const cookie = cookieValue(req.headers.cookie, STATE_COOKIE);
    const expiry = pendingStates.get(state);
    pendingStates.delete(state);
    res.setHeader("Set-Cookie", clearStateCookie(cfg.secureCookie));
    if (!state || state !== cookie || !expiry || expiry < Date.now()) { res.status(400).send("Google authorization expired or could not be verified. Return to Nexora and try again."); return; }
    if (req.query.error) { res.redirect(302, "/#webinars?google_calendar=cancelled"); return; }
    if (typeof req.query.code !== "string") { res.status(400).send("Google did not return an authorization code."); return; }
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code: req.query.code, client_id: cfg.clientId, client_secret: cfg.clientSecret, redirect_uri: cfg.redirectUri, grant_type: "authorization_code" }) });
      const result = await response.json() as { refresh_token?: string; error_description?: string; error?: string };
      if (!response.ok || !result.refresh_token) throw new Error(result.error_description || result.error || "Google did not return a refresh token. Reconnect and approve offline access.");
      await writeTokens(cfg.key, { refresh_token: result.refresh_token, connectedAt: new Date().toISOString() });
      res.redirect(302, "/#webinars");
    } catch (error) { next(error); }
  });

  api.post("/disconnect", async (req, res, next) => {
    try {
      const origin = req.get("origin");
      if (!origin || origin !== `${req.protocol}://${req.get("host")}`) { res.status(403).json({ error: "Request origin could not be verified." }); return; }
      const cfg = config();
      if (!cfg) { res.status(503).json({ error: "Google Calendar is not configured." }); return; }
      await unlink(TOKEN_PATH).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
      res.json({ connected: false });
    } catch (error) { next(error); }
  });
  return api;
}
