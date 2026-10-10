import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import { JsonWebinarRepository, createWebinarApi } from "../server/webinars";
import type { WebinarCalendarProvider } from "../server/google-calendar";

test("webinar lifecycle creates an event, registers a CRM contact, records attendance, and drafts follow-up", async () => {
  const directory = await mkdtemp(join(tmpdir(), "nexora-webinars-"));
  const app = express();
  const invited: string[] = [];
  const deletedCalendarEvents: string[] = [];
  const calendar: WebinarCalendarProvider = {
    async isConnected() { return true; },
    async createMeeting(webinar) { return { calendarEventId: `calendar-${webinar.id}`, meetingUrl: "https://meet.google.com/test-room" }; },
    async inviteAttendee(calendarEventId, email) { invited.push(`${calendarEventId}:${email}`); },
    async deleteMeeting(calendarEventId) { deletedCalendarEvents.push(calendarEventId); },
  };
  app.use(express.json());
  app.use("/api/webinars", createWebinarApi(new JsonWebinarRepository(join(directory, "webinars.json")), calendar));
  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(422).json({ error: error.message }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api/webinars`;
  const call = (path: string, method = "GET", data?: unknown) => fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  try {
    const create = await call("/", "POST", {
      title: "Product Growth Webinar",
      description: "A practical session for product teams.",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      timezone: "Asia/Kolkata",
      durationMinutes: 60,
      host: "Nexora team",
      capacity: 10,
      meetingUrl: "",
    });
    assert.equal(create.status, 201);
    const webinar = await create.json() as { id: string; slug: string };
    const secondCreate = await call("/", "POST", {
      title: "Product Growth Webinar",
      description: "A second session for product teams.",
      startsAt: new Date(Date.now() + 172800000).toISOString(),
      timezone: "Asia/Kolkata",
      durationMinutes: 45,
      host: "Nexora team",
      capacity: null,
      meetingUrl: "",
    });
    assert.equal(secondCreate.status, 201);
    const secondWebinar = await secondCreate.json() as { id: string; slug: string };
    assert.notEqual(secondWebinar.slug, webinar.slug);
    assert.equal((await (await call("/")).json() as unknown[]).length, 2, "multiple webinars can coexist");
    const published = await call(`/${webinar.id}/publish`, "POST", {});
    assert.equal(published.status, 200);
    const publishedEvent = await published.json() as { meetingUrl: string; calendarEventId: string };
    assert.equal(publishedEvent.meetingUrl, "https://meet.google.com/test-room");
    assert.equal(publishedEvent.calendarEventId, `calendar-${webinar.id}`);
    const publicResponse = await call(`/public/${webinar.slug}`);
    assert.equal(publicResponse.status, 200);
    const publicEvent = await publicResponse.json() as Record<string, unknown>;
    assert.equal("meetingUrl" in publicEvent, false, "join URL must not be exposed before registration");
    assert.equal("calendarEventId" in publicEvent, false);

    const registrationInput = {
      name: "Priya Shah", email: "PRIYA@example.com", company: "Acme",
      consent: true, source: "website", utmSource: "linkedin", utmCampaign: "product-growth",
    };
    const registered = await call(`/${webinar.id}/registrations`, "POST", registrationInput);
    assert.equal(registered.status, 201);
    const registrationResult = await registered.json() as { registration: { contactId: string }; duplicate: boolean; meetingUrl: string; calendarInviteSent: boolean };
    assert.equal(registrationResult.duplicate, false);
    assert.equal(registrationResult.meetingUrl, "https://meet.google.com/test-room");
    assert.equal(registrationResult.calendarInviteSent, true);
    assert.equal((await call(`/${webinar.id}/registrations`, "POST", registrationInput)).status, 200);
    assert.equal(invited.length, 2, "duplicate registration retries attendee invitation safely");
    const contacts = await (await call("/contacts")).json() as Array<{ id: string; email: string }>;
    assert.equal(contacts.length, 1);
    assert.equal(contacts[0].email, "priya@example.com");
    assert.equal(contacts[0].id, registrationResult.registration.contactId);

    const attendance = await call(`/${webinar.id}/attendance/import`, "POST", {
      rows: [{ email: "priya@example.com", minutesAttended: 50 }],
    });
    assert.deepEqual(await attendance.json(), { imported: 1, matched: 1, unmatched: 0 });
    const draft = await call(`/${webinar.id}/follow-ups/draft`, "POST", { segment: "attended" });
    const followUp = await draft.json() as { id: string; audienceCount: number; status: string; subject: string; body: string };
    assert.equal(followUp.audienceCount, 1);
    assert.equal(followUp.status, "draft");
    assert.match(followUp.subject, /Thanks for joining/);
    assert.match(followUp.body, /\{\{first_name\}\}/);
    const savedFollowUp = await call(`/${webinar.id}/follow-ups/${followUp.id}`, "PUT", { subject: "Thank you for attending", body: "Hi {{first_name}}, thanks for joining us." });
    assert.equal(savedFollowUp.status, 200);
    const detail = await (await call(`/${webinar.id}`)).json() as { followUps: Array<{ subject: string }>; registrations: Array<{ status: string }> };
    assert.equal(detail.registrations[0].status, "attended");
    assert.equal(detail.followUps.length, 1);
    assert.equal(detail.followUps[0].subject, "Thank you for attending");

    const removed = await call(`/${webinar.id}`, "DELETE");
    assert.deepEqual(await removed.json(), { deleted: true });
    assert.deepEqual(deletedCalendarEvents, [`calendar-${webinar.id}`]);
    assert.equal((await call(`/${webinar.id}`)).status, 404);
    const remaining = await (await call("/")).json() as Array<{ id: string }>;
    assert.deepEqual(remaining.map((item) => item.id), [secondWebinar.id]);
    assert.equal((await (await call("/contacts")).json() as unknown[]).length, 1, "deleting an event keeps reusable CRM contacts");
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
