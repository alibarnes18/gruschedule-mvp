import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { extractPdfTextByPage } from "./extract-pdf-text.ts";
import { parseAcademicCalendar } from "./parse-academic-calendar.ts";

const FIXTURE = new URL(
  "../../../fixtures/academic-calendar/2026-2027-onlisans-lisans.pdf",
  import.meta.url,
);
const CONFIG = { dateColumnXMax: 150, descriptionXMin: 150 };

async function parseFixture() {
  const data = await Deno.readFile(FIXTURE);
  const pages = await extractPdfTextByPage(data);
  return parseAcademicCalendar(pages[0], CONFIG);
}

Deno.test("parses every calendar row without dropping any", async () => {
  const events = await parseFixture();
  assertEquals(events.length, 56);
  assertEquals(events.filter((e) => e.flags.length > 0).length, 0);
});

Deno.test("parses a single-date row with no end date", async () => {
  const events = await parseFixture();
  const event = events.find((e) => e.title === "Güz yarıyılı derslerin başlaması");
  assertExists(event);
  assertEquals(event!.startDate, "2026-09-21");
  assertEquals(event!.endDate, null);
});

Deno.test("parses a same-month date range", async () => {
  const events = await parseFixture();
  const event = events.find((e) => e.title === "Ön lisans danışman onayları");
  assertExists(event);
  assertEquals(event!.startDate, "2026-09-11");
  assertEquals(event!.endDate, "2026-09-15");
});

Deno.test("parses a cross-month date range and strips the footnote marker", async () => {
  const events = await parseFixture();
  const event = events.find((e) => e.title === "Güz dönemi ders muafiyet başvuruları");
  assertExists(event);
  assertEquals(event!.startDate, "2026-09-21");
  assertEquals(event!.endDate, "2026-10-02");
});

Deno.test("joins a wrapped two-line description back into one title", async () => {
  const events = await parseFixture();
  const event = events.find((e) => e.startDate === "2026-09-10" && e.endDate === "2026-09-13");
  assertExists(event);
  assertEquals(
    event!.title,
    "Lisans Programları (Fakülte ve Yüksekokullar) için Güz yarıyılı harç ödeme, kayıt yenileme, derse yazılma",
  );
});

Deno.test("does not create an event for the GÜZ/BAHAR YARIYILI divider rows", async () => {
  const events = await parseFixture();
  const dividerAsEvent = events.find((e) => e.title.includes("YARIYILI") && e.title.length < 20);
  assertEquals(dividerAsEvent, undefined);
});
