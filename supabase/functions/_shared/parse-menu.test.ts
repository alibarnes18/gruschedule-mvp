import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { extractPdfTextByPage } from "./extract-pdf-text.ts";
import { parseMenu } from "./parse-menu.ts";
import { menuSources } from "./adapters/giresun.ts";

const FIXTURE = new URL("../../../fixtures/menu/eylul-2026.pdf", import.meta.url);

async function parseFixture() {
  const data = await Deno.readFile(FIXTURE);
  const pages = await extractPdfTextByPage(data);
  return parseMenu(pages[0], menuSources[0].grid);
}

Deno.test("parses every day printed in the month", async () => {
  const days = await parseFixture();
  assertEquals(days.length, 22);
});

Deno.test("orders a day's dishes correctly and drops calorie/KKAL noise", async () => {
  const days = await parseFixture();
  const day = days.find((d) => d.date === "2026-09-01");
  assertExists(day);
  assertEquals(day!.items, [
    "Mercimek Çorba",
    "Sulu Köfte",
    "Peynirli Erişte",
    "Muh. Havuç Tatlısı",
  ]);
  assertEquals(day!.flags, []);
});

Deno.test("flags the one day where the printed date and weekday disagree", async () => {
  const days = await parseFixture();
  const flagged = days.filter((d) => d.flags.length > 0);
  assertEquals(flagged.length, 1);
  // The source PDF literally prints "29.09.2025 - Salı" mid-way through
  // an otherwise-2026 month — parsed as printed, not silently corrected.
  assertEquals(flagged[0].date, "2025-09-29");
  assertEquals(flagged[0].flags, ["weekday_mismatch"]);
});

Deno.test("assigns each week's Monday-column day correctly", async () => {
  const days = await parseFixture();
  const day = days.find((d) => d.date === "2026-09-07");
  assertExists(day);
  assertEquals(day!.items[0], "Sebze Çorba");
});
