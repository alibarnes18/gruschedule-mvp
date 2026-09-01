import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { extractPdfTextByPage } from "./extract-pdf-text.ts";
import { parseClassScheduleGrid } from "./parse-class-schedule-grid.ts";
import { classScheduleSources } from "./adapters/giresun.ts";

const FIXTURE = new URL(
  "../../../fixtures/class-schedule/bilgisayar-muhendisligi-2026-2027-guz.pdf",
  import.meta.url,
);

async function parseFixture() {
  const data = await Deno.readFile(FIXTURE);
  const pages = await extractPdfTextByPage(data);
  const source = classScheduleSources[0];
  return parseClassScheduleGrid(pages[0], source.grid);
}

Deno.test("parses the full grid without dropping cells", async () => {
  const entries = await parseFixture();
  assertEquals(entries.length, 47);
});

Deno.test("flags only the known-ambiguous cells for review", async () => {
  const entries = await parseFixture();
  const flagged = entries.filter((e) => e.flags.length > 0);
  assertEquals(flagged.length, 7);
});

Deno.test("extracts a clean single-line entry correctly", async () => {
  const entries = await parseFixture();
  const entry = entries.find((e) =>
    e.courseCode === "BİLM-103" && e.dayOfWeek === 1 && e.gradeLevel === 1
  );
  assertExists(entry);
  assertEquals(entry!.courseName, "Bilgisayar Mühendisliğine Giriş");
  assertEquals(entry!.instructor, "Dr. Öğr. Üyesi Erkan GÜLER");
  assertEquals(entry!.startTime, "10:00");
  assertEquals(entry!.endTime, "11:00");
  assertEquals(entry!.location, "Harezmi / Amfisi");
  assertEquals(entry!.flags, []);
});

Deno.test("joins a surname that wraps onto its own line", async () => {
  const entries = await parseFixture();
  const entry = entries.find((e) => e.courseCode === "BİLM-213");
  assertExists(entry);
  assertEquals(entry!.instructor, "Doç. Dr. Mustafa Serkan ABDÜSSELAM");
});

Deno.test("reads an explicit HH:MM-HH:MM override instead of defaulting to +1h", async () => {
  const entries = await parseFixture();
  const entry = entries.find((e) => e.courseCode === "BİLM-209");
  assertExists(entry);
  assertEquals(entry!.startTime, "14:00");
  assertEquals(entry!.endTime, "17:00");
});

Deno.test("flags a course with no named instructor instead of guessing one", async () => {
  const entries = await parseFixture();
  const bilm401 = entries.filter((e) => e.courseCode === "BİLM-401");
  assertEquals(bilm401.length, 4); // Pazartesi-Perşembe; not scheduled Cuma in the source PDF
  for (const e of bilm401) {
    assertEquals(e.instructor, null);
    assertEquals(e.flags, ["no_instructor"]);
  }
});
