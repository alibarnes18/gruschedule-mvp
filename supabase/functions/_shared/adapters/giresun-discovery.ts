// Resolves each document type's *current* PDF URL by scraping the actual
// listing/announcement pages (see documentSources in giresun.ts for why —
// none of these live at a fixed URL). Split into pure link-picking
// functions (unit tested against saved HTML in fixtures/html/) and thin
// async wrappers that do the actual fetching, so check-for-updates can be
// verified without hitting the live site on every test run.

import { fetchPageLinks, type PageLink } from "../html-links.ts";

const TR_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

/** Turkish academic years nominally start in September, but in practice
 * the university publishes next year's calendar well before the
 * rollover (seen: both years' listing pages already live on August 31)
 * — resolveAcademicCalendarUrl tries this label first and falls back to
 * currentAcademicYearLabel, rather than trusting the calendar date alone. */
export function nextAcademicYearLabel(now: Date): string {
  const [startYear] = currentAcademicYearLabel(now).split("-").map(Number);
  return `${startYear + 1}-${startYear + 2}`;
}

/** Turkish academic years start in September. */
export function currentAcademicYearLabel(now: Date): string {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-12
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

export function findClassScheduleAnnouncementLink(links: PageLink[]): PageLink | undefined {
  return links.find((l) => l.text.includes("Ders Programı") && l.href.includes("news-detail"));
}

export function findAnnouncementPdfLink(links: PageLink[]): PageLink | undefined {
  return links.find((l) => l.text.includes("tıklayınız") && l.href.toLowerCase().endsWith(".pdf"));
}

export function findExamScheduleLink(links: PageLink[], departmentHint: string): PageLink | undefined {
  return links.find((l) => l.text.includes(departmentHint) && l.href.toLowerCase().endsWith(".pdf"));
}

export function findAcademicYearListingLink(links: PageLink[], yearLabel: string): PageLink | undefined {
  return links.find((l) => l.text.includes(yearLabel) && l.text.includes("Akademik Takvim"));
}

// The general (Ön Lisans ve Lisans) calendar's link text isn't
// consistently phrased across years — seen: "2026-2027 Ön Lisans ve
// Lisans Akademik Takvimi" and "2025-2026 Genel Akademik Takvim". Rather
// than chase every phrasing, pick the first calendar PDF link that
// *isn't* one of the other named programs (each listing page always has
// exactly one non-specialized entry, listed first in every year seen so
// far).
const SPECIALIZED_CALENDAR_KEYWORDS = [
  "Lisansüstü",
  "Tıp",
  "Diş Hekimliği",
  "İlahiyat",
  "Yabancı Diller",
  "Konservatuvar",
];

export function findCalendarPdfLink(links: PageLink[]): PageLink | undefined {
  return links.find((l) =>
    l.href.toLowerCase().endsWith(".pdf") &&
    l.text.includes("Akademik Takvim") &&
    !SPECIALIZED_CALENDAR_KEYWORDS.some((kw) => l.text.includes(kw))
  );
}

/** Menu link text isn't consistently templated (seen: "Eylül Ayı Yemek
 * Menüsü" in the nav, "Eylül 2026 Yemek Menüsü" in the body, filenames
 * like "NİSAN 2026 1 - Copy 1.pdf") — match on month name, prefer a
 * candidate that also has the year, and prefer the last match (the body
 * link tends to come after nav duplicates). */
export function findMenuPdfLink(links: PageLink[], now: Date): PageLink | undefined {
  const monthName = TR_MONTHS[now.getUTCMonth()].toLocaleUpperCase("tr");
  const year = String(now.getUTCFullYear());

  const monthMatches = links.filter((l) =>
    l.href.toLowerCase().endsWith(".pdf") && l.text.toLocaleUpperCase("tr").includes(monthName)
  );
  if (monthMatches.length === 0) return undefined;

  const withYear = monthMatches.filter((l) => l.text.includes(year));
  return (withYear.length > 0 ? withYear : monthMatches).at(-1);
}

export async function resolveClassScheduleUrl(): Promise<string> {
  const homeLinks = await fetchPageLinks("https://bilgisayar.giresun.edu.tr/");
  const announcement = findClassScheduleAnnouncementLink(homeLinks);
  if (!announcement) throw new Error("Ders Programı announcement link not found on department homepage");

  const announcementLinks = await fetchPageLinks(announcement.href);
  const pdf = findAnnouncementPdfLink(announcementLinks);
  if (!pdf) throw new Error(`PDF link not found on announcement page ${announcement.href}`);
  return pdf.href;
}

/** null means "not published yet" — a normal, expected state before vize/final dönemi. */
export async function resolveExamScheduleUrl(departmentHint: string): Promise<string | null> {
  const links = await fetchPageLinks("https://muhendislik.giresun.edu.tr/tr/page/sinav-programlari/4778");
  return findExamScheduleLink(links, departmentHint)?.href ?? null;
}

export async function resolveAcademicCalendarUrl(now: Date = new Date()): Promise<string> {
  const homeLinks = await fetchPageLinks("https://oidb.giresun.edu.tr/");

  // Prefer next academic year's calendar if it's already published (the
  // university tends to publish ahead of the September rollover), else
  // fall back to the nominally-current one.
  const candidateLabels = [nextAcademicYearLabel(now), currentAcademicYearLabel(now)];
  const listing = candidateLabels
    .map((label) => findAcademicYearListingLink(homeLinks, label))
    .find((link) => link !== undefined);
  if (!listing) {
    throw new Error(`no Akademik Takvim listing link for ${candidateLabels.join(" or ")} on oidb homepage`);
  }

  const listingLinks = await fetchPageLinks(listing.href);
  const pdf = findCalendarPdfLink(listingLinks);
  if (!pdf) throw new Error(`general Akademik Takvim PDF not found on ${listing.href}`);
  return pdf.href;
}

export async function resolveMenuUrl(now: Date = new Date()): Promise<string> {
  const links = await fetchPageLinks("https://sksdb.giresun.edu.tr/tr/page/yemek-menusu/4175");
  const pdf = findMenuPdfLink(links, now);
  if (!pdf) throw new Error("current month's menu PDF not found on yemek-menusu listing page");
  return pdf.href;
}
