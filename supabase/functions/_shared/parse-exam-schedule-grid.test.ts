import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { extractPdfTextByPage } from "./extract-pdf-text.ts";
import { parseExamScheduleGrid } from "./parse-exam-schedule-grid.ts";
import { examSources } from "./adapters/giresun.ts";

const FIXTURE = new URL(
  "../../../fixtures/exam-schedule/bilgisayar-muhendisligi-2025-2026-bahar-final.pdf",
  import.meta.url,
);

async function parseFixture() {
  const data = await Deno.readFile(FIXTURE);
  const pages = await extractPdfTextByPage(data);
  return parseExamScheduleGrid(pages, examSources[0].grid);
}

Deno.test("parses every exam across both weeks (pages)", async () => {
  const entries = await parseFixture();
  assertEquals(entries.length, 30);
});

Deno.test("flags only the one exam with no listed instructor", async () => {
  const entries = await parseFixture();
  const flagged = entries.filter((e) => e.flags.length > 0);
  assertEquals(flagged.length, 1);
  assertEquals(flagged[0].courseCode, "BİLM-420");
  assertEquals(flagged[0].flags, ["no_instructor"]);
});

Deno.test("splits a code+name line and reads the day-block's embedded date", async () => {
  const entries = await parseFixture();
  const entry = entries.find((e) => e.courseCode === "BİLM-102");
  assertExists(entry);
  assertEquals(entry!.courseName, "Bilgisayar Programlama - 2");
  assertEquals(entry!.examDate, "2026-06-01"); // Pazartesi (01.06.2026)
  assertEquals(entry!.examTime, "10:00");
  assertEquals(entry!.instructor, "Dr. Öğr. Üyesi Erkan GÜLER");
  assertEquals(entry!.studentCount, "132");
});

Deno.test("joins all rooms for an exam split across multiple rooms", async () => {
  const entries = await parseFixture();
  const entry = entries.find((e) => e.courseCode === "BİLM-108");
  assertExists(entry);
  assertEquals(entry!.location, "D406 / D102 / D303");
});

Deno.test("reads the second week's page with its own dates", async () => {
  const entries = await parseFixture();
  const entry = entries.find((e) => e.courseCode === "BİM-202");
  assertExists(entry);
  assertEquals(entry!.examDate, "2026-06-09"); // Salı (09.06.2026)
  assertEquals(entry!.courseName, "Algoritmalar");
});
