// Giresun Üniversitesi adapter (gruschedule.md section 8): all PDF-format
// knowledge for this university lives here so a second university can be
// added later without touching parse-pdf's logic.
//
// v1 only has the Bilgisayar Mühendisliği ders programı wired up — grid
// geometry was measured against
// fixtures/class-schedule/bilgisayar-muhendisligi-2026-2027-guz.pdf via
// pdfjs-dist text-item coordinates (see parse-class-schedule-grid.ts).
// Column x-boundaries are specific to that PDF's layout; if the
// university changes their template, re-measure and update here.

import type { ClassScheduleGridConfig } from "../parse-class-schedule-grid.ts";
import type { ExamScheduleGridConfig } from "../parse-exam-schedule-grid.ts";
import type { AcademicCalendarConfig } from "../parse-academic-calendar.ts";
import type { MenuGridConfig } from "../parse-menu.ts";

export interface ClassScheduleSource {
  documentType: "class_schedule";
  facultySlug: string;
  departmentSlug: string;
  sourceUrl: string;
  grid: ClassScheduleGridConfig;
}

export interface ExamSource {
  documentType: "exam_schedule";
  examType: "midterm" | "final" | "makeup";
  facultySlug: string;
  departmentSlug: string;
  sourceUrl: string;
  grid: ExamScheduleGridConfig;
}

// University-wide documents — not tied to one faculty/department, so
// parse-pdf writes these without a department_id.
export interface AcademicCalendarSource {
  documentType: "academic_calendar";
  sourceUrl: string;
  config: AcademicCalendarConfig;
}

export interface MenuSource {
  documentType: "menu";
  sourceUrl: string;
  grid: MenuGridConfig;
}

// The university re-exports this PDF from time to time (presumably
// re-generated from the source Excel/Word file) at a *different absolute
// page scale* even though the content and relative layout are identical
// — caught in production on 2026-08-31 when check-for-updates fetched a
// live copy at 2976x4210pt instead of the 595x842pt one this was
// originally measured against (exactly 5x, coordinates below scaled
// accordingly). If entriesWritten/flaggedCount ever looks wildly off
// again, re-measure against a fresh download before assuming it's a
// content problem — same class of issue as the exam schedule's much
// higher-res export (see BILGISAYAR_MUHENDISLIGI_EXAM_GRID below).
const BILGISAYAR_MUHENDISLIGI_GRID: ClassScheduleGridConfig = {
  dayOrder: [1, 2, 3, 4, 5], // Pazartesi..Cuma, top to bottom on the page
  columns: [
    { gradeLevel: 1, xMin: 300, xMax: 925, split: 583.05 },
    { gradeLevel: 2, xMin: 925, xMax: 1560, split: 1202.35 },
    { gradeLevel: 3, xMin: 1560, xMax: 2175, split: 1819.25 },
    { gradeLevel: 4, xMin: 2175, xMax: 2875, split: 2438.6 },
  ],
};

export const classScheduleSources: ClassScheduleSource[] = [
  {
    documentType: "class_schedule",
    facultySlug: "muhendislik",
    departmentSlug: "bilgisayar-muhendisligi",
    // Last verified working 2026-08-31 (curl: 200, application/pdf,
    // 177402 bytes, 2976x4210pt). See documentSources below for how this
    // was found and why it can't just be hardcoded forever.
    sourceUrl:
      "https://bilgisayar.giresun.edu.tr/Files/ckFiles/bilgisayar-giresun-edu-tr/course_program/2026-2027_fall/2026-2027 Güz Bilgisayar Mühendisliği Bölümü Ders Programı__.pdf",
    grid: BILGISAYAR_MUHENDISLIGI_GRID,
  },
];

// Grid geometry for the exam schedule is measured off a much higher-res
// page (2480x3508 pt vs the class schedule's 595x842) — same relative
// template, different absolute scale, so these coordinates are unrelated
// to BILGISAYAR_MUHENDISLIGI_GRID above despite covering the same
// department. Measured against
// fixtures/exam-schedule/bilgisayar-muhendisligi-2025-2026-bahar-final.pdf.
const BILGISAYAR_MUHENDISLIGI_EXAM_GRID: ExamScheduleGridConfig = {
  dateColumnX: { min: 73, max: 83 },
  columns: [
    { gradeLevel: 1, xMin: 150, xMax: 770, split: 457.35 },
    { gradeLevel: 2, xMin: 770, xMax: 1350, split: 1022.7 },
    { gradeLevel: 3, xMin: 1350, xMax: 1920, split: 1624.05 },
    { gradeLevel: 4, xMin: 1920, xMax: 2460, split: 2161.9 },
  ],
};

export const examSources: ExamSource[] = [
  {
    documentType: "exam_schedule",
    examType: "final",
    facultySlug: "muhendislik",
    departmentSlug: "bilgisayar-muhendisligi",
    // User-provided historical reference (2025-2026 bahar final), not
    // sourced from a live URL — see documentSources below, the
    // 2026-2027 güz exam schedule isn't published yet.
    sourceUrl: "PROVIDED_LOCALLY_2025-2026_bahar_final_no_live_url_yet",
    grid: BILGISAYAR_MUHENDISLIGI_EXAM_GRID,
  },
];

export const academicCalendarSources: AcademicCalendarSource[] = [
  {
    documentType: "academic_calendar",
    // Verified live 2026-08-31 (curl: 200, 98852 bytes). Two-column plain
    // table, not a grid — see parse-academic-calendar.ts.
    sourceUrl:
      "https://oidb.giresun.edu.tr/Files/ckFiles/oidb-giresun-edu-tr/akademik takvimler/2026-2027 AKADEMİK TAKVİMLER/2026-2027 Ön Lisans ve Lisans Akademik Takvimi.pdf",
    config: { dateColumnXMax: 150, descriptionXMin: 150 },
  },
];

export const menuSources: MenuSource[] = [
  {
    documentType: "menu",
    // Verified live 2026-08-31 (curl: 200, 125601 bytes) — Eylül (Sept)
    // 2026, the current month's menu at time of writing.
    sourceUrl: "https://sksdb.giresun.edu.tr/Files/ckFiles/sksdb-giresun-edu-tr/EYLÜL 2026 YEMEK MENÜ-1.pdf",
    grid: { columnX: [39.5, 213.3, 358.6, 516.5, 682.1] },
  },
];

// --- Faz 3 prep: where check-for-updates should look ---------------------
//
// None of these documents live at a fixed, permanent PDF URL. The
// university republishes each one under a new URL/filename whenever it
// changes (new semester, new month, new academic year), so
// check-for-updates can't just poll one hardcoded link and hash it — it
// has to re-discover the current link each time by following a small
// chain of listing/announcement pages. This is that chain, plus the
// current PDF each one resolved to when researched on 2026-08-31 (for
// reference/fallback only — expect these to go stale).

export type DocumentType = "class_schedule" | "exam_schedule" | "academic_calendar" | "menu";

export interface DocumentDiscoveryHop {
  /** Page to fetch and scan for the next link. */
  pageUrl: string;
  /** Substring/description to match against link text (or filename, for
   * the final hop) to find the right link on that page. */
  linkTextHint: string;
}

export interface DocumentSource {
  documentType: DocumentType;
  /** null for university-wide documents not tied to one faculty/department. */
  facultySlug: string | null;
  departmentSlug: string | null;
  /** Ordered hops from a stable starting page down to the actual PDF. */
  discovery: DocumentDiscoveryHop[];
  lastVerifiedPdfUrl: string | null;
  lastVerifiedAt: string;
  notes: string;
}

export const documentSources: DocumentSource[] = [
  {
    documentType: "class_schedule",
    facultySlug: "muhendislik",
    departmentSlug: "bilgisayar-muhendisligi",
    discovery: [
      { pageUrl: "https://bilgisayar.giresun.edu.tr/", linkTextHint: "Ders Programı" },
      { pageUrl: "(resolved from previous hop's news-detail link)", linkTextHint: "indirmek için tıklayınız" },
    ],
    lastVerifiedPdfUrl: classScheduleSources[0].sourceUrl,
    lastVerifiedAt: "2026-08-31",
    notes:
      "Published as a haber (news) post on the department homepage, not a fixed URL — " +
      "both the news post's own URL and the PDF path change each semester. Two-hop scrape: " +
      "homepage -> news-detail page -> actual PDF link.",
  },
  {
    documentType: "exam_schedule",
    facultySlug: "muhendislik",
    departmentSlug: "bilgisayar-muhendisligi",
    discovery: [
      {
        pageUrl: "https://muhendislik.giresun.edu.tr/tr/page/sinav-programlari/4778",
        linkTextHint: "Bilgisayar Mühendisliği",
      },
    ],
    lastVerifiedPdfUrl: null,
    lastVerifiedAt: "2026-08-31",
    notes:
      "Not yet published for 2026-2027 güz (link is a dead '#' on the department page). " +
      "The faculty-level page only has stale 2018-2019 ara sınav files, and doesn't even list " +
      "Bilgisayar Mühendisliği — the other departments' files there are a mix of PDF/XLSX/XLS/DOC, " +
      "so parse-pdf will eventually need per-format handling here, not just PDF. Re-check closer " +
      "to vize dönemi (~Kasım).",
  },
  {
    documentType: "academic_calendar",
    facultySlug: null,
    departmentSlug: null,
    discovery: [
      // oidb publishes a fresh listing page per academic year
      // ("2025-2026-akademik-takvimler", "2026-2027-akademik-takvimler",
      // ...) — the year segment itself has to be discovered (e.g. from
      // the current date or by probing oidb's page list), not assumed.
      { pageUrl: "https://oidb.giresun.edu.tr/tr/page/2026-2027-akademik-takvimler/9653", linkTextHint: "Ön Lisans ve Lisans" },
    ],
    lastVerifiedPdfUrl: academicCalendarSources[0].sourceUrl,
    lastVerifiedAt: "2026-08-31",
    notes:
      "University-wide (Öğrenci İşleri Daire Başkanlığı, oidb.giresun.edu.tr), not per-department " +
      "— covers every faculty/department, so store it without a department_id. The 2026-2027 page " +
      "listed 7 calendar variants (Ön Lisans ve Lisans, Lisansüstü, Tıp, Diş Hekimliği, İlahiyat " +
      "hazırlık, Yabancı Diller hazırlık, Devlet Konservatuvarı) — only the first is wired up here; " +
      "the others would need their own DocumentSource entries.",
  },
  {
    documentType: "menu",
    facultySlug: null,
    departmentSlug: null,
    discovery: [
      {
        pageUrl: "https://sksdb.giresun.edu.tr/tr/page/yemek-menusu/4175",
        linkTextHint: "<ay adı> <yıl> YEMEK MENÜ (current month)",
      },
    ],
    lastVerifiedPdfUrl: menuSources[0].sourceUrl,
    lastVerifiedAt: "2026-08-31",
    notes:
      "Published monthly (Sosyal Kültür Spor Daire Başkanlığı), sometimes a bit ahead — both " +
      "Ağustos and Eylül 2026 were already up on 2026-08-31. Filenames aren't consistently " +
      "templated — e.g. 'NİSAN 2026 1 - Copy 1.pdf' — so match on Turkish month name + year " +
      "appearing anywhere in the link text/filename, not an exact pattern.",
  },
];
