import { DOMParser } from "jsr:@b-fuze/deno-dom";

export interface PageLink {
  text: string;
  href: string;
}

/** Pure parsing, no network — testable against saved HTML fixtures. */
export function parseLinks(html: string, baseUrl: string): PageLink[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) return [];

  return [...doc.querySelectorAll("a[href]")].map((el) => {
    const raw = el.getAttribute("href") ?? "";
    let href: string;
    try {
      href = new URL(raw, baseUrl).toString();
    } catch {
      href = raw;
    }
    return { text: (el.textContent ?? "").replace(/\s+/g, " ").trim(), href };
  });
}

export async function fetchPageLinks(pageUrl: string): Promise<PageLink[]> {
  const res = await fetch(pageUrl);
  if (!res.ok) throw new Error(`GET ${pageUrl} -> ${res.status}`);
  return parseLinks(await res.text(), pageUrl);
}
