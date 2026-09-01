import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { parseLinks } from "../html-links.ts";
import {
  currentAcademicYearLabel,
  findAcademicYearListingLink,
  findAnnouncementPdfLink,
  findCalendarPdfLink,
  findClassScheduleAnnouncementLink,
  findExamScheduleLink,
  findMenuPdfLink,
  nextAcademicYearLabel,
} from "./giresun-discovery.ts";

async function loadLinks(name: string, baseUrl: string) {
  const url = new URL(`../../../../fixtures/html/${name}`, import.meta.url);
  const html = await Deno.readTextFile(url);
  return parseLinks(html, baseUrl);
}

Deno.test("currentAcademicYearLabel rolls over in September", () => {
  assertEquals(currentAcademicYearLabel(new Date(Date.UTC(2026, 7, 31))), "2025-2026"); // Aug 31
  assertEquals(currentAcademicYearLabel(new Date(Date.UTC(2026, 8, 1))), "2026-2027"); // Sep 1
  assertEquals(currentAcademicYearLabel(new Date(Date.UTC(2027, 0, 15))), "2026-2027"); // Jan (still same academic year)
});

Deno.test("nextAcademicYearLabel is always one year ahead of current", () => {
  assertEquals(nextAcademicYearLabel(new Date(Date.UTC(2026, 7, 31))), "2026-2027"); // Aug 31
  assertEquals(nextAcademicYearLabel(new Date(Date.UTC(2026, 8, 1))), "2027-2028"); // Sep 1
});

Deno.test("finds the class schedule announcement link on the department homepage", async () => {
  const links = await loadLinks("dept-home.html", "https://bilgisayar.giresun.edu.tr/");
  const link = findClassScheduleAnnouncementLink(links);
  assertExists(link);
  assertEquals(
    link!.href,
    "https://bilgisayar.giresun.edu.tr/tr/news-detail/2026-2027-egitim-ogretim-yili-guz-yariyili-ders-programi/21848",
  );
});

Deno.test("finds the actual PDF link on the announcement page", async () => {
  const links = await loadLinks(
    "class-schedule-news-detail.html",
    "https://bilgisayar.giresun.edu.tr/tr/news-detail/2026-2027-egitim-ogretim-yili-guz-yariyili-ders-programi/21848",
  );
  const link = findAnnouncementPdfLink(links);
  assertExists(link);
  assertEquals(link!.href.endsWith(".pdf"), true);
  assertEquals(link!.href.includes("course_program"), true);
});

Deno.test("finds an exam schedule link by department hint", async () => {
  // The real faculty page has no Bilgisayar Mühendisliği entry yet (see
  // documentSources notes) — this exercises the "not found" path other
  // departments' links do exist for, confirming the matcher itself works.
  const links = [
    { text: "İnşaat Mühendisliği", href: "https://example.com/insaat.pdf" },
    { text: "Bilgisayar Mühendisliği", href: "https://example.com/bilgisayar.pdf" },
  ];
  assertEquals(findExamScheduleLink(links, "Bilgisayar")?.href, "https://example.com/bilgisayar.pdf");
  assertEquals(findExamScheduleLink(links, "Elektrik"), undefined);
});

Deno.test("finds the current academic year's listing link on the oidb homepage", async () => {
  const links = await loadLinks("oidb-home.html", "https://oidb.giresun.edu.tr/");
  const link = findAcademicYearListingLink(links, "2026-2027");
  assertExists(link);
  assertEquals(link!.href, "https://oidb.giresun.edu.tr/tr/page/2026-2027-akademik-takvimler/9653");
});

Deno.test("does not match a different academic year's listing link", async () => {
  const links = await loadLinks("oidb-home.html", "https://oidb.giresun.edu.tr/");
  const link = findAcademicYearListingLink(links, "2030-2031");
  assertEquals(link, undefined);
});

Deno.test("finds the general calendar PDF on the 2026-2027 listing page", async () => {
  const links = await loadLinks(
    "oidb-calendar-2026-2027.html",
    "https://oidb.giresun.edu.tr/tr/page/2026-2027-akademik-takvimler/9653",
  );
  const link = findCalendarPdfLink(links);
  assertExists(link);
  assertEquals(link!.href.endsWith(".pdf"), true);
  assertEquals(link!.href.includes("2026-2027"), true);
  assertEquals(link!.text.includes("Ön Lisans ve Lisans"), true);
});

Deno.test("finds the general calendar PDF on the 2025-2026 listing page despite different phrasing", async () => {
  // 2025-2026 calls it "Genel Akademik Takvim" instead of "Ön Lisans ve
  // Lisans Akademik Takvimi" — this is exactly the case
  // findCalendarPdfLink's keyword-exclusion approach exists for.
  const links = await loadLinks(
    "oidb-calendar-2025-2026.html",
    "https://oidb.giresun.edu.tr/tr/page/2025-2026-akademik-takvimler/6258",
  );
  const link = findCalendarPdfLink(links);
  assertExists(link);
  assertEquals(link!.href.endsWith(".pdf"), true);
  assertEquals(link!.text, "2025-2026 Genel Akademik Takvim");
});

Deno.test("finds the current month's menu PDF, preferring the year-qualified link", async () => {
  const links = await loadLinks("menu-listing.html", "https://sksdb.giresun.edu.tr/tr/page/yemek-menusu/4175");
  const link = findMenuPdfLink(links, new Date(Date.UTC(2026, 8, 15))); // September 2026
  assertExists(link);
  assertEquals(link!.text, "Eylül 2026 Yemek Menüsü");
  assertEquals(link!.href.includes("EYL"), true);
});

Deno.test("returns undefined when the target month isn't published", async () => {
  const links = await loadLinks("menu-listing.html", "https://sksdb.giresun.edu.tr/tr/page/yemek-menusu/4175");
  const link = findMenuPdfLink(links, new Date(Date.UTC(2027, 0, 1))); // January 2027, not in this fixture
  assertEquals(link, undefined);
});
