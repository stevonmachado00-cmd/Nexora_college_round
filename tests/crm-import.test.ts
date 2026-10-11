import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseImportedContacts } from "../server/integrations";

test("CRM spreadsheet import maps common columns and skips malformed emails", async () => {
  const fixture = await readFile(new URL("./fixtures/crm-contacts.csv", import.meta.url));
  const result = await parseImportedContacts(fixture, "contacts.csv");

  assert.equal(result.sheetName, "CSV");
  assert.equal(result.contacts.length, 3);
  assert.equal(result.skipped, 1);
  assert.deepEqual(
    result.contacts.map(({ name, email, company, status, source }) => ({ name, email, company, status, source })),
    [
      { name: "Ada Lovelace", email: "ada@example.com", company: "Analytical Engines", status: "Qualified", source: "Webinar" },
      { name: "Grace Hopper", email: "grace@example.com", company: "Compilers Inc", status: "Customer", source: "Referral" },
      { name: "Email Only", email: "email.only@example.com", company: "—", status: "New lead", source: "Campaign" },
    ],
  );
});
