import { getDocument } from "npm:pdfjs-dist@4/legacy/build/pdf.mjs";
import type { TextItem } from "./parse-class-schedule-grid.ts";

/** Returns each page's text items with their x/y position (PDF points,
 * origin bottom-left), which plain text extraction discards. */
export async function extractPdfTextByPage(data: Uint8Array): Promise<TextItem[][]> {
  const doc = await getDocument({ data, disableFontFace: true }).promise;
  const pages: TextItem[][] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    pages.push(
      content.items.map((it) => {
        // deno-lint-ignore no-explicit-any
        const item = it as any;
        return { str: item.str as string, x: item.transform[4], y: item.transform[5] };
      }),
    );
  }

  return pages;
}
